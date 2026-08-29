import { Speaker } from 'lucide-react';

export type AudioOutputUpgradeMode = 'demo' | 'free' | 'trial' | 'restricted';

function audioOutputUpgradeContent(mode: AudioOutputUpgradeMode): { action: string; message: string } {
  if (mode === 'demo') {
    return {
      action: 'Découvrir les forfaits',
      message: 'La gestion des sorties audio est réservée aux forfaits payants.',
    };
  }
  if (mode === 'trial') {
    return {
      action: 'Gérer mon abonnement',
      message: 'La gestion des sorties audio sera disponible après la période d’essai.',
    };
  }
  if (mode === 'restricted') {
    return {
      action: 'Gérer mon abonnement',
      message: 'La gestion des sorties audio nécessite un forfait payant actif.',
    };
  }
  return {
    action: 'Choisir un forfait',
    message: 'La gestion des sorties audio est réservée aux forfaits payants.',
  };
}

export function AudioOutputUpgradeConsole({ mode, onAction }: { mode: AudioOutputUpgradeMode; onAction: () => void }) {
  const content = audioOutputUpgradeContent(mode);
  return <section className="console-module console-audio-upgrade" title={content.message}>
    <span><Speaker size={14} />Sorties audio</span>
    <div>
      <small>{content.message}</small>
      <button type="button" onClick={onAction}>{content.action}</button>
    </div>
  </section>;
}
