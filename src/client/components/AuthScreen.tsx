import { useState, type FormEvent } from 'react';
import { LoaderCircle } from 'lucide-react';
import { api } from '../lib/api';
import type { User } from '../types';

interface Props { onAuthenticated: (user: User) => void }

export function AuthScreen({ onAuthenticated }: Props) {
  const [register, setRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    const data = new FormData(event.currentTarget);
    try {
      const payload = {
        email: String(data.get('email')),
        password: String(data.get('password')),
      };
      const result = register
        ? await api.register({ ...payload, displayName: String(data.get('displayName')) })
        : await api.login(payload);
      onAuthenticated(result.user);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Connexion impossible.');
    } finally {
      setLoading(false);
    }
  }

  return <main className="auth-shell">
    <section className="auth-intro">
      <div className="brand-mark" aria-label="Standby One">S1</div>
      <p className="eyebrow">Régie son en ligne</p>
      <h1>Chaque son.<br /><span>Au bon moment.</span></h1>
      <p className="auth-copy">Préparez votre spectacle, déclenchez vos sons instantanément et gardez toute votre bibliothèque à portée de main.</p>
      <div className="signal-lines" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></div>
    </section>
    <section className="auth-panel">
      <form className="auth-card" onSubmit={submit}>
        <div>
          <p className="eyebrow">S1 · Standby One</p>
          <h2>{register ? 'Créer votre régie' : 'Heureux de vous revoir'}</h2>
          <p>{register ? 'Votre premier projet sera prêt immédiatement.' : 'Connectez-vous pour reprendre votre spectacle.'}</p>
        </div>
        {register && <label>Nom affiché<input name="displayName" autoComplete="name" required minLength={2} placeholder="Votre nom" /></label>}
        <label>Adresse e-mail<input name="email" type="email" autoComplete="email" required placeholder="vous@exemple.fr" /></label>
        <label>Mot de passe<input name="password" type="password" autoComplete={register ? 'new-password' : 'current-password'} required minLength={8} placeholder="8 caractères minimum" /></label>
        {error && <p className="form-error">{error}</p>}
        <button className="button primary wide" disabled={loading}>{loading && <LoaderCircle className="spin" size={18} />}{register ? 'Créer mon compte' : 'Se connecter'}</button>
        <button className="text-button" type="button" onClick={() => { setRegister(!register); setError(''); }}>
          {register ? 'J’ai déjà un compte' : 'Créer un nouveau compte'}
        </button>
      </form>
    </section>
  </main>;
}
