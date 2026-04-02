import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { FinancialProvider } from './context/FinancialContext';
import { Header } from './components/Header';
import { Toast } from './components/Toast';
import { ProjectList } from './components/ProjectList';
import { ProjectDetail } from './components/ProjectDetail';
import { FinancialHealth } from './components/FinancialHealth';
import { Budget } from './components/Budget';
import { Gifts } from './components/Gifts';
import { Maintenance } from './components/Maintenance';
import { useApp } from './context/AppContext';
import { PinLock } from './components/PinLock';

function AppShell() {
  const { loading } = useApp();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f6f6fb] dark:bg-[#07070f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 rounded-full border border-[#6366f1]/20" />
            <div className="absolute inset-0 rounded-full border-t border-[#6366f1] animate-spin" />
          </div>
          <span className="text-[12px] font-medium tracking-[0.06em] uppercase text-[rgba(10,10,20,0.35)] dark:text-[rgba(226,226,240,0.28)]">
            Loading
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f6fb] dark:bg-[#07070f] text-[#0a0a14] dark:text-[#e2e2f0]">
      <Header />
      <Routes>
        <Route path="/" element={<Navigate to="/budget" replace />} />
        <Route path="/projects" element={<ProjectList />} />
        <Route path="/project/:id" element={<ProjectDetail />} />
        <Route path="/financial-health" element={<FinancialHealth />} />
        <Route path="/budget" element={<Budget />} />
        <Route path="/gifts" element={<Gifts />} />
        <Route path="/maintenance" element={<Maintenance />} />
      </Routes>
      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <PinLock>
        <AppProvider>
          <FinancialProvider>
            <AppShell />
          </FinancialProvider>
        </AppProvider>
      </PinLock>
    </BrowserRouter>
  );
}
