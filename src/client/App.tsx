import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AudioLines, CloudDownload, FileArchive, FolderPlus, LogOut, Menu, Plus, Radio,
  Search, Settings2, Smartphone, Square, Upload, Wifi, WifiOff, X,
} from 'lucide-react';
import { io, type Socket } from 'socket.io-client';
import { AuthScreen } from './components/AuthScreen';
import { SoundShowImportDialog } from './components/SoundShowImportDialog';
import { TrackDialog } from './components/TrackDialog';
import { TrackPad } from './components/TrackPad';
import { UploadDialog } from './components/UploadDialog';
import { api, ApiError } from './lib/api';
import { audioEngine } from './lib/audio-engine';
import type { Project, ProjectDetail, RemoteCommand, Track, User } from './types';

const colors = ['#f97316', '#8b5cf6', '#06b6d4', '#ec4899', '#22c55e', '#eab308'];

export default function App() {
  const [user, setUser] = useState<User | null>();
  const [projects, setProjects] = useState<Project[]>([]);
  const [detail, setDetail] = useState<ProjectDetail>();
  const [selectedProjectId, setSelectedProjectId] = useState(localStorage.getItem('soundflow-project'));
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [activeTracks, setActiveTracks] = useState<Set<string>>(new Set());
  const [uploadOpen, setUploadOpen] = useState(false);
  const [soundShowImportOpen, setSoundShowImportOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState<Track>();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [socket, setSocket] = useState<Socket>();
  const [connected, setConnected] = useState(false);
  const [offlineStatus, setOfflineStatus] = useState('');
  const [error, setError] = useState('');
  const remote = new URLSearchParams(window.location.search).get('remote') === '1';

  useEffect(() => audioEngine.subscribe(setActiveTracks), []);

  useEffect(() => {
    api.me().then(({ user: current }) => {
      localStorage.setItem('soundflow-user', JSON.stringify(current));
      setUser(current);
    }).catch((cause) => {
      if (cause instanceof ApiError && cause.status === 401) {
        localStorage.removeItem('soundflow-user');
        setUser(null);
      } else {
        const cached = readCache<User>('soundflow-user');
        if (cached) setUser(cached);
        else { setError('Le serveur est indisponible.'); setUser(null); }
      }
    });
  }, []);

  const loadProjects = useCallback(async () => {
    let result: { projects: Project[] };
    try {
      result = await api.projects();
      localStorage.setItem('soundflow-projects', JSON.stringify(result));
    } catch (cause) {
      const cached = readCache<{ projects: Project[] }>('soundflow-projects');
      if (!cached) throw cause;
      result = cached;
    }
    setProjects(result.projects);
    setSelectedProjectId((current) => {
      const next = result.projects.some((project) => project.id === current) ? current : result.projects[0]?.id ?? null;
      if (next) localStorage.setItem('soundflow-project', next);
      return next;
    });
  }, []);

  useEffect(() => { if (user) loadProjects().catch((cause) => setError(cause.message)); }, [user, loadProjects]);

  const refreshProject = useCallback(async () => {
    if (!selectedProjectId) return;
    let result: ProjectDetail;
    try {
      result = await api.project(selectedProjectId);
      localStorage.setItem(`soundflow-detail:${selectedProjectId}`, JSON.stringify(result));
    } catch (cause) {
      const cached = readCache<ProjectDetail>(`soundflow-detail:${selectedProjectId}`);
      if (!cached) throw cause;
      result = cached;
    }
    setDetail(result);
  }, [selectedProjectId]);

  useEffect(() => { refreshProject().catch((cause) => setError(cause.message)); }, [refreshProject]);

  useEffect(() => {
    if (!selectedProjectId || !user) return;
    const connection = io({ withCredentials: true });
    setSocket(connection);
    connection.on('connect', () => {
      setConnected(true);
      connection.emit('join-project', { projectId: selectedProjectId, role: remote ? 'controller' : 'player' });
    });
    connection.on('disconnect', () => setConnected(false));
    if (!remote) connection.on('remote-command', (command: RemoteCommand) => {
      const currentTracks = detail?.tracks ?? [];
      if (command.type === 'stop-all') return audioEngine.stopAll(currentTracks);
      const track = currentTracks.find((candidate) => candidate.id === command.trackId);
      if (!track) return;
      if (command.type === 'play') audioEngine.play(track).catch((cause) => setError(cause.message));
      else audioEngine.stop(track.id, track.fadeOutMs);
    });
    return () => { connection.disconnect(); setSocket(undefined); setConnected(false); };
  }, [selectedProjectId, user, remote, detail?.tracks]);

  const visibleTracks = useMemo(() => (detail?.tracks ?? []).filter((track) => {
    const inCategory = selectedCategoryId === 'all' || track.categoryId === selectedCategoryId;
    const matches = track.title.toLowerCase().includes(search.toLowerCase()) || track.originalFilename.toLowerCase().includes(search.toLowerCase());
    return inCategory && matches;
  }), [detail?.tracks, search, selectedCategoryId]);

  const sendOrRun = useCallback((command: RemoteCommand, track?: Track) => {
    if (remote && detail) {
      socket?.emit('remote-command', { projectId: detail.project.id, command });
      return;
    }
    if (command.type === 'stop-all') audioEngine.stopAll(detail?.tracks ?? []);
    else if (command.type === 'stop' && track) audioEngine.stop(track.id, track.fadeOutMs);
    else if (command.type === 'play' && track) audioEngine.play(track).catch((cause) => setError(cause.message));
  }, [detail, remote, socket]);

  useEffect(() => {
    if (remote || !detail) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) return;
      if (event.key === 'Escape') sendOrRun({ type: 'stop-all' });
      const index = Number(event.key) - 1;
      const track = visibleTracks[index];
      if (index >= 0 && index < 9 && track) sendOrRun({ type: 'play', trackId: track.id }, track);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [detail, remote, sendOrRun, visibleTracks]);

  async function createProject() {
    const name = window.prompt('Nom du nouveau spectacle');
    if (!name?.trim()) return;
    try {
      const { project } = await api.createProject(name);
      await loadProjects();
      chooseProject(project.id);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Création impossible.'); }
  }

  async function createCategory() {
    if (!detail) return;
    const name = window.prompt('Nom de la catégorie');
    if (!name?.trim()) return;
    try {
      await api.createCategory(detail.project.id, name, colors[detail.categories.length % colors.length]);
      await refreshProject();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Création impossible.'); }
  }

  function chooseProject(id: string) {
    audioEngine.stopAll(detail?.tracks ?? []);
    setSelectedProjectId(id);
    setSelectedCategoryId('all');
    setSidebarOpen(false);
    localStorage.setItem('soundflow-project', id);
  }

  async function cacheOffline() {
    if (!detail || !('caches' in window)) return setOfflineStatus('Cache indisponible dans ce navigateur.');
    setOfflineStatus(`0/${detail.tracks.length}`);
    try {
      const cache = await caches.open('soundflow-audio-v1');
      let done = 0;
      for (const track of detail.tracks) {
        const request = new Request(`/api/tracks/${track.id}/stream`, { credentials: 'include' });
        const response = await fetch(request);
        if (!response.ok) throw new Error(track.title);
        await cache.put(request, response);
        done += 1;
        setOfflineStatus(`${done}/${detail.tracks.length}`);
      }
      setOfflineStatus('Projet disponible hors ligne');
    } catch { setOfflineStatus('Téléchargement interrompu'); }
  }

  async function logout() {
    audioEngine.stopAll(detail?.tracks ?? []);
    await api.logout();
    await caches.delete('soundflow-audio-v1').catch(() => false);
    for (const key of Object.keys(localStorage)) if (key.startsWith('soundflow-')) localStorage.removeItem(key);
    setUser(null); setDetail(undefined); setProjects([]);
  }

  if (user === undefined) return <div className="app-loader"><AudioLines className="pulse" size={42} /><span>SoundFlow</span></div>;
  if (!user) return <><AuthScreen onAuthenticated={(authenticated) => { localStorage.setItem('soundflow-user', JSON.stringify(authenticated)); setUser(authenticated); }} />{error && <Toast message={error} onClose={() => setError('')} />}</>;

  return <div className={`app-shell ${remote ? 'remote-mode' : ''}`}>
    <aside className={sidebarOpen ? 'sidebar open' : 'sidebar'}>
      <header className="brand"><span className="brand-mark small"><AudioLines /></span><strong>SoundFlow</strong><button className="icon-button sidebar-close" onClick={() => setSidebarOpen(false)}><X /></button></header>
      <div className="side-label"><span>Spectacles</span><button onClick={createProject} aria-label="Nouveau spectacle"><FolderPlus size={17} /></button></div>
      <nav className="project-list">
        {projects.map((project) => <button key={project.id} className={project.id === selectedProjectId ? 'active' : ''} onClick={() => chooseProject(project.id)}><span>{project.name.slice(0, 1).toUpperCase()}</span>{project.name}</button>)}
      </nav>
      {detail && <>
        <div className="side-label category-heading"><span>Catégories</span><button onClick={createCategory} aria-label="Nouvelle catégorie"><Plus size={17} /></button></div>
        <nav className="category-list">
          <button className={selectedCategoryId === 'all' ? 'active' : ''} onClick={() => { setSelectedCategoryId('all'); setSidebarOpen(false); }}><i className="all-dot" />Tous les sons <em>{detail.tracks.length}</em></button>
          {detail.categories.map((category) => <button key={category.id} className={category.id === selectedCategoryId ? 'active' : ''} onClick={() => { setSelectedCategoryId(category.id); setSidebarOpen(false); }}><i style={{ background: category.color }} />{category.name}<em>{detail.tracks.filter((track) => track.categoryId === category.id).length}</em></button>)}
        </nav>
      </>}
      <footer className="sidebar-footer"><button onClick={cacheOffline}><CloudDownload size={18} /><span>{offlineStatus || 'Disponible hors ligne'}</span></button><button onClick={logout}><LogOut size={18} /><span>Se déconnecter</span></button><div className="user-chip"><span>{user.displayName.slice(0, 1).toUpperCase()}</span><div><strong>{user.displayName}</strong><small>{user.email}</small></div></div></footer>
    </aside>
    {sidebarOpen && <button className="sidebar-scrim" onClick={() => setSidebarOpen(false)} aria-label="Fermer le menu" />}

    <main className="workspace">
      <header className="topbar">
        <button className="icon-button menu-button" onClick={() => setSidebarOpen(true)}><Menu /></button>
        <div><p className="eyebrow">{remote ? 'Télécommande' : 'Régie principale'}</p><h1>{detail?.project.name ?? 'Chargement…'}</h1></div>
        <div className="top-actions">
          <span className={`connection ${connected ? 'online' : ''}`}>{connected ? <Wifi size={15} /> : <WifiOff size={15} />}{connected ? 'Synchronisé' : 'Hors connexion'}</span>
          <button className="button ghost remote-button" onClick={() => {
            const url = new URL(window.location.href);
            if (remote) url.searchParams.delete('remote'); else url.searchParams.set('remote', '1');
            window.location.href = url.toString();
          }}>{remote ? <Radio size={17} /> : <Smartphone size={17} />}{remote ? 'Ouvrir la régie' : 'Télécommande'}</button>
          {!remote && <button className="button ghost import-button" onClick={() => setSoundShowImportOpen(true)}><FileArchive size={17} />Importer SoundShow</button>}
          {!remote && <button className="button primary" onClick={() => setUploadOpen(true)}><Upload size={17} />Ajouter un son</button>}
        </div>
      </header>

      <section className="toolbar">
        <label className="search"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un son…" /><kbd>⌘ K</kbd></label>
        <div className="track-count"><span>{visibleTracks.length}</span> son{visibleTracks.length !== 1 ? 's' : ''}</div>
        <button className="button stop" onClick={() => sendOrRun({ type: 'stop-all' })}><Square size={15} fill="currentColor" />Tout arrêter <kbd>Échap</kbd></button>
      </section>

      <section className="soundboard">
        {remote && <div className="remote-banner"><Radio size={18} /><span>Mode télécommande — les sons seront joués sur la régie connectée.</span></div>}
        {!detail ? <div className="empty-state"><div className="skeleton-grid" /></div> : visibleTracks.length === 0 ? <div className="empty-state"><span className="empty-icon"><AudioLines /></span><h2>{search ? 'Aucun son trouvé' : 'Votre scène attend son premier son'}</h2><p>{search ? 'Essayez une autre recherche ou catégorie.' : 'Importez une musique ou un bruitage pour commencer votre soundboard.'}</p>{!remote && !search && <button className="button primary" onClick={() => setUploadOpen(true)}><Upload size={17} />Importer un son</button>}</div> : <div className="track-grid">{visibleTracks.map((track, index) => {
          const category = detail.categories.find((item) => item.id === track.categoryId);
          return <TrackPad key={track.id} track={track} color={track.color ?? category?.color ?? '#71717a'} active={activeTracks.has(track.id)} remote={remote} shortcut={index < 9 ? index + 1 : undefined}
            onPlay={() => sendOrRun({ type: 'play', trackId: track.id }, track)}
            onStop={() => sendOrRun({ type: 'stop', trackId: track.id }, track)}
            onEdit={() => setEditingTrack(track)} />;
        })}</div>}
      </section>

      <footer className="statusbar"><span><i className={connected ? 'live' : ''} />{remote ? 'Contrôleur' : 'Lecteur principal'}</span><span><Settings2 size={14} /> Web Audio · {activeTracks.size} actif{activeTracks.size !== 1 ? 's' : ''}</span></footer>
    </main>

    {uploadOpen && detail && <UploadDialog projectId={detail.project.id} categories={detail.categories} onClose={() => setUploadOpen(false)} onUploaded={async () => { setUploadOpen(false); await refreshProject(); }} />}
    {soundShowImportOpen && <SoundShowImportDialog onClose={() => setSoundShowImportOpen(false)} onImported={async (projectId) => { setSoundShowImportOpen(false); await loadProjects(); chooseProject(projectId); }} />}
    {editingTrack && detail && <TrackDialog track={editingTrack} categories={detail.categories} onClose={() => setEditingTrack(undefined)} onChanged={async () => { setEditingTrack(undefined); await refreshProject(); }} />}
    {error && <Toast message={error} onClose={() => setError('')} />}
  </div>;
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => { const timer = window.setTimeout(onClose, 5000); return () => window.clearTimeout(timer); }, [onClose]);
  return <div className="toast"><span>{message}</span><button onClick={onClose}><X size={16} /></button></div>;
}

function readCache<T>(key: string): T | undefined {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) as T : undefined;
  } catch {
    return undefined;
  }
}
