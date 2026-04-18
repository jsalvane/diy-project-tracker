import { useState } from 'react';
import type { Machine, MaintenanceCategory } from '../../lib/types';
import { CATEGORY_META } from '../../lib/maintenancePresets';

interface Props {
  machine?: Machine;
  onSave: (data: Omit<Machine, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

const MACHINE_CATEGORIES: MaintenanceCategory[] = [
  'vehicles', 'lawn-garden', 'snow-winter', 'generator', 'power-tools', 'recreational', 'other',
];

const inputCls = 'field';
const labelCls = 'tape-label block mb-1.5';

export function MachineForm({ machine, onSave, onCancel }: Props) {
  const [name, setName] = useState(machine?.name ?? '');
  const [category, setCategory] = useState<MaintenanceCategory>(machine?.category ?? 'other');
  const [manufacturer, setManufacturer] = useState(machine?.manufacturer ?? '');
  const [model, setModel] = useState(machine?.model ?? '');
  const [year, setYear] = useState(machine?.year ?? '');
  const [serialNumber, setSerialNumber] = useState(machine?.serialNumber ?? '');
  const [purchaseDate, setPurchaseDate] = useState(machine?.purchaseDate ?? '');
  const [manualUrl, setManualUrl] = useState(machine?.manualUrl ?? '');
  const [notes, setNotes] = useState(machine?.notes ?? '');

  function handleSave() {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      category,
      manufacturer: manufacturer.trim(),
      model: model.trim(),
      year: year.trim(),
      serialNumber: serialNumber.trim(),
      purchaseDate,
      manualUrl: manualUrl.trim(),
      notes: notes.trim(),
      icon: CATEGORY_META[category].icon,
    });
  }

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-semibold text-[var(--ink)]">
        {machine ? 'Edit Machine' : 'Add Machine'}
      </h2>

      {/* Name */}
      <div>
        <label className={labelCls}>Machine Name *</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Husqvarna Snowblower, Honda Lawnmower"
          className={inputCls}
          autoFocus
        />
      </div>

      {/* Category */}
      <div>
        <label className={labelCls}>Type</label>
        <select value={category} onChange={e => setCategory(e.target.value as MaintenanceCategory)} className={inputCls}>
          {MACHINE_CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{CATEGORY_META[cat].icon} {CATEGORY_META[cat].label}</option>
          ))}
        </select>
      </div>

      {/* Make / Model / Year row */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelCls}>Manufacturer</label>
          <input type="text" value={manufacturer} onChange={e => setManufacturer(e.target.value)} placeholder="e.g. Honda" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Model</label>
          <input type="text" value={model} onChange={e => setModel(e.target.value)} placeholder="e.g. HRX217" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Year</label>
          <input type="text" value={year} onChange={e => setYear(e.target.value)} placeholder="e.g. 2021" className={inputCls} />
        </div>
      </div>

      {/* Serial Number */}
      <div>
        <label className={labelCls}>Serial Number</label>
        <input type="text" value={serialNumber} onChange={e => setSerialNumber(e.target.value)} placeholder="Serial / VIN" className={inputCls} />
      </div>

      {/* Purchase Date */}
      <div>
        <label className={labelCls}>Purchase Date</label>
        <input type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} className={inputCls} />
      </div>

      {/* Manual URL */}
      <div>
        <label className={labelCls}>Manual / Link</label>
        <input
          type="url"
          value={manualUrl}
          onChange={e => setManualUrl(e.target.value)}
          placeholder="https://... (owner's manual or product page)"
          className={inputCls}
        />
        <p className="mt-1 text-[11px] text-[var(--ink-4)]">
          Paste a link to the owner's manual PDF or product support page.
        </p>
      </div>

      {/* Notes */}
      <div>
        <label className={labelCls}>Notes</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          placeholder="Additional details, quirks, storage location..."
          className={`${inputCls} resize-none`}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border border-[var(--ink-line)] text-[var(--ink-3)] hover:bg-[var(--paper-2)]"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!name.trim()}
          className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[var(--rust)] text-[var(--paper)] hover:bg-[var(--rust-ink)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {machine ? 'Save Changes' : 'Add Machine'}
        </button>
      </div>
    </div>
  );
}
