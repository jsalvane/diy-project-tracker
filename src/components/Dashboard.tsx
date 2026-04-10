import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useFinancial } from '../context/FinancialContext';
import { useBudget } from '../hooks/useBudget';
import { useGifts } from '../hooks/useGifts';
import { useMaintenance } from '../hooks/useMaintenance';
import { supabase } from '../lib/supabase';

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

// ── Skeleton block ────────────────────────────────────────────────────────────

function Skeleton({ w = 'w-32', h = 'h-12' }: { w?: string; h?: string }) {
  return <div className={`skeleton ${w} ${h}`} />;
}

// ── Card shell ────────────────────────────────────────────────────────────────

function Card({
  to, children, accent,
}: {
  to: string;
  children: React.ReactNode;
  accent: string;
}) {
  return (
    <Link
      to={to}
      className="group relative flex flex-col gap-5 rounded-2xl border border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.07)] bg-white dark:bg-[#111118] p-6 overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(0,0,20,0.10)] dark:hover:shadow-[0_8px_28px_rgba(0,0,0,0.5)]"
      style={{ boxShadow: '0 1px 3px rgba(0,0,20,0.05)' }}
    >
      {/* Subtle colored top border on hover */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{ background: accent }}
      />
      {children}
    </Link>
  );
}

function CardLabel({ color, icon, title }: { color: string; icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="w-7 h-7 rounded-[8px] flex items-center justify-center shrink-0"
        style={{ background: `${color}18`, color }}
      >
        {icon}
      </div>
      <span className="text-[12px] font-semibold tracking-[-0.01em] text-[rgba(10,10,20,0.5)] dark:text-[rgba(226,226,240,0.4)] uppercase tracking-[0.04em]">
        {title}
      </span>
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function DollarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
      <polyline points="16 7 22 7 22 13"/>
    </svg>
  );
}

function WrenchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );
}

function GiftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 12 20 22 4 22 4 12"/>
      <rect x="2" y="7" width="20" height="5"/>
      <line x1="12" y1="22" x2="12" y2="7"/>
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
    </svg>
  );
}

// ── Budget Card ───────────────────────────────────────────────────────────────

