import { useState, type FormEvent } from 'react';
import { FolderPlus, LoaderCircle, Save, Trash2, X } from 'lucide-react';
import type { Category, ProjectColor, TrackSubcategory } from '../types';

interface Props {
  subcategory?: TrackSubcategory;
  categories: Category[];
  colors: ProjectColor[];
  defaultCategoryId: string | null;
  defaultColor: string;
  onSave: (input: { name: string; categoryId: string | null; color: string }) => Promise<void>;
  onDelete: () => Promise<void>;
  onClose: () => void;
}

export function TrackSubcategoryDialog({ subcategory, categories, colors, defaultCategoryId, defaultColor, onSave, onDelete, onClose }: Props) {
  const [name, setName] = useState(subcategory?.name ?? 'Nouveau groupe');
  const [categoryId, setCategoryId] = useState(subcategory?.categoryId ?? defaultCategoryId ?? '');
  const [color, setColor] = useState(subcategory?.color ?? defaultColor);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    try {
      await onSave({ name: name.trim(), categoryId: categoryId || null, color });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Enregistrement impossible.');
      setLoading(false);
    }
  }

  async function remove() {
    if (!subcategory || !window.confirm(`Supprimer la sous-catégorie « ${subcategory.name} » ? Les morceaux resteront dans sa catégorie parente.`)) return;
    setLoading(true);
    setError('');
    try {
      await onDelete();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Suppression impossible.');
      setLoading(false);
    }
  }

  return <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <form className="dialog subcategory-dialog" onSubmit={submit}>
      <header><div><p className="eyebrow">Sous-catégorie</p><h2>{subcategory ? 'Modifier le groupe' : 'Nouveau groupe'}</h2><span>Le groupe apparaît comme une tuile dans la grille.</span></div><button type="button" className="icon-button" onClick={onClose} aria-label="Fermer"><X /></button></header>
      <label>Nom<input value={name} maxLength={80} autoFocus onChange={(event) => setName(event.target.value)} /></label>
      <label>Catégorie parente<select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}><option value="">Sans catégorie</option>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label>
      <label>Couleur<div className="playlist-color-choice"><input type="color" value={color} onChange={(event) => setColor(event.target.value)} />{colors.map((item) => <button type="button" key={item.id} className={item.color.toLowerCase() === color.toLowerCase() ? 'active' : ''} style={{ '--swatch-color': item.color } as React.CSSProperties} onClick={() => setColor(item.color)} aria-label={`Couleur ${item.color}`} />)}</div></label>
      {error && <p className="form-error">{error}</p>}
      <footer className={subcategory ? 'with-delete' : ''}>{subcategory ? <button type="button" className="button danger" disabled={loading} onClick={remove}><Trash2 size={16} />Supprimer le groupe</button> : <span><FolderPlus size={17} /></span>}<button type="button" className="button ghost" disabled={loading} onClick={onClose}>Annuler</button><button className="button primary" disabled={loading || !name.trim()}>{loading ? <LoaderCircle className="spin" size={16} /> : <Save size={16} />}{subcategory ? 'Enregistrer' : 'Créer'}</button></footer>
    </form>
  </div>;
}
