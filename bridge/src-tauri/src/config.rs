use std::{fs, path::PathBuf};

use directories::ProjectDirs;
use keyring::Entry;
use serde::{Deserialize, Serialize};

const SERVICE: &str = "fr.cueforge.bridge";

#[derive(Clone, Debug, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BridgeConfig {
    pub server_url: Option<String>,
    pub device_id: Option<String>,
    pub main_output_id: Option<String>,
    pub preview_output_id: Option<String>,
}

pub struct ConfigStore {
    config_path: PathBuf,
    pub cache_dir: PathBuf,
}

impl ConfigStore {
    pub fn new() -> Result<Self, String> {
        let project_dirs = ProjectDirs::from("fr", "CueForge", "CueForge Bridge")
            .ok_or_else(|| "Dossier de données utilisateur introuvable.".to_string())?;
        let data_dir = project_dirs.data_local_dir();
        fs::create_dir_all(data_dir).map_err(|error| error.to_string())?;
        let cache_dir = project_dirs.cache_dir().join("audio");
        fs::create_dir_all(&cache_dir).map_err(|error| error.to_string())?;
        Ok(Self {
            config_path: data_dir.join("config.json"),
            cache_dir,
        })
    }

    pub fn load(&self) -> BridgeConfig {
        fs::read(&self.config_path)
            .ok()
            .and_then(|bytes| serde_json::from_slice(&bytes).ok())
            .unwrap_or_default()
    }

    pub fn save(&self, config: &BridgeConfig) -> Result<(), String> {
        let bytes = serde_json::to_vec_pretty(config).map_err(|error| error.to_string())?;
        fs::write(&self.config_path, bytes).map_err(|error| error.to_string())
    }

    pub fn read_device_token(&self) -> Option<String> {
        read_secret("device-token")
    }

    pub fn read_local_token(&self) -> Option<String> {
        read_secret("local-token")
    }

    pub fn save_tokens(&self, device_token: &str, local_token: &str) -> Result<(), String> {
        write_secret("device-token", device_token)?;
        write_secret("local-token", local_token)
    }
}

fn read_secret(account: &str) -> Option<String> {
    Entry::new(SERVICE, account).ok()?.get_password().ok()
}

fn write_secret(account: &str, value: &str) -> Result<(), String> {
    Entry::new(SERVICE, account)
        .map_err(|error| error.to_string())?
        .set_password(value)
        .map_err(|error| error.to_string())
}
