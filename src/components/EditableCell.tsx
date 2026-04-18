import { useState, useRef, useEffect } from 'react';
import type { ColumnDef } from '../lib/types';
import { parseCurrency, isValidDate, formatCurrency } from '../lib/utils';

interface Props {
  value: string | number;
  column: ColumnDef;
  isFocused: boolean;
  onSave: (value: string | number) => void;
  onNavigate: (direction: 'tab' | 'shift-tab' | 'enter' | 'escape') => void;
  onFocus: () => void;
  dimmed?: boolean;
}

export function EditableCell({ value, column, isFocused, onSave, onNavigate, onFocus, dimmed }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const [invalid, setInvalid] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cellRef = useRef<HTMLTableCellElement>(null);

  useEffect(() => {
    if (isFocused && !editing) {
      setEditing(true);
      setDraft(String(value));
      setInvalid(false);
    }
  }, [isFocused, editing, value, column.type]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const validate = (val: string): string | number | null => {
    if (column.type === 'currency') return parseCurrency(val);
    if (column.type === 'date') return isValidDate(val) ? val : null;
    return val;
  };

  const commit = () => {
    const validated = validate(draft);
    if (validated === null) { setInvalid(true); return false; }
    setInvalid(false);
    setEditing(false);
    onSave(validated);
    return true;
  };

  const cancel = () => {
    setEditing(false);
    setDraft(String(value));
    setInvalid(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); if (commit()) onNavigate('enter'); }
    else if (e.key === 'Tab') { e.preventDefault(); if (commit()) onNavigate(e.shiftKey ? 'shift-tab' : 'tab'); }
    else if (e.key === 'Escape') { cancel(); onNavigate('escape'); }
  };

  const handleBlur = () => {
    if (editing) {
      const validated = validate(draft);
      if (validated !== null) onSave(validated);
      setEditing(false);
      setInvalid(false);
    }
  };

  const displayValue = column.type === 'currency' ? formatCurrency(value as number) : String(value);

  return (
    <td
      ref={cellRef}
      className={`px-3 py-2 ${column.width} cursor-text`}
      style={{ borderBottom: '1px solid var(--ink-line)', borderRight: '1px solid var(--ink-line)' }}
      onClick={() => { if (!editing) onFocus(); }}
    >
      {editing ? (
        <input
          ref={inputRef}
          type={column.type === 'date' ? 'date' : column.type === 'currency' ? 'number' : 'text'}
          step={column.type === 'currency' ? '0.01' : undefined}
          min={column.type === 'currency' ? '0' : undefined}
          className="w-full field"
          style={{
            fontSize: 13,
            padding: '4px 8px',
            borderColor: invalid ? 'var(--rust)' : undefined,
            boxShadow: invalid ? 'inset 0 0 0 3px rgba(184,69,31,0.2)' : undefined,
          }}
          value={draft}
          onChange={(e) => { setDraft(e.target.value); setInvalid(false); }}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
        />
      ) : (
        <span
          className="text-[13px] block truncate"
          style={{ color: dimmed ? 'var(--ochre)' : 'var(--ink)', fontStyle: dimmed ? 'italic' : undefined }}
        >
          {displayValue || <span style={{ color: 'var(--ink-line-2)' }}>—</span>}
        </span>
      )}
    </td>
  );
}
