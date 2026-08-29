import type { RoutedBridgeOutput } from '../lib/bridge-output-routing';

interface Props {
  outputs: RoutedBridgeOutput[];
  mainOutputId: string | undefined;
}

export function BridgeOutputLegend({ outputs, mainOutputId }: Props) {
  if (outputs.length < 2 || !mainOutputId) return null;
  return <section className="bridge-output-strip" aria-label="Tableau des sorties audio" title="Code couleur des sorties Bridge">
    <strong>Sorties audio</strong>
    <div>{outputs.map((output) => <span className={output.id === mainOutputId ? 'is-main' : ''} style={{ '--output-color': output.color } as React.CSSProperties} key={output.id} title={output.id === mainOutputId ? `${output.name} · sortie principale` : output.name}><i /><b>{output.name}</b>{output.id === mainOutputId && <em>Principale</em>}</span>)}</div>
  </section>;
}
