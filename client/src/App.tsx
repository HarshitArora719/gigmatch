import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
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
import AuthModal from './components/AuthModal';

function AppRoutes() {
  const location = useLocation();
  const isDashboardOrWorkspace = location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/workspace');

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <>
      {!isDashboardOrWorkspace && <Navbar />}
      <main className="flex-1 flex flex-col">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/gigs" element={<Gigs />} />
          <Route path="/gigs/:id" element={<GigDetail />} />
          <Route path="/post-gig" element={<PostGig />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/workspace" element={<Workspace />} />
          <Route path="/workspace/:id" element={<Workspace />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/edit" element={<EditProfile />} />
          <Route path="/edit-profile" element={<EditProfile />} />
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
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <AppRoutes />
      <AuthModal />
    </div>
  );
}

export default App;
