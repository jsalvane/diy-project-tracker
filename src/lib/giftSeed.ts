import type { Gift, GiftRecipient } from './types';
import { generateId } from './utils';

const ts = (d: string) => new Date(d).toISOString();

export function createGiftSeedData(): { recipients: GiftRecipient[]; gifts: Gift[] } {
  const joeId = generateId();
  const krystenId = generateId();
  const jackId = generateId();
  const leoId = generateId();
  const carolineId = generateId();

  const recipients: GiftRecipient[] = [
    { id: joeId,      name: 'Joe',      budget: 0, occasion: 'Christmas', color: 'blue',    createdAt: ts('2025-12-01'), updatedAt: ts('2025-12-01') },
    { id: krystenId,  name: 'Krysten',  budget: 0, occasion: 'Christmas', color: 'rose',    createdAt: ts('2025-12-01'), updatedAt: ts('2025-12-01') },
    { id: jackId,     name: 'Jack',     budget: 0, occasion: 'Christmas', color: 'emerald', createdAt: ts('2025-12-01'), updatedAt: ts('2025-12-01') },
    { id: leoId,      name: 'Leo',      budget: 0, occasion: 'Christmas', color: 'violet',  createdAt: ts('2025-12-01'), updatedAt: ts('2025-12-01') },
    { id: carolineId, name: 'Caroline', budget: 0, occasion: 'Christmas', color: 'amber',   createdAt: ts('2025-12-01'), updatedAt: ts('2025-12-01') },
  ];

  function gift(recipientId: string, idea: string, notes = ''): Gift {
    return {
      id: generateId(), recipientId, idea, cost: 0,
      status: 'want', priority: 'medium', notes, link: '',
      createdAt: ts('2025-12-01'), updatedAt: ts('2025-12-01'),
    };
  }

  const gifts: Gift[] = [
    // Joe — main list
    gift(joeId, '54 wedge'),
    gift(joeId, 'Cocktail syrups / Bitters'),
    gift(joeId, 'Retractable straps'),
    gift(joeId, 'Couch for Jack\'s room'),
    gift(joeId, 'Steam gaming'),
    gift(joeId, 'Clubhouse golf hat'),
    gift(joeId, 'Fresh barstools'),
    gift(joeId, 'Cove joggers'),
    gift(joeId, 'Garage floor tiles'),
    gift(joeId, 'Evenflo wagon'),
    gift(joeId, 'Tableware'),
    gift(joeId, 'Wide snow shovel'),
    gift(joeId, 'Smart calendar'),
    gift(joeId, 'OC sneakers'),
    gift(joeId, '5 gal bucket liner'),
    gift(joeId, 'Chef press'),
    // Joe — Temu
    gift(joeId, 'Wedding band', 'Temu'),
    gift(joeId, 'Loafers', 'Temu'),
    gift(joeId, 'Screen protector', 'Temu'),
    gift(joeId, 'Garage tiles', 'Temu'),
    // Krysten
    gift(krystenId, 'Vacuum'),
    gift(krystenId, 'Nestgo diaper bag'),
    // Jack
    gift(jackId, 'Bathtub filter'),
    gift(jackId, 'Nugget couch'),
    // Leo
    gift(leoId, 'Swimming'),
    // Caroline
    gift(carolineId, 'Fighting weiner dogs'),
  ];

  return { recipients, gifts };
}
