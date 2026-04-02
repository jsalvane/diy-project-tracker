import type { MaintenanceGroup, MaintenanceCategory, RecurrenceType, RecurrenceUnit } from './types';

export interface PresetTask {
  name: string;
  group: MaintenanceGroup;
  category: MaintenanceCategory;
  recurrenceType: RecurrenceType;
  recurrenceUnit: RecurrenceUnit | '';
  recurrenceValue: number;
  icon: string;
  instructions: string;
}

export const CATEGORY_META: Record<MaintenanceCategory, { label: string; group: MaintenanceGroup; icon: string }> = {
  hvac:          { label: 'HVAC',            group: 'home',     icon: '🌡️' },
  electrical:    { label: 'Electrical',      group: 'home',     icon: '⚡' },
  plumbing:      { label: 'Plumbing',        group: 'home',     icon: '🔧' },
  exterior:      { label: 'Exterior',        group: 'home',     icon: '🏠' },
  interior:      { label: 'Interior',        group: 'home',     icon: '🪑' },
  appliances:    { label: 'Appliances',      group: 'home',     icon: '🍳' },
  safety:        { label: 'Safety',          group: 'home',     icon: '🧯' },
  'windows-doors': { label: 'Windows/Doors', group: 'home',     icon: '🪟' },
  vehicles:      { label: 'Vehicles',        group: 'machines', icon: '🚗' },
  'power-tools': { label: 'Power Tools',     group: 'machines', icon: '⚙️' },
  'lawn-garden': { label: 'Lawn/Garden',     group: 'machines', icon: '🌿' },
  'snow-winter': { label: 'Snow/Winter',     group: 'machines', icon: '❄️' },
  generator:     { label: 'Generator/Backup',group: 'machines', icon: '🔋' },
  recreational:  { label: 'Recreational',    group: 'machines', icon: '🚤' },
  other:         { label: 'Other',           group: 'machines', icon: '🔩' },
};

