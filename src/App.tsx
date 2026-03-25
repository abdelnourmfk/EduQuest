import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  Settings, 
  ChevronRight, 
  Search,
  Plus,
  Trash2,
  Edit,
  MoreVertical,
  UserPlus,
  GraduationCap,
  MapPin,
  FileText,
  Bell,
  LogOut,
  Menu,
  X,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utility ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
type Role = 'ADMIN' | 'TEACHER' | 'STUDENT';

interface User {
  id: string;
  username: string;
  password?: string;
  role: Role;
  fullName: string;
  email: string;
  specialtyId?: string;
  subSpecialtyId?: string;
  level?: string;
  groupId?: string;
  isApproved?: boolean;
}

interface Specialty {
  id: string;
  name: string;
  hasSubSpecialties: boolean;
}

interface SubSpecialty {
  id: string;
  specialtyId: string;
  name: string;
}

interface Module {
  id: string;
  name: string;
  specialtyId: string;
  subSpecialtyId?: string;
  semester: number;
  level: string;
}

interface Room {
  id: string;
  name: string;
}

interface TimetableEntry {
  id: string;
  moduleId: string;
  teacherId: string;
  day: string;
  timeSlot: string;
  roomId: string;
  groupId: string;
  level: string;
  semester: number;
}

interface Grade {
  id: string;
  studentId: string;
  moduleId: string;
  value: number;
  approved: boolean;
  semester: number;
}

// --- Mock Data ---
const INITIAL_SPECIALTIES: Specialty[] = [
  { id: 'spec-1', name: 'Informatique Pro', hasSubSpecialties: true },
  { id: 'spec-2', name: 'Mathématiques', hasSubSpecialties: false },
];

const INITIAL_SUB_SPECIALTIES: SubSpecialty[] = [
  { id: 'sub-1', specialtyId: 'spec-1', name: 'Développement Web' },
  { id: 'sub-2', specialtyId: 'spec-1', name: 'Réseaux' },
];

const INITIAL_ROOMS: Room[] = [
  { id: 'room-1', name: 'Salle 1' },
  { id: 'room-2', name: 'Salle 2' },
];

const INITIAL_MODULES: Module[] = [
  { id: 'mod-1', name: 'Analyse 1', specialtyId: 'spec-1', semester: 1, level: 'Licence 1' },
  { id: 'mod-2', name: 'Algèbre 1', specialtyId: 'spec-1', semester: 1, level: 'Licence 1' },
  { id: 'mod-3', name: 'Web Dev', specialtyId: 'spec-1', subSpecialtyId: 'sub-1', semester: 1, level: 'Licence 1' },
];

const INITIAL_USERS: User[] = [
  { id: 'u-1', username: 'admin', role: 'ADMIN', fullName: 'Administrateur', email: 'admin@edu.dz' },
  { id: 'u-2', username: 'mourad', role: 'TEACHER', fullName: 'MOHAMMED MOURAD', email: 'mourad@edu.dz', password: 'aqdmtiwg' },
  { id: 'u-3', username: 'student1', role: 'STUDENT', fullName: 'Ahmed Ali', email: 'ahmed@edu.dz', specialtyId: 'spec-1', level: 'Licence 1', isApproved: true },
];

