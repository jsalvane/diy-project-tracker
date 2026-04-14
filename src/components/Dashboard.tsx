import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useFinancial } from '../context/FinancialContext';
import { useBudget } from '../hooks/useBudget';
import { useGifts } from '../hooks/useGifts';
import { useMaintenance } from '../hooks/useMaintenance';
import { useSubscriptions } from '../hooks/useSubscriptions';
import { useScratchpad } from '../hooks/useScratchpad';
import { supabase } from '../lib/supabase';
import { STATUS_META } from '../lib/constants';
import { formatCurrency } from '../lib/utils';
import { Card, CardLabel } from './ui/Card';
import { StatStrip } from './ui/StatStrip';
import { Skeleton } from './ui/Skeleton';

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatToday(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
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

function RepeatIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9"/>
      <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
      <polyline points="7 23 3 19 7 15"/>
      <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
    </svg>
  );
}

function NoteIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
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
  const accentColor = isPositive ? '#10b981' : '#ef4444';

  return (
    <Card to="/budget" accent={accentColor}>
      <CardLabel color="#E31937" icon={<DollarIcon />} title="Budget" />
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

function ProjectsCard() {
  const { state } = useApp();
  const navigate = useNavigate();
  const projects = state.projects;
  const entries = state.entries;

  const activeProjects = projects.filter(p => p.status === 'active');
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
          {activeProjects.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: STATUS_META.active.bg, color: STATUS_META.active.color }}>
              {activeProjects.length} active
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

        {activeProjects.length > 0 && (
          <div className="flex flex-col gap-1.5 mt-1 pt-2.5 border-t border-[rgba(0,0,20,0.06)] dark:border-[rgba(255,255,255,0.05)]">
            {activeProjects.slice(0, 3).map(p => {
              const spent = entries.filter(e => e.projectId === p.id && !e.isPending).reduce((s, e) => s + e.price, 0);
              return (
                <button
                  key={p.id}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/project/${p.id}`); }}
                  className="flex items-center justify-between text-left hover:bg-[rgba(0,0,20,0.03)] dark:hover:bg-[rgba(255,255,255,0.03)] -mx-1.5 px-1.5 py-1 rounded-lg transition-colors"
                >
                  <span className="text-[12px] font-medium text-[#0a0a14] dark:text-[#e2e2f0] truncate">{p.name}</span>
                  <span className="text-[12px] font-semibold text-[#10b981] tabular-nums shrink-0 ml-2">{formatCurrency(spent)}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="text-[12px] text-[rgba(10,10,20,0.4)] dark:text-[rgba(226,226,240,0.35)]">
          <span className="font-semibold text-[#0a0a14] dark:text-[#e2e2f0]">{fmt(totalSpent)}</span> total spent
        </div>
      </div>
    </Card>
  );
}

// ── Maintenance Card (enhanced with task names) ──────────────────────────────

function MaintenanceCard({ tasks, loading }: { tasks: ReturnType<typeof useMaintenance>['tasks']; loading: boolean }) {
  const today = new Date().toISOString().slice(0, 10);

  const overdueTasks = tasks.filter(t => t.nextDueDate && t.nextDueDate < today && !t.snoozedUntil);
  const dueSoonTasks = tasks.filter(t => {
    if (!t.nextDueDate || t.nextDueDate < today || t.snoozedUntil) return false;
    return daysUntil(t.nextDueDate) <= 30;
  });

  const color = '#f59e0b';
  const urgentColor = overdueTasks.length > 0 ? '#ef4444' : dueSoonTasks.length > 0 ? '#f59e0b' : '#10b981';
  const urgentCount = overdueTasks.length > 0 ? overdueTasks.length : dueSoonTasks.length;
  const urgentLabel = overdueTasks.length > 0 ? 'overdue' : dueSoonTasks.length > 0 ? 'due soon' : '';
  const urgentItems = overdueTasks.length > 0 ? overdueTasks : dueSoonTasks;

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
          {overdueTasks.length === 0 && dueSoonTasks.length === 0 ? (
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
              {overdueTasks.length > 0 && dueSoonTasks.length > 0 && (
                <div className="text-[11px] text-amber-500">{dueSoonTasks.length} more due soon</div>
              )}
            </>
          )}

          {/* Inline task names */}
          {urgentItems.length > 0 && (
            <div className="flex flex-col gap-1 mt-1 pt-2.5 border-t border-[rgba(0,0,20,0.06)] dark:border-[rgba(255,255,255,0.05)]">
              {urgentItems.slice(0, 3).map(t => {
                const d = t.nextDueDate ? daysUntil(t.nextDueDate) : null;
                const timeLabel = d !== null
                  ? d < 0 ? `${Math.abs(d)}d overdue` : d === 0 ? 'today' : `${d}d`
                  : '';
                return (
                  <div key={t.id} className="flex items-center justify-between py-0.5">
                    <span className="text-[12px] font-medium text-[#0a0a14] dark:text-[#e2e2f0] truncate">{t.name}</span>
                    <span className="text-[11px] font-medium tabular-nums shrink-0 ml-2" style={{ color: urgentColor }}>
                      {timeLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// ── Gifts Card (enhanced with progress) ──────────────────────────────────────

function GiftsCard() {
  const { recipients, gifts, loading } = useGifts();
  const purchased = gifts.filter(g => g.status === 'purchased').length;
  const totalGifts = gifts.length;
  const totalBudget = recipients.reduce((s, r) => s + (r.budget || 0), 0);
  const totalSpent = gifts.filter(g => g.status === 'purchased').reduce((s, g) => s + g.cost, 0);
  const progressPct = totalGifts > 0 ? (purchased / totalGifts) * 100 : 0;
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
            {recipients.length === 1 ? 'recipient' : 'recipients'}
            {totalGifts > 0 && ` · ${purchased}/${totalGifts} purchased`}
          </div>

          {/* Purchase progress bar */}
          {totalGifts > 0 && (
            <div className="flex items-center gap-2.5 mt-1">
              <div className="flex-1 h-1.5 rounded-full bg-[rgba(0,0,20,0.06)] dark:bg-[rgba(255,255,255,0.08)] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%`, background: progressPct === 100 ? '#10b981' : color }}
                />
              </div>
              {totalBudget > 0 && (
                <span className="text-[11px] font-medium text-[rgba(10,10,20,0.4)] dark:text-[rgba(226,226,240,0.35)] tabular-nums shrink-0">
                  {fmt(totalSpent)}/{fmt(totalBudget)}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// ── Subscriptions Card ───────────────────────────────────────────────────────

function SubscriptionsCard() {
  const { subscriptions, loading } = useSubscriptions();
  const color = '#8b5cf6';

  const active = subscriptions.filter(s => s.status === 'active');
  const monthlyTotal = active.reduce((s, sub) => {
    return s + (sub.frequency === 'annual' ? sub.amount / 12 : sub.amount);
  }, 0);
  const annualTotal = monthlyTotal * 12;
  const trialCount = active.filter(s => s.freeTrial).length;

  return (
    <Card to="/budget" accent={color}>
      <CardLabel color={color} icon={<RepeatIcon />} title="Subscriptions" />
      {loading ? (
        <div className="flex flex-col gap-2">
          <Skeleton w="w-24" h="h-11" />
          <Skeleton w="w-28" h="h-3" />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="text-[42px] font-extrabold tracking-[-0.05em] leading-none" style={{ color }}>
            {fmt(monthlyTotal)}
          </div>
          <div className="text-[12px] font-medium text-[rgba(10,10,20,0.4)] dark:text-[rgba(226,226,240,0.35)]">
            /month · {fmt(annualTotal)}/yr
          </div>
          <div className="flex flex-wrap gap-1.5 mt-1">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ background: 'rgba(139,92,246,0.1)', color }}>
              {active.length} active
            </span>
            {trialCount > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400">
                {trialCount} trial{trialCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

// ── Scratchpad Card ──────────────────────────────────────────────────────────

function ScratchpadCard() {
  const { notes, loading } = useScratchpad();
  const color = '#64748b';

  const sorted = [...notes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <Card to="/scratchpad" accent={color}>
      <CardLabel color={color} icon={<NoteIcon />} title="Notes" />
      {loading ? (
        <div className="flex flex-col gap-2">
          <Skeleton w="w-16" h="h-11" />
          <Skeleton w="w-28" h="h-3" />
        </div>
      ) : notes.length === 0 ? (
        <div className="flex flex-col gap-2">
          <div className="text-[42px] font-extrabold tracking-[-0.05em] leading-none" style={{ color }}>
            0
          </div>
          <div className="text-[12px] font-medium text-[rgba(10,10,20,0.4)] dark:text-[rgba(226,226,240,0.35)]">
            no notes yet
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="text-[42px] font-extrabold tracking-[-0.05em] leading-none" style={{ color }}>
            {notes.length}
          </div>
          <div className="text-[12px] font-medium text-[rgba(10,10,20,0.4)] dark:text-[rgba(226,226,240,0.35)]">
            note{notes.length !== 1 ? 's' : ''}
          </div>

          {/* Recent notes */}
          <div className="flex flex-col gap-1 mt-1 pt-2.5 border-t border-[rgba(0,0,20,0.06)] dark:border-[rgba(255,255,255,0.05)]">
            {sorted.slice(0, 3).map(n => (
              <div key={n.id} className="flex items-center justify-between py-0.5">
                <span className="text-[12px] font-medium text-[#0a0a14] dark:text-[#e2e2f0] truncate">
                  {n.title || 'Untitled'}
                </span>
                <span className="text-[11px] text-[rgba(10,10,20,0.35)] dark:text-[rgba(226,226,240,0.3)] shrink-0 ml-2">
                  {formatRelative(n.updatedAt)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export function Dashboard() {
  const { budgetItems, creditCards, loading: budgetLoading } = useBudget();
  const { tasks, loading: maintenanceLoading } = useMaintenance();
  const { state } = useApp();

  const today = new Date().toISOString().slice(0, 10);
  const activeProjects = state.projects.filter(p => p.status === 'active').length;
  const overdueTasks = tasks.filter(t => t.nextDueDate && t.nextDueDate < today && !t.snoozedUntil).length;
  const pendingSpend = state.entries.filter(e => e.isPending).reduce((s, e) => s + e.price, 0);

  const upcomingMaint = tasks.filter(t => {
    if (!t.nextDueDate || t.snoozedUntil) return false;
    const d = daysUntil(t.nextDueDate);
    return d >= 0 && d <= 30;
  }).length;

  const stats = [
    { label: 'Active Projects', value: String(activeProjects), color: '#10b981' },
    { label: 'Overdue Tasks',   value: String(overdueTasks),   color: overdueTasks > 0 ? '#ef4444' : '#34d399' },
    { label: 'Pending Spend',   value: fmt(pendingSpend),      color: '#f59e0b' },
    { label: 'Upcoming Maint.', value: String(upcomingMaint),  color: upcomingMaint > 0 ? '#f59e0b' : '#34d399' },
  ];

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      {/* Page header with greeting */}
      <div className="mb-7">
        <h1 className="text-[28px] sm:text-[34px] font-extrabold tracking-[-0.05em] text-[#0a0a14] dark:text-[#f0f0fa]">
          {getGreeting()}
        </h1>
        <p className="mt-1 text-[13px] text-[rgba(10,10,20,0.4)] dark:text-[rgba(226,226,240,0.35)]">
          {formatToday()} — your finances, projects &amp; home at a glance.
        </p>
      </div>

      {/* Quick stat strip */}
      <StatStrip stats={stats} className="mb-6" />

      {/* Main cards — 3x3 grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-grid">
        <div style={{ '--i': 0 } as React.CSSProperties}><BudgetCard budgetItems={budgetItems} creditCards={creditCards} loading={budgetLoading} /></div>
        <div style={{ '--i': 1 } as React.CSSProperties}><FinancialCard /></div>
        <div style={{ '--i': 2 } as React.CSSProperties}><ProjectsCard /></div>
        <div style={{ '--i': 3 } as React.CSSProperties}><MaintenanceCard tasks={tasks} loading={maintenanceLoading} /></div>
        <div style={{ '--i': 4 } as React.CSSProperties}><GiftsCard /></div>
        <div style={{ '--i': 5 } as React.CSSProperties}><SubscriptionsCard /></div>
        <div style={{ '--i': 6 } as React.CSSProperties}><ScratchpadCard /></div>
      </div>
    </main>
  );
}
