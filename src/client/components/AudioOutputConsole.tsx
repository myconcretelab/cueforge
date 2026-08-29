import { useCallback, useEffect, useRef, useState } from 'react';
import { Speaker, TriangleAlert } from 'lucide-react';
import { audioEngine } from '../lib/audio-engine';
import { bridgeClient, type AudioPlaybackMode } from '../lib/bridge-client';

interface Props {
  onError: (message: string) => void;
}

interface OutputOption {
  id: string;
  label: string;
}

interface OutputState {
  mode: AudioPlaybackMode;
  selectedId: string;
  selectedLabel: string;
  options: OutputOption[];
  selectable: boolean;
  unavailable: boolean;
  error: string;
}

function initialState(): OutputState {
  const selection = audioEngine.getAudioOutputSelection();
  return {
    mode: 'browser',
    selectedId: selection.deviceId,
    selectedLabel: selection.label,
    options: [{ id: selection.deviceId, label: selection.label }],
    selectable: audioEngine.supportsAudioOutputSelection(),
    unavailable: false,
    error: '',
  };
}

export function AudioOutputConsole({ onError }: Props) {
  const [output, setOutput] = useState<OutputState>(initialState);
  const [busy, setBusy] = useState(false);
  const refreshSequence = useRef(0);

  const refresh = useCallback(async () => {
    const sequence = ++refreshSequence.current;
    const mode = audioEngine.getPlaybackMode();
    try {
      if (mode === 'bridge') {
        if (!bridgeClient.isAssociated()) throw new Error('CueForge Bridge n’est pas associé.');
        const result = await bridgeClient.outputs();
        const selected = result.outputs.find((candidate) => candidate.id === result.mainOutputId);
        if (sequence !== refreshSequence.current) return;
        setOutput({
          mode,
          selectedId: result.mainOutputId,
          selectedLabel: selected?.name ?? 'Sortie Bridge indisponible',
          options: result.outputs.map((candidate) => ({ id: candidate.id, label: candidate.name })),
          selectable: result.outputs.length > 0,
          unavailable: !selected,
          error: selected ? '' : 'La sortie principale du Bridge n’est plus disponible.',
        });
        return;
      }

      const selection = audioEngine.getAudioOutputSelection();
      const supported = audioEngine.supportsAudioOutputSelection();
      const devices = supported
        ? await audioEngine.listAudioOutputDevices()
        : [{ deviceId: '', label: 'Sortie système par défaut' }];
      const selected = devices.find((candidate) => candidate.deviceId === selection.deviceId);
      if (sequence !== refreshSequence.current) return;
      setOutput({
        mode,
        selectedId: selection.deviceId,
        selectedLabel: selected?.label ?? selection.label,
        options: devices.map((candidate) => ({ id: candidate.deviceId, label: candidate.label })),
        selectable: supported,
        unavailable: Boolean(selection.deviceId && !selected),
        error: selection.deviceId && !selected ? 'La sortie audio enregistrée n’est plus disponible.' : '',
      });
    } catch (cause) {
      if (sequence !== refreshSequence.current) return;
      const message = cause instanceof Error ? cause.message : 'La sortie audio est indisponible.';
      setOutput({ mode, selectedId: '', selectedLabel: mode === 'bridge' ? 'Bridge indisponible' : 'Sortie indisponible', options: [], selectable: false, unavailable: true, error: message });
    }
  }, []);

  useEffect(() => audioEngine.subscribeRouting(() => { refresh().catch(() => undefined); }), [refresh]);

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) return;
    const onDeviceChange = () => refresh().catch(() => undefined);
    navigator.mediaDevices.addEventListener('devicechange', onDeviceChange);
    return () => navigator.mediaDevices.removeEventListener('devicechange', onDeviceChange);
  }, [refresh]);

  async function changeOutput(deviceId: string) {
    const selected = output.options.find((candidate) => candidate.id === deviceId);
    setBusy(true);
    try {
      if (output.mode === 'bridge') await bridgeClient.setOutput('main', deviceId);
      else await audioEngine.setAudioOutput(deviceId, selected?.label);
      await refresh();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Impossible de sélectionner cette sortie audio.';
      onError(message);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  const title = output.error || `Sortie principale · ${output.mode === 'bridge' ? 'CueForge Bridge' : 'Web Audio'}`;
  return <section className={`console-module console-audio-output ${output.unavailable ? 'is-unavailable' : ''}`} title={title}>
    <span><Speaker size={14} />Sortie audio</span>
    <div className="console-audio-output-control">
      <select value={output.selectedId} disabled={busy || !output.selectable} aria-label="Sortie audio principale" onFocus={() => refresh().catch(() => undefined)} onChange={(event) => changeOutput(event.target.value)}>
        {output.unavailable && <option value={output.selectedId}>{output.selectedLabel}</option>}
        {output.options.map((candidate) => <option value={candidate.id} key={candidate.id || 'default'}>{candidate.label}</option>)}
      </select>
      {output.unavailable && <TriangleAlert size={18} aria-label={output.error} />}
    </div>
  </section>;
}
