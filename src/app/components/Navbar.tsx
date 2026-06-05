import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, X, Leaf } from 'lucide-react';

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setMobileOpen(false), [location.pathname]);

  const navLinks = [
    { label: 'Platform', href: '/#features' },
    { label: 'Webinars', href: '/webinar' },
    { label: 'About', href: '/#about' },
    { label: 'Partners', href: '/#partners' },
  ];

  const navBg = scrolled
    ? 'rgba(15, 52, 36, 0.97)'
    : 'rgba(15, 52, 36, 0.15)';
  const borderColor = scrolled ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.06)';

  return (
    <>
      <motion.header
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          backgroundColor: navBg,
          borderBottom: `1px solid ${borderColor}`,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          transition: 'background-color 0.4s ease, border-color 0.4s ease',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-[68px]">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
              <div
                className="w-8 h-8 rounded-[10px] flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                style={{ backgroundColor: '#D97706' }}
              >
                <Leaf className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-white tracking-tight" style={{ fontFamily: 'Sora, sans-serif', fontWeight: 600, fontSize: '1.1rem' }}>
                Vivo<span style={{ color: '#D97706' }}>Quest</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-7">
              {navLinks.map(link => (
                <Link
                  key={link.label}
                  to={link.href}
                  className="text-sm text-white/60 hover:text-white/95 transition-colors duration-200 tracking-wide"
                  style={{ fontFamily: 'Sora, sans-serif' }}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Desktop CTAs */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                to="/#register"
                className="text-sm font-semibold text-white px-5 py-2.5 rounded-full transition-all duration-200 hover:brightness-110 hover:shadow-lg"
                style={{ backgroundColor: '#D97706', fontFamily: 'Sora, sans-serif' }}
              >
                Early Access
              </Link>
            </div>

            {/* Mobile toggle */}
            <button
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-all"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="fixed top-[68px] left-0 right-0 z-40 border-b border-white/10 px-6 py-6 flex flex-col gap-4"
            style={{ backgroundColor: 'rgba(10, 38, 25, 0.98)', backdropFilter: 'blur(20px)' }}
          >
            {navLinks.map(link => (
              <Link
                key={link.label}
                to={link.href}
                className="text-sm text-white/75 hover:text-white transition-colors py-1.5"
                style={{ fontFamily: 'Sora, sans-serif' }}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-white/10 flex flex-col gap-3">
              <Link
                to="/webinar"
                className="text-center py-3 text-sm text-white/70 border border-white/20 rounded-full"
                style={{ fontFamily: 'Sora, sans-serif' }}
              >
                Reserve Webinar Seat
              </Link>
              <Link
                to="/#register"
                className="text-center py-3 text-sm font-semibold text-white rounded-full"
                style={{ backgroundColor: '#D97706', fontFamily: 'Sora, sans-serif' }}
              >
                Join Early Access
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
