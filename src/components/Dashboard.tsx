import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useFinancial } from '../context/FinancialContext';
import { useBudget } from '../hooks/useBudget';
import { useGifts } from '../hooks/useGifts';
import { useMaintenance } from '../hooks/useMaintenance';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { useScratchpad } from '../hooks/useScratchpad';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../lib/utils';
import { ReceiptStrip, TapeLabel, Numeral, StatusPill } from './ui';
import { Skeleton } from './ui/Skeleton';
import { DueAlerts } from './DueAlerts';

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function getGreetingWord(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Morning,';
  if (h < 17) return 'Afternoon,';
  return 'Evening,';
}

function getTodayLabel(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    .toUpperCase()
    .replace(',', ' ·');
}

function getUserName(): string {
  return 'Joe';
}

// ── Quick link card ────────────────────────────────────────────────────────────

function QuickLinkCard({
  to,
  label,
  value,
  sub,
  accentValue,
}: {
  to: string;
  label: string;
  value: string;
  sub?: string;
  accentValue?: boolean;
}) {
  return (
    <Link
      to={to}
      className="flex flex-col gap-3 rounded-[14px] border border-[var(--ink-line)] bg-[var(--paper)] p-5 transition-colors duration-150 hover:bg-[var(--paper-2)]"
      style={{ textDecoration: 'none' }}
    >
      <TapeLabel>{label}</TapeLabel>
      <Numeral size="md" color={accentValue ? 'var(--rust)' : undefined}>{value}</Numeral>
      {sub && <span className="tape-label" style={{ color: 'var(--ink-4)' }}>{sub}</span>}
    </Link>
  );
}

// ── Compact project row ────────────────────────────────────────────────────────

