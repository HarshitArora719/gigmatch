import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { User, LogOut, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function Navbar() {
  const { user, logout, setAuthModal } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setMobileOpen(false);
  };

  const publicLinks = [
    { to: '/', label: 'Home' },
    { to: '/gigs', label: 'Explore Gigs' },
  ];

  const authLinks = [
    { to: '/dashboard', label: 'Dashboard', show: !!user },
    { to: '/post-gig', label: 'Post Gig', show: user?.role === 'client' },
  ].filter(l => l.show);

  const allLinks = user ? [...publicLinks, ...authLinks] : publicLinks;

  return (
    <nav
      className={cn(
        'sticky top-0 z-50 w-full transition-all duration-300',
        scrolled
          ? 'bg-paper/80 backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.04)]'
          : 'bg-paper/0'
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="container-app flex h-[72px] items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-1 no-underline select-none"
          onClick={() => setMobileOpen(false)}
        >
          <span className="font-display text-[1.4rem] font-extrabold tracking-normal text-ink">
            GIGMATCH
          </span>
          <span className="font-display text-[1.4rem] font-extrabold tracking-normal text-coral leading-none">
            *
          </span>
        </Link>

        {/* Center nav — desktop */}
        <div className="hidden lg:flex items-center gap-8">
          {allLinks.map(link => {
            const isActive =
              link.to === '/gigs'
                ? location.pathname === '/gigs'
                : link.to.startsWith('/#')
                  ? location.pathname === '/'
                  : location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={cn('nav-link', isActive && 'text-purple font-semibold')}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right side — desktop */}
        <div className="hidden lg:flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <Link
                to="/profile"
                className="group relative inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[0.9375rem] font-medium text-ink transition-all duration-300 hover:text-white hover:shadow-[0_4px_16px_rgba(124,58,237,0.25)]"
                style={{ backgroundImage: 'linear-gradient(135deg, transparent, transparent)', backgroundSize: '100% 100%' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundImage = 'linear-gradient(135deg, #7C3AED 0%, #FF6B6B 100%)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundImage = 'linear-gradient(135deg, transparent, transparent)'; }}
              >
                <User size={15} className="text-muted-foreground group-hover:text-white transition-colors duration-300" />
                {user.name?.split(' ')[0]}
              </Link>
              <button
                onClick={handleLogout}
                className="inline-flex items-center justify-center h-9 w-9 rounded-full text-muted-foreground hover:text-coral hover:bg-coral/10 transition-colors cursor-pointer bg-transparent border-none"
                title="Log out"
                aria-label="Log out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setAuthModal(true, 'login')}
                className="text-[0.9375rem] font-medium text-ink hover:text-purple transition-colors cursor-pointer bg-transparent border-none px-2 py-1"
              >
                Log In
              </button>
              <button
                onClick={() => setAuthModal(true, 'register')}
                className="btn-primary !py-2.5 !px-5 !text-sm"
              >
                Join the club
              </button>
            </div>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="lg:hidden inline-flex items-center justify-center h-10 w-10 rounded-xl text-ink hover:bg-soft transition-colors cursor-pointer bg-transparent border-none"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="lg:hidden overflow-hidden bg-paper border-t border-border/50"
          >
            <div className="container-app flex flex-col py-4 gap-1">
              {allLinks.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="flex items-center rounded-xl px-4 py-3 text-[0.9375rem] font-medium text-ink transition-all hover:bg-soft no-underline"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}

              {user && (
                <Link
                  to="/profile"
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-[0.9375rem] font-medium text-ink transition-all hover:bg-soft no-underline"
                  onClick={() => setMobileOpen(false)}
                >
                  <User size={16} />
                  Profile
                </Link>
              )}

              <div className="h-px bg-border/50 my-2 mx-2" />

              {user ? (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-left text-[0.9375rem] font-medium text-coral transition-all hover:bg-coral/10 cursor-pointer bg-transparent border-none"
                >
                  <LogOut size={16} />
                  Log out
                </button>
              ) : (
                <div className="flex flex-col gap-3 px-2 pt-2 pb-2">
                  <button
                    onClick={() => { setAuthModal(true, 'login'); setMobileOpen(false); }}
                    className="btn-secondary w-full justify-center"
                  >
                    Log In
                  </button>
                  <button
                    onClick={() => { setAuthModal(true, 'register'); setMobileOpen(false); }}
                    className="btn-primary w-full justify-center"
                  >
                    Join the club
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
