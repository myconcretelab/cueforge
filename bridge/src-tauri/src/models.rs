use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BridgeTrack {
    pub id: String,
    pub title: String,
    pub original_filename: String,
    pub mime_type: String,
    pub size_bytes: u64,
    pub duration_ms: Option<u64>,
    pub start_time_ms: u64,
    pub end_time_ms: Option<u64>,
    pub volume: f32,
    #[serde(rename = "loop")]
    pub loop_playback: bool,
    pub fade_in_ms: u64,
    pub fade_out_ms: u64,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectManifest {
    pub tracks: Vec<ManifestTrack>,
}

#[derive(Clone, Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ManifestTrack {
    #[serde(flatten)]
    pub track: BridgeTrack,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AudioOutput {
    pub id: String,
    pub name: String,
    pub is_default: bool,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PlaybackSnapshot {
    pub id: String,
    pub track_id: String,
    pub sequence: u64,
    pub position_ms: u64,
    pub duration_ms: u64,
    pub loop_playback: bool,
    pub paused: bool,
    pub volume: f32,
    pub fading_out: bool,
    pub channel: String,
    pub output_id: String,
}

#[cfg(test)]
mod tests {
    use super::BridgeTrack;

    #[test]
    fn reads_the_web_track_contract() {
        let track: BridgeTrack = serde_json::from_value(serde_json::json!({
            "id": "11111111-1111-4111-8111-111111111111",
            "title": "Ouverture",
            "originalFilename": "ouverture.mp3",
            "mimeType": "audio/mpeg",
            "sizeBytes": 1234,
            "durationMs": 60000,
            "startTimeMs": 1000,
            "endTimeMs": 50000,
            "volume": 0.8,
            "loop": true,
            "fadeInMs": 500,
            "fadeOutMs": 1000
        }))
        .expect("valid track");
        assert!(track.loop_playback);
        assert_eq!(track.start_time_ms, 1000);
    }
}
