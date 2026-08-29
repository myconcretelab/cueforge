import { useCallback, useEffect, useRef, useState } from 'react';
import { Cable, LoaderCircle, Power, RefreshCcw, Speaker, TriangleAlert } from 'lucide-react';
import { audioEngine } from '../lib/audio-engine';
import { bridgeClient, type AudioPlaybackMode } from '../lib/bridge-client';
import { associateLocalBridge, bridgeConnectionView, openLocalBridge } from '../lib/bridge-connection';

interface Props {
  bridgeAvailable: boolean | undefined;
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

export function AudioOutputConsole({ bridgeAvailable, onError }: Props) {
  const [output, setOutput] = useState<OutputState>(initialState);
  const [busy, setBusy] = useState(false);
  const [bridgeBusy, setBridgeBusy] = useState(false);
  const [bridgeDetected, setBridgeDetected] = useState<boolean>();
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

  const detectBridge = useCallback(async () => {
    if (bridgeAvailable !== true) {
      setBridgeDetected(undefined);
      return false;
    }
    try {
      await bridgeClient.discover();
      setBridgeDetected(true);
      return true;
    } catch {
      setBridgeDetected(false);
      return false;
    }
  }, [bridgeAvailable]);

  useEffect(() => audioEngine.subscribeRouting(() => { refresh().catch(() => undefined); }), [refresh]);

  useEffect(() => {
    detectBridge().catch(() => undefined);
    if (bridgeAvailable !== true) return;
    const timer = window.setInterval(() => detectBridge().catch(() => undefined), 5_000);
    return () => window.clearInterval(timer);
  }, [bridgeAvailable, detectBridge]);

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

  async function runBridgeAction() {
    if (bridgeBusy) return;
    const connection = bridgeConnectionView({
      available: bridgeAvailable,
      detected: bridgeDetected,
      associated: bridgeClient.isAssociated(),
      mode: audioEngine.getPlaybackMode(),
    });
    if (connection.action === 'none') return;
    setBridgeBusy(true);
    try {
      if (connection.action === 'pair') {
        await associateLocalBridge();
        setBridgeDetected(true);
        audioEngine.setPlaybackMode('bridge');
      } else if (connection.action === 'open') {
        openLocalBridge();
        let detected = false;
        for (let attempt = 0; attempt < 20 && !detected; attempt += 1) {
          await new Promise((resolve) => window.setTimeout(resolve, 500));
          detected = await detectBridge();
        }
        if (!detected) throw new Error('CueForge Bridge ne répond pas sur cette machine.');
        audioEngine.setPlaybackMode('bridge');
      } else if (connection.action === 'activate') {
        audioEngine.setPlaybackMode('bridge');
      } else {
        audioEngine.setPlaybackMode('browser');
      }
      await Promise.all([detectBridge(), refresh()]);
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : 'Impossible de connecter CueForge Bridge.');
      await Promise.all([detectBridge(), refresh()]);
    } finally {
      setBridgeBusy(false);
    }
  }

  const bridgeConnection = bridgeConnectionView({
    available: bridgeAvailable,
    detected: bridgeDetected,
    associated: bridgeClient.isAssociated(),
    mode: audioEngine.getPlaybackMode(),
  });
  const title = output.error || `Sortie principale · ${output.mode === 'bridge' ? 'CueForge Bridge' : 'Web Audio'}`;
  return <section className={`console-module console-audio-output ${output.unavailable ? 'is-unavailable' : ''}`} title={title}>
    <span><Speaker size={14} />Sortie audio<i className={`bridge-status-led ${bridgeConnection.state}`} role="status" aria-label={bridgeConnection.label} title={bridgeConnection.label} /></span>
    <div className="console-audio-output-control">
      <select value={output.selectedId} disabled={busy || !output.selectable} aria-label="Sortie audio principale" onFocus={() => refresh().catch(() => undefined)} onChange={(event) => changeOutput(event.target.value)}>
        {output.unavailable && <option value={output.selectedId}>{output.selectedLabel}</option>}
        {output.options.map((candidate) => <option value={candidate.id} key={candidate.id || 'default'}>{candidate.label}</option>)}
      </select>
      <div className="bridge-console-actions">
        {output.unavailable && <TriangleAlert size={17} aria-label={output.error} />}
        <button type="button" className={bridgeConnection.state === 'active' ? 'active' : ''} disabled={bridgeBusy || bridgeConnection.action === 'none'} onClick={runBridgeAction} aria-label={bridgeConnection.actionLabel} title={bridgeConnection.actionLabel}>{bridgeBusy ? <LoaderCircle className="spin" size={14} /> : bridgeConnection.action === 'open' || bridgeConnection.action === 'deactivate' ? <Power size={14} /> : <Cable size={14} />}</button>
        <button type="button" disabled={bridgeBusy || bridgeAvailable !== true} onClick={() => detectBridge()} aria-label="Actualiser l’état du Bridge" title="Actualiser l’état du Bridge"><RefreshCcw size={13} /></button>
      </div>
    </div>
  </section>;
}
