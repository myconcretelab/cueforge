import { useState, type FormEvent } from 'react';
import { LoaderCircle } from 'lucide-react';
import { api } from '../lib/api';
import type { User } from '../types';

interface Props { onAuthenticated: (user: User) => void }

type AuthMode = 'login' | 'register' | 'forgot';

export function AuthScreen({ onAuthenticated }: Props) {
  const [mode, setMode] = useState<AuthMode>(() => new URLSearchParams(window.location.search).get('register') === '1' ? 'register' : 'login');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    const data = new FormData(event.currentTarget);
    try {
      const email = String(data.get('email'));
      if (mode === 'forgot') {
        const result = await api.forgotPassword(email);
        setMessage(result.message);
        return;
      }
      const payload = {
        email,
        password: String(data.get('password')),
      };
      const result = mode === 'register'
        ? await api.register({ ...payload, displayName: String(data.get('displayName')) })
        : await api.login(payload);
      onAuthenticated(result.user);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Connexion impossible.');
    } finally {
      setLoading(false);
    }
  }

  async function startDemo() {
    setDemoLoading(true);
    setError('');
    try {
      const result = await api.startDemo();
      onAuthenticated(result.user);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Démonstration indisponible.');
    } finally {
      setDemoLoading(false);
    }
  }

  return <main className="auth-shell">
    <section className="auth-intro">
      <div className="brand-mark" aria-label="CueForge">CF</div>
      <p className="eyebrow">Régie son en ligne</p>
      <h1>Play sound.<br /><span>Play the scene.</span></h1>
      <p className="auth-copy">Préparez votre spectacle, déclenchez vos sons instantanément et gardez toute votre bibliothèque à portée de main.</p>
      <div className="signal-lines" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></div>
    </section>
    <section className="auth-panel">
      <form className="auth-card" onSubmit={submit}>
        <div>
          <p className="eyebrow">CueForge</p>
          <h2>{mode === 'register' ? 'Créer votre régie' : mode === 'forgot' ? 'Réinitialiser le mot de passe' : 'Heureux de vous revoir'}</h2>
          <p>{mode === 'register' ? 'Votre premier projet sera prêt immédiatement.' : mode === 'forgot' ? 'Saisissez l’adresse e-mail associée à votre compte.' : 'Connectez-vous pour reprendre votre spectacle.'}</p>
        </div>
        {mode === 'register' && <label>Nom affiché<input name="displayName" autoComplete="name" required minLength={2} placeholder="Votre nom" /></label>}
        <label>Adresse e-mail<input name="email" type="email" autoComplete="email" required placeholder="vous@exemple.fr" /></label>
        {mode !== 'forgot' && <label>Mot de passe<input name="password" type="password" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} required minLength={8} placeholder="8 caractères minimum" /></label>}
        {error && <p className="form-error">{error}</p>}
        {message && <p className="form-success">{message}</p>}
        <button className="button primary wide" disabled={loading}>{loading && <LoaderCircle className="spin" size={18} />}{mode === 'register' ? 'Créer mon compte' : mode === 'forgot' ? 'Envoyer le lien' : 'Se connecter'}</button>
        {mode !== 'forgot' && <><div className="auth-separator"><span>ou</span></div><button className="button demo wide" type="button" disabled={demoLoading} onClick={startDemo}>{demoLoading && <LoaderCircle className="spin" size={18} />}Essayer sans compte</button><small className="demo-auth-note">Espace temporaire · 15 fichiers · 5 Mo maximum par fichier</small></>}
        {mode === 'login' && <button className="text-button" type="button" onClick={() => { setMode('forgot'); setError(''); setMessage(''); }}>
          Mot de passe oublié ?
        </button>}
        <button className="text-button" type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setMessage(''); }}>
          {mode === 'register' ? 'J’ai déjà un compte' : mode === 'forgot' ? 'Retour à la connexion' : 'Créer un nouveau compte'}
        </button>
      </form>
    </section>
  </main>;
}
