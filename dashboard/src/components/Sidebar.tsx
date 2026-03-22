import { useState, useEffect } from 'react';
import { Sun, Moon, Brain, Globe, Bookmark, BarChart2, Menu, X } from 'lucide-react';

interface SidebarProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

const navItems = [
  { tab: 'dashboard', icon: BarChart2, label: 'Performance' },
  { tab: 'chat',      icon: Brain,    label: 'Thinking' },
  { tab: 'reddit',    icon: Globe,    label: 'Discovery' },
  { tab: 'ideas',     icon: Bookmark, label: 'Saved' },
];

const Sidebar = ({ activeTab = 'dashboard', setActiveTab }: SidebarProps) => {
  const [isLightMode, setIsLightMode] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      setIsLightMode(true);
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, []);

  const toggleTheme = () => {
    if (isLightMode) {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'dark');
      setIsLightMode(false);
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
      setIsLightMode(true);
    }
  };

  const handleNav = (tab: string) => {
    setActiveTab?.(tab);
    setMobileOpen(false);
  };

  return (
    <>
      {/* ── Mobile hamburger button (visible only on small screens) ── */}
      <button
        className="hamburger-btn"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation"
      >
        <Menu size={22} />
      </button>

      {/* ── Backdrop ── */}
      {mobileOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar (desktop always visible, mobile slide-in) ── */}
      <aside className={`sidebar${mobileOpen ? ' sidebar--open' : ''}`}>
        <div className="sidebar-logo" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Idea OS</span>
          {/* Close button inside sidebar on mobile */}
          <button
            className="sidebar-close-btn"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="nav-menu">
          {navItems.map(({ tab, icon: Icon, label }) => (
            <a
              key={tab}
              href="#"
              className={`nav-item ${activeTab === tab ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); handleNav(tab); }}
            >
              <Icon size={18} /> {label}
            </a>
          ))}
        </nav>

        <div className="spacer" />

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
          <button
            onClick={toggleTheme}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '20px', background: 'var(--border-color)', color: 'var(--text-primary)', transition: 'all 0.2s' }}
          >
            {isLightMode ? <Moon size={16} /> : <Sun size={16} />}
            <span style={{ fontSize: '12px', fontWeight: 600 }}>{isLightMode ? 'Dark Mode' : 'Light Mode'}</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
