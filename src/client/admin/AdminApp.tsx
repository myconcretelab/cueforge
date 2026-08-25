import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Activity, BadgeEuro, Boxes, CircleAlert, Database, Gauge, LayoutDashboard, LoaderCircle, LogOut, RefreshCcw, Search, ShieldCheck, Users, X } from 'lucide-react';
import { AuthScreen } from '../components/AuthScreen';
import { api, ApiError } from '../lib/api';
import type { AdminAccount, AdminOverview, AdminUser, AuditEntry, CommercialPlan, User } from '../types';

type Section = 'overview' | 'accounts' | 'plans' | 'users';
type AccountStatus = AdminAccount['accessStatus'];

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
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingAccount, setEditingAccount] = useState<AdminAccount>();
  const [editingPlan, setEditingPlan] = useState<CommercialPlan | 'new'>();

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
      } else {
        setUsers((await api.adminUsers(search)).users);
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
  if (!['admin', 'super_admin'].includes(user.platformRole)) return <main className="admin-denied"><ShieldCheck size={44} /><h1>Administration CueForge</h1><p>Ce compte ne possède pas de rôle d’administration.</p><div><a className="button ghost" href="/">Revenir à CueForge</a><button className="button danger" onClick={logout}>Se déconnecter</button></div></main>;

  const sections: Array<{ id: Section; label: string; icon: typeof Gauge }> = [
    { id: 'overview', label: 'Vue d’ensemble', icon: LayoutDashboard },
    { id: 'accounts', label: 'Comptes', icon: Boxes },
    { id: 'plans', label: 'Forfaits', icon: BadgeEuro },
    { id: 'users', label: 'Utilisateurs', icon: Users },
  ];

  return <div className="admin-shell">
    <aside className="admin-sidebar">
      <a className="admin-brand" href="/"><span className="brand-mark small">CF</span><span><strong>CueForge</strong><small>Administration</small></span></a>
      <nav>{sections.map((item) => <button key={item.id} className={section === item.id ? 'active' : ''} onClick={() => { setSection(item.id); setSearch(''); }}><item.icon size={18} />{item.label}</button>)}</nav>
      <div className="admin-identity"><span>{user.displayName.slice(0, 1).toUpperCase()}</span><div><strong>{user.displayName}</strong><small>{roleLabels[user.platformRole]}</small></div><button onClick={logout} title="Se déconnecter"><LogOut size={17} /></button></div>
    </aside>
    <main className="admin-main">
      <header className="admin-topbar"><div><p className="eyebrow">Pilotage commercial</p><h1>{sections.find((item) => item.id === section)?.label}</h1></div><button className="admin-refresh" onClick={() => loadSection()} disabled={loading}><RefreshCcw className={loading ? 'spin' : ''} size={17} />Actualiser</button></header>
      {error && <div className="admin-error"><CircleAlert size={18} />{error}<button onClick={() => setError('')}><X size={15} /></button></div>}
      {section === 'overview' && overview && <OverviewSection overview={overview} audit={audit} />}
      {section === 'accounts' && <AccountsSection accounts={accounts} canEdit={user.platformRole === 'super_admin'} search={search} onSearch={setSearch} onSubmitSearch={loadSection} onEdit={setEditingAccount} />}
      {section === 'plans' && <PlansSection plans={plans} canEdit={user.platformRole === 'super_admin'} onEdit={setEditingPlan} />}
      {section === 'users' && <UsersSection users={users} currentUser={user} search={search} onSearch={setSearch} onSubmitSearch={loadSection} onChanged={loadSection} onError={setError} />}
    </main>
    {editingAccount && <AccountEditor account={editingAccount} plans={plans} onClose={() => setEditingAccount(undefined)} onSaved={() => { setEditingAccount(undefined); loadSection().catch(() => undefined); }} onError={setError} />}
    {editingPlan && <PlanEditor plan={editingPlan} onClose={() => setEditingPlan(undefined)} onSaved={() => { setEditingPlan(undefined); loadSection().catch(() => undefined); }} onError={setError} />}
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

function PlansSection({ plans, canEdit, onEdit }: { plans: CommercialPlan[]; canEdit: boolean; onEdit: (plan: CommercialPlan | 'new') => void }) {
  return <div className="admin-content"><div className="admin-section-actions"><p>Les comptes utilisent les quotas et la durée d’essai de ces forfaits.</p>{canEdit && <button className="button primary" onClick={() => onEdit('new')}>Nouveau forfait</button>}</div><section className="plan-grid">{plans.map((plan) => <article key={plan.code} className={!plan.active ? 'inactive' : ''}><header><span>{plan.code}</span>{plan.isDefault && <em>Par défaut</em>}</header><h2>{plan.name}</h2><p>{plan.description || 'Aucune description.'}</p><dl><div><dt>Stockage</dt><dd>{formatBytes(plan.storageQuotaBytes)}</dd></div><div><dt>Essai</dt><dd>{plan.trialDays} jours</dd></div><div><dt>Mensuel</dt><dd>{formatPrice(plan.monthlyPriceCents, '/mois')}</dd></div><div><dt>Annuel</dt><dd>{formatPrice(plan.annualPriceCents, '/an')}</dd></div></dl>{canEdit && <button className="table-action" onClick={() => onEdit(plan)}>Modifier</button>}</article>)}</section></div>;
}

function UsersSection({ users, currentUser, search, onSearch, onSubmitSearch, onChanged, onError }: { users: AdminUser[]; currentUser: User; search: string; onSearch: (value: string) => void; onSubmitSearch: () => void; onChanged: () => void; onError: (message: string) => void }) {
  const changeUser = async (user: AdminUser, input: { platformRole?: User['platformRole']; disabled?: boolean }) => {
    try { await api.updateAdminUser(user.id, input); onChanged(); } catch (cause) { onError(cause instanceof Error ? cause.message : 'Modification impossible.'); }
  };
  return <section className="admin-panel"><header><div><h2>Utilisateurs</h2><p>Rôles de plateforme et activation des accès.</p></div><SearchBar value={search} onChange={onSearch} onSubmit={onSubmitSearch} placeholder="Nom ou e-mail" /></header><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Utilisateur</th><th>Comptes</th><th>Rôle plateforme</th><th>Accès</th></tr></thead><tbody>{users.map((item) => <tr key={item.id}><td><strong>{item.displayName}</strong><small>{item.email}</small></td><td>{item.accountCount}</td><td><select value={item.platformRole} disabled={currentUser.platformRole !== 'super_admin' || item.id === currentUser.id} onChange={(event) => changeUser(item, { platformRole: event.target.value as User['platformRole'] })}>{Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></td><td><button className={`access-toggle ${item.disabledAt ? 'disabled' : 'enabled'}`} disabled={currentUser.platformRole !== 'super_admin' || item.id === currentUser.id} onClick={() => changeUser(item, { disabled: !item.disabledAt })}>{item.disabledAt ? 'Désactivé' : 'Actif'}</button></td></tr>)}</tbody></table>{users.length === 0 && <p className="admin-empty">Aucun utilisateur trouvé.</p>}</div></section>;
}

function AccountEditor({ account, plans, onClose, onSaved, onError }: { account: AdminAccount; plans: CommercialPlan[]; onClose: () => void; onSaved: () => void; onError: (message: string) => void }) {
  const [saving, setSaving] = useState(false);
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
  return <div className="admin-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><form className="admin-modal" onSubmit={submit}><header><div><p className="eyebrow">Compte client</p><h2>{account.name}</h2></div><button type="button" onClick={onClose}><X /></button></header><label>Nom du compte<input name="name" defaultValue={account.name} required /></label><label>Forfait<select name="planCode" defaultValue={account.planCode}>{plans.filter((plan) => plan.active || plan.code === account.planCode).map((plan) => <option key={plan.code} value={plan.code}>{plan.name}</option>)}</select></label><label>État d’accès<select name="accessStatus" defaultValue={account.accessStatus}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Fin de l’essai<input name="trialEndsAt" type="datetime-local" defaultValue={toLocalDate(account.trialEndsAt)} /></label><label>Quota exceptionnel en Go <small>Laisser vide pour utiliser le quota du forfait.</small><input name="storageQuotaOverrideGb" type="number" min="0.001" step="0.001" defaultValue={account.storageQuotaOverrideBytes ? account.storageQuotaOverrideBytes / 1024 ** 3 : ''} /></label><footer><button type="button" className="button ghost" onClick={onClose}>Annuler</button><button className="button primary" disabled={saving}>{saving && <LoaderCircle className="spin" size={16} />}Enregistrer</button></footer></form></div>;
}

function PlanEditor({ plan, onClose, onSaved, onError }: { plan: CommercialPlan | 'new'; onClose: () => void; onSaved: () => void; onError: (message: string) => void }) {
  const current = plan === 'new' ? undefined : plan;
  const [saving, setSaving] = useState(false);
  const title = useMemo(() => current?.name ?? 'Nouveau forfait', [current]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true);
    const data = new FormData(event.currentTarget);
    const price = (name: string) => { const value = String(data.get(name)).trim(); return value ? Math.round(Number(value) * 100) : null; };
    const input = {
      name: String(data.get('name')),
      description: String(data.get('description')),
      storageQuotaBytes: Math.round(Number(data.get('storageGb')) * 1024 ** 3),
      monthlyPriceCents: price('monthlyPrice'),
      annualPriceCents: price('annualPrice'),
      trialDays: Number(data.get('trialDays')),
      active: data.get('active') === 'on',
      isDefault: data.get('isDefault') === 'on',
    };
    try {
      if (current) await api.updateAdminPlan(current.code, input);
      else await api.createAdminPlan({ code: String(data.get('code')), ...input });
      onSaved();
    } catch (cause) { onError(cause instanceof Error ? cause.message : 'Enregistrement impossible.'); setSaving(false); }
  }
  return <div className="admin-modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><form className="admin-modal" onSubmit={submit}><header><div><p className="eyebrow">Catalogue commercial</p><h2>{title}</h2></div><button type="button" onClick={onClose}><X /></button></header><label>Code<input name="code" defaultValue={current?.code ?? ''} disabled={Boolean(current)} required pattern="[a-z0-9][a-z0-9_-]{1,39}" /></label><label>Nom<input name="name" defaultValue={current?.name ?? ''} required /></label><label>Description<textarea name="description" defaultValue={current?.description ?? ''} rows={3} /></label><div className="admin-form-grid"><label>Stockage en Go<input name="storageGb" type="number" min="0.001" step="0.001" defaultValue={current ? current.storageQuotaBytes / 1024 ** 3 : 5} required /></label><label>Durée d’essai<input name="trialDays" type="number" min="0" max="365" defaultValue={current?.trialDays ?? 14} required /></label><label>Prix mensuel (€)<input name="monthlyPrice" type="number" min="0" step="0.01" defaultValue={current?.monthlyPriceCents === null || current?.monthlyPriceCents === undefined ? '' : current.monthlyPriceCents / 100} /></label><label>Prix annuel (€)<input name="annualPrice" type="number" min="0" step="0.01" defaultValue={current?.annualPriceCents === null || current?.annualPriceCents === undefined ? '' : current.annualPriceCents / 100} /></label></div><div className="admin-checks"><label><input name="active" type="checkbox" defaultChecked={current?.active ?? true} />Forfait actif</label><label><input name="isDefault" type="checkbox" defaultChecked={current?.isDefault ?? false} />Forfait par défaut</label></div><footer><button type="button" className="button ghost" onClick={onClose}>Annuler</button><button className="button primary" disabled={saving}>{saving && <LoaderCircle className="spin" size={16} />}Enregistrer</button></footer></form></div>;
}
