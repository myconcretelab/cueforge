import { useState, type FormEvent } from 'react';
import { CheckCircle2, LoaderCircle } from 'lucide-react';
import { api } from '../lib/api';

export function PasswordResetScreen() {
  const token = new URLSearchParams(window.location.search).get('token') ?? '';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(token ? '' : 'Le lien de réinitialisation est incomplet.');
  const [done, setDone] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    const data = new FormData(event.currentTarget);
    const password = String(data.get('password'));
    const confirmation = String(data.get('confirmation'));
    if (password !== confirmation) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }
    setLoading(true);
    try {
      await api.resetPassword(token, password);
      setDone(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Le mot de passe n’a pas pu être modifié.');
    } finally {
      setLoading(false);
    }
  }

  return <main className="auth-shell">
    <section className="auth-intro">
      <img className="brand-mark" src="/sonoriva-logo.svg" alt="SonoRiva" />
      <p className="eyebrow">Régie son en ligne</p>
      <h1>Play sound.<br /><span>Play the scene.</span></h1>
      <div className="signal-lines" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></div>
    </section>
    <section className="auth-panel">
      {done ? <div className="auth-card auth-confirmation">
        <CheckCircle2 size={42} />
        <div>
          <p className="eyebrow">SonoRiva</p>
          <h2>Mot de passe modifié</h2>
          <p>Toutes les sessions précédentes ont été déconnectées. Vous pouvez utiliser votre nouveau mot de passe.</p>
        </div>
        <a className="button primary wide" href="/">Se connecter</a>
      </div> : <form className="auth-card" onSubmit={submit}>
        <div>
          <p className="eyebrow">SonoRiva</p>
          <h2>Nouveau mot de passe</h2>
          <p>Le nouveau mot de passe doit contenir au moins 8 caractères.</p>
        </div>
        <label>Nouveau mot de passe<input name="password" type="password" autoComplete="new-password" required minLength={8} maxLength={128} /></label>
        <label>Confirmer le mot de passe<input name="confirmation" type="password" autoComplete="new-password" required minLength={8} maxLength={128} /></label>
        {error && <p className="form-error">{error}</p>}
        <button className="button primary wide" disabled={loading || !token}>{loading && <LoaderCircle className="spin" size={18} />}Modifier le mot de passe</button>
        <a className="text-link" href="/">Retour à la connexion</a>
      </form>}
    </section>
  </main>;
}
