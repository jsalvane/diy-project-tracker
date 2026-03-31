import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { BudgetItem, CreditCard, Loan, LoanPayment } from '../lib/types';
import { generateId, now } from '../lib/utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapBudgetItem(row: any): BudgetItem {
  return {
    id: row.id,
    name: row.name,
    dueGroup: row.due_group,
    billAmount: row.bill_amount ?? 0,
    payment: row.payment ?? 0,
    status: row.status ?? 'pending',
    sortOrder: row.sort_order ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCreditCard(row: any): CreditCard {
  return {
    id: row.id,
    name: row.name,
    servicer: row.servicer ?? '',
    creditLimit: row.credit_limit ?? 0,
    annualFee: row.annual_fee ?? 0,
    openDate: row.open_date ?? '',
    status: row.status ?? 'active',
    closedDate: row.closed_date ?? '',
    inquiries: row.inquiries ?? 0,
    inquiryNote: row.inquiry_note ?? '',
    isChargeCard: row.is_charge_card ?? false,
    sortOrder: row.sort_order ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapLoan(row: any): Loan {
  return {
    id: row.id,
    name: row.name,
    owner: row.owner ?? '',
    balance: row.balance ?? 0,
    interestRate: row.interest_rate ?? 0,
    sortOrder: row.sort_order ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapLoanPayment(row: any): LoanPayment {
  return {
    id: row.id,
    loanId: row.loan_id,
    paymentDate: row.payment_date,
    amount: row.amount ?? 0,
    createdAt: row.created_at,
  };
}

export function useBudget() {
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loanPayments, setLoanPayments] = useState<LoanPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [{ data: items }, { data: cards }, { data: loansData }, { data: payments }] =
          await Promise.all([
            supabase.from('budget_items').select('*').order('sort_order'),
            supabase.from('credit_cards').select('*').order('sort_order'),
            supabase.from('loans').select('*').order('sort_order'),
            supabase.from('loan_payments').select('*').order('payment_date', { ascending: false }),
          ]);
        setBudgetItems((items ?? []).map(mapBudgetItem));
        setCreditCards((cards ?? []).map(mapCreditCard));
        setLoans((loansData ?? []).map(mapLoan));
        setLoanPayments((payments ?? []).map(mapLoanPayment));
      } catch (err) {
        console.error('Failed to load budget data:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // --- Budget Items ---

  const addBudgetItem = useCallback(async (data: Omit<BudgetItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const item: BudgetItem = { ...data, id: generateId(), createdAt: now(), updatedAt: now() };
    setBudgetItems(prev => [...prev, item]);
    await supabase.from('budget_items').insert({
      id: item.id, name: item.name, due_group: item.dueGroup,
      bill_amount: item.billAmount, payment: item.payment, status: item.status,
      sort_order: item.sortOrder, created_at: item.createdAt, updated_at: item.updatedAt,
    });
    return item;
  }, []);

  const updateBudgetItem = useCallback(async (item: BudgetItem) => {
    const updated = { ...item, updatedAt: now() };
    setBudgetItems(prev => prev.map(i => i.id === updated.id ? updated : i));
    await supabase.from('budget_items').update({
      name: updated.name, due_group: updated.dueGroup, bill_amount: updated.billAmount,
      payment: updated.payment, status: updated.status, sort_order: updated.sortOrder,
      updated_at: updated.updatedAt,
    }).eq('id', updated.id);
  }, []);

  const deleteBudgetItem = useCallback(async (id: string) => {
    setBudgetItems(prev => prev.filter(i => i.id !== id));
    await supabase.from('budget_items').delete().eq('id', id);
  }, []);

  // --- Credit Cards ---

  const addCreditCard = useCallback(async (data: Omit<CreditCard, 'id' | 'createdAt' | 'updatedAt'>) => {
    const card: CreditCard = { ...data, id: generateId(), createdAt: now(), updatedAt: now() };
    setCreditCards(prev => [...prev, card]);
    await supabase.from('credit_cards').insert({
      id: card.id, name: card.name, servicer: card.servicer,
      credit_limit: card.creditLimit, annual_fee: card.annualFee,
      open_date: card.openDate || null, status: card.status,
      closed_date: card.closedDate || null, inquiries: card.inquiries,
      inquiry_note: card.inquiryNote, is_charge_card: card.isChargeCard,
      sort_order: card.sortOrder, created_at: card.createdAt, updated_at: card.updatedAt,
    });
    return card;
  }, []);

  const updateCreditCard = useCallback(async (card: CreditCard) => {
    const updated = { ...card, updatedAt: now() };
    setCreditCards(prev => prev.map(c => c.id === updated.id ? updated : c));
    await supabase.from('credit_cards').update({
      name: updated.name, servicer: updated.servicer, credit_limit: updated.creditLimit,
      annual_fee: updated.annualFee, open_date: updated.openDate || null,
      status: updated.status, closed_date: updated.closedDate || null,
      inquiries: updated.inquiries, inquiry_note: updated.inquiryNote,
      is_charge_card: updated.isChargeCard, sort_order: updated.sortOrder,
      updated_at: updated.updatedAt,
    }).eq('id', updated.id);
  }, []);

  const deleteCreditCard = useCallback(async (id: string) => {
    setCreditCards(prev => prev.filter(c => c.id !== id));
    await supabase.from('credit_cards').delete().eq('id', id);
  }, []);

  // --- Loans ---

  const addLoan = useCallback(async (data: Omit<Loan, 'id' | 'createdAt' | 'updatedAt'>) => {
    const loan: Loan = { ...data, id: generateId(), createdAt: now(), updatedAt: now() };
    setLoans(prev => [...prev, loan]);
    await supabase.from('loans').insert({
      id: loan.id, name: loan.name, owner: loan.owner,
      balance: loan.balance, interest_rate: loan.interestRate,
      sort_order: loan.sortOrder, created_at: loan.createdAt, updated_at: loan.updatedAt,
    });
    return loan;
  }, []);

  const updateLoan = useCallback(async (loan: Loan) => {
    const updated = { ...loan, updatedAt: now() };
    setLoans(prev => prev.map(l => l.id === updated.id ? updated : l));
    await supabase.from('loans').update({
      name: updated.name, owner: updated.owner, balance: updated.balance,
      interest_rate: updated.interestRate, sort_order: updated.sortOrder,
      updated_at: updated.updatedAt,
    }).eq('id', updated.id);
  }, []);

  const deleteLoan = useCallback(async (id: string) => {
    setLoans(prev => prev.filter(l => l.id !== id));
    setLoanPayments(prev => prev.filter(p => p.loanId !== id));
    await supabase.from('loans').delete().eq('id', id);
  }, []);

  // --- Loan Payments ---

  const addLoanPayment = useCallback(async (data: Omit<LoanPayment, 'id' | 'createdAt'>) => {
    const payment: LoanPayment = { ...data, id: generateId(), createdAt: now() };
    setLoanPayments(prev =>
      [payment, ...prev].sort((a, b) => b.paymentDate.localeCompare(a.paymentDate))
    );
    await supabase.from('loan_payments').insert({
      id: payment.id, loan_id: payment.loanId,
      payment_date: payment.paymentDate, amount: payment.amount,
      created_at: payment.createdAt,
    });
    return payment;
  }, []);

  const deleteLoanPayment = useCallback(async (id: string) => {
    setLoanPayments(prev => prev.filter(p => p.id !== id));
    await supabase.from('loan_payments').delete().eq('id', id);
  }, []);

  return {
    budgetItems, creditCards, loans, loanPayments, loading,
    addBudgetItem, updateBudgetItem, deleteBudgetItem,
    addCreditCard, updateCreditCard, deleteCreditCard,
    addLoan, updateLoan, deleteLoan,
    addLoanPayment, deleteLoanPayment,
  };
}
