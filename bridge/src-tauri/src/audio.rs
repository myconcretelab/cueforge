use std::{collections::HashMap, fs::File, path::Path, path::PathBuf, sync::Arc, time::Duration};

use cpal::traits::{DeviceTrait, HostTrait};
use rodio::{Decoder, DeviceSinkBuilder, MixerDeviceSink, Player, Source};
use uuid::Uuid;

use crate::models::{AudioOutput, BridgeTrack, PlaybackSnapshot};

struct Playback {
    id: String,
    track_id: String,
    sequence: u64,
    duration_ms: u64,
    loop_playback: bool,
    volume: f32,
    fading_out: bool,
    player: Arc<Player>,
    track: BridgeTrack,
    path: PathBuf,
    position_offset_ms: u64,
    channel: String,
}

pub struct AudioEngine {
    outputs: HashMap<String, MixerDeviceSink>,
    active: HashMap<String, Playback>,
    sequence: u64,
}

impl AudioEngine {
    pub fn new() -> Self {
        Self {
            outputs: HashMap::new(),
            active: HashMap::new(),
            sequence: 0,
        }
    }

    pub fn list_outputs() -> Result<Vec<AudioOutput>, String> {
        let host = cpal::default_host();
        let default_id = host
            .default_output_device()
            .and_then(|device| device.id().ok())
            .map(|id| id.to_string());
        let devices = host.output_devices().map_err(|error| error.to_string())?;
        let mut outputs = vec![AudioOutput {
            id: "default".to_string(),
            name: "Sortie système par défaut".to_string(),
            is_default: true,
        }];
        for (index, device) in devices.enumerate() {
            let id = device
                .id()
                .map(|id| id.to_string())
                .unwrap_or_else(|_| format!("device-{index}"));
            let name = device
                .description()
                .map(|description| description.name().to_string())
                .unwrap_or_else(|_| format!("Sortie audio {}", index + 1));
            outputs.push(AudioOutput {
                is_default: default_id.as_deref() == Some(id.as_str()),
                id,
                name,
            });
        }
        Ok(outputs)
    }

    fn output(&mut self, output_id: &str) -> Result<&MixerDeviceSink, String> {
        if !self.outputs.contains_key(output_id) {
            let sink = if output_id == "default" {
                DeviceSinkBuilder::open_default_sink().map_err(|error| error.to_string())?
            } else {
                let host = cpal::default_host();
                let mut devices = host.output_devices().map_err(|error| error.to_string())?;
                let device = devices
                    .find_map(|device| {
                        (device.id().ok()?.to_string() == output_id).then_some(device)
                    })
                    .ok_or_else(|| "Cette sortie audio n’est plus disponible.".to_string())?;
                DeviceSinkBuilder::from_device(device)
                    .and_then(|builder| builder.open_stream())
                    .map_err(|error| error.to_string())?
            };
            self.outputs.insert(output_id.to_string(), sink);
        }
        self.outputs
            .get(output_id)
            .ok_or_else(|| "Sortie audio inaccessible.".to_string())
    }

    pub fn play(
        &mut self,
        track: &BridgeTrack,
        path: &Path,
        output_id: &str,
        channel: &str,
        fade_in_ms: u64,
        volume_multiplier: f32,
    ) -> Result<String, String> {
        let mixer = self.output(output_id)?.mixer().clone();
        let duration_ms = track
            .end_time_ms
            .or(track.duration_ms)
            .unwrap_or(track.start_time_ms + 1)
            .saturating_sub(track.start_time_ms)
            .max(10);
        let player = Arc::new(Player::connect_new(&mixer));
        let target_volume = (track.volume * volume_multiplier).clamp(0.0, 1.0);
        player.set_volume(if fade_in_ms > 0 { 0.0 } else { target_volume });
        append_source(&player, track, path, 0, track.loop_playback)?;
        self.sequence += 1;
        let id = format!("{}:{}", track.id, Uuid::new_v4());
        self.active.insert(
            id.clone(),
            Playback {
                id: id.clone(),
                track_id: track.id.clone(),
                sequence: self.sequence,
                duration_ms,
                loop_playback: track.loop_playback,
                volume: target_volume,
                fading_out: false,
                player: player.clone(),
                track: track.clone(),
                path: path.to_path_buf(),
                position_offset_ms: 0,
                channel: channel.to_string(),
            },
        );
        if fade_in_ms > 0 {
            tokio::spawn(fade_player(player, 0.0, target_volume, fade_in_ms, false));
        }
        Ok(id)
    }

    pub fn snapshots(&mut self) -> Vec<PlaybackSnapshot> {
        self.active
            .retain(|_, playback| playback.loop_playback || !playback.player.empty());
        let mut snapshots = self
            .active
            .values_mut()
            .map(|playback| {
                if playback.loop_playback
                    && playback.position_offset_ms > 0
                    && playback.player.len() == 1
                {
                    playback.position_offset_ms = 0;
                }
                let raw_position =
                    playback.position_offset_ms + playback.player.get_pos().as_millis() as u64;
                PlaybackSnapshot {
                    id: playback.id.clone(),
                    track_id: playback.track_id.clone(),
                    sequence: playback.sequence,
                    position_ms: if playback.loop_playback {
                        raw_position % playback.duration_ms
                    } else {
                        raw_position.min(playback.duration_ms)
                    },
                    duration_ms: playback.duration_ms,
                    loop_playback: playback.loop_playback,
                    paused: playback.player.is_paused(),
                    volume: playback.volume,
                    fading_out: playback.fading_out,
                    channel: playback.channel.clone(),
                }
            })
            .collect::<Vec<_>>();
        snapshots.sort_by_key(|playback| playback.sequence);
        snapshots
    }