export const MAINTENANCE_PRESETS: PresetTask[] = [
  // ── Home > HVAC ──────────────────────────────────────────────────────
  { name: 'Filter change',        group: 'home', category: 'hvac', recurrenceType: 'date', recurrenceUnit: 'months', recurrenceValue: 1,  icon: '🌡️', instructions: 'Replace HVAC air filter. Check size on existing filter before purchasing.' },
  { name: 'Vent clean',           group: 'home', category: 'hvac', recurrenceType: 'date', recurrenceUnit: 'months', recurrenceValue: 3,  icon: '🌡️', instructions: 'Vacuum all supply and return vents. Wipe down vent covers.' },
  { name: 'Thermostat batteries', group: 'home', category: 'hvac', recurrenceType: 'date', recurrenceUnit: 'years',  recurrenceValue: 1,  icon: '🌡️', instructions: 'Replace thermostat batteries. Test heating and cooling modes after.' },

  // ── Home > Electrical ────────────────────────────────────────────────
  { name: 'Smoke/CO test',        group: 'home', category: 'electrical', recurrenceType: 'date', recurrenceUnit: 'months', recurrenceValue: 1,  icon: '⚡', instructions: 'Press test button on all smoke and CO detectors. Replace batteries if low.' },
  { name: 'GFCI test',            group: 'home', category: 'electrical', recurrenceType: 'date', recurrenceUnit: 'months', recurrenceValue: 3,  icon: '⚡', instructions: 'Press test and reset buttons on all GFCI outlets in kitchen, bathrooms, garage, and outdoor areas.' },

  // ── Home > Plumbing ──────────────────────────────────────────────────
  { name: 'Water heater flush',   group: 'home', category: 'plumbing', recurrenceType: 'date', recurrenceUnit: 'years',  recurrenceValue: 1,  icon: '🔧', instructions: 'Turn off power/gas. Attach hose to drain valve. Flush until water runs clear. Check anode rod.' },
  { name: 'Sump test',            group: 'home', category: 'plumbing', recurrenceType: 'date', recurrenceUnit: 'months', recurrenceValue: 3,  icon: '🔧', instructions: 'Pour water into sump pit to trigger float switch. Verify pump activates and drains properly.' },

  // ── Home > Exterior ──────────────────────────────────────────────────
  { name: 'Gutter clean',         group: 'home', category: 'exterior', recurrenceType: 'date', recurrenceUnit: 'months', recurrenceValue: 3,  icon: '🏠', instructions: 'Remove debris from gutters and downspouts. Check for leaks and proper drainage away from foundation.' },
  { name: 'Deck seal',            group: 'home', category: 'exterior', recurrenceType: 'date', recurrenceUnit: 'years',  recurrenceValue: 1,  icon: '🏠', instructions: 'Power wash deck surface. Allow to dry 48 hours. Apply sealant/stain with roller or sprayer.' },

  // ── Home > Interior ──────────────────────────────────────────────────
  { name: 'Dryer vent',           group: 'home', category: 'interior', recurrenceType: 'date', recurrenceUnit: 'years',  recurrenceValue: 1,  icon: '🪑', instructions: 'Disconnect dryer duct. Use vent brush to clean full length of duct to exterior. Check exterior flap.' },
  { name: 'Fridge coils',         group: 'home', category: 'interior', recurrenceType: 'date', recurrenceUnit: 'months', recurrenceValue: 6,  icon: '🪑', instructions: 'Pull fridge away from wall. Vacuum condenser coils on back or underneath. Clean drip pan if accessible.' },

  // ── Home > Appliances ────────────────────────────────────────────────
  { name: 'Dishwasher filter',    group: 'home', category: 'appliances', recurrenceType: 'date', recurrenceUnit: 'months', recurrenceValue: 1,  icon: '🍳', instructions: 'Remove bottom rack. Twist and remove filter assembly. Rinse under hot water with soft brush.' },
  { name: 'Oven clean',           group: 'home', category: 'appliances', recurrenceType: 'date', recurrenceUnit: 'months', recurrenceValue: 3,  icon: '🍳', instructions: 'Run self-clean cycle or apply oven cleaner. Wipe down interior. Clean racks separately.' },

  // ── Home > Safety ────────────────────────────────────────────────────
  { name: 'Extinguisher check',   group: 'home', category: 'safety', recurrenceType: 'date', recurrenceUnit: 'years',  recurrenceValue: 1,  icon: '🧯', instructions: 'Verify pressure gauge is in green zone. Check for physical damage. Confirm pin and tamper seal intact.' },
  { name: 'Chimney inspect',      group: 'home', category: 'safety', recurrenceType: 'date', recurrenceUnit: 'years',  recurrenceValue: 1,  icon: '🧯', instructions: 'Schedule professional chimney inspection and cleaning. Check for creosote buildup and structural issues.' },

  // ── Home > Windows/Doors ─────────────────────────────────────────────
  { name: 'Lube hinges',          group: 'home', category: 'windows-doors', recurrenceType: 'date', recurrenceUnit: 'months', recurrenceValue: 6,  icon: '🪟', instructions: 'Apply silicone or white lithium grease to all door hinges. Work door back and forth to distribute.' },
  { name: 'Caulk gaps',           group: 'home', category: 'windows-doors', recurrenceType: 'date', recurrenceUnit: 'years',  recurrenceValue: 1,  icon: '🪟', instructions: 'Inspect caulking around all windows and exterior doors. Remove old caulk where cracked. Apply new bead.' },

  // ── Machines > Vehicles ──────────────────────────────────────────────
  { name: 'Oil change',           group: 'machines', category: 'vehicles', recurrenceType: 'usage', recurrenceUnit: 'miles', recurrenceValue: 5000,  icon: '🚗', instructions: 'Drain old oil. Replace oil filter. Refill with manufacturer-recommended oil weight and quantity.' },
  { name: 'Tire rotate',          group: 'machines', category: 'vehicles', recurrenceType: 'usage', recurrenceUnit: 'miles', recurrenceValue: 6000,  icon: '🚗', instructions: 'Rotate tires in recommended pattern (front-to-back or cross). Check tire pressure and tread depth.' },
  { name: 'Battery test',         group: 'machines', category: 'vehicles', recurrenceType: 'date', recurrenceUnit: 'months', recurrenceValue: 6,  icon: '🚗', instructions: 'Load test battery. Clean terminals with wire brush. Check for corrosion. Verify secure mount.' },
  { name: 'Brake check',          group: 'machines', category: 'vehicles', recurrenceType: 'usage', recurrenceUnit: 'miles', recurrenceValue: 12000, icon: '🚗', instructions: 'Inspect brake pads for wear. Check rotors for scoring. Verify brake fluid level. Listen for unusual noises.' },

  // ── Machines > Power Tools ───────────────────────────────────────────
  { name: 'Chain sharpen',        group: 'machines', category: 'power-tools', recurrenceType: 'usage', recurrenceUnit: 'uses', recurrenceValue: 10,   icon: '⚙️', instructions: 'Use round file at correct angle for chain pitch. File each cutter evenly. Check depth gauges.' },
  { name: 'Cord inspect',         group: 'machines', category: 'power-tools', recurrenceType: 'date', recurrenceUnit: 'years',  recurrenceValue: 1,    icon: '⚙️', instructions: 'Inspect all power tool cords for fraying, cuts, or exposed wire. Replace damaged cords immediately.' },

  // ── Machines > Lawn/Garden ───────────────────────────────────────────
  { name: 'Mower blade',          group: 'machines', category: 'lawn-garden', recurrenceType: 'usage', recurrenceUnit: 'hours', recurrenceValue: 20,   icon: '🌿', instructions: 'Remove blade. Sharpen with bench grinder or file. Balance blade. Torque to spec on reinstall.' },
  { name: 'Trimmer line',         group: 'machines', category: 'lawn-garden', recurrenceType: 'seasonal', recurrenceUnit: 'season-end', recurrenceValue: 0, icon: '🌿', instructions: 'Replace trimmer line spool. Clean debris from trimmer head. Inspect guard and shaft.' },
  { name: 'Fuel drain',           group: 'machines', category: 'lawn-garden', recurrenceType: 'seasonal', recurrenceUnit: 'winter', recurrenceValue: 0, icon: '🌿', instructions: 'Run engine until fuel is exhausted or add fuel stabilizer. Drain carburetor bowl if applicable.' },

  // ── Machines > Snow/Winter ───────────────────────────────────────────
  { name: 'Snowblower oil',       group: 'machines', category: 'snow-winter', recurrenceType: 'seasonal', recurrenceUnit: 'pre-season', recurrenceValue: 0, icon: '❄️', instructions: 'Drain old oil while engine is warm. Refill with manufacturer-recommended weight. Check oil level.' },
  { name: 'Spark plug',           group: 'machines', category: 'snow-winter', recurrenceType: 'date', recurrenceUnit: 'years',  recurrenceValue: 1,  icon: '❄️', instructions: 'Remove old spark plug. Check gap on new plug with feeler gauge. Install hand-tight then 1/4 turn.' },
  { name: 'Auger grease',         group: 'machines', category: 'snow-winter', recurrenceType: 'date', recurrenceUnit: 'years',  recurrenceValue: 1,  icon: '❄️', instructions: 'Remove auger assembly. Clean old grease. Apply fresh grease to auger shaft and gearbox fittings.' },

  // ── Machines > Generator/Backup ──────────────────────────────────────
  { name: 'Run test',             group: 'machines', category: 'generator', recurrenceType: 'date', recurrenceUnit: 'months', recurrenceValue: 1,  icon: '🔋', instructions: 'Start generator. Let run under load for 15-30 minutes. Check output voltage. Inspect for leaks.' },
  { name: 'Oil change',           group: 'machines', category: 'generator', recurrenceType: 'usage', recurrenceUnit: 'hours', recurrenceValue: 100, icon: '🔋', instructions: 'Drain oil while warm. Replace oil filter if equipped. Refill with recommended oil. Check level on dipstick.' },
  { name: 'Battery',              group: 'machines', category: 'generator', recurrenceType: 'date', recurrenceUnit: 'months', recurrenceValue: 6,  icon: '🔋', instructions: 'Check battery voltage with multimeter. Clean terminals. Verify electrolyte levels if applicable. Load test.' },

  // ── Machines > Recreational ──────────────────────────────────────────
  { name: 'Boat winterize',       group: 'machines', category: 'recreational', recurrenceType: 'custom', recurrenceUnit: '', recurrenceValue: 0,  icon: '🚤', instructions: 'Flush engine with antifreeze. Fog cylinders. Drain water systems. Remove battery. Cover and store.' },
  { name: 'Jet ski flush',        group: 'machines', category: 'recreational', recurrenceType: 'seasonal', recurrenceUnit: 'post-salt', recurrenceValue: 0, icon: '🚤', instructions: 'Flush engine with fresh water for 2-3 minutes after every saltwater use. Rinse exterior thoroughly.' },
  { name: 'ATV chain',            group: 'machines', category: 'recreational', recurrenceType: 'usage', recurrenceUnit: 'miles', recurrenceValue: 100, icon: '🚤', instructions: 'Clean chain with degreaser. Inspect for tight links or wear. Lubricate with chain-specific lube. Check tension.' },
  { name: 'Trailer lights',       group: 'machines', category: 'recreational', recurrenceType: 'seasonal', recurrenceUnit: 'spring', recurrenceValue: 0, icon: '🚤', instructions: 'Test all trailer lights: brake, turn, running, reverse. Check wiring connections. Replace bulbs as needed.' },

  // ── Machines > Other ─────────────────────────────────────────────────
  { name: 'Bike lube',            group: 'machines', category: 'other', recurrenceType: 'usage', recurrenceUnit: 'miles', recurrenceValue: 500, icon: '🔩', instructions: 'Clean chain with degreaser. Apply chain lube. Wipe excess. Check derailleur cables and brake pads.' },
  { name: 'Toolbox inventory',    group: 'machines', category: 'other', recurrenceType: 'date', recurrenceUnit: 'years',  recurrenceValue: 1,  icon: '🔩', instructions: 'Inventory all tools. Replace worn or broken items. Organize by type. Update consumables (bits, blades, sandpaper).' },
];

// ── Helpers ──────────────────────────────────────────────────────────────

export function getCategoriesForGroup(group: MaintenanceGroup): MaintenanceCategory[] {
  return (Object.entries(CATEGORY_META) as [MaintenanceCategory, typeof CATEGORY_META[MaintenanceCategory]][])
    .filter(([, meta]) => meta.group === group)
    .map(([cat]) => cat);
}

export function getPresetsForCategory(category: MaintenanceCategory): PresetTask[] {
  return MAINTENANCE_PRESETS.filter(p => p.category === category);
}
