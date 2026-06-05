import { Link } from 'react-router';
import { Leaf, Linkedin, Twitter, Instagram } from 'lucide-react';

export function Footer() {
  return (
    <footer style={{ backgroundColor: '#0F3424' }} className="border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#D97706' }}>
                <Leaf className="w-4 h-4 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-white font-semibold text-lg" style={{ fontFamily: 'Sora, sans-serif' }}>
                Vivo<span style={{ color: '#D97706' }}>Quest</span>
              </span>
            </div>
            <p className="text-white/50 text-sm max-w-xs leading-relaxed" style={{ fontFamily: 'Sora, sans-serif' }}>
              The future of AI-powered metabolic health. Transforming lives through personalized health intelligence and community-driven wellness.
            </p>
            <div className="flex items-center gap-3 mt-6">
              <a href="https://linkedin.com" target="_blank" rel="noreferrer"
                className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-white/40 transition-all">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer"
                className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-white/40 transition-all">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noreferrer"
                className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center text-white/60 hover:text-white hover:border-white/40 transition-all">
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white/90 font-semibold text-sm mb-4 tracking-wide uppercase" style={{ fontFamily: 'Sora, sans-serif' }}>
              Company
            </h4>
            <ul className="space-y-3">
              {['About Us', 'Careers', 'Press', 'Blog', 'Research'].map(item => (
                <li key={item}>
                  <a href="#" className="text-white/50 text-sm hover:text-white/80 transition-colors" style={{ fontFamily: 'Sora, sans-serif' }}>
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Legal */}
          <div>
            <h4 className="text-white/90 font-semibold text-sm mb-4 tracking-wide uppercase" style={{ fontFamily: 'Sora, sans-serif' }}>
              Legal
            </h4>
            <ul className="space-y-3">
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'HIPAA Compliance', 'Contact Us'].map(item => (
                <li key={item}>
                  <a href="#" className="text-white/50 text-sm hover:text-white/80 transition-colors" style={{ fontFamily: 'Sora, sans-serif' }}>
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/40 text-sm" style={{ fontFamily: 'Sora, sans-serif' }}>
            © 2026 VivoQuest, Inc. All rights reserved.
          </p>
          <p className="text-white/30 text-xs" style={{ fontFamily: 'Sora, sans-serif' }}>
            AI-Powered Metabolic Health Platform · Healthcare Technology
          </p>
        </div>
      </div>
    </footer>
  );
}
