use std::{path::PathBuf, sync::Arc};

use reqwest::header::AUTHORIZATION;
use serde::Deserialize;
use tokio::{fs, io::AsyncWriteExt, sync::RwLock};

use crate::{
    audio::AudioEngine,
    config::{BridgeConfig, ConfigStore},
    models::{BridgeTrack, ProjectManifest},
};

const MAX_REMOTE_PREVIEW_BYTES: u64 = 50 * 1024 * 1024;

pub struct Runtime {
    pub config: RwLock<BridgeConfig>,
    pub device_token: RwLock<Option<String>>,
    pub local_token: RwLock<Option<String>>,
    pub audio: std::sync::Mutex<AudioEngine>,
    pub store: ConfigStore,
    client: reqwest::Client,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct PairingClaim {
    device_id: String,
    device_token: String,
    local_token: String,
    server_url: String,
}

impl Runtime {
    pub fn load() -> Result<Arc<Self>, String> {
        let store = ConfigStore::new()?;
        let config = store.load();
        let (device_token, local_token) = store.load_tokens();
        Ok(Arc::new(Self {
            config: RwLock::new(config),
            device_token: RwLock::new(device_token),
            local_token: RwLock::new(local_token),
            audio: std::sync::Mutex::new(AudioEngine::new()),
            store,
            client: reqwest::Client::builder()
                .user_agent(format!("SonoRiva-Bridge/{}", env!("CARGO_PKG_VERSION")))
                .build()
                .map_err(|error| error.to_string())?,
        }))
    }

    pub async fn paired(&self) -> bool {
        let config = self.config.read().await;
        config.server_url.is_some()
            && config.device_id.is_some()
            && self.device_token.read().await.is_some()
            && self.local_token.read().await.is_some()
    }

    pub async fn migrate_legacy_tokens(&self) -> Result<bool, String> {
        if self.device_token.read().await.is_some() && self.local_token.read().await.is_some() {
            return Ok(false);
        }
        let store = self.store.clone();
        let migrated = tokio::task::spawn_blocking(move || store.migrate_legacy_tokens())
            .await
            .map_err(|error| error.to_string())??;
        let Some((device_token, local_token)) = migrated else {
            return Ok(false);
        };
        *self.device_token.write().await = Some(device_token);
        *self.local_token.write().await = Some(local_token);
        Ok(true)
    }

    pub async fn claim_pairing(&self, ticket: &str, server_url: &str) -> Result<(), String> {
        let parsed_server = url::Url::parse(server_url)
            .map_err(|_| "Adresse du serveur SonoRiva invalide.".to_string())?;
        let allowed = (parsed_server.scheme() == "https"
            && parsed_server.host_str() == Some("app.sonoriva.fr"))
            || (parsed_server.scheme() == "http"
                && matches!(parsed_server.host_str(), Some("localhost" | "127.0.0.1")));
        if !allowed {
            return Err("Ce serveur n’est pas autorisé pour l’association.".to_string());
        }
        let server_url = server_url.trim_end_matches('/');
        let name = hostname::get()
            .ok()
            .and_then(|value| value.into_string().ok())
            .unwrap_or_else(|| default_device_name().to_string());
        let response = self
            .client
            .post(format!("{server_url}/api/bridge/pairings/claim"))
            .json(
                &serde_json::json!({ "ticket": ticket, "name": name, "platform": platform_name() }),
            )
            .send()
            .await
            .map_err(|error| error.to_string())?;
        if !response.status().is_success() {
            return Err(response
                .json::<serde_json::Value>()
                .await
                .ok()
                .and_then(|body| body.get("error")?.as_str().map(str::to_string))
                .unwrap_or_else(|| "Association refusée par SonoRiva.".to_string()));
        }
        let claim = response
            .json::<PairingClaim>()
            .await
            .map_err(|error| error.to_string())?;
        self.store
            .save_tokens(&claim.device_token, &claim.local_token)?;
        let next_config = BridgeConfig {
            server_url: Some(claim.server_url),
            device_id: Some(claim.device_id),
            main_output_id: Some("default".to_string()),
            preview_output_id: Some("default".to_string()),
        };
        self.store.save(&next_config)?;
        *self.config.write().await = next_config;
        *self.device_token.write().await = Some(claim.device_token);
        *self.local_token.write().await = Some(claim.local_token);
        Ok(())
    }

