import { Check, Grid3X3, RotateCcw, Save, Trash2, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { workspacePresetLabels, type SavedWorkspaceLayout, type WorkspacePreset } from '../lib/workspace-layout';

interface Props {
  preset: WorkspacePreset;
  savedLayouts: SavedWorkspaceLayout[];
  activeSavedLayoutId?: string;
  onPresetChange: (preset: Exclude<WorkspacePreset, 'custom'>) => void;
  onSavedLayoutChange: (id: string) => void;
  onSave: (name: string) => void;
  onDeleteSaved: (id: string) => void;
  onReset: () => void;
  onClose: () => void;
}

export function WorkspaceLayoutToolbar({ preset, savedLayouts, activeSavedLayoutId, onPresetChange, onSavedLayoutChange, onSave, onDeleteSaved, onReset, onClose }: Props) {
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const selectedValue = activeSavedLayoutId ? `saved:${activeSavedLayoutId}` : preset === 'custom' ? 'custom' : `preset:${preset}`;

  function save(event: FormEvent) {
    event.preventDefault();
    const normalizedName = name.trim();
    if (!normalizedName) return;
    onSave(normalizedName);
    setName('');
    setSaving(false);
  }

  return <section className="workspace-layout-toolbar" aria-label="Modifier la disposition de l’interface">
    <div className="workspace-layout-intro"><Grid3X3 size={17} /><span><strong>Disposition de l’interface</strong><small>Permutez les blocs ou déposez Actions, Lectures et Playlist dans la colonne gauche.</small></span></div>
    <label>Disposition<select value={selectedValue} onChange={(event) => {
      if (event.target.value.startsWith('preset:')) onPresetChange(event.target.value.slice(7) as Exclude<WorkspacePreset, 'custom'>);
      else if (event.target.value.startsWith('saved:')) onSavedLayoutChange(event.target.value.slice(6));
    }}><option value="custom" disabled>Personnalisée</option><optgroup label="Modèles">{Object.entries(workspacePresetLabels).map(([value, label]) => <option key={value} value={`preset:${value}`}>{label}</option>)}</optgroup>{savedLayouts.length > 0 && <optgroup label="Mes dispositions">{savedLayouts.map((layout) => <option key={layout.id} value={`saved:${layout.id}`}>{layout.name}</option>)}</optgroup>}</select></label>
    {saving
      ? <form className="workspace-layout-save" onSubmit={save}><input autoFocus value={name} maxLength={60} onChange={(event) => setName(event.target.value)} placeholder="Nom de la disposition" aria-label="Nom de la disposition" /><button type="submit" disabled={!name.trim()} aria-label="Enregistrer"><Check size={14} /></button><button type="button" onClick={() => setSaving(false)} aria-label="Annuler"><X size={14} /></button></form>
      : <button type="button" className="button ghost" onClick={() => setSaving(true)}><Save size={14} />Enregistrer</button>}
    {activeSavedLayoutId && <button type="button" className="workspace-layout-delete" onClick={() => onDeleteSaved(activeSavedLayoutId)} aria-label="Supprimer cette disposition" title="Supprimer cette disposition"><Trash2 size={14} /></button>}
    <button type="button" className="button ghost" onClick={onReset}><RotateCcw size={14} />Réinitialiser</button>
    <button type="button" className="button primary" onClick={onClose}><Check size={15} />Terminer</button>
  </section>;
}
