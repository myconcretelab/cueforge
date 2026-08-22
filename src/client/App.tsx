import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AudioLines, AudioWaveform, CircleCheck, Download, GripVertical, LoaderCircle, Menu, Plus, Radio,
  Search, Settings, Settings2, Smartphone, Square, Upload, Wifi, WifiOff, X,
} from 'lucide-react';
import { io, type Socket } from 'socket.io-client';
import { AuthScreen } from './components/AuthScreen';
import { SoundShowImportDialog } from './components/SoundShowImportDialog';
import { SettingsDialog } from './components/SettingsDialog';
import { TrackDialog } from './components/TrackDialog';
import { TrackPad } from './components/TrackPad';
import { UploadDialog } from './components/UploadDialog';
import { api, ApiError } from './lib/api';
import { audioEngine, type ActivePlayback } from './lib/audio-engine';
import type { MouseAction, Project, ProjectDetail, RemoteCommand, Track, User } from './types';

const colors = ['#f97316', '#8b5cf6', '#06b6d4', '#ec4899', '#22c55e', '#eab308'];
const mouseActions: Array<{ value: MouseAction; label: string }> = [
  { value: 'start', label: 'Démarrer' },
  { value: 'crossfade', label: 'Fondu enchaîné' },
  { value: 'fade-in', label: "Fondu d'entrée" },
  { value: 'replace', label: 'Remplacer' },
  { value: 'stop', label: 'Arrêter' },
  { value: 'none', label: 'Aucune action' },
];

