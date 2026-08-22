import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUpDown, AudioLines, AudioWaveform, CircleCheck, Columns3, Download, GripVertical, History, LoaderCircle, Menu, Plus, Radio,
  RotateCcw, Search, Settings, Settings2, Smartphone, Square, Upload, Waves, Wifi, WifiOff, X,
} from 'lucide-react';
import { io, type Socket } from 'socket.io-client';
import { AuthScreen } from './components/AuthScreen';
import { FreesoundDialog } from './components/FreesoundDialog';
import { SoundShowImportDialog } from './components/SoundShowImportDialog';
import { SettingsDialog } from './components/SettingsDialog';
import { TrackDialog } from './components/TrackDialog';
import { TrackPad } from './components/TrackPad';
import { UploadDialog } from './components/UploadDialog';
import { api, ApiError } from './lib/api';
import { audioEngine, type ActivePlayback } from './lib/audio-engine';
import type { KeyAction, MouseAction, Project, ProjectDetail, RemoteCommand, Track, User } from './types';

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
  const [playbackHistory, setPlaybackHistory] = useState<Map<string, number>>(new Map());
  const [loadedTracks, setLoadedTracks] = useState<Set<string>>(new Set());
  const [preloadProgress, setPreloadProgress] = useState<{ done: number; total: number }>();
  const [categoryWidth, setCategoryWidth] = useState(() => readNumber('soundflow-category-width', 112));
  const [reorderMode, setReorderMode] = useState(false);
  const [draggedTrackId, setDraggedTrackId] = useState<string>();
  const [dropTrackId, setDropTrackId] = useState<string>();
  const [dropCategoryId, setDropCategoryId] = useState<string>();
  const [reordering, setReordering] = useState(false);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [compactLayout, setCompactLayout] = useState(() => window.matchMedia('(max-width: 560px)').matches);
  const [desktopColumns, setDesktopColumns] = useState(() => readNumberRange('soundflow-track-columns', 6, 2, 12));
  const [mobileColumns, setMobileColumns] = useState(() => readNumberRange('soundflow-track-columns-mobile', 2, 1, 3));
  const [uploadOpen, setUploadOpen] = useState(false);
  const [soundShowImportOpen, setSoundShowImportOpen] = useState(false);
  const [freesoundOpen, setFreesoundOpen] = useState(false);
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
  useEffect(() => audioEngine.subscribeHistory(setPlaybackHistory), []);
  useEffect(() => {
    const query = window.matchMedia('(max-width: 560px)');
    const onChange = () => setCompactLayout(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

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
      if (command.type === 'stop-all') {
        window.dispatchEvent(new Event('soundflow:stop-temporary-audio'));
        return audioEngine.stopAll(currentTracks);
      }
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
  const playbacksByTrack = useMemo(() => {
    const grouped = new Map<string, ActivePlayback[]>();
    for (const playback of activePlaybacks) grouped.set(playback.trackId, [...(grouped.get(playback.trackId) ?? []), playback]);
    return grouped;
  }, [activePlaybacks]);
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
  const trackColumns = compactLayout ? mobileColumns : desktopColumns;
  const currentCategory = detail?.categories.find((category) => category.id === selectedCategoryId);

  const sendOrRun = useCallback((command: RemoteCommand, track?: Track) => {
    if (remote && detail) {
      socket?.emit('remote-command', { projectId: detail.project.id, command });
      return;
    }
    if (command.type === 'stop-all') {
      window.dispatchEvent(new Event('soundflow:stop-temporary-audio'));
      audioEngine.stopAll(detail?.tracks ?? []);
    }
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
    if (!detail) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement || event.target instanceof HTMLTextAreaElement || (event.target instanceof HTMLElement && event.target.isContentEditable)) return;
      const keyAction = event.key === 'Escape' ? detail.project.escapeKeyAction ?? 'stop-all'
        : event.key === 'Backspace' ? detail.project.backspaceKeyAction ?? 'stop-all' : undefined;
      if (keyAction) {
        event.preventDefault();
        if (keyAction === 'stop-all') {
          sendOrRun({ type: 'stop-all' });
        }
        return;
      }
      const index = Number(event.key) - 1;
      const track = visibleTracks[index];
      if (index >= 0 && index < 9 && track) sendOrRun({ type: 'play', trackId: track.id }, track);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [detail, sendOrRun, visibleTracks]);

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
      const { project } = await api.updateProjectActions(detail.project.id, input);
      setDetail((current) => current ? { ...current, project } : current);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Configuration impossible.'); }
  }

  async function updateKeyAction(key: 'escape' | 'backspace', action: KeyAction) {
    if (!detail) return;
    const input = key === 'escape' ? { escapeKeyAction: action } : { backspaceKeyAction: action };
    try {
      const { project } = await api.updateProjectActions(detail.project.id, input);
      setDetail((current) => current ? { ...current, project } : current);
      setProjects((current) => current.map((candidate) => candidate.id === project.id ? project : candidate));
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Configuration impossible.'); }
  }

  async function reorderTrack(trackId: string, categoryId: string | null, beforeTrackId?: string) {
    if (!detail || reordering || trackId === beforeTrackId) return;
    const previousTracks = detail.tracks;
    const moving = previousTracks.find((track) => track.id === trackId);
    if (!moving) return;
    const reordered = previousTracks.filter((track) => track.id !== trackId);
    let destinationIndex = beforeTrackId ? reordered.findIndex((track) => track.id === beforeTrackId) : -1;
    if (destinationIndex < 0) destinationIndex = reordered.reduce((last, track, index) => track.categoryId === categoryId ? index + 1 : last, reordered.length);
    reordered.splice(destinationIndex, 0, { ...moving, categoryId });
    const optimistic = reordered.map((track, position) => ({ ...track, position }));
    setDetail((current) => current ? { ...current, tracks: optimistic } : current);
    setReordering(true);
    try {
      const result = await api.reorderTrack(trackId, { categoryId, beforeTrackId });
      setDetail((current) => current ? { ...current, tracks: result.tracks } : current);
      localStorage.setItem(`soundflow-detail:${detail.project.id}`, JSON.stringify({ ...detail, tracks: result.tracks }));
    } catch (cause) {
      setDetail((current) => current ? { ...current, tracks: previousTracks } : current);
      setError(cause instanceof Error ? cause.message : 'Réorganisation impossible.');
    } finally {
      setReordering(false);
      setDraggedTrackId(undefined);
      setDropTrackId(undefined);
      setDropCategoryId(undefined);
    }
  }

  function chooseProject(id: string) {
    audioEngine.stopAll(detail?.tracks ?? []);
    setSelectedProjectId(id);
    setSelectedCategoryId('all');
    setReorderMode(false);
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

  function updateTrackColumns(value: number) {
    if (compactLayout) {
      setMobileColumns(value);
      localStorage.setItem('soundflow-track-columns-mobile', String(value));
    } else {
      setDesktopColumns(value);
      localStorage.setItem('soundflow-track-columns', String(value));
    }
  }

  function resetPlaybackProgress(scope: 'category' | 'project') {
    if (!detail) return;
    const trackIds = scope === 'category' && currentCategory
      ? detail.tracks.filter((track) => track.categoryId === currentCategory.id).map((track) => track.id)
      : detail.tracks.map((track) => track.id);
    audioEngine.resetHistory(trackIds);
    setHistoryOpen(false);
  }

  async function logout() {
    audioEngine.stopAll(detail?.tracks ?? []);
    audioEngine.resetHistory();
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
            {detail.categories.map((category) => <button key={category.id} className={`${!isSearching && category.id === selectedCategoryId ? 'active' : ''} ${dropCategoryId === category.id ? 'is-drop-target' : ''}`} onClick={() => { setSelectedCategoryId(category.id); setSearch(''); }}
              onDragOver={(event) => { if (!reorderMode || !draggedTrackId) return; event.preventDefault(); event.dataTransfer.dropEffect = 'move'; setDropCategoryId(category.id); setDropTrackId(undefined); }}
              onDragLeave={() => setDropCategoryId((current) => current === category.id ? undefined : current)}
              onDrop={(event) => { event.preventDefault(); if (draggedTrackId) reorderTrack(draggedTrackId, category.id).catch(() => undefined); }}
              style={{ '--category-color': category.color } as React.CSSProperties}><span>{category.name}</span><em>{detail.tracks.filter((track) => track.categoryId === category.id).length}</em></button>)}
          </nav>
          <button className="category-resizer" aria-label="Régler la largeur des catégories" title="Glisser pour régler la largeur · Double-cliquer pour réinitialiser"
            onDoubleClick={() => { setCategoryWidth(112); localStorage.setItem('soundflow-category-width', '112'); }}
            onPointerDown={(event) => { categoryResize.current = { x: event.clientX, width: categoryWidth, latest: categoryWidth }; event.currentTarget.setPointerCapture(event.pointerId); }}
            onPointerMove={(event) => { if (!categoryResize.current) return; const next = Math.min(220, Math.max(82, categoryResize.current.width + event.clientX - categoryResize.current.x)); categoryResize.current.latest = next; setCategoryWidth(next); }}
            onPointerUp={(event) => { if (!categoryResize.current) return; event.currentTarget.releasePointerCapture(event.pointerId); localStorage.setItem('soundflow-category-width', String(categoryResize.current.latest)); categoryResize.current = undefined; }}>
            <GripVertical size={17} />
          </button>
        </div>
      </section>}

      <section className="dashboard" aria-label="Tableau de bord des morceaux">
        <label className="search"><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un son…" /><kbd>⌘ K</kbd></label>
        <div className="dashboard-actions">
          {!remote && <button className="dashboard-button freesound-launch" onClick={() => setFreesoundOpen(true)} aria-label="Rechercher sur Freesound" title="Rechercher sur Freesound"><Waves size={18} /></button>}
          {!remote && <button className={`dashboard-button ${preloadedInCategory === tracksToPreload.length && tracksToPreload.length ? 'is-loaded' : ''}`} onClick={() => preloadCategory()} disabled={!tracksToPreload.length || Boolean(preloadProgress) || preloadedInCategory === tracksToPreload.length}
            aria-label={preloadProgress ? `Préchargement ${preloadProgress.done} sur ${preloadProgress.total}` : preloadedInCategory === tracksToPreload.length && tracksToPreload.length ? 'Catégorie préchargée' : 'Précharger la catégorie'} title={preloadProgress ? `${preloadProgress.done}/${preloadProgress.total}` : 'Précharger la catégorie'}>
            {preloadProgress ? <LoaderCircle className="spin" size={18} /> : preloadedInCategory === tracksToPreload.length && tracksToPreload.length ? <CircleCheck size={18} /> : <Download size={18} />}
          </button>}
          {!remote && <button className={`dashboard-button ${reorderMode ? 'active' : ''}`} onClick={() => { setReorderMode((current) => !current); setDraggedTrackId(undefined); setDropTrackId(undefined); setDropCategoryId(undefined); }} disabled={reordering}
            aria-label={reordering ? 'Enregistrement de la réorganisation' : reorderMode ? 'Terminer la réorganisation' : 'Réorganiser les morceaux'} title={reorderMode ? 'Terminer la réorganisation' : 'Réorganiser les morceaux'}><ArrowUpDown size={18} /></button>}
          <div className="dashboard-control">
            <button className={`dashboard-button ${columnsOpen ? 'active' : ''}`} onClick={() => { setColumnsOpen((current) => !current); setHistoryOpen(false); }} aria-label="Régler le nombre de colonnes" title="Nombre de colonnes"><Columns3 size={18} /></button>
            {columnsOpen && <div className="dashboard-popover columns-popover"><label><span>Colonnes</span><strong>{trackColumns}</strong><input type="range" min={compactLayout ? 1 : 2} max={compactLayout ? 3 : 12} value={trackColumns} onChange={(event) => updateTrackColumns(Number(event.target.value))} /></label></div>}
          </div>
          {!remote && <div className="dashboard-control">
            <button className={`dashboard-button ${historyOpen ? 'active' : ''}`} onClick={() => { setHistoryOpen((current) => !current); setColumnsOpen(false); }} aria-label="Réinitialiser les progressions" title="Réinitialiser les progressions"><History size={18} /></button>
            {historyOpen && <div className="dashboard-popover history-popover">
              <button onClick={() => resetPlaybackProgress('category')} disabled={!currentCategory || isSearching}><RotateCcw size={15} /><span><strong>Catégorie actuelle</strong><small>{currentCategory && !isSearching ? currentCategory.name : 'Sélectionnez une catégorie'}</small></span></button>
              <button onClick={() => resetPlaybackProgress('project')}><RotateCcw size={15} /><span><strong>Tout le spectacle</strong><small>{detail?.tracks.length ?? 0} morceaux</small></span></button>
            </div>}
          </div>}
          <div className="track-count"><span>{visibleTracks.length}</span><small>son{visibleTracks.length !== 1 ? 's' : ''}</small></div>
        </div>
      </section>

      <section className="soundboard">
        {remote && <div className="remote-banner"><Radio size={18} /><span>Mode télécommande — les sons seront joués sur la régie connectée.</span></div>}
        {!detail ? <div className="empty-state"><div className="skeleton-grid" /></div> : visibleTracks.length === 0 ? <div className="empty-state"><span className="empty-icon"><AudioLines /></span><h2>{search ? 'Aucun son trouvé' : 'Votre scène attend son premier son'}</h2><p>{search ? 'Essayez une autre recherche ou catégorie.' : 'Importez une musique ou un bruitage pour commencer votre soundboard.'}</p>{!remote && !search && <button className="button primary" onClick={() => setUploadOpen(true)}><Upload size={17} />Importer un son</button>}</div> : <div className="track-grid" style={{ '--track-columns': trackColumns } as React.CSSProperties}>{visibleTracks.map((track, index) => {
          const category = detail.categories.find((item) => item.id === track.categoryId);
          return <TrackPad key={track.id} track={track} color={track.color ?? category?.color ?? '#71717a'} active={activeTrackIds.has(track.id)} playbacks={playbacksByTrack.get(track.id) ?? []} historyProgress={playbackHistory.get(track.id) ?? 0} loaded={loadedTracks.has(track.id)} reorderEnabled={reorderMode} dropTarget={dropTrackId === track.id} shortcut={index < 9 ? index + 1 : undefined}
            onPrimary={() => runTrackAction(detail.project.leftClickAction ?? 'start', track)}
            onSecondary={() => runTrackAction(detail.project.rightClickAction ?? 'crossfade', track)}
            onEdit={() => { if (!reorderMode) setEditingTrack(track); }}
            onDragStart={(event) => { if (!reorderMode) return; event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', track.id); setDraggedTrackId(track.id); }}
            onDragOver={(event) => { if (!reorderMode || !draggedTrackId || draggedTrackId === track.id) return; event.preventDefault(); event.dataTransfer.dropEffect = 'move'; setDropTrackId(track.id); setDropCategoryId(undefined); }}
            onDrop={(event) => { event.preventDefault(); if (draggedTrackId && draggedTrackId !== track.id) reorderTrack(draggedTrackId, track.categoryId, track.id).catch(() => undefined); }}
            onDragEnd={() => { setDraggedTrackId(undefined); setDropTrackId(undefined); setDropCategoryId(undefined); }} />;
        })}</div>}
      </section>

      <footer className="statusbar"><span><i className={connected ? 'live' : ''} />{remote ? 'Contrôleur' : 'Lecteur principal'}</span><span><Settings2 size={14} /> Web Audio · {activePlaybacks.length} actif{activePlaybacks.length !== 1 ? 's' : ''}</span></footer>
    </main>

    {uploadOpen && detail && <UploadDialog projectId={detail.project.id} categories={detail.categories} onClose={() => setUploadOpen(false)} onUploaded={async () => { setUploadOpen(false); await refreshProject(); }} />}
    {settingsOpen && <SettingsDialog user={user} projects={projects} selectedProjectId={selectedProjectId} offlineStatus={offlineStatus} onClose={() => setSettingsOpen(false)} onChooseProject={chooseProject} onCreateProject={createProject} onImportSoundShow={() => { setSettingsOpen(false); setSoundShowImportOpen(true); }} onOpenFreesound={() => { setSettingsOpen(false); setFreesoundOpen(true); }} onCacheOffline={cacheOffline} onUpdateKeyAction={updateKeyAction} onLogout={() => { setSettingsOpen(false); logout().catch((cause) => setError(cause instanceof Error ? cause.message : 'Déconnexion impossible.')); }} />}
    {soundShowImportOpen && <SoundShowImportDialog onClose={() => setSoundShowImportOpen(false)} onImported={async (projectId) => { setSoundShowImportOpen(false); await loadProjects(); chooseProject(projectId); }} />}
    {freesoundOpen && detail && <FreesoundDialog initialQuery={search} projectId={detail.project.id} categories={detail.categories} defaultCategoryId={!isSearching && selectedCategoryId !== 'all' ? selectedCategoryId : undefined} nextPosition={detail.tracks.length} onImported={refreshProject} onClose={() => setFreesoundOpen(false)} />}
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
  return Number.isFinite(value) ? Math.min(220, Math.max(82, value)) : fallback;
}

function readNumberRange(key: string, fallback: number, min: number, max: number): number {
  const stored = localStorage.getItem(key);
  if (stored === null) return fallback;
  const value = Number(stored);
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}
