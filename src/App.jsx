import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ShiftProvider } from './context/ShiftContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import AdminView from './views/AdminView';
import StaffView from './views/StaffView/index';
import LoginView from './views/LoginView';
import SetupPasswordView from './views/SetUpPasswordView';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return null; // Or a loader
  if (!user) return <Navigate to="/login" replace />;

  return children;
};

const AdminRoute = ({ children }) => {
  const { user, userData, loading } = useAuth();
  if (loading) return null;
  if (!user || userData?.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Role-based Home component
const Home = () => {
  const { userData, loading } = useAuth();
  if (loading) return null;
  if (userData?.role === 'admin') return <AdminView />;
  return <StaffView />;
};

function App() {
  return (
    <AuthProvider>
      <ShiftProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginView />} />
            <Route path="/setup" element={<SetupPasswordView />} />
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <AdminRoute>
                  <AdminView />
                </AdminRoute>
              } 
            />
            {/* Fallback for old mode=admin style */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </ShiftProvider>
    </AuthProvider>
  );
}

export default App;