    pub fn toggle_pause(&mut self, id: &str) {
        if let Some(playback) = self.active.get(id) {
            if playback.player.is_paused() {
                playback.player.play();
            } else {
                playback.player.pause();
            }
        }
    }

    pub fn set_volume(&mut self, id: &str, volume: f32) {
        if let Some(playback) = self.active.get_mut(id) {
            playback.volume = volume.clamp(0.0, 1.0);
            playback.player.set_volume(playback.volume);
        }
    }

    pub fn set_loop(&mut self, id: &str, loop_playback: bool) -> Result<(), String> {
        let playback = self
            .active
            .get_mut(id)
            .ok_or_else(|| "Lecture introuvable.".to_string())?;
        if playback.loop_playback == loop_playback {
            return Ok(());
        }
        let position_ms = current_position(playback);
        let paused = playback.player.is_paused();
        playback.player.stop();
        append_source(
            &playback.player,
            &playback.track,
            &playback.path,
            position_ms,
            loop_playback,
        )?;
        if paused {
            playback.player.pause();
        }
        playback.position_offset_ms = position_ms;
        playback.loop_playback = loop_playback;
        Ok(())
    }

    pub fn seek(&mut self, id: &str, progress: f32) -> Result<(), String> {
        let playback = self
            .active
            .get_mut(id)
            .ok_or_else(|| "Lecture introuvable.".to_string())?;
        let position_ms = (playback.duration_ms as f32 * progress.clamp(0.0, 1.0)) as u64;
        let paused = playback.player.is_paused();
        playback.player.stop();
        append_source(
            &playback.player,
            &playback.track,
            &playback.path,
            position_ms,
            playback.loop_playback,
        )?;
        if paused {
            playback.player.pause();
        }
        playback.position_offset_ms = position_ms;
        Ok(())
    }

    pub fn stop(&mut self, id: &str, fade_out_ms: u64) {
        if fade_out_ms == 0 {
            if let Some(playback) = self.active.remove(id) {
                playback.player.stop();
            }
            return;
        }
        if let Some(playback) = self.active.get_mut(id) {
            if playback.fading_out {
                return;
            }
            playback.fading_out = true;
            let player = playback.player.clone();
            tokio::spawn(fade_player(
                player.clone(),
                player.volume(),
                0.0,
                fade_out_ms,
                true,
            ));
        }
    }

    pub fn stop_track(&mut self, track_id: &str, fade_out_ms: u64) {
        let ids = self
            .active
            .values()
            .filter(|playback| playback.track_id == track_id)
            .map(|playback| playback.id.clone())
            .collect::<Vec<_>>();
        for id in ids {
            self.stop(&id, fade_out_ms);
        }
    }

    pub fn stop_all(&mut self, fade_out_ms: u64) {
        let ids = self.active.keys().cloned().collect::<Vec<_>>();
        for id in ids {
            self.stop(&id, fade_out_ms);
        }
    }
}

fn append_source(
    player: &Player,
    track: &BridgeTrack,
    path: &Path,
    position_ms: u64,
    loop_playback: bool,
) -> Result<(), String> {
    let duration_ms = track
        .end_time_ms
        .or(track.duration_ms)
        .unwrap_or(track.start_time_ms + 1)
        .saturating_sub(track.start_time_ms)
        .max(10);
    let position_ms = position_ms.min(duration_ms.saturating_sub(1));
    let decoder = Decoder::try_from(File::open(path).map_err(|error| error.to_string())?)
        .map_err(|error| error.to_string())?;
    let first = decoder
        .skip_duration(Duration::from_millis(track.start_time_ms + position_ms))
        .take_duration(Duration::from_millis(duration_ms - position_ms));
    if !loop_playback {
        player.append(first);
        return Ok(());
    }
    if position_ms > 0 {
        player.append(first);
    }
    let repeating = Decoder::try_from(File::open(path).map_err(|error| error.to_string())?)
        .map_err(|error| error.to_string())?
        .skip_duration(Duration::from_millis(track.start_time_ms))
        .take_duration(Duration::from_millis(duration_ms))
        .repeat_infinite();
    player.append(repeating);
    Ok(())
}

fn current_position(playback: &Playback) -> u64 {
    let raw = playback.position_offset_ms + playback.player.get_pos().as_millis() as u64;
    if playback.loop_playback {
        raw % playback.duration_ms
    } else {
        raw.min(playback.duration_ms)
    }
}

async fn fade_player(player: Arc<Player>, from: f32, to: f32, duration_ms: u64, stop_after: bool) {
    let steps = (duration_ms / 20).clamp(1, 200);
    for step in 1..=steps {
        tokio::time::sleep(Duration::from_millis(duration_ms / steps)).await;
        let progress = step as f32 / steps as f32;
        player.set_volume(from + (to - from) * progress);
    }
    if stop_after {
        player.stop();
    }
}
