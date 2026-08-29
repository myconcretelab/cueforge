import type { RoutedBridgeOutput } from '../lib/bridge-output-routing';

interface Props {
  outputs: RoutedBridgeOutput[];
  mainOutputId: string | undefined;
}

export function BridgeOutputLegend({ outputs, mainOutputId }: Props) {
  if (outputs.length < 2 || !mainOutputId) return null;
  return <section className="console-module bridge-output-legend" aria-label="Code couleur des sorties audio" title="Code couleur des sorties Bridge">
    <span>Sorties</span>
    <div>{outputs.map((output) => <span className={output.id === mainOutputId ? 'is-main' : ''} style={{ '--output-color': output.color } as React.CSSProperties} key={output.id} title={output.id === mainOutputId ? `${output.name} · sortie principale` : output.name}><i />{output.name}</span>)}</div>
  </section>;
}
