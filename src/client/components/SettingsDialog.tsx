import { useEffect, useState } from 'react';
import { BookOpen, CloudDownload, FileArchive, FolderPlus, Gift, GripVertical, HardDrive, Keyboard, LogOut, Palette, Plus, Settings2, Smartphone, Trash2, Waves, X } from 'lucide-react';
import { api } from '../lib/api';
import type { AccountSummary, KeyAction, Project, ProjectColor, User } from '../types';

interface Props {
  user: User;
  projects: Project[];
  projectColors: ProjectColor[];
  selectedProjectId: string | null;
  offlineStatus: string;
  remote: boolean;
  appVersion?: string;
  hasUnseenReleases: boolean;
  onChooseProject: (id: string) => void;
  onCreateProject: () => void;
  onReorderProjects: (projectIds: string[]) => Promise<void>;
  onDeleteProject: (project: Project) => Promise<void>;
  onCreateProjectColor: (color: string) => Promise<void>;
  onDeleteProjectColor: (color: ProjectColor) => Promise<void>;
  onReorderProjectColors: (colorIds: string[]) => Promise<void>;
  onImportSoundShow: () => void;
  onOpenFreesound: () => void;
  onOpenWhatsNew: () => void;
  onToggleRemote: () => void;
  onCacheOffline: () => void;
  onUpdateKeyAction: (key: 'escape' | 'backspace' | 'space', action: KeyAction) => void;
  onLogout: () => void;
  onClose: () => void;
}

const keyActions: Array<{ value: KeyAction; label: string }> = [
  { value: 'stop-all', label: 'Arrêter avec les fondus' },
  { value: 'stop-all-immediate', label: 'Arrêter immédiatement' },
  { value: 'none', label: 'Aucune action' },
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  const units = ['Ko', 'Mo', 'Go', 'To'];
  let value = bytes / 1024;
  let unit = units[0];
  for (let index = 1; index < units.length && value >= 1024; index += 1) {
    value /= 1024;
    unit = units[index];
  }
  return `${value >= 10 ? value.toFixed(0) : value.toFixed(1)} ${unit}`;
}

