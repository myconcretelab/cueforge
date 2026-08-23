import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUpDown, AudioLines, AudioWaveform, CircleCheck, Clock3, Columns3, Download, GripVertical, History, ListMusic, ListPlus, LoaderCircle, Menu, Move, Pause, Play, Plus, Radio,
  RefreshCcw, Repeat2, RotateCcw, Search, Settings, Settings2, Square, SquareDashed, Timer, Trash2, Upload, Volume2, VolumeX, Waves, Wifi, WifiOff, X,
} from 'lucide-react';
import { io, type Socket } from 'socket.io-client';
import { AuthScreen } from './components/AuthScreen';
import { FreesoundDialog } from './components/FreesoundDialog';
import { PlaylistPad } from './components/PlaylistPad';
import { PlaylistPanel, type PlaylistOptions, type PlaylistQueueItem } from './components/PlaylistPanel';
import { SoundShowImportDialog } from './components/SoundShowImportDialog';
import { SettingsDialog } from './components/SettingsDialog';
import { TrackDialog } from './components/TrackDialog';
import { TrackPad } from './components/TrackPad';
import { UploadDialog } from './components/UploadDialog';
import { api, ApiError } from './lib/api';
import { audioEngine, playbackVolumeAt, type ActivePlayback } from './lib/audio-engine';
import { isSupportedAudioFile, titleFromAudioFilename } from './lib/file-import';
import { cachedTrackIds, cacheTrackOffline, deleteCachedTracks, deleteOfflineAudio } from './lib/offline-audio';
import { parseStopwatchState, resolveCategoryId } from './lib/session-state';
import type { Category, KeyAction, MouseAction, Playlist, Project, ProjectColor, ProjectDetail, RemoteCommand, Track, User } from './types';

const colors = ['#f97316', '#8b5cf6', '#06b6d4', '#ec4899', '#22c55e', '#eab308'];
const mouseActions: Array<{ value: MouseAction; label: string }> = [
  { value: 'start', label: 'Démarrer' },
  { value: 'crossfade', label: 'Fondu enchaîné' },
  { value: 'fade-in', label: "Fondu d'entrée" },
  { value: 'replace', label: 'Remplacer' },
  { value: 'stop', label: 'Arrêter' },
  { value: 'none', label: 'Aucune action' },
];
const clockFormatter = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

