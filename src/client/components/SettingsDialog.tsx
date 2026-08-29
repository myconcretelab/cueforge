import { useCallback, useEffect, useState } from 'react';
import { BookOpen, Cable, CloudDownload, CreditCard, FileArchive, FolderPlus, Gift, GripVertical, HardDrive, Keyboard, LoaderCircle, LogOut, Palette, Plus, RefreshCcw, Settings2, ShieldCheck, Speaker, Smartphone, Trash2, Waves, X } from 'lucide-react';
import { api } from '../lib/api';
import { audioEngine, type AudioOutputDevice } from '../lib/audio-engine';
import { bridgeClient, type BridgeOutput } from '../lib/bridge-client';
import type { AccountSummary, BridgeDevice, KeyAction, Project, ProjectColor, PublicPlan, User } from '../types';

const bridgeDownloadUrl = 'https://github.com/myconcretelab/cueforge/releases/tag/bridge-v0.2.0';

interface Props {
  user: User;
  projects: Project[];
  projectColors: ProjectColor[];
  selectedProjectId: string | null;
  offlineStatus: string;
  remote: boolean;
  appVersion?: string;
  hasUnseenReleases: boolean;
  automaticUpdates: boolean;
  onAutomaticUpdatesChange: (enabled: boolean) => void;
  onChooseProject: (id: string) => void;
  onCreateProject: () => void;
  onReorderProjects: (projectIds: string[]) => Promise<void>;
  onDeleteProject: (project: Project) => Promise<void>;
  onCreateProjectColor: (color: string) => Promise<void>;
  onDeleteProjectColor: (color: ProjectColor) => Promise<void>;
  onReorderProjectColors: (colorIds: string[]) => Promise<void>;
  onImportSoundShow: () => void;
  onOpenFreesound: () => void;
  onOpenWhatsNew: () => void;
  onToggleRemote: () => void;
  onCacheOffline: () => void;
  onUpdateKeyAction: (key: 'escape' | 'backspace' | 'space', action: KeyAction) => void;
  onLogout: () => void;
  onClose: () => void;
}

const keyActions: Array<{ value: KeyAction; label: string }> = [
  { value: 'stop-all', label: 'Arrêter avec les fondus' },
  { value: 'stop-all-immediate', label: 'Arrêter immédiatement' },
  { value: 'none', label: 'Aucune action' },
];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  const units = ['Ko', 'Mo', 'Go', 'To'];
  let value = bytes / 1024;
  let unit = units[0];
  for (let index = 1; index < units.length && value >= 1024; index += 1) {
    value /= 1024;
    unit = units[index];
  }
  return `${value >= 10 ? value.toFixed(0) : value.toFixed(1)} ${unit}`;
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

