import { useState, type KeyboardEvent } from 'react';
import { Plus, X } from 'lucide-react';
import { maxTrackTags, normalizeTrackTags } from '../lib/track-tags';

interface Props {
  tags: string[];
  onChange: (tags: string[]) => void;
}

export function TrackTagsInput({ tags, onChange }: Props) {
  const [draft, setDraft] = useState('');

  function addDraft() {
    const next = normalizeTrackTags([...tags, ...draft.split(',')]);
    onChange(next);
    setDraft('');
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addDraft();
    } else if (event.key === 'Backspace' && !draft && tags.length) {
      onChange(tags.slice(0, -1));
    }
  }

  return <label className="track-tags-field">
    <span>Tags <small>{tags.length}/{maxTrackTags}</small></span>
    <div className="track-tags-input" onClick={(event) => event.currentTarget.querySelector('input')?.focus()}>
      {tags.map((tag) => <span className="track-tag" key={tag}><b>#</b>{tag}<button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => onChange(tags.filter((candidate) => candidate !== tag))} aria-label={`Supprimer le tag ${tag}`}><X size={12} /></button></span>)}
      <input value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={onKeyDown} onBlur={addDraft} disabled={tags.length >= maxTrackTags} maxLength={200} placeholder={tags.length ? 'Ajouter…' : 'Ajouter un tag…'} aria-label="Ajouter un tag" />
      {draft && <button type="button" className="track-tag-add" onMouseDown={(event) => event.preventDefault()} onClick={addDraft} aria-label="Ajouter le tag"><Plus size={15} /></button>}
    </div>
    <em>Entrée ou virgule pour ajouter plusieurs tags.</em>
  </label>;
}
