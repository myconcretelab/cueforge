import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, CheckCircle2, LifeBuoy, LoaderCircle, MessageSquarePlus, Send, X } from 'lucide-react';
import { api } from '../lib/api';
import type { SupportMessage, SupportTicket, SupportTicketStatus } from '../types';

const statusLabels: Record<SupportTicketStatus, string> = {
  open: 'En attente du support',
  awaiting_user: 'Réponse reçue',
  resolved: 'Résolue',
  closed: 'Close',
};

function formatTicketDate(value: string): string {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

interface Props {
  onClose: () => void;
  onUnreadChange: (count: number) => void;
}

export function SupportDialog({ onClose, onUnreadChange }: Props) {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket>();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const publishUnreadCount = useCallback((items: SupportTicket[]) => {
    onUnreadChange(items.reduce((total, ticket) => total + ticket.unreadCount, 0));
  }, [onUnreadChange]);

  const replaceTickets = useCallback((items: SupportTicket[]) => {
    setTickets(items);
  }, []);

  const updateTicketInList = useCallback((ticket: SupportTicket) => {
    setTickets((current) => current.map((item) => item.id === ticket.id ? { ...item, ...ticket } : item));
    setSelectedTicket((current) => current?.id === ticket.id ? { ...current, ...ticket } : current);
  }, []);

  const loadTickets = useCallback(async () => {
    const result = await api.supportTickets();
    replaceTickets(result.tickets);
    return result.tickets;
  }, [replaceTickets]);

  const openTicket = useCallback(async (ticket: SupportTicket) => {
    setLoading(true);
    setError('');
    setCreating(false);
    try {
      const result = await api.supportTicket(ticket.id);
      setSelectedTicket(result.ticket);
      setMessages(result.messages);
      setTickets((current) => current.map((item) => item.id === ticket.id ? { ...item, ...result.ticket, unreadCount: 0 } : item));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Chargement de la demande impossible.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { publishUnreadCount(tickets); }, [publishUnreadCount, tickets]);

  useEffect(() => {
    let cancelled = false;
    loadTickets().then((loaded) => {
      if (!cancelled) setCreating(loaded.length === 0);
    }).catch((cause) => {
      if (!cancelled) setError(cause instanceof Error ? cause.message : 'Chargement du support impossible.');
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [loadTickets]);

  async function createTicket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError('');
    try {
      const result = await api.createSupportTicket({ subject: String(form.get('subject') ?? ''), body: String(form.get('body') ?? '') });
      const refreshed = await loadTickets();
      await openTicket(refreshed.find((ticket) => ticket.id === result.ticket.id) ?? result.ticket);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Création de la demande impossible.');
    } finally {
      setBusy(false);
    }
  }

  async function replyToTicket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedTicket) return;
    const form = event.currentTarget;
    const body = String(new FormData(form).get('body') ?? '');
    setBusy(true);
    setError('');
    try {
      const result = await api.replyToSupportTicket(selectedTicket.id, body);
      setMessages((current) => [...current, result.message]);
      updateTicketInList({ ...selectedTicket, status: 'open', lastMessageAt: result.message.createdAt, updatedAt: result.message.createdAt, messageCount: selectedTicket.messageCount + 1, unreadCount: 0 });
      form.reset();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Envoi de la réponse impossible.');
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(status: Extract<SupportTicketStatus, 'open' | 'resolved' | 'closed'>) {
    if (!selectedTicket) return;
    setBusy(true);
    setError('');
    try {
      const result = await api.updateSupportTicket(selectedTicket.id, status);
      updateTicketInList({ ...selectedTicket, ...result.ticket });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Modification de la demande impossible.');
    } finally {
      setBusy(false);
    }
  }

  return <div className="dialog-backdrop support-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="dialog support-dialog" aria-labelledby="support-title">
      <header className="support-dialog-header"><div><p className="eyebrow"><LifeBuoy size={14} /> Support SonoRiva</p><h2 id="support-title">Mes demandes</h2></div><button className="icon-button" onClick={onClose} aria-label="Fermer le support"><X /></button></header>
      <div className="support-layout">
        <aside className={`support-ticket-sidebar ${selectedTicket || creating ? 'has-selection' : ''}`}>
          <button className="button primary support-new-ticket" onClick={() => { setCreating(true); setSelectedTicket(undefined); setMessages([]); setError(''); }}><MessageSquarePlus size={16} />Nouvelle demande</button>
          <div className="support-ticket-list">
            {tickets.map((ticket) => <button key={ticket.id} className={selectedTicket?.id === ticket.id ? 'active' : ''} onClick={() => openTicket(ticket)}>
              <span><strong>{ticket.subject}</strong>{ticket.unreadCount > 0 && <em>{ticket.unreadCount}</em>}</span>
              <small><span className={`support-status status-${ticket.status}`}>{statusLabels[ticket.status]}</span><time>{formatTicketDate(ticket.lastMessageAt)}</time></small>
            </button>)}
            {!loading && tickets.length === 0 && <p>Aucune demande pour le moment.</p>}
          </div>
        </aside>
        <main className={`support-ticket-detail ${creating || selectedTicket ? 'is-open' : ''}`}>
          {(creating || selectedTicket) && <button className="support-mobile-back" onClick={() => { setCreating(false); setSelectedTicket(undefined); }}><ArrowLeft size={16} />Toutes les demandes</button>}
          {creating ? <form className="support-create-form" onSubmit={createTicket}>
            <div><p className="eyebrow">Nouvelle demande</p><h3>Comment pouvons-nous vous aider&nbsp;?</h3><span>Votre message sera ajouté à un fil que vous pourrez retrouver ici.</span></div>
            <label>Sujet<input name="subject" minLength={3} maxLength={160} required autoFocus placeholder="Résumé de votre demande" /></label>
            <label>Message<textarea name="body" minLength={1} maxLength={10000} rows={8} required placeholder="Décrivez votre question ou le problème rencontré…" /></label>
            {error && <p className="support-error">{error}</p>}
            <footer><button type="button" className="button ghost" onClick={() => setCreating(false)}>Annuler</button><button className="button primary" disabled={busy}>{busy ? <LoaderCircle className="spin" size={16} /> : <Send size={16} />}Envoyer</button></footer>
          </form> : selectedTicket ? <>
            <div className="support-thread-heading">
              <div><span className={`support-status status-${selectedTicket.status}`}>{statusLabels[selectedTicket.status]}</span><h3>{selectedTicket.subject}</h3><small>Ouverte le {formatTicketDate(selectedTicket.createdAt)} · {selectedTicket.messageCount} message{selectedTicket.messageCount > 1 ? 's' : ''}</small></div>
              <button className="button ghost" disabled={busy} onClick={() => changeStatus(selectedTicket.status === 'closed' ? 'open' : 'closed')}>{selectedTicket.status === 'closed' ? 'Rouvrir' : <><CheckCircle2 size={15} />Clore</>}</button>
            </div>
            <div className="support-message-list">
              {messages.map((message) => <article key={message.id} className={`support-message ${message.authorKind}`}>
                <header><strong>{message.authorKind === 'admin' ? 'Support SonoRiva' : message.authorName ?? 'Vous'}</strong><time>{formatTicketDate(message.createdAt)}</time></header>
                <p>{message.body}</p>
              </article>)}
            </div>
            {error && <p className="support-error">{error}</p>}
            {selectedTicket.status !== 'closed' ? <form className="support-reply-form" onSubmit={replyToTicket}><textarea name="body" minLength={1} maxLength={10000} rows={3} required placeholder="Ajouter un message…" /><button className="button primary" disabled={busy} aria-label="Envoyer la réponse">{busy ? <LoaderCircle className="spin" size={16} /> : <Send size={16} />}</button></form> : <p className="support-closed-note">Cette demande est close. Vous pouvez la rouvrir ou créer une nouvelle demande.</p>}
          </> : <div className="support-empty-detail"><LifeBuoy size={34} /><strong>Sélectionnez une demande</strong><span>Consultez les réponses et poursuivez la conversation.</span></div>}
          {loading && <div className="support-loading"><LoaderCircle className="spin" size={22} />Chargement…</div>}
        </main>
      </div>
    </section>
  </div>;
}
