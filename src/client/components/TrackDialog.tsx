import { useState, type FormEvent } from 'react';
import { LoaderCircle, Save, Trash2, X } from 'lucide-react';
import { api } from '../lib/api';
import type { Category, Track } from '../types';
import { WaveformEditor } from './WaveformEditor';

interface Props { track: Track; categories: Category[]; onClose: () => void; onChanged: () => void }

export function TrackDialog({ track, categories, onClose, onChanged }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [startTimeMs, setStartTimeMs] = useState(track.startTimeMs);
  const [endTimeMs, setEndTimeMs] = useState<number | null>(track.endTimeMs);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError('');
    const data = new FormData(event.currentTarget);
    try {
      await api.updateTrack(track.id, {
        title: String(data.get('title')),
        categoryId: String(data.get('categoryId')) || null,
        volume: Number(data.get('volume')) / 100,
        loop: data.get('loop') === 'on',
        fadeInMs: Number(data.get('fadeInMs')),
        fadeOutMs: Number(data.get('fadeOutMs')),
        startTimeMs,
        endTimeMs,
      });
      onChanged();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Modification impossible.'); setLoading(false); }
  }

  async function remove() {
    if (!window.confirm(`Supprimer définitivement « ${track.title} » ?`)) return;
    setLoading(true);
    try { await api.deleteTrack(track.id); onChanged(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Suppression impossible.'); setLoading(false); }
  }

  return <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <form className="dialog track-dialog" onSubmit={submit}>
      <header><div><p className="eyebrow">Réglages du son</p><h2>{track.title}</h2></div><div className="track-dialog-header-actions"><button type="submit" className="button primary" disabled={loading} aria-label="Enregistrer">{loading ? <LoaderCircle className="spin" size={17} /> : <Save size={17} />}<span>Enregistrer</span></button><button type="button" className="icon-button" onClick={onClose} aria-label="Fermer les réglages"><X /></button></div></header>
      <label>Titre<input name="title" defaultValue={track.title} required /></label>
      <label>Catégorie<select name="categoryId" defaultValue={track.categoryId ?? ''}><option value="">Sans catégorie</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
      <WaveformEditor trackId={track.id} title={track.title} initialDurationMs={track.durationMs} startMs={startTimeMs} endMs={endTimeMs} onStartChange={setStartTimeMs} onEndChange={setEndTimeMs} />
      <label>Volume · {Math.min(100, Math.round(track.volume * 100))} %<input name="volume" type="range" min="0" max="100" defaultValue={Math.min(100, track.volume * 100)} /></label>
      <div className="field-row"><label>Fondu d’entrée (ms)<input name="fadeInMs" type="number" min="0" max="60000" defaultValue={track.fadeInMs} /></label><label>Fondu de sortie (ms)<input name="fadeOutMs" type="number" min="0" max="60000" defaultValue={track.fadeOutMs} /></label></div>
      <label className="check"><input name="loop" type="checkbox" defaultChecked={track.loop} /> Jouer en boucle</label>
      {error && <p className="form-error">{error}</p>}
      <footer className="spread"><button type="button" className="button danger" onClick={remove}><Trash2 size={17} />Supprimer</button><span><button type="button" className="button ghost" onClick={onClose}>Annuler</button><button className="button primary" disabled={loading}>{loading && <LoaderCircle className="spin" size={18} />}Enregistrer</button></span></footer>
    </form>
  </div>;
}
