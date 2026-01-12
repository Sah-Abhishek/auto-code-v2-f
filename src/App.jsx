import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar, { SidebarProvider, useSidebar } from './components/Sidebar';
import ChartDetail from './pages/ChartDetail';
import Analytics from './pages/Analytics';
import Dashboard from './pages/Dashboard';
import WorkQueue from './pages/WorkQueue';
import DocumentIngestion from './pages/DocumentIngestionPage';

// Layout component that adjusts based on sidebar state
const Layout = ({ children }) => {
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <main
        className={`transition-all duration-300 ease-in-out ${isCollapsed ? 'ml-[72px]' : 'ml-64'
          }`}
      >
        {children}
      </main>
    </div>
  );
};

// Wrapper to provide sidebar context
const AppContent = () => {
  return (
    <SidebarProvider>
      <Layout>
        <Routes>
          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Main routes */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/work-queue" element={<WorkQueue />} />
          <Route path="/document-ingestion" element={<DocumentIngestion />} />
          <Route path="/analytics" element={<Analytics />} />

          {/* Chart detail - full page without sidebar adjustment */}
          <Route path="/chart/:chartNumber" element={<ChartDetail />} />

          {/* Settings and Help placeholder routes */}
          <Route path="/settings" element={<PlaceholderPage title="Settings" />} />
          <Route path="/help" element={<PlaceholderPage title="Help & Support" />} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </SidebarProvider>
  );
};

// Placeholder page component
const PlaceholderPage = ({ title }) => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">{title}</h1>
      <p className="text-slate-500">Coming soon...</p>
    </div>
  </div>
);

// 404 page
const NotFound = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-6xl font-bold text-slate-300 mb-4">404</h1>
      <p className="text-slate-600 mb-4">Page not found</p>
      <a href="/dashboard" className="text-blue-600 hover:text-blue-700">
        Go to Dashboard
      </a>
    </div>
  </div>
);

function App() {
  return (
    <>    {/* <Router> */}
      < AppContent />
      {/* </Router > */}
    </>

  );
}

export default App;
