import type { Project, Entry, Task } from './types';
import { generateId } from './utils';

const ts = (d: string) => new Date(d).toISOString();

export function createSeedData(): { projects: Project[]; entries: Entry[]; tasks: Task[] } {
  const basementId = generateId();
  const deckId = generateId();
  const bathroomId = generateId();

  const projects: Project[] = [
    {
      id: basementId,
      name: 'Basement Remodel',
      status: 'complete',
      startDate: '2025-10-15',
      finishDate: '2026-01-20',
      notes: 'Full basement finishing including framing, drywall, flooring, and a small wet bar area.',
      createdAt: ts('2025-10-14'),
      updatedAt: ts('2026-01-20'),
    },
    {
      id: deckId,
      name: 'Deck Repair',
      status: 'active',
      startDate: '2026-02-01',
      finishDate: '',
      notes: 'Replacing rotted boards, re-staining, and adding new railing sections.',
      createdAt: ts('2026-01-28'),
      updatedAt: ts('2026-03-15'),
    },
    {
      id: bathroomId,
      name: 'Bathroom Update',
      status: 'planned',
      startDate: '2026-04-01',
      finishDate: '',
      notes: 'Guest bathroom refresh: new vanity, faucet, mirror, and paint.',
      createdAt: ts('2026-03-10'),
      updatedAt: ts('2026-03-10'),
    },
  ];

  const entries: Entry[] = [
    // Basement Remodel entries
    {
      id: generateId(), projectId: basementId, date: '2025-10-18',
      store: 'Home Depot', category: 'Lumber', description: '2x4 studs for framing (x40)',
      price: 156.80, createdAt: ts('2025-10-18'), updatedAt: ts('2025-10-18'),
    },
    {
      id: generateId(), projectId: basementId, date: '2025-10-20',
      store: 'Home Depot', category: 'Hardware', description: 'Framing nails, screws, brackets',
      price: 67.45, createdAt: ts('2025-10-20'), updatedAt: ts('2025-10-20'),
    },
    {
      id: generateId(), projectId: basementId, date: '2025-11-02',
      store: "Lowe's", category: 'Materials', description: 'Drywall sheets (x24) and joint compound',
      price: 312.00, createdAt: ts('2025-11-02'), updatedAt: ts('2025-11-02'),
    },
    {
      id: generateId(), projectId: basementId, date: '2025-11-15',
      store: "Lowe's", category: 'Electrical', description: 'Recessed lighting kit (6-pack) and wire',
      price: 189.99, createdAt: ts('2025-11-15'), updatedAt: ts('2025-11-15'),
    },
    {
      id: generateId(), projectId: basementId, date: '2025-12-01',
      store: 'Floor & Decor', category: 'Materials', description: 'Luxury vinyl plank flooring 400sqft',
      price: 548.00, createdAt: ts('2025-12-01'), updatedAt: ts('2025-12-01'),
    },
    {
      id: generateId(), projectId: basementId, date: '2025-12-10',
      store: 'Sherwin-Williams', category: 'Paint', description: 'Primer and wall paint (5 gal each)',
      price: 215.50, createdAt: ts('2025-12-10'), updatedAt: ts('2025-12-10'),
    },
    {
      id: generateId(), projectId: basementId, date: '2026-01-05',
      store: 'Amazon', category: 'Fixtures', description: 'Bar sink and faucet combo',
      price: 179.99, createdAt: ts('2026-01-05'), updatedAt: ts('2026-01-05'),
    },
    {
      id: generateId(), projectId: basementId, date: '2026-01-12',
      store: 'Home Depot', category: 'Plumbing', description: 'PEX tubing, fittings, and shut-off valve',
      price: 84.30, createdAt: ts('2026-01-12'), updatedAt: ts('2026-01-12'),
    },

    // Deck Repair entries
    {
      id: generateId(), projectId: deckId, date: '2026-02-03',
      store: 'Menards', category: 'Lumber', description: 'Pressure-treated deck boards (x20)',
      price: 284.00, createdAt: ts('2026-02-03'), updatedAt: ts('2026-02-03'),
    },
    {
      id: generateId(), projectId: deckId, date: '2026-02-03',
      store: 'Menards', category: 'Hardware', description: 'Deck screws (2 boxes) and joist hangers',
      price: 52.75, createdAt: ts('2026-02-03'), updatedAt: ts('2026-02-03'),
    },
    {
      id: generateId(), projectId: deckId, date: '2026-02-15',
      store: 'Home Depot', category: 'Tools', description: 'Circular saw blade and pry bar',
      price: 38.99, createdAt: ts('2026-02-15'), updatedAt: ts('2026-02-15'),
    },
    {
      id: generateId(), projectId: deckId, date: '2026-03-01',
      store: "Lowe's", category: 'Materials', description: 'Railing kit — 6ft sections (x3)',
      price: 197.50, createdAt: ts('2026-03-01'), updatedAt: ts('2026-03-01'),
    },
    {
      id: generateId(), projectId: deckId, date: '2026-03-10',
      store: 'Sherwin-Williams', category: 'Paint', description: 'Exterior deck stain (3 gal)',
      price: 134.97, createdAt: ts('2026-03-10'), updatedAt: ts('2026-03-10'),
    },
    {
      id: generateId(), projectId: deckId, date: '2026-03-15',
      store: 'Amazon', category: 'Hardware', description: 'Post caps and solar lights (x6)',
      price: 59.94, createdAt: ts('2026-03-15'), updatedAt: ts('2026-03-15'),
    },

    // Bathroom Update entries (planning purchases)
    {
      id: generateId(), projectId: bathroomId, date: '2026-03-20',
      store: "Lowe's", category: 'Fixtures', description: 'Vanity with sink top 36"',
      price: 349.00, createdAt: ts('2026-03-20'), updatedAt: ts('2026-03-20'),
    },
    {
      id: generateId(), projectId: bathroomId, date: '2026-03-22',
      store: 'Amazon', category: 'Fixtures', description: 'Bathroom faucet — brushed nickel',
      price: 79.99, createdAt: ts('2026-03-22'), updatedAt: ts('2026-03-22'),
    },
    {
      id: generateId(), projectId: bathroomId, date: '2026-03-25',
      store: 'IKEA', category: 'Fixtures', description: 'Framed mirror 24x36"',
      price: 49.99, createdAt: ts('2026-03-25'), updatedAt: ts('2026-03-25'),
    },
  ];

  const tasks: Task[] = [
    // Basement Remodel — complete, all tasks done
    { id: generateId(), projectId: basementId, text: 'Frame interior walls', completed: true, createdAt: ts('2025-10-14'), updatedAt: ts('2025-10-20') },
    { id: generateId(), projectId: basementId, text: 'Hang and tape drywall', completed: true, createdAt: ts('2025-10-14'), updatedAt: ts('2025-11-10') },
    { id: generateId(), projectId: basementId, text: 'Install recessed lighting', completed: true, createdAt: ts('2025-10-14'), updatedAt: ts('2025-11-20') },
    { id: generateId(), projectId: basementId, text: 'Lay vinyl plank flooring', completed: true, createdAt: ts('2025-10-14'), updatedAt: ts('2025-12-05') },
    { id: generateId(), projectId: basementId, text: 'Paint walls and trim', completed: true, createdAt: ts('2025-10-14'), updatedAt: ts('2025-12-15') },

    // Deck Repair — active, mix of done and open
    { id: generateId(), projectId: deckId, text: 'Remove rotted boards', completed: true, createdAt: ts('2026-01-28'), updatedAt: ts('2026-02-10') },
    { id: generateId(), projectId: deckId, text: 'Replace joist hangers', completed: true, createdAt: ts('2026-01-28'), updatedAt: ts('2026-02-12') },
    { id: generateId(), projectId: deckId, text: 'Install new deck boards', completed: false, createdAt: ts('2026-01-28'), updatedAt: ts('2026-01-28') },
    { id: generateId(), projectId: deckId, text: 'Sand and apply stain', completed: false, createdAt: ts('2026-01-28'), updatedAt: ts('2026-01-28') },
    { id: generateId(), projectId: deckId, text: 'Install new railing sections', completed: false, createdAt: ts('2026-01-28'), updatedAt: ts('2026-01-28') },

    // Bathroom Update — planned, all open
    { id: generateId(), projectId: bathroomId, text: 'Confirm vanity dimensions before delivery', completed: false, createdAt: ts('2026-03-10'), updatedAt: ts('2026-03-10') },
    { id: generateId(), projectId: bathroomId, text: 'Remove old vanity and shut off plumbing', completed: false, createdAt: ts('2026-03-10'), updatedAt: ts('2026-03-10') },
    { id: generateId(), projectId: bathroomId, text: 'Paint walls before installing vanity', completed: false, createdAt: ts('2026-03-10'), updatedAt: ts('2026-03-10') },
    { id: generateId(), projectId: bathroomId, text: 'Install vanity and connect plumbing', completed: false, createdAt: ts('2026-03-10'), updatedAt: ts('2026-03-10') },
    { id: generateId(), projectId: bathroomId, text: 'Hang mirror and install lighting', completed: false, createdAt: ts('2026-03-10'), updatedAt: ts('2026-03-10') },
  ];

  return { projects, entries, tasks };
}
