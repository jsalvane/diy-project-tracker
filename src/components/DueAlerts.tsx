import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMaintenance } from '../hooks/useMaintenance';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { TapeLabel } from './ui';

const DISMISS_KEY = 'due-alerts-dismissed';

type Alert = {
  id: string;
  kind: 'overdue' | 'due-soon' | 'trial';
  label: string;
  detail: string;
  to: string;
};

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + 'T00:00:00');
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

// Next occurrence of a monthly renewal day, in days from today.
function daysToNextRenewal(renewalDay: number): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const day = Math.min(renewalDay, daysInMonth);
  let next = new Date(year, month, day);
  if (next < today) {
    const nextMonth = month + 1;
    const dim = new Date(year, nextMonth + 1, 0).getDate();
    next = new Date(year, nextMonth, Math.min(renewalDay, dim));
  }
  return Math.round((next.getTime() - today.getTime()) / 86400000);
}

export function DueAlerts() {
  const { tasks } = useMaintenance();
  const { subscriptions } = useSubscriptions();
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem(DISMISS_KEY) === '1'
  );

  const alerts = useMemo<Alert[]>(() => {
    const out: Alert[] = [];
    const today = new Date().toISOString().slice(0, 10);

    // Overdue maintenance
    const overdue = tasks.filter(
      t => t.nextDueDate && t.nextDueDate < today && (!t.snoozedUntil || t.snoozedUntil < today)
    );
    if (overdue.length > 0) {
      out.push({
        id: 'maint-overdue',
        kind: 'overdue',
        label: 'Maintenance',
        detail: `${overdue.length} task${overdue.length !== 1 ? 's' : ''} overdue`,
        to: '/maintenance',
      });
    }

    // Subscriptions renewing within 7 days
    const renewingSoon = subscriptions
      .filter(s => s.status === 'active' && s.frequency === 'monthly')
      .map(s => ({ s, d: daysToNextRenewal(s.renewalDay) }))
      .filter(x => x.d <= 7);
    if (renewingSoon.length > 0) {
      const soonest = renewingSoon.sort((a, b) => a.d - b.d)[0];
      out.push({
        id: 'subs-renewing',
        kind: 'due-soon',
        label: 'Subscriptions',
        detail:
          renewingSoon.length === 1
            ? `${soonest.s.name} renews in ${soonest.d}d`
            : `${renewingSoon.length} renewing this week`,
        to: '/budget',
      });
    }

    // Free-trial expirations in the next 7 days
    const trialsEnding = subscriptions.filter(s => {
      if (!s.freeTrial || !s.trialExpiration) return false;
      const d = daysUntil(s.trialExpiration);
      return d >= 0 && d <= 7;
    });
    if (trialsEnding.length > 0) {
      const first = trialsEnding[0];
      out.push({
        id: 'trial-ending',
        kind: 'trial',
        label: 'Free trial',
        detail:
          trialsEnding.length === 1
            ? `${first.name} ends in ${daysUntil(first.trialExpiration)}d`
            : `${trialsEnding.length} trials ending soon`,
        to: '/budget',
      });
    }

    return out;
  }, [tasks, subscriptions]);

  if (dismissed || alerts.length === 0) return null;

  function handleDismiss() {
    sessionStorage.setItem(DISMISS_KEY, '1');
    setDismissed(true);
  }

  return (
    <div
      className="rounded-[14px] border"
      style={{
        borderColor: 'var(--ink-line-2)',
        background: 'var(--paper-2)',
        padding: 16,
        marginBottom: 20,
      }}
    >
      <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
        <TapeLabel>Needs Attention</TapeLabel>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss alerts"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--ink-3)',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="3" x2="13" y2="13" /><line x1="13" y1="3" x2="3" y2="13" />
          </svg>
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {alerts.map(a => {
          const color = a.kind === 'overdue' ? 'var(--rust)' : a.kind === 'trial' ? 'var(--ochre)' : 'var(--ink)';
          return (
            <Link
              key={a.id}
              to={a.to}
              className="flex items-center justify-between transition-colors"
              style={{
                textDecoration: 'none',
                padding: '8px 0',
                borderTop: '1px dashed var(--ink-line)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, minWidth: 0 }}>
                <span className="tape-label" style={{ color }}>{a.label}</span>
                <span style={{ fontSize: 14, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {a.detail}
                </span>
              </div>
              <span style={{ color, fontSize: 16, flexShrink: 0, marginLeft: 8 }}>→</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
