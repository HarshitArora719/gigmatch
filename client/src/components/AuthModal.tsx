import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Briefcase, UserCircle, Check } from 'lucide-react';

export default function AuthModal() {
  const { isAuthModalOpen, authModalView, setAuthModal, login, register } = useAuthStore();
  const navigate = useNavigate();

  const isLogin = authModalView === 'login';

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'client' | 'freelancer'>('freelancer');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Reset state when modal opens/closes or view changes
  useEffect(() => {
    setError('');
    if (!isAuthModalOpen) {
      setEmail('');
      setPassword('');
      setName('');
      setRole('freelancer');
    }
  }, [isAuthModalOpen, authModalView]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(name, email, password, role);
      }
      setAuthModal(false);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || `${isLogin ? 'Login' : 'Registration'} failed`);
    } finally {
      setLoading(false);
    }
  };

  const switchView = () => {
    setAuthModal(true, isLogin ? 'register' : 'login');
  };

  return (
    <Dialog open={isAuthModalOpen} onOpenChange={setAuthModal}>
      <DialogContent className="sm:max-w-[440px] p-0 border-none shadow-[0_24px_80px_rgba(0,0,0,0.12)] rounded-[28px] overflow-hidden">
        {/* Header area */}
        <div className="bg-soft px-7 py-5 flex flex-col items-center text-center border-b border-border/50">
          <div className="flex items-center gap-1 mb-2.5">
            <span className="font-display text-xl font-extrabold tracking-normal text-ink">
              GIGMATCH
            </span>
            <span className="font-display text-xl font-extrabold tracking-normal text-coral leading-none">
              *
            </span>
          </div>
          <DialogHeader>
            <DialogTitle className="text-2xl font-display font-extrabold tracking-normal text-ink text-center">
              {isLogin ? 'Welcome back' : 'Join the club'}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-ink/50 mt-1 font-medium">
            {isLogin ? 'Sign in to your creative workspace' : 'Start building your creative career'}
          </p>
        </div>

        {/* Form area */}
        <div className="px-7 py-5 bg-white">
          <form onSubmit={handleSubmit} className="space-y-3">
            {!isLogin && (
              <div className="space-y-1">
                <label className="text-sm font-semibold text-ink">Full Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required={!isLogin}
                  className="w-full h-10 px-4 rounded-xl border border-border bg-paper text-ink text-sm font-medium outline-none focus:border-purple focus:ring-2 focus:ring-purple/15 transition-all placeholder:text-ink/30"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-semibold text-ink">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="w-full h-10 px-4 rounded-xl border border-border bg-paper text-ink text-sm font-medium outline-none focus:border-purple focus:ring-2 focus:ring-purple/15 transition-all placeholder:text-ink/30"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-ink">Password</label>
              <input
                type="password"
                placeholder={isLogin ? '••••••••' : 'Minimum 6 characters'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                className="w-full h-10 px-4 rounded-xl border border-border bg-paper text-ink text-sm font-medium outline-none focus:border-purple focus:ring-2 focus:ring-purple/15 transition-all placeholder:text-ink/30"
              />
            </div>

            {!isLogin && (
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-ink">I want to…</label>
                <div className="grid grid-cols-2 gap-2.5">
                  {([
                    { val: 'freelancer' as const, label: 'Find Work', desc: 'Browse gigs', icon: UserCircle },
                    { val: 'client' as const, label: 'Hire Talent', desc: 'Post briefs', icon: Briefcase },
                  ]).map(({ val, label, desc, icon: Icon }) => {
                    const isSelected = role === val;
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setRole(val)}
                        className={`relative flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left transition-all cursor-pointer ${isSelected
                            ? 'border-purple bg-purple/5 text-ink ring-1 ring-purple/20'
                            : 'border-border bg-paper text-ink/60 hover:border-purple/30 hover:bg-soft hover:text-ink'
                          }`}
                      >
                        <Icon size={16} className={isSelected ? 'text-purple' : 'text-ink/40'} />
                        <div>
                          <span className="block text-sm font-bold leading-tight">{label}</span>
                          <span className="block text-xs opacity-70 leading-tight">{desc}</span>
                        </div>
                        {isSelected && <Check size={14} className="text-purple absolute top-2 right-2" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 text-sm text-coral bg-coral/8 rounded-xl border border-coral/15 font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center mt-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading
                ? (isLogin ? 'Signing in…' : 'Creating account…')
                : (isLogin ? 'Sign In' : 'Create Account')
              }
            </button>
          </form>

          <p className="text-center text-sm text-ink/45 mt-4 font-medium">
            {isLogin ? 'New to GigMatch?' : 'Already have an account?'}
            {' '}
            <button
              type="button"
              onClick={switchView}
              className="font-bold text-purple hover:text-purple/80 transition-colors bg-transparent border-none p-0 cursor-pointer"
            >
              {isLogin ? 'Join the club' : 'Sign in'}
            </button>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