export default function App() {
  const [user, setUser] = useState<User | null>();
  const [projects, setProjects] = useState<Project[]>([]);
  const [detail, setDetail] = useState<ProjectDetail>();
  const [selectedProjectId, setSelectedProjectId] = useState(localStorage.getItem('soundflow-project'));
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [activePlaybacks, setActivePlaybacks] = useState<ActivePlayback[]>([]);
  const [loadedTracks, setLoadedTracks] = useState<Set<string>>(new Set());
  const [preloadProgress, setPreloadProgress] = useState<{ done: number; total: number }>();
  const [categoryWidth, setCategoryWidth] = useState(() => readNumber('soundflow-category-width', 92));
  const [uploadOpen, setUploadOpen] = useState(false);
  const [soundShowImportOpen, setSoundShowImportOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState<Track>();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [socket, setSocket] = useState<Socket>();
  const [connected, setConnected] = useState(false);
  const [offlineStatus, setOfflineStatus] = useState('');
  const [error, setError] = useState('');
  const categoryResize = useRef<{ x: number; width: number; latest: number } | undefined>(undefined);
  const remote = new URLSearchParams(window.location.search).get('remote') === '1';

  useEffect(() => audioEngine.subscribe(setActivePlaybacks), []);
  useEffect(() => audioEngine.subscribeCache(setLoadedTracks), []);

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
      if (command.type === 'run-action') audioEngine.runAction(command.action, track, currentTracks).catch((cause) => setError(cause.message));
      else if (command.type === 'play') audioEngine.play(track).catch((cause) => setError(cause.message));
      else audioEngine.stop(track.id, track.fadeOutMs);
    });
    return () => { connection.disconnect(); setSocket(undefined); setConnected(false); };
  }, [selectedProjectId, user, remote, detail?.tracks]);

  const normalizedSearch = search.trim().toLocaleLowerCase('fr');
  const isSearching = normalizedSearch.length > 0;
  const visibleTracks = useMemo(() => (detail?.tracks ?? []).filter((track) => {
    const inCategory = isSearching || selectedCategoryId === 'all' || track.categoryId === selectedCategoryId;
    const matches = track.title.toLocaleLowerCase('fr').includes(normalizedSearch) || track.originalFilename.toLocaleLowerCase('fr').includes(normalizedSearch);
    return inCategory && matches;
  }), [detail?.tracks, isSearching, normalizedSearch, selectedCategoryId]);
  const activeTrackIds = useMemo(() => new Set(activePlaybacks.map((playback) => playback.trackId)), [activePlaybacks]);
  const playingTracks = useMemo(() => {
    const occurrences = new Map<string, number>();
    return activePlaybacks.flatMap((playback) => {
      const track = detail?.tracks.find((candidate) => candidate.id === playback.trackId);
      if (!track) return [];
      const occurrence = (occurrences.get(track.id) ?? 0) + 1;
      occurrences.set(track.id, occurrence);
      return [{ playback, track, occurrence }];
    });
  }, [activePlaybacks, detail?.tracks]);
  const tracksToPreload = useMemo(() => {
    if (!detail) return [];
    if (isSearching || selectedCategoryId === 'all') return detail.tracks;
    return detail.tracks.filter((track) => track.categoryId === selectedCategoryId);
  }, [detail, isSearching, selectedCategoryId]);
  const preloadedInCategory = tracksToPreload.filter((track) => loadedTracks.has(track.id)).length;

  const sendOrRun = useCallback((command: RemoteCommand, track?: Track) => {
    if (remote && detail) {
      socket?.emit('remote-command', { projectId: detail.project.id, command });
      return;
    }
    if (command.type === 'stop-all') audioEngine.stopAll(detail?.tracks ?? []);
    else if (command.type === 'stop' && track) audioEngine.stop(track.id, track.fadeOutMs);
    else if (command.type === 'play' && track) audioEngine.play(track).catch((cause) => setError(cause.message));
  }, [detail, remote, socket]);

  const runTrackAction = useCallback((action: MouseAction, track: Track) => {
    if (action === 'none') return;
    if (remote && detail) {
      socket?.emit('remote-command', { projectId: detail.project.id, command: { type: 'run-action', trackId: track.id, action } satisfies RemoteCommand });
      return;
    }
    audioEngine.runAction(action, track, detail?.tracks ?? []).catch((cause) => setError(cause.message));
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

  async function updateMouseAction(side: 'left' | 'right', action: MouseAction) {
    if (!detail) return;
    const input = side === 'left' ? { leftClickAction: action } : { rightClickAction: action };
    try {
      const { project } = await api.updateMouseActions(detail.project.id, input);
      setDetail((current) => current ? { ...current, project } : current);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Configuration impossible.'); }
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

  async function preloadCategory() {
    const remaining = tracksToPreload.filter((track) => !loadedTracks.has(track.id));
    if (!remaining.length) return;
    setPreloadProgress({ done: tracksToPreload.length - remaining.length, total: tracksToPreload.length });
    let done = tracksToPreload.length - remaining.length;
    try {
      for (let index = 0; index < remaining.length; index += 3) {
        const batch = remaining.slice(index, index + 3);
        await Promise.all(batch.map((track) => audioEngine.preload(track)));
        done += batch.length;
        setPreloadProgress({ done, total: tracksToPreload.length });
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Préchargement interrompu.');
    } finally {
      setPreloadProgress(undefined);
    }
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
      {detail && <section className="mouse-actions">
        <div className="side-label"><span>Actions souris</span></div>
        <label><span><i>G</i>Clic gauche</span><select value={detail.project.leftClickAction ?? 'start'} onChange={(event) => updateMouseAction('left', event.target.value as MouseAction)}>{mouseActions.map((action) => <option key={action.value} value={action.value}>{action.label}</option>)}</select></label>
        <label><span><i>D</i>Clic droit</span><select value={detail.project.rightClickAction ?? 'crossfade'} onChange={(event) => updateMouseAction('right', event.target.value as MouseAction)}>{mouseActions.map((action) => <option key={action.value} value={action.value}>{action.label}</option>)}</select></label>
      </section>}
      <div className="side-label player-heading"><span>En lecture</span><em>{playingTracks.length}</em>{playingTracks.length > 0 && <button onClick={() => sendOrRun({ type: 'stop-all' })} aria-label="Tout arrêter"><Square size={13} fill="currentColor" /></button>}</div>
      <div className="now-playing-list">
        {playingTracks.length === 0 ? <div className="players-empty"><AudioWaveform size={24} /><strong>Aucun son en lecture</strong><span>Les lecteurs actifs apparaîtront ici.</span></div> : playingTracks.map(({ playback, track, occurrence }) => {
          const category = detail?.categories.find((item) => item.id === track.categoryId);
          const color = track.color ?? category?.color ?? '#71717a';
          return <article className="player-card" key={playback.id} style={{ '--track-color': color } as React.CSSProperties}>
            <div className="player-card-signal"><i /><i /><i /><i /></div>
            <button onClick={() => audioEngine.stopInstance(playback.id, track.fadeOutMs)} aria-label={`Arrêter cette lecture de ${track.title}`}><Square size={13} fill="currentColor" /></button>
            <strong>{track.title}</strong>
            <span>{category?.name ?? 'Sans catégorie'}{occurrence > 1 ? ` · Lecture ${occurrence}` : ''}{track.loop ? ' · Boucle' : ''}</span>
          </article>;
        })}
      </div>
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
          <button className="icon-button settings-button" onClick={() => setSettingsOpen(true)} aria-label="Ouvrir les paramètres" title="Paramètres"><Settings size={19} /></button>
          {!remote && <button className="button primary" onClick={() => setUploadOpen(true)}><Upload size={17} />Ajouter un son</button>}
        </div>
      </header>

      {detail && <section className="category-strip">
        <div className="category-strip-heading"><span>Catégories</span><button className="icon-button subtle" onClick={createCategory} aria-label="Nouvelle catégorie"><Plus size={17} /></button></div>
        <div className="category-tabs-row" style={{ '--category-tab-width': `${categoryWidth}px` } as React.CSSProperties}>
          <nav className="category-tabs" aria-label="Catégories de sons">
            <button className={selectedCategoryId === 'all' || isSearching ? 'active' : ''} onClick={() => { setSelectedCategoryId('all'); setSearch(''); }} style={{ '--category-color': '#a1a1aa' } as React.CSSProperties}><span>Tous les sons</span><em>{detail.tracks.length}</em></button>
            {detail.categories.map((category) => <button key={category.id} className={!isSearching && category.id === selectedCategoryId ? 'active' : ''} onClick={() => { setSelectedCategoryId(category.id); setSearch(''); }} style={{ '--category-color': category.color } as React.CSSProperties}><span>{category.name}</span><em>{detail.tracks.filter((track) => track.categoryId === category.id).length}</em></button>)}
          </nav>
          <button className="category-resizer" aria-label="Régler la largeur des catégories" title="Glisser pour régler la largeur · Double-cliquer pour réinitialiser"
            onDoubleClick={() => { setCategoryWidth(92); localStorage.setItem('soundflow-category-width', '92'); }}
            onPointerDown={(event) => { categoryResize.current = { x: event.clientX, width: categoryWidth, latest: categoryWidth }; event.currentTarget.setPointerCapture(event.pointerId); }}
            onPointerMove={(event) => { if (!categoryResize.current) return; const next = Math.min(190, Math.max(66, categoryResize.current.width + event.clientX - categoryResize.current.x)); categoryResize.current.latest = next; setCategoryWidth(next); }}
            onPointerUp={(event) => { if (!categoryResize.current) return; event.currentTarget.releasePointerCapture(event.pointerId); localStorage.setItem('soundflow-category-width', String(categoryResize.current.latest)); categoryResize.current = undefined; }}>
            <GripVertical size={17} />
          </button>
        </div>
      </section>}

      <section className="toolbar">
        <div className="search-group">
          <label className="search"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un son…" /><kbd>⌘ K</kbd></label>
          {!remote && <button className={`button preload ${preloadedInCategory === tracksToPreload.length && tracksToPreload.length ? 'is-loaded' : ''}`} onClick={() => preloadCategory()} disabled={!tracksToPreload.length || Boolean(preloadProgress) || preloadedInCategory === tracksToPreload.length} title="Précharger les sons de la catégorie affichée">
            {preloadProgress ? <LoaderCircle className="spin" size={16} /> : preloadedInCategory === tracksToPreload.length && tracksToPreload.length ? <CircleCheck size={16} /> : <Download size={16} />}
            <span>{preloadProgress ? `${preloadProgress.done}/${preloadProgress.total}` : preloadedInCategory === tracksToPreload.length && tracksToPreload.length ? 'Préchargée' : 'Précharger'}</span>
          </button>}
        </div>
        <div className="track-count"><span>{visibleTracks.length}</span> son{visibleTracks.length !== 1 ? 's' : ''}</div>
        <button className="button stop" onClick={() => sendOrRun({ type: 'stop-all' })}><Square size={15} fill="currentColor" />Tout arrêter <kbd>Échap</kbd></button>
      </section>

      <section className="soundboard">
        {remote && <div className="remote-banner"><Radio size={18} /><span>Mode télécommande — les sons seront joués sur la régie connectée.</span></div>}
        {!detail ? <div className="empty-state"><div className="skeleton-grid" /></div> : visibleTracks.length === 0 ? <div className="empty-state"><span className="empty-icon"><AudioLines /></span><h2>{search ? 'Aucun son trouvé' : 'Votre scène attend son premier son'}</h2><p>{search ? 'Essayez une autre recherche ou catégorie.' : 'Importez une musique ou un bruitage pour commencer votre soundboard.'}</p>{!remote && !search && <button className="button primary" onClick={() => setUploadOpen(true)}><Upload size={17} />Importer un son</button>}</div> : <div className="track-grid">{visibleTracks.map((track, index) => {
          const category = detail.categories.find((item) => item.id === track.categoryId);
          return <TrackPad key={track.id} track={track} color={track.color ?? category?.color ?? '#71717a'} active={activeTrackIds.has(track.id)} loaded={loadedTracks.has(track.id)} shortcut={index < 9 ? index + 1 : undefined}
            onPrimary={() => runTrackAction(detail.project.leftClickAction ?? 'start', track)}
            onSecondary={() => runTrackAction(detail.project.rightClickAction ?? 'crossfade', track)}
            onEdit={() => setEditingTrack(track)} />;
        })}</div>}
      </section>

      <footer className="statusbar"><span><i className={connected ? 'live' : ''} />{remote ? 'Contrôleur' : 'Lecteur principal'}</span><span><Settings2 size={14} /> Web Audio · {activePlaybacks.length} actif{activePlaybacks.length !== 1 ? 's' : ''}</span></footer>
    </main>

    {uploadOpen && detail && <UploadDialog projectId={detail.project.id} categories={detail.categories} onClose={() => setUploadOpen(false)} onUploaded={async () => { setUploadOpen(false); await refreshProject(); }} />}
    {settingsOpen && <SettingsDialog user={user} projects={projects} selectedProjectId={selectedProjectId} offlineStatus={offlineStatus} onClose={() => setSettingsOpen(false)} onChooseProject={chooseProject} onCreateProject={createProject} onImportSoundShow={() => { setSettingsOpen(false); setSoundShowImportOpen(true); }} onCacheOffline={cacheOffline} onLogout={() => { setSettingsOpen(false); logout().catch((cause) => setError(cause instanceof Error ? cause.message : 'Déconnexion impossible.')); }} />}
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

function readNumber(key: string, fallback: number): number {
  const stored = localStorage.getItem(key);
  if (stored === null) return fallback;
  const value = Number(stored);
  return Number.isFinite(value) ? Math.min(190, Math.max(66, value)) : fallback;
}