function BudgetCard({ budgetItems, creditCards, loading }: {
  budgetItems: ReturnType<typeof useBudget>['budgetItems'];
  creditCards: ReturnType<typeof useBudget>['creditCards'];
  loading: boolean;
}) {
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

  const activeCards = creditCards.filter(c => c.status === 'active');
  const bills15 = budgetItems.filter(i => i.dueGroup === '15').reduce((s, i) => s + i.payment, 0)
    + activeCards.filter(c => c.billDueGroup === '15').reduce((s, c) => s + c.balance, 0);
  const bills30 = budgetItems.filter(i => i.dueGroup === '30').reduce((s, i) => s + i.payment, 0)
    + activeCards.filter(c => c.billDueGroup === '30').reduce((s, c) => s + c.balance, 0);
  const surplus = (income15 - bills15) + (income30 - bills30);
  const totalIncome = income15 + income30;

  const isPositive = surplus >= 0;
  const color = '#E31937';

  return (
    <Card to="/budget" accent={color}>
      <CardLabel color={color} icon={<DollarIcon />} title="Budget" />
      {loading ? (
        <div className="flex flex-col gap-2">
          <Skeleton w="w-36" h="h-11" />
          <Skeleton w="w-24" h="h-3" />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className={`text-[42px] font-extrabold tracking-[-0.05em] leading-none ${isPositive ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
            {fmt(surplus)}
          </div>
          <div className="text-[12px] font-medium text-[rgba(10,10,20,0.4)] dark:text-[rgba(226,226,240,0.35)]">
            monthly surplus
          </div>
          {totalIncome > 0 && (
            <div className="mt-2 h-1 rounded-full bg-[rgba(0,0,20,0.06)] dark:bg-[rgba(255,255,255,0.08)] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${isPositive ? 'bg-emerald-500' : 'bg-red-500'}`}
                style={{ width: `${Math.min(100, Math.abs(surplus) / totalIncome * 100)}%` }}
              />
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// ── Financial Card ────────────────────────────────────────────────────────────

function FinancialCard() {
  const { state, loading } = useFinancial();
  const latest = state.quarters.length > 0
    ? [...state.quarters].sort((a, b) => b.dateCaptured.localeCompare(a.dateCaptured))[0]
    : null;

  const netWorth = latest?.reportedSummaryValues?.netWorth ?? 0;
  const color = '#3b82f6';

  return (
    <Card to="/financial-health" accent={color}>
      <CardLabel color={color} icon={<ChartIcon />} title="Net Worth" />
      {loading || !latest ? (
        <div className="flex flex-col gap-2">
          <Skeleton w="w-40" h="h-11" />
          <Skeleton w="w-24" h="h-3" />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="text-[42px] font-extrabold tracking-[-0.05em] leading-none text-[#3b82f6]">
            {fmt(netWorth)}
          </div>
          <div className="text-[12px] font-medium text-[rgba(10,10,20,0.4)] dark:text-[rgba(226,226,240,0.35)]">
            as of {latest.quarterLabel}
          </div>
        </div>
      )}
    </Card>
  );
}

// ── Projects Card ─────────────────────────────────────────────────────────────

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  active:   { label: 'Active',   color: '#10b981', bg: 'rgba(16,185,129,0.1)'  },
  planned:  { label: 'Planned',  color: '#E31937', bg: 'rgba(227,25,55,0.1)' },
  on_hold:  { label: 'On Hold',  color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  complete: { label: 'Done',     color: '#64748b', bg: 'rgba(100,116,139,0.1)' },
};

function ProjectsCard() {
  const { state } = useApp();
  const projects = state.projects;
  const entries = state.entries;

  const active = projects.filter(p => p.status === 'active').length;
  const planned = projects.filter(p => p.status === 'planned').length;
  const done = projects.filter(p => p.status === 'complete').length;
  const totalSpent = entries.filter(e => !e.isPending).reduce((s, e) => s + e.price, 0);
  const color = '#10b981';

  return (
    <Card to="/projects" accent={color}>
      <CardLabel color={color} icon={<WrenchIcon />} title="Projects" />
      <div className="flex flex-col gap-3">
        <div className="flex items-baseline gap-2">
          <span className="text-[42px] font-extrabold tracking-[-0.05em] leading-none text-[#10b981]">
            {projects.length}
          </span>
          <span className="text-[13px] font-medium text-[rgba(10,10,20,0.4)] dark:text-[rgba(226,226,240,0.35)]">total</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {active > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: STATUS_META.active.bg, color: STATUS_META.active.color }}>
              {active} active
            </span>
          )}
          {planned > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: STATUS_META.planned.bg, color: STATUS_META.planned.color }}>
              {planned} planned
            </span>
          )}
          {done > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: STATUS_META.complete.bg, color: STATUS_META.complete.color }}>
              {done} done
            </span>
          )}
        </div>
        <div className="text-[12px] text-[rgba(10,10,20,0.4)] dark:text-[rgba(226,226,240,0.35)]">
          <span className="font-semibold text-[#0a0a14] dark:text-[#e2e2f0]">{fmt(totalSpent)}</span> total spent
        </div>
      </div>
    </Card>
  );
}

// ── Maintenance Card ──────────────────────────────────────────────────────────

function MaintenanceCard({ tasks, loading }: { tasks: ReturnType<typeof useMaintenance>['tasks']; loading: boolean }) {
  const today = new Date().toISOString().slice(0, 10);

  const overdue = tasks.filter(t => t.nextDueDate && t.nextDueDate < today && !t.snoozedUntil).length;
  const dueSoon = tasks.filter(t => {
    if (!t.nextDueDate || t.nextDueDate < today) return false;
    const days = (new Date(t.nextDueDate).getTime() - Date.now()) / 86400000;
    return days <= 30;
  }).length;

  const color = '#f59e0b';
  const urgentColor = overdue > 0 ? '#ef4444' : dueSoon > 0 ? '#f59e0b' : '#10b981';
  const urgentCount = overdue > 0 ? overdue : dueSoon;
  const urgentLabel = overdue > 0 ? 'overdue' : dueSoon > 0 ? 'due soon' : '';

  return (
    <Card to="/maintenance" accent={color}>
      <CardLabel color={color} icon={<CalendarIcon />} title="Maintenance" />
      {loading ? (
        <div className="flex flex-col gap-2">
          <Skeleton w="w-20" h="h-11" />
          <Skeleton w="w-28" h="h-3" />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {overdue === 0 && dueSoon === 0 ? (
            <>
              <div className="text-[42px] font-extrabold tracking-[-0.05em] leading-none text-emerald-500 dark:text-emerald-400">
                {tasks.length}
              </div>
              <div className="text-[12px] font-medium text-[rgba(10,10,20,0.4)] dark:text-[rgba(226,226,240,0.35)]">
                tasks tracked · all good
              </div>
            </>
          ) : (
            <>
              <div className="text-[42px] font-extrabold tracking-[-0.05em] leading-none" style={{ color: urgentColor }}>
                {urgentCount}
              </div>
              <div className="text-[12px] font-medium" style={{ color: urgentColor }}>
                {urgentLabel}
              </div>
              {overdue > 0 && dueSoon > 0 && (
                <div className="text-[11px] text-amber-500">{dueSoon} more due soon</div>
              )}
            </>
          )}
        </div>
      )}
    </Card>
  );
}

