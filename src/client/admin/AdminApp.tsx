import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Activity, BadgeEuro, BookOpen, Boxes, CircleAlert, Copy, CreditCard, Database, Gauge, HardDrive, LayoutDashboard, LoaderCircle, LogOut, RefreshCcw, Search, ShieldCheck, Trash2, Users, X } from 'lucide-react';
import { AuthScreen } from '../components/AuthScreen';
import { api, ApiError } from '../lib/api';
import type { AdminAccount, AdminOverview, AdminUser, AppRelease, AuditEntry, CommercialPlan, User } from '../types';

type Section = 'overview' | 'accounts' | 'plans' | 'users' | 'documentation';
type AccountStatus = AdminAccount['accessStatus'];
type PlanEditorTarget = { mode: 'create' | 'edit'; source?: CommercialPlan };

const statusLabels: Record<AccountStatus, string> = {
  trialing: 'Essai',
  active: 'Actif',
  grace_period: 'Délai de grâce',
  read_only: 'Lecture seule',
  suspended: 'Suspendu',
};

const roleLabels: Record<User['platformRole'], string> = {
  user: 'Utilisateur',
  support: 'Support',
  admin: 'Administrateur',
  super_admin: 'Super-admin',
};

function formatBytes(bytes: number): string {
  const units = ['o', 'Ko', 'Mo', 'Go', 'To'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) { value /= 1024; unit += 1; }
  return `${value >= 10 || unit === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[unit]}`;
}

function formatPrice(cents: number | null, suffix: string): string {
  return cents === null ? 'Non défini' : `${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100)}${suffix}`;
}

