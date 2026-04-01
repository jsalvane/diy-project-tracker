import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { FinancialProvider } from './context/FinancialContext';
import { Header } from './components/Header';
import { Toast } from './components/Toast';
import { ProjectList } from './components/ProjectList';
import { ProjectDetail } from './components/ProjectDetail';
import { FinancialHealth } from './components/FinancialHealth';
import { Budget } from './components/Budget';
import { useApp } from './context/AppContext';

function AppShell() {
  const { loading } = useApp();

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-400 dark:text-zinc-500">Loading…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-gray-900 dark:text-gray-100">
      <Header />
      <Routes>
        <Route path="/" element={<ProjectList />} />
        <Route path="/project/:id" element={<ProjectDetail />} />
        <Route path="/financial-health" element={<FinancialHealth />} />
        <Route path="/budget" element={<Budget />} />
      </Routes>
      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <FinancialProvider>
          <AppShell />
        </FinancialProvider>
      </AppProvider>
    </BrowserRouter>
  );
}
