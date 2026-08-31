import { Check, Grid3X3, RotateCcw } from 'lucide-react';
import { workspaceLayoutColumns, workspacePresetLabels, type WorkspaceGridColumns, type WorkspacePreset } from '../lib/workspace-layout';

interface Props {
  columns: WorkspaceGridColumns;
  preset: WorkspacePreset;
  onColumnsChange: (columns: WorkspaceGridColumns) => void;
  onPresetChange: (preset: Exclude<WorkspacePreset, 'custom'>) => void;
  onReset: () => void;
  onClose: () => void;
}

export function WorkspaceLayoutToolbar({ columns, preset, onColumnsChange, onPresetChange, onReset, onClose }: Props) {
  return <section className="workspace-layout-toolbar" aria-label="Modifier la disposition de l’interface">
    <div><Grid3X3 size={17} /><span><strong>Disposition de l’interface</strong><small>Glissez un bloc sur un autre pour les permuter, puis utilisez son coin pour le redimensionner.</small></span></div>
    <label>Modèle<select value={preset === 'custom' ? 'custom' : preset} onChange={(event) => event.target.value !== 'custom' && onPresetChange(event.target.value as Exclude<WorkspacePreset, 'custom'>)}><option value="custom" disabled>Personnalisée</option>{Object.entries(workspacePresetLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    <fieldset><legend>Grille</legend>{workspaceLayoutColumns.map((value) => <button type="button" key={value} className={columns === value ? 'active' : ''} onClick={() => onColumnsChange(value)}>{value}</button>)}</fieldset>
    <button type="button" className="button ghost" onClick={onReset}><RotateCcw size={14} />Réinitialiser</button>
    <button type="button" className="button primary" onClick={onClose}><Check size={15} />Terminer</button>
  </section>;
}