    pub async fn ensure_track(&self, track: &BridgeTrack) -> Result<PathBuf, String> {
        validate_track_id(&track.id)?;
        let path = self.store.cache_dir.join(format!("{}.audio", track.id));
        if let Ok(metadata) = fs::metadata(&path).await {
            if metadata.len() == track.size_bytes {
                return Ok(path);
            }
        }
        let config = self.config.read().await.clone();
        let server_url = config
            .server_url
            .ok_or_else(|| "Le bridge n’est pas associé à SonoRiva.".to_string())?;
        let device_token = self
            .device_token
            .read()
            .await
            .clone()
            .ok_or_else(|| "Le jeton du bridge est introuvable.".to_string())?;
        let mut response = self
            .client
            .get(format!("{server_url}/api/bridge/tracks/{}/audio", track.id))
            .header(AUTHORIZATION, format!("Bearer {device_token}"))
            .send()
            .await
            .map_err(|error| error.to_string())?;
        if !response.status().is_success() {
            return Err(format!(
                "Téléchargement de « {} » refusé ({}).",
                track.title,
                response.status()
            ));
        }
        let temporary = self.store.cache_dir.join(format!("{}.part", track.id));
        let mut file = fs::File::create(&temporary)
            .await
            .map_err(|error| error.to_string())?;
        let mut received = 0_u64;
        while let Some(chunk) = response.chunk().await.map_err(|error| error.to_string())? {
            received += chunk.len() as u64;
            if received > track.size_bytes.max(1) {
                let _ = fs::remove_file(&temporary).await;
                return Err("Le fichier reçu dépasse la taille annoncée.".to_string());
            }
            file.write_all(&chunk)
                .await
                .map_err(|error| error.to_string())?;
        }
        file.flush().await.map_err(|error| error.to_string())?;
        drop(file);
        if received != track.size_bytes {
            let _ = fs::remove_file(&temporary).await;
            return Err("Le fichier audio reçu est incomplet.".to_string());
        }
        if fs::try_exists(&path)
            .await
            .map_err(|error| error.to_string())?
        {
            fs::remove_file(&path)
                .await
                .map_err(|error| error.to_string())?;
        }
        fs::rename(&temporary, &path)
            .await
            .map_err(|error| error.to_string())?;
        Ok(path)
    }

    pub async fn ensure_remote_preview(
        &self,
        preview_id: u64,
        preview_url: &str,
    ) -> Result<PathBuf, String> {
        validate_remote_preview_url(preview_url)?;
        let path = self
            .store
            .cache_dir
            .join(format!("freesound-{preview_id}.preview"));
        if let Ok(mut entries) = fs::read_dir(&self.store.cache_dir).await {
            while let Ok(Some(entry)) = entries.next_entry().await {
                let candidate = entry.path();
                if candidate != path
                    && candidate.extension().and_then(|value| value.to_str()) == Some("preview")
                {
                    let _ = fs::remove_file(candidate).await;
                }
            }
        }
        if fs::try_exists(&path)
            .await
            .map_err(|error| error.to_string())?
        {
            return Ok(path);
        }
        let mut response = self
            .client
            .get(preview_url)
            .send()
            .await
            .map_err(|error| error.to_string())?;
        validate_remote_preview_url(response.url().as_str())?;
        if !response.status().is_success() {
            return Err(format!(
                "Préécoute Freesound indisponible ({}).",
                response.status()
            ));
        }
        if response
            .content_length()
            .is_some_and(|size| size > MAX_REMOTE_PREVIEW_BYTES)
        {
            return Err("La préécoute Freesound dépasse 50 Mo.".to_string());
        }
        let temporary = self
            .store
            .cache_dir
            .join(format!("freesound-{preview_id}.part"));
        let mut file = fs::File::create(&temporary)
            .await
            .map_err(|error| error.to_string())?;
        let mut received = 0_u64;
        while let Some(chunk) = response.chunk().await.map_err(|error| error.to_string())? {
            received += chunk.len() as u64;
            if received > MAX_REMOTE_PREVIEW_BYTES {
                let _ = fs::remove_file(&temporary).await;
                return Err("La préécoute Freesound dépasse 50 Mo.".to_string());
            }
            file.write_all(&chunk)
                .await
                .map_err(|error| error.to_string())?;
        }
        file.flush().await.map_err(|error| error.to_string())?;
        drop(file);
        if received == 0 {
            let _ = fs::remove_file(&temporary).await;
            return Err("La préécoute Freesound est vide.".to_string());
        }
        fs::rename(&temporary, &path)
            .await
            .map_err(|error| error.to_string())?;
        Ok(path)
    }

