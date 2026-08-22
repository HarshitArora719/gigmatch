import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const [email, setEmail] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    // Newsletter subscription logic
    setEmail('');
  };

  return (
    <footer className="bg-ink text-white/90 relative overflow-hidden">
      <div className="container-app py-16 md:py-20 relative z-10">
        {/* Top */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-12 md:gap-16">
          {/* Brand */}
          <div className="space-y-5 max-w-sm">
            <Link to="/" className="inline-flex items-center gap-1 no-underline">
              <span className="font-display text-2xl font-extrabold tracking-normal text-white">
                GIGMATCH
              </span>
              <span className="font-display text-2xl font-extrabold tracking-normal text-coral leading-none">
                *
              </span>
            </Link>
            <p className="text-[0.9375rem] leading-relaxed text-white/60">
              A more intelligent marketplace for ambitious freelance work.
            </p>
          </div>

          {/* Newsletter */}
          <div className="max-w-sm w-full">
            <h4 className="font-display text-sm font-bold tracking-wide text-white/80 uppercase mb-4">
              Stay in the loop
            </h4>
            <form onSubmit={handleSubscribe} className="flex items-center gap-0 rounded-full bg-white/8 border border-white/10 p-1">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                required
                className="flex-1 bg-transparent border-none outline-none px-4 py-2.5 text-sm text-white placeholder:text-white/35 font-medium"
                aria-label="Email address for newsletter"
              />
              <button
                type="submit"
                className="btn-primary !py-2 !px-5 !text-sm shrink-0"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/8 mt-14 mb-8" />

        {/* Bottom */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/35 font-medium">
            © 2026 GigMatch · Privacy Policy · Terms
          </p>
          <p className="text-xs text-white/35 font-medium">
            Built for creators, by creators.
          </p>
        </div>
      </div>
    </footer>
  );
}
