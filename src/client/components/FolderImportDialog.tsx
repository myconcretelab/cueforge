import { FolderTree, Layers3, Tags, Upload, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { droppedFolderNames, type DroppedAudioFile, type FolderImportMode } from '../lib/file-import';

interface Props {
  files: DroppedAudioFile[];
  destinationName: string;
  onConfirm: (mode: FolderImportMode) => void;
  onClose: () => void;
}

const choices: Array<{ mode: FolderImportMode; title: string; description: string; icon: typeof FolderTree }> = [
  { mode: 'categories', title: 'Une catégorie par dossier', description: 'Chaque dossier de premier niveau devient une catégorie.', icon: FolderTree },
  { mode: 'subcategories', title: 'Une sous-catégorie par dossier', description: 'Les dossiers deviennent des groupes dans la catégorie de destination.', icon: Layers3 },
  { mode: 'tags', title: 'Les dossiers comme tags', description: 'Chaque morceau reçoit les noms des dossiers de son chemin.', icon: Tags },
];

export function FolderImportDialog({ files, destinationName, onConfirm, onClose }: Props) {
  const [mode, setMode] = useState<FolderImportMode>('categories');
  const folderNames = droppedFolderNames(files);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onConfirm(mode);
  }

  return <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <form className="dialog folder-import-dialog" onSubmit={submit}>
      <header><div><p className="eyebrow">Import d’un dossier</p><h2>Comment organiser les morceaux ?</h2><span>{files.length} fichier{files.length > 1 ? 's' : ''} audio · {folderNames.length} dossier{folderNames.length > 1 ? 's' : ''} de premier niveau</span></div><button type="button" className="icon-button" onClick={onClose} aria-label="Annuler l’import du dossier"><X /></button></header>
      <div className="folder-import-choices">
        {choices.map((choice) => {
          const Icon = choice.icon;
          return <label key={choice.mode} className={mode === choice.mode ? 'active' : ''}>
            <input type="radio" name="folderImportMode" value={choice.mode} checked={mode === choice.mode} onChange={() => setMode(choice.mode)} />
            <Icon size={21} />
            <span><strong>{choice.title}</strong><small>{choice.description}</small></span>
            <i />
          </label>;
        })}
      </div>
      <p className="folder-import-destination">Les morceaux placés directement à la racine restent dans <strong>{destinationName}</strong>. Les niveaux plus profonds utilisent leur premier dossier pour les catégories et sous-catégories.</p>
      <footer><button type="button" className="button ghost" onClick={onClose}>Annuler</button><button className="button primary"><Upload size={17} />Importer et organiser</button></footer>
    </form>
  </div>;
}