    pub async fn sync_project(&self, project_id: &str) -> Result<usize, String> {
        validate_track_id(project_id)?;
        let config = self.config.read().await.clone();
        let server_url = config
            .server_url
            .ok_or_else(|| "Le bridge n’est pas associé à SonoRiva.".to_string())?;
        let device_token = self
            .device_token
            .read()
            .await
            .clone()
            .ok_or_else(|| "Le jeton du bridge est introuvable.".to_string())?;
        let response = self
            .client
            .get(format!("{server_url}/api/bridge/projects/{project_id}"))
            .header(AUTHORIZATION, format!("Bearer {device_token}"))
            .send()
            .await
            .map_err(|error| error.to_string())?;
        if !response.status().is_success() {
            return Err(format!("Synchronisation refusée ({}).", response.status()));
        }
        let manifest = response
            .json::<ProjectManifest>()
            .await
            .map_err(|error| error.to_string())?;
        let mut cached = 0;
        for item in manifest.tracks {
            self.ensure_track(&item.track).await?;
            cached += 1;
        }
        Ok(cached)
    }

    pub async fn cache_stats(&self) -> (usize, u64) {
        std::fs::read_dir(&self.store.cache_dir)
            .ok()
            .into_iter()
            .flatten()
            .filter_map(Result::ok)
            .fold((0, 0), |(files, bytes), entry| {
                let is_audio =
                    entry.path().extension().and_then(|value| value.to_str()) == Some("audio");
                (
                    files + usize::from(is_audio),
                    bytes + entry.metadata().map(|metadata| metadata.len()).unwrap_or(0),
                )
            })
    }

    pub async fn clear_cache(&self) -> Result<usize, String> {
        let mut removed = 0;
        let mut entries = fs::read_dir(&self.store.cache_dir)
            .await
            .map_err(|error| error.to_string())?;
        while let Some(entry) = entries
            .next_entry()
            .await
            .map_err(|error| error.to_string())?
        {
            if matches!(
                entry.path().extension().and_then(|value| value.to_str()),
                Some("audio" | "preview" | "part")
            ) {
                fs::remove_file(entry.path())
                    .await
                    .map_err(|error| error.to_string())?;
                removed += 1;
            }
        }
        Ok(removed)
    }

    pub async fn save_output(&self, channel: &str, device_id: String) -> Result<(), String> {
        let mut config = self.config.write().await;
        match channel {
            "main" => config.main_output_id = Some(device_id),
            "preview" => config.preview_output_id = Some(device_id),
            _ => return Err("Canal de sortie inconnu.".to_string()),
        }
        self.store.save(&config)
    }
}

fn platform_name() -> &'static str {
    if cfg!(target_os = "windows") {
        "windows"
    } else if cfg!(target_os = "macos") {
        "macos"
    } else {
        "linux"
    }
}

fn default_device_name() -> &'static str {
    if cfg!(target_os = "windows") {
        "PC SonoRiva"
    } else if cfg!(target_os = "macos") {
        "Mac SonoRiva"
    } else {
        "SonoRiva Bridge"
    }
}

fn validate_track_id(value: &str) -> Result<(), String> {
    if value.len() <= 64
        && value
            .chars()
            .all(|character| character.is_ascii_alphanumeric() || character == '-')
    {
        Ok(())
    } else {
        Err("Identifiant de média invalide.".to_string())
    }
}

fn validate_remote_preview_url(value: &str) -> Result<(), String> {
    let url = url::Url::parse(value).map_err(|_| "Adresse de préécoute invalide.".to_string())?;
    if url.scheme() == "https"
        && url
            .host_str()
            .is_some_and(|host| host == "freesound.org" || host.ends_with(".freesound.org"))
    {
        Ok(())
    } else {
        Err("Seules les préécoutes HTTPS de Freesound sont autorisées.".to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::{validate_remote_preview_url, validate_track_id};

    #[test]
    fn accepts_uuid_identifiers_and_rejects_paths() {
        assert!(validate_track_id("11111111-1111-4111-8111-111111111111").is_ok());
        assert!(validate_track_id("../../Library/secret").is_err());
        assert!(validate_track_id("track/name").is_err());
    }

    #[test]
    fn accepts_only_freesound_preview_urls() {
        assert!(validate_remote_preview_url("https://cdn.freesound.org/previews/1/1.mp3").is_ok());
        assert!(validate_remote_preview_url("http://cdn.freesound.org/previews/1/1.mp3").is_err());
        assert!(validate_remote_preview_url("https://example.com/audio.mp3").is_err());
    }
}
