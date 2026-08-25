import { Check, PartyPopper, X } from 'lucide-react';
import type { AppRelease } from '../types';

interface Props {
  releases: AppRelease[];
  currentVersion: string;
  onClose: () => void;
}

const dateFormatter = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

export function WhatsNewDialog({ releases, currentVersion, onClose }: Props) {
  return <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="dialog whats-new-dialog" aria-labelledby="whats-new-title">
      <header><div><p className="eyebrow"><PartyPopper size={15} /> CueForge · Version {currentVersion}</p><h2 id="whats-new-title">Nouveautés</h2></div><button className="icon-button" onClick={onClose} aria-label="Fermer les nouveautés"><X /></button></header>
      <div className="release-list">
        {releases.map((release) => <article className={release.important ? 'important' : ''} key={release.version}>
          <div className="release-heading"><div><strong>{release.title}</strong><span>Version {release.version}</span></div><time dateTime={release.date}>{dateFormatter.format(new Date(`${release.date}T00:00:00Z`))}</time></div>
          <p>{release.summary}</p>
          <ul>{release.changes.map((change) => <li key={change}><Check size={15} />{change}</li>)}</ul>
        </article>)}
      </div>
      <footer><a className="button ghost" href={`/docs/nouveautes/${currentVersion}.html`} target="_blank" rel="noopener noreferrer">Lire la note complète</a><button className="button primary" onClick={onClose}>J’ai compris</button></footer>
    </section>
  </div>;
}
