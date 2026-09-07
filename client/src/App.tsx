import { useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Gigs from './pages/Gigs';
import GigDetail from './pages/GigDetail';
import PostGig from './pages/PostGig';
import Dashboard from './pages/Dashboard';
import Workspace from './pages/Workspace';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import GigProposals from './pages/GigProposals';
import AuthModal from './components/AuthModal';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

function AppRoutes() {
  const location = useLocation();
  const isDashboardOrWorkspace =
    location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/workspace');

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <>
      {!isDashboardOrWorkspace && <Navbar />}
      <main className="flex-1 flex flex-col">
        <Routes>
          {/* Public Marketplace Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/gigs" element={<Gigs />} />
          <Route path="/gigs/:id" element={<GigDetail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:userId" element={<Profile />} />

          {/* Client-Only Protected Routes */}
          <Route
            path="/post-gig"
            element={
              <ProtectedRoute allowedRoles={['client']}>
                <PostGig />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-gigs"
            element={
              <ProtectedRoute allowedRoles={['client']}>
                <Navigate to="/dashboard?tab=Projects" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-gigs/:gigId/proposals"
            element={
              <ProtectedRoute allowedRoles={['client']}>
                <GigProposals />
              </ProtectedRoute>
            }
          />

          {/* Freelancer-Only Protected Routes */}
          <Route
            path="/my-proposals"
            element={
              <ProtectedRoute allowedRoles={['freelancer']}>
                <Navigate to="/dashboard?tab=Proposals" replace />
              </ProtectedRoute>
            }
          />

          {/* General Authenticated Protected Routes */}
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <Navigate to="/dashboard?tab=Orders" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/workspace"
            element={
              <ProtectedRoute>
                <Workspace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/workspace/:id"
            element={
              <ProtectedRoute>
                <Workspace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/edit"
            element={
              <ProtectedRoute>
                <EditProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit-profile"
            element={
              <ProtectedRoute>
                <EditProfile />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      {!isDashboardOrWorkspace && <Footer />}
    </>
  );
}

function App() {
  const { fetchMe } = useAuthStore();

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  return (
    <ErrorBoundary>
      <div className="flex min-h-screen flex-col bg-paper text-ink">
        <AppRoutes />
        <AuthModal />
      </div>
    </ErrorBoundary>
  );
}

export default App;