function toLocalDate(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function AdminApp() {
  const [user, setUser] = useState<User | null>();
  const [section, setSection] = useState<Section>('overview');
  const [overview, setOverview] = useState<AdminOverview>();
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [plans, setPlans] = useState<CommercialPlan[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [adminReleases, setAdminReleases] = useState<AppRelease[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingAccount, setEditingAccount] = useState<AdminAccount>();
  const [editingPlan, setEditingPlan] = useState<PlanEditorTarget>();

  useEffect(() => {
    api.me().then(({ user: current }) => setUser(current)).catch((cause) => {
      if (cause instanceof ApiError && cause.status === 401) setUser(null);
      else setError(cause instanceof Error ? cause.message : 'Connexion impossible.');
    }).finally(() => setLoading(false));
  }, []);

  const loadSection = useCallback(async () => {
    if (!user || !['admin', 'super_admin'].includes(user.platformRole)) return;
    setLoading(true);
    setError('');
    try {
      if (section === 'overview') {
        const result = await api.adminOverview();
        setOverview(result.overview);
        setAudit(result.recentAudit);
      } else if (section === 'accounts') {
        setAccounts((await api.adminAccounts(search)).accounts);
        setPlans((await api.adminPlans()).plans);
      } else if (section === 'plans') {
        setPlans((await api.adminPlans()).plans);
      } else if (section === 'users') {
        setUsers((await api.adminUsers(search)).users);
      } else {
        setAdminReleases((await api.adminReleases()).releases);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Chargement impossible.');
    } finally {
      setLoading(false);
    }
  }, [search, section, user]);

  useEffect(() => { loadSection().catch(() => undefined); }, [loadSection]);

  const logout = async () => {
    await api.logout().catch(() => undefined);
    window.location.href = '/admin';
  };

  if (user === undefined || (loading && !user)) return <div className="admin-loading"><LoaderCircle className="spin" /><span>Chargement de l’administration</span></div>;
  if (!user) return <AuthScreen onAuthenticated={setUser} />;
  if (!['admin', 'super_admin'].includes(user.platformRole)) return <main className="admin-denied"><ShieldCheck size={44} /><h1>Administration SonoRiva</h1><p>Ce compte ne possède pas de rôle d’administration.</p><div><a className="button ghost" href="/">Revenir à SonoRiva</a><button className="button danger" onClick={logout}>Se déconnecter</button></div></main>;

  const sections: Array<{ id: Section; label: string; icon: typeof Gauge }> = [
    { id: 'overview', label: 'Vue d’ensemble', icon: LayoutDashboard },
    { id: 'accounts', label: 'Comptes', icon: Boxes },
    { id: 'plans', label: 'Forfaits', icon: BadgeEuro },
    { id: 'users', label: 'Utilisateurs', icon: Users },
    { id: 'documentation', label: 'Documentation', icon: BookOpen },
  ];

  return <div className="admin-shell">
    <aside className="admin-sidebar">
      <a className="admin-brand" href="/"><img className="brand-mark small" src="/sonoriva-logo.svg" alt="" /><span><strong>SonoRiva</strong><small>Administration</small></span></a>
      <nav>{sections.map((item) => <button key={item.id} className={section === item.id ? 'active' : ''} onClick={() => { setSection(item.id); setSearch(''); }}><item.icon size={18} />{item.label}</button>)}</nav>
      <div className="admin-identity"><span>{user.displayName.slice(0, 1).toUpperCase()}</span><div><strong>{user.displayName}</strong><small>{roleLabels[user.platformRole]}</small></div><button onClick={logout} title="Se déconnecter"><LogOut size={17} /></button></div>
    </aside>
    <main className="admin-main">
      <header className="admin-topbar"><div><p className="eyebrow">Pilotage commercial</p><h1>{sections.find((item) => item.id === section)?.label}</h1></div><button className="admin-refresh" onClick={() => loadSection()} disabled={loading}><RefreshCcw className={loading ? 'spin' : ''} size={17} />Actualiser</button></header>
      {error && <div className="admin-error"><CircleAlert size={18} />{error}<button onClick={() => setError('')}><X size={15} /></button></div>}
      {section === 'overview' && overview && <OverviewSection overview={overview} audit={audit} />}
      {section === 'accounts' && <AccountsSection accounts={accounts} canEdit={user.platformRole === 'super_admin'} search={search} onSearch={setSearch} onSubmitSearch={loadSection} onEdit={setEditingAccount} />}
      {section === 'plans' && <PlansSection plans={plans} canEdit={user.platformRole === 'super_admin'} onEdit={(plan) => setEditingPlan({ mode: 'edit', source: plan })} onCreate={() => setEditingPlan({ mode: 'create' })} onDuplicate={(plan) => setEditingPlan({ mode: 'create', source: plan })} />}
      {section === 'users' && <UsersSection users={users} currentUser={user} search={search} onSearch={setSearch} onSubmitSearch={loadSection} onChanged={loadSection} onError={setError} />}
      {section === 'documentation' && <AdminDocumentation releases={adminReleases} />}
    </main>
    {editingAccount && <AccountEditor account={editingAccount} plans={plans} onClose={() => setEditingAccount(undefined)} onSaved={() => { setEditingAccount(undefined); loadSection().catch(() => undefined); }} onError={setError} />}
    {editingPlan && <PlanEditor target={editingPlan} onClose={() => setEditingPlan(undefined)} onSaved={() => { setEditingPlan(undefined); loadSection().catch(() => undefined); }} onError={setError} />}
  </div>;
}

function AdminDocumentation({ releases }: { releases: AppRelease[] }) {
  return <div className="admin-content admin-docs">
    <section className="admin-panel admin-doc-section"><header><div><h2>Accès au dashboard</h2><p>Rôles de plateforme et droits associés à l’adresse /admin.</p></div></header><div className="admin-doc-body"><table><thead><tr><th>Rôle</th><th>Accès</th></tr></thead><tbody><tr><td><code>user</code></td><td>Aucun accès administratif</td></tr><tr><td><code>support</code></td><td>Aucun accès administratif</td></tr><tr><td><code>admin</code></td><td>Consultation des comptes, forfaits, utilisateurs et journaux</td></tr><tr><td><code>super_admin</code></td><td>Consultation et modification des données commerciales</td></tr></tbody></table></div></section>
    <section className="admin-panel admin-doc-section"><header><div><h2>Comptes et accès</h2><p>Structure commerciale appliquée aux espaces clients.</p></div></header><div className="admin-doc-body"><p>Un compte regroupe ses membres, ses spectacles, son forfait, son état d’accès et son abonnement. Le quota du forfait s’applique sauf lorsqu’un quota exceptionnel est défini sur le compte.</p><dl><div><dt><code>trialing</code></dt><dd>Essai actif jusqu’à la date indiquée.</dd></div><div><dt><code>active</code></dt><dd>Écritures et lecture autorisées.</dd></div><div><dt><code>grace_period</code></dt><dd>Accès maintenu pendant le délai de régularisation.</dd></div><div><dt><code>read_only</code></dt><dd>Lecture autorisée et modifications bloquées.</dd></div><div><dt><code>suspended</code></dt><dd>Modifications bloquées par l’administration.</dd></div></dl></div></section>
    <section className="admin-panel admin-doc-section"><header><div><h2>Forfaits et publication</h2><p>Prix, quotas, droits fonctionnels, essais et affichage sur sonoriva.fr.</p></div></header><div className="admin-doc-body"><p>Un forfait définit son code, son nom, sa description, son quota, sa durée d’essai, ses prix, ses fonctionnalités disponibles, son nombre maximal de spectacles, son état actif et son utilisation comme forfait par défaut.</p><ul><li><strong>Fonctionnalités disponibles</strong> contrôle les dispositions personnalisées, les playlists et la télécommande.</li><li>Une limite de spectacles vide correspond à un nombre illimité.</li><li><strong>Visible sur le site</strong> publie le forfait dans l’API publique.</li><li><strong>Mis en avant</strong> sélectionne la carte principale du site ; un seul forfait peut être mis en avant.</li><li><strong>Ordre d’affichage</strong> détermine le classement des cartes, puis le nom départage les valeurs identiques.</li><li>Un forfait dont tous les prix renseignés valent 0 € est gratuit et s’active sans Stripe. Un prix vide désactive la périodicité correspondante.</li><li>Un forfait ne peut être supprimé que s’il n’est ni attribué, ni défini par défaut.</li></ul></div></section>
    <section className="admin-panel admin-doc-section"><header><div><h2>Abonnements et journal</h2><p>Données conservées par le pilotage commercial.</p></div></header><div className="admin-doc-body"><p>Stripe conserve les clients, tarifs, abonnements, factures et paiements. SonoRiva conserve une projection de l’abonnement qui détermine le forfait, le quota et l’état d’accès.</p><p>Le bouton de synchronisation d’un forfait crée ou actualise son produit et ses tarifs Stripe dans l’environnement configuré. Un changement de montant crée un nouveau tarif ; les abonnements existants conservent leur ancien tarif.</p><p>Les webhooks signés pilotent les droits. Les retours de Checkout ne modifient jamais directement l’accès. Chaque événement Stripe est traité de manière idempotente et journalisé.</p></div></section>
    <section className="admin-panel admin-doc-section"><header><div><h2>Versions de l’administration</h2><p>Évolutions du dashboard, des forfaits et de la publication commerciale.</p></div></header><div className="admin-release-list">{releases.map((release) => <article key={`${release.audience}-${release.version}`}><header><div><strong>{release.title}</strong><span>Version {release.version}</span></div><time dateTime={release.date}>{new Date(`${release.date}T00:00:00Z`).toLocaleDateString('fr-FR', { timeZone: 'UTC', dateStyle: 'long' })}</time></header><p>{release.summary}</p><ul>{release.changes.map((change) => <li key={change}>{change}</li>)}</ul></article>)}{releases.length === 0 && <p className="admin-empty">Aucune version administrative.</p>}</div></section>
  </div>;
}

function OverviewSection({ overview, audit }: { overview: AdminOverview; audit: AuditEntry[] }) {
  const stats = [
    { label: 'Utilisateurs', value: overview.users, icon: Users },
    { label: 'Comptes', value: overview.accounts, icon: Boxes },
    { label: 'Essais', value: overview.trialingAccounts, icon: Activity },
    { label: 'Comptes actifs', value: overview.activeAccounts, icon: ShieldCheck },
    { label: 'Accès restreints', value: overview.restrictedAccounts, icon: CircleAlert },
    { label: 'Stockage total', value: formatBytes(overview.storageUsedBytes), icon: Database },
  ];
  return <div className="admin-content">
    <section className="admin-stat-grid">{stats.map((stat) => <article key={stat.label}><span><stat.icon size={19} /></span><strong>{stat.value}</strong><small>{stat.label}</small></article>)}</section>
    <section className="admin-panel"><header><div><h2>Activité administrative</h2><p>Dernières modifications enregistrées.</p></div></header><div className="audit-list">{audit.map((entry) => <article key={entry.id}><span className="audit-dot" /><div><strong>{entry.action}</strong><small>{entry.actorEmail ?? 'Système'} · {entry.entityType} {entry.entityId.slice(0, 8)}</small></div><time>{new Date(entry.createdAt).toLocaleString('fr-FR')}</time></article>)}{audit.length === 0 && <p className="admin-empty">Aucune action enregistrée.</p>}</div></section>
  </div>;
}

function SearchBar({ value, onChange, onSubmit, placeholder }: { value: string; onChange: (value: string) => void; onSubmit: () => void; placeholder: string }) {
  return <form className="admin-search" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}><Search size={17} /><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} /><button>Rechercher</button></form>;
}

function AccountsSection({ accounts, canEdit, search, onSearch, onSubmitSearch, onEdit }: { accounts: AdminAccount[]; canEdit: boolean; search: string; onSearch: (value: string) => void; onSubmitSearch: () => void; onEdit: (account: AdminAccount) => void }) {
  return <section className="admin-panel"><header><div><h2>Espaces clients</h2><p>Forfait, accès, abonnement et consommation.</p></div><SearchBar value={search} onChange={onSearch} onSubmit={onSubmitSearch} placeholder="Nom ou e-mail" /></header><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Compte</th><th>Forfait</th><th>État</th><th>Stockage</th><th>Contenu</th>{canEdit && <th />}</tr></thead><tbody>{accounts.map((account) => <tr key={account.id}><td><strong>{account.name}</strong><small>{account.subscriptionStatus ?? 'Sans abonnement'}</small></td><td>{account.planName}</td><td><span className={`status status-${account.accessStatus}`}>{statusLabels[account.accessStatus]}</span></td><td><strong>{formatBytes(account.storageUsedBytes)}</strong><small>sur {formatBytes(account.storageQuotaBytes)}</small></td><td>{account.projectCount} projet{account.projectCount > 1 ? 's' : ''}<small>{account.memberCount} membre{account.memberCount > 1 ? 's' : ''}</small></td>{canEdit && <td><button className="table-action" onClick={() => onEdit(account)}>Gérer</button></td>}</tr>)}</tbody></table>{accounts.length === 0 && <p className="admin-empty">Aucun compte trouvé.</p>}</div></section>;
}

function PlansSection({ plans, canEdit, onEdit, onCreate, onDuplicate }: { plans: CommercialPlan[]; canEdit: boolean; onEdit: (plan: CommercialPlan) => void; onCreate: () => void; onDuplicate: (plan: CommercialPlan) => void }) {
  const activePlans = plans.filter((plan) => plan.active).length;
  const publicPlans = plans.filter((plan) => plan.active && plan.visibleOnWebsite).length;
  const assignedAccounts = plans.reduce((total, plan) => total + plan.accountCount, 0);
  const defaultPlan = plans.find((plan) => plan.isDefault);
  return <div className="admin-content">
    <div className="admin-section-actions"><p>Les prix, quotas et essais sont appliqués par forfait.</p>{canEdit && <button className="button primary" onClick={onCreate}>Nouveau forfait</button>}</div>
    <section className="plan-summary-grid">
      <article><span><BadgeEuro size={18} /></span><strong>{plans.length}</strong><small>Forfaits configurés</small></article>
      <article><span><ShieldCheck size={18} /></span><strong>{activePlans} / {publicPlans}</strong><small>Actifs / visibles sur le site</small></article>
      <article><span><Users size={18} /></span><strong>{assignedAccounts}</strong><small>Comptes attribués</small></article>
      <article><span><Gauge size={18} /></span><strong>{defaultPlan?.name ?? '—'}</strong><small>Forfait par défaut</small></article>
    </section>
    <section className="plan-grid">{plans.map((plan) => <article key={plan.code} className={!plan.active ? 'inactive' : ''}>
      <header><span>{plan.code}</span><div>{plan.isDemoPlan && <em className="demo">Démo publique</em>}{plan.isDefault && <em>Par défaut</em>}{plan.visibleOnWebsite && <em className="public">Site</em>}<em className={plan.active ? 'active' : 'disabled'}>{plan.active ? 'Actif' : 'Inactif'}</em></div></header>
      <h2>{plan.name}</h2>
      <p>{plan.description || 'Aucune description.'}</p>
      <div className="plan-price"><strong>{plan.isDemoPlan ? `${plan.demoLifetimeHours ?? 24} h d’inactivité` : formatPrice(plan.monthlyPriceCents, '/mois')}</strong><small>{plan.isDemoPlan ? `${plan.demoMaxUploads ?? 15} imports · ${formatBytes(plan.demoMaxFileBytes ?? 5 * 1024 ** 2)} par fichier` : formatPrice(plan.annualPriceCents, '/an')}</small></div>
      <dl><div><dt><HardDrive size={14} />Stockage</dt><dd>{formatBytes(plan.storageQuotaBytes)}</dd></div><div><dt><Activity size={14} />{plan.isDemoPlan ? 'Spectacles' : 'Essai'}</dt><dd>{plan.isDemoPlan ? plan.maxProjects ?? 'Illimité' : `${plan.trialDays} jours`}</dd></div><div><dt><Users size={14} />Comptes</dt><dd>{plan.accountCount}</dd></div></dl>
      {canEdit && <footer>{plan.isDemoPlan ? <span /> : <button className="table-action secondary" onClick={() => onDuplicate(plan)}><Copy size={14} />Dupliquer</button>}<button className="table-action" onClick={() => onEdit(plan)}>Modifier</button></footer>}
    </article>)}</section>
    {plans.length === 0 && <section className="admin-panel"><p className="admin-empty">Aucun forfait configuré.</p></section>}
  </div>;
}

function UsersSection({ users, currentUser, search, onSearch, onSubmitSearch, onChanged, onError }: { users: AdminUser[]; currentUser: User; search: string; onSearch: (value: string) => void; onSubmitSearch: () => void; onChanged: () => void; onError: (message: string) => void }) {
  const changeUser = async (user: AdminUser, input: { platformRole?: User['platformRole']; disabled?: boolean }) => {
    try { await api.updateAdminUser(user.id, input); onChanged(); } catch (cause) { onError(cause instanceof Error ? cause.message : 'Modification impossible.'); }
  };
  return <section className="admin-panel"><header><div><h2>Utilisateurs</h2><p>Rôles de plateforme et activation des accès.</p></div><SearchBar value={search} onChange={onSearch} onSubmit={onSubmitSearch} placeholder="Nom ou e-mail" /></header><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Utilisateur</th><th>Comptes</th><th>Rôle plateforme</th><th>Accès</th></tr></thead><tbody>{users.map((item) => <tr key={item.id}><td><strong>{item.displayName}</strong><small>{item.email}</small></td><td>{item.accountCount}</td><td><select value={item.platformRole} disabled={currentUser.platformRole !== 'super_admin' || item.id === currentUser.id} onChange={(event) => changeUser(item, { platformRole: event.target.value as User['platformRole'] })}>{Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></td><td><button className={`access-toggle ${item.disabledAt ? 'disabled' : 'enabled'}`} disabled={currentUser.platformRole !== 'super_admin' || item.id === currentUser.id} onClick={() => changeUser(item, { disabled: !item.disabledAt })}>{item.disabledAt ? 'Désactivé' : 'Actif'}</button></td></tr>)}</tbody></table>{users.length === 0 && <p className="admin-empty">Aucun utilisateur trouvé.</p>}</div></section>;
}

function AccountEditor({ account, plans, onClose, onSaved, onError }: { account: AdminAccount; plans: CommercialPlan[]; onClose: () => void; onSaved: () => void; onError: (message: string) => void }) {
  const [saving, setSaving] = useState(false);
  const [planCode, setPlanCode] = useState(account.planCode);
  const selectedPlan = plans.find((plan) => plan.code === planCode);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true);
    const data = new FormData(event.currentTarget);
    const trialEndsAt = String(data.get('trialEndsAt'));
    const quota = String(data.get('storageQuotaOverrideGb')).trim();
    try {
      await api.updateAdminAccount(account.id, {
        name: String(data.get('name')),
        planCode: String(data.get('planCode')),
        accessStatus: String(data.get('accessStatus')),
        trialEndsAt: trialEndsAt ? new Date(trialEndsAt).toISOString() : null,
        storageQuotaOverrideBytes: quota ? Math.round(Number(quota) * 1024 ** 3) : null,
      });
      onSaved();
    } catch (cause) { onError(cause instanceof Error ? cause.message : 'Enregistrement impossible.'); setSaving(false); }
  }
  return <div className="admin-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><form className="admin-modal" onSubmit={submit}><header><div><p className="eyebrow">Compte client</p><h2>{account.name}</h2></div><button type="button" onClick={onClose}><X /></button></header><label>Nom du compte<input name="name" defaultValue={account.name} required /></label><label>Forfait<select name="planCode" value={planCode} onChange={(event) => setPlanCode(event.target.value)}>{plans.filter((plan) => !plan.isDemoPlan && (plan.active || plan.code === account.planCode)).map((plan) => <option key={plan.code} value={plan.code}>{plan.name}</option>)}</select></label>{selectedPlan && <div className="account-plan-summary"><div><span>Mensuel</span><strong>{formatPrice(selectedPlan.monthlyPriceCents, '')}</strong></div><div><span>Annuel</span><strong>{formatPrice(selectedPlan.annualPriceCents, '')}</strong></div><div><span>Quota</span><strong>{formatBytes(selectedPlan.storageQuotaBytes)}</strong></div><div><span>Essai</span><strong>{selectedPlan.trialDays} jours</strong></div></div>}<label>État d’accès<select name="accessStatus" defaultValue={account.accessStatus}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Fin de l’essai<input name="trialEndsAt" type="datetime-local" defaultValue={toLocalDate(account.trialEndsAt)} /></label><label>Quota exceptionnel en Go <small>Laisser vide pour utiliser le quota du forfait.</small><input name="storageQuotaOverrideGb" type="number" min="0.001" step="0.001" defaultValue={account.storageQuotaOverrideBytes ? account.storageQuotaOverrideBytes / 1024 ** 3 : ''} /></label><footer><button type="button" className="button ghost" onClick={onClose}>Annuler</button><button className="button primary" disabled={saving}>{saving && <LoaderCircle className="spin" size={16} />}Enregistrer</button></footer></form></div>;
}

