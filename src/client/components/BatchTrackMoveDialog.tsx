import { FolderInput, LoaderCircle, X } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { api } from '../lib/api';
import type { Category, Track, TrackSubcategory } from '../types';

interface Props {
  projectId: string;
  tracks: Track[];
  categories: Category[];
  subcategories: TrackSubcategory[];
  onClose: () => void;
  onChanged: (tracks: Track[]) => void;
}

export function BatchTrackMoveDialog({ projectId, tracks, categories, subcategories, onClose, onChanged }: Props) {
  const sharedCategory = tracks.every((track) => track.categoryId === tracks[0]?.categoryId);
  const sharedCategoryId = sharedCategory ? tracks[0]?.categoryId ?? '' : '__choose__';
  const sharedSubcategoryId = tracks.every((track) => track.subcategoryId === tracks[0]?.subcategoryId) ? tracks[0]?.subcategoryId ?? '' : '';
  const [categoryId, setCategoryId] = useState(sharedCategoryId);
  const [subcategoryId, setSubcategoryId] = useState(sharedSubcategoryId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const availableSubcategories = useMemo(() => categoryId === '__choose__' ? [] : subcategories.filter((subcategory) => subcategory.categoryId === (categoryId || null)), [categoryId, subcategories]);
  const selectionLabel = `${tracks.length} morceau${tracks.length !== 1 ? 'x' : ''}`;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (categoryId === '__choose__') {
      setError('Choisissez une catégorie de destination.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await api.batchUpdateTracks({
        projectId,
        trackIds: tracks.map((track) => track.id),
        updates: { categoryId: categoryId || null, subcategoryId: subcategoryId || null },
      });
      onChanged(result.tracks);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Déplacement groupé impossible.');
      setLoading(false);
    }
  }

  return <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <form className="dialog batch-move-dialog" onSubmit={submit}>
      <header><div><p className="eyebrow">Déplacement par lot</p><h2>Déplacer {selectionLabel}</h2><span>Choisissez la catégorie puis, si elle en contient, une sous-catégorie.</span></div><button type="button" className="icon-button" onClick={onClose} aria-label="Fermer le déplacement par lot"><X /></button></header>
      <div className="batch-move-fields">
        <label>Catégorie<select value={categoryId} onChange={(event) => { setCategoryId(event.target.value); setSubcategoryId(''); }}>{categoryId === '__choose__' && <option value="__choose__" disabled>Choisir une catégorie…</option>}<option value="">Sans catégorie</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
        <label>Sous-catégorie<select value={subcategoryId} onChange={(event) => setSubcategoryId(event.target.value)}><option value="">À la racine de la catégorie</option>{availableSubcategories.map((subcategory) => <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>)}</select></label>
      </div>
      {categoryId !== '__choose__' && availableSubcategories.length === 0 && <p className="batch-move-note">Cette catégorie ne contient aucune sous-catégorie.</p>}
      {error && <p className="form-error">{error}</p>}
      <footer><button type="button" className="button ghost" onClick={onClose}>Annuler</button><button className="button primary" disabled={loading}>{loading ? <LoaderCircle className="spin" size={17} /> : <FolderInput size={17} />}{loading ? 'Déplacement…' : `Déplacer ${selectionLabel}`}</button></footer>
    </form>
  </div>;
}
