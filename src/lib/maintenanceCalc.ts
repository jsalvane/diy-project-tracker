import type { MaintenanceTask, MaintenanceCompletion, MaintenanceDueStatus } from './types';

// ── Season date mapping (US Northeast defaults) ─────────────────────────

const SEASON_DATES: Record<string, { month: number; day: number }> = {
  'pre-season':  { month: 10, day: 1 },   // Oct 1 (before winter)
  'post-season': { month: 4,  day: 15 },  // Apr 15 (after winter)
  'winter':      { month: 11, day: 15 },  // Nov 15
  'spring':      { month: 3,  day: 15 },  // Mar 15
  'summer':      { month: 6,  day: 1 },   // Jun 1
  'fall':        { month: 9,  day: 15 },  // Sep 15
  'season-end':  { month: 10, day: 15 },  // Oct 15 (end of outdoor season)
  'post-salt':   { month: 10, day: 1 },   // Oct 1 (end of salt-water season)
};

export function mapSeasonToDate(season: string, year: number): string {
  const s = SEASON_DATES[season];
  if (!s) return `${year}-01-01`;
  return `${year}-${String(s.month).padStart(2, '0')}-${String(s.day).padStart(2, '0')}`;
}

function nextSeasonDate(season: string, today: string): string {
  const [y] = today.split('-').map(Number);
  const thisYear = mapSeasonToDate(season, y);
  return thisYear >= today ? thisYear : mapSeasonToDate(season, y + 1);
}

// ── Next due date calculation ───────────────────────────────────────────

export function computeNextDueDate(
  recurrenceType: string,
  recurrenceUnit: string,
  recurrenceValue: number,
  fromDate: string, // YYYY-MM-DD of completion or anchor
): string {
  if (recurrenceType === 'custom') return '';
  if (recurrenceType === 'usage') return ''; // usage-based doesn't have calendar due

  if (recurrenceType === 'seasonal') {
    // Next occurrence of that season after fromDate
    const [y] = fromDate.split('-').map(Number);
    const thisYear = mapSeasonToDate(recurrenceUnit, y);
    if (thisYear > fromDate) return thisYear;
    return mapSeasonToDate(recurrenceUnit, y + 1);
  }

  // Date-based recurrence
  const d = new Date(fromDate + 'T00:00:00');
  if (isNaN(d.getTime())) return '';

  if (recurrenceUnit === 'days') {
    d.setDate(d.getDate() + recurrenceValue);
  } else if (recurrenceUnit === 'months') {
    d.setMonth(d.getMonth() + recurrenceValue);
  } else if (recurrenceUnit === 'years') {
    d.setFullYear(d.getFullYear() + recurrenceValue);
  }

  return d.toISOString().slice(0, 10);
}

// ── Due status ──────────────────────────────────────────────────────────

function daysBetween(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00').getTime();
  const db = new Date(b + 'T00:00:00').getTime();
  return Math.round((db - da) / 86400000);
}

export function computeDueStatus(task: MaintenanceTask, today: string): MaintenanceDueStatus {
  // Snoozed tasks appear as upcoming
  if (task.snoozedUntil && task.snoozedUntil > today) return 'upcoming';

  // Usage-based tasks
  if (task.recurrenceType === 'usage') {
    if (task.recurrenceValue <= 0) return 'no-date';
    const usageSinceLast = task.currentUsage - task.lastCompletionUsage;
    if (usageSinceLast >= task.recurrenceValue) return 'overdue';
    if (usageSinceLast >= task.recurrenceValue * 0.9) return 'due-today';
    return 'upcoming';
  }

  // Seasonal with no nextDueDate yet — compute it
  if (task.recurrenceType === 'seasonal' && !task.nextDueDate && task.recurrenceUnit) {
    const seasonDate = nextSeasonDate(task.recurrenceUnit, today);
    const diff = daysBetween(today, seasonDate);
    if (diff < 0) return 'overdue';
    if (diff === 0) return 'due-today';
    if (diff <= 7) return 'due-this-week';
    return 'upcoming';
  }

  if (!task.nextDueDate) return 'no-date';

  const diff = daysBetween(today, task.nextDueDate);
  if (diff < 0) return 'overdue';
  if (diff === 0) return 'due-today';
  if (diff <= 7) return 'due-this-week';
  return 'upcoming';
}