export function SettingsDialog({ user, projects, projectColors, selectedProjectId, offlineStatus, remote, appVersion, hasUnseenReleases, automaticUpdates, onAutomaticUpdatesChange, onChooseProject, onCreateProject, onReorderProjects, onDeleteProject, onCreateProjectColor, onDeleteProjectColor, onReorderProjectColors, onImportSoundShow, onOpenFreesound, onOpenWhatsNew, onToggleRemote, onCacheOffline, onUpdateKeyAction, onLogout, onClose }: Props) {
  const selectedProject = projects.find((project) => project.id === selectedProjectId);
  const [newColor, setNewColor] = useState('#f97316');
  const [draggedProjectId, setDraggedProjectId] = useState<string>();
  const [dropProjectId, setDropProjectId] = useState<string>();
  const [dropProjectAfter, setDropProjectAfter] = useState(false);
  const [draggedColorId, setDraggedColorId] = useState<string>();
  const [dropColorId, setDropColorId] = useState<string>();
  const [account, setAccount] = useState<AccountSummary>();
  const [publicPlans, setPublicPlans] = useState<PublicPlan[]>([]);
  const [selectedPlanCode, setSelectedPlanCode] = useState('');
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
  const [billingBusy, setBillingBusy] = useState(false);
  const [billingError, setBillingError] = useState('');
  const audioOutputSupported = audioEngine.supportsAudioOutputSelection();
  const audioOutputPickerSupported = audioEngine.supportsAudioOutputPicker();
  const [audioOutputs, setAudioOutputs] = useState<AudioOutputDevice[]>([{ deviceId: '', label: 'Sortie système par défaut' }]);
  const [selectedAudioOutputId, setSelectedAudioOutputId] = useState(() => audioEngine.getAudioOutputSelection().deviceId);
  const [audioOutputBusy, setAudioOutputBusy] = useState(false);
  const [audioOutputError, setAudioOutputError] = useState('');
  const [audioMode, setAudioMode] = useState(() => audioEngine.getPlaybackMode());
  const [bridgeBusy, setBridgeBusy] = useState(false);
  const [bridgeMessage, setBridgeMessage] = useState('');
  const [bridgeError, setBridgeError] = useState('');
  const [bridgeOutputs, setBridgeOutputs] = useState<BridgeOutput[]>([]);
  const [bridgeMainOutputId, setBridgeMainOutputId] = useState('default');
  const [bridgePreviewOutputId, setBridgePreviewOutputId] = useState('default');
  const [bridgeDevices, setBridgeDevices] = useState<BridgeDevice[]>([]);

  const refreshAudioOutputs = useCallback(async () => {
    if (!audioOutputSupported) return;
    try {
      const devices = await audioEngine.listAudioOutputDevices();
      setAudioOutputs(devices);
      setSelectedAudioOutputId(audioEngine.getAudioOutputSelection().deviceId);
    } catch (error) {
      setAudioOutputError(audioOutputErrorMessage(error));
    }
  }, [audioOutputSupported]);

  useEffect(() => {
    api.account().then((result) => setAccount(result.account)).catch(() => setAccount(undefined));
    api.publicPlans().then((result) => setPublicPlans(result.plans)).catch(() => setPublicPlans([]));
    api.bridgeDevices().then((result) => setBridgeDevices(result.devices)).catch(() => setBridgeDevices([]));
  }, []);

  useEffect(() => {
    refreshAudioOutputs().catch(() => undefined);
    if (!audioOutputSupported || typeof navigator === 'undefined' || !navigator.mediaDevices) return;
    const onDeviceChange = () => refreshAudioOutputs().catch(() => undefined);
    navigator.mediaDevices.addEventListener('devicechange', onDeviceChange);
    return () => navigator.mediaDevices.removeEventListener('devicechange', onDeviceChange);
  }, [audioOutputSupported, refreshAudioOutputs]);

  useEffect(() => {
    if (account && !selectedPlanCode) setSelectedPlanCode(account.planCode);
  }, [account, selectedPlanCode]);

  const storagePercent = account?.storageQuotaBytes
    ? Math.min(100, (account.storageUsedBytes / account.storageQuotaBytes) * 100)
    : 0;
  const trialDaysLeft = account?.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(account.trialEndsAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
    : null;
  const selectedBillingPlan = publicPlans.find((plan) => plan.code === selectedPlanCode);
  const selectedBillingPrice = billingInterval === 'month' ? selectedBillingPlan?.monthlyPriceCents : selectedBillingPlan?.annualPriceCents;
  const selectedFreePlan = selectedBillingPlan?.free ?? false;
  const freePlanAvailable = publicPlans.some((plan) => plan.free);

  useEffect(() => {
    if (!selectedBillingPlan) return;
    if (billingInterval === 'month' && selectedBillingPlan.monthlyPriceCents === null && selectedBillingPlan.annualPriceCents !== null) setBillingInterval('year');
    if (billingInterval === 'year' && selectedBillingPlan.annualPriceCents === null && selectedBillingPlan.monthlyPriceCents !== null) setBillingInterval('month');
  }, [billingInterval, selectedBillingPlan]);

  function dropProject(targetId: string, after: boolean) {
    if (!draggedProjectId || draggedProjectId === targetId) return;
    const moving = projects.find((project) => project.id === draggedProjectId);
    if (!moving) return;
    const reordered = projects.filter((project) => project.id !== draggedProjectId);
    const targetIndex = reordered.findIndex((project) => project.id === targetId);
    reordered.splice(Math.max(0, targetIndex) + (after ? 1 : 0), 0, moving);
    onReorderProjects(reordered.map((project) => project.id)).catch(() => undefined);
    setDraggedProjectId(undefined);
    setDropProjectId(undefined);
    setDropProjectAfter(false);
  }

  function dropColor(targetId: string) {
    if (!draggedColorId || draggedColorId === targetId) return;
    const moving = projectColors.find((item) => item.id === draggedColorId);
    if (!moving) return;
    const reordered = projectColors.filter((item) => item.id !== draggedColorId);
    const targetIndex = reordered.findIndex((item) => item.id === targetId);
    reordered.splice(Math.max(0, targetIndex), 0, moving);
    onReorderProjectColors(reordered.map((item) => item.id)).catch(() => undefined);
    setDraggedColorId(undefined);
    setDropColorId(undefined);
  }

  async function startCheckout() {
    if (!selectedPlanCode) return;
    setBillingBusy(true);
    setBillingError('');
    try {
      const result = await api.createCheckout({ planCode: selectedPlanCode, billingInterval, requestId: crypto.randomUUID() });
      window.location.assign(result.url);
    } catch (error) {
      setBillingError(error instanceof Error ? error.message : 'Impossible d’ouvrir le paiement Stripe.');
      setBillingBusy(false);
    }
  }

  async function openBillingPortal() {
    setBillingBusy(true);
    setBillingError('');
    try {
      const result = await api.createBillingPortal();
      window.location.assign(result.url);
    } catch (error) {
      setBillingError(error instanceof Error ? error.message : 'Impossible d’ouvrir le portail de facturation.');
      setBillingBusy(false);
    }
  }

  async function activateSelectedFreePlan() {
    if (!selectedBillingPlan || !selectedFreePlan) return;
    setBillingBusy(true);
    setBillingError('');
    try {
      await api.activateFreePlan(selectedBillingPlan.code);
      const result = await api.account();
      setAccount(result.account);
      setSelectedPlanCode(result.account.planCode);
    } catch (error) {
      setBillingError(error instanceof Error ? error.message : 'Impossible d’activer le forfait gratuit.');
    } finally {
      setBillingBusy(false);
    }
  }

  async function changeAudioOutput(deviceId: string) {
    const device = audioOutputs.find((candidate) => candidate.deviceId === deviceId);
    setAudioOutputBusy(true);
    setAudioOutputError('');
    try {
      await audioEngine.setAudioOutput(deviceId, device?.label);
      setSelectedAudioOutputId(deviceId);
      await refreshAudioOutputs();
    } catch (error) {
      setAudioOutputError(audioOutputErrorMessage(error));
    } finally {
      setAudioOutputBusy(false);
    }
  }

  async function chooseAudioOutput() {
    setAudioOutputBusy(true);
    setAudioOutputError('');
    try {
      const selection = await audioEngine.chooseAudioOutput();
      setSelectedAudioOutputId(selection.deviceId);
      await refreshAudioOutputs();
    } catch (error) {
      setAudioOutputError(audioOutputErrorMessage(error));
    } finally {
      setAudioOutputBusy(false);
    }
  }

  const refreshBridge = useCallback(async () => {
    setBridgeError('');
    try {
      const [status, outputs] = await Promise.all([bridgeClient.discover(), bridgeClient.outputs()]);
      setBridgeOutputs(outputs.outputs);
      setBridgeMainOutputId(outputs.mainOutputId);
      setBridgePreviewOutputId(outputs.previewOutputId);
      setBridgeMessage(status.paired ? `Bridge ${status.version} prêt · ${status.cachedTracks} fichier${status.cachedTracks > 1 ? 's' : ''} en cache` : 'Le bridge local attend une association.');
    } catch (error) {
      setBridgeError(bridgeErrorMessage(error));
    }
  }, []);

  useEffect(() => {
    if (bridgeClient.isAssociated()) refreshBridge().catch(() => undefined);
  }, [refreshBridge]);

  async function connectBridge() {
    setBridgeBusy(true);
    setBridgeError('');
    setBridgeMessage('Ouverture de CueForge Bridge…');
    try {
      const pairing = await api.createBridgePairing();
      const link = new URL('cueforge-bridge://pair');
      link.searchParams.set('ticket', pairing.ticket);
      if (window.location.origin !== 'https://app.cueforge.fr') link.searchParams.set('server', window.location.origin);
      window.location.href = link.toString();
      const expiresAt = new Date(pairing.expiresAt).getTime();
      while (Date.now() < expiresAt) {
        await new Promise((resolve) => window.setTimeout(resolve, 750));
        const status = await api.bridgePairingStatus(pairing.ticket);
        if (status.status === 'pending') continue;
        if (status.status === 'paired') {
          bridgeClient.saveAssociation(status.deviceId, status.localToken);
          audioEngine.setPlaybackMode('bridge');
          setAudioMode('bridge');
          setBridgeMessage('CueForge Bridge est associé et devient le moteur audio actif.');
          const devices = await api.bridgeDevices();
          setBridgeDevices(devices.devices);
          await refreshBridge();
          return;
        }
        throw new Error('Cette association a déjà été récupérée. Relancez la connexion.');
      }
      throw new Error('Le lien d’association a expiré. Relancez la connexion.');
    } catch (error) {
      setBridgeError(bridgeErrorMessage(error));
    } finally {
      setBridgeBusy(false);
    }
  }

  async function changeAudioMode(mode: 'browser' | 'bridge') {
    setBridgeError('');
    try {
      audioEngine.setPlaybackMode(mode);
      setAudioMode(mode);
      if (mode === 'bridge') await refreshBridge();
    } catch (error) {
      setBridgeError(bridgeErrorMessage(error));
    }
  }

  async function changeBridgeOutput(channel: 'main' | 'preview', deviceId: string) {
    setBridgeBusy(true);
    setBridgeError('');
    try {
      await bridgeClient.setOutput(channel, deviceId);
      if (channel === 'main') setBridgeMainOutputId(deviceId);
      else setBridgePreviewOutputId(deviceId);
    } catch (error) {
      setBridgeError(bridgeErrorMessage(error));
    } finally {
      setBridgeBusy(false);
    }
  }

  async function syncBridge() {
    if (!selectedProjectId) return;
    setBridgeBusy(true);
    setBridgeError('');
    setBridgeMessage('Synchronisation du spectacle avec le bridge…');
    try {
      const count = await bridgeClient.syncProject(selectedProjectId);
      setBridgeMessage(`${count} fichier${count > 1 ? 's' : ''} audio prêt${count > 1 ? 's' : ''} dans le cache du bridge.`);
    } catch (error) {
      setBridgeError(bridgeErrorMessage(error));
    } finally {
      setBridgeBusy(false);
    }
  }

  async function revokeBridge(device: BridgeDevice) {
    setBridgeBusy(true);
    setBridgeError('');
    try {
      if (bridgeClient.getDeviceId() === device.id) {
        audioEngine.setPlaybackMode('browser');
        bridgeClient.forgetAssociation();
        setAudioMode('browser');
        setBridgeOutputs([]);
      }
      await api.revokeBridgeDevice(device.id);
      setBridgeDevices((current) => current.filter((candidate) => candidate.id !== device.id));
      setBridgeMessage(`${device.name} a été dissocié.`);
    } catch (error) {
      setBridgeError(bridgeErrorMessage(error));
    } finally {
      setBridgeBusy(false);
    }
  }

  return <div className="dialog-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="dialog settings-dialog">
      <header><div><p className="eyebrow">CueForge</p><h2>Paramètres</h2></div><button className="icon-button" onClick={onClose} aria-label="Fermer les paramètres"><X /></button></header>
      <section className="settings-section">
        <div className="settings-section-title"><Settings2 size={16} /><div><strong>Spectacles</strong><span>Sélectionnez, glissez ou supprimez une régie.</span></div></div>
        <div className="settings-project-list">
          {projects.map((project) => <div key={project.id} className={`settings-project-item ${project.id === selectedProjectId ? 'active' : ''} ${project.id === dropProjectId ? `drop-target ${dropProjectAfter ? 'drop-after' : 'drop-before'}` : ''}`} draggable
            onDragStart={(event) => { event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', project.id); setDraggedProjectId(project.id); }}
            onDragOver={(event) => { if (!draggedProjectId || draggedProjectId === project.id) return; event.preventDefault(); const bounds = event.currentTarget.getBoundingClientRect(); setDropProjectId(project.id); setDropProjectAfter(event.clientY > bounds.top + bounds.height / 2); }}
            onDragLeave={() => setDropProjectId((current) => current === project.id ? undefined : current)}
            onDrop={(event) => { event.preventDefault(); const bounds = event.currentTarget.getBoundingClientRect(); dropProject(project.id, event.clientY > bounds.top + bounds.height / 2); }}
            onDragEnd={() => { setDraggedProjectId(undefined); setDropProjectId(undefined); setDropProjectAfter(false); }}>
            <GripVertical size={16} aria-hidden="true" />
            <button className="settings-project-select" onClick={() => onChooseProject(project.id)} aria-current={project.id === selectedProjectId ? 'true' : undefined}>{project.name}</button>
            <button className="settings-project-delete" onClick={() => onDeleteProject(project).catch(() => undefined)} aria-label={`Supprimer le spectacle ${project.name}`} title="Supprimer"><Trash2 size={15} /></button>
          </div>)}
          {projects.length === 0 && <span className="settings-project-empty">Aucun spectacle.</span>}
        </div>
        <button className="button ghost wide" onClick={onCreateProject}><FolderPlus size={17} />Nouveau spectacle</button>
      </section>
      <section className="settings-section">
        <div className="settings-section-title"><Palette size={16} /><div><strong>Couleurs du spectacle</strong><span>Ajoutez, supprimez ou glissez les couleurs pour les réordonner.</span></div></div>
        <div className="settings-color-palette">
          {projectColors.map((item) => <div key={item.id} className={`settings-color-chip ${dropColorId === item.id ? 'drop-target' : ''}`} style={{ '--palette-color': item.color } as React.CSSProperties} draggable
            onDragStart={(event) => { event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', item.id); setDraggedColorId(item.id); }}
            onDragOver={(event) => { if (!draggedColorId || draggedColorId === item.id) return; event.preventDefault(); setDropColorId(item.id); }}
            onDragLeave={() => setDropColorId((current) => current === item.id ? undefined : current)}
            onDrop={(event) => { event.preventDefault(); dropColor(item.id); }}
            onDragEnd={() => { setDraggedColorId(undefined); setDropColorId(undefined); }} title={`${item.color} · glisser pour réordonner`}>
            <span />
            <button type="button" onClick={() => { if (window.confirm(`Retirer ${item.color} de la palette ?\n\nLes morceaux qui utilisent cette couleur ne seront pas modifiés.`)) onDeleteProjectColor(item).catch(() => undefined); }} aria-label={`Retirer la couleur ${item.color}`}><X size={11} /></button>
          </div>)}
          {projectColors.length === 0 && <span className="settings-color-empty">Ajoutez votre première couleur.</span>}
        </div>
        <div className="settings-color-add"><input type="color" value={newColor} onChange={(event) => setNewColor(event.target.value)} aria-label="Nouvelle couleur" /><code>{newColor.toUpperCase()}</code><button type="button" className="button ghost" disabled={!selectedProject} onClick={() => onCreateProjectColor(newColor).catch(() => undefined)}><Plus size={16} />Ajouter</button></div>
      </section>
      <section className="settings-section">
        <div className="settings-section-title"><FileArchive size={16} /><div><strong>Bibliothèque</strong><span>Importez ou préparez les médias de ce spectacle.</span></div></div>
        <div className="settings-actions"><button className="button ghost" onClick={onImportSoundShow}><FileArchive size={17} />Importer SoundShow</button><button className="button ghost" onClick={onOpenFreesound}><Waves size={17} />Rechercher sur Freesound</button><button className="button ghost" onClick={onCacheOffline}><CloudDownload size={17} />{offlineStatus || 'Rendre disponible hors ligne'}</button></div>
      </section>
      <section className="settings-section">
        <div className="settings-section-title"><Speaker size={16} /><div><strong>Moteur et sorties audio</strong><span>Le navigateur reste utilisable seul. Le bridge ajoute un cache natif et plusieurs sorties indépendantes.</span></div></div>
        <div className="audio-output-controls">
          <label><span>Moteur</span><select value={audioMode} disabled={bridgeBusy} onChange={(event) => changeAudioMode(event.target.value as 'browser' | 'bridge')}>
            <option value="browser">Navigateur · Web Audio</option>
            <option value="bridge" disabled={!bridgeClient.isAssociated()}>CueForge Bridge</option>
          </select></label>
          {!bridgeClient.isAssociated() && <button type="button" className="button ghost" disabled={bridgeBusy || user.isDemo} onClick={connectBridge}>{bridgeBusy ? <LoaderCircle className="spin" size={16} /> : <Cable size={16} />}Connecter le bridge</button>}
        </div>
        <div className="settings-actions"><a className="button ghost" href={bridgeDownloadUrl} target="_blank" rel="noreferrer"><CloudDownload size={16} />Télécharger CueForge Bridge</a></div>
        <p className="audio-output-note">La page de téléchargement propose des paquets pour macOS Apple Silicon, macOS Intel et Windows x64. Les paquets actuels ne sont pas signés pour une distribution publique.</p>
        {audioMode === 'browser' && (audioOutputSupported ? <>
          <div className="audio-output-controls">
            <label><span>Périphérique</span><select value={selectedAudioOutputId} disabled={audioOutputBusy} onChange={(event) => changeAudioOutput(event.target.value)}>
              {selectedAudioOutputId && !audioOutputs.some((device) => device.deviceId === selectedAudioOutputId) && <option value={selectedAudioOutputId}>{audioEngine.getAudioOutputSelection().label}</option>}
              {audioOutputs.map((device) => <option value={device.deviceId} key={device.deviceId || 'default'}>{device.label}</option>)}
            </select></label>
            {audioOutputPickerSupported && <button type="button" className="button ghost" disabled={audioOutputBusy} onClick={chooseAudioOutput}>{audioOutputBusy ? <LoaderCircle className="spin" size={16} /> : <Speaker size={16} />}Choisir</button>}
            <button type="button" className="icon-button" disabled={audioOutputBusy} onClick={() => refreshAudioOutputs()} aria-label="Actualiser les sorties audio" title="Actualiser"><RefreshCcw size={16} /></button>
          </div>
          <p className="audio-output-note">Le choix est enregistré sur cet appareil. La sortie système est utilisée si le périphérique enregistré n’est plus disponible.</p>
          {audioOutputError && <p className="audio-output-error">{audioOutputError}</p>}
        </> : <p className="audio-output-unavailable">Ce navigateur ne permet pas à CueForge de choisir la sortie du moteur Web Audio. La sortie système reste utilisée.</p>)}
        {audioMode === 'bridge' && <>
          <div className="bridge-output-grid">
            <label><span>Régie principale</span><select value={bridgeMainOutputId} disabled={bridgeBusy} onChange={(event) => changeBridgeOutput('main', event.target.value)}>{bridgeOutputs.map((device) => <option key={device.id} value={device.id}>{device.name}</option>)}</select></label>
            <label><span>Préécoute</span><select value={bridgePreviewOutputId} disabled={bridgeBusy} onChange={(event) => changeBridgeOutput('preview', event.target.value)}>{bridgeOutputs.map((device) => <option key={device.id} value={device.id}>{device.name}</option>)}</select></label>
          </div>
          <div className="settings-actions"><button type="button" className="button ghost" disabled={bridgeBusy} onClick={refreshBridge}><RefreshCcw size={16} />Actualiser</button><button type="button" className="button ghost" disabled={bridgeBusy || !selectedProjectId} onClick={syncBridge}><CloudDownload size={16} />Synchroniser le spectacle</button></div>
        </>}
        {bridgeMessage && <p className="audio-output-note">{bridgeMessage}</p>}
        {bridgeError && <p className="audio-output-error">{bridgeError}</p>}
        {bridgeDevices.length > 0 && <div className="bridge-device-list">{bridgeDevices.map((device) => <div key={device.id}><span><strong>{device.name}</strong><small>{bridgePlatformLabel(device.platform)} · {device.lastSeenAt ? `vu ${new Date(device.lastSeenAt).toLocaleString('fr-FR')}` : 'jamais connecté'}</small></span><button type="button" className="icon-button" disabled={bridgeBusy} onClick={() => revokeBridge(device)} aria-label={`Dissocier ${device.name}`} title="Dissocier"><Trash2 size={15} /></button></div>)}</div>}
      </section>
      <section className="settings-section">
        <div className="settings-section-title"><Smartphone size={16} /><div><strong>Télécommande</strong><span>Utilisez cette vue depuis un téléphone connecté au même spectacle.</span></div></div>
        <button className="button ghost wide" onClick={onToggleRemote}><Smartphone size={17} />{remote ? 'Revenir à la régie principale' : 'Ouvrir la télécommande'}</button>
      </section>
      <section className="settings-section">
        <div className="settings-section-title"><Keyboard size={16} /><div><strong>Raccourcis clavier</strong><span>Attribuez une action d’arrêt à chaque touche globale.</span></div></div>
        <div className="settings-key-actions">
          <label><span><kbd>Échap</kbd> Touche Échap</span><select value={selectedProject?.escapeKeyAction ?? 'stop-all'} onChange={(event) => onUpdateKeyAction('escape', event.target.value as KeyAction)}>{keyActions.map((action) => <option key={action.value} value={action.value}>{action.label}</option>)}</select></label>
          <label><span><kbd>⌫</kbd> Retour arrière</span><select value={selectedProject?.backspaceKeyAction ?? 'stop-all'} onChange={(event) => onUpdateKeyAction('backspace', event.target.value as KeyAction)}>{keyActions.map((action) => <option key={action.value} value={action.value}>{action.label}</option>)}</select></label>
          <label><span><kbd>Espace</kbd> Barre d’espace</span><select value={selectedProject?.spaceKeyAction ?? 'stop-all-immediate'} onChange={(event) => onUpdateKeyAction('space', event.target.value as KeyAction)}>{keyActions.map((action) => <option key={action.value} value={action.value}>{action.label}</option>)}</select></label>
        </div>
      </section>
      <section className="settings-section">
        <div className="settings-section-title"><HardDrive size={16} /><div><strong>Offre et stockage</strong><span>{account?.name ?? 'Chargement de votre espace…'}</span></div></div>
        {account && <div className="account-plan">
          <div><strong>{user.isDemo ? 'Démonstration temporaire' : account.planName}</strong><span>{user.isDemo ? '15 fichiers importés · 5 Mo maximum par fichier' : account.accessStatus === 'trialing' && trialDaysLeft !== null ? `${trialDaysLeft} jour${trialDaysLeft > 1 ? 's' : ''} restant${trialDaysLeft > 1 ? 's' : ''}` : account.accessStatus === 'active' ? 'Accès actif' : account.accessStatus === 'grace_period' ? 'Délai de grâce' : account.accessStatus === 'suspended' ? 'Accès suspendu' : 'Lecture seule'}</span></div>
          <div className="storage-summary"><span>{formatBytes(account.storageUsedBytes)} utilisés</span><strong>{account.storageQuotaBytes === null ? 'Stockage illimité' : `sur ${formatBytes(account.storageQuotaBytes)}`}</strong></div>
          {account.storageQuotaBytes !== null && <div className="storage-meter" role="progressbar" aria-label="Stockage utilisé" aria-valuemin={0} aria-valuemax={account.storageQuotaBytes} aria-valuenow={account.storageUsedBytes}><i style={{ width: `${storagePercent}%` }} /></div>}
          {!user.isDemo && account.billing?.membershipRole === 'owner' && (account.billing.checkoutAvailable || freePlanAvailable) && <div className="billing-controls">
            {account.billing.customerPortalAvailable && account.billing.provider === 'stripe' && account.billing.status !== 'none'
              ? <button className="button ghost wide" disabled={billingBusy} onClick={openBillingPortal}>{billingBusy ? <LoaderCircle className="spin" size={16} /> : <CreditCard size={16} />}Gérer l’abonnement et les factures</button>
              : <>
                <div className={`billing-choice ${selectedFreePlan ? 'free' : ''}`}>
                  <label><span>Forfait</span><select value={selectedPlanCode} onChange={(event) => setSelectedPlanCode(event.target.value)}>{publicPlans.map((plan) => <option value={plan.code} key={plan.code}>{plan.name}</option>)}</select></label>
                  {!selectedFreePlan && <label><span>Périodicité</span><select value={billingInterval} onChange={(event) => setBillingInterval(event.target.value as 'month' | 'year')}><option value="month" disabled={selectedBillingPlan?.monthlyPriceCents === null}>Mensuelle</option><option value="year" disabled={selectedBillingPlan?.annualPriceCents === null}>Annuelle</option></select></label>}
                </div>
                {selectedFreePlan
                  ? <button className="button primary wide" disabled={billingBusy || (account.planCode === selectedPlanCode && account.accessStatus === 'active')} onClick={activateSelectedFreePlan}>{billingBusy ? <LoaderCircle className="spin" size={16} /> : <Gift size={16} />}{account.planCode === selectedPlanCode && account.accessStatus === 'active' ? 'Forfait gratuit actif' : 'Activer le forfait gratuit'}</button>
                  : <button className="button primary wide" disabled={billingBusy || !account.billing.checkoutAvailable || selectedBillingPrice === null || selectedBillingPrice === undefined} onClick={startCheckout}>{billingBusy ? <LoaderCircle className="spin" size={16} /> : <CreditCard size={16} />}Continuer avec Stripe{selectedBillingPrice !== null && selectedBillingPrice !== undefined ? ` · ${formatPrice(selectedBillingPrice)}${billingInterval === 'month' ? '/mois' : '/an'}` : ''}</button>}
              </>}
            {billingError && <p className="billing-error">{billingError}</p>}
          </div>}
        </div>}
      </section>
      <section className="settings-section">
        <div className="settings-section-title"><BookOpen size={16} /><div><strong>Aide et documentation</strong><span>Guides de prise en main, référence et dépannage.</span></div></div>
        <a className="button ghost wide" href="/docs/" target="_blank" rel="noopener noreferrer"><BookOpen size={17} />Ouvrir la documentation</a>
      </section>
      {(user.platformRole === 'admin' || user.platformRole === 'super_admin') && <section className="settings-section">
        <div className="settings-section-title"><ShieldCheck size={16} /><div><strong>Administration commerciale</strong><span>Comptes, forfaits, quotas et utilisateurs.</span></div></div>
        <a className="button ghost wide" href="/admin"><ShieldCheck size={17} />Ouvrir l’administration</a>
      </section>}
      {!user.isDemo && <section className="settings-section">
        <div className="settings-section-title"><RefreshCcw size={16} /><div><strong>Mises à jour</strong><span>CueForge {appVersion ?? '—'} sur cet appareil.</span></div></div>
        <label className="automatic-update-setting"><span><strong>Installer automatiquement</strong><small>Masque les notifications de version et recharge l’application lorsqu’aucun son n’est en lecture.</small></span><input type="checkbox" checked={automaticUpdates} onChange={(event) => onAutomaticUpdatesChange(event.target.checked)} /><i aria-hidden="true" /></label>
        <button className={`button ghost wide release-button ${hasUnseenReleases ? 'has-update' : ''}`} onClick={onOpenWhatsNew}><Gift size={17} />Voir les notes de version{hasUnseenReleases && <em>Nouveau</em>}</button>
      </section>}
      <section className="settings-account">
        <span>{user.displayName.slice(0, 1).toUpperCase()}</span><div><strong>{user.displayName}</strong><small>{user.isDemo ? 'Espace supprimé après 24 h d’inactivité' : user.email}</small></div><button className="button danger" onClick={onLogout}><LogOut size={16} />Se déconnecter</button>
      </section>
    </section>
  </div>;
}

function audioOutputErrorMessage(error: unknown): string {
  if (error instanceof DOMException && error.name === 'NotAllowedError') return 'L’accès à cette sortie audio n’a pas été autorisé.';
  if (error instanceof DOMException && error.name === 'NotFoundError') return 'Cette sortie audio n’est plus disponible.';
  if (error instanceof DOMException && error.name === 'AbortError') return 'Aucune sortie audio n’a été sélectionnée.';
  return error instanceof Error ? error.message : 'Impossible de sélectionner cette sortie audio.';
}

function bridgeErrorMessage(error: unknown): string {
  if (error instanceof TypeError) return 'CueForge Bridge ne répond pas sur cette machine. Vérifiez qu’il est ouvert.';
  return error instanceof Error ? error.message : 'CueForge Bridge est indisponible.';
}

function bridgePlatformLabel(platform: string): string {
  if (platform === 'macos') return 'macOS';
  if (platform === 'windows') return 'Windows';
  return platform;
}