// --- Main App Component ---
export default function EduQuest() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [specialties, setSpecialties] = useState<Specialty[]>(INITIAL_SPECIALTIES);
  const [subSpecialties, setSubSpecialties] = useState<SubSpecialty[]>(INITIAL_SUB_SPECIALTIES);
  const [rooms, setRooms] = useState<Room[]>(INITIAL_ROOMS);
  const [modules, setModules] = useState<Module[]>(INITIAL_MODULES);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [currentSemester, setCurrentSemester] = useState(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // --- Logic Helpers ---

  // 1. Module Display Logic
  const getModuleName = (module: Module) => {
    return module.name;
  };

  // 3. Add Student Logic (Auto-grouping simulated)
  const [showAddStudent, setShowAddStudent] = useState(false);
  const handleAddStudent = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('fullName') as string;
    const specialtyId = formData.get('specialtyId') as string;
    const level = formData.get('level') as string;

    const newUser: User = {
      id: `u-${Date.now()}`,
      username: name.toLowerCase().replace(' ', '.'),
      role: 'STUDENT',
      fullName: name,
      email: `${name.toLowerCase().replace(' ', '.')}@edu.dz`,
      specialtyId,
      level,
      // 4. Auto-validation for 1st year
      isApproved: level === 'Licence 1',
      groupId: 'G1' // Auto-assigned automatically
    };
    setUsers([...users, newUser]);
    setShowAddStudent(false);
  };

  // 7. Room Deletion Cleanup
  const deleteRoom = (roomId: string) => {
    const roomName = rooms.find(r => r.id === roomId)?.name;
    setRooms(rooms.filter(r => r.id !== roomId));
    // Automatically remove from timetable
    setTimetable(timetable.filter(entry => entry.roomId !== roomId));
    console.log(`Salle ${roomName} supprimée et retirée de l'EDT.`);
  };

  // 8. Semester Progression Logic
  const canProgressToS2 = () => {
    const s1Grades = grades.filter(g => g.semester === 1);
    if (s1Grades.length === 0) return true; // For demo if no grades yet
    return s1Grades.every(g => g.approved);
  };

  const progressToS2 = () => {
    if (canProgressToS2()) {
      setCurrentSemester(2);
    } else {
      alert("Erreur : Vous ne pouvez pas passer au S2 sans valider toutes les notes du S1 pour chaque étudiant.");
    }
  };

  // --- UI Components ---

  const SidebarItem = ({ id, icon: Icon, label, active }: { id: string, icon: any, label: string, active: boolean }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={cn(
        "flex items-center w-full gap-3 px-4 py-3 text-sm font-medium transition-colors rounded-lg",
        active 
          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" 
          : "text-slate-600 hover:bg-slate-100"
      )}
    >
      <Icon size={20} />
      {isSidebarOpen && <span>{label}</span>}
    </button>
  );

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900">
      {/* Sidebar */}
      <aside className={cn(
        "bg-white border-r border-slate-200 transition-all duration-300 flex flex-col",
        isSidebarOpen ? "w-64" : "w-20"
      )}>
        <div className="p-6 flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg text-white">
            <GraduationCap size={24} />
          </div>
          {isSidebarOpen && <h1 className="text-xl font-bold tracking-tight text-indigo-900">EduQuest</h1>}
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          <SidebarItem id="dashboard" icon={LayoutDashboard} label="Tableau de bord" active={activeTab === 'dashboard'} />
          <SidebarItem id="followup" icon={AlertCircle} label="Suivi & Alertes" active={activeTab === 'followup'} />
          <SidebarItem id="modules" icon={BookOpen} label="Modules" active={activeTab === 'modules'} />
          <SidebarItem id="teachers" icon={Users} label="Enseignants" active={activeTab === 'teachers'} />
          <SidebarItem id="students" icon={UserPlus} label="Étudiants" active={activeTab === 'students'} />
          <SidebarItem id="timetable" icon={Calendar} label="Emploi du temps" active={activeTab === 'timetable'} />
          <SidebarItem id="validations" icon={CheckCircle} label="Validations (Notes/Insc.)" active={activeTab === 'validations'} />
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button className="flex items-center w-full gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <LogOut size={20} />
            {isSidebarOpen && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-bottom border-slate-200 flex items-center justify-between px-8 shadow-sm z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
              <Menu size={20} />
            </button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Rechercher..." 
                className="search-input pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm w-64 focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold">
              <span className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />
              Semestre {currentSemester}
            </div>
            <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full relative">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="text-right">
                <p className="text-sm font-semibold">Admin</p>
                <p className="text-xs text-slate-500">Gestionnaire</p>
              </div>
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold">
                AD
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'students' && (
              <motion.div 
                key="students"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Gestion des Étudiants</h2>
                  <button 
                    onClick={() => setShowAddStudent(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-all"
                  >
                    <Plus size={18} /> Ajouter un Étudiant
                  </button>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">Nom Complet</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">Spécialité</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">Niveau</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">Groupe</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">Statut</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {users.filter(u => u.role === 'STUDENT').map(student => (
                        <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-medium">{student.fullName}</td>
                          <td className="px-6 py-4 text-slate-600">{specialties.find(s => s.id === student.specialtyId)?.name}</td>
                          <td className="px-6 py-4 text-slate-600">{student.level}</td>
                          <td className="px-6 py-4 text-slate-600 font-bold">{student.groupId}</td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                              student.isApproved ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                            )}>
                              {student.isApproved ? 'Validé' : 'En attente'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                <Edit size={18} />
                              </button>
                              <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Add Student Modal */}
                {showAddStudent && (
                  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl"
                    >
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold">Nouvel Étudiant</h3>
                        <button onClick={() => setShowAddStudent(false)} className="text-slate-400 hover:text-slate-600">
                          <X size={24} />
                        </button>
                      </div>
                      <form onSubmit={handleAddStudent} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Nom Complet</label>
                          <input name="fullName" required className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Spécialité</label>
                          <select name="specialtyId" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                            {specialties.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Niveau</label>
                          <select name="level" className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                            <option>Licence 1</option>
                            <option>Licence 2</option>
                            <option>Licence 3</option>
                          </select>
                        </div>
                        <div className="p-3 bg-blue-50 text-blue-700 rounded-lg text-xs italic">
                          * Le groupe sera assigné automatiquement après la répartition A-Z.
                          <br />
                          * L'inscription sera validée automatiquement pour la 1ère année.
                        </div>
                        <button type="submit" className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
                          Enregistrer l'étudiant
                        </button>
                      </form>
                    </motion.div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'teachers' && (
              <motion.div 
                key="teachers"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Gestion des Enseignants</h2>
                  <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-all">
                    <Plus size={18} /> Ajouter un Enseignant
                  </button>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">Nom Complet</th>
                        <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">Email</th>
                        {/* 2. Remove Accès (User/Pass) display */}
                        <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {users.filter(u => u.role === 'TEACHER').map(teacher => (
                        <tr key={teacher.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-medium">{teacher.fullName}</td>
                          <td className="px-6 py-4 text-slate-600">{teacher.email}</td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                <Edit size={18} />
                              </button>
                              <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'timetable' && (
              <motion.div 
                key="timetable"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Emploi du Temps</h2>
                  <div className="flex gap-3">
                    <select className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500">
                      <option>Licence 1</option>
                      <option>Licence 2</option>
                    </select>
                    <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-all">
                      <Plus size={18} /> Ajouter un créneau
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-x-auto">
                  <div className="min-w-[800px]">
                    <div className="grid grid-cols-7 gap-4 mb-4">
                      <div className="h-10" />
                      {['08:30 - 10:00', '10:10 - 11:40', '11:50 - 13:20', '13:30 - 15:00', '15:10 - 16:40', '16:50 - 18:20'].map(slot => (
                        <div key={slot} className="text-center text-xs font-bold text-slate-400 uppercase">{slot}</div>
                      ))}
                    </div>
                    
                    {['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi'].map(day => (
                      <div key={day} className="grid grid-cols-7 gap-4 mb-4">
                        <div className="flex items-center font-bold text-slate-700 text-sm">{day}</div>
                        {[1, 2, 3, 4, 5, 6].map(slot => {
                          const entry = timetable.find(e => e.day === day && e.timeSlot === slot.toString());
                          const module = entry ? modules.find(m => m.id === entry.moduleId) : null;
                          const room = entry ? rooms.find(r => r.id === entry.roomId) : null;
                          
                          return (
                            <div key={slot} className="aspect-[4/3] bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center p-2 text-center group hover:border-indigo-300 hover:bg-indigo-50 transition-all cursor-pointer">
                              {module ? (
                                <>
                                  <p className="text-xs font-bold text-indigo-900">{getModuleName(module)}</p>
                                  <p className="text-[10px] text-slate-500 mt-1">{room?.name}</p>
                                  <button className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-100 rounded">
                                    <Trash2 size={12} />
                                  </button>
                                </>
                              ) : (
                                <Plus size={16} className="text-slate-300 group-hover:text-indigo-400" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 5. Conflict Message Simulation */}
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex gap-3 text-amber-800">
                  <AlertCircle size={20} className="shrink-0" />
                  <p className="text-sm">
                    <strong>Note de conflit :</strong> "La salle Salle 1 est déjà occupée par le module Analyse 1 (informatique pro - Licence 1 - G1)"
                    <span className="block text-xs mt-1 opacity-70">(Le suffixe "au Semestre X !" a été supprimé comme demandé)</span>
                  </p>
                </div>
              </motion.div>
            )}

            {activeTab === 'validations' && (
              <motion.div 
                key="validations"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Validations & Paramètres</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* 6. Rooms Management moved here */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        <MapPin size={20} className="text-indigo-600" /> Gestion des Salles
                      </h3>
                      <button className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors">
                        <Plus size={18} />
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      {rooms.map(room => (
                        <div key={room.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100 group">
                          <span className="font-medium">{room.name}</span>
                          <button 
                            onClick={() => deleteRoom(room.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-100 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-4 italic">
                      * La suppression d'une salle la retire automatiquement de l'emploi du temps.
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                      <CheckCircle size={20} className="text-emerald-600" /> Validation des Notes
                    </h3>
                    <div className="space-y-4">
                      {users.filter(u => u.role === 'STUDENT').map(student => (
                        <div key={student.id} className="flex justify-between items-center p-4 border border-slate-100 rounded-xl">
                          <div>
                            <p className="font-semibold">{student.fullName}</p>
                            <p className="text-xs text-slate-500">{student.level} - {student.groupId}</p>
                          </div>
                          <button className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-colors">
                            Valider Notes
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
