import { useCallback, useEffect, useRef, useState } from 'react';
import { CircleCheck, Download, ExternalLink, LoaderCircle, Pause, Play, Search, ShieldCheck, Square, Volume2, Waves, X } from 'lucide-react';
import { api } from '../lib/api';
import type { Category, FreesoundLicenseFilter, FreesoundSearchResult, FreesoundSound } from '../types';

interface Props {
  initialQuery?: string;
  projectId: string;
  categories: Category[];
  defaultCategoryId?: string;
  nextPosition: number;
  onImported: () => Promise<void>;
  onClose: () => void;
}

type PlayerState = 'idle' | 'loading' | 'playing' | 'paused';

export function FreesoundDialog({ initialQuery = '', projectId, categories, defaultCategoryId, nextPosition, onImported, onClose }: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [license, setLicense] = useState<FreesoundLicenseFilter>('compatible');
  const [minDuration, setMinDuration] = useState('');
  const [maxDuration, setMaxDuration] = useState('');
  const [result, setResult] = useState<FreesoundSearchResult>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentSound, setCurrentSound] = useState<FreesoundSound>();
  const [playerState, setPlayerState] = useState<PlayerState>('idle');
  const [currentTime, setCurrentTime] = useState(0);
  const [playerDuration, setPlayerDuration] = useState(0);
  const [volume, setVolume] = useState(.9);
  const [soundToImport, setSoundToImport] = useState<FreesoundSound>();
  const [importTitle, setImportTitle] = useState('');
  const [importCategoryId, setImportCategoryId] = useState(defaultCategoryId ?? '');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [importedIds, setImportedIds] = useState<Set<number>>(new Set());
  const audioRef = useRef<HTMLAudioElement | undefined>(undefined);
  const searchRef = useRef<AbortController | undefined>(undefined);

  const stopPreview = useCallback(() => {
    const audio = audioRef.current;
    audioRef.current = undefined;
    if (audio) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    }
    setCurrentSound(undefined);
    setPlayerState('idle');
    setCurrentTime(0);
    setPlayerDuration(0);
  }, []);

  useEffect(() => {
    const stop = () => stopPreview();
    window.addEventListener('soundflow:stop-temporary-audio', stop);
    return () => {
      window.removeEventListener('soundflow:stop-temporary-audio', stop);
      searchRef.current?.abort();
      stopPreview();
    };
  }, [stopPreview]);

  async function searchSounds(page = 1) {
    const normalized = query.trim();
    if (normalized.length < 2) {
      setError('Saisissez au moins deux caractères.');
      return;
    }
    if (minDuration && maxDuration && Number(minDuration) > Number(maxDuration)) {
      setError('La durée minimale doit être inférieure à la durée maximale.');
      return;
    }
    searchRef.current?.abort();
    const controller = new AbortController();
    searchRef.current = controller;
    setLoading(true);
    setError('');
    try {
      const response = await api.searchFreesound({
        query: normalized,
        license,
        minDuration: minDuration ? Number(minDuration) : undefined,
        maxDuration: maxDuration ? Number(maxDuration) : undefined,
        page,
      }, controller.signal);
      setResult(response);
    } catch (cause) {
      if (controller.signal.aborted) return;
      setError(cause instanceof Error ? cause.message : 'Recherche Freesound impossible.');
    } finally {
      if (searchRef.current === controller) setLoading(false);
    }
  }

  function togglePreview(sound: FreesoundSound) {
    const existing = audioRef.current;
    if (currentSound?.id === sound.id && existing) {
      if (existing.paused) {
        setPlayerState('loading');
        existing.play().catch(() => {
          setPlayerState('paused');
          setError("La préécoute n'a pas pu démarrer.");
        });
      } else {
        existing.pause();
      }
      return;
    }

    stopPreview();
    const audio = new Audio(sound.previewUrl);
    audio.preload = 'auto';
    audio.volume = volume;
    audioRef.current = audio;
    setCurrentSound(sound);
    setPlayerState('loading');
    setCurrentTime(0);
    setPlayerDuration(sound.durationSeconds);
    audio.addEventListener('playing', () => audioRef.current === audio && setPlayerState('playing'));
    audio.addEventListener('pause', () => audioRef.current === audio && !audio.ended && setPlayerState('paused'));
    audio.addEventListener('timeupdate', () => {
      if (audioRef.current !== audio) return;
      setCurrentTime(audio.currentTime);
      if (Number.isFinite(audio.duration)) setPlayerDuration(audio.duration);
    });
    audio.addEventListener('loadedmetadata', () => {
      if (audioRef.current === audio && Number.isFinite(audio.duration)) setPlayerDuration(audio.duration);
    });
    audio.addEventListener('ended', () => {
      if (audioRef.current !== audio) return;
      setCurrentTime(Number.isFinite(audio.duration) ? audio.duration : sound.durationSeconds);
      setPlayerState('paused');
    });
    audio.addEventListener('error', () => {
      if (audioRef.current !== audio) return;
      setPlayerState('paused');
      setError("La préécoute Freesound n'est pas disponible.");
    });
    audio.play().catch(() => {
      if (audioRef.current === audio) setPlayerState('paused');
      setError("La préécoute n'a pas pu démarrer.");
    });
  }

  function closeDialog() {
    stopPreview();
    onClose();
  }

  function prepareImport(sound: FreesoundSound) {
    setSoundToImport(sound);
    setImportTitle(withoutAudioExtension(sound.name));
    setImportCategoryId(defaultCategoryId ?? '');
    setImportError('');
  }

  async function importSound() {
    if (!soundToImport || importing) return;
    const title = importTitle.trim();
    if (!title) {
      setImportError('Donnez un nom au son.');
      return;
    }
    setImporting(true);
    setImportError('');
    try {
      await api.importRemoteTrack({
        projectId,
        categoryId: importCategoryId || undefined,
        title,
        durationMs: Math.max(1, Math.round(soundToImport.durationSeconds * 1_000)),
        position: nextPosition,
        url: soundToImport.previewUrl,
        sourceUrl: soundToImport.pageUrl,
        sourceId: `freesound:${soundToImport.id}`,
        description: soundToImport.tags.length ? `Tags Freesound : ${soundToImport.tags.join(', ')}` : 'Importé depuis Freesound.',
        copyrightText: `« ${soundToImport.name} » par ${soundToImport.username} — ${soundToImport.license.label} — ${soundToImport.pageUrl}`,
        loop: false,
      });
    } catch (cause) {
      setImportError(cause instanceof Error ? cause.message : 'Import Freesound impossible.');
      setImporting(false);
      return;
    }
    setImportedIds((current) => new Set(current).add(soundToImport.id));
    setSoundToImport(undefined);
    setImporting(false);
    onImported().catch(() => setError("Le son est stocké, mais l'affichage du spectacle n'a pas pu être actualisé."));
  }

  function updateVolume(value: number) {
    setVolume(value);
    if (audioRef.current) audioRef.current.volume = value;
  }

  function seek(event: React.MouseEvent<HTMLButtonElement>) {
    const audio = audioRef.current;
    if (!audio || !playerDuration) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    audio.currentTime = Math.max(0, Math.min(playerDuration, ((event.clientX - bounds.left) / bounds.width) * playerDuration));
  }

  const progress = playerDuration ? Math.min(1, currentTime / playerDuration) : 0;

  return <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && closeDialog()}>
    <section className="dialog freesound-dialog">
      <header>
        <div><p className="eyebrow">Bibliothèque externe</p><h2>Recherche Freesound</h2></div>
        <button className="icon-button" onClick={closeDialog} aria-label="Fermer Freesound"><X /></button>
      </header>

      <form className="freesound-search-form" onSubmit={(event) => { event.preventDefault(); searchSounds().catch(() => undefined); }}>
        <label className="freesound-query"><Search size={18} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Applaudissements, porte, orage…" /></label>
        <select aria-label="Licence" value={license} onChange={(event) => setLicense(event.target.value as FreesoundLicenseFilter)}>
          <option value="compatible">CC0 + CC BY</option>
          <option value="cc0">CC0 uniquement</option>
          <option value="by">CC BY uniquement</option>
        </select>
        <select aria-label="Durée minimale" value={minDuration} onChange={(event) => setMinDuration(event.target.value)}>
          <option value="">Aucun minimum</option>
          <option value="3">3 s minimum</option>
          <option value="10">10 s minimum</option>
          <option value="30">30 s minimum</option>
          <option value="60">1 min minimum</option>
          <option value="300">5 min minimum</option>
        </select>
        <select aria-label="Durée maximale" value={maxDuration} onChange={(event) => setMaxDuration(event.target.value)}>
          <option value="">Aucun maximum</option>
          <option value="10">10 s maximum</option>
          <option value="30">30 s maximum</option>
          <option value="60">1 min maximum</option>
          <option value="300">5 min maximum</option>
        </select>
        <button className="button primary" disabled={loading}>{loading ? <LoaderCircle className="spin" size={17} /> : <Search size={17} />}Rechercher</button>
      </form>

      <div className="freesound-license-note"><ShieldCheck size={17} /><span>Préécoutes temporaires uniquement. Les sons CC BY conservent leur attribution obligatoire.</span></div>
      {error && <div className="form-error">{error}</div>}

      {!result && !loading ? <div className="freesound-empty"><Waves size={34} /><strong>Trouvez un son pour la scène</strong><span>La recherche couvre toute la bibliothèque Freesound compatible.</span></div> : result && <>
        <div className="freesound-results-heading"><strong>{result.count.toLocaleString('fr-FR')} résultat{result.count !== 1 ? 's' : ''}</strong><span>Page {result.page}</span></div>
        <div className="freesound-results">
          {result.results.map((sound) => {
            const active = currentSound?.id === sound.id;
            const preparingImport = soundToImport?.id === sound.id;
            return <article key={sound.id} className={`freesound-result${active ? ' is-active' : ''}${preparingImport ? ' is-importing' : ''}`}>
              <div className="freesound-result-summary">
                <button className="freesound-play" onClick={() => togglePreview(sound)} aria-label={`${active && playerState === 'playing' ? 'Mettre en pause' : 'Écouter'} ${sound.name}`}>
                  {active && playerState === 'loading' ? <LoaderCircle className="spin" size={19} /> : active && playerState === 'playing' ? <Pause size={19} fill="currentColor" /> : <Play size={19} fill="currentColor" />}
                </button>
                <div className="freesound-result-main">
                  {preparingImport ? <label className="freesound-inline-title"><span>Nom du morceau</span><input value={importTitle} onChange={(event) => setImportTitle(event.target.value)} maxLength={160} autoFocus /></label> : <a href={sound.pageUrl} target="_blank" rel="noreferrer" title="Voir sur Freesound"><strong>{sound.name}</strong><ExternalLink size={12} /></a>}
                  <span>par {sound.username} · {formatDuration(sound.durationSeconds)}</span>
                  {!preparingImport && <div className="freesound-tags">{sound.tags.slice(0, 4).map((tag) => <em key={tag}>{tag}</em>)}</div>}
                </div>
                <div className="freesound-result-actions">
                  <a className={`freesound-license ${sound.license.code}`} href={sound.license.url} target="_blank" rel="noreferrer">{sound.license.label}</a>
                  <button className={preparingImport ? 'freesound-import-button is-cancel' : importedIds.has(sound.id) ? 'freesound-import-button is-imported' : 'freesound-import-button'} disabled={preparingImport && importing} onClick={() => preparingImport ? setSoundToImport(undefined) : prepareImport(sound)} aria-label={preparingImport ? `Annuler l'import de ${sound.name}` : `Importer ${sound.name}`} title={preparingImport ? "Annuler l'import" : importedIds.has(sound.id) ? 'Importer à nouveau' : 'Importer dans SoundFlow'}>
                    {preparingImport ? <X size={17} /> : importedIds.has(sound.id) ? <CircleCheck size={17} /> : <Download size={17} />}
                  </button>
                </div>
              </div>
              {preparingImport && <div className="freesound-import-morph">
                <div className="freesound-import-morph-inner">
                  <label>Catégorie de destination<select value={importCategoryId} onChange={(event) => setImportCategoryId(event.target.value)}><option value="">Sans catégorie</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
                  <div className="freesound-import-source"><ShieldCheck size={16} /><span><strong>{sound.license.label}</strong> · {sound.username}<small>La source et la licence seront enregistrées avec le morceau.</small></span></div>
                  {importError && <div className="form-error">{importError}</div>}
                  <footer><button className="button ghost" onClick={() => setSoundToImport(undefined)} disabled={importing}>Annuler</button><button className="button primary" onClick={() => importSound().catch(() => undefined)} disabled={importing || !importTitle.trim()}>{importing ? <LoaderCircle className="spin" size={17} /> : <Download size={17} />}{importing ? 'Téléchargement…' : 'Importer et stocker'}</button></footer>
                </div>
              </div>}
            </article>;
          })}
          {result.results.length === 0 && <div className="freesound-empty compact"><strong>Aucun son compatible sur cette page</strong><span>Essayez une recherche plus large.</span></div>}
        </div>
        <div className="freesound-pagination">
          <button className="button ghost" disabled={loading || result.page <= 1} onClick={() => searchSounds(result.page - 1).catch(() => undefined)}>Précédent</button>
          <button className="button ghost" disabled={loading || !result.hasNext} onClick={() => searchSounds(result.page + 1).catch(() => undefined)}>Suivant</button>
        </div>
      </>}

      {currentSound && <section className="freesound-player" aria-label="Lecteur Freesound">
        <button className="freesound-player-toggle" onClick={() => togglePreview(currentSound)} aria-label={playerState === 'playing' ? 'Pause' : 'Lecture'}>
          {playerState === 'loading' ? <LoaderCircle className="spin" size={18} /> : playerState === 'playing' ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
        </button>
        <div className="freesound-player-main"><strong>{currentSound.name}</strong><span>{formatDuration(currentTime)} / {formatDuration(playerDuration)}</span><button className="freesound-player-progress" onClick={seek} aria-label="Avancer dans la préécoute"><i style={{ transform: `scaleX(${progress})` }} /></button></div>
        <label className="freesound-volume"><Volume2 size={16} /><input type="range" min="0" max="1" step="0.05" value={volume} onChange={(event) => updateVolume(Number(event.target.value))} aria-label="Volume Freesound" /></label>
        <button className="freesound-player-stop" onClick={stopPreview} aria-label="Arrêter la préécoute"><Square size={15} fill="currentColor" /></button>
      </section>}
    </section>
  </div>;
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds)) return '0:00';
  const rounded = Math.max(0, Math.floor(seconds));
  return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, '0')}`;
}

function withoutAudioExtension(filename: string): string {
  return filename.replace(/\.(?:mp3|wav|wave|aif|aiff|flac|ogg|m4a|aac)$/i, '');
}
