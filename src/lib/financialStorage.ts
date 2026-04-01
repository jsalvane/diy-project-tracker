import type { FinancialQuarter, FinancialState } from './financialTypes';
import { createFinancialSeedData } from './financialSeed';

const FINANCIAL_STORAGE_KEY = 'financial-health-tracker';
const FINANCIAL_STORAGE_VERSION = 1;

interface FinancialStorageEnvelope {
  version: number;
  quarters: FinancialQuarter[];
  activeQuarterId: string | null;
}

type Migration = (d: FinancialStorageEnvelope) => FinancialStorageEnvelope;
const migrations: Record<number, Migration> = {
  // Future migrations go here, e.g.:
  // 2: (d) => { return { ...d, version: 2 }; },
};

function applyMigrations(raw: FinancialStorageEnvelope): FinancialStorageEnvelope {
  let data = raw;
  while (data.version < FINANCIAL_STORAGE_VERSION) {
    const next = data.version + 1;
    const migrate = migrations[next];
    if (!migrate) break;
    data = migrate(data);
  }
  return data;
}

export function loadFinancialState(): FinancialState {
  try {
    const raw = localStorage.getItem(FINANCIAL_STORAGE_KEY);
    if (!raw) return createFinancialSeedData();
    const parsed = JSON.parse(raw) as FinancialStorageEnvelope;
    const migrated = applyMigrations(parsed);
    return {
      quarters: migrated.quarters ?? [],
      activeQuarterId: migrated.activeQuarterId ?? null,
    };
  } catch {
    return createFinancialSeedData();
  }
}

export function saveFinancialState(state: FinancialState): void {
  try {
    const envelope: FinancialStorageEnvelope = {
      version: FINANCIAL_STORAGE_VERSION,
      quarters: state.quarters,
      activeQuarterId: state.activeQuarterId,
    };
    localStorage.setItem(FINANCIAL_STORAGE_KEY, JSON.stringify(envelope));
  } catch {
    // localStorage unavailable — silently ignore
  }
}
