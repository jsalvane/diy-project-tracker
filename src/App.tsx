import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Header } from './components/Header';
import { Toast } from './components/Toast';
import { ProjectList } from './components/ProjectList';
import { ProjectDetail } from './components/ProjectDetail';

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
          <Header />
          <Routes>
            <Route path="/" element={<ProjectList />} />
            <Route path="/project/:id" element={<ProjectDetail />} />
          </Routes>
          <Toast />
        </div>
      </AppProvider>
    </BrowserRouter>
  );
}
