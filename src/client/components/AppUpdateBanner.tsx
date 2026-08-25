import { Download, ShieldAlert } from 'lucide-react';

interface Props {
  playbackActive: boolean;
  onApply: () => void;
}

export function AppUpdateBanner({ playbackActive, onApply }: Props) {
  return <aside className="app-update-banner" role="status" aria-live="polite">
    <span>{playbackActive ? <ShieldAlert size={18} /> : <Download size={18} />}</span>
    <div><strong>Une mise à jour de S1 est prête</strong><small>{playbackActive ? 'La régie joue actuellement. Terminez les lectures avant de l’installer.' : 'Rechargez lorsque vous êtes prêt.'}</small></div>
    <button className="button primary" disabled={playbackActive} onClick={onApply}>{playbackActive ? 'Lecture en cours' : 'Mettre à jour'}</button>
  </aside>;
}
