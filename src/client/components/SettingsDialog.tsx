import { CloudDownload, FileArchive, FolderPlus, Keyboard, LogOut, Settings2, Smartphone, Waves, X } from 'lucide-react';
import type { KeyAction, Project, User } from '../types';

interface Props {
  user: User;
  projects: Project[];
  selectedProjectId: string | null;
  offlineStatus: string;
  remote: boolean;
  onChooseProject: (id: string) => void;
  onCreateProject: () => void;
  onImportSoundShow: () => void;
  onOpenFreesound: () => void;
  onToggleRemote: () => void;
  onCacheOffline: () => void;
  onUpdateKeyAction: (key: 'escape' | 'backspace', action: KeyAction) => void;
  onLogout: () => void;
  onClose: () => void;
}

const keyActions: Array<{ value: KeyAction; label: string }> = [
  { value: 'stop-all', label: 'Tout arrêter' },
  { value: 'none', label: 'Aucune action' },
];

export function SettingsDialog({ user, projects, selectedProjectId, offlineStatus, remote, onChooseProject, onCreateProject, onImportSoundShow, onOpenFreesound, onToggleRemote, onCacheOffline, onUpdateKeyAction, onLogout, onClose }: Props) {
  const selectedProject = projects.find((project) => project.id === selectedProjectId);
  return <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="dialog settings-dialog">
      <header><div><p className="eyebrow">SoundFlow</p><h2>Paramètres</h2></div><button className="icon-button" onClick={onClose} aria-label="Fermer les paramètres"><X /></button></header>
      <section className="settings-section">
        <div className="settings-section-title"><Settings2 size={16} /><div><strong>Spectacle actif</strong><span>Choisissez la régie à afficher.</span></div></div>
        <div className="settings-project-row"><select aria-label="Spectacle actif" value={selectedProjectId ?? ''} onChange={(event) => onChooseProject(event.target.value)}>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select><button className="icon-button" onClick={onCreateProject} aria-label="Nouveau spectacle" title="Nouveau spectacle"><FolderPlus size={18} /></button></div>
      </section>
      <section className="settings-section">
        <div className="settings-section-title"><FileArchive size={16} /><div><strong>Bibliothèque</strong><span>Importez ou préparez les médias de ce spectacle.</span></div></div>
        <div className="settings-actions"><button className="button ghost" onClick={onImportSoundShow}><FileArchive size={17} />Importer SoundShow</button><button className="button ghost" onClick={onOpenFreesound}><Waves size={17} />Rechercher sur Freesound</button><button className="button ghost" onClick={onCacheOffline}><CloudDownload size={17} />{offlineStatus || 'Rendre disponible hors ligne'}</button></div>
      </section>
      <section className="settings-section">
        <div className="settings-section-title"><Smartphone size={16} /><div><strong>Télécommande</strong><span>Utilisez cette vue depuis un téléphone connecté au même spectacle.</span></div></div>
        <button className="button ghost wide" onClick={onToggleRemote}><Smartphone size={17} />{remote ? 'Revenir à la régie principale' : 'Ouvrir la télécommande'}</button>
      </section>
      <section className="settings-section">
        <div className="settings-section-title"><Keyboard size={16} /><div><strong>Raccourcis d’arrêt</strong><span>Définissez le comportement des touches globales.</span></div></div>
        <div className="settings-key-actions">
          <label><span><kbd>Échap</kbd> Touche Échap</span><select value={selectedProject?.escapeKeyAction ?? 'stop-all'} onChange={(event) => onUpdateKeyAction('escape', event.target.value as KeyAction)}>{keyActions.map((action) => <option key={action.value} value={action.value}>{action.label}</option>)}</select></label>
          <label><span><kbd>⌫</kbd> Retour arrière</span><select value={selectedProject?.backspaceKeyAction ?? 'stop-all'} onChange={(event) => onUpdateKeyAction('backspace', event.target.value as KeyAction)}>{keyActions.map((action) => <option key={action.value} value={action.value}>{action.label}</option>)}</select></label>
        </div>
      </section>
      <section className="settings-account">
        <span>{user.displayName.slice(0, 1).toUpperCase()}</span><div><strong>{user.displayName}</strong><small>{user.email}</small></div><button className="button danger" onClick={onLogout}><LogOut size={16} />Se déconnecter</button>
      </section>
    </section>
  </div>;
}