export function SettingsDialog({ user, projects, projectColors, selectedProjectId, offlineStatus, remote, appVersion, hasUnseenReleases, onChooseProject, onCreateProject, onReorderProjects, onDeleteProject, onCreateProjectColor, onDeleteProjectColor, onReorderProjectColors, onImportSoundShow, onOpenFreesound, onOpenWhatsNew, onToggleRemote, onCacheOffline, onUpdateKeyAction, onLogout, onClose }: Props) {
  const selectedProject = projects.find((project) => project.id === selectedProjectId);
  const [newColor, setNewColor] = useState('#f97316');
  const [draggedProjectId, setDraggedProjectId] = useState<string>();
  const [dropProjectId, setDropProjectId] = useState<string>();
  const [dropProjectAfter, setDropProjectAfter] = useState(false);
  const [draggedColorId, setDraggedColorId] = useState<string>();
  const [dropColorId, setDropColorId] = useState<string>();
  const [account, setAccount] = useState<AccountSummary>();

  useEffect(() => {
    api.account().then((result) => setAccount(result.account)).catch(() => setAccount(undefined));
  }, []);

  const storagePercent = account?.storageQuotaBytes
    ? Math.min(100, (account.storageUsedBytes / account.storageQuotaBytes) * 100)
    : 0;
  const trialDaysLeft = account?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(account.trialEndsAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
    : null;

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

  function dropColor(targetId: string) {
    if (!draggedColorId || draggedColorId === targetId) return;
    const moving = projectColors.find((item) => item.id === draggedColorId);
    if (!moving) return;
    const reordered = projectColors.filter((item) => item.id !== draggedColorId);
    const targetIndex = reordered.findIndex((item) => item.id === targetId);
    reordered.splice(Math.max(0, targetIndex), 0, moving);
    onReorderProjectColors(reordered.map((item) => item.id)).catch(() => undefined);
    setDraggedColorId(undefined);
    setDropColorId(undefined);
  }

  return <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="dialog settings-dialog">
      <header><div><p className="eyebrow">S1 · Standby One</p><h2>Paramètres</h2></div><button className="icon-button" onClick={onClose} aria-label="Fermer les paramètres"><X /></button></header>
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
        <div className="settings-section-title"><Palette size={16} /><div><strong>Couleurs du spectacle</strong><span>Ajoutez, supprimez ou glissez les couleurs pour les réordonner.</span></div></div>
        <div className="settings-color-palette">
          {projectColors.map((item) => <div key={item.id} className={`settings-color-chip ${dropColorId === item.id ? 'drop-target' : ''}`} style={{ '--palette-color': item.color } as React.CSSProperties} draggable
            onDragStart={(event) => { event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', item.id); setDraggedColorId(item.id); }}
            onDragOver={(event) => { if (!draggedColorId || draggedColorId === item.id) return; event.preventDefault(); setDropColorId(item.id); }}
            onDragLeave={() => setDropColorId((current) => current === item.id ? undefined : current)}
            onDrop={(event) => { event.preventDefault(); dropColor(item.id); }}
            onDragEnd={() => { setDraggedColorId(undefined); setDropColorId(undefined); }} title={`${item.color} · glisser pour réordonner`}>
            <span />
            <button type="button" onClick={() => { if (window.confirm(`Retirer ${item.color} de la palette ?\n\nLes morceaux qui utilisent cette couleur ne seront pas modifiés.`)) onDeleteProjectColor(item).catch(() => undefined); }} aria-label={`Retirer la couleur ${item.color}`}><X size={11} /></button>
          </div>)}
          {projectColors.length === 0 && <span className="settings-color-empty">Ajoutez votre première couleur.</span>}
        </div>
        <div className="settings-color-add"><input type="color" value={newColor} onChange={(event) => setNewColor(event.target.value)} aria-label="Nouvelle couleur" /><code>{newColor.toUpperCase()}</code><button type="button" className="button ghost" disabled={!selectedProject} onClick={() => onCreateProjectColor(newColor).catch(() => undefined)}><Plus size={16} />Ajouter</button></div>
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
        <div className="settings-section-title"><Keyboard size={16} /><div><strong>Raccourcis clavier</strong><span>Attribuez une action d’arrêt à chaque touche globale.</span></div></div>
        <div className="settings-key-actions">
          <label><span><kbd>Échap</kbd> Touche Échap</span><select value={selectedProject?.escapeKeyAction ?? 'stop-all'} onChange={(event) => onUpdateKeyAction('escape', event.target.value as KeyAction)}>{keyActions.map((action) => <option key={action.value} value={action.value}>{action.label}</option>)}</select></label>
          <label><span><kbd>⌫</kbd> Retour arrière</span><select value={selectedProject?.backspaceKeyAction ?? 'stop-all'} onChange={(event) => onUpdateKeyAction('backspace', event.target.value as KeyAction)}>{keyActions.map((action) => <option key={action.value} value={action.value}>{action.label}</option>)}</select></label>
          <label><span><kbd>Espace</kbd> Barre d’espace</span><select value={selectedProject?.spaceKeyAction ?? 'stop-all-immediate'} onChange={(event) => onUpdateKeyAction('space', event.target.value as KeyAction)}>{keyActions.map((action) => <option key={action.value} value={action.value}>{action.label}</option>)}</select></label>
        </div>
      </section>
      <section className="settings-section">
        <div className="settings-section-title"><HardDrive size={16} /><div><strong>Offre et stockage</strong><span>{account?.name ?? 'Chargement de votre espace…'}</span></div></div>
        {account && <div className="account-plan">
          <div><strong>{account.planCode === 'community' ? 'Community' : account.planCode === 'trial' ? 'Essai Cloud' : account.planCode}</strong><span>{trialDaysLeft !== null ? `${trialDaysLeft} jour${trialDaysLeft > 1 ? 's' : ''} restant${trialDaysLeft > 1 ? 's' : ''}` : 'Accès actif'}</span></div>
          <div className="storage-summary"><span>{formatBytes(account.storageUsedBytes)} utilisés</span><strong>{account.storageQuotaBytes === null ? 'Stockage illimité' : `sur ${formatBytes(account.storageQuotaBytes)}`}</strong></div>
          {account.storageQuotaBytes !== null && <div className="storage-meter" role="progressbar" aria-label="Stockage utilisé" aria-valuemin={0} aria-valuemax={account.storageQuotaBytes} aria-valuenow={account.storageUsedBytes}><i style={{ width: `${storagePercent}%` }} /></div>}
        </div>}
      </section>
      <section className="settings-section">
        <div className="settings-section-title"><BookOpen size={16} /><div><strong>Aide et documentation</strong><span>Guides de prise en main, référence et dépannage.</span></div></div>
        <a className="button ghost wide" href="/docs/" target="_blank" rel="noopener noreferrer"><BookOpen size={17} />Ouvrir la documentation</a>
      </section>
      <section className="settings-section">
        <div className="settings-section-title"><Gift size={16} /><div><strong>Nouveautés</strong><span>Vous utilisez S1 {appVersion ?? '—'}.</span></div></div>
        <button className={`button ghost wide release-button ${hasUnseenReleases ? 'has-update' : ''}`} onClick={onOpenWhatsNew}><Gift size={17} />Voir les notes de version{hasUnseenReleases && <em>Nouveau</em>}</button>
      </section>
      <section className="settings-account">
        <span>{user.displayName.slice(0, 1).toUpperCase()}</span><div><strong>{user.displayName}</strong><small>{user.email}</small></div><button className="button danger" onClick={onLogout}><LogOut size={16} />Se déconnecter</button>
      </section>
    </section>
  </div>;
}