function BenchProjectRow({ project }: { project: ReturnType<typeof useApp>['state']['projects'][0] }) {
  const { state } = useApp();
  const navigate = useNavigate();
  const entries = state.entries.filter(e => e.projectId === project.id && !e.isPending);
  const tasks = state.tasks.filter(t => t.projectId === project.id);
  const doneTasks = tasks.filter(t => t.completed).length;
  const progress = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;
  const spent = entries.reduce((s, e) => s + e.price, 0);

  return (
    <button
      onClick={() => navigate(`/project/${project.id}`)}
      className="flex items-center gap-4 py-4 w-full text-left transition-colors duration-150 hover:bg-[var(--paper-2)] -mx-5 px-5"
      style={{ background: 'transparent', border: 'none', cursor: 'pointer', borderRadius: 0 }}
    >
      {/* Thumb */}
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 10,
          flexShrink: 0,
          background: `linear-gradient(135deg, var(--paper-3) 0%, var(--ink-4) 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {false ? null : (
          <span className="font-serif" style={{ fontSize: 20, color: 'var(--paper)', fontStyle: 'italic', lineHeight: 1 }}>
            {project.name[0]}
          </span>
        )}
      </div>

      {/* Details */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {project.name}
          </span>
          <StatusPill status={project.status} />
        </div>
        {tasks.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <div style={{ flex: 1, height: 3, background: 'var(--ink-line)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: 'var(--moss)', borderRadius: 2, transition: 'width 0.5s' }} />
            </div>
            <span className="tape-label">{progress}%</span>
          </div>
        )}
      </div>

      {/* Spent */}
      <span className="font-mono-label" style={{ fontSize: 13, color: 'var(--ink-3)', flexShrink: 0 }}>
        {formatCurrency(spent)}
      </span>
    </button>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export function Dashboard() {
  const { state } = useApp();
  const { state: finState, loading: finLoading } = useFinancial();
  const { budgetItems, creditCards, loading: budgetLoading } = useBudget();
  const { recipients, gifts, loading: giftsLoading } = useGifts();
  const { subscriptions } = useSubscriptions();
  const { notes } = useScratchpad();
  const { tasks } = useMaintenance();

  const [income15, setIncome15] = useState(0);
  const [income30, setIncome30] = useState(0);

  useEffect(() => {
    supabase.from('budget_settings').select('key, value').in('key', ['income_15', 'income_30']).then(({ data }) => {
      if (data) {
        data.forEach(r => {
          if (r.key === 'income_15') setIncome15(parseFloat(r.value) || 0);
          if (r.key === 'income_30') setIncome30(parseFloat(r.value) || 0);
        });
      }
    });
  }, []);

  const activeProjects = state.projects.filter(p => p.status === 'active');

  // Finance quick link value
  const activeCards = creditCards.filter(c => c.status === 'active');
  const bills15 = budgetItems.filter(i => i.dueGroup === '15').reduce((s, i) => s + i.payment, 0)
    + activeCards.filter(c => c.billDueGroup === '15').reduce((s, c) => s + c.balance, 0);
  const bills30 = budgetItems.filter(i => i.dueGroup === '30').reduce((s, i) => s + i.payment, 0)
    + activeCards.filter(c => c.billDueGroup === '30').reduce((s, c) => s + c.balance, 0);
  const surplus = (income15 - bills15) + (income30 - bills30);

  // Net worth
  const latestQ = finState.quarters.length > 0
    ? [...finState.quarters].sort((a, b) => b.dateCaptured.localeCompare(a.dateCaptured))[0]
    : null;
  const netWorth = latestQ?.reportedSummaryValues?.netWorth ?? 0;

  // Gifts
  const purchased = gifts.filter(g => g.status === 'purchased').length;

  // Maintenance
  const today = new Date().toISOString().slice(0, 10);
  const overdueTasks = tasks.filter(t => t.nextDueDate && t.nextDueDate < today && !t.snoozedUntil).length;

  // Subscriptions monthly cost
  const activeSubs = subscriptions.filter(s => s.status === 'active');
  const monthlyTotal = activeSubs.reduce((s, sub) => s + (sub.frequency === 'annual' ? sub.amount / 12 : sub.amount), 0);

  return (
    <main
      className="blueprint-grid min-h-screen"
      style={{ paddingBottom: 40 }}
    >
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 20px 0' }}>

        {/* Date tape label */}
        <TapeLabel>{getTodayLabel()}</TapeLabel>

        {/* Hero greeting */}
        <div style={{ marginTop: 12, marginBottom: 32 }}>
          <div className="display-xl" style={{ color: 'var(--ink)', lineHeight: '58px' }}>
            {getGreetingWord()}
          </div>
          <div className="display-xl" style={{ color: 'var(--ink)', lineHeight: '58px' }}>
            {getUserName()}<em style={{ color: 'var(--rust)', fontStyle: 'italic' }}>.</em>
          </div>
        </div>

        <ReceiptStrip />

        {/* Alerts */}
        <div style={{ marginTop: 20 }}>
          <DueAlerts />
        </div>

        {/* ON THE BENCH TODAY */}
        <div style={{ marginTop: 24 }}>
          <TapeLabel>On the Bench Today</TapeLabel>

          {activeProjects.length === 0 ? (
            <div style={{ marginTop: 24, textAlign: 'center', padding: '32px 0' }}>
              <p className="font-serif" style={{ fontSize: 22, fontStyle: 'italic', color: 'var(--ink-3)' }}>
                Nothing on the bench yet<em style={{ color: 'var(--rust)' }}>.</em>
              </p>
              <Link to="/projects" className="btn-ghost btn-sm" style={{ display: 'inline-flex', marginTop: 16 }}>
                Start a project
              </Link>
            </div>
          ) : (
            <div style={{ marginTop: 8 }}>
              {activeProjects.slice(0, 3).map((p, i) => (
                <div key={p.id}>
                  <BenchProjectRow project={p} />
                  {i < Math.min(activeProjects.length, 3) - 1 && <ReceiptStrip />}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginTop: 24 }}>
          <ReceiptStrip />
        </div>

        {/* QUICK LINKS */}
        <div style={{ marginTop: 24 }}>
          <TapeLabel>Quick Links</TapeLabel>

          <div
            className="stagger-grid"
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}
          >
            <div style={{ '--i': 0 } as React.CSSProperties}>
              {budgetLoading ? (
                <div className="rounded-[14px] border border-[var(--ink-line)] p-5"><Skeleton w="w-full" h="h-16" /></div>
              ) : (
                <QuickLinkCard
                  to="/budget"
                  label="Budget"
                  value={fmt(Math.abs(surplus))}
                  sub={surplus >= 0 ? 'monthly surplus' : 'monthly deficit'}
                  accentValue={surplus < 0}
                />
              )}
            </div>

            <div style={{ '--i': 1 } as React.CSSProperties}>
              {giftsLoading ? (
                <div className="rounded-[14px] border border-[var(--ink-line)] p-5"><Skeleton w="w-full" h="h-16" /></div>
              ) : (
                <QuickLinkCard
                  to="/gifts"
                  label="Gifts"
                  value={String(recipients.length)}
                  sub={`${purchased}/${gifts.length} purchased`}
                />
              )}
            </div>

            <div style={{ '--i': 2 } as React.CSSProperties}>
              {finLoading ? (
                <div className="rounded-[14px] border border-[var(--ink-line)] p-5"><Skeleton w="w-full" h="h-16" /></div>
              ) : (
                <QuickLinkCard
                  to="/financial-health"
                  label="Net Worth"
                  value={fmt(netWorth)}
                  sub={latestQ?.quarterLabel}
                />
              )}
            </div>

            <div style={{ '--i': 3 } as React.CSSProperties}>
              <QuickLinkCard
                to="/budget"
                label="Subscriptions"
                value={fmt(monthlyTotal)}
                sub={`${activeSubs.length} active · /month`}
              />
            </div>
          </div>

          {/* Maintenance callout if overdue */}
          {overdueTasks > 0 && (
            <Link
              to="/maintenance"
              className="flex items-center justify-between rounded-[14px] border p-5 mt-3 transition-colors hover:bg-[var(--paper-2)]"
              style={{
                borderColor: `var(--rust)`,
                background: 'rgba(184,69,31,0.04)',
                textDecoration: 'none',
              }}
            >
              <div>
                <span className="tape-label" style={{ color: 'var(--rust)' }}>Maintenance</span>
                <p style={{ marginTop: 4, fontSize: 15, fontWeight: 600, color: 'var(--rust)' }}>
                  {overdueTasks} task{overdueTasks !== 1 ? 's' : ''} overdue
                </p>
              </div>
              <span style={{ color: 'var(--rust)', fontSize: 20 }}>→</span>
            </Link>
          )}

          {/* Notes link */}
          <Link
            to="/scratchpad"
            className="flex items-center justify-between rounded-[14px] border border-[var(--ink-line)] p-5 mt-3 transition-colors hover:bg-[var(--paper-2)]"
            style={{ textDecoration: 'none' }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <TapeLabel>Notes</TapeLabel>
              {notes.length > 0 ? (
                <p style={{ marginTop: 4, fontSize: 14, color: 'var(--ink-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {[...notes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]?.title || 'Untitled'}
                </p>
              ) : (
                <p style={{ marginTop: 4, fontSize: 14, color: 'var(--ink-4)' }}>No notes yet</p>
              )}
            </div>
            <span className="tape-label" style={{ marginLeft: 16, flexShrink: 0 }}>
              {notes.length} note{notes.length !== 1 ? 's' : ''}
            </span>
          </Link>
        </div>

      </div>
    </main>
  );
}