// ── Recurrence label formatting ─────────────────────────────────────────

export function formatRecurrence(task: MaintenanceTask): string {
  if (task.recurrenceType === 'custom') return 'Custom schedule';
  if (task.recurrenceType === 'seasonal') {
    const labels: Record<string, string> = {
      'pre-season': 'Pre-season', 'post-season': 'Post-season',
      winter: 'Winter', spring: 'Spring', summer: 'Summer', fall: 'Fall',
      'season-end': 'Season end', 'post-salt': 'Post-salt',
    };
    return labels[task.recurrenceUnit] || task.recurrenceUnit;
  }
  if (task.recurrenceType === 'usage') {
    const unitLabels: Record<string, string> = { miles: 'mi', hours: 'hrs', uses: 'uses' };
    const label = unitLabels[task.recurrenceUnit] || task.recurrenceUnit;
    return `Every ${task.recurrenceValue.toLocaleString()} ${label}`;
  }
  // Date-based
  if (task.recurrenceUnit === 'months' && task.recurrenceValue === 1) return 'Monthly';
  if (task.recurrenceUnit === 'months' && task.recurrenceValue === 3) return 'Quarterly';
  if (task.recurrenceUnit === 'months' && task.recurrenceValue === 6) return 'Every 6 months';
  if (task.recurrenceUnit === 'years' && task.recurrenceValue === 1) return 'Annually';
  const unitLabels: Record<string, string> = { days: 'days', months: 'months', years: 'years' };
  return `Every ${task.recurrenceValue} ${unitLabels[task.recurrenceUnit] || task.recurrenceUnit}`;
}

// ── Due info label ──────────────────────────────────────────────────────

export function formatDueInfo(task: MaintenanceTask): string {
  if (task.recurrenceType === 'usage') {
    const unitLabels: Record<string, string> = { miles: 'mi', hours: 'hrs', uses: 'uses' };
    const label = unitLabels[task.recurrenceUnit] || task.recurrenceUnit;
    const dueAt = task.lastCompletionUsage + task.recurrenceValue;
    return `Due at ${dueAt.toLocaleString()} ${label} · Now: ${task.currentUsage.toLocaleString()}`;
  }
  if (!task.nextDueDate) return 'No date set';
  const d = new Date(task.nextDueDate + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Usage progress (0-1) ────────────────────────────────────────────────

export function usageProgress(task: MaintenanceTask): number {
  if (task.recurrenceType !== 'usage' || task.recurrenceValue <= 0) return 0;
  const used = task.currentUsage - task.lastCompletionUsage;
  return Math.min(1, Math.max(0, used / task.recurrenceValue));
}

// ── CSV export ──────────────────────────────────────────────────────────

export function exportCompletionsCsv(
  completions: MaintenanceCompletion[],
  tasksById: Record<string, MaintenanceTask>,
): string {
  const header = 'Date,Task,Category,Notes,Cost';
  const rows = completions
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
    .map(c => {
      const task = tasksById[c.taskId];
      const date = c.completedAt.slice(0, 10);
      const name = (task?.name ?? 'Unknown').replace(/,/g, ' ');
      const cat = task?.category ?? '';
      const notes = c.notes.replace(/,/g, ' ').replace(/\n/g, ' ');
      const cost = c.cost.toFixed(2);
      return `${date},${name},${cat},${notes},${cost}`;
    });
  return [header, ...rows].join('\n');
}

export function downloadCsv(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
