use std::{path::PathBuf, sync::Arc};

use reqwest::header::AUTHORIZATION;
use serde::Deserialize;
use tokio::{fs, io::AsyncWriteExt, sync::RwLock};

use crate::{
    audio::AudioEngine,
    config::{BridgeConfig, ConfigStore},
    models::{BridgeTrack, ProjectManifest},
};

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
        let device_token = store.read_device_token();
        let local_token = store.read_local_token();
        Ok(Arc::new(Self {
            config: RwLock::new(config),
            device_token: RwLock::new(device_token),
            local_token: RwLock::new(local_token),
            audio: std::sync::Mutex::new(AudioEngine::new()),
            store,
            client: reqwest::Client::builder()
                .user_agent("CueForge-Bridge/0.1.0")
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

    pub async fn claim_pairing(&self, ticket: &str, server_url: &str) -> Result<(), String> {
        let parsed_server = url::Url::parse(server_url)
            .map_err(|_| "Adresse du serveur CueForge invalide.".to_string())?;
        let allowed = (parsed_server.scheme() == "https"
            && parsed_server.host_str() == Some("app.cueforge.fr"))
            || (parsed_server.scheme() == "http"
                && matches!(parsed_server.host_str(), Some("localhost" | "127.0.0.1")));
        if !allowed {
            return Err("Ce serveur n’est pas autorisé pour l’association.".to_string());
        }
        let server_url = server_url.trim_end_matches('/');
        let name = hostname::get()
            .ok()
            .and_then(|value| value.into_string().ok())
            .unwrap_or_else(|| "Mac CueForge".to_string());
        let response = self
            .client
            .post(format!("{server_url}/api/bridge/pairings/claim"))
            .json(&serde_json::json!({ "ticket": ticket, "name": name, "platform": "macos" }))
            .send()
            .await
            .map_err(|error| error.to_string())?;
        if !response.status().is_success() {
            return Err(response
                .json::<serde_json::Value>()
                .await
                .ok()
                .and_then(|body| body.get("error")?.as_str().map(str::to_string))
                .unwrap_or_else(|| "Association refusée par CueForge.".to_string()));
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
            .ok_or_else(|| "Le bridge n’est pas associé à CueForge.".to_string())?;
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
        if received != track.size_bytes {
            let _ = fs::remove_file(&temporary).await;
            return Err("Le fichier audio reçu est incomplet.".to_string());
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
            .ok_or_else(|| "Le bridge n’est pas associé à CueForge.".to_string())?;
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

    pub async fn cached_tracks(&self) -> usize {
        std::fs::read_dir(&self.store.cache_dir)
            .ok()
            .into_iter()
            .flatten()
            .filter_map(Result::ok)
            .filter(|entry| {
                entry.path().extension().and_then(|value| value.to_str()) == Some("audio")
            })
            .count()
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
                Some("audio" | "part")
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

#[cfg(test)]
mod tests {
    use super::validate_track_id;

    #[test]
    fn accepts_uuid_identifiers_and_rejects_paths() {
        assert!(validate_track_id("11111111-1111-4111-8111-111111111111").is_ok());
        assert!(validate_track_id("../../Library/secret").is_err());
        assert!(validate_track_id("track/name").is_err());
    }
}
