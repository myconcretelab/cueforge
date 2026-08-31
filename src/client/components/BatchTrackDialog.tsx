import { useMemo, useState, type FormEvent } from 'react';
import { LoaderCircle, Save, X } from 'lucide-react';
import { api } from '../lib/api';
import type { BatchTrackUpdateInput, Category, ProjectColor, Track } from '../types';
import { TrackTagsInput } from './TrackTagsInput';

type CommonField = 'categoryId' | 'color' | 'volume' | 'loop' | 'fadeInMs' | 'fadeOutMs';

interface Props {
  projectId: string;
  tracks: Track[];
  categories: Category[];
  projectColors: ProjectColor[];
  onClose: () => void;
  onChanged: (tracks: Track[]) => void;
}

export function BatchTrackDialog({ projectId, tracks, categories, projectColors, onClose, onChanged }: Props) {
  const first = tracks[0]!;
  const [enabledFields, setEnabledFields] = useState<Set<CommonField>>(new Set());
  const [tagsEnabled, setTagsEnabled] = useState(false);
  const [tagMode, setTagMode] = useState<'add' | 'remove' | 'replace'>('add');
  const [tags, setTags] = useState<string[]>([]);
  const [categoryId, setCategoryId] = useState(first.categoryId ?? '');
  const [color, setColor] = useState<string | null>(first.color);
  const [volume, setVolume] = useState(Math.round(first.volume * 100));
  const [loop, setLoop] = useState(first.loop);
  const [fadeInMs, setFadeInMs] = useState(first.fadeInMs);
  const [fadeOutMs, setFadeOutMs] = useState(first.fadeOutMs);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const summaries = useMemo(() => ({
    categoryId: sharedSummary(tracks, (track) => track.categoryId, (value) => categories.find((category) => category.id === value)?.name ?? 'Sans catégorie'),
    color: sharedSummary(tracks, (track) => track.color, (value) => value ?? 'Couleur de la catégorie'),
    volume: sharedSummary(tracks, (track) => Math.round(track.volume * 100), (value) => `${value} %`),
    loop: sharedSummary(tracks, (track) => track.loop, (value) => value ? 'Activée' : 'Désactivée'),
    fadeInMs: sharedSummary(tracks, (track) => track.fadeInMs, (value) => `${value} ms`),
    fadeOutMs: sharedSummary(tracks, (track) => track.fadeOutMs, (value) => `${value} ms`),
  }), [categories, tracks]);

  function toggleField(field: CommonField) {
    setEnabledFields((current) => {
      const next = new Set(current);
      if (next.has(field)) next.delete(field); else next.add(field);
      return next;
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (enabledFields.size === 0 && !tagsEnabled) return setError('Sélectionnez au moins un champ à modifier.');
    if (tagsEnabled && tagMode !== 'replace' && tags.length === 0) return setError('Ajoutez au moins un tag à traiter.');
    const updates: NonNullable<BatchTrackUpdateInput['updates']> = {};
    if (enabledFields.has('categoryId')) updates.categoryId = categoryId || null;
    if (enabledFields.has('color')) updates.color = color;
    if (enabledFields.has('volume')) updates.volume = volume / 100;
    if (enabledFields.has('loop')) updates.loop = loop;
    if (enabledFields.has('fadeInMs')) updates.fadeInMs = fadeInMs;
    if (enabledFields.has('fadeOutMs')) updates.fadeOutMs = fadeOutMs;
    setLoading(true); setError('');
    try {
      const result = await api.batchUpdateTracks({
        projectId,
        trackIds: tracks.map((track) => track.id),
        ...(enabledFields.size ? { updates } : {}),
        ...(tagsEnabled ? { tagChange: { mode: tagMode, tags } } : {}),
      });
      onChanged(result.tracks);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Modification groupée impossible.');
      setLoading(false);
    }
  }

  const defaultColor = color ?? projectColors[0]?.color ?? '#22d3b6';
  const selectionLabel = `${tracks.length} morceau${tracks.length !== 1 ? 'x' : ''}`;
  return <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <form className="dialog batch-track-dialog" onSubmit={submit}>
      <header><div><p className="eyebrow">Édition de lot</p><h2>{selectionLabel} sélectionné{tracks.length !== 1 ? 's' : ''}</h2><span>Seuls les champs cochés seront modifiés.</span></div><button type="button" className="icon-button" onClick={onClose} aria-label="Fermer l’édition de lot"><X /></button></header>

      <BatchField title="Catégorie" summary={summaries.categoryId} enabled={enabledFields.has('categoryId')} onToggle={() => toggleField('categoryId')}>
        <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} disabled={!enabledFields.has('categoryId')}><option value="">Sans catégorie</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>
      </BatchField>

      <BatchField title="Couleur" summary={summaries.color} enabled={enabledFields.has('color')} onToggle={() => toggleField('color')}>
        <div className="batch-color-options">
          <button type="button" className={color === null ? 'active inherit' : 'inherit'} onClick={() => setColor(null)} disabled={!enabledFields.has('color')}>Catégorie</button>
          {projectColors.map((item) => <button key={item.id} type="button" className={color?.toLowerCase() === item.color.toLowerCase() ? 'active' : ''} style={{ '--palette-color': item.color } as React.CSSProperties} onClick={() => setColor(item.color)} disabled={!enabledFields.has('color')} aria-label={`Utiliser la couleur ${item.color}`}><span /></button>)}
          <input type="color" value={defaultColor} onChange={(event) => setColor(event.target.value)} disabled={!enabledFields.has('color')} aria-label="Couleur personnalisée du lot" />
        </div>
      </BatchField>

      <BatchField title="Tags" summary={`${new Set(tracks.flatMap((track) => track.tags ?? [])).size} tags distincts`} enabled={tagsEnabled} onToggle={() => setTagsEnabled((current) => !current)}>
        <select value={tagMode} onChange={(event) => setTagMode(event.target.value as typeof tagMode)} disabled={!tagsEnabled} aria-label="Opération sur les tags"><option value="add">Ajouter aux tags existants</option><option value="remove">Retirer des tags existants</option><option value="replace">Remplacer tous les tags</option></select>
        <TrackTagsInput tags={tags} onChange={setTags} disabled={!tagsEnabled} />
        {tagsEnabled && tagMode === 'replace' && tags.length === 0 && <small>Une liste vide supprimera tous les tags des morceaux.</small>}
      </BatchField>

      <div className="batch-compact-grid">
        <BatchField title="Volume" summary={summaries.volume} enabled={enabledFields.has('volume')} onToggle={() => toggleField('volume')}><label className="batch-range"><input type="range" min="0" max="100" value={volume} onChange={(event) => setVolume(Number(event.target.value))} disabled={!enabledFields.has('volume')} /><strong>{volume} %</strong></label></BatchField>
        <BatchField title="Lecture en boucle" summary={summaries.loop} enabled={enabledFields.has('loop')} onToggle={() => toggleField('loop')}><select value={loop ? 'true' : 'false'} onChange={(event) => setLoop(event.target.value === 'true')} disabled={!enabledFields.has('loop')}><option value="true">Activée</option><option value="false">Désactivée</option></select></BatchField>
        <BatchField title="Fondu d’entrée" summary={summaries.fadeInMs} enabled={enabledFields.has('fadeInMs')} onToggle={() => toggleField('fadeInMs')}><input type="number" min="0" max="60000" value={fadeInMs} onChange={(event) => setFadeInMs(Number(event.target.value))} disabled={!enabledFields.has('fadeInMs')} /></BatchField>
        <BatchField title="Fondu de sortie" summary={summaries.fadeOutMs} enabled={enabledFields.has('fadeOutMs')} onToggle={() => toggleField('fadeOutMs')}><input type="number" min="0" max="60000" value={fadeOutMs} onChange={(event) => setFadeOutMs(Number(event.target.value))} disabled={!enabledFields.has('fadeOutMs')} /></BatchField>
      </div>

      {error && <p className="form-error">{error}</p>}
      <footer><button type="button" className="button ghost" onClick={onClose}>Annuler</button><button className="button primary" disabled={loading}>{loading ? <LoaderCircle className="spin" size={17} /> : <Save size={17} />}Appliquer à {selectionLabel}</button></footer>
    </form>
  </div>;
}

function BatchField({ title, summary, enabled, onToggle, children }: { title: string; summary: string; enabled: boolean; onToggle: () => void; children: React.ReactNode }) {
  return <section className={`batch-field ${enabled ? 'enabled' : ''}`}>
    <label className="batch-field-toggle"><input type="checkbox" checked={enabled} onChange={onToggle} /><span><strong>{title}</strong><small>{summary}</small></span></label>
    <div className="batch-field-controls">{children}</div>
  </section>;
}

function sharedSummary<T>(tracks: Track[], read: (track: Track) => T, format: (value: T) => string): string {
  const first = read(tracks[0]!);
  return tracks.every((track) => Object.is(read(track), first)) ? format(first) : 'Valeurs différentes';
}
