import { useState } from 'react';
import { CloudDownload, FileArchive, FolderPlus, GripVertical, Keyboard, LogOut, Settings2, Smartphone, Trash2, Waves, X } from 'lucide-react';
import type { KeyAction, Project, User } from '../types';

interface Props {
  user: User;
  projects: Project[];
  selectedProjectId: string | null;
  offlineStatus: string;
  remote: boolean;
  onChooseProject: (id: string) => void;
  onCreateProject: () => void;
  onReorderProjects: (projectIds: string[]) => Promise<void>;
  onDeleteProject: (project: Project) => Promise<void>;
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

export function SettingsDialog({ user, projects, selectedProjectId, offlineStatus, remote, onChooseProject, onCreateProject, onReorderProjects, onDeleteProject, onImportSoundShow, onOpenFreesound, onToggleRemote, onCacheOffline, onUpdateKeyAction, onLogout, onClose }: Props) {
  const selectedProject = projects.find((project) => project.id === selectedProjectId);
  const [draggedProjectId, setDraggedProjectId] = useState<string>();
  const [dropProjectId, setDropProjectId] = useState<string>();
  const [dropProjectAfter, setDropProjectAfter] = useState(false);

  function dropProject(targetId: string, after: boolean) {
    if (!draggedProjectId || draggedProjectId === targetId) return;
    const moving = projects.find((project) => project.id === draggedProjectId);
    if (!moving) return;
    const reordered = projects.filter((project) => project.id !== draggedProjectId);
    const targetIndex = reordered.findIndex((project) => project.id === targetId);
    reordered.splice(Math.max(0, targetIndex) + (after ? 1 : 0), 0, moving);
    onReorderProjects(reordered.map((project) => project.id)).catch(() => undefined);
    setDraggedProjectId(undefined);
    setDropProjectId(undefined);
    setDropProjectAfter(false);
  }

  return <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="dialog settings-dialog">
      <header><div><p className="eyebrow">SoundFlow</p><h2>Paramètres</h2></div><button className="icon-button" onClick={onClose} aria-label="Fermer les paramètres"><X /></button></header>
      <section className="settings-section">
        <div className="settings-section-title"><Settings2 size={16} /><div><strong>Spectacles</strong><span>Sélectionnez, glissez ou supprimez une régie.</span></div></div>
        <div className="settings-project-list">
          {projects.map((project) => <div key={project.id} className={`settings-project-item ${project.id === selectedProjectId ? 'active' : ''} ${project.id === dropProjectId ? `drop-target ${dropProjectAfter ? 'drop-after' : 'drop-before'}` : ''}`} draggable
            onDragStart={(event) => { event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', project.id); setDraggedProjectId(project.id); }}
            onDragOver={(event) => { if (!draggedProjectId || draggedProjectId === project.id) return; event.preventDefault(); const bounds = event.currentTarget.getBoundingClientRect(); setDropProjectId(project.id); setDropProjectAfter(event.clientY > bounds.top + bounds.height / 2); }}
            onDragLeave={() => setDropProjectId((current) => current === project.id ? undefined : current)}
            onDrop={(event) => { event.preventDefault(); const bounds = event.currentTarget.getBoundingClientRect(); dropProject(project.id, event.clientY > bounds.top + bounds.height / 2); }}
            onDragEnd={() => { setDraggedProjectId(undefined); setDropProjectId(undefined); setDropProjectAfter(false); }}>
            <GripVertical size={16} aria-hidden="true" />
            <button className="settings-project-select" onClick={() => onChooseProject(project.id)} aria-current={project.id === selectedProjectId ? 'true' : undefined}>{project.name}</button>
            <button className="settings-project-delete" onClick={() => onDeleteProject(project).catch(() => undefined)} aria-label={`Supprimer le spectacle ${project.name}`} title="Supprimer"><Trash2 size={15} /></button>
          </div>)}
          {projects.length === 0 && <span className="settings-project-empty">Aucun spectacle.</span>}
        </div>
        <button className="button ghost wide" onClick={onCreateProject}><FolderPlus size={17} />Nouveau spectacle</button>
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
