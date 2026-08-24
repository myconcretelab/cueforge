import { useMemo, useRef, useState } from 'react';
import { CheckCircle2, FileArchive, FolderInput, LoaderCircle, Plus, TriangleAlert, X } from 'lucide-react';
import { api } from '../lib/api';
import { findSoundShowFile, isSupportedRemote } from '../lib/soundshow-files';
import type { SoundShowAnalysis, SoundShowTrack } from '../types';

interface Props { onClose: () => void; onImported: (projectId: string) => Promise<void> }
interface ImportResult { projectId: string; imported: number; skipped: number; failed: string[] }

export function SoundShowImportDialog({ onClose, onImported }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [analysis, setAnalysis] = useState<SoundShowAnalysis>();
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState('');
  const [result, setResult] = useState<ImportResult>();
  const directoryInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const matches = useMemo(() => analysis?.tracks.map((track) => ({
    track,
    file: findSoundShowFile(track, files),
    remote: isSupportedRemote(track.url),
  })) ?? [], [analysis, files]);
  const localCount = matches.filter((item) => item.file).length;
  const remoteCount = matches.filter((item) => !item.file && item.remote).length;
  const missing = matches.filter((item) => !item.file && !item.remote);
  const selectedBytes = [...new Set(matches.map((item) => item.file).filter(Boolean))]
    .reduce((sum, file) => sum + (file?.size ?? 0), 0);

  function addFiles(selected: FileList | null) {
    if (!selected?.length) return;
    setFiles((current) => {
      const all = [...current, ...Array.from(selected)];
      return [...new Map(all.map((file) => [`${file.webkitRelativePath || file.name}:${file.size}:${file.lastModified}`, file])).values()];
    });
    setError('');
  }

  async function analyze() {
    const projects = files.filter((file) => file.name.toLowerCase().endsWith('.ssp'));
    const projectFile = projects.find((file) => !/-prev\.ssp$/i.test(file.name)) ?? projects[0];
    if (!projectFile) return setError('Aucun fichier .ssp trouvé dans les éléments sélectionnés.');
    setBusy(true); setError('');
    try { setAnalysis((await api.analyzeSoundShow(projectFile)).analysis); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Analyse impossible.'); }
    finally { setBusy(false); }
  }

  async function runImport() {
    if (!analysis) return;
    setBusy(true); setError(''); setProgress({ done: 0, total: matches.length });
    try {
      const { project } = await api.createProject(analysis.name);
      const categoryIds = new Map<string, string>();
      for (const category of analysis.categories) {
        const created = await api.createCategory(project.id, category.name, category.color, category.position);
        categoryIds.set(category.sourceId, created.category.id);
      }
      const failed: string[] = [];
      let imported = 0;
      let cursor = 0;
      const workers = Array.from({ length: 3 }, async () => {
        while (cursor < matches.length) {
          const item = matches[cursor++];
          const categoryId = categoryIds.get(item.track.categorySourceId);
          try {
            if (item.file) await uploadLocal(project.id, categoryId, item.track, item.file);
            else if (item.remote && item.track.url) await api.importRemoteTrack(metadata(project.id, categoryId, item.track, { url: item.track.url, loop: item.track.loop }));
            else continue;
            imported += 1;
          } catch { failed.push(item.track.title); }
          finally { setProgress((value) => ({ ...value, done: Math.min(value.total, value.done + 1) })); }
        }
      });
      await Promise.all(workers);
      setResult({ projectId: project.id, imported, skipped: missing.length, failed });
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Import impossible.'); }
    finally { setBusy(false); }
  }

  return <div className="dialog-backdrop" onMouseDown={(event) => !busy && event.target === event.currentTarget && onClose()}>
    <section className="dialog soundshow-dialog">
      <header><div><p className="eyebrow">Migration</p><h2>Importer un projet SoundShow</h2></div><button className="icon-button" disabled={busy} onClick={onClose}><X /></button></header>
      {!analysis && !result && <>
        <div className="import-explainer"><FileArchive size={34} /><div><strong>Sélectionnez le dossier de votre projet</strong><p>Standby One trouvera le fichier `.ssp`, les sous-dossiers et tous les médias disponibles.</p></div></div>
        <input ref={(node) => { directoryInput.current = node; node?.setAttribute('webkitdirectory', ''); }} hidden type="file" multiple onChange={(event) => { addFiles(event.target.files); event.target.value = ''; }} />
        <input ref={fileInput} hidden type="file" multiple accept=".ssp,audio/*,.flac" onChange={(event) => { addFiles(event.target.files); event.target.value = ''; }} />
        <div className="import-actions"><button className="button primary" onClick={() => directoryInput.current?.click()}><FolderInput size={17} />Choisir un dossier</button><button className="button ghost" onClick={() => fileInput.current?.click()}><Plus size={17} />Ajouter des fichiers</button></div>
        {files.length > 0 && <div className="selection-summary"><strong>{files.length} fichiers sélectionnés</strong><span>{files.filter((file) => file.name.endsWith('.ssp')).map((file) => file.name).join(', ') || 'Aucun projet .ssp'}</span></div>}
        {error && <p className="form-error">{error}</p>}
        <footer><button className="button ghost" onClick={onClose}>Annuler</button><button className="button primary" disabled={busy || !files.length} onClick={analyze}>{busy && <LoaderCircle className="spin" size={17} />}Analyser</button></footer>
      </>}
      {analysis && !result && <>
        <div className="analysis-title"><div><strong>{analysis.name}</strong><span>{analysis.releaseDate ? `Version du ${analysis.releaseDate}` : 'Projet SoundShow'}</span></div><span>{analysis.categories.length} catégories · {analysis.tracks.length} sons</span></div>
        <div className="import-stats"><div><strong>{localCount}</strong><span>fichiers locaux</span></div><div><strong>{remoteCount}</strong><span>depuis Freesound</span></div><div className={missing.length ? 'warning' : ''}><strong>{missing.length}</strong><span>manquants</span></div><div><strong>{formatSize(selectedBytes)}</strong><span>à envoyer</span></div></div>
        <input ref={(node) => { directoryInput.current = node; node?.setAttribute('webkitdirectory', ''); }} hidden type="file" multiple onChange={(event) => { addFiles(event.target.files); event.target.value = ''; }} />
        <button className="button ghost wide" disabled={busy} onClick={() => directoryInput.current?.click()}><Plus size={17} />Ajouter un dossier de médias externe</button>
        {missing.length > 0 && <details className="missing-list"><summary><TriangleAlert size={16} />{missing.length} son(s) resteront à ajouter</summary>{missing.slice(0, 30).map(({ track }) => <span key={track.sourceId}>{track.title}<small>{track.path}</small></span>)}</details>}
        {analysis.warnings.map((warning) => <p className="import-warning" key={warning}>{warning}</p>)}
        {busy && <div className="progress"><i style={{ width: `${progress.total ? progress.done / progress.total * 100 : 0}%` }} /><span>{progress.done} / {progress.total}</span></div>}
        {error && <p className="form-error">{error}</p>}
        <footer><button className="button ghost" disabled={busy} onClick={() => setAnalysis(undefined)}>Retour</button><button className="button primary" disabled={busy || localCount + remoteCount === 0} onClick={runImport}>{busy && <LoaderCircle className="spin" size={17} />}Importer le projet</button></footer>
      </>}
      {result && <div className="import-result"><CheckCircle2 size={48} /><h3>Projet importé</h3><p>{result.imported} sons importés, {result.skipped} manquants{result.failed.length ? ` et ${result.failed.length} en erreur` : ''}.</p>{result.failed.length > 0 && <small>Échecs : {result.failed.join(', ')}</small>}<button className="button primary" onClick={() => onImported(result.projectId)}>Ouvrir {analysis?.name}</button></div>}
    </section>
  </div>;
}

function metadata(projectId: string, categoryId: string | undefined, track: SoundShowTrack, extra: Record<string, unknown> = {}) {
  return { projectId, categoryId, title: track.title, durationMs: track.durationMs ?? undefined, startTimeMs: track.startTimeMs, endTimeMs: track.endTimeMs ?? undefined, loop: track.loop, fadeInMs: track.fadeInMs, fadeOutMs: track.fadeOutMs, color: track.color ?? undefined, description: track.description ?? undefined, copyrightText: track.copyrightText ?? undefined, sourceUrl: track.url ?? undefined, sourceId: track.sourceId, position: track.position, ...extra };
}

async function uploadLocal(projectId: string, categoryId: string | undefined, track: SoundShowTrack, file: File) {
  const form = new FormData();
  const values = metadata(projectId, categoryId, track);
  Object.entries(values).forEach(([key, value]) => { if (value !== undefined) form.append(key, String(value)); });
  form.append('file', file);
  await api.uploadTrack(form);
}

function formatSize(bytes: number) { return bytes > 1024 ** 3 ? `${(bytes / 1024 ** 3).toFixed(1)} Go` : `${(bytes / 1024 ** 2).toFixed(0)} Mo`; }