function PlanEditor({ target, onClose, onSaved, onError }: { target: PlanEditorTarget; onClose: () => void; onSaved: () => void; onError: (message: string) => void }) {
  const current = target.mode === 'edit' ? target.source : undefined;
  const template = target.source;
  const demoPlan = current?.isDemoPlan ?? false;
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [synchronizing, setSynchronizing] = useState(false);
  const [stripeResult, setStripeResult] = useState('');
  const title = useMemo(() => current?.name ?? (template ? `Dupliquer ${template.name}` : 'Nouveau forfait'), [current, template]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true);
    const data = new FormData(event.currentTarget);
    const price = (name: string) => { const value = String(data.get(name)).trim(); return value ? Math.round(Number(value) * 100) : null; };
    const input = {
      name: String(data.get('name')),
      description: String(data.get('description')),
      storageQuotaBytes: Math.round(Number(data.get('storageGb')) * 1024 ** 3),
      monthlyPriceCents: demoPlan ? null : price('monthlyPrice'),
      annualPriceCents: demoPlan ? null : price('annualPrice'),
      trialDays: demoPlan ? 0 : Number(data.get('trialDays')),
      active: demoPlan || data.get('active') === 'on',
      isDefault: !demoPlan && data.get('isDefault') === 'on',
      visibleOnWebsite: !demoPlan && data.get('visibleOnWebsite') === 'on',
      featuredOnWebsite: !demoPlan && data.get('featuredOnWebsite') === 'on',
      customLayoutsEnabled: data.get('customLayoutsEnabled') === 'on',
      playlistsEnabled: data.get('playlistsEnabled') === 'on',
      remoteControlEnabled: data.get('remoteControlEnabled') === 'on',
      maxProjects: String(data.get('maxProjects')).trim() ? Number(data.get('maxProjects')) : null,
      demoLifetimeHours: demoPlan ? Number(data.get('demoLifetimeHours')) : null,
      demoMaxUploads: demoPlan ? Number(data.get('demoMaxUploads')) : null,
      demoMaxFileBytes: demoPlan ? Math.round(Number(data.get('demoMaxFileMb')) * 1024 ** 2) : null,
      displayOrder: demoPlan ? current?.displayOrder ?? 0 : Number(data.get('displayOrder')),
    };
    try {
      if (current) await api.updateAdminPlan(current.code, input);
      else await api.createAdminPlan({ code: String(data.get('code')), ...input });
      onSaved();
    } catch (cause) { onError(cause instanceof Error ? cause.message : 'Enregistrement impossible.'); setSaving(false); }
  }
  async function removePlan() {
    if (!current) return;
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setSaving(true);
    try { await api.deleteAdminPlan(current.code); onSaved(); }
    catch (cause) { onError(cause instanceof Error ? cause.message : 'Suppression impossible.'); setSaving(false); setConfirmDelete(false); }
  }
  async function synchronizeStripe() {
    if (!current) return;
    setSynchronizing(true);
    setStripeResult('');
    try {
      const result = await api.syncAdminPlanStripe(current.code);
      setStripeResult(`Synchronisé en mode ${result.billing.environment === 'test' ? 'test' : 'production'} · ${result.billing.productId}`);
    } catch (cause) {
      onError(cause instanceof Error ? cause.message : 'Synchronisation Stripe impossible.');
    } finally {
      setSynchronizing(false);
    }
  }
  const deleteDisabled = Boolean(current?.isDemoPlan || current?.isDefault || current?.accountCount);
  return <div className="admin-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <form className="admin-modal" onSubmit={submit}>
      <header><div><p className="eyebrow">{demoPlan ? 'Démonstration publique' : 'Catalogue commercial'}</p><h2>{title}</h2></div><button type="button" onClick={onClose}><X /></button></header>
      <label>Code<input name="code" defaultValue={current?.code ?? ''} disabled={Boolean(current)} required pattern="[a-z0-9][a-z0-9_-]{1,39}" placeholder={template ? `${template.code}-copie` : 'exemple-pro'} /></label>
      <label>Nom<input name="name" defaultValue={current?.name ?? (template ? `Copie de ${template.name}` : '')} required /></label>
      <label>Description<textarea name="description" defaultValue={template?.description ?? ''} rows={3} /></label>
      <div className="admin-form-grid">
        <label>Stockage en Go<input name="storageGb" type="number" min="0.001" step="0.001" defaultValue={template ? template.storageQuotaBytes / 1024 ** 3 : 5} required /></label>
        <label>Nombre maximal de spectacles <small>Laisser vide pour un nombre illimité.</small><input name="maxProjects" type="number" min="1" max="10000" step="1" defaultValue={template?.maxProjects ?? ''} /></label>
        {demoPlan ? <>
          <label>Durée d’inactivité en heures<input name="demoLifetimeHours" type="number" min="1" max="168" step="1" defaultValue={template?.demoLifetimeHours ?? 24} required /></label>
          <label>Nombre maximal de fichiers importés<input name="demoMaxUploads" type="number" min="0" max="10000" step="1" defaultValue={template?.demoMaxUploads ?? 15} required /></label>
          <label>Taille maximale par fichier en Mo<input name="demoMaxFileMb" type="number" min="0.001" step="0.001" defaultValue={(template?.demoMaxFileBytes ?? 5 * 1024 ** 2) / 1024 ** 2} required /></label>
        </> : <>
          <label>Durée d’essai<input name="trialDays" type="number" min="0" max="365" defaultValue={template?.trialDays ?? 14} required /></label>
          <label>Prix mensuel (€)<input name="monthlyPrice" type="number" min="0" step="0.01" defaultValue={template?.monthlyPriceCents === null || template?.monthlyPriceCents === undefined ? '' : template.monthlyPriceCents / 100} /></label>
          <label>Prix annuel (€)<input name="annualPrice" type="number" min="0" step="0.01" defaultValue={template?.annualPriceCents === null || template?.annualPriceCents === undefined ? '' : template.annualPriceCents / 100} /></label>
          <label>Ordre d’affichage<input name="displayOrder" type="number" min="0" max="10000" step="1" defaultValue={template?.displayOrder ?? 0} required /></label>
        </>}
      </div>
      <div className="admin-feature-access">
        <strong>Fonctionnalités disponibles</strong>
        <div className="admin-checks">
          <label><input name="customLayoutsEnabled" type="checkbox" defaultChecked={template?.customLayoutsEnabled ?? true} />Modification et enregistrement des dispositions</label>
          <label><input name="playlistsEnabled" type="checkbox" defaultChecked={template?.playlistsEnabled ?? true} />Playlists</label>
          <label><input name="remoteControlEnabled" type="checkbox" defaultChecked={template?.remoteControlEnabled ?? true} />Télécommande</label>
        </div>
      </div>
      {demoPlan ? <p className="plan-delete-note">Ce forfait interne alimente les sessions temporaires ouvertes depuis la démonstration publique.</p> : <div className="admin-checks"><label><input name="active" type="checkbox" defaultChecked={template?.active ?? true} />Forfait actif</label><label><input name="isDefault" type="checkbox" defaultChecked={current?.isDefault ?? false} />Forfait par défaut</label><label><input name="visibleOnWebsite" type="checkbox" defaultChecked={current?.visibleOnWebsite ?? false} />Visible sur le site</label><label><input name="featuredOnWebsite" type="checkbox" defaultChecked={current?.featuredOnWebsite ?? false} />Mis en avant</label></div>}
      {current && !demoPlan && <div className="stripe-sync"><button type="button" className="button ghost" disabled={saving || synchronizing} onClick={synchronizeStripe}>{synchronizing ? <LoaderCircle className="spin" size={16} /> : <CreditCard size={16} />}Synchroniser les tarifs Stripe</button><small>{stripeResult || 'Utilise exclusivement l’environnement Stripe configuré sur le serveur.'}</small></div>}
      {current && <p className="plan-delete-note">{current.isDemoPlan ? 'Le forfait de démonstration est protégé et ne peut pas être supprimé.' : current.isDefault ? 'Le forfait par défaut ne peut pas être supprimé.' : current.accountCount > 0 ? `${current.accountCount} compte${current.accountCount > 1 ? 's utilisent' : ' utilise'} ce forfait.` : 'Ce forfait n’est attribué à aucun compte.'}</p>}
      <footer className={current ? 'with-delete' : ''}>{current && <button type="button" className={`button danger ${confirmDelete ? 'confirm' : ''}`} disabled={saving || deleteDisabled} onClick={removePlan}><Trash2 size={15} />{confirmDelete ? 'Confirmer la suppression' : 'Supprimer'}</button>}<span /><button type="button" className="button ghost" onClick={onClose}>Annuler</button><button className="button primary" disabled={saving}>{saving && <LoaderCircle className="spin" size={16} />}Enregistrer</button></footer>
    </form>
  </div>;
}