// ── Gifts Card ────────────────────────────────────────────────────────────────

function GiftsCard() {
  const { recipients, gifts, loading } = useGifts();
  const purchased = gifts.filter(g => g.status === 'purchased').length;
  const color = '#ec4899';

  return (
    <Card to="/gifts" accent={color}>
      <CardLabel color={color} icon={<GiftIcon />} title="Gifts" />
      {loading ? (
        <div className="flex flex-col gap-2">
          <Skeleton w="w-16" h="h-11" />
          <Skeleton w="w-28" h="h-3" />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="text-[42px] font-extrabold tracking-[-0.05em] leading-none" style={{ color }}>
            {recipients.length}
          </div>
          <div className="text-[12px] font-medium text-[rgba(10,10,20,0.4)] dark:text-[rgba(226,226,240,0.35)]">
            {recipients.length === 1 ? 'recipient' : 'recipients'}{purchased > 0 ? ` · ${purchased} purchased` : ''}
          </div>
          {recipients.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {recipients.slice(0, 4).map(r => (
                <span
                  key={r.id}
                  className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold"
                  style={{ background: 'rgba(236,72,153,0.1)', color: '#ec4899' }}
                >
                  {r.name}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// ── Stat strip ────────────────────────────────────────────────────────────────

function StatStrip({ tasks }: { tasks: ReturnType<typeof useMaintenance>['tasks'] }) {
  const { state } = useApp();
  const today = new Date().toISOString().slice(0, 10);

  const activeProjects = state.projects.filter(p => p.status === 'active').length;
  const overdueTasks = tasks.filter(t => t.nextDueDate && t.nextDueDate < today && !t.snoozedUntil).length;
  const pendingSpend = state.entries.filter(e => e.isPending).reduce((s, e) => s + e.price, 0);

  const stats = [
    { label: 'Active Projects', value: String(activeProjects), color: '#10b981' },
    { label: 'Overdue Tasks',   value: String(overdueTasks),   color: overdueTasks > 0 ? '#ef4444' : '#34d399' },
    { label: 'Pending Spend',   value: fmt(pendingSpend),      color: '#f59e0b' },
  ];

  return (
    <div className="flex items-stretch gap-0 rounded-2xl border border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.07)] overflow-hidden bg-white dark:bg-[#111118] mb-6"
      style={{ boxShadow: '0 1px 3px rgba(0,0,20,0.04)' }}>
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          className={`flex-1 px-5 py-4 flex flex-col gap-1 ${i < stats.length - 1 ? 'border-r border-[rgba(0,0,20,0.07)] dark:border-[rgba(255,255,255,0.07)]' : ''}`}
        >
          <div className="text-[11px] font-semibold tracking-[0.04em] uppercase text-[rgba(10,10,20,0.38)] dark:text-[rgba(226,226,240,0.3)]">
            {stat.label}
          </div>
          <div className="text-[22px] font-bold tracking-[-0.04em]" style={{ color: stat.color }}>
            {stat.value}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export function Dashboard() {
  const { budgetItems, creditCards, loading: budgetLoading } = useBudget();
  const { tasks, loading: maintenanceLoading } = useMaintenance();

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      {/* Page header */}
      <div className="mb-7">
        <h1 className="text-[28px] sm:text-[34px] font-extrabold tracking-[-0.05em] text-[#0a0a14] dark:text-[#f0f0fa]">
          Home
        </h1>
        <p className="mt-1 text-[13px] text-[rgba(10,10,20,0.4)] dark:text-[rgba(226,226,240,0.35)]">
          Your finances, projects &amp; home at a glance.
        </p>
      </div>

      {/* Quick stat strip */}
      <StatStrip tasks={tasks} />

      {/* Main cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <BudgetCard budgetItems={budgetItems} creditCards={creditCards} loading={budgetLoading} />
        <FinancialCard />
        <ProjectsCard />
        <MaintenanceCard tasks={tasks} loading={maintenanceLoading} />
        <GiftsCard />
      </div>
    </main>
  );
}
