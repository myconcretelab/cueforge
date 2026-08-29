import { playbackBridgeOutput, type RoutedBridgeOutput } from '../lib/bridge-output-routing';

interface Props {
  title: string;
  outputId: string | undefined;
  outputs: RoutedBridgeOutput[];
  disabled: boolean;
  onChange: (outputId: string) => void;
}

export function PlaybackOutputSelector({ title, outputId, outputs, disabled, onChange }: Props) {
  const output = playbackBridgeOutput(outputs, outputId);
  if (!output || outputs.length < 2) return null;
  return <label className="player-output-selector" style={{ '--output-color': output.color } as React.CSSProperties} title={`Sortie : ${output.name}`}>
    <i aria-hidden="true" />
    <select value={output.id} disabled={disabled} onChange={(event) => onChange(event.target.value)} aria-label={`Sortie de lecture de ${title}`}>
      {outputs.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name}</option>)}
    </select>
  </label>;
}
