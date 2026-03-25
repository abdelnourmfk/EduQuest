
import React from 'react';
import { User, UserRole } from '../types';
import { useDB } from '../src/store/DBContext';
import { 
  LayoutDashboard, Building2, School, Users, BookOpen, 
  Calendar, FileSpreadsheet, LogOut, Bell, FolderOpen, 
  Settings, Award, Activity, DoorOpen, RefreshCw
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface LayoutProps {
  user: User;
  onLogout: () => void;
  children: React.ReactNode;
  activeView: string;
  setActiveView: (view: string) => void;
  headerRight?: React.ReactNode;
  liteMode?: boolean;
  reduceMotion?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ user, onLogout, children, activeView, setActiveView, headerRight, liteMode = false, reduceMotion = false }) => {
  const { refresh, loading } = useDB();
  const menuItems = {
    [UserRole.ADMIN]: [
      { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
      { id: 'universities', label: 'Universités', icon: Building2 },
      { id: 'specialties', label: 'Spécialités', icon: School },
      { id: 'users', label: 'Utilisateurs', icon: Users },
    ],
    [UserRole.AGENT]: [
      { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
      { id: 'monitoring', label: 'Suivi & Alertes', icon: Activity },
      { id: 'modules', label: 'Modules', icon: BookOpen },
      { id: 'teachers', label: 'Enseignants', icon: Users },
      { id: 'students', label: 'Étudiants', icon: Users },
      { id: 'users', label: 'Utilisateurs', icon: Users },
      { id: 'timetable', label: 'Emploi du temps', icon: Calendar },
      { id: 'validation', label: 'Validations (Notes/Insc.)', icon: Award },
    ],
    [UserRole.TEACHER]: [
      { id: 'dashboard', label: 'Mon Planning', icon: Calendar },
      { id: 'grades', label: 'Saisie Notes', icon: FileSpreadsheet },
      { id: 'resources', label: 'Ressources', icon: FolderOpen },
    ],
    [UserRole.STUDENT]: [
      { id: 'dashboard', label: 'Mon Espace', icon: LayoutDashboard },
      { id: 'timetable', label: 'Emploi du temps', icon: Calendar },
      { id: 'resources', label: 'Cours & TD', icon: FolderOpen },
      { id: 'results', label: 'Mes Notes', icon: FileSpreadsheet },
      { id: 'notifications', label: 'Notifications', icon: Bell },
    ]
  };

  const currentMenu = menuItems[user.role] || [];

  const sidebarClass = liteMode
    ? 'w-64 text-[var(--ink-strong)] fixed h-full no-print flex flex-col m-3 mb-3 rounded-3xl bg-white border border-slate-200 shadow-none'
    : 'w-64 glass-pane text-[var(--ink-strong)] fixed h-full no-print flex flex-col m-3 mb-3 rounded-3xl';

  const mainClass = liteMode
    ? 'flex-1 ml-[17.5rem] p-8 bg-gray-100'
    : 'flex-1 ml-[17.5rem] p-8';

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className={sidebarClass}>
        <div className="p-6 shrink-0">
          <h1 className="text-2xl font-bold tracking-tight text-amber-950 flex items-center gap-2">
            <School className="w-8 h-8 text-amber-700" />
            EduQuest
          </h1>
          <p className="text-amber-700/75 text-xs mt-1 uppercase tracking-widest font-semibold">Gestion Pedagogique</p>
        </div>
        
        <nav className="mt-6 px-4 space-y-1 flex-1 overflow-y-auto pb-4">
          {currentMenu.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`sidenav-btn w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeView === item.id 
                  ? 'bg-amber-900 text-white shadow-lg shadow-amber-900/20' 
                  : 'text-amber-900 hover:bg-white/55'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-amber-900/10 shrink-0">
          <div className="flex items-center gap-3 px-2 py-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-amber-900 text-amber-50 flex items-center justify-center text-lg font-bold">
              {user.fullName.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="font-semibold text-sm truncate text-amber-950">{user.fullName}</p>
              <p className="text-xs text-amber-700/75 capitalize">{user.role.toLowerCase()}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-rose-700 hover:bg-rose-100/80 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={mainClass}>
        <header className={`mb-8 flex justify-between items-center no-print rounded-3xl px-6 py-5 ${liteMode ? 'bg-white border border-slate-200' : 'glass-pane'}`}>
          <div>
            <h2 className="text-3xl font-bold text-amber-950">
              {currentMenu.find(m => m.id === activeView)?.label || 'Bienvenue'}
            </h2>
            <p className="text-amber-800/70 mt-1">Gerez vos activites academiques en toute simplicite.</p>
          </div>
          <div className="flex items-center gap-4">
            {headerRight}
            <div className="flex flex-col items-end">
              <span className="text-sm font-semibold text-amber-900">Aujourd'hui</span>
              <span className="text-xs text-amber-800/70">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>
        </header>

        {reduceMotion ? (
          <div className={`rounded-3xl p-6 min-h-[calc(100vh-200px)] ${liteMode ? 'bg-white border border-slate-200' : 'glass-pane'}`}>
            {children}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 16, scale: 0.992 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.995 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className={`rounded-3xl p-6 min-h-[calc(100vh-200px)] page-transition ${liteMode ? 'bg-white border border-slate-200' : 'glass-pane'}`}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        )}
      </main>
    </div>
  );
};

export default Layout;
