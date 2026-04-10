
import React, { useState, useEffect } from 'react';
import { User, UserRole } from './types';
import { loadDBFromSupabase, INITIAL_DB, DB, clearLocalData } from './src/store/db';
import { supabaseService } from './src/services/supabaseService';
import { useDB } from './src/store/DBContext';
import Layout from './components/Layout';
import { AdminDashboard, UniversityManager, SpecialtyManager, UserManager } from './components/AdminViews';
import { AgentDashboard, ModuleManager, TeacherAssignment, TimetableManager, ValidationManager, MonitoringView, StudentManager, RoomManager } from './components/AgentViews';
import { TeacherPlanning, TeacherGrades, TeacherResources } from './components/TeacherViews';
import { StudentDashboard, StudentGrades, StudentTimetable, StudentResources, StudentNotifications } from './components/StudentViews';
import { LogIn, ShieldAlert, Bell, School } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

const App: React.FC = () => {
  const { db, setDb, loading, error: dbError, refresh, forceSkipLoading } = useDB();
  const [user, setUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [viewParams, setViewParams] = useState<any>(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [globalToast, setGlobalToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; visible: boolean }>({ message: '', type: 'info', visible: false });
  const [liteMode, setLiteMode] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [confirmPrompt, setConfirmPrompt] = useState<null | { message: string; onConfirm: () => void }>(null);

  const requestConfirm = (message: string, onConfirm: () => void) => {
    setConfirmPrompt({ message, onConfirm });
  };

  const closeConfirm = () => setConfirmPrompt(null);

  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const { error } = await loadDBFromSupabase().then(() => ({ error: null })).catch(err => ({ error: err }));
        if (error) setConnectionStatus('error');
        else setConnectionStatus('connected');
      } catch {
        setConnectionStatus('error');
      }
    };
    checkConnection();
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (event: MediaQueryListEvent) => setIsReducedMotion(event.matches);
    setIsReducedMotion(mediaQuery.matches);
    mediaQuery.addEventListener('change', onChange);
    return () => mediaQuery.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('lite-mode', liteMode);
  }, [liteMode]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setGlobalToast({ message, type, visible: true });
    setTimeout(() => setGlobalToast(prev => ({ ...prev, visible: false })), 3000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      // Query Supabase directly for the user
      const users = await supabaseService.getUsers();
      const foundUser = users.find(u => u.username === loginForm.username && u.password === loginForm.password);
      
      if (foundUser) {
        setUser(foundUser);
        setActiveView('dashboard');
        setError('');
      } else {
        setError('Identifiants incorrects');
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError("Erreur lors de la connexion au serveur");
    }
  };

  const handleLogout = () => {
    requestConfirm('Voulez-vous vraiment vous déconnecter ?', () => {
      setUser(null);
      setLoginForm({ username: '', password: '' });
      setActiveView('dashboard');
      setShowNotifications(false);
      showToast('Déconnexion réussie.', 'success');
      closeConfirm();
    });
  };

  const renderContent = () => {
    if (!user) return null;
    switch (user.role) {
      case UserRole.ADMIN:
        if (activeView === 'dashboard') return <AdminDashboard />;
        if (activeView === 'universities') return <UniversityManager />;
        if (activeView === 'specialties') return <SpecialtyManager />;
        if (activeView === 'users') return <UserManager currentUser={user} onImpersonate={(targetUser) => {
          setUser(targetUser);
          setActiveView('dashboard');
          showToast(`Connecté comme ${targetUser.fullName || targetUser.username}`, 'success');
        }} />;
        break;

      case UserRole.AGENT:
        const specialty = db.specialties.find(s => s.agentId === user.id);
        if (!specialty) return <div className="text-center py-20 text-slate-400">Aucune spécialité assignée.</div>;
        if (activeView === 'dashboard') return <AgentDashboard agentId={user.id} setActiveView={setActiveView} setViewParams={setViewParams} />;
        if (activeView === 'monitoring') return <MonitoringView specialtyId={specialty.id} />;
        if (activeView === 'modules') return <ModuleManager specialtyId={specialty.id} />;
        if (activeView === 'teachers') return <TeacherAssignment specialtyId={specialty.id} />;
        if (activeView === 'students') return <StudentManager specialtyId={specialty.id} />;
        if (activeView === 'users') return <UserManager currentUser={user} />;
        if (activeView === 'timetable') return <TimetableManager specialtyId={specialty.id} />;
        if (activeView === 'rooms') return <RoomManager specialtyId={specialty.id} />;
        if (activeView === 'validation') return <ValidationManager specialtyId={specialty.id} viewParams={viewParams} setViewParams={setViewParams} />;
        break;

      case UserRole.TEACHER:
        if (activeView === 'dashboard') return <TeacherPlanning teacherId={user.id} />;
        if (activeView === 'grades') return <TeacherGrades teacherId={user.id} />;
        if (activeView === 'resources') return <TeacherResources teacherId={user.id} />;
        break;

      case UserRole.STUDENT:
        if (activeView === 'dashboard') return <StudentDashboard studentId={user.id} />;
        if (activeView === 'notifications') return <StudentNotifications studentId={user.id} />;
        if (activeView === 'results') return <StudentGrades studentId={user.id} />;
        if (activeView === 'timetable') return <StudentTimetable studentId={user.id} />;
        if (activeView === 'resources') return <StudentResources studentId={user.id} />;
        return <div className="p-10 text-center text-slate-400 italic">Page bientôt disponible.</div>;

      default:
        break;
    }
    // Fallback for unmatched cases
    return <div className="min-h-screen flex items-center justify-center text-slate-400 text-xl font-bold">Aucune interface disponible pour ce rôle ou cette vue.</div>;
  };

  const myNotifications = db.notifications.filter(n => n.userId === user?.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const unreadCount = myNotifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    if (!user) return;
    const updated = {
      ...db,
      notifications: db.notifications.map(n => n.userId === user.id ? { ...n, read: true } : n)
    };
    setDb(updated);
    setShowNotifications(false);
  };

  const handleNotificationClick = (n: any) => {
    if (!user) return;
    
    // Mark as read
    const updated = {
      ...db,
      notifications: db.notifications.map(notif => notif.id === n.id ? { ...notif, read: true } : notif)
    };
    setDb(updated);

    const msg = n.message.toLowerCase();
    if (user.role === UserRole.STUDENT) {
        if (msg.includes('emploi du temps') || msg.includes('cours ajouté')) {
            setActiveView('timetable');
        } else if (msg.includes('note') || msg.includes('moyenne') || msg.includes('contestation') || msg.includes('répondu')) {
            setActiveView('results');
        } else if (msg.includes('inscription')) {
            setActiveView('dashboard');
        }
    } else if (user.role === UserRole.AGENT) {
        if (msg.includes('inscription')) {
            setActiveView('validation');
            setViewParams({ tab: 'registration' });
        } else if (msg.includes('note') || msg.includes('contestation')) {
            setActiveView('validation');
            setViewParams({ tab: 'grades' });
        }
    } else if (user.role === UserRole.TEACHER) {
        if (msg.includes('contestation')) {
            setActiveView('grades');
        }
    }
    setShowNotifications(false);
  };

  const screen: 'loading' | 'login' | 'app' = loading ? 'loading' : !user ? 'login' : 'app';

  return (
    <div className={`relative app-shell ${liteMode ? 'lite-mode' : 'content-clear'}`}>
      <div data-bg-noise="1" aria-hidden="true" />
      <div className="bg-vignette" aria-hidden="true" />

      <AnimatePresence mode="wait">
        {screen === 'loading' && (
          <motion.div
            key="loading"
            initial={{ opacity: 0, y: 10, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.995 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="min-h-screen flex flex-col items-center justify-center p-4"
          >
            <div className="text-center mb-10">
              <h1 className="text-5xl font-extrabold text-amber-950 tracking-tighter mb-2 animate-pulse">EduQuest</h1>
              <p className="text-amber-800 text-sm uppercase tracking-[0.3em] font-semibold">Chargement des donnees...</p>
              {dbError && (
                <div className="mt-4 p-4 glass-pane rounded-xl text-rose-700 text-sm max-w-xs mx-auto">
                  {dbError}. <button onClick={() => refresh()} className="underline font-bold">Réessayer</button>
                </div>
              )}
              <div className="mt-6 flex flex-col gap-2">
                <button
                  onClick={forceSkipLoading}
                  className="text-amber-900/70 text-xs hover:text-amber-900 transition-colors underline"
                  title="Utiliser les données locales si la connexion échoue"
                >
                  Continuer avec les données locales
                </button>
                <button
                  onClick={() => {
                    requestConfirm('Voulez-vous vraiment effacer le cache local et resynchroniser ?', () => {
                      clearLocalData();
                      showToast('Cache local effacé. Réinitialisation effectuée.', 'info');
                      closeConfirm();
                    });
                  }}
                  className="text-rose-700/60 text-[10px] hover:text-rose-700 transition-colors underline uppercase font-bold tracking-wider"
                >
                  Forcer la réinitialisation du cache
                </button>
              </div>
            </div>
            {!dbError && (
              <div className="w-64 h-2 bg-amber-900/20 rounded-full overflow-hidden">
                <div className="h-full bg-amber-700 animate-progress" />
              </div>
            )}
          </motion.div>
        )}

        {screen === 'login' && (
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 10, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.995 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="min-h-screen flex items-center justify-center p-4"
          >
            <div className="max-w-md w-full">
              <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center gap-3 mx-auto mb-2">
                  <span className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-[0_16px_28px_rgba(251,191,36,0.35)] border border-amber-200 flex items-center justify-center text-xl">
                    <School className="w-8 h-8" />
                  </span>
                  <h1 className="text-6xl font-extrabold text-amber-950 tracking-tight leading-none">EduQuest</h1>
                </div>
                <p className="text-amber-700 text-sm uppercase tracking-[0.35em] font-bold">SYSTÈME DE GESTION PÉDAGOGIQUE</p>
              </div>
              <div className="glass-pane rounded-3xl shadow-2xl p-8 overflow-hidden relative">
                <form onSubmit={handleLogin} className="relative z-10 space-y-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-amber-950">Connexion</h2>
                  </div>
                  {error && (
                    <div className="bg-rose-50/80 border border-rose-100 text-rose-700 p-4 rounded-xl flex items-center gap-3 text-sm font-medium animate-shake">
                      <ShieldAlert className="w-5 h-5" /> {error}
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-bold text-amber-900/60 uppercase mb-2">Utilisateur</label>
                    <input
                      type="text"
                      required
                      className="w-full px-5 py-4 bg-white border border-amber-200 rounded-2xl outline-none text-amber-900 placeholder:text-slate-400 focus:ring-4 focus:ring-amber-400/40 focus:border-amber-600 transition-all font-medium"
                      placeholder="Ex: mourad"
                      value={loginForm.username}
                      onChange={e => setLoginForm({ ...loginForm, username: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-amber-900/60 uppercase mb-2">Mot de passe</label>
                    <input
                      type="password"
                      required
                      className="w-full px-5 py-4 bg-white border border-amber-200 rounded-2xl outline-none text-amber-900 placeholder:text-slate-400 focus:ring-4 focus:ring-amber-400/40 focus:border-amber-600 transition-all font-medium"
                      placeholder="••••••••"
                      value={loginForm.password}
                      onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-amber-900 hover:bg-amber-950 text-white font-bold py-5 rounded-2xl shadow-lg shadow-amber-900/25 transition-all flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-5 h-5" /> Se connecter
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        )}

        {screen === 'app' && user && (
          <motion.div
            key={`app-${user.id}`}
            initial={{ opacity: 0, y: 12, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.995 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative"
          >
            <Layout
              user={user}
              onLogout={handleLogout}
              activeView={activeView}
              setActiveView={setActiveView}
              liteMode={liteMode}
              reduceMotion={liteMode || isReducedMotion}
              headerRight={
                <div className="relative no-print z-[60] flex items-center gap-2">
                  <button
                    onClick={() => setLiteMode((prev) => !prev)}
                    className="px-3 py-1 rounded-lg border border-amber-800 text-amber-900 text-xs font-semibold hover:bg-amber-100 transition"
                  >
                    {liteMode ? 'Mode Léger ✅' : 'Mode Léger ⚡'}
                  </button>
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className={`p-2 transition-colors relative rounded-full hover:bg-white/60 ${unreadCount > 0 ? 'text-amber-900' : 'text-amber-900/45'}`}
                  >
                    <Bell className="w-6 h-6" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-5 h-5 bg-rose-600 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white font-bold">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                  <AnimatePresence>
                    {showNotifications && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.98 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="absolute top-full right-0 mt-2 w-80 glass-pane rounded-2xl shadow-2xl overflow-hidden z-[70]"
                      >
                        <div className="p-4 border-b border-amber-900/10 bg-white/30 flex justify-between items-center">
                          <h4 className="font-bold text-amber-950">Notifications</h4>
                          <button onClick={markAllAsRead} className="text-xs text-amber-900 font-bold hover:underline">
                            Marquer lu
                          </button>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                          {myNotifications.map(n => (
                            <div
                              key={n.id}
                              onClick={() => handleNotificationClick(n)}
                              className={`p-4 border-b border-amber-900/10 last:border-0 hover:bg-white/50 transition-colors cursor-pointer ${n.read ? 'opacity-60' : 'bg-amber-50/45'}`}
                            >
                              <p className="text-xs text-amber-950 font-medium">{n.message}</p>
                              <span className="text-[10px] text-amber-900/60 mt-1 block">
                                {new Date(n.date).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              }
            >

              <AnimatePresence mode="wait">
                <motion.div
                  key={`${user.role}-${activeView}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.24, ease: 'easeOut' }}
                >
                  {renderContent()}
                </motion.div>
              </AnimatePresence>
            </Layout>

            {confirmPrompt && (
              <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-description">
                <div className="bg-white rounded-2xl p-5 w-full max-w-md shadow-2xl border border-slate-200">
                  <h3 id="confirm-title" className="text-lg font-bold text-slate-800 mb-2">Confirmation requise</h3>
                  <p id="confirm-description" className="text-sm text-slate-600 mb-4">{confirmPrompt.message}</p>
                  <div className="flex justify-end gap-2">
                    <button onClick={closeConfirm} className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition">Annuler</button>
                    <button onClick={confirmPrompt.onConfirm} className="px-4 py-2 rounded-lg confirm-btn transition">Confirmer</button>
                  </div>
                </div>
              </div>
            )}

            <AnimatePresence>
              {globalToast.visible && (
                <motion.div
                  initial={{ opacity: 0, y: 18, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 14, scale: 0.98 }}
                  transition={{ duration: 0.22 }}
                  className={`toast toast-${globalToast.type}`}
                >
                  {globalToast.message}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