export default function App() {
  const [user, setUser] = useState<User | null>();
  const [projects, setProjects] = useState<Project[]>([]);
  const [detail, setDetail] = useState<ProjectDetail>();
  const [selectedProjectId, setSelectedProjectId] = useState(localStorage.getItem('soundflow-project'));
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [activePlaybacks, setActivePlaybacks] = useState<ActivePlayback[]>([]);
  const [playbackHistory, setPlaybackHistory] = useState<Map<string, number>>(new Map());
  const [offlineTrackIds, setOfflineTrackIds] = useState<Set<string>>(new Set());
  const [preloadProgress, setPreloadProgress] = useState<{ done: number; total: number }>();
  const [fileDropActive, setFileDropActive] = useState(false);
  const [dropUploadProgress, setDropUploadProgress] = useState<{ done: number; total: number; filename: string }>();
  const [categoryWidth, setCategoryWidth] = useState(() => readNumber('soundflow-category-width', 112));
  const [reorderMode, setReorderMode] = useState(false);
  const [draggedTrackId, setDraggedTrackId] = useState<string>();
  const [dropTrackId, setDropTrackId] = useState<string>();
  const [dropCategoryId, setDropCategoryId] = useState<string>();
  const [draggedPlaylistId, setDraggedPlaylistId] = useState<string>();
  const [dropPlaylistId, setDropPlaylistId] = useState<string>();
  const [dropPlaylistTrackId, setDropPlaylistTrackId] = useState<string>();
  const [dropPlaylistAfter, setDropPlaylistAfter] = useState(false);
  const [categoryManageMode, setCategoryManageMode] = useState(false);
  const [draggedCategoryId, setDraggedCategoryId] = useState<string>();
  const [dropCategoryOrderId, setDropCategoryOrderId] = useState<string>();
  const [dropCategoryAfter, setDropCategoryAfter] = useState(false);
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
  const [sidebarTool, setSidebarTool] = useState<'playlist'>();
  const [playlistItems, setPlaylistItems] = useState<PlaylistQueueItem[]>([]);
  const [playlistOptions, setPlaylistOptions] = useState<PlaylistOptions>({ name: 'Nouvelle playlist', color: '#8b5cf6', autostart: false, loop: false, random: false, gapMs: 0, crossfadeMs: 0 });
  const [playlistOptionsOpen, setPlaylistOptionsOpen] = useState(false);
  const [loadedPlaylistId, setLoadedPlaylistId] = useState<string>();
  const [playlistCurrentIndex, setPlaylistCurrentIndex] = useState(0);
  const [playlistPlaybackId, setPlaylistPlaybackId] = useState<string>();
  const [playlistSaving, setPlaylistSaving] = useState(false);
  const [socket, setSocket] = useState<Socket>();
  const [connected, setConnected] = useState(false);
  const [offlineStatus, setOfflineStatus] = useState('');
  const [error, setError] = useState('');
  const [nextTrackVolume, setNextTrackVolume] = useState(() => readNumberRange('soundflow-next-volume', 100, 0, 100));
  const [keepNextTrackVolume, setKeepNextTrackVolume] = useState(() => localStorage.getItem('soundflow-keep-next-volume') === 'true');
  const [now, setNow] = useState(() => Date.now());
  const [chronoElapsedMs, setChronoElapsedMs] = useState(0);
  const [chronoStartedAt, setChronoStartedAt] = useState<number | undefined>(undefined);
  const categoryResize = useRef<{ x: number; width: number; latest: number } | undefined>(undefined);
  const fileDragDepth = useRef(0);
  const fileUploadBusy = useRef(false);
  const playlistRunRef = useRef(false);
  const playlistTransitioningRef = useRef(false);
  const playlistAdvanceTimerRef = useRef<number | undefined>(undefined);
  const ignoredPlaylistPlaybackRef = useRef<string | undefined>(undefined);
  const playlistPlayedItemIdsRef = useRef(new Set<string>());
  const remote = new URLSearchParams(window.location.search).get('remote') === '1';

  useEffect(() => audioEngine.subscribe(setActivePlaybacks), []);
  useEffect(() => audioEngine.subscribeHistory(setPlaybackHistory), []);
  useEffect(() => {
    const persistProgress = () => audioEngine.persistActiveProgress();
    window.addEventListener('pagehide', persistProgress);
    return () => window.removeEventListener('pagehide', persistProgress);
  }, []);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => () => {
    if (playlistAdvanceTimerRef.current !== undefined) window.clearTimeout(playlistAdvanceTimerRef.current);
  }, []);
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
      if (next) localStorage.setItem('soundflow-project', next); else localStorage.removeItem('soundflow-project');
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
    setDetail({ ...result, colors: result.colors ?? [], playlists: result.playlists ?? [] });
  }, [selectedProjectId]);

  const uploadDroppedFiles = useCallback(async (files: File[]) => {
    if (!detail || fileUploadBusy.current || files.length === 0) return;
    fileUploadBusy.current = true;
    const categoryId = selectedCategoryId !== 'all' && detail.categories.some((category) => category.id === selectedCategoryId)
      ? selectedCategoryId : undefined;
    const failures: string[] = [];
    let uploaded = 0;
    setDropUploadProgress({ done: 0, total: files.length, filename: files[0]!.name });
    for (const [index, file] of files.entries()) {
      setDropUploadProgress({ done: index, total: files.length, filename: file.name });
      const form = new FormData();
      form.set('projectId', detail.project.id);
      if (categoryId) form.set('categoryId', categoryId);
      form.set('title', titleFromAudioFilename(file.name));
      form.set('position', String(detail.tracks.length + index));
      form.set('file', file);
      try {
        await api.uploadTrack(form);
        uploaded += 1;
      } catch {
        failures.push(file.name);
      }
      setDropUploadProgress({ done: index + 1, total: files.length, filename: file.name });
    }
    if (uploaded > 0) await refreshProject();
    if (failures.length > 0) setError(`${uploaded} fichier${uploaded > 1 ? 's' : ''} importé${uploaded > 1 ? 's' : ''}. Échec : ${failures.join(', ')}`);
    setDropUploadProgress(undefined);
    fileUploadBusy.current = false;
  }, [detail, refreshProject, selectedCategoryId]);

  useEffect(() => { refreshProject().catch((cause) => setError(cause.message)); }, [refreshProject]);

  useEffect(() => {
    if (!detail || remote) return;
    const containsFiles = (event: DragEvent) => Array.from(event.dataTransfer?.types ?? []).includes('Files');
    const onDragEnter = (event: DragEvent) => {
      if (!containsFiles(event)) return;
      event.preventDefault();
      fileDragDepth.current += 1;
      setFileDropActive(true);
    };
    const onDragOver = (event: DragEvent) => {
      if (!containsFiles(event)) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
    };
    const onDragLeave = (event: DragEvent) => {
      if (!containsFiles(event)) return;
      event.preventDefault();
      fileDragDepth.current = Math.max(0, fileDragDepth.current - 1);
      if (fileDragDepth.current === 0) setFileDropActive(false);
    };
    const onDrop = (event: DragEvent) => {
      if (!containsFiles(event)) return;
      event.preventDefault();
      fileDragDepth.current = 0;
      setFileDropActive(false);
      const files = Array.from(event.dataTransfer?.files ?? []).filter(isSupportedAudioFile);
      if (files.length === 0) {
        setError('Déposez des fichiers MP3, WAV, OGG, FLAC, M4A ou AAC.');
        return;
      }
      uploadDroppedFiles(files).catch((cause) => {
        fileUploadBusy.current = false;
        setDropUploadProgress(undefined);
        setError(cause instanceof Error ? cause.message : 'Import des fichiers impossible.');
      });
    };
    window.addEventListener('dragenter', onDragEnter);
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('dragleave', onDragLeave);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragenter', onDragEnter);
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('dragleave', onDragLeave);
      window.removeEventListener('drop', onDrop);
      fileDragDepth.current = 0;
    };
  }, [detail, remote, uploadDroppedFiles]);

  useEffect(() => {
    if (!selectedProjectId) {
      setChronoElapsedMs(0);
      setChronoStartedAt(undefined);
      return;
    }
    const restored = parseStopwatchState(localStorage.getItem(stopwatchStorageKey(selectedProjectId)));
    setChronoElapsedMs(restored.elapsedMs);
    setChronoStartedAt(restored.startedAt);
  }, [selectedProjectId]);

  useEffect(() => {
    if (!detail) return;
    const storageKey = categoryStorageKey(detail.project.id);
    const categoryId = resolveCategoryId(detail.categories.map((category) => category.id), localStorage.getItem(storageKey));
    setSelectedCategoryId(categoryId);
    localStorage.setItem(storageKey, categoryId);
  }, [detail]);

  useEffect(() => {
    let cancelled = false;
    if (!detail) {
      setOfflineTrackIds(new Set());
      return;
    }
    cachedTrackIds(detail.tracks.map((track) => track.id)).then((trackIds) => {
      if (cancelled) return;
      setOfflineTrackIds(trackIds);
      if (detail.tracks.length > 0 && trackIds.size === detail.tracks.length) setOfflineStatus('Projet disponible hors ligne');
      else if (trackIds.size > 0) setOfflineStatus(`${trackIds.size}/${detail.tracks.length} sons hors ligne`);
      else setOfflineStatus('');
    }).catch(() => {
      if (!cancelled) setOfflineTrackIds(new Set());
    });
    return () => { cancelled = true; };
  }, [detail]);

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
      if (command.type === 'stop-all' || command.type === 'stop-all-immediate') {
        window.dispatchEvent(new Event('soundflow:stop-temporary-audio'));
        return audioEngine.stopAll(currentTracks, command.type === 'stop-all-immediate' ? 0 : undefined);
      }
      const track = currentTracks.find((candidate) => candidate.id === command.trackId);
      if (!track) return;
      if (command.type === 'run-action') audioEngine.runAction(command.action, track, currentTracks, command.volumeMultiplier).catch((cause) => setError(cause.message));
      else if (command.type === 'play') audioEngine.play(track, track.fadeInMs, command.volumeMultiplier).catch((cause) => setError(cause.message));
      else audioEngine.stop(track.id, track.fadeOutMs);
    });
    return () => { connection.disconnect(); setSocket(undefined); setConnected(false); };
  }, [selectedProjectId, user, remote, detail?.tracks]);

  const normalizedSearch = search.trim().toLocaleLowerCase('fr');
  const isSearching = normalizedSearch.length > 0;
  const columnCategoryId = isSearching ? 'all' : selectedCategoryId;
  const visibleTracks = useMemo(() => (detail?.tracks ?? []).filter((track) => {
    const inCategory = isSearching || selectedCategoryId === 'all' || track.categoryId === selectedCategoryId;
    const matches = track.title.toLocaleLowerCase('fr').includes(normalizedSearch) || track.originalFilename.toLocaleLowerCase('fr').includes(normalizedSearch);
    return inCategory && matches;
  }), [detail?.tracks, isSearching, normalizedSearch, selectedCategoryId]);
  const visiblePlaylists = useMemo(() => remote ? [] : (detail?.playlists ?? []).filter((playlist) => !isSearching || playlist.name.toLocaleLowerCase('fr').includes(normalizedSearch)), [detail?.playlists, isSearching, normalizedSearch, remote]);
  const visibleBoardItems = useMemo(() => [
    ...visibleTracks.map((track) => ({ kind: 'track' as const, id: track.id, position: track.position, track })),
    ...visiblePlaylists.map((playlist) => ({ kind: 'playlist' as const, id: playlist.id, position: playlist.position, playlist })),
  ].sort((first, second) => first.position - second.position || (first.kind === second.kind ? first.id.localeCompare(second.id) : first.kind === 'track' ? -1 : 1)), [visiblePlaylists, visibleTracks]);
  const activeTrackIds = useMemo(() => new Set(activePlaybacks.map((playback) => playback.trackId)), [activePlaybacks]);
  const playbacksByTrack = useMemo(() => {
    const grouped = new Map<string, ActivePlayback[]>();
    for (const playback of activePlaybacks) grouped.set(playback.trackId, [...(grouped.get(playback.trackId) ?? []), playback]);
    return grouped;
  }, [activePlaybacks]);
  const playingTracks = useMemo(() => {
    return activePlaybacks.flatMap((playback) => {
      const track = detail?.tracks.find((candidate) => candidate.id === playback.trackId);
      if (!track) return [];
      return [{ playback, track }];
    });
  }, [activePlaybacks, detail?.tracks]);
  const tracksToPreload = useMemo(() => {
    if (!detail) return [];
    if (selectedCategoryId === 'all') return detail.tracks;
    return detail.tracks.filter((track) => track.categoryId === selectedCategoryId);
  }, [detail, selectedCategoryId]);
  const preloadedInCategory = tracksToPreload.filter((track) => offlineTrackIds.has(track.id)).length;
  const trackColumns = compactLayout ? mobileColumns : desktopColumns;
  const currentCategory = detail?.categories.find((category) => category.id === selectedCategoryId);
  const displayedChronoMs = chronoElapsedMs + (chronoStartedAt === undefined ? 0 : Math.max(0, now - chronoStartedAt));
  const playlistPlayback = activePlaybacks.find((playback) => playback.id === playlistPlaybackId);
  const detailProjectId = detail?.project.id;

  useEffect(() => {
    if (!detailProjectId) return;
    const legacyDesktop = readNumberRange('soundflow-track-columns', 6, 2, 12);
    const legacyMobile = readNumberRange('soundflow-track-columns-mobile', 2, 1, 3);
    setDesktopColumns(readNumberRange(trackColumnsStorageKey(detailProjectId, columnCategoryId, false), legacyDesktop, 2, 12));
    setMobileColumns(readNumberRange(trackColumnsStorageKey(detailProjectId, columnCategoryId, true), legacyMobile, 1, 3));
  }, [columnCategoryId, detailProjectId]);

  const consumeNextTrackVolume = useCallback(() => {
    const multiplier = nextTrackVolume / 100;
    if (!keepNextTrackVolume) {
      setNextTrackVolume(100);
      localStorage.removeItem('soundflow-next-volume');
    }
    return multiplier;
  }, [keepNextTrackVolume, nextTrackVolume]);

  const sendOrRun = useCallback((command: RemoteCommand, track?: Track) => {
    const preparedCommand = command.type === 'play' && command.volumeMultiplier === undefined
      ? { ...command, volumeMultiplier: consumeNextTrackVolume() }
      : command;
    if (remote && detail) {
      socket?.emit('remote-command', { projectId: detail.project.id, command: preparedCommand });
      return;
    }
    if (preparedCommand.type === 'stop-all' || preparedCommand.type === 'stop-all-immediate') {
      playlistRunRef.current = false;
      playlistTransitioningRef.current = false;
      clearPlaylistAdvanceTimer();
      setPlaylistPlaybackId(undefined);
      window.dispatchEvent(new Event('soundflow:stop-temporary-audio'));
      audioEngine.stopAll(detail?.tracks ?? [], preparedCommand.type === 'stop-all-immediate' ? 0 : undefined);
    }
    else if (preparedCommand.type === 'stop' && track) audioEngine.stop(track.id, track.fadeOutMs);
    else if (preparedCommand.type === 'play' && track) audioEngine.play(track, track.fadeInMs, preparedCommand.volumeMultiplier).catch((cause) => setError(cause.message));
  }, [consumeNextTrackVolume, detail, remote, socket]);

  const runTrackAction = useCallback((action: MouseAction, track: Track) => {
    if (action === 'none') return;
    const startsPlayback = action === 'start' || action === 'crossfade' || action === 'fade-in' || action === 'replace';
    const volumeMultiplier = startsPlayback ? consumeNextTrackVolume() : undefined;
    if (remote && detail) {
      socket?.emit('remote-command', { projectId: detail.project.id, command: { type: 'run-action', trackId: track.id, action, volumeMultiplier } satisfies RemoteCommand });
      return;
    }
    audioEngine.runAction(action, track, detail?.tracks ?? [], volumeMultiplier).catch((cause) => setError(cause.message));
  }, [consumeNextTrackVolume, detail, remote, socket]);

  const startPlaylistTrack = useCallback(async (track: Track, index: number, itemId: string, fadeInMs = track.fadeInMs): Promise<string | undefined> => {
    playlistRunRef.current = true;
    playlistPlayedItemIdsRef.current.add(itemId);
    setPlaylistCurrentIndex(index);
    try {
      const playbackId = await audioEngine.play({ ...track, loop: false }, fadeInMs);
      setPlaylistPlaybackId(playbackId);
      return playbackId;
    } catch (cause) {
      playlistRunRef.current = false;
      setError(cause instanceof Error ? cause.message : 'Lecture de la playlist impossible.');
      return undefined;
    }
  }, []);

  const playPlaylistAt = useCallback(async (index: number, fadeInMs?: number): Promise<string | undefined> => {
    const item = playlistItems[index];
    const track = detail?.tracks.find((candidate) => candidate.id === item?.trackId);
    if (!item || !track) return;
    return startPlaylistTrack(track, index, item.id, fadeInMs);
  }, [detail?.tracks, playlistItems, startPlaylistTrack]);

  const nextPlaylistIndex = useCallback((currentIndex: number): number | undefined => {
    if (playlistItems.length === 0) return undefined;
    if (playlistOptions.random) {
      let candidates = playlistItems.map((item, index) => ({ item, index })).filter(({ item }) => !playlistPlayedItemIdsRef.current.has(item.id));
      if (candidates.length === 0) {
        if (!playlistOptions.loop) return undefined;
        playlistPlayedItemIdsRef.current.clear();
        candidates = playlistItems.map((item, index) => ({ item, index })).filter(({ index }) => playlistItems.length === 1 || index !== currentIndex);
      }
      return candidates[Math.floor(Math.random() * candidates.length)]?.index;
    }
    if (currentIndex + 1 < playlistItems.length) return currentIndex + 1;
    return playlistOptions.loop ? 0 : undefined;
  }, [playlistItems, playlistOptions.loop, playlistOptions.random]);

  useEffect(() => {
    if (!playlistPlaybackId || activePlaybacks.some((playback) => playback.id === playlistPlaybackId)) return;
    if (playlistTransitioningRef.current) return;
    if (ignoredPlaylistPlaybackRef.current === playlistPlaybackId) {
      ignoredPlaylistPlaybackRef.current = undefined;
      return;
    }
    setPlaylistPlaybackId(undefined);
    if (!playlistRunRef.current) return;
    const nextIndex = nextPlaylistIndex(playlistCurrentIndex);
    if (nextIndex === undefined) {
      playlistRunRef.current = false;
      return;
    }
    if (playlistOptions.gapMs > 0) {
      playlistAdvanceTimerRef.current = window.setTimeout(() => {
        playlistAdvanceTimerRef.current = undefined;
        if (playlistRunRef.current) playPlaylistAt(nextIndex).catch(() => undefined);
      }, playlistOptions.gapMs);
      return;
    }
    playPlaylistAt(nextIndex).catch(() => undefined);
  }, [activePlaybacks, nextPlaylistIndex, playPlaylistAt, playlistCurrentIndex, playlistOptions.gapMs, playlistPlaybackId]);

  useEffect(() => {
    if (!playlistPlayback || playlistPlayback.paused || playlistPlayback.fadingOut || playlistOptions.crossfadeMs <= 0 || playlistTransitioningRef.current) return;
    const nextIndex = nextPlaylistIndex(playlistCurrentIndex);
    if (nextIndex === undefined) return;
    const nextItem = playlistItems[nextIndex];
    const nextTrack = detail?.tracks.find((track) => track.id === nextItem?.trackId);
    if (!nextItem || !nextTrack) return;
    audioEngine.preload(nextTrack).catch(() => undefined);
    const elapsedMs = playlistPlayback.elapsedMs + Math.max(0, performance.now() - playlistPlayback.resumedAtMs);
    const remainingMs = Math.max(0, playlistPlayback.durationMs - elapsedMs);
    const crossfadeMs = Math.min(playlistOptions.crossfadeMs, playlistPlayback.durationMs, remainingMs);
    const timer = window.setTimeout(() => {
      if (!playlistRunRef.current || playlistTransitioningRef.current) return;
      playlistTransitioningRef.current = true;
      const outgoingPlaybackId = playlistPlayback.id;
      playPlaylistAt(nextIndex, crossfadeMs).then((nextPlaybackId) => {
        if (nextPlaybackId) audioEngine.stopInstance(outgoingPlaybackId, crossfadeMs);
        else {
          audioEngine.stopInstance(outgoingPlaybackId, 0);
          setPlaylistPlaybackId(undefined);
        }
      }).finally(() => { playlistTransitioningRef.current = false; });
    }, Math.max(0, remainingMs - crossfadeMs));
    return () => window.clearTimeout(timer);
  }, [detail?.tracks, nextPlaylistIndex, playPlaylistAt, playlistCurrentIndex, playlistItems, playlistOptions.crossfadeMs, playlistPlayback]);

  function clearPlaylistAdvanceTimer() {
    if (playlistAdvanceTimerRef.current === undefined) return;
    window.clearTimeout(playlistAdvanceTimerRef.current);
    playlistAdvanceTimerRef.current = undefined;
  }

  function stopPlaylistPlayback() {
    playlistRunRef.current = false;
    playlistTransitioningRef.current = false;
    clearPlaylistAdvanceTimer();
    if (playlistPlaybackId) {
      ignoredPlaylistPlaybackRef.current = playlistPlaybackId;
      audioEngine.stopInstance(playlistPlaybackId, 0);
    }
    setPlaylistPlaybackId(undefined);
  }

  function playPausePlaylist() {
    const playback = activePlaybacks.find((item) => item.id === playlistPlaybackId);
    if (playback) {
      audioEngine.togglePauseInstance(playback.id);
      return;
    }
    clearPlaylistAdvanceTimer();
    playlistPlayedItemIdsRef.current.clear();
    playPlaylistAt(Math.min(playlistCurrentIndex, Math.max(0, playlistItems.length - 1))).catch(() => undefined);
  }

  function playPlaylistItem(index: number) {
    stopPlaylistPlayback();
    playlistPlayedItemIdsRef.current.clear();
    playPlaylistAt(index).catch(() => undefined);
  }

  function skipPlaylistTrack() {
    const nextIndex = nextPlaylistIndex(playlistCurrentIndex);
    if (nextIndex === undefined) return stopPlaylistPlayback();
    stopPlaylistPlayback();
    playPlaylistAt(nextIndex).catch(() => undefined);
  }

  function addTrackToPlaylist(trackId: string) {
    if (!detail?.tracks.some((track) => track.id === trackId)) return;
    setPlaylistItems((current) => [...current, { id: crypto.randomUUID(), trackId }]);
  }

  function addCategoryToPlaylist() {
    if (tracksToPreload.length === 0) return;
    setPlaylistItems((current) => [...current, ...tracksToPreload.map((track) => ({ id: crypto.randomUUID(), trackId: track.id }))]);
    setSidebarTool('playlist');
  }

  function movePlaylistItem(itemId: string, beforeItemId: string) {
    setPlaylistItems((current) => {
      const moving = current.find((item) => item.id === itemId);
      const currentItemId = current[playlistCurrentIndex]?.id;
      if (!moving) return current;
      const reordered = current.filter((item) => item.id !== itemId);
      const targetIndex = reordered.findIndex((item) => item.id === beforeItemId);
      reordered.splice(Math.max(0, targetIndex), 0, moving);
      if (currentItemId) setPlaylistCurrentIndex(Math.max(0, reordered.findIndex((item) => item.id === currentItemId)));
      return reordered;
    });
  }

  function removePlaylistItem(itemId: string) {
    const removedIndex = playlistItems.findIndex((item) => item.id === itemId);
    if (removedIndex < 0) return;
    if (removedIndex === playlistCurrentIndex) stopPlaylistPlayback();
    setPlaylistItems((current) => current.filter((item) => item.id !== itemId));
    setPlaylistCurrentIndex((current) => Math.max(0, removedIndex < current ? current - 1 : current));
    playlistPlayedItemIdsRef.current.delete(itemId);
  }

  function resetPlaylistEditor() {
    playlistRunRef.current = false;
    playlistTransitioningRef.current = false;
    clearPlaylistAdvanceTimer();
    ignoredPlaylistPlaybackRef.current = undefined;
    setPlaylistPlaybackId(undefined);
    setPlaylistItems([]);
    setLoadedPlaylistId(undefined);
    setPlaylistCurrentIndex(0);
    setPlaylistOptions({ name: 'Nouvelle playlist', color: detail?.colors[0]?.color ?? '#8b5cf6', autostart: false, loop: false, random: false, gapMs: 0, crossfadeMs: 0 });
    setPlaylistOptionsOpen(false);
    playlistPlayedItemIdsRef.current.clear();
  }

  function clearPlaylist() {
    stopPlaylistPlayback();
    resetPlaylistEditor();
  }

  function loadPlaylist(playlist: Playlist) {
    stopPlaylistPlayback();
    const items = playlist.trackIds.filter((trackId) => detail?.tracks.some((track) => track.id === trackId)).map((trackId) => ({ id: crypto.randomUUID(), trackId }));
    setPlaylistItems(items);
    setPlaylistOptions({ name: playlist.name, color: playlist.color, autostart: playlist.autostart, loop: playlist.loop, random: playlist.random, gapMs: playlist.gapMs ?? 0, crossfadeMs: playlist.crossfadeMs ?? 0 });
    setLoadedPlaylistId(playlist.id);
    setPlaylistCurrentIndex(0);
    setPlaylistOptionsOpen(false);
    setSidebarTool('playlist');
    playlistPlayedItemIdsRef.current.clear();
    if (playlist.autostart && items[0]) {
      const firstTrack = detail?.tracks.find((track) => track.id === items[0]!.trackId);
      if (firstTrack) startPlaylistTrack(firstTrack, 0, items[0].id).catch(() => undefined);
    }
  }

  async function saveCurrentPlaylist() {
    if (!detail || playlistItems.length === 0) return;
    setPlaylistSaving(true);
    try {
      const { playlist } = await api.savePlaylist(detail.project.id, loadedPlaylistId, {
        ...playlistOptions,
        name: playlistOptions.name.trim() || 'Playlist sans titre',
        trackIds: playlistItems.map((item) => item.trackId),
      });
      setLoadedPlaylistId(playlist.id);
      setPlaylistOptions((current) => ({ ...current, name: playlist.name }));
      setDetail((current) => current ? { ...current, playlists: current.playlists.some((item) => item.id === playlist.id) ? current.playlists.map((item) => item.id === playlist.id ? playlist : item) : [...current.playlists, playlist] } : current);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Sauvegarde de la playlist impossible.');
    } finally {
      setPlaylistSaving(false);
    }
  }

  async function deleteCurrentPlaylist() {
    if (!detail || !loadedPlaylistId || !window.confirm(`Supprimer la playlist « ${playlistOptions.name} » ?`)) return;
    try {
      await api.deletePlaylist(detail.project.id, loadedPlaylistId);
      setDetail((current) => current ? { ...current, playlists: current.playlists.filter((playlist) => playlist.id !== loadedPlaylistId) } : current);
      setLoadedPlaylistId(undefined);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Suppression de la playlist impossible.');
    }
  }

  useEffect(() => {
    if (!detail) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement || event.target instanceof HTMLTextAreaElement || (event.target instanceof HTMLElement && event.target.isContentEditable)) return;
      const keyAction = event.key === 'Escape' ? detail.project.escapeKeyAction ?? 'stop-all'
        : event.key === 'Backspace' ? detail.project.backspaceKeyAction ?? 'stop-all'
          : event.key === ' ' ? detail.project.spaceKeyAction ?? 'stop-all-immediate' : undefined;
      if (keyAction) {
        event.preventDefault();
        if (keyAction === 'stop-all') {
          sendOrRun({ type: 'stop-all' });
        } else if (keyAction === 'stop-all-immediate') {
          sendOrRun({ type: 'stop-all-immediate' });
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
      await api.createCategory(detail.project.id, name, colors[detail.categories.length % colors.length], detail.categories.length);
      await refreshProject();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Création impossible.'); }
  }

  async function deleteCategory(category: Category) {
    if (!detail) return;
    const trackCount = detail.tracks.filter((track) => track.categoryId === category.id).length;
    const consequence = trackCount > 0 ? `\n\n${trackCount} morceau${trackCount > 1 ? 'x' : ''} restera${trackCount > 1 ? 'ont' : ''} disponible${trackCount > 1 ? 's' : ''} dans « Tous les sons », sans catégorie.` : '';
    if (!window.confirm(`Supprimer la catégorie « ${category.name} » ?${consequence}`)) return;
    try {
      await api.deleteCategory(detail.project.id, category.id);
      if (selectedCategoryId === category.id) {
        localStorage.removeItem(categoryStorageKey(detail.project.id));
        setSelectedCategoryId('all');
      }
      await refreshProject();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Suppression de la catégorie impossible.'); }
  }

  async function reorderCategories(categoryId: string, targetId?: string, after = false) {
    if (!detail || reordering || categoryId === targetId) return;
    const previous = detail.categories;
    const reordered = moveById(previous, categoryId, targetId, after).map((category, position) => ({ ...category, position }));
    setDetail((current) => current ? { ...current, categories: reordered } : current);
    setReordering(true);
    try {
      const result = await api.reorderCategories(detail.project.id, reordered.map((category) => category.id));
      setDetail((current) => current ? { ...current, categories: result.categories } : current);
    } catch (cause) {
      setDetail((current) => current ? { ...current, categories: previous } : current);
      setError(cause instanceof Error ? cause.message : 'Réorganisation des catégories impossible.');
    } finally {
      setReordering(false);
      setDraggedCategoryId(undefined);
      setDropCategoryOrderId(undefined);
      setDropCategoryAfter(false);
    }
  }

  async function createProjectColor(color: string) {
    if (!detail || detail.project.id !== selectedProjectId) throw new Error('La palette du spectacle est encore en cours de chargement.');
    try {
      const { projectColor } = await api.createProjectColor(detail.project.id, color);
      setDetail((current) => current ? {
        ...current,
        colors: current.colors.some((item) => item.id === projectColor.id) ? current.colors : [...current.colors, projectColor],
      } : current);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Ajout de la couleur impossible.');
      throw cause;
    }
  }

  async function deleteProjectColor(projectColor: ProjectColor) {
    if (!detail || detail.project.id !== selectedProjectId) throw new Error('La palette du spectacle est encore en cours de chargement.');
    const previous = detail.colors;
    setDetail((current) => current ? { ...current, colors: current.colors.filter((item) => item.id !== projectColor.id) } : current);
    try {
      await api.deleteProjectColor(detail.project.id, projectColor.id);
    } catch (cause) {
      setDetail((current) => current ? { ...current, colors: previous } : current);
      setError(cause instanceof Error ? cause.message : 'Suppression de la couleur impossible.');
      throw cause;
    }
  }

  async function reorderProjectColors(colorIds: string[]) {
    if (!detail || detail.project.id !== selectedProjectId) throw new Error('La palette du spectacle est encore en cours de chargement.');
    const previous = detail.colors;
    const byId = new Map(previous.map((item) => [item.id, item]));
    const optimistic = colorIds.flatMap((id, position) => {
      const item = byId.get(id);
      return item ? [{ ...item, position }] : [];
    });
    setDetail((current) => current ? { ...current, colors: optimistic } : current);
    try {
      const result = await api.reorderProjectColors(detail.project.id, colorIds);
      setDetail((current) => current ? { ...current, colors: result.colors } : current);
    } catch (cause) {
      setDetail((current) => current ? { ...current, colors: previous } : current);
      setError(cause instanceof Error ? cause.message : 'Réorganisation des couleurs impossible.');
      throw cause;
    }
  }

  async function reorderProjects(projectIds: string[]) {
    const previous = projects;
    const byId = new Map(previous.map((project) => [project.id, project]));
    const optimistic = projectIds.flatMap((id, position) => {
      const project = byId.get(id);
      return project ? [{ ...project, position }] : [];
    });
    setProjects(optimistic);
    try {
      const result = await api.reorderProjects(projectIds);
      setProjects(result.projects);
      localStorage.setItem('soundflow-projects', JSON.stringify(result));
    } catch (cause) {
      setProjects(previous);
      setError(cause instanceof Error ? cause.message : 'Réorganisation des spectacles impossible.');
    }
  }

  async function deleteProject(project: Project) {
    if (!window.confirm(`Supprimer définitivement le spectacle « ${project.name} » et tous ses morceaux ?\n\nCette action est irréversible.`)) return;
    try {
      let deletedTrackIds = project.id === detail?.project.id ? detail.tracks.map((track) => track.id) : [];
      if (deletedTrackIds.length === 0) {
        const projectToDelete = await api.project(project.id).catch(() => undefined);
        deletedTrackIds = projectToDelete?.tracks.map((track) => track.id) ?? [];
      }
      if (project.id === selectedProjectId) { audioEngine.stopAll(detail?.tracks ?? [], 0); resetPlaylistEditor(); }
      await api.deleteProject(project.id);
      if (project.id === selectedProjectId) setDetail(undefined);
      audioEngine.resetHistory(deletedTrackIds);
      await deleteCachedTracks(deletedTrackIds).catch(() => undefined);
      localStorage.removeItem(`soundflow-detail:${project.id}`);
      localStorage.removeItem(categoryStorageKey(project.id));
      localStorage.removeItem(stopwatchStorageKey(project.id));
      await loadProjects();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Suppression du spectacle impossible.'); }
  }

  async function updateMouseAction(side: 'left' | 'right', action: MouseAction) {
    if (!detail) return;
    const input = side === 'left' ? { leftClickAction: action } : { rightClickAction: action };
    try {
      const { project } = await api.updateProjectActions(detail.project.id, input);
      setDetail((current) => current ? { ...current, project } : current);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Configuration impossible.'); }
  }

  async function updateKeyAction(key: 'escape' | 'backspace' | 'space', action: KeyAction) {
    if (!detail) return;
    const input = key === 'escape' ? { escapeKeyAction: action }
      : key === 'backspace' ? { backspaceKeyAction: action }
        : { spaceKeyAction: action };
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

  async function reorderPlaylist(playlistId: string, targetKind: 'track' | 'playlist', targetId: string, afterTarget: boolean) {
    if (!detail || reordering || (targetKind === 'playlist' && playlistId === targetId)) return;
    const previousPlaylists = detail.playlists;
    const moving = previousPlaylists.find((playlist) => playlist.id === playlistId);
    if (!moving) return;
    const orderedItems = visibleBoardItems.filter((item) => item.kind !== 'playlist' || item.id !== playlistId);
    const targetIndex = orderedItems.findIndex((item) => item.kind === targetKind && item.id === targetId);
    if (targetIndex < 0) return;
    const destinationIndex = targetIndex + (afterTarget ? 1 : 0);
    orderedItems.splice(destinationIndex, 0, { kind: 'playlist', id: moving.id, position: moving.position, playlist: moving });
    const movingIndex = orderedItems.findIndex((item) => item.kind === 'playlist' && item.id === playlistId);
    const previousPosition = orderedItems[movingIndex - 1]?.position;
    const nextPosition = orderedItems[movingIndex + 1]?.position;
    const position = previousPosition === undefined ? (nextPosition ?? 0) - 1
      : nextPosition === undefined ? previousPosition + 1
        : previousPosition + (nextPosition - previousPosition) / 2;
    const optimistic = previousPlaylists.map((playlist) => playlist.id === playlistId ? { ...playlist, position } : playlist)
      .sort((first, second) => first.position - second.position);
    setDetail((current) => current ? { ...current, playlists: optimistic } : current);
    setReordering(true);
    try {
      await api.positionPlaylist(detail.project.id, playlistId, position);
      localStorage.setItem(`soundflow-detail:${detail.project.id}`, JSON.stringify({ ...detail, playlists: optimistic }));
    } catch (cause) {
      setDetail((current) => current ? { ...current, playlists: previousPlaylists } : current);
      setError(cause instanceof Error ? cause.message : 'Réorganisation des playlists impossible.');
    } finally {
      setReordering(false);
      setDraggedPlaylistId(undefined);
      setDropPlaylistId(undefined);
      setDropPlaylistTrackId(undefined);
      setDropPlaylistAfter(false);
    }
  }

  function chooseProject(id: string) {
    audioEngine.stopAll(detail?.tracks ?? []);
    resetPlaylistEditor();
    setSelectedProjectId(id);
    setSelectedCategoryId('all');
    setReorderMode(false);
    setSidebarOpen(false);
    localStorage.setItem('soundflow-project', id);
  }

  function selectCategory(categoryId: string) {
    setSelectedCategoryId(categoryId);
    setSearch('');
    if (detail) localStorage.setItem(categoryStorageKey(detail.project.id), categoryId);
  }

  async function cacheOffline() {
    if (!detail || !('caches' in window)) return setOfflineStatus('Cache indisponible dans ce navigateur.');
    setOfflineStatus(`0/${detail.tracks.length}`);
    try {
      let done = 0;
      for (const track of detail.tracks) {
        await cacheTrackOffline(track.id);
        done += 1;
        setOfflineTrackIds((current) => new Set(current).add(track.id));
        setOfflineStatus(`${done}/${detail.tracks.length}`);
      }
      setOfflineStatus('Projet disponible hors ligne');
    } catch { setOfflineStatus('Téléchargement interrompu'); }
  }

  async function preloadCategory() {
    const remaining = tracksToPreload.filter((track) => !offlineTrackIds.has(track.id));
    if (!remaining.length) return;
    setPreloadProgress({ done: tracksToPreload.length - remaining.length, total: tracksToPreload.length });
    let done = tracksToPreload.length - remaining.length;
    try {
      for (let index = 0; index < remaining.length; index += 3) {
        const batch = remaining.slice(index, index + 3);
        await Promise.all(batch.map(async (track) => {
          await cacheTrackOffline(track.id);
          setOfflineTrackIds((current) => new Set(current).add(track.id));
          await audioEngine.preload(track);
        }));
        done += batch.length;
        setPreloadProgress({ done, total: tracksToPreload.length });
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Mise à disposition hors ligne interrompue.');
    } finally {
      setPreloadProgress(undefined);
    }
  }

  function updateTrackColumns(value: number) {
    if (!detail) return;
    if (compactLayout) {
      setMobileColumns(value);
      localStorage.setItem(trackColumnsStorageKey(detail.project.id, columnCategoryId, true), String(value));
    } else {
      setDesktopColumns(value);
      localStorage.setItem(trackColumnsStorageKey(detail.project.id, columnCategoryId, false), String(value));
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

  function resetCurrentProject() {
    if (!detail) return;
    const confirmed = window.confirm(`Réinitialiser « ${detail.project.name} » ?\n\nLes lectures en cours, les progressions, le chronomètre, la catégorie active et les réglages temporaires seront remis à zéro.\n\nLes morceaux, catégories, couleurs et fichiers hors ligne seront conservés.`);
    if (!confirmed) return;
    window.dispatchEvent(new Event('soundflow:stop-temporary-audio'));
    audioEngine.resetProjectSession(detail.tracks);
    resetPlaylistEditor();
    setChronoElapsedMs(0);
    setChronoStartedAt(undefined);
    localStorage.removeItem(stopwatchStorageKey(detail.project.id));
    const firstCategoryId = detail.categories[0]?.id ?? 'all';
    setSelectedCategoryId(firstCategoryId);
    localStorage.setItem(categoryStorageKey(detail.project.id), firstCategoryId);
    setSearch('');
    setNextTrackVolume(100);
    setKeepNextTrackVolume(false);
    localStorage.removeItem('soundflow-next-volume');
    localStorage.removeItem('soundflow-keep-next-volume');
    setReorderMode(false);
    setCategoryManageMode(false);
    setDraggedTrackId(undefined);
    setDropTrackId(undefined);
    setDropCategoryId(undefined);
    setDraggedCategoryId(undefined);
    setDropCategoryOrderId(undefined);
    setDropCategoryAfter(false);
    setColumnsOpen(false);
    setHistoryOpen(false);
  }

  function toggleChrono() {
    if (chronoStartedAt !== undefined) {
      const elapsedMs = chronoElapsedMs + Date.now() - chronoStartedAt;
      setChronoElapsedMs(elapsedMs);
      setChronoStartedAt(undefined);
      persistStopwatch(selectedProjectId, elapsedMs);
    } else {
      const startedAt = Date.now();
      setChronoStartedAt(startedAt);
      persistStopwatch(selectedProjectId, chronoElapsedMs, startedAt);
    }
  }

  function resetChrono() {
    setChronoElapsedMs(0);
    const startedAt = chronoStartedAt === undefined ? undefined : Date.now();
    if (startedAt !== undefined) setChronoStartedAt(startedAt);
    persistStopwatch(selectedProjectId, 0, startedAt);
  }

  function toggleRemoteMode() {
    const url = new URL(window.location.href);
    if (remote) url.searchParams.delete('remote'); else url.searchParams.set('remote', '1');
    window.location.href = url.toString();
  }

  async function logout() {
    audioEngine.stopAll(detail?.tracks ?? []);
    audioEngine.resetHistory();
    resetPlaylistEditor();
    await api.logout();
    await deleteOfflineAudio().catch(() => false);
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
        {playingTracks.length === 0 ? <div className="players-empty"><AudioWaveform size={24} /><strong>Aucun son en lecture</strong><span>Les lecteurs actifs apparaîtront ici.</span></div> : playingTracks.map(({ playback, track }) => {
          const category = detail?.categories.find((item) => item.id === track.categoryId);
          const color = track.color ?? category?.color ?? '#71717a';
          const totalElapsedMs = playback.paused ? playback.elapsedMs : playback.elapsedMs + Math.max(0, performance.now() - playback.resumedAtMs);
          const positionMs = playback.loop ? totalElapsedMs % playback.durationMs : Math.min(totalElapsedMs, playback.durationMs);
          return <article className={`player-card ${playback.paused ? 'is-paused' : ''}`} key={playback.id} style={{ '--track-color': color } as React.CSSProperties}>
            <div className="player-card-copy"><strong>{track.title}</strong></div>
            <div className="player-card-time"><span>{formatPlaybackDuration(positionMs)}</span><input className="player-card-seek" type="range" min="0" max={playback.durationMs} step="10" value={Math.round(positionMs)} disabled={playback.fadingOut} onChange={(event) => audioEngine.seekInstance(playback.id, Number(event.target.value) / playback.durationMs)} aria-label={`Position de lecture de ${track.title}`} title="Cliquer ou glisser pour déplacer la lecture" /><span>−{formatPlaybackDuration(Math.max(0, playback.durationMs - positionMs))}</span></div>
            <PlaybackVolumeControl playback={playback} title={track.title} />
            <div className="player-card-controls">
              <button className={playback.loop ? 'active' : ''} disabled={playback.fadingOut} onClick={() => audioEngine.setInstanceLoop(playback.id, !playback.loop)} aria-label={playback.loop ? `Désactiver la boucle de ${track.title}` : `Jouer ${track.title} en boucle`} title="Boucle"><Repeat2 size={15} /></button>
              <button disabled={playback.fadingOut} onClick={() => audioEngine.togglePauseInstance(playback.id)} aria-label={playback.paused ? `Reprendre ${track.title}` : `Mettre ${track.title} en pause`} title={playback.paused ? 'Reprendre' : 'Pause'}>{playback.paused ? <Play size={15} fill="currentColor" /> : <Pause size={15} fill="currentColor" />}</button>
              <button className="fade-out" disabled={playback.fadingOut} onClick={() => audioEngine.stopInstance(playback.id, track.fadeOutMs > 0 ? track.fadeOutMs : 1_200)} aria-label={`Faire disparaître ${track.title} en fondu`} title="Fondu sortant"><VolumeX size={16} /></button>
              <button className="stop" onClick={() => audioEngine.stopInstance(playback.id, 0)} aria-label={`Arrêter immédiatement cette lecture de ${track.title}`} title="Arrêt immédiat"><Square size={14} fill="currentColor" /></button>
            </div>
          </article>;
        })}
      </div>
      {!remote && <>{sidebarTool === 'playlist' && <PlaylistPanel items={playlistItems} tracks={detail?.tracks ?? []} colors={detail?.colors ?? []} options={playlistOptions} currentIndex={playlistCurrentIndex} playbackActive={Boolean(playlistPlayback)} playbackPaused={playlistPlayback?.paused ?? false} saved={Boolean(loadedPlaylistId)} saving={playlistSaving} optionsOpen={playlistOptionsOpen} onOptionsOpenChange={setPlaylistOptionsOpen} onOptionsChange={(patch) => setPlaylistOptions((current) => ({ ...current, ...patch }))} onDropTrack={addTrackToPlaylist} onMoveItem={movePlaylistItem} onRemoveItem={removePlaylistItem} onPlayItem={playPlaylistItem} onPlayPause={playPausePlaylist} onStop={stopPlaylistPlayback} onNext={skipPlaylistTrack} onSave={() => saveCurrentPlaylist().catch(() => undefined)} onDelete={() => deleteCurrentPlaylist().catch(() => undefined)} onClear={clearPlaylist} />}
        <nav className="sidebar-tool-tabs" aria-label="Outils de la colonne de lecture"><button className={sidebarTool === 'playlist' ? 'active' : ''} onClick={() => setSidebarTool((current) => current === 'playlist' ? undefined : 'playlist')} aria-label="Afficher la playlist" title="Playlist"><ListMusic size={17} /><em>{playlistItems.length}</em></button></nav>
      </>}
    </aside>
    {sidebarOpen && <button className="sidebar-scrim" onClick={() => setSidebarOpen(false)} aria-label="Fermer le menu" />}

    <main className="workspace">
      <header className="topbar">
        <button className="icon-button menu-button" onClick={() => setSidebarOpen(true)}><Menu /></button>
        <div className="topbar-title"><p className="eyebrow">{remote ? 'Télécommande' : 'Régie principale'}<span className={`connection-status ${connected ? 'online' : ''}`} role="img" aria-label={connected ? 'Connexion temps réel active' : 'Connexion temps réel interrompue'} title={connected ? 'Connexion temps réel active' : 'Connexion temps réel interrompue'}>{connected ? <Wifi size={14} /> : <WifiOff size={14} />}</span></p><h1>{detail?.project.name ?? 'Chargement…'}</h1></div>
        <div className="topbar-console">
          <section className="console-module next-volume" title="Ce multiplicateur s'applique au prochain son, puis revient à 100 %.">
            <span><Volume2 size={14} />Son suivant</span>
            <div className="next-volume-control"><input type="range" min="0" max="100" value={nextTrackVolume} aria-label="Volume du son suivant" onChange={(event) => { const value = Number(event.target.value); setNextTrackVolume(value); localStorage.setItem('soundflow-next-volume', String(value)); }} /><strong>{nextTrackVolume} %</strong><button type="button" className={`console-volume-lock ${keepNextTrackVolume ? 'active' : ''}`} role="switch" aria-checked={keepNextTrackVolume} aria-label="Conserver le volume pour les sons suivants" title={keepNextTrackVolume ? 'Volume conservé après chaque lancement' : 'Réinitialiser à 100 % après le prochain lancement'} onClick={() => { const next = !keepNextTrackVolume; setKeepNextTrackVolume(next); localStorage.setItem('soundflow-keep-next-volume', String(next)); localStorage.setItem('soundflow-next-volume', String(nextTrackVolume)); }}><i /></button></div>
          </section>
          <section className="console-module stopwatch">
            <span><Timer size={14} />Chrono</span>
            <div><strong>{formatStopwatch(displayedChronoMs)}</strong><button onClick={toggleChrono} aria-label={chronoStartedAt === undefined ? 'Démarrer le chronomètre' : 'Mettre le chronomètre en pause'}>{chronoStartedAt === undefined ? <Play size={13} fill="currentColor" /> : <Pause size={13} fill="currentColor" />}</button><button onClick={resetChrono} aria-label="Réinitialiser le chronomètre"><RotateCcw size={13} /></button></div>
          </section>
          <section className="console-module wall-clock"><span><Clock3 size={14} />Horloge</span><strong>{formatClock(now)}</strong></section>
        </div>
        <div className="top-actions">
          <button className="icon-button settings-button" onClick={() => setSettingsOpen(true)} aria-label="Ouvrir les paramètres" title="Paramètres"><Settings size={19} /></button>
          {!remote && <button className="icon-button reset-show-button" onClick={resetCurrentProject} disabled={!detail} aria-label="Réinitialiser le spectacle en cours" title="Réinitialiser le spectacle"><RefreshCcw size={18} /></button>}
          {!remote && <button className="button primary" onClick={() => setUploadOpen(true)}><Upload size={17} />Ajouter un son</button>}
        </div>
      </header>

      {detail && <section className="category-strip">
        <div className="category-strip-heading"><span>{categoryManageMode ? 'Glissez les catégories pour les réordonner' : 'Catégories'}</span><div><button className={`icon-button subtle category-manage-toggle ${categoryManageMode ? 'active' : ''}`} onClick={() => { setCategoryManageMode((current) => !current); setReorderMode(false); setDraggedCategoryId(undefined); setDropCategoryOrderId(undefined); setDropCategoryAfter(false); }} aria-label={categoryManageMode ? 'Terminer la gestion des catégories' : 'Gérer les catégories'} title={categoryManageMode ? 'Terminer' : 'Réordonner ou supprimer'}><ArrowUpDown size={16} /></button><button className="icon-button subtle" onClick={createCategory} aria-label="Nouvelle catégorie"><Plus size={17} /></button></div></div>
        <div className="category-tabs-row" style={{ '--category-tab-width': `${categoryWidth}px` } as React.CSSProperties}>
          <nav className="category-tabs" aria-label="Catégories de sons" onDragOver={(event) => { if (!categoryManageMode || !draggedCategoryId) return; event.preventDefault(); }} onDrop={(event) => { if (!categoryManageMode || !draggedCategoryId || event.target !== event.currentTarget) return; event.preventDefault(); reorderCategories(draggedCategoryId).catch(() => undefined); }}>
            <button className={`category-tab category-tab-all ${selectedCategoryId === 'all' || isSearching ? 'active' : ''}`} onClick={() => selectCategory('all')} style={{ '--category-color': '#a1a1aa' } as React.CSSProperties}><span>Tous les sons</span><em className="category-tab-count">{detail.tracks.length}</em></button>
            {detail.categories.map((category) => <div key={category.id} className={`category-tab-shell ${categoryManageMode ? 'is-managing' : ''} ${dropCategoryOrderId === category.id ? `is-order-target ${dropCategoryAfter ? 'drop-after' : 'drop-before'}` : ''}`} style={{ '--category-color': category.color } as React.CSSProperties} draggable={categoryManageMode}
              onDragStart={(event) => { if (!categoryManageMode) return; event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', category.id); setDraggedCategoryId(category.id); }}
              onDragOver={(event) => { if (!categoryManageMode || !draggedCategoryId || draggedCategoryId === category.id) return; event.preventDefault(); event.stopPropagation(); const bounds = event.currentTarget.getBoundingClientRect(); setDropCategoryOrderId(category.id); setDropCategoryAfter(event.clientX > bounds.left + bounds.width / 2); }}
              onDragLeave={() => setDropCategoryOrderId((current) => current === category.id ? undefined : current)}
              onDrop={(event) => { if (!categoryManageMode || !draggedCategoryId) return; event.preventDefault(); event.stopPropagation(); const bounds = event.currentTarget.getBoundingClientRect(); reorderCategories(draggedCategoryId, category.id, event.clientX > bounds.left + bounds.width / 2).catch(() => undefined); }}
              onDragEnd={() => { setDraggedCategoryId(undefined); setDropCategoryOrderId(undefined); setDropCategoryAfter(false); }}>
              <button className={`category-tab ${!isSearching && category.id === selectedCategoryId ? 'active' : ''} ${dropCategoryId === category.id ? 'is-drop-target' : ''}`} onClick={() => selectCategory(category.id)}
                onDragOver={(event) => { if (!reorderMode || !draggedTrackId) return; event.preventDefault(); event.dataTransfer.dropEffect = 'move'; setDropCategoryId(category.id); setDropTrackId(undefined); }}
                onDragLeave={() => setDropCategoryId((current) => current === category.id ? undefined : current)}
                onDrop={(event) => { if (!reorderMode || !draggedTrackId) return; event.preventDefault(); event.stopPropagation(); reorderTrack(draggedTrackId, category.id).catch(() => undefined); }}>
                <span>{category.name}</span><em className="category-tab-count">{detail.tracks.filter((track) => track.categoryId === category.id).length}</em>
              </button>
              {categoryManageMode && <><GripVertical className="category-order-handle" size={15} aria-hidden="true" /><button className="category-delete" onClick={(event) => { event.stopPropagation(); deleteCategory(category).catch(() => undefined); }} aria-label={`Supprimer la catégorie ${category.name}`} title="Supprimer"><Trash2 size={14} /></button></>}
            </div>)}
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
            aria-label={preloadProgress ? `Mise hors ligne ${preloadProgress.done} sur ${preloadProgress.total}` : preloadedInCategory === tracksToPreload.length && tracksToPreload.length ? 'Catégorie disponible hors ligne' : 'Rendre la catégorie disponible hors ligne'} title={preloadProgress ? `${preloadProgress.done}/${preloadProgress.total}` : preloadedInCategory === tracksToPreload.length && tracksToPreload.length ? 'Disponible hors ligne' : 'Rendre la catégorie disponible hors ligne'}>
            {preloadProgress ? <LoaderCircle className="spin" size={18} /> : preloadedInCategory === tracksToPreload.length && tracksToPreload.length ? <CircleCheck size={18} /> : <Download size={18} />}
          </button>}
          {!remote && <button className={`dashboard-button ${reorderMode ? 'active' : ''}`} onClick={() => { setReorderMode((current) => !current); setCategoryManageMode(false); setDraggedTrackId(undefined); setDropTrackId(undefined); setDropCategoryId(undefined); setDraggedPlaylistId(undefined); setDropPlaylistId(undefined); setDropPlaylistTrackId(undefined); setDropPlaylistAfter(false); }} disabled={reordering}
            aria-label={reordering ? 'Enregistrement de la réorganisation' : reorderMode ? 'Terminer la réorganisation' : 'Réorganiser les morceaux'} title={reorderMode ? 'Terminer la réorganisation' : 'Réorganiser les morceaux'}><span className="reorder-mode-icon" aria-hidden="true"><SquareDashed size={20} /><Move size={12} /></span></button>}
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
          {!remote && <button className="dashboard-button playlist-add-category" onClick={addCategoryToPlaylist} disabled={!tracksToPreload.length}
            aria-label={currentCategory ? `Ajouter les ${tracksToPreload.length} morceaux de ${currentCategory.name} à la playlist` : `Ajouter les ${tracksToPreload.length} morceaux à la playlist`}
            title={currentCategory ? `Ajouter toute la catégorie « ${currentCategory.name} » à la playlist` : 'Ajouter tous les morceaux à la playlist'}><ListPlus size={19} /></button>}
          <div className="track-count"><span>{visibleTracks.length}</span><small>son{visibleTracks.length !== 1 ? 's' : ''}</small></div>
        </div>
      </section>

      <section className="soundboard">
        {remote && <div className="remote-banner"><Radio size={18} /><span>Mode télécommande — les sons seront joués sur la régie connectée.</span></div>}
        {!detail ? <div className="empty-state"><div className="skeleton-grid" /></div> : visibleTracks.length === 0 && visiblePlaylists.length === 0 ? <div className="empty-state"><span className="empty-icon"><AudioLines /></span><h2>{search ? 'Aucun son trouvé' : 'Votre scène attend son premier son'}</h2><p>{search ? 'Essayez une autre recherche ou catégorie.' : 'Importez une musique ou un bruitage pour commencer votre soundboard.'}</p>{!remote && !search && <button className="button primary" onClick={() => setUploadOpen(true)}><Upload size={17} />Importer un son</button>}</div> : <div className="track-grid" style={{ '--track-columns': trackColumns } as React.CSSProperties}>
          {visibleBoardItems.map((boardItem) => {
            if (boardItem.kind === 'playlist') {
              const playlist = boardItem.playlist;
              return <PlaylistPad key={`playlist:${playlist.id}`} playlist={playlist} reorderEnabled={reorderMode} dropTarget={dropPlaylistId === playlist.id} dropAfter={dropPlaylistAfter} onLoad={() => loadPlaylist(playlist)}
                onDragStart={(event) => { if (!reorderMode) return; event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('application/x-soundflow-playlist', playlist.id); setDraggedPlaylistId(playlist.id); }}
                onDragOver={(event) => { if (!reorderMode || !draggedPlaylistId || draggedPlaylistId === playlist.id) return; event.preventDefault(); event.dataTransfer.dropEffect = 'move'; const bounds = event.currentTarget.getBoundingClientRect(); setDropPlaylistId(playlist.id); setDropPlaylistTrackId(undefined); setDropPlaylistAfter(event.clientX > bounds.left + bounds.width / 2); }}
                onDrop={(event) => { if (!draggedPlaylistId || draggedPlaylistId === playlist.id) return; event.preventDefault(); const bounds = event.currentTarget.getBoundingClientRect(); reorderPlaylist(draggedPlaylistId, 'playlist', playlist.id, event.clientX > bounds.left + bounds.width / 2).catch(() => undefined); }}
                onDragEnd={() => { setDraggedPlaylistId(undefined); setDropPlaylistId(undefined); setDropPlaylistTrackId(undefined); setDropPlaylistAfter(false); }} />;
            }
            const track = boardItem.track;
            const category = detail.categories.find((item) => item.id === track.categoryId);
            const shortcutIndex = visibleTracks.findIndex((candidate) => candidate.id === track.id);
            return <TrackPad key={track.id} track={track} color={track.color ?? category?.color ?? '#71717a'} active={activeTrackIds.has(track.id)} playbacks={playbacksByTrack.get(track.id) ?? []} historyProgress={playbackHistory.get(track.id) ?? 0} loaded={offlineTrackIds.has(track.id)} reorderEnabled={reorderMode} playlistDropEnabled={sidebarTool === 'playlist' && !remote} dropTarget={dropTrackId === track.id} playlistPositionTarget={dropPlaylistTrackId === track.id ? (dropPlaylistAfter ? 'after' : 'before') : undefined} shortcut={shortcutIndex < 9 ? shortcutIndex + 1 : undefined}
              onPrimary={() => runTrackAction(detail.project.leftClickAction ?? 'start', track)}
              onSecondary={() => runTrackAction(detail.project.rightClickAction ?? 'crossfade', track)}
              onEdit={() => { if (!reorderMode) setEditingTrack(track); }}
              onDragStart={(event) => { if (reorderMode) { event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', track.id); setDraggedTrackId(track.id); } else if (sidebarTool === 'playlist') { event.dataTransfer.effectAllowed = 'copy'; event.dataTransfer.setData('application/x-soundflow-track', track.id); } }}
              onDragOver={(event) => { if (!reorderMode) return; if (draggedPlaylistId) { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; const bounds = event.currentTarget.getBoundingClientRect(); setDropPlaylistTrackId(track.id); setDropPlaylistId(undefined); setDropPlaylistAfter(event.clientX > bounds.left + bounds.width / 2); return; } if (!draggedTrackId || draggedTrackId === track.id) return; event.preventDefault(); event.dataTransfer.dropEffect = 'move'; setDropTrackId(track.id); setDropCategoryId(undefined); }}
              onDrop={(event) => { event.preventDefault(); if (draggedPlaylistId) { const bounds = event.currentTarget.getBoundingClientRect(); reorderPlaylist(draggedPlaylistId, 'track', track.id, event.clientX > bounds.left + bounds.width / 2).catch(() => undefined); } else if (draggedTrackId && draggedTrackId !== track.id) reorderTrack(draggedTrackId, track.categoryId, track.id).catch(() => undefined); }}
              onDragEnd={() => { setDraggedTrackId(undefined); setDropTrackId(undefined); setDropCategoryId(undefined); }} />;
          })}
        </div>}
      </section>

      <footer className="statusbar"><span><i className={connected ? 'live' : ''} />{remote ? 'Contrôleur' : 'Lecteur principal'}</span><span><Settings2 size={14} /> Web Audio · {activePlaybacks.length} actif{activePlaybacks.length !== 1 ? 's' : ''}</span></footer>
    </main>

    {uploadOpen && detail && <UploadDialog projectId={detail.project.id} categories={detail.categories} onClose={() => setUploadOpen(false)} onUploaded={async () => { setUploadOpen(false); await refreshProject(); }} />}
    {settingsOpen && <SettingsDialog user={user} projects={projects} projectColors={detail?.project.id === selectedProjectId ? detail.colors : []} selectedProjectId={selectedProjectId} offlineStatus={offlineStatus} remote={remote} onClose={() => setSettingsOpen(false)} onChooseProject={chooseProject} onCreateProject={createProject} onReorderProjects={reorderProjects} onDeleteProject={deleteProject} onCreateProjectColor={createProjectColor} onDeleteProjectColor={deleteProjectColor} onReorderProjectColors={reorderProjectColors} onImportSoundShow={() => { setSettingsOpen(false); setSoundShowImportOpen(true); }} onOpenFreesound={() => { setSettingsOpen(false); setFreesoundOpen(true); }} onToggleRemote={toggleRemoteMode} onCacheOffline={cacheOffline} onUpdateKeyAction={updateKeyAction} onLogout={() => { setSettingsOpen(false); logout().catch((cause) => setError(cause instanceof Error ? cause.message : 'Déconnexion impossible.')); }} />}
    {soundShowImportOpen && <SoundShowImportDialog onClose={() => setSoundShowImportOpen(false)} onImported={async (projectId) => { setSoundShowImportOpen(false); await loadProjects(); chooseProject(projectId); }} />}
    {freesoundOpen && detail && <FreesoundDialog initialQuery={search} projectId={detail.project.id} categories={detail.categories} defaultCategoryId={selectedCategoryId !== 'all' ? selectedCategoryId : undefined} nextPosition={detail.tracks.length} onImported={refreshProject} onClose={() => setFreesoundOpen(false)} />}
    {editingTrack && detail && <TrackDialog track={editingTrack} categories={detail.categories} projectColors={detail.colors} onAddProjectColor={createProjectColor} onClose={() => setEditingTrack(undefined)} onChanged={async () => { setEditingTrack(undefined); await refreshProject(); }} />}
    {(fileDropActive || dropUploadProgress) && <div className={`file-drop-overlay ${dropUploadProgress ? 'is-uploading' : ''}`} role="status" aria-live="polite">
      <div className="file-drop-card">
        {dropUploadProgress ? <LoaderCircle className="spin" size={38} /> : <Upload size={42} />}
        <strong>{dropUploadProgress ? `Import ${dropUploadProgress.done}/${dropUploadProgress.total}` : `Déposer dans ${currentCategory?.name ?? 'Sans catégorie'}`}</strong>
        <span>{dropUploadProgress?.filename ?? 'MP3, WAV, OGG, FLAC, M4A ou AAC · plusieurs fichiers acceptés'}</span>
        {dropUploadProgress && <i><b style={{ transform: `scaleX(${dropUploadProgress.total ? dropUploadProgress.done / dropUploadProgress.total : 0})` }} /></i>}
      </div>
    </div>}
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

function categoryStorageKey(projectId: string): string {
  return `soundflow-category:${projectId}`;
}

function trackColumnsStorageKey(projectId: string, categoryId: string, compact: boolean): string {
  return `soundflow-track-columns:${projectId}:${categoryId}:${compact ? 'mobile' : 'desktop'}`;
}

function stopwatchStorageKey(projectId: string): string {
  return `soundflow-stopwatch:${projectId}`;
}

function persistStopwatch(projectId: string | null, elapsedMs: number, startedAt?: number): void {
  if (!projectId) return;
  localStorage.setItem(stopwatchStorageKey(projectId), JSON.stringify({ elapsedMs, startedAt }));
}

function formatPlaybackDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1_000));
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`;
}

function formatStopwatch(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1_000));
  const hours = Math.floor(totalSeconds / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, '0')).join(':');
}

function formatClock(timestamp: number): string {
  return clockFormatter.format(timestamp);
}

function PlaybackVolumeControl({ playback, title }: { playback: ActivePlayback; title: string }) {
  const [displayVolume, setDisplayVolume] = useState(() => playbackVolumeAt(playback));
  const { id, volume, volumeFrom, volumeTransitionDurationMs, volumeTransitionStartedAtMs } = playback;

  useEffect(() => {
    let frame: number | undefined;
    const update = () => {
      const nextVolume = playbackVolumeAt({ volume, volumeFrom, volumeTransitionDurationMs, volumeTransitionStartedAtMs });
      setDisplayVolume(nextVolume);
      if (performance.now() < volumeTransitionStartedAtMs + volumeTransitionDurationMs) {
        frame = requestAnimationFrame(update);
      }
    };
    update();
    return () => { if (frame !== undefined) cancelAnimationFrame(frame); };
  }, [id, volume, volumeFrom, volumeTransitionDurationMs, volumeTransitionStartedAtMs]);

  const percentage = Math.round(displayVolume * 100);
  return <label className="player-card-volume"><Volume2 size={14} /><input type="range" min="0" max="100" value={percentage} disabled={playback.fadingOut} onChange={(event) => {
    const nextVolume = Number(event.target.value) / 100;
    setDisplayVolume(nextVolume);
    audioEngine.setInstanceVolume(playback.id, nextVolume);
  }} aria-label={`Volume de ${title}`} /><em>{percentage}</em></label>;
}

function moveById<T extends { id: string }>(items: T[], movingId: string, targetId?: string, after = false): T[] {
  const moving = items.find((item) => item.id === movingId);
  if (!moving) return items;
  const reordered = items.filter((item) => item.id !== movingId);
  const targetIndex = targetId ? reordered.findIndex((item) => item.id === targetId) : -1;
  const destination = targetIndex < 0 ? reordered.length : targetIndex + (after ? 1 : 0);
  reordered.splice(destination, 0, moving);
  return reordered;
}
