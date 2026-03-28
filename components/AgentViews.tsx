// Ajout du state pour gérer le module à éditer et l'ouverture du modal
// (déplacé dans le composant AgentDashboard)

import React, { useState, useEffect } from 'react';
import { generatePassword, createNotification } from '../src/store/db';
import { useDB } from '../src/store/DBContext';
import { Specialty, User, UserRole, Module, Assignment, SessionType, TimetableEntry, Grade, SystemType, SubSpecialty, ModuleGradeRecord, Room, RoomType } from '../types';
import { supabaseService } from '../src/services/supabaseService';
import { Plus, Trash2, Printer, Users, BookOpen, Calendar, ShieldCheck, AlertCircle, Search, UserCheck, LayoutGrid, CheckCircle2, ChevronRight, ChevronDown, Filter, Settings2, Minus, Info, DoorOpen, Pencil } from 'lucide-react';

const DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi'];
const SLOTS = ['08:30 - 10:00', '10:10 - 11:40', '11:50 - 13:20', '13:30 - 15:00', '15:10 - 16:40'];

const getLevelsForSystem = (spec: Specialty): string[] => {
  switch (spec.system) {
    case SystemType.LMD:
      const lmdBase = ['Licence 1', 'Licence 2', 'Licence 3', 'Master 1', 'Master 2', 'Doctorat 1', 'Doctorat 2', 'Doctorat 3'];
      return lmdBase;
    case SystemType.ENGINEER:
      return ['Ingénieur 1', 'Ingénieur 2', 'Ingénieur 3', 'Ingénieur 4', 'Ingénieur 5'];
    case SystemType.LMD_ENGINEER:
      const currentSub = spec.activeSubsystem || 'LMD';
      if (currentSub === 'ENGINEER') {
        return ['Ingénieur 1', 'Ingénieur 2', 'Ingénieur 3', 'Ingénieur 4', 'Ingénieur 5'];
      }
      return ['Licence 1', 'Licence 2', 'Licence 3', 'Master 1', 'Master 2', 'Doctorat 1', 'Doctorat 2', 'Doctorat 3'];
    case SystemType.CLASSIC:
      const classicYears = spec.classicYears || 3;
      const levels = [];
      for (let i = 1; i <= classicYears; i++) levels.push(`${spec.name} ${i}`);
      levels.push('Doctorat 1', 'Doctorat 2', 'Doctorat 3');
      return levels;
    default:
      return [];
  }
};

export const AgentDashboard = ({ agentId, setActiveView, setViewParams }: { agentId: string, setActiveView: (v: string) => void, setViewParams: (p: any) => void }) => {
    // State pour le modal d'édition
    const [editModule, setEditModule] = useState(null);
    const [editModalOpen, setEditModalOpen] = useState(false);
  const { db, setDb } = useDB();
  const [tempInputs, setTempInputs] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const specialty = db.specialties.find(s => s.agentId === agentId);
  if (!specialty) return null;

  const subSpecialties = db.subSpecialties.filter(s => s.specialtyId === specialty.id);
  const modules = db.modules.filter(m => m.specialtyId === specialty.id);
  const teachers = db.users.filter(u => u.role === UserRole.TEACHER && u.specialtyId === specialty.id);
  const students = db.users.filter(u => u.role === UserRole.STUDENT && u.specialtyId === specialty.id);

  const addSubSpecialty = async (lvl: string, val: string) => {
    setError('');
    const newSub: SubSpecialty = {
      id: Date.now().toString(),
      specialtyId: specialty.id,
      level: lvl,
      name: val
    };
    try {
      await supabaseService.saveSubSpecialty(newSub);
      setDb(prev => ({ ...prev, subSpecialties: [...prev.subSpecialties, newSub] }));
      setSuccess("Parcours ajouté avec succès !");
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'ajout du parcours");
    }
  };

  const removeSubSpecialty = async (id: string) => {
    setError('');
    try {
      await supabaseService.deleteSubSpecialty(id);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la suppression");
    }
  };

  const updateConfig = async (newConfig: any) => {
    setError('');
    const updatedSpecialty = { ...specialty, ...newConfig };
    try {
      await supabaseService.saveSpecialty(updatedSpecialty);
      setDb(prev => ({ ...prev, specialties: prev.specialties.map(s => s.id === updatedSpecialty.id ? updatedSpecialty : s) }));
      setSuccess("Configuration mise à jour avec succès !");
    } catch (err: any) {
      setError(err.message || "Erreur lors de la mise à jour de la configuration");
    }
  };

  const levels = getLevelsForSystem(specialty);

  const pendingRegistrations = students.filter(s => !s.isApprovedForYear).length;

  return (
    <div className="space-y-6 agent-dashboard">
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center gap-3 text-sm font-medium animate-shake">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 border border-green-100 text-green-600 rounded-2xl flex items-center gap-3 text-sm font-medium animate-in fade-in slide-in-from-top-4 duration-500">
          <CheckCircle2 className="w-5 h-5" />
          {success}
        </div>
      )}
      {pendingRegistrations > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h4 className="font-bold text-amber-800">{pendingRegistrations} Inscriptions en attente</h4>
              <p className="text-sm text-amber-700">Certains étudiants attendent la validation de leur inscription administrative.</p>
            </div>
          </div>
          <button 
            onClick={() => {
              setActiveView('validation');
              setViewParams({ tab: 'registration' });
            }}
            className="px-4 py-2 bg-amber-600 text-white rounded-xl font-bold text-sm hover:bg-amber-700 transition-all"
          >
            Gérer les inscriptions
          </button>
        </div>
      )}

      <div className="bg-indigo-900 rounded-2xl p-8 text-white flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{specialty.name}</h2>
          <p className="text-indigo-200">Système: {specialty.system} • Responsable: {db.users.find(u => u.id === agentId)?.fullName}</p>
        </div>
        <div className="flex gap-4">
          <div className="text-center px-6 border-r border-indigo-700">
            <p className="text-3xl font-bold">{modules.length}</p>
            <p className="text-xs uppercase text-indigo-300">Modules</p>
          </div>
          <div className="text-center px-6 border-r border-indigo-700">
            <p className="text-3xl font-bold">{teachers.length}</p>
            <p className="text-xs uppercase text-indigo-300">Enseignants</p>
          </div>
          <div className="text-center px-6">
            <p className="text-3xl font-bold">{students.length}</p>
            <p className="text-xs uppercase text-indigo-300">Étudiants</p>
          </div>
        </div>
      </div>
      
      <div className="space-y-6">
        {/* Section 1: Configuration du Système */}
        <div className="bg-white border rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-indigo-500" />
            Configuration du Parcours
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {specialty.system === SystemType.LMD && (
              <div className="p-4 bg-slate-50 rounded-xl border">
                <p className="text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Doctorat (Années supplémentaires)</p>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => updateConfig({ doctoratYears: Math.max(3, (specialty.doctoratYears || 3) - 1) })}
                    className="p-2 bg-white border rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-lg font-bold w-12 text-center">{specialty.doctoratYears || 3} ans</span>
                  <button 
                    onClick={() => updateConfig({ doctoratYears: Math.min(10, (specialty.doctoratYears || 3) + 1) })}
                    className="p-2 bg-white border rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {specialty.system === SystemType.CLASSIC && (
              <div className="p-4 bg-slate-50 rounded-xl border">
                <p className="text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Nombre d'années du cursus</p>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => updateConfig({ classicYears: Math.max(1, (specialty.classicYears || 3) - 1) })}
                    className="p-2 bg-white border rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-lg font-bold w-12 text-center">{specialty.classicYears || 3} ans</span>
                  <button 
                    onClick={() => updateConfig({ classicYears: Math.min(10, (specialty.classicYears || 3) + 1) })}
                    className="p-2 bg-white border rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {specialty.system === SystemType.LMD_ENGINEER && (
              <div className="p-4 bg-slate-50 rounded-xl border">
                <p className="text-sm font-bold text-slate-700 mb-3 uppercase tracking-wide">Section Active (Vue Agent)</p>
                <div className="flex p-1 bg-white border rounded-xl">
                  <button 
                    onClick={() => updateConfig({ activeSubsystem: 'LMD' })}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${specialty.activeSubsystem !== 'ENGINEER' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                  >
                    Parcours LMD
                  </button>
                  <button 
                    onClick={() => updateConfig({ activeSubsystem: 'ENGINEER' })}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${specialty.activeSubsystem === 'ENGINEER' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                  >
                    Parcours Ingénieur
                  </button>
                </div>
              </div>
            )}

            <div className="p-4 bg-indigo-50/30 rounded-xl border border-indigo-100">
              <p className="text-xs font-bold text-indigo-400 uppercase mb-3 tracking-widest">Aperçu des Niveaux Générés</p>
              <div className="flex flex-wrap gap-2">
                {levels.map(lvl => (
                  <span key={lvl} className="px-3 py-1.5 bg-white text-indigo-700 rounded-lg text-[10px] font-bold border border-indigo-100 shadow-sm">
                    {lvl}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Configuration des Parcours & Spécialités */}
        <div className="bg-white border rounded-2xl p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h4 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <LayoutGrid className="w-6 h-6 text-indigo-600" />
                Configuration des Parcours & Spécialités
              </h4>
              <p className="text-sm text-slate-500 mt-1">
                Définissez les spécialités pour chaque niveau (ex: Master 1 {'->'} Cyber Sécurité).
              </p>
            </div>
            <div className="hidden md:block">
              <kbd className="px-3 py-1.5 bg-slate-100 border rounded-lg text-xs font-mono text-slate-500">Entrée pour ajouter</kbd>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {levels.map(lvl => (
              <div key={lvl} className="p-6 bg-slate-50/50 border border-slate-200 rounded-3xl shadow-sm hover:border-indigo-300 transition-all group">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200/50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white border rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                      <BookOpen className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-slate-800">{lvl}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Configuration du cycle</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-indigo-600 text-[11px] font-bold uppercase tracking-wider">
                      {subSpecialties.filter(s => s.level === lvl).length} Spécialités actives
                    </span>
                  </div>
                </div>
                
                <div className="relative mb-6">
                  <input 
                    className="w-full pl-6 pr-36 py-5 text-base border-2 border-slate-200 rounded-2xl outline-none focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-500 bg-white transition-all placeholder:text-slate-400 font-medium shadow-sm" 
                    placeholder={`Ajouter une spécialité pour ${lvl}...`}
                    value={tempInputs[lvl] || ''}
                    onChange={(e) => setTempInputs(prev => ({ ...prev, [lvl]: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = tempInputs[lvl]?.trim();
                        if (val) {
                          addSubSpecialty(lvl, val);
                          setTempInputs(prev => ({ ...prev, [lvl]: '' }));
                        } else {
                          setError("Veuillez saisir le nom de la spécialité.");
                        }
                      }
                    }}
                  />
                  <button 
                    onClick={() => {
                      const val = tempInputs[lvl]?.trim();
                      if (val) {
                        addSubSpecialty(lvl, val);
                        setTempInputs(prev => ({ ...prev, [lvl]: '' }));
                      } else {
                        setError("Veuillez saisir le nom de la spécialité.");
                      }
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 px-5 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Ajouter
                  </button>
                </div>

                <div className="flex flex-wrap gap-3 min-h-[48px]">
                  {subSpecialties.filter(s => s.level === lvl).map(s => (
                    <span key={s.id} className="px-5 py-2.5 bg-white text-indigo-700 rounded-2xl text-sm font-bold border border-indigo-100 flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-300 shadow-sm hover:shadow-md transition-shadow">
                      {s.name}
                      <button 
                        onClick={() => removeSubSpecialty(s.id)}
                        className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-rose-100 hover:text-rose-600 text-indigo-300 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </span>
                  ))}
                  {subSpecialties.filter(s => s.level === lvl).length === 0 && (
                    <div className="flex items-center gap-3 text-slate-400 py-3 px-4 bg-white/50 rounded-2xl border border-dashed">
                      <AlertCircle className="w-5 h-5 opacity-50" />
                      <span className="text-sm italic">Aucune spécialité configurée (Tronc commun par défaut)</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Emploi du temps (Short) */}
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center border border-amber-100">
                <Calendar className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Emploi du temps</h3>
                <p className="text-slate-500 text-[11px]">Organisez les cours par niveau et semestre.</p>
              </div>
            </div>
            <button 
              onClick={() => setActiveView('timetable')}
              className="px-4 py-2 bg-amber-600 text-white rounded-xl font-bold text-xs hover:bg-amber-700 transition-all"
            >
              Ouvrir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const LevelFilterBar = ({ specialty, activeLevel, onLevelChange }: { specialty: Specialty, activeLevel: string, onLevelChange: (lvl: string) => void }) => {
  const levels = getLevelsForSystem(specialty);
  
  return (
    <div className="flex gap-2 overflow-x-auto pb-4 no-print scrollbar-hide">
      {levels.map(lvl => (
        <button 
          key={lvl} 
          onClick={() => onLevelChange(lvl)}
          className={`px-5 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all duration-200 ${activeLevel === lvl ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white border border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600'}`}
        >
          {lvl}
        </button>
      ))}
    </div>
  );
};

const ParcoursFilter = ({ 
  specialty, 
  activeLevel, 
  activeSubSpec, 
  onSubSpecChange,
  allowTroncCommun = false
}: { 
  specialty: Specialty, 
  activeLevel: string, 
  activeSubSpec: string, 
  onSubSpecChange: (s: string) => void,
  allowTroncCommun?: boolean
}) => {
  const { db } = useDB();
  const levelSpecialties = db.subSpecialties.filter(s => s.specialtyId === specialty.id && s.level === activeLevel);
  if (levelSpecialties.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 no-print mb-6">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Spécialité / Parcours</p>
      <div className="flex flex-wrap gap-2">
        {allowTroncCommun && (
          <button 
            onClick={() => onSubSpecChange('')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeSubSpec === '' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-500 border hover:bg-slate-50'}`}
          >
            Tronc Commun
          </button>
        )}
        {levelSpecialties.map(s => (
          <button 
            key={s.id}
            onClick={() => onSubSpecChange(s.name)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeSubSpec === s.name ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-500 border hover:bg-slate-50'}`}
          >
            {s.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export const MonitoringView = ({ specialtyId }: { specialtyId: string }) => {
  const { db, setDb } = useDB();
  const specialty = db.specialties.find(s => s.id === specialtyId);
  if (!specialty) return null;

  const modules = db.modules.filter(m => m.specialtyId === specialtyId);
  const assignments = db.assignments;
  const timetable = db.timetable.filter(t => t.specialtyId === specialtyId);
  
  const levels = getLevelsForSystem(specialty);
  const [activeLevel, setActiveLevel] = useState(levels[0] || '');
  const [activeSubSpec, setActiveSubSpec] = useState('');

  const levelSpecialties = db.subSpecialties.filter(s => s.specialtyId === specialtyId && s.level === activeLevel);

  const getMissingTeachers = (m: Module) => {
    const missing = [];
    if (m.hasCours && !assignments.some(a => a.moduleId === m.id && a.type === SessionType.COURS)) missing.push('Cours');
    if (m.hasTD && !assignments.some(a => a.moduleId === m.id && a.type === SessionType.TD)) missing.push('TD');
    if (m.hasTP && !assignments.some(a => a.moduleId === m.id && a.type === SessionType.TP)) missing.push('TP');
    return missing;
  };

  const getMissingTimetable = (m: Module) => {
    const missing = [];
    if (m.hasCours && !timetable.some(t => t.moduleId === m.id && t.type === SessionType.COURS)) missing.push('Cours');
    if (m.hasTD && !timetable.some(t => t.moduleId === m.id && t.type === SessionType.TD)) missing.push('TD');
    if (m.hasTP && !timetable.some(t => t.moduleId === m.id && t.type === SessionType.TP)) missing.push('TP');
    return missing;
  };

  const currentLevelModules = modules.filter(m => 
    m.level === activeLevel && 
    (!m.subSpecialty || m.subSpecialty === activeSubSpec)
  );

  const renderMissingSection = (title: string, icon: React.ReactNode, colorClass: string, bgClass: string, borderClass: string, textClass: string, getMissingFn: (m: Module) => string[], emptyMsg: string) => {
    const [assignModal, setAssignModal] = useState<{ module: Module, type: string } | null>(null);
    const teachers = db.users.filter(u => u.role === UserRole.TEACHER && u.specialtyId === specialtyId);
    return (
      <div className="space-y-6">
        <h3 className={`text-xl font-bold flex items-center gap-2 ${textClass}`}>
          {icon}
          {title} - {activeLevel}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[1, 2].map(sem => {
            const semModules = currentLevelModules.filter(m => m.semester === sem && getMissingFn(m).length > 0);
            return (
              <div key={sem} className="space-y-4">
                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <span className={`w-2 h-4 rounded-full ${bgClass}`}></span>
                  Semestre {sem}
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  {semModules.length > 0 ? semModules.map(m => (
                    <div key={m.id} className={`p-4 bg-white border-2 ${borderClass} rounded-xl shadow-sm`}>
                      <h5 className="font-bold text-slate-800 mb-2">{m.name}</h5>
                      <div className="space-y-2">
                        {getMissingFn(m).map(type => (
                          <div key={type} className="flex items-center justify-between gap-3 bg-white/70 border border-slate-200 rounded-lg p-2">
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${textClass}`}>
                              {title.includes('EDT') ? 'Non programmé' : 'Sans Prof'}: {type}
                            </span>
                            {title.includes('Enseignants') && (
                              <button
                                onClick={() => setAssignModal({ module: m, type })}
                                className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all"
                              >
                                Assigner Prof
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )) : (
                    <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 flex items-center gap-3 text-sm font-medium">
                      <CheckCircle2 className="w-5 h-5" /> {emptyMsg} (S{sem})
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {assignModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
              <h3 className="text-xl font-bold mb-4 text-slate-800">Assigner un enseignant</h3>
              <p className="mb-4 text-slate-500">Module: <span className="font-bold">{assignModal.module.name}</span> | Type: <span className="font-bold">{assignModal.type}</span></p>
              <select className="w-full px-4 py-2 border rounded-lg outline-none mb-6" onChange={e => setAssignModal({ ...assignModal, teacherId: e.target.value })} value={assignModal.teacherId || ''}>
                <option value="">Sélectionner un enseignant</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
              </select>
              {!assignModal.teacherId && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-sm font-medium">
                  Veuillez choisir un enseignant pour valider l'ajout.
                </div>
              )}
              <div className="flex gap-4">
                <button onClick={() => setAssignModal(null)} className="flex-1 px-4 py-2 border rounded-lg font-medium hover:bg-slate-50">Annuler</button>
                <button disabled={!assignModal.teacherId} onClick={async () => {
                  const existingAssignment = db.assignments.find(a => a.moduleId === assignModal.module.id && a.type === assignModal.type);
                  const assignmentToSave = {
                    id: existingAssignment ? existingAssignment.id : Date.now().toString(),
                    moduleId: assignModal.module.id,
                    teacherId: assignModal.teacherId || null,
                    type: assignModal.type,
                  };

                  await supabaseService.saveAssignment(assignmentToSave);
                  setDb(prev => ({
                    ...prev,
                    assignments: existingAssignment
                      ? prev.assignments.map(a => a.id === existingAssignment.id ? assignmentToSave : a)
                      : [...prev.assignments, assignmentToSave]
                  }));
                  setAssignModal(null);
                }} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700">Assigner</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-12">
      <LevelFilterBar specialty={specialty} activeLevel={activeLevel} onLevelChange={setActiveLevel} />

      <ParcoursFilter 
        specialty={specialty} 
        activeLevel={activeLevel} 
        activeSubSpec={activeSubSpec} 
        onSubSpecChange={setActiveSubSpec} 
      />

      {renderMissingSection(
        "Manque d'Enseignants", 
        <AlertCircle className="w-6 h-6" />, 
        "rose", "bg-rose-50", "border-rose-100", "text-rose-600", 
        getMissingTeachers, 
        "Tous les modules ont des enseignants"
      )}

      <div className="pt-8 border-t">
        {renderMissingSection(
          "Manque dans l'EDT", 
          <Calendar className="w-6 h-6" />, 
          "orange", "bg-orange-50", "border-orange-100", "text-orange-600", 
          getMissingTimetable, 
          "Toutes les séances sont programmées"
        )}
      </div>
    </div>
  );
};

export const StudentManager = ({ specialtyId }: { specialtyId: string }) => {
  const { db, setDb } = useDB();
  const specialty = db.specialties.find(s => s.id === specialtyId);
  if (!specialty) return null;

  const levels = getLevelsForSystem(specialty);
  const [activeLevel, setActiveLevel] = useState(levels[0] || '');
  const [activeSubSpec, setActiveSubSpec] = useState('');
  const [newStudent, setNewStudent] = useState({ firstName: '', lastName: '', fullName: '', username: '', birthDate: '', phone: '', email: '', subSpecialty: '', groupId: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingStudentGroup, setEditingStudentGroup] = useState<string | null>(null);
  const [printData, setPrintData] = useState<any>(null);
  const [groupSize, setGroupSize] = useState(50);

  // Auto-clear success message after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Auto-clear error message after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const addStudent = async () => {
    setError('');
    if (!newStudent.firstName || !newStudent.lastName || !newStudent.username || !newStudent.email || !newStudent.birthDate || !activeLevel) {
      setError("Veuillez remplir tous les champs requis pour l'étudiant·e (Prénom, Nom, Email, Username, Date de naissance).");
      return;
    }
    
    // Constraint: If specialties exist, student MUST have one.
    if (levelSpecialties.length > 0 && !newStudent.subSpecialty) {
      setError("Veuillez sélectionner une spécialité.");
      return;
    }

    const existing = db.users.find(u => u.username === newStudent.username);
    if (existing) {
      setError("Ce nom d'utilisateur existe déjà !");
      return;
    }

    // Enforce specialty if they exist for this level
    if (levelSpecialties.length > 0 && !newStudent.subSpecialty && !activeSubSpec) {
      setError("Veuillez sélectionner une spécialité.");
      return;
    }

    const password = generatePassword();
    const subSpec = db.subSpecialties.find(s => s.name === (newStudent.subSpecialty || activeSubSpec) && s.level === activeLevel && s.specialtyId === specialtyId);
    
      const newUser: User = { 
        id: Date.now().toString(), 
        username: newStudent.username, 
        password, 
        role: UserRole.STUDENT, 
        firstName: newStudent.firstName,
        lastName: newStudent.lastName,
        fullName: `${newStudent.firstName.trim()} ${newStudent.lastName.trim()}`.trim(),
        email: newStudent.email,
        phone: newStudent.phone,
        birthDate: newStudent.birthDate,
        specialtyId,
        subSpecialtyId: subSpec?.id,
        subSpecialty: newStudent.subSpecialty || activeSubSpec,
        level: activeLevel,
        groupId: undefined,
        isApprovedForYear: activeLevel.endsWith(' 1'), // Auto-validate for 1st year students
        createdBy: specialty?.agentId || ''
      };
    
    try {
      await supabaseService.saveUser(newUser);
      setDb(prev => ({ ...prev, users: [...prev.users, newUser] }));
      setPrintData({ ...newUser, password });
      setSuccess("Étudiant ajouté avec succès !");
      setShowModal(false);
      setNewStudent({ firstName: '', lastName: '', fullName: '', username: '', birthDate: '', phone: '', email: '', subSpecialty: '', groupId: '' });
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'ajout de l'étudiant");
    }
  };

  const updateStudentGroup = async (studentId: string, newGroupId: string) => {
    setError('');
    const student = db.users.find(u => u.id === studentId);
    if (!student) return;
    const updatedStudent = { ...student, groupId: newGroupId };
    try {
      await supabaseService.saveUser(updatedStudent);
      setDb(prev => ({ ...prev, users: prev.users.map(u => u.id === studentId ? updatedStudent : u) }));
      setSuccess("Groupe mis à jour avec succès !");
      setEditingStudentGroup(null);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la mise à jour du groupe");
    }
  };

  const autoRepartition = async () => {
    setError('');
    const studentsToUpdate = db.users.filter(u => 
      u.role === UserRole.STUDENT && 
      u.specialtyId === specialtyId && 
      u.level === activeLevel &&
      (!activeSubSpec || u.subSpecialty === activeSubSpec)
    );
    const sorted = [...studentsToUpdate].sort((a, b) => a.fullName.localeCompare(b.fullName));
    
    try {
      const updatedStudents = [];
      for (let i = 0; i < sorted.length; i++) {
        const student = sorted[i];
        const groupNum = Math.floor(i / groupSize) + 1;
        const groupId = `G${groupNum}`;
        const updatedStudent = { ...student, groupId };
        await supabaseService.saveUser(updatedStudent);
        updatedStudents.push(updatedStudent);
      }
      setDb(prev => ({
        ...prev,
        users: prev.users.map(u => updatedStudents.find(us => us.id === u.id) || u)
      }));
      setSuccess("Répartition A-Z effectuée avec succès !");
    } catch (err: any) {
      setError(err.message || "Erreur lors de la répartition automatique");
    }
  };

  const currentStudents = db.users.filter(u => 
    u.role === UserRole.STUDENT && 
    u.specialtyId === specialtyId && 
    u.level === activeLevel &&
    (!u.subSpecialty || u.subSpecialty === activeSubSpec)
  );
  const levelSpecialties = db.subSpecialties.filter(s => s.specialtyId === specialtyId && s.level === activeLevel);
  const groups = Array.from(new Set(currentStudents.map(s => s.groupId || 'Non assigné'))).sort();

  // Reset activeSubSpec when level changes
  useEffect(() => {
    if (levelSpecialties.length > 0) {
      // If there are sub-specialties, set to the first one if not already set or not in the list
      if (!activeSubSpec || !levelSpecialties.some(s => s.name === activeSubSpec)) {
        setActiveSubSpec(levelSpecialties[0].name);
      }
    } else {
      // If no sub-specialties, set to empty
      setActiveSubSpec('');
    }
  }, [activeLevel, levelSpecialties]);

  return (
    <div className="space-y-6">
      <LevelFilterBar specialty={specialty} activeLevel={activeLevel} onLevelChange={setActiveLevel} />

      <ParcoursFilter 
        specialty={specialty} 
        activeLevel={activeLevel} 
        activeSubSpec={activeSubSpec} 
        onSubSpecChange={setActiveSubSpec} 
      />

      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-slate-800">Gestion des Étudiants - {activeLevel}</h3>
          <p className="text-slate-400 text-sm">{currentStudents.length} étudiants inscrits</p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Taille Gr:</span>
            <input 
              type="number" 
              className="w-16 outline-none font-bold text-indigo-600" 
              value={groupSize} 
              onChange={e => setGroupSize(Number(e.target.value))} 
            />
          </div>
          <button onClick={autoRepartition} className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg font-medium hover:bg-slate-900">
            <LayoutGrid className="w-5 h-5" />
            Répartition A-Z
          </button>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700">
            <Plus className="w-5 h-5" />
            Nouvel·le Étudiant·e
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {groups.map(group => (
          <div key={group} className="bg-white border rounded-xl p-4 shadow-sm">
            <div className="flex justify-between items-center mb-3">
               <h4 className="font-bold text-indigo-700">{group}</h4>
               <span className="bg-slate-100 text-slate-600 text-xs px-2 py-0.5 rounded-full font-bold">
                 {currentStudents.filter(s => (s.groupId || 'Non assigné') === group).length} élèves
               </span>
            </div>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {currentStudents.filter(s => (s.groupId || 'Non assigné') === group).map(s => (
                <div key={s.id} className="text-sm text-slate-600 py-1 border-b last:border-0 truncate flex justify-between items-center group/item">
                  <span className="truncate flex-1">{s.fullName}</span>
                  <div className="flex items-center gap-1">
                    {s.subSpecialty && <span className="text-[9px] bg-indigo-50 text-indigo-600 px-1 rounded font-bold uppercase">{s.subSpecialty}</span>}
                    <button 
                        onClick={() => setEditingStudentGroup(s.id)}
                        className="opacity-0 group-hover/item:opacity-100 p-1 hover:bg-indigo-100 rounded text-indigo-600 transition-all"
                    >
                        <Settings2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {groups.length === 0 && <div className="col-span-full py-10 text-center text-slate-400 italic">Aucun étudiant dans ce niveau.</div>}
      </div>

      {editingStudentGroup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl">
                <h3 className="text-xl font-bold mb-4">Changer le groupe</h3>
                <p className="text-sm text-slate-500 mb-6">Sélectionnez le nouveau groupe pour {db.users.find(u => u.id === editingStudentGroup)?.fullName}.</p>
                <div className="flex flex-col gap-4 mb-8">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-bold text-slate-400 uppercase">Saisir un groupe:</label>
                        <input 
                            type="text" 
                            className="flex-1 px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Ex: G7, G8..."
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    updateStudentGroup(editingStudentGroup, (e.target as HTMLInputElement).value);
                                }
                            }}
                        />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        {['G1', 'G2', 'G3', 'G4', 'G5', 'G6'].map(g => (
                            <button 
                                key={g}
                                onClick={() => updateStudentGroup(editingStudentGroup, g)}
                                className={`py-3 rounded-xl font-bold border transition-all ${db.users.find(u => u.id === editingStudentGroup)?.groupId === g ? 'bg-indigo-600 text-white border-indigo-600' : 'hover:border-indigo-300 text-slate-600'}`}
                            >
                                {g}
                            </button>
                        ))}
                    </div>
                </div>
                <button onClick={() => setEditingStudentGroup(null)} className="w-full py-3 border rounded-xl font-bold text-slate-400 hover:bg-slate-50">Annuler</button>
            </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6 text-slate-800">Inscrire en {activeLevel}</h3>
            {error && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl flex items-center gap-3 text-sm font-medium animate-shake">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
            )}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Prénom</label>
                  <input className="w-full px-4 py-2 border rounded-lg outline-none" value={newStudent.firstName} onChange={e => setNewStudent({...newStudent, firstName: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Nom</label>
                  <input className="w-full px-4 py-2 border rounded-lg outline-none" value={newStudent.lastName} onChange={e => setNewStudent({...newStudent, lastName: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Date de naissance</label>
                <input type="date" className="w-full px-4 py-2 border rounded-lg outline-none" value={newStudent.birthDate} onChange={e => setNewStudent({...newStudent, birthDate: e.target.value})} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Téléphone</label>
                  <input type="tel" className="w-full px-4 py-2 border rounded-lg outline-none" value={newStudent.phone} onChange={e => setNewStudent({...newStudent, phone: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                  <input type="email" className="w-full px-4 py-2 border rounded-lg outline-none" value={newStudent.email} onChange={e => setNewStudent({...newStudent, email: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Username</label>
                <input className="w-full px-4 py-2 border rounded-lg outline-none" value={newStudent.username} onChange={e => setNewStudent({...newStudent, username: e.target.value})} />
              </div>
              {levelSpecialties.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Spécialité ({activeLevel})</label>
                  <select 
                    className="w-full px-4 py-2 border rounded-lg outline-none" 
                    value={newStudent.subSpecialty} 
                    onChange={e => setNewStudent({...newStudent, subSpecialty: e.target.value})}
                    required
                  >
                    <option value="">Choisir une spécialité...</option>
                    {levelSpecialties.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
              )}
              <div className="flex gap-4 pt-4">
                <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border rounded-lg font-medium">Annuler</button>
                <button onClick={addStudent} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium">Enregistrer</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {printData && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
          <div className="bg-white p-12 rounded-lg max-w-md w-full shadow-2xl relative text-center">
            <div className="mb-6 flex justify-center"><Users className="w-12 h-12 text-indigo-600" /></div>
            <h3 className="text-xl font-bold mb-2">Fiche d'Accès - Étudiant</h3>
            <div className="bg-slate-50 p-6 rounded-xl border-2 border-dashed border-indigo-200 text-left space-y-3 mt-6">
              <div><p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Nom</p><p className="font-bold text-lg">{printData.fullName}</p></div>
              <div><p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Niveau</p><p className="font-bold">{printData.level}</p></div>
              <div className="pt-3 border-t">
                <p className="text-sm">Username: <span className="font-mono bg-indigo-100 px-2 py-0.5 rounded">{printData.username}</span></p>
                <p className="text-sm mt-1">Password: <span className="font-mono bg-indigo-100 px-2 py-0.5 rounded">{printData.password}</span></p>
              </div>
            </div>
            <button onClick={() => { window.print(); setPrintData(null); }} className="mt-8 bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 flex items-center gap-2 mx-auto no-print"><Printer className="w-5 h-5" />Imprimer</button>
            <button onClick={() => setPrintData(null)} className="mt-4 text-slate-400 font-medium no-print">Fermer</button>
          </div>
        </div>
      )}
    </div>
  );
};

export const ModuleManager = ({ specialtyId }: { specialtyId: string }) => {
  const { db, setDb } = useDB();
  const specialty = db.specialties.find(s => s.id === specialtyId);
  if (!specialty) return null;

  const levels = getLevelsForSystem(specialty);
  const [activeLevel, setActiveLevel] = useState(levels[0] || '');
  const [activeSubSpec, setActiveSubSpec] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newMod, setNewMod] = useState<{
    name: string;
    unitType: string;
    unitNumber: number;
    credits: number;
    coefficient: number;
    hasCours: boolean;
    hasTD: boolean;
    hasTP: boolean;
    semester: 1 | 2;
    subSpecialty: string;
  }>({ name: '', unitType: 'UEF', unitNumber: 1, credits: 1, coefficient: 1, hasCours: true, hasTD: false, hasTP: false, semester: 1, subSpecialty: '' });

  useEffect(() => {
    setNewMod(prev => ({ ...prev, subSpecialty: activeSubSpec }));
  }, [activeSubSpec]);

  const [confirmModal, setConfirmModal] = useState<{ title: string, message: string, onConfirm: () => void, type?: 'info' | 'danger' } | null>(null);
  const [editModule, setEditModule] = useState<Module | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Auto-clear success message after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Auto-clear error message after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const addModule = async () => {
    setError('');
    if (!newMod.name || !newMod.unitType || !newMod.unitNumber || newMod.credits <= 0 || (!newMod.hasCours && !newMod.hasTD && !newMod.hasTP) || !activeLevel) {
      setError("Erreur: Vérifiez le nom, le type d'unité, le numéro, les crédits, le niveau et les types de séances.");
      return;
    }

    const desiredSubSpec = newMod.subSpecialty;
    const duplicate = db.modules.some(m =>
      m.specialtyId === specialtyId &&
      m.level === activeLevel &&
      (m.subSpecialty || '') === (desiredSubSpec || '') &&
      m.name.trim().toLowerCase() === newMod.name.trim().toLowerCase()
    );
    if (duplicate) {
      setError("Ce module existe déjà pour ce niveau et cette spécialité / tronc commun.");
      return;
    }

    const subSpec = db.subSpecialties.find(s => s.name === desiredSubSpec && s.level === activeLevel && s.specialtyId === specialtyId);
    // Génère le nom d'unité automatiquement
    const unitName = `${newMod.unitType} ${newMod.unitNumber}`;
    const moduleData = { 
      ...newMod, 
      unit: unitName,
      id: Date.now().toString(), 
      specialtyId, 
      subSpecialtyId: subSpec?.id,
      subSpecialty: desiredSubSpec,
      level: activeLevel 
    };

    try {
      await supabaseService.saveModule(moduleData);
      setDb(prev => ({ ...prev, modules: [...prev.modules, moduleData] }));
      setSuccess("Module ajouté avec succès !");
      setNewMod({ name: '', unitType: 'UEF', unitNumber: 1, credits: 1, coefficient: 1, hasCours: true, hasTD: false, hasTP: false, semester: 1, subSpecialty: '' });
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'ajout du module");
    }
  };

  const removeModule = (id: string) => {
    setError('');
    setConfirmModal({
      title: "Supprimer le Module",
      message: "Êtes-vous sûr de vouloir supprimer ce module ? Cette action est irréversible.",
      type: 'danger',
      onConfirm: async () => {
        try {
          await supabaseService.deleteModule(id);
          setDb(prev => ({ ...prev, modules: prev.modules.filter(m => m.id !== id) }));
          setSuccess("Module supprimé avec succès !");
          setConfirmModal(null);
        } catch (err: any) {
          setError("Erreur lors de la suppression");
        }
      }
    });
  };

  const saveEditedModule = async () => {
    if (!editModule) return;
    setError('');
    
    // Check for duplicates (same name in same level/specialty)
    const duplicate = db.modules.some(m => 
      m.id !== editModule.id &&
      m.specialtyId === specialtyId &&
      m.level === activeLevel &&
      (m.subSpecialty || '') === (editModule.subSpecialty || '') &&
      m.name.trim().toLowerCase() === editModule.name.trim().toLowerCase()
    );
    if (duplicate) {
      setError("Un module avec ce nom existe déjà pour ce niveau et cette spécialité / tronc commun.");
      return;
    }

    // Update unit name
    const unitName = `${editModule.unitType} ${editModule.unitNumber}`;
    const updatedModule = { 
      ...editModule, 
      unit: unitName,
      subSpecialtyId: db.subSpecialties.find(s => s.name === editModule.subSpecialty && s.level === activeLevel && s.specialtyId === specialtyId)?.id
    };

    try {
      await supabaseService.saveModule(updatedModule);
      setDb(prev => ({ ...prev, modules: prev.modules.map(m => m.id === editModule.id ? updatedModule : m) }));
      setSuccess("Module modifié avec succès !");
      setEditModalOpen(false);
      setEditModule(null);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la modification du module");
    }
  };

  const currentLevelModules = db.modules.filter(m => 
    m.specialtyId === specialtyId && 
    m.level === activeLevel &&
    (!activeSubSpec || m.subSpecialty === activeSubSpec)
  );

  const levelSpecialties = db.subSpecialties.filter(s => s.specialtyId === specialtyId && s.level === activeLevel);

  return (
    <div className="space-y-6">
      <LevelFilterBar specialty={specialty} activeLevel={activeLevel} onLevelChange={setActiveLevel} />

      <ParcoursFilter 
        specialty={specialty} 
        activeLevel={activeLevel} 
        activeSubSpec={activeSubSpec} 
        onSubSpecChange={setActiveSubSpec} 
        allowTroncCommun={true}
      />

      {success && (
        <div className="p-4 bg-green-50 border border-green-100 text-green-600 rounded-2xl flex items-center gap-3 text-sm font-medium animate-in fade-in slide-in-from-top-4 duration-500">
          <CheckCircle2 className="w-5 h-5" />
          {success}
        </div>
      )}

      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
        <h3 className="font-bold mb-4">Ajouter un module en {activeLevel}</h3>
        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl flex items-center gap-2 text-sm font-medium animate-shake">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Nom du Module</label>
            <input 
              className="w-full px-4 py-2 border rounded-lg outline-none" 
              value={newMod.name} 
              onChange={e => setNewMod({...newMod, name: e.target.value})}
              onKeyDown={e => e.key === 'Enter' && addModule()}
              placeholder="Ex: Mathématiques"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Type d'Unité</label>
            <select className="w-full px-4 py-2 border rounded-lg outline-none" value={newMod.unitType || 'UEF'} onChange={e => setNewMod({...newMod, unitType: e.target.value})}>
              <option value="UEF">Fondamentale (UEF)</option>
              <option value="UEM">Méthodologique (UEM)</option>
              <option value="UED">Découverte (UED)</option>
              <option value="UET">Transversale (UET)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Numéro de l'Unité</label>
            <input type="number" min={1} className="w-full px-4 py-2 border rounded-lg outline-none" value={newMod.unitNumber || 1} onChange={e => setNewMod({...newMod, unitNumber: Number(e.target.value)})} />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Crédits</label>
            <input type="number" className="w-full px-4 py-2 border rounded-lg outline-none" value={newMod.credits} onChange={e => setNewMod({...newMod, credits: Number(e.target.value)})} />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Coefficient</label>
            <input type="number" className="w-full px-4 py-2 border rounded-lg outline-none" value={newMod.coefficient} onChange={e => setNewMod({...newMod, coefficient: Number(e.target.value)})} />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Semestre</label>
            <select className="w-full px-4 py-2 border rounded-lg outline-none" value={newMod.semester} onChange={e => setNewMod({...newMod, semester: Number(e.target.value) as 1 | 2})}>
              <option value={1}>S1</option>
              <option value={2}>S2</option>
            </select>
          </div>
          {levelSpecialties.length > 0 && (
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Spécialité</label>
              <select className="w-full px-4 py-2 border rounded-lg outline-none" value={newMod.subSpecialty} onChange={e => setNewMod({...newMod, subSpecialty: e.target.value})}>
                <option value="">Tronc Commun</option>
                {levelSpecialties.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
          )}
        </div>
        <div className="flex gap-6 py-4 border-t mt-4 pt-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={newMod.hasCours} onChange={e => setNewMod({...newMod, hasCours: e.target.checked})} className="w-4 h-4 accent-indigo-600" />
            <span className="text-sm font-semibold">Cours</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={newMod.hasTD} onChange={e => setNewMod({...newMod, hasTD: e.target.checked})} className="w-4 h-4 accent-indigo-600" />
            <span className="text-sm font-semibold">TD</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={newMod.hasTP} onChange={e => setNewMod({...newMod, hasTP: e.target.checked})} className="w-4 h-4 accent-indigo-600" />
            <span className="text-sm font-semibold">TP</span>
          </label>
        </div>
        <button onClick={addModule} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors mt-4">
          Ajouter Module
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {[1, 2].map(sem => {
          // Regroupement des modules par unité (UE)
          const modulesByUE: { [unit: string]: Module[] } = {};
          currentLevelModules.filter(m => m.semester === sem).forEach(m => {
            if (!modulesByUE[m.unit]) modulesByUE[m.unit] = [];
            modulesByUE[m.unit].push(m);
          });
          return (
            <div key={sem}>
              <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="w-2 h-6 bg-indigo-500 rounded-full"></span>
                Semestre {sem} - {activeLevel}
              </h4>
              <div className="space-y-6">
                {Object.keys(modulesByUE).length === 0 && <p className="text-slate-400 text-xs italic p-4 text-center border border-dashed rounded-lg">Aucun module pour ce semestre.</p>}
                {Object.entries(modulesByUE).map(([unit, mods]) => (
                  <div key={unit} className="bg-white border-2 border-indigo-100 rounded-2xl p-4">
                    <h5 className="font-bold text-indigo-700 mb-2 text-sm uppercase">{unit || 'Unité inconnue'}</h5>
                    <div className="space-y-3">
                      {mods.map(m => (
                        <div key={m.id} className="bg-white border rounded-xl p-4 flex justify-between items-center group">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-slate-800">{m.name}</span>
                              <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded font-bold">COEFF: {m.coefficient}</span>
                              <span className="bg-slate-100 text-green-600 text-[10px] px-2 py-0.5 rounded font-bold">CRÉDIT: {m.credits}</span>
                              {m.subSpecialty && (
                                <span className="bg-indigo-100 text-indigo-700 text-[10px] px-2 py-0.5 rounded font-bold uppercase">{m.subSpecialty}</span>
                              )}
                            </div>
                            <div className="flex gap-2 mt-2">
                              {m.hasCours && <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-bold uppercase">Cours</span>}
                              {m.hasTD && <span className="text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded font-bold uppercase">TD</span>}
                              {m.hasTP && <span className="text-[10px] bg-teal-50 text-teal-600 px-2 py-0.5 rounded font-bold uppercase">TP</span>}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => { setEditModule(m); setEditModalOpen(true); }} className="text-yellow-400 hover:text-yellow-500">
                              <Pencil className="w-5 h-5" />
                            </button>
                            <button onClick={() => removeModule(m.id)} className="text-slate-300 hover:text-rose-500">
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {editModalOpen && editModule && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-[500px] relative max-h-[90vh] overflow-y-auto">
            <button className="absolute top-2 right-2 text-slate-400 hover:text-slate-700" onClick={() => setEditModalOpen(false)}>
              ✕
            </button>
            <h2 className="text-lg font-bold mb-4">Modifier le module</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nom du Module</label>
                <input type="text" className="w-full border rounded px-3 py-2" value={editModule.name} onChange={e => setEditModule({ ...editModule, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Type d'Unité</label>
                  <select className="w-full border rounded px-3 py-2" value={editModule.unitType} onChange={e => setEditModule({ ...editModule, unitType: e.target.value })}>
                    <option value="UEF">Fondamentale (UEF)</option>
                    <option value="UEM">Méthodologique (UEM)</option>
                    <option value="UED">Découverte (UED)</option>
                    <option value="UET">Transversale (UET)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Numéro de l'Unité</label>
                  <input type="number" min={1} className="w-full border rounded px-3 py-2" value={editModule.unitNumber} onChange={e => setEditModule({ ...editModule, unitNumber: Number(e.target.value) })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Crédits</label>
                  <input type="number" className="w-full border rounded px-3 py-2" value={editModule.credits} onChange={e => setEditModule({ ...editModule, credits: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Coefficient</label>
                  <input type="number" className="w-full border rounded px-3 py-2" value={editModule.coefficient} onChange={e => setEditModule({ ...editModule, coefficient: Number(e.target.value) })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Semestre</label>
                  <select className="w-full border rounded px-3 py-2" value={editModule.semester} onChange={e => setEditModule({ ...editModule, semester: Number(e.target.value) as 1 | 2 })}>
                    <option value={1}>S1</option>
                    <option value={2}>S2</option>
                  </select>
                </div>
                {levelSpecialties.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Spécialité</label>
                    <select className="w-full border rounded px-3 py-2" value={editModule.subSpecialty || ''} onChange={e => setEditModule({ ...editModule, subSpecialty: e.target.value || undefined })}>
                      <option value="">Tronc Commun</option>
                      {levelSpecialties.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Types de séances</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={editModule.hasCours} onChange={e => setEditModule({ ...editModule, hasCours: e.target.checked })} />
                    <span>Cours</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={editModule.hasTD} onChange={e => setEditModule({ ...editModule, hasTD: e.target.checked })} />
                    <span>TD</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={editModule.hasTP} onChange={e => setEditModule({ ...editModule, hasTP: e.target.checked })} />
                    <span>TP</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button className="flex-1 bg-slate-200 text-slate-700 px-4 py-2 rounded hover:bg-slate-300" onClick={() => setEditModalOpen(false)}>Annuler</button>
              <button className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700" onClick={saveEditedModule}>Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {confirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 ${confirmModal.type === 'danger' ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'}`}>
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold mb-2">{confirmModal.title}</h3>
            <p className="text-slate-500 mb-8 leading-relaxed">{confirmModal.message}</p>
            <div className="flex gap-4">
              <button 
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-3 px-4 border rounded-2xl font-bold text-slate-400 hover:bg-slate-50 transition-all"
              >
                Annuler
              </button>
              <button 
                onClick={confirmModal.onConfirm}
                className={`flex-1 py-3 px-4 rounded-2xl font-bold text-white shadow-lg transition-all active:scale-95 ${confirmModal.type === 'danger' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const TeacherAssignment = ({ specialtyId }: { specialtyId: string }) => {
  const { db, setDb } = useDB();
  const specialty = db.specialties.find(s => s.id === specialtyId);
  if (!specialty) return null;

  const levels = getLevelsForSystem(specialty);
  const [activeLevel, setActiveLevel] = useState(levels[0] || '');
  const [activeSubSpec, setActiveSubSpec] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [printData, setPrintData] = useState<any>(null);
  const [confirmModal, setConfirmModal] = useState<{ title: string, message: string, onConfirm: () => void, type?: 'info' | 'danger' } | null>(null);
  const [assign, setAssign] = useState({ teacherId: '', moduleId: '', type: SessionType.COURS });
  const [searchTerm, setSearchTerm] = useState('');
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [newTeacher, setNewTeacher] = useState({ firstName: '', lastName: '', fullName: '', username: '', email: '', phone: '', birthDate: '', password: '' });

  // Auto-clear success message after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Auto-clear error message after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const createAssignment = async () => {
    setError('');
    if (!assign.teacherId || !assign.moduleId) {
      setError("Veuillez sélectionner un enseignant et un module.");
      return;
    }
    
    // Validation: Check if same teacher is already assigned to same module+type
    const existingAssignment = db.assignments.find(a => 
      a.teacherId === assign.teacherId && 
      a.moduleId === assign.moduleId && 
      a.type === assign.type
    );
    if (existingAssignment) {
      setError("Cet enseignant est déjà assigné à ce module pour ce type de séance.");
      return;
    }
    
    const module = db.modules.find(m => m.id === assign.moduleId);
    const assignmentData = { id: Date.now().toString(), ...assign };
    
    try {
      await supabaseService.saveAssignment(assignmentData);
      setDb(prev => ({ ...prev, assignments: [...prev.assignments, assignmentData] }));
      setSuccess("Affectation créée avec succès !");
      setAssign({ teacherId: '', moduleId: '', type: SessionType.COURS });
      await createNotification(assign.teacherId, `Vous avez été affecté au module ${module?.name} (${activeLevel}) pour la séance de ${assign.type}.`);
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'affectation");
    }
  };

  const teachers = db.users.filter(u => u.role === UserRole.TEACHER && u.specialtyId === specialtyId);
  const modules = db.modules.filter(m => 
    m.specialtyId === specialtyId && 
    m.level === activeLevel &&
    (!m.subSpecialty || m.subSpecialty === activeSubSpec)
  );

  const addTeacher = async () => {
    setError('');
    if (!newTeacher.firstName || !newTeacher.lastName || !newTeacher.username || !newTeacher.email || !newTeacher.birthDate) {
      setError("Veuillez remplir tous les champs requis pour l'enseignant·e (Prénom, Nom, Email, Username, Date de naissance).");
      return;
    }
    if (db.users.some(u => u.username === newTeacher.username)) {
      setError("Ce nom d'utilisateur existe déjà.");
      return;
    }

    const teacherToSave = {
      id: Date.now().toString(),
      username: newTeacher.username,
      password: newTeacher.password || generatePassword(),
      role: UserRole.TEACHER,
      firstName: newTeacher.firstName,
      lastName: newTeacher.lastName,
      fullName: `${newTeacher.firstName.trim()} ${newTeacher.lastName.trim()}`.trim(),
      email: newTeacher.email,
      phone: newTeacher.phone,
      birthDate: newTeacher.birthDate,
      specialtyId,
      createdBy: specialty?.agentId || ''
    };

    try {
      await supabaseService.saveUser(teacherToSave);
      setDb(prev => ({ ...prev, users: [...prev.users, teacherToSave] }));
      setSuccess("Enseignant·e ajouté·e avec succès !");
      setShowTeacherModal(false);
      setPrintData({ ...teacherToSave, password: teacherToSave.password });
      setNewTeacher({ firstName: '', lastName: '', fullName: '', username: '', email: '', phone: '', birthDate: '', password: '' });
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'ajout de l'enseignant·e.");
    }
  };
  const selectedModuleObj = modules.find(m => m.id === assign.moduleId);

  const levelSpecialties = db.subSpecialties.filter(s => s.specialtyId === specialtyId && s.level === activeLevel);

  const filteredAssignments = db.assignments.filter(a => {
    const mod = modules.find(m => m.id === a.moduleId);
    if (!mod) return false;
    if (!searchTerm) return true;
    
    const teacher = teachers.find(t => t.id === a.teacherId);
    const s = searchTerm.toLowerCase();
    return mod.name.toLowerCase().includes(s) || (teacher?.fullName.toLowerCase().includes(s) ?? false);
  });

  const getModuleDisplayName = (m: Module, levelSpecs: SubSpecialty[]) => {
    if (m.subSpecialty) return `${m.name} [${m.subSpecialty}]`;
    return m.name;
  };

  return (
    <div className="space-y-8">
      <LevelFilterBar specialty={specialty} activeLevel={activeLevel} onLevelChange={setActiveLevel} />

      <ParcoursFilter 
        specialty={specialty} 
        activeLevel={activeLevel} 
        activeSubSpec={activeSubSpec} 
        onSubSpecChange={setActiveSubSpec} 
      />

      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-slate-800">Affectations - {activeLevel}</h3>
        <button onClick={() => setShowTeacherModal(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 shadow-sm">
          <Plus className="w-5 h-5" />
          Nouvel·le Enseignant·e
        </button>
      </div>

      {showTeacherModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6 text-slate-800">Ajouter un·e enseignant·e</h3>
            {error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl flex items-center gap-2 text-sm font-medium animate-shake">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Prénom</label>
                  <input type="text" value={newTeacher.firstName} onChange={e => setNewTeacher({...newTeacher, firstName: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Nom</label>
                  <input type="text" value={newTeacher.lastName} onChange={e => setNewTeacher({...newTeacher, lastName: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Username</label>
                <input type="text" value={newTeacher.username} onChange={e => setNewTeacher({...newTeacher, username: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Date de naissance</label>
                <input type="date" value={newTeacher.birthDate} onChange={e => setNewTeacher({...newTeacher, birthDate: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Téléphone</label>
                  <input type="tel" value={newTeacher.phone} onChange={e => setNewTeacher({...newTeacher, phone: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                  <input type="email" value={newTeacher.email} onChange={e => setNewTeacher({...newTeacher, email: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Mot de passe (laissé vide = généré)</label>
                <input type="text" value={newTeacher.password} onChange={e => setNewTeacher({...newTeacher, password: e.target.value})} className="w-full px-4 py-2 border rounded-lg outline-none" />
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => { setShowTeacherModal(false); setError(''); }} className="flex-1 px-4 py-2 border rounded-lg font-medium">Annuler</button>
                <button onClick={addTeacher} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium">Créer</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-100 text-green-600 rounded-2xl flex items-center gap-3 text-sm font-medium animate-in fade-in slide-in-from-top-4 duration-500">
          <CheckCircle2 className="w-5 h-5" />
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-slate-50 p-6 rounded-2xl border border-slate-200">
          <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-500" />
            Nouvelle Affectation
          </h4>
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl flex items-center gap-2 text-sm font-medium animate-shake">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Enseignant</label>
              <select 
                className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white" 
                value={assign.teacherId} 
                onChange={e => setAssign({...assign, teacherId: e.target.value})}
              >
                <option value="">Sélectionner un prof</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
              </select>
              {assign.teacherId && (
                <p className="text-[10px] text-slate-500 mt-1">Personne enseignante actuellement affectée pour ce module/type</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Module</label>
              <select 
                className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white" 
                value={assign.moduleId} 
                onChange={e => {
                  const mId = e.target.value;
                  const m = modules.find(mod => mod.id === mId);
                  let defaultType = SessionType.COURS;
                  if (m) {
                    if (m.hasCours) defaultType = SessionType.COURS;
                    else if (m.hasTD) defaultType = SessionType.TD;
                    else if (m.hasTP) defaultType = SessionType.TP;
                  }
                  setAssign({...assign, moduleId: mId, type: defaultType});
                }}
              >
                <option value="">Sélectionner un module</option>
                {modules.length === 0 ? (
                  <option disabled>Aucun module trouvé pour ce niveau/parcours</option>
                ) : (
                  modules.sort((a, b) => a.semester - b.semester || a.name.localeCompare(b.name)).map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} (S{m.semester}) {getModuleDisplayName(m, levelSpecialties)}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Type de Séance</label>
              <select 
                className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 bg-white" 
                value={assign.type} 
                onChange={e => setAssign({...assign, type: e.target.value as SessionType})}
                disabled={!assign.moduleId}
              >
                {!assign.moduleId && <option value="">Choisir un module</option>}
                {selectedModuleObj?.hasCours && <option value={SessionType.COURS}>Cours</option>}
                {selectedModuleObj?.hasTD && <option value={SessionType.TD}>TD</option>}
                {selectedModuleObj?.hasTP && <option value={SessionType.TP}>TP</option>}
              </select>
            </div>
            <button onClick={createAssignment} className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold hover:bg-slate-900 transition-all shadow-md">
              Effectuer l'affectation
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-bold text-slate-700">Affectations Actuelles ({activeLevel})</h4>
            <div className="relative w-64 no-print">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                className="w-full pl-9 pr-4 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm" 
                placeholder="Chercher module ou prof..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {[1, 2].map(sem => {
            const semAssignments = filteredAssignments.filter(a => modules.find(m => m.id === a.moduleId)?.semester === sem);
            return (
              <div key={sem} className="space-y-3">
                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-indigo-400 rounded-full"></span>
                  Semestre {sem}
                </h5>
                <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-500 tracking-wider">Module</th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-500 tracking-wider">Type</th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-500 tracking-wider">Enseignant</th>
                        <th className="px-6 py-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {semAssignments.map(a => {
                        const mod = modules.find(m => m.id === a.moduleId);
                        return (
                          <tr key={a.id} className="hover:bg-indigo-50/30 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="font-semibold text-slate-700">{mod?.name}</span>
                                {mod && (
                                  <span className="text-[9px] text-indigo-500 font-bold uppercase tracking-wider">
                                    {mod.subSpecialty || (levelSpecialties.length === 0 ? 'Tronc Commun' : '')}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              a.type === SessionType.COURS ? 'bg-blue-100 text-blue-700' : 
                              a.type === SessionType.TD ? 'bg-purple-100 text-purple-700' : 'bg-teal-100 text-teal-700'
                            }`}>{a.type}</span>
                          </td>
                          <td className="px-6 py-4 text-slate-600 font-medium">{(() => {
                            const teacher = teachers.find(t => t.id === a.teacherId);
                            return teacher?.fullName;
                          })()}</td>
                            <td className="px-6 py-4 text-right">
                              <button onClick={() => {
                                setConfirmModal({
                                  title: "Désaffecter l'Enseignant",
                                  message: "Voulez-vous vraiment désaffecter cet enseignant de cette séance ?",
                                  type: 'danger',
                                  onConfirm: async () => {
                                    try {
                                      await supabaseService.deleteAssignment(a.id);
                                      setDb(prev => ({ ...prev, assignments: prev.assignments.filter(assign => assign.id !== a.id) }));
                                      setSuccess("Affectation supprimée avec succès !");
                                      setConfirmModal(null);
                                    } catch (err: any) {
                                      setError("Erreur lors de la suppression");
                                    }
                                  }
                                });
                              }} className="text-slate-300 hover:text-rose-500 p-1 rounded-lg hover:bg-rose-50 transition-all"><Trash2 className="w-4 h-4" /></button>
                            </td>
                        </tr>
                      );
                    })}
                    {semAssignments.length === 0 && (
                      <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-slate-400 italic text-sm">
                            Aucune affectation pour ce semestre.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pt-8 border-t">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" />
            Liste Globale des Enseignants
          </h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {teachers.map(t => {
            const assignmentCount = db.assignments.filter(a => a.teacherId === t.id).length;
            return (
              <div key={t.id} className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center gap-4 hover:shadow-md transition-all shadow-sm">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                  {t.fullName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 truncate">{t.fullName}</p>
                  <p className="text-xs text-slate-400">{assignmentCount} affectation(s)</p>
                  <p className="text-xs text-slate-400">Mot de passe : {t.password || '—'}</p>
                </div>
                <button 
                  onClick={() => {
                    setPrintData({ ...t, password: t.password || '—' });
                  }}
                  className="text-slate-300 hover:text-indigo-600 p-1"
                >
                  <Printer className="w-4 h-4" />
                </button>
              </div>
            );
          })}
          {teachers.length === 0 && <p className="col-span-full text-slate-400 italic text-center py-8">Aucun enseignant inscrit.</p>}
        </div>
      </div>

      {confirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 ${confirmModal.type === 'danger' ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'}`}>
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold mb-2">{confirmModal.title}</h3>
            <p className="text-slate-500 mb-8 leading-relaxed">{confirmModal.message}</p>
            <div className="flex gap-4">
              <button 
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-3 px-4 border rounded-2xl font-bold text-slate-400 hover:bg-slate-50 transition-all"
              >
                Annuler
              </button>
              <button 
                onClick={confirmModal.onConfirm}
                className={`flex-1 py-3 px-4 rounded-2xl font-bold text-white shadow-lg transition-all active:scale-95 ${confirmModal.type === 'danger' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {printData && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
          <div className="bg-white p-12 rounded-3xl max-w-md w-full shadow-2xl relative text-center">
            <div className="mb-6 flex justify-center"><Users className="w-12 h-12 text-indigo-600" /></div>
            <h3 className="text-xl font-bold mb-2">Fiche d'Accès - Enseignant</h3>
            <div className="bg-slate-50 p-6 rounded-2xl border-2 border-dashed border-indigo-200 text-left space-y-3 mt-6">
              <div><p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Nom</p><p className="font-bold text-lg">{printData.fullName}</p></div>
              <div className="pt-3 border-t">
                <p className="text-sm">Username: <span className="font-mono bg-indigo-100 px-2 py-0.5 rounded">{printData.username}</span></p>
                <p className="text-sm mt-1">Password: <span className="font-mono bg-indigo-100 px-2 py-0.5 rounded">{printData.password}</span></p>
              </div>
            </div>
            <button onClick={() => { window.print(); setPrintData(null); }} className="mt-8 bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 flex items-center gap-2 mx-auto no-print"><Printer className="w-5 h-5" />Imprimer</button>
            <button onClick={() => setPrintData(null)} className="mt-4 text-slate-400 hover:text-slate-600 font-medium no-print">Fermer</button>
          </div>
        </div>
      )}
    </div>
  );
};

export const RoomManager = ({ specialtyId }: { specialtyId: string }) => {
  const { db, setDb } = useDB();
  const [newRoom, setNewRoom] = useState({ name: '', type: RoomType.SALLE, capacity: 40 });
  const [error, setError] = useState('');
  const [confirmModal, setConfirmModal] = useState<{ title: string, message: string, onConfirm: () => void, type?: 'info' | 'danger' } | null>(null);

  const addRoom = async () => {
    setError('');
    if (!newRoom.name) {
      setError("Veuillez saisir le nom de la salle.");
      return;
    }
    const existing = db.rooms.find(r => r.name.toLowerCase() === newRoom.name.toLowerCase() && r.specialtyId === specialtyId);
    if (existing) {
      setError("Cette salle existe déjà !");
      return;
    }
    const roomData: Room = { 
      id: Date.now().toString(), 
      specialtyId, 
      name: newRoom.name
    };
    try {
      await supabaseService.saveRoom(roomData);
      setDb(prev => ({ ...prev, rooms: [...prev.rooms, roomData] }));
      setNewRoom({ name: '' });
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'ajout de la salle");
    }
  };

  const removeRoom = (id: string) => {
    setError('');
    setConfirmModal({
      title: "Supprimer la Salle",
      message: "Voulez-vous vraiment supprimer cette salle ?",
      type: 'danger',
      onConfirm: async () => {
        const roomToDelete = db.rooms.find(r => r.id === id);
        const associatedTimetable = db.timetable.filter(t => t.room === roomToDelete?.name);
        
        try {
          await supabaseService.deleteRoom(id);
          for (const entry of associatedTimetable) {
            await supabaseService.deleteTimetableEntry(entry.id);
          }
          setConfirmModal(null);
        } catch (err: any) {
          setError("Erreur lors de la suppression");
        }
      }
    });
  };

  const specialtyRooms = db.rooms || [];

  return (
    <div className="space-y-6">
      <div className="bg-white border rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
          <DoorOpen className="w-5 h-5 text-indigo-500" />
          Ajouter une Salle
        </h3>
        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl flex items-center gap-2 text-sm font-medium animate-shake">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Nom de la salle</label>
            <input 
              className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" 
              value={newRoom.name} 
              onChange={e => setNewRoom({...newRoom, name: e.target.value})}
              placeholder="Ex: Salle 01, Amphi A..."
            />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button 
              onClick={addRoom} 
              className="bg-indigo-600 text-white px-8 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
            >
              Ajouter la Salle
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {specialtyRooms.map(r => (
          <div key={r.id} className="bg-white border rounded-xl p-4 flex justify-between items-center group shadow-sm">
            <div>
              <p className="font-bold text-slate-800">{r.name}</p>
            </div>
            <button onClick={() => removeRoom(r.id)} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
        {specialtyRooms.length === 0 && (
          <div className="col-span-full py-10 text-center border border-dashed rounded-2xl bg-slate-50/50">
            <p className="text-slate-400 italic">Aucune salle configurée pour votre spécialité.</p>
          </div>
        )}
      </div>

      {confirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 ${confirmModal.type === 'danger' ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'}`}>
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold mb-2">{confirmModal.title}</h3>
            <p className="text-slate-500 mb-8 leading-relaxed">{confirmModal.message}</p>
            <div className="flex gap-4">
              <button 
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-3 px-4 border rounded-2xl font-bold text-slate-400 hover:bg-slate-50 transition-all"
              >
                Annuler
              </button>
              <button 
                onClick={confirmModal.onConfirm}
                className={`flex-1 py-3 px-4 rounded-2xl font-bold text-white shadow-lg transition-all active:scale-95 ${confirmModal.type === 'danger' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const TimetableManager = ({ specialtyId }: { specialtyId: string }) => {
  const { db, setDb } = useDB();
  const specialty = db.specialties.find(s => s.id === specialtyId);
  if (!specialty) return null;

  const levels = getLevelsForSystem(specialty);
  const [activeLevel, setActiveLevel] = useState(levels[0] || '');
  const [semester, setSemester] = useState<1 | 2>(1);
  const [activeSubSpec, setActiveSubSpec] = useState('');
  const [activeGroup, setActiveGroup] = useState('G1');
  const [showModal, setShowModal] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ day: string, slot: string } | null>(null);
  const [newEntry, setNewEntry] = useState({ moduleId: '', type: SessionType.COURS, room: '', groupId: '', teacherId: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Auto-clear success message after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Auto-clear error message after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    const levelSpecialtiesList = db.subSpecialties.filter(s => s.specialtyId === specialtyId && s.level === activeLevel);
    const subSpecNames = levelSpecialtiesList.map(s => s.name);
    if (subSpecNames.length > 0 && !subSpecNames.includes(activeSubSpec)) {
      setActiveSubSpec(subSpecNames[0]);
    } else if (subSpecNames.length === 0) {
      setActiveSubSpec('');
    }
  }, [activeLevel, db.subSpecialties, specialtyId]);

  const levelSpecialties = db.subSpecialties.filter(s => s.specialtyId === specialtyId && s.level === activeLevel);
  
  // Get existing groups for this level/specialty from students
  const levelStudents = db.users.filter(u => 
    u.role === UserRole.STUDENT && 
    u.specialtyId === specialtyId && 
    u.level === activeLevel &&
    (!activeSubSpec || u.subSpecialty === activeSubSpec)
  );
  const availableGroups = Array.from(new Set(levelStudents.map(s => s.groupId).filter(Boolean) as string[])).sort();
  if (availableGroups.length > 0 && !availableGroups.includes(activeGroup) && activeGroup !== 'Tous') {
    // Reset to first group if current group is invalid
    // But we might want a "Tous" option or just default to G1
  }

  const allLevelModules = db.modules.filter(m => 
    m.specialtyId === specialtyId && 
    m.level === activeLevel &&
    (!m.subSpecialty || m.subSpecialty === activeSubSpec)
  );

  const modules = allLevelModules.filter(m => m.semester === semester);

  const timetable = db.timetable.filter(t => {
    const m = db.modules.find(mod => mod.id === t.moduleId);
    
    // Direct match for this specialty
    if (t.specialtyId === specialtyId && t.level === activeLevel && t.semester === semester) {
      return (t.groupId === activeGroup || t.groupId === 'Tous' || !t.groupId) &&
             (!activeSubSpec || !m?.subSpecialty || m?.subSpecialty === activeSubSpec) &&
             (!activeSubSpec || t.subSpecialty === activeSubSpec);
    }

    return false;
  });
  const isEditing = Boolean(editingEntryId);
  const selectedModuleObj = allLevelModules.find(m => m.id === newEntry.moduleId);

  const availableAssignmentsForSelected = db.assignments.filter(a => a.moduleId === newEntry.moduleId && a.type === newEntry.type);
  const assignmentTeachers = Array.from(new Set(availableAssignmentsForSelected.map(a => a.teacherId)))
    .map(id => db.users.find(u => u.id === id))
    .filter(Boolean) as User[];

  // Allow selecting any teacher from the specialty in case you want to assign someone not already tied to the module via assignment.
  const specialtyTeachers = db.users.filter(u => u.role === UserRole.TEACHER && u.specialtyId === specialtyId);

  // If the current entry already has a teacher, include them too (even if they are not in assignments).
  const editingEntry = editingEntryId ? db.timetable.find(t => t.id === editingEntryId) : null;
  const currentAssignedTeacher = editingEntry ? db.users.find(u => u.id === editingEntry.teacherId) : null;

  const currentEntryTeacher = db.users.find(u => u.id === newEntry.teacherId);

  const availableTeachers = Array.from(new Set([ ...assignmentTeachers, ...specialtyTeachers, ...(currentEntryTeacher ? [currentEntryTeacher] : []), ...(currentAssignedTeacher ? [currentAssignedTeacher] : []) ])) as User[];
  const addEntry = async () => {
    setError('');
    try {
      if (!selectedCell) {
        setError("Erreur: Aucune cellule sélectionnée.");
        return;
      }
      if (!newEntry.moduleId) {
        setError("Veuillez sélectionner un module.");
        return;
      }
      if (!newEntry.room) {
        setError("Veuillez sélectionner une salle.");
        return;
      }

      if (levelSpecialties.length > 0 && !activeSubSpec) {
        setError("Veuillez d'abord sélectionner une spécialité.");
        return;
      }

      const finalGroupId = newEntry.groupId || activeGroup;
      const currentEntryId = editingEntryId;

      // Constraint: Check if room is occupied (across the whole university)
      // Allow sharing the same room at the same time only when it is truly the SAME session
      // (same module + same session type + same teacher) to support shared classes.
      const roomConflict = db.timetable.find(t => 
        t.id !== currentEntryId &&
        t.day === selectedCell.day && 
        t.timeSlot === selectedCell.slot && 
        t.room === newEntry.room &&
        t.semester === semester &&
        // Conflict if not the exact same session
        !(t.moduleId === newEntry.moduleId && t.type === newEntry.type && t.teacherId === (newEntry.teacherId || selectedTeacherId))
      );
      if (roomConflict) {
        const conflictMod = db.modules.find(m => m.id === roomConflict.moduleId);
        const conflictSpec = db.specialties.find(s => s.id === roomConflict.specialtyId);
        setError(`La salle ${newEntry.room} est déjà occupée par le module ${conflictMod?.name} (${conflictSpec?.name} - ${roomConflict.level} - ${roomConflict.groupId})`);
        return;
      }

      // Constraint: Check if teacher is already busy at this time in a DIFFERENT room
      // A teacher CANNOT be in two different rooms at the same time
      // But a teacher CAN teach the same module to multiple groups in the SAME room
      if (newEntry.teacherId) {
        const teacherConflict = db.timetable.find(t => {
          if (t.id === currentEntryId) return false;
          if (t.day !== selectedCell.day || t.timeSlot !== selectedCell.slot || t.semester !== semester) return false;
          if (t.teacherId !== newEntry.teacherId) return false;
          // OK if same room (shared session - same module+type+room for multiple groups)
          if (t.room === newEntry.room && t.moduleId === newEntry.moduleId && t.type === newEntry.type) return false;
          // CONFLICT if different room (teacher can't be in two places)
          return true;
        });
        if (teacherConflict) {
          const teacher = db.users.find(u => u.id === newEntry.teacherId);
          const conflictMod = db.modules.find(m => m.id === teacherConflict.moduleId);
          const conflictSpec = db.specialties.find(s => s.id === teacherConflict.specialtyId);
          setError(`L'enseignant ${teacher?.fullName} enseigne déjà à cette heure dans la salle ${teacherConflict.room}. Il est impossible qu'il soit dans deux salles différentes au même moment.`);
          return;
        }
      }

      // Constraint: Check if group is already busy (within this specialty and level)
      // Only check for actual conflicts (different subSpecialty or different group assignment)
      const groupConflict = db.timetable.find(t => 
        t.id !== currentEntryId &&
        t.specialtyId === specialtyId &&
        t.level === activeLevel &&
        t.semester === semester &&
        t.day === selectedCell.day && 
        t.timeSlot === selectedCell.slot && 
        t.groupId === finalGroupId &&
        // Only error if it's NOT the same module (groups can share same tronc commun module)
        t.moduleId !== newEntry.moduleId
      );
      if (groupConflict) {
        const conflictMod = db.modules.find(m => m.id === groupConflict.moduleId);
        const conflictRoom = db.timetable.find(t => t.id === groupConflict.id)?.room;
        const newRoom = newEntry.room;
        // Only show error if there's a real room/teacher conflict
        if (conflictRoom !== newRoom || newEntry.teacherId !== groupConflict.teacherId) {
          setError(`Conflit détecté: Un autre module est déjà assigné au groupe ${finalGroupId} à cette heure avec une configuration différente.`);
          return;
        }
      }

      const subSpec = db.subSpecialties.find(s => s.name === activeSubSpec && s.level === activeLevel && s.specialtyId === specialtyId);

      const availableAssignments = db.assignments.filter(a => a.moduleId === newEntry.moduleId && a.type === newEntry.type);
      // Do not auto-select a teacher: allow the agent to choose explicitly even if only one assignment exists.
      const selectedTeacherId = newEntry.teacherId || undefined;

      const entryId = editingEntryId || Date.now().toString();
      const newTimetableEntry: TimetableEntry = {
        id: entryId,
        specialtyId,
        subSpecialtyId: subSpec?.id,
        subSpecialty: activeSubSpec,
        level: activeLevel,
        semester,
        day: selectedCell.day,
        timeSlot: selectedCell.slot,
        moduleId: newEntry.moduleId,
        type: newEntry.type as SessionType,
        room: newEntry.room,
        groupId: finalGroupId,
        teacherId: selectedTeacherId || undefined
      };

      try {
        await supabaseService.saveTimetableEntry(newTimetableEntry);
        
        // Create notifications
        const affectedStudents = db.users.filter(u => 
          u.role === UserRole.STUDENT && 
          u.specialtyId === specialtyId && 
          u.level === activeLevel && 
          (finalGroupId === 'Tous' || u.groupId === finalGroupId)
        );
        
        const mod = db.modules.find(m => m.id === newEntry.moduleId);
        for (const s of affectedStudents) {
          await createNotification(s.id, `L'emploi du temps a été mis à jour : ${isEditing ? 'Modification' : 'Nouveau cours'} de ${mod?.name} (${newEntry.type}).`);
        }

        setDb(prev => ({ ...prev, timetable: editingEntryId ? prev.timetable.map(t => t.id === editingEntryId ? newTimetableEntry : t) : [...prev.timetable, newTimetableEntry] }));
        setSuccess(isEditing ? "Séance mise à jour avec succès !" : "Entrée ajoutée à l'emploi du temps avec succès !");
        setShowModal(false);
        setEditingEntryId(null);
      } catch (err: any) {
        setError(err.message || "Erreur lors de l'ajout à l'emploi du temps");
      }
    } catch (err: any) {
      console.error("Erreur lors de l'enregistrement:", err);
      setError(err.message || "Une erreur critique est survenue");
    }
  };

  return (
    <div className="space-y-6">
      <LevelFilterBar specialty={specialty} activeLevel={activeLevel} onLevelChange={setActiveLevel} />

      <div className="flex justify-between items-center no-print">
        <div>
          <h3 className="text-2xl font-bold text-slate-800">
            Emploi du Temps - {activeLevel}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[10px] font-bold uppercase">
              {activeSubSpec || 'Tronc Commun'}
            </span>
            <ChevronRight className="w-3 h-3 text-slate-300" />
            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase">
              {activeGroup}
            </span>
          </div>
        </div>
        <button onClick={() => window.print()} className="flex items-center gap-2 bg-slate-800 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-900 shadow-lg transition-all active:scale-95">
          <Printer className="w-5 h-5" />
          Imprimer EDT {activeGroup}
        </button>
      </div>

      <div className="flex flex-col gap-6 no-print">
        {error && !showModal && (
          <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center gap-3 text-sm font-medium animate-shake">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}
        {success && !showModal && (
          <div className="p-4 bg-green-50 border border-green-100 text-green-600 rounded-2xl flex items-center gap-3 text-sm font-medium animate-in fade-in slide-in-from-top-4 duration-500">
            <CheckCircle2 className="w-5 h-5" />
            {success}
          </div>
        )}
        <div className="flex flex-wrap gap-6 items-end">
          <div className="flex flex-wrap gap-6">
            {/* Semester Toggle */}
            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Semestre</p>
              <div className="flex p-1 bg-white border rounded-xl shadow-sm">
                <button onClick={() => setSemester(1)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${semester === 1 ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>S1</button>
                <button onClick={() => setSemester(2)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${semester === 2 ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>S2</button>
              </div>
            </div>

            {/* Specialty Filter */}
            {levelSpecialties.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Spécialité / Parcours</p>
                <div className="flex p-1 bg-white border rounded-xl shadow-sm">
                  {levelSpecialties.map(s => (
                    <button 
                      key={s.id}
                      onClick={() => { setActiveSubSpec(s.name); setActiveGroup('G1'); }}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeSubSpec === s.name ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {levelSpecialties.length === 0 && (
               <div className="flex flex-col gap-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Parcours</p>
                <div className="flex p-1 bg-white border rounded-xl shadow-sm">
                  <button className="px-4 py-2 rounded-lg text-sm font-bold bg-indigo-600 text-white shadow-md">Tronc Commun</button>
                </div>
              </div>
            )}

            {/* Group Filter */}
            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Groupe d'Étudiants</p>
              <div className="flex p-1 bg-white border rounded-xl shadow-sm overflow-x-auto max-w-[300px] scrollbar-hide">
                {availableGroups.length > 0 ? (
                  availableGroups.map(g => (
                    <button 
                      key={g}
                      onClick={() => setActiveGroup(g)}
                      className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${activeGroup === g ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                      {g}
                    </button>
                  ))
                ) : (
                  ['G1', 'G2', 'G3'].map(g => (
                    <button 
                      key={g}
                      onClick={() => setActiveGroup(g)}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeGroup === g ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                      {g}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-2xl border shadow-sm">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50">
              <th className="p-4 border text-xs font-bold uppercase text-slate-400 w-32">Jour / Heure</th>
              {SLOTS.map(s => <th key={s} className="p-4 border text-xs font-bold uppercase text-slate-500">{s}</th>)}
            </tr>
          </thead>
          <tbody>
            {DAYS.map(day => (
              <tr key={day}>
                <td className="p-4 border bg-slate-50 font-bold text-slate-700 text-sm">{day}</td>
                {SLOTS.map(slot => {
                  const entry = timetable.find(t => t.day === day && t.timeSlot === slot);
                  const module = entry ? db.modules.find(m => m.id === entry.moduleId) : null;
                  const assignment = entry ? db.assignments.find(a => a.moduleId === entry.moduleId && a.type === entry.type) : null;
                  const teacher = entry?.teacherId ? db.users.find(u => u.id === entry.teacherId) : null;

                  return (
                    <td 
                      key={slot} 
                      className={`p-2 border relative min-h-[100px] h-32 group cursor-pointer transition-colors ${entry ? 'bg-indigo-50/30' : 'hover:bg-slate-50'}`}
                      onClick={() => {
                        setError('');
                        if (!entry) {
                          if (levelSpecialties.length > 0 && !activeSubSpec) {
                            setError("Veuillez d'abord sélectionner une spécialité.");
                          }
                          setEditingEntryId(null);
                          setSelectedCell({ day, slot });
                          setNewEntry({ moduleId: '', type: SessionType.COURS, room: '', groupId: activeGroup, teacherId: '' });
                          setShowModal(true);
                        }
                      }}
                    >
                      {entry ? (
                        <div className="h-full flex flex-col justify-between">
                          <div className="flex justify-between items-start">
                            <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.5 rounded font-bold uppercase">{entry.type}</span>
                            <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-bold uppercase">{entry.room}</span>
                          </div>
                          <p className="text-sm font-bold text-indigo-900 leading-tight my-1">{module?.name}</p>
                          <div className="flex justify-between items-end">
                            <p className="text-[10px] text-slate-500 italic truncate flex-1">{teacher?.fullName || 'Poste Vacant'}</p>
                            <span className="text-[10px] font-bold text-indigo-400">{entry.groupId}</span>
                          </div>
                          <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-all no-print">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setError('');
                                setEditingEntryId(entry.id);
                                setSelectedCell({ day, slot });
                                setNewEntry({
                                  moduleId: entry.moduleId,
                                  type: entry.type,
                                  room: entry.room,
                                  groupId: entry.groupId,
                                  teacherId: ''
                                });
                                setShowModal(true);
                              }}
                              className="text-slate-300 hover:text-indigo-600"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button 
                              onClick={async (e) => {
                                e.stopPropagation();
                                if(window.confirm("Supprimer cette séance ?")) {
                                  try {
                                    await supabaseService.deleteTimetableEntry(entry.id);
                                    setDb(prev => ({ ...prev, timetable: prev.timetable.filter(t => t.id !== entry.id) }));
                                    setSuccess("Séance supprimée avec succès !");
                                  } catch (err: any) {
                                    setError("Erreur lors de la suppression");
                                  }
                                }
                              }}
                              className="text-slate-300 hover:text-rose-500"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center opacity-0 group-hover:opacity-100 no-print">
                           <Plus className="w-5 h-5 text-slate-300" />
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-1">{isEditing ? 'Modifier' : 'Programmer'} - {activeLevel}</h3>
            <p className="text-slate-400 text-sm mb-6">{selectedCell?.day} - {selectedCell?.slot}</p>
            {error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl flex items-center gap-2 text-sm font-medium animate-shake">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Module</label>
                <select 
                  className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white" 
                  value={newEntry.moduleId} 
                  onChange={e => {
                    const mId = e.target.value;
                    const m = allLevelModules.find(mod => mod.id === mId);
                    let defaultType = SessionType.COURS;
                    if (m) {
                      if (m.hasCours) defaultType = SessionType.COURS;
                      else if (m.hasTD) defaultType = SessionType.TD;
                      else if (m.hasTP) defaultType = SessionType.TP;
                    }
                    
                    setNewEntry({...newEntry, moduleId: mId, type: defaultType, teacherId: ''});
                  }}
                >
                  <option value="">Sélectionner un module</option>
                  {modules.length === 0 ? (
                    <option disabled>Aucun module trouvé pour ce semestre</option>
                  ) : (
                    modules.sort((a, b) => a.name.localeCompare(b.name)).map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name} {m.subSpecialty ? `[${m.subSpecialty}]` : (levelSpecialties.length === 0 ? '[Tronc Commun]' : '')}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Type</label>
                  <select 
                    className="w-full px-4 py-2 border rounded-lg outline-none" 
                    value={newEntry.type} 
                    onChange={e => {
                      const newType = e.target.value as SessionType;
                      setNewEntry({...newEntry, type: newType, teacherId: ''});
                    }}
                    disabled={!newEntry.moduleId}
                  >
                    {!newEntry.moduleId && <option value="">Choisir un module</option>}
                    {selectedModuleObj?.hasCours && <option value={SessionType.COURS}>Cours</option>}
                    {selectedModuleObj?.hasTD && <option value={SessionType.TD}>TD</option>}
                    {selectedModuleObj?.hasTP && <option value={SessionType.TP}>TP</option>}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Enseignant</label>
                  <select
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    value={newEntry.teacherId}
                    onChange={e => setNewEntry({...newEntry, teacherId: e.target.value})}
                    disabled={!newEntry.moduleId || !newEntry.type || availableTeachers.length === 0}
                  >
                    <option value="">Sélectionner un enseignant</option>
                    {availableTeachers.map(t => (
                      <option key={t.id} value={t.id}>{t.fullName}</option>
                    ))}
                    {availableTeachers.length === 0 && (
                      <option value="" disabled>Aucun enseignant assigné pour ce module/type</option>
                    )}
                  </select>
                  {editingEntryId && currentAssignedTeacher && (
                    <p className="text-[10px] text-slate-500 mt-2">Actuellement: <span className="font-semibold text-slate-700">{currentAssignedTeacher.fullName}</span></p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Salle</label>
                  <select 
                    className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white" 
                    value={newEntry.room} 
                    onChange={e => setNewEntry({...newEntry, room: e.target.value})}
                  >
                    <option value="">Sélectionner une salle</option>
                    {(db.rooms || []).map(r => (
                      <option key={r.id} value={r.name}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={() => {
                  setShowModal(false);
                  setEditingEntryId(null);
                }} className="flex-1 px-4 py-2 border rounded-lg font-medium">Annuler</button>
                <button onClick={addEntry} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium">{isEditing ? 'Mettre à jour' : 'Enregistrer'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const ValidationManager = ({ specialtyId, viewParams, setViewParams }: { specialtyId: string, viewParams?: any, setViewParams: (p: any) => void }) => {
  const { db, setDb } = useDB();
  const specialty = db.specialties.find(s => s.id === specialtyId);
  if (!specialty) return null;

  const levels = getLevelsForSystem(specialty);
  const [activeLevel, setActiveLevel] = useState(levels[0] || '');
  const [activeSubSpec, setActiveSubSpec] = useState('');

  const [view, setView] = useState<'grades' | 'registration' | 'history' | 'rooms'>(viewParams?.tab || 'grades');
  const [selectedStudentHistory, setSelectedStudentHistory] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'danger' | 'info';
  } | null>(null);

  const [approvingStudent, setApprovingStudent] = useState<string | null>(null);
  const [selectingNextLevelSpec, setSelectingNextLevelSpec] = useState(false);

  const levelSpecialties = db.subSpecialties.filter(s => s.specialtyId === specialtyId && s.level === activeLevel);

  // Get specialties for the next level when approving a student
  const getNextLevelSpecialties = (studentId: string): typeof db.subSpecialties => {
    const student = db.users.find(u => u.id === studentId);
    if (!student) return [];
    
    const studentHistories = db.academicHistories.filter(h => h.userId === studentId);
    const studentHistory = studentHistories.length > 0 ? studentHistories[studentHistories.length - 1] : null;
    const isAdmitted = studentHistory?.status === 'ADMIS';
    
    // If no history yet but we're passing, admin can still approve
    if (!studentHistory) return [];
    if (!isAdmitted) return []; // No advanced level for ajourné students
    
    const allLevels = getLevelsForSystem(specialty);
    const currentLevelIdx = allLevels.indexOf(student.level || '');
    if (currentLevelIdx >= 0 && currentLevelIdx < allLevels.length - 1) {
      const nextLevel = allLevels[currentLevelIdx + 1];
      return db.subSpecialties.filter(s => s.specialtyId === specialtyId && s.level === nextLevel);
    }
    return [];
  };

  // Get the next level for a student
  const getNextLevel = (studentId: string): string | null => {
    const student = db.users.find(u => u.id === studentId);
    if (!student) return null;
    
    const allLevels = getLevelsForSystem(specialty);
    const currentLevelIdx = allLevels.indexOf(student.level || '');
    if (currentLevelIdx >= 0 && currentLevelIdx < allLevels.length - 1) {
      return allLevels[currentLevelIdx + 1];
    }
    return null;
  };

  // Calculate module average based on module configuration
  const calculateModuleAverage = (grade: Grade | undefined, moduleId?: string): number => {
    if (!grade) return 0;
    
    const module = moduleId ? db.modules.find(m => m.id === moduleId) : null;
    if (!module) {
      // Fallback: use presence of grades
      const examScore = Math.max(grade.cours || 0, grade.rattrapage || 0);
      const hasTD = grade.td !== null && grade.td !== undefined && grade.td > 0;
      const hasTP = grade.tp !== null && grade.tp !== undefined && grade.tp > 0;
      
      if (!hasTD && !hasTP) {
        return examScore;
      } else if (hasTD && !hasTP) {
        return (examScore * 0.75) + ((grade.td || 0) * 0.25);
      } else if (!hasTD && hasTP) {
        return (examScore * 0.75) + ((grade.tp || 0) * 0.25);
      } else {
        return (examScore * 0.6) + ((grade.td || 0) * 0.2) + ((grade.tp || 0) * 0.2);
      }
    }
    
    const examScore = Math.max(grade.cours || 0, grade.rattrapage || 0);
    
    // If module has only exam, return exam score
    if (!module.hasTD && !module.hasTP) {
      return module.hasCours ? examScore : 0;
    }
    
    // Calculate CC average for components that exist in the module
    let ccSum = 0;
    let ccCount = 0;
    if (module.hasTD) { ccSum += grade.td || 0; ccCount++; }
    if (module.hasTP) { ccSum += grade.tp || 0; ccCount++; }
    const ccAvg = ccCount > 0 ? ccSum / ccCount : 0;
    
    // Module has both exam and CC components
    if (module.hasCours) {
      return (examScore * 0.6) + (ccAvg * 0.4);
    }
    
    // Module has only CC components
    return ccAvg;
  };

  const modules = db.modules.filter(m => 
    m.specialtyId === specialtyId && 
    m.level === activeLevel &&
    (!m.subSpecialty || m.subSpecialty === activeSubSpec)
  );
  
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Auto-clear error message after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Auto-clear success message after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const approveGrades = async (moduleId: string, studentId?: string) => {
    setError(null);
    setSuccess(null);
    const gradesToApprove = db.grades.filter(g => g.moduleId === moduleId && (!studentId || g.studentId === studentId));
    
    try {
      const approvedGrades = gradesToApprove.map(g => ({ ...g, approved: true }));
      
      for (const g of approvedGrades) {
        await supabaseService.saveGrade(g);
      }
      
      // Update local state immediately - no refresh needed
      setDb(prev => ({
        ...prev,
        grades: prev.grades.map(g => 
          approvedGrades.some(ag => ag.id === g.id) ? { ...g, approved: true } : g
        )
      }));
      
      setSuccess(`Module approuvé avec succès`);
    } catch (err: any) {
      setError("Erreur lors de la validation des notes");
    }
  };

  const approveStudentRegistration = async (studentId: string, subSpecName?: string) => {
    setError(null);
    setSuccess(null);
    const userToApprove = db.users.find(u => u.id === studentId);
    
    if (!userToApprove) return;

    // L'approbation d'inscription valide juste l'année courante
    // L'avancement de niveau se fait VIA startNewAcademicYear, pas ici

    const updatedUser = { 
      ...userToApprove, 
      isApprovedForYear: true,
      subSpecialty: subSpecName || userToApprove.subSpecialty,
      subSpecialtyId: subSpecName ? db.subSpecialties.find(s => s.name === subSpecName && s.level === userToApprove.level && s.specialtyId === specialtyId)?.id : userToApprove.subSpecialtyId
    };
    
    try {
      await supabaseService.saveUser(updatedUser);
      // Update local state immediately - no refresh needed
      setDb(prev => ({
        ...prev,
        users: prev.users.map(u => u.id === studentId ? updatedUser : u)
      }));
      
      setSuccess(`Inscription de ${userToApprove.fullName} validée pour ${userToApprove.level} !`);
      await createNotification(studentId, `Votre inscription administrative a été validée pour ${userToApprove.level}. Vous avez maintenant accès à votre espace.`);
      setApprovingStudent(null);
      setSelectingNextLevelSpec(false);
    } catch (err: any) {
      setError("Erreur lors de la validation de l'inscription");
    }
  };

  const startNewAcademicYear = () => {
    // Check if all S2 modules are approved
    const s2Modules = db.modules.filter(m => m.specialtyId === specialtyId && m.semester === 2);
    const unapprovedS2 = s2Modules.filter(m => {
      const moduleGrades = db.grades.filter(g => g.moduleId === m.id);
      return moduleGrades.length === 0 || !moduleGrades.every(g => g.approved);
    });

    if (unapprovedS2.length > 0) {
      setConfirmModal({
        title: "Validation Requise",
        message: `Impossible de passer à une nouvelle année : les modules suivants du S2 ne sont pas validés : ${unapprovedS2.map(m => m.name).join(', ')}. Veuillez valider toutes les notes du S2 d'abord.`,
        type: 'danger',
        onConfirm: () => setConfirmModal(null)
      });
      return;
    }

    const currentYear = db.currentAcademicYear;
    const [start, end] = currentYear.split('-').map(Number);
    const nextYear = `${start + 1}-${end + 1}`;

    setConfirmModal({
      title: "Nouvelle Année Académique",
      message: `Êtes-vous sûr de vouloir passer à l'année ${nextYear} ? Cela calculera les résultats, archivera l'historique et réinitialisera les inscriptions.`,
      type: 'danger',
      onConfirm: () => {
        const students = db.users.filter(u => u.role === UserRole.STUDENT && u.specialtyId === specialtyId);
        const newAcademicHistories = [...db.academicHistories];
        const updatedUsers = [...db.users];
        
        students.forEach(student => {
          const studentGrades = db.grades.filter(g => g.studentId === student.id);
          const studentModules = db.modules.filter(m => m.specialtyId === specialtyId && m.level === student.level);
          
          if (studentModules.length === 0) return;

          let totalWeightedGrade = 0;
          let totalCoeff = 0;
          let s1Weighted = 0;
          let s1Coeff = 0;
          let s2Weighted = 0;
          let s2Coeff = 0;

          const academicHistoryId = Date.now().toString() + student.id + Math.random().toString(36).substr(2, 5);
          const moduleGrades: ModuleGradeRecord[] = [];

          let totalAcquiredCredits = 0;

          studentModules.forEach(m => {
            const grade = studentGrades.find(g => g.moduleId === m.id);
            const val = calculateModuleAverage(grade, m.id);

            // Count credits for modules with grade >= 10 (acquired)
            if (val >= 10) {
              totalAcquiredCredits += m.credits;
            }

            moduleGrades.push({
              id: Math.random().toString(36).substr(2, 9),
              academicHistoryId: academicHistoryId,
              moduleId: m.id,
              moduleName: m.name,
              cours: grade?.cours,
              td: grade?.td,
              tp: grade?.tp,
              rattrapage: grade?.rattrapage,
              average: val,
              coefficient: m.coefficient,
              semester: m.semester
            });

            totalWeightedGrade += val * m.coefficient;
            totalCoeff += m.coefficient;

            if (m.semester === 1) {
              s1Weighted += val * m.coefficient;
              s1Coeff += m.coefficient;
            } else {
              s2Weighted += val * m.coefficient;
              s2Coeff += m.coefficient;
            }
          });

          const annualAvg = totalCoeff > 0 ? totalWeightedGrade / totalCoeff : 0;
          const s1Avg = s1Coeff > 0 ? s1Weighted / s1Coeff : 0;
          const s2Avg = s2Coeff > 0 ? s2Weighted / s2Coeff : 0;
          const threshold = specialty.creditThreshold || 30;

          let status = 'AJOURNÉ';
          if (annualAvg >= 10) {
            status = 'ADMIS';
          } else if (totalAcquiredCredits >= threshold) {
            status = 'ADMIS_AVEC_DETTE';
          }

          newAcademicHistories.push({
            id: academicHistoryId,
            userId: student.id,
            year: currentYear,
            level: student.level || '',
            specialtyId: specialtyId,
            subSpecialtyId: student.subSpecialtyId,
            semester1Avg: s1Avg,
            semester2Avg: s2Avg,
            annualAvg: annualAvg,
            status: status,
            moduleGrades
          });

          const userIdx = updatedUsers.findIndex(u => u.id === student.id);
          if (userIdx !== -1) {
            const currentLevels = getLevelsForSystem(specialty);
            const currentLevelIdx = currentLevels.indexOf(student.level || '');
            
            const isAdmis = (status === 'ADMIS' || status === 'ADMIS_AVEC_DETTE');
            if (isAdmis && currentLevelIdx < currentLevels.length - 1) {
              updatedUsers[userIdx].level = currentLevels[currentLevelIdx + 1];
            }
            updatedUsers[userIdx].isApprovedForYear = false;
            updatedUsers[userIdx].groupId = undefined;
            updatedUsers[userIdx].subSpecialty = undefined;
            updatedUsers[userIdx].subSpecialtyId = undefined;
          }
        });

        const updated = { 
          ...db, 
          users: updatedUsers, 
          academicHistories: newAcademicHistories,
          grades: [], 
          timetable: [], 
          assignments: [],
          currentSemester: 1 as 1 | 2,
          currentAcademicYear: nextYear
        };
        setDb(updated);
        setConfirmModal(null);
      }
    });
  };

  const switchSemester = () => {
    if (db.currentSemester === 2) return;
    
    // Check if all S1 modules are approved
    const s1Modules = db.modules.filter(m => m.specialtyId === specialtyId && m.semester === 1);
    const unapprovedS1 = s1Modules.filter(m => {
      const moduleGrades = db.grades.filter(g => g.moduleId === m.id);
      return moduleGrades.length === 0 || !moduleGrades.every(g => g.approved);
    });

    if (unapprovedS1.length > 0) {
      setConfirmModal({
        title: "Validation Requise",
        message: `Impossible de passer au S2 : les modules suivants du S1 ne sont pas validés : ${unapprovedS1.map(m => m.name).join(', ')}. Veuillez valider toutes les notes du S1 d'abord.`,
        type: 'danger',
        onConfirm: () => setConfirmModal(null)
      });
      return;
    }
    
    setConfirmModal({
      title: "Changement de Semestre",
      message: `Voulez-vous passer au Semestre 2 ? Cela modifiera l'affichage des notes et de l'emploi du temps pour tous les utilisateurs.`,
      type: 'info',
      onConfirm: () => {
        const updated = { ...db, currentSemester: 2 as 1 | 2 };
        setDb(updated);
        setConfirmModal(null);
      }
    });
  };

  useEffect(() => {
    if (viewParams?.tab) {
        setView(viewParams.tab);
        // Clear params after consuming
        setViewParams(null);
    }
  }, [viewParams]);

  return (
    <div className="space-y-6">
       {error && (
         <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg flex items-center gap-2">
           <AlertCircle className="w-5 h-5" />
           {error}
         </div>
       )}
       <LevelFilterBar specialty={specialty} activeLevel={activeLevel} onLevelChange={setActiveLevel} />

       <ParcoursFilter 
        specialty={specialty} 
        activeLevel={activeLevel} 
        activeSubSpec={activeSubSpec} 
        onSubSpecChange={setActiveSubSpec} 
      />

       <div className="flex gap-4 border-b items-center justify-between">
         <div className="flex gap-4">
           <button onClick={() => setView('grades')} className={`pb-2 px-4 font-bold text-sm transition-all ${view === 'grades' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-400'}`}>Validation des Notes</button>
           <button onClick={() => setView('registration')} className={`pb-2 px-4 font-bold text-sm transition-all ${view === 'registration' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-400'}`}>Inscriptions Administratives</button>
           <button onClick={() => setView('history')} className={`pb-2 px-4 font-bold text-sm transition-all ${view === 'history' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-400'}`}>Historique & Cursus</button>
           <button onClick={() => setView('rooms')} className={`pb-2 px-4 font-bold text-sm transition-all ${view === 'rooms' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-400'}`}>Gestion des Salles</button>
         </div>
         <div className="flex items-center gap-3">
           <div className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100">
             <span className="text-[10px] font-bold text-indigo-400 uppercase">Semestre Actuel:</span>
             <span className="text-sm font-black text-indigo-700">S{db.currentSemester}</span>
             {db.currentSemester === 1 && (
               <button 
                  onClick={switchSemester}
                  className="ml-2 text-[10px] font-bold bg-indigo-600 text-white px-2 py-1 rounded-lg hover:bg-indigo-700 transition-all"
               >
                  Aller au S2
               </button>
             )}
           </div>
           {db.currentSemester === 2 && (
             <button 
               onClick={startNewAcademicYear}
               className="flex items-center gap-2 bg-rose-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-rose-700 shadow-sm transition-all"
             >
               <Calendar className="w-4 h-4" />
               Nouvelle Année Académique
             </button>
           )}
         </div>
       </div>

       {view === 'grades' ? (
         <>
           <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-4">
             <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
             <div>
               <h4 className="font-bold text-amber-800">Processus de Validation - {activeLevel}</h4>
               <p className="text-sm text-amber-700">La validation verrouille les notes pour les enseignants.</p>
             </div>
           </div>

           <div className="space-y-8">
             {[1, 2].map(sem => {
               const semModules = modules.filter(m => m.semester === sem);
               return (
                 <div key={sem} className="space-y-4">
                   <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                     <span className="w-1.5 h-4 bg-amber-400 rounded-full"></span>
                     Semestre {sem}
                   </h4>
                   <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
                     <table className="w-full">
                       <thead className="bg-slate-50 border-b">
                         <tr>
                           <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-500">Module</th>
                           <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-500">État de Saisie</th>
                           <th className="px-6 py-4 text-center text-xs font-bold uppercase text-slate-500">Action</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y">
                         {semModules.map(m => {
                           const moduleGrades = db.grades.filter(g => g.moduleId === m.id);
                           const isApproved = moduleGrades.length > 0 && moduleGrades.every(g => g.approved);
                           const isExpanded = expandedModule === m.id;

                           return (
                             <React.Fragment key={m.id}>
                               <tr className="hover:bg-slate-50/50 transition-colors cursor-pointer" onClick={() => setExpandedModule(isExpanded ? null : m.id)}>
                                 <td className="px-6 py-4">
                                   <div className="flex items-center gap-2">
                                     {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                                     <span className="font-bold text-slate-700">{m.name}</span>
                                   </div>
                                 </td>
                                 <td className="px-6 py-4">
                                   {moduleGrades.length > 0 ? (
                                     <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${isApproved ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                       {isApproved ? 'Validé' : `${moduleGrades.filter(g => g.approved).length}/${moduleGrades.length} Approuvés`}
                                     </span>
                                   ) : (
                                     <span className="text-slate-400 text-xs italic">Aucune note saisie</span>
                                   )}
                                 </td>
                                 <td className="px-6 py-4 text-center">
                                   <button 
                                     onClick={(e) => { e.stopPropagation(); approveGrades(m.id); }}
                                     disabled={isApproved || moduleGrades.length === 0}
                                     className="flex items-center gap-2 mx-auto bg-slate-800 text-white px-4 py-2 rounded-lg text-xs font-bold disabled:opacity-30 hover:bg-slate-900 transition-all"
                                   >
                                     <ShieldCheck className="w-3.5 h-3.5" />
                                     Tout Approuver
                                   </button>
                                 </td>
                               </tr>
                               {isExpanded && (
                                 <tr>
                                   <td colSpan={3} className="px-6 py-4 bg-slate-50/50">
                                     <div className="space-y-2">
                                       {db.users.filter(u => u.role === UserRole.STUDENT && u.specialtyId === specialtyId && u.level === activeLevel && (!activeSubSpec || u.subSpecialty === activeSubSpec)).map(student => {
                                         const grade = db.grades.find(g => g.studentId === student.id && g.moduleId === m.id);
                                         if (!grade) return null;
                                         return (
                                           <div key={student.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                                             <div className="flex flex-col">
                                               <span className="font-bold text-sm text-slate-800">{student.fullName}</span>
                                               <div className="flex gap-3 text-[10px] text-slate-500 font-medium">
                                                 {m.hasCours && <span>Exam: <b className="text-slate-700">{grade.cours ?? '-'}</b></span>}
                                                 {m.hasTD && <span>TD: <b className="text-slate-700">{grade.td ?? '-'}</b></span>}
                                                 {m.hasTP && <span>TP: <b className="text-slate-700">{grade.tp ?? '-'}</b></span>}
                                                 {grade.rattrapage !== undefined && <span>Ratt: <b className="text-rose-600">{grade.rattrapage}</b></span>}
                                               </div>
                                             </div>
                                             <div className="flex items-center gap-4">
                                               <div className="text-right">
                                                 <p className="text-[10px] font-bold text-slate-400 uppercase">Moyenne</p>
                                                 <p className="text-sm font-black text-indigo-600">
                                                   {(() => {
                                                     const exam = Math.max(grade.cours || 0, grade.rattrapage || 0);
                                                     let sum = 0, parts = 0;
                                                     if (m.hasCours) { sum += exam * 0.6; parts += 0.6; }
                                                     let ccSum = 0, ccCount = 0;
                                                     if (m.hasTD) { ccSum += grade.td || 0; ccCount++; }
                                                     if (m.hasTP) { ccSum += grade.tp || 0; ccCount++; }
                                                     if (ccCount > 0) { sum += (ccSum / ccCount) * 0.4; parts += 0.4; }
                                                     return (parts > 0 ? sum / parts : 0).toFixed(2);
                                                   })()}
                                                 </p>
                                               </div>
                                               {grade.approved ? (
                                                 <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-1 rounded font-bold uppercase">Approuvé</span>
                                               ) : (
                                                 <button 
                                                   onClick={() => approveGrades(m.id, student.id)}
                                                   className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-indigo-700 transition-all"
                                                 >
                                                   Approuver
                                                 </button>
                                               )}
                                             </div>
                                           </div>
                                         );
                                       })}
                                     </div>
                                   </td>
                                 </tr>
                               )}
                             </React.Fragment>
                           );
                         })}
                         {semModules.length === 0 && <tr><td colSpan={3} className="p-8 text-center text-slate-400 italic text-sm">Aucun module pour ce semestre.</td></tr>}
                       </tbody>
                     </table>
                   </div>
                 </div>
               );
             })}
           </div>
         </>
       ) : view === 'registration' ? (
         <div className="space-y-4">
           <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl flex items-start gap-4">
             <Info className="w-6 h-6 text-indigo-600 shrink-0" />
             <div>
               <h4 className="font-bold text-indigo-800">Inscriptions Administratives - {activeLevel}</h4>
               <p className="text-sm text-indigo-700">Validez les inscriptions pour permettre aux étudiants d'accéder à leur espace.</p>
             </div>
           </div>
           {success && (
             <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl flex items-center gap-3 text-sm font-medium animate-in fade-in slide-in-from-top-4 duration-500">
               <CheckCircle2 className="w-5 h-5" />
               {success}
             </div>
           )}
           {error && (
             <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center gap-3 text-sm font-medium animate-shake">
               <AlertCircle className="w-5 h-5" />
               {error}
             </div>
           )}
           <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
             <table className="w-full">
               <thead className="bg-slate-50 border-b">
                 <tr>
                   <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-500">Étudiant</th>
                   <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-500">Groupe</th>
                   <th className="px-6 py-4 text-center text-xs font-bold uppercase text-slate-500">État</th>
                   <th className="px-6 py-4 text-center text-xs font-bold uppercase text-slate-500">Action</th>
                 </tr>
               </thead>
               <tbody className="divide-y">
                 {db.users.filter(u => u.role === UserRole.STUDENT && u.specialtyId === specialtyId && u.level === activeLevel && (!activeSubSpec || u.subSpecialty === activeSubSpec)).map(s => (
                   <tr key={s.id}>
                     <td className="px-6 py-4 font-bold text-slate-700">{s.fullName}</td>
                     <td className="px-6 py-4 text-slate-500">{s.groupId}</td>
                     <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${s.isApprovedForYear ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {s.isApprovedForYear ? 'Inscrit' : 'En attente'}
                        </span>
                     </td>
                     <td className="px-6 py-4 text-center">
                       {!s.isApprovedForYear && (
                         <button 
                            onClick={() => setApprovingStudent(s.id)}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-indigo-700"
                          >
                           Valider Inscription
                         </button>
                       )}
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
         </div>
       ) : view === 'history' ? (
         <div className="space-y-6">
            <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
              <table className="w-full">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-500">Étudiant</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-500">Niveau Actuel</th>
                    <th className="px-6 py-4 text-center text-xs font-bold uppercase text-slate-500">Années Validées</th>
                    <th className="px-6 py-4 text-center text-xs font-bold uppercase text-slate-500">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {db.users.filter(u => u.role === UserRole.STUDENT && u.specialtyId === specialtyId).map(s => (
                    <tr key={s.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-bold text-slate-700">{s.fullName}</td>
                      <td className="px-6 py-4 text-slate-500">{s.level}</td>
                      <td className="px-6 py-4 text-center font-bold text-indigo-600">
                        {db.academicHistories.filter(h => h.userId === s.id).length}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button 
                            onClick={() => setSelectedStudentHistory(s.id)}
                            className="text-indigo-600 hover:text-indigo-800 font-bold text-xs flex items-center gap-1 mx-auto"
                        >
                            <Search className="w-3.5 h-3.5" />
                            Voir Cursus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
         </div>
       ) : (
         <RoomManager specialtyId={specialtyId} />
       )}

      {approvingStudent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
            {selectingNextLevelSpec ? (
              <>
                <h3 className="text-2xl font-bold mb-2">Choisir une Spécialité</h3>
                <p className="text-slate-500 mb-6 text-sm">Ce niveau a plusieurs parcours. Sélectionnez celui pour l'étudiant:</p>
                <div className="space-y-3">
                  {levelSpecialties.map(spec => (
                    <button 
                      key={spec.id}
                      onClick={() => approveStudentRegistration(approvingStudent, spec.name)}
                      className="w-full p-4 text-left border-2 border-slate-200 rounded-2xl hover:border-indigo-500 hover:bg-indigo-50 transition-all font-bold text-slate-700 flex justify-between items-center group"
                    >
                      <span>{spec.name}</span>
                      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-all" />
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-4">Valider Inscription Administrative</h3>
                  
                  {(() => {
                    const student = db.users.find(u => u.id === approvingStudent);
                    const studentHistories = db.academicHistories.filter(h => h.userId === approvingStudent);
                    const studentHistory = studentHistories.length > 0 ? studentHistories[studentHistories.length - 1] : null;
                    
                    return (
                      <>
                        {/* Current student info */}
                        <div className="bg-slate-50 p-4 rounded-2xl mb-4 border border-slate-200">
                          <p className="text-xs text-slate-500 uppercase font-bold mb-1">Étudiant</p>
                          <p className="font-bold text-slate-800">{student?.fullName}</p>
                          <p className="text-sm text-slate-600 mt-1">Niveau: <strong>{student?.level}</strong></p>
                          <p className="text-sm text-slate-600">Année: <strong>{db.currentAcademicYear}</strong></p>
                        </div>

                        {/* Result status if available */}
                        {studentHistory && (
                          <div className={`p-4 rounded-2xl border mb-4 ${
                            studentHistory?.status === 'ADMIS' ? 'bg-emerald-50 border-emerald-200' : 
                            studentHistory?.status === 'ADMIS_AVEC_DETTE' ? 'bg-amber-50 border-amber-200' :
                            'bg-rose-50 border-rose-200'
                          }`}>
                            <div className={`flex items-center gap-3 ${
                              studentHistory?.status === 'ADMIS' ? 'text-emerald-700' : 
                              studentHistory?.status === 'ADMIS_AVEC_DETTE' ? 'text-amber-700' :
                              'text-rose-700'
                            }`}>
                              {studentHistory?.status === 'ADMIS' ? (
                                <>
                                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                                  <div>
                                    <p className="font-bold text-sm">Résultat: ADMIS</p>
                                    <p className="text-xs opacity-75">Moyenne: {(studentHistory?.annualAvg || 0).toFixed(2)}/20</p>
                                  </div>
                                </>
                              ) : studentHistory?.status === 'ADMIS_AVEC_DETTE' ? (
                                <>
                                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                  <div>
                                    <p className="font-bold text-sm">Résultat: ADMIS AVEC DETTE</p>
                                    <p className="text-xs opacity-75">Moyenne: {(studentHistory?.annualAvg || 0).toFixed(2)}/20</p>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                  <div>
                                    <p className="font-bold text-sm">Résultat: AJOURNÉ</p>
                                    <p className="text-xs opacity-75">Moyenne: {(studentHistory?.annualAvg || 0).toFixed(2)}/20</p>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        )}

                        <p className="text-slate-600 text-sm mb-2">Validez l'inscription de cet étudiant pour l'année <strong>{db.currentAcademicYear}</strong> ?</p>
                        {levelSpecialties.length > 0 && (
                          <p className="text-slate-500 text-xs bg-blue-50 border border-blue-200 p-2 rounded-lg">⚠ Vous devez choisir une spécialité pour ce niveau</p>
                        )}
                      </>
                    );
                  })()}
                </div>

                <button 
                  onClick={() => {
                    if (levelSpecialties.length > 0) {
                      setSelectingNextLevelSpec(true);
                    } else {
                      approveStudentRegistration(approvingStudent);
                    }
                  }}
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg"
                >
                  Confirmer l'Approbation
                </button>
              </>
            )}
            
            <button 
              onClick={() => {
                setApprovingStudent(null);
                setSelectingNextLevelSpec(false);
              }}
              className="w-full mt-4 py-3 text-slate-400 font-bold hover:text-slate-600 transition-all"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {confirmModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 ${confirmModal.type === 'danger' ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'}`}>
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold mb-2">{confirmModal.title}</h3>
            <p className="text-slate-500 mb-8 leading-relaxed">{confirmModal.message}</p>
            <div className="flex gap-4">
              <button 
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-3 px-4 border rounded-2xl font-bold text-slate-400 hover:bg-slate-50 transition-all"
              >
                Annuler
              </button>
              <button 
                onClick={confirmModal.onConfirm}
                className={`flex-1 py-3 px-4 rounded-2xl font-bold text-white shadow-lg transition-all active:scale-95 ${confirmModal.type === 'danger' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedStudentHistory && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-3xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl relative">
                <button onClick={() => setSelectedStudentHistory(null)} className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-all">
                    <Plus className="w-6 h-6 rotate-45 text-slate-400" />
                </button>
                
                {(() => {
                    const student = db.users.find(u => u.id === selectedStudentHistory);
                    if (!student) return null;
                    const studentModules = db.modules.filter(m => m.specialtyId === student.specialtyId && m.level === student.level);
                    return (
                        <div className="space-y-8">
                            <div className="border-b pb-6">
                                <h3 className="text-2xl font-bold text-slate-800">{student.fullName}</h3>
                                <p className="text-slate-500">Cursus Académique Complet</p>
                            </div>

                            <div className="space-y-6">
                                {/* Current Year Data */}
                                {(() => {
                                    const studentGrades = db.grades.filter(g => g.studentId === student.id);
                                    
                                    if (studentModules.length === 0) return null;

                                    const currentModuleGrades: ModuleGradeRecord[] = studentModules.map(m => {
                                        const g = studentGrades.find(grade => grade.moduleId === m.id);
                                        const avg = g ? (((g.cours || 0) * 0.6) + ((g.td || 0) * 0.2) + ((g.tp || 0) * 0.2)) : 0;
                                        return {
                                            moduleId: m.id,
                                            moduleName: m.name,
                                            cours: g?.cours,
                                            td: g?.td,
                                            tp: g?.tp,
                                            rattrapage: g?.rattrapage,
                                            average: avg,
                                            coefficient: m.coefficient,
                                            semester: m.semester
                                        };
                                    });

                                    const s1Modules = currentModuleGrades.filter(mg => mg.semester === 1);
                                    const s2Modules = currentModuleGrades.filter(mg => mg.semester === 2);
                                    
                                    const calcAvg = (mgs: ModuleGradeRecord[]) => {
                                        const totalWeighted = mgs.reduce((acc, mg) => acc + (mg.average * mg.coefficient), 0);
                                        const totalCoeff = mgs.reduce((acc, mg) => acc + mg.coefficient, 0);
                                        return totalCoeff > 0 ? totalWeighted / totalCoeff : 0;
                                    };

                                    const s1Avg = calcAvg(s1Modules);
                                    const s2Avg = calcAvg(s2Modules);
                                    const annualAvg = calcAvg(currentModuleGrades);

                                    return (
                                        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 ring-2 ring-indigo-500/20">
                                            <div className="flex justify-between items-center mb-6">
                                                <div>
                                                    <h4 className="text-lg font-bold text-indigo-900">{db.currentAcademicYear}</h4>
                                                    <p className="text-xs text-indigo-500 uppercase font-bold">{student.level} (Année en cours)</p>
                                                </div>
                                                <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-indigo-100 text-indigo-700">
                                                    En cours
                                                </span>
                                            </div>
                                            
                                            <div className="grid grid-cols-3 gap-4 mb-6">
                                                <div className="bg-white p-3 rounded-xl border text-center">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">S1</p>
                                                    <p className="text-lg font-bold text-indigo-600">{s1Avg.toFixed(2)}</p>
                                                </div>
                                                <div className="bg-white p-3 rounded-xl border text-center">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">S2</p>
                                                    <p className="text-lg font-bold text-indigo-600">{s2Avg.toFixed(2)}</p>
                                                </div>
                                                <div className="bg-white p-3 rounded-xl border text-center">
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase">Annuel</p>
                                                    <p className="text-lg font-bold text-indigo-600">{annualAvg.toFixed(2)}</p>
                                                </div>
                                            </div>

                                            <div className="border-t border-indigo-100 pt-4">
                                                <p className="text-xs font-bold text-indigo-400 uppercase mb-3">Relevé de Notes Actuel</p>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-[11px]">
                                                        <thead>
                                                            <tr className="text-slate-400 border-b">
                                                                <th className="text-left py-2 font-bold uppercase">Module</th>
                                                                <th className="text-center py-2 font-bold uppercase">Sem.</th>
                                                                <th className="text-center py-2 font-bold uppercase">Exam</th>
                                                                <th className="text-center py-2 font-bold uppercase">Ratt.</th>
                                                                {db.academicHistories.filter(h => h.userId === selectedStudentHistory).some(h => h.status === 'ADMIS_AVEC_DETTE') && <th className="text-center py-2 font-bold uppercase text-amber-600">Dette</th>}
                                                                <th className="text-center py-2 font-bold uppercase">TD</th>
                                                                <th className="text-center py-2 font-bold uppercase">TP</th>
                                                                <th className="text-center py-2 font-bold uppercase">Moy.</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100">
                                                            {currentModuleGrades.sort((a, b) => a.semester - b.semester).map((mg, midx) => {
                                                                const isDebtStudent = db.academicHistories.filter(h => h.userId === selectedStudentHistory).some(h => h.status === 'ADMIS_AVEC_DETTE');
                                                                return (
                                                                <tr key={midx} className="hover:bg-white transition-colors">
                                                                    <td className="py-2 font-bold text-slate-700">{mg.moduleName}</td>
                                                                    <td className="py-2 text-center text-slate-500">S{mg.semester}</td>
                                                                    <td className="py-2 text-center font-bold text-slate-600">{mg.cours ?? '-'}</td>
                                                                    <td className="py-2 text-center font-bold text-rose-600">{mg.rattrapage ?? '-'}</td>
                                                                    {isDebtStudent && <td className="py-2 text-center font-bold text-amber-600">{mg.rattrapage ?? '-'}</td>}
                                                                    <td className="py-2 text-center text-slate-500">{mg.td ?? '-'}</td>
                                                                    <td className="py-2 text-center text-slate-500">{mg.tp ?? '-'}</td>
                                                                    <td className="py-2 text-center font-black text-indigo-600">{mg.average.toFixed(2)}</td>
                                                                </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Past Histories */}
                                {db.academicHistories.filter(h => h.userId === student.id).sort((a, b) => b.year.localeCompare(a.year)).map((h) => (
                                    <div key={h.id} className="bg-slate-50 border rounded-2xl p-6">
                                        <div className="flex justify-between items-center mb-6">
                                            <div>
                                                <h4 className="text-lg font-bold text-slate-800">{h.year}</h4>
                                                <p className="text-xs text-slate-500 uppercase font-bold">{h.level}</p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${h.status.includes('ADMIS') ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                {h.status}
                                            </span>
                                        </div>
                                        
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="bg-white p-3 rounded-xl border text-center">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">S1</p>
                                                <p className="text-lg font-bold text-indigo-600">{h.semester1Avg.toFixed(2)}</p>
                                            </div>
                                            <div className="bg-white p-3 rounded-xl border text-center">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">S2</p>
                                                <p className="text-lg font-bold text-indigo-600">{h.semester2Avg.toFixed(2)}</p>
                                            </div>
                                            <div className="bg-white p-3 rounded-xl border text-center">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Annuel</p>
                                                <p className="text-lg font-bold text-indigo-600">{h.annualAvg.toFixed(2)}</p>
                                            </div>
                                        </div>

                                        {h.moduleGrades && h.moduleGrades.length > 0 && (
                                            <div className="mt-6 border-t pt-4">
                                                <p className="text-xs font-bold text-slate-400 uppercase mb-3">Relevé de Notes Détaillé</p>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-[11px]">
                                                        <thead>
                                                            <tr className="text-slate-400 border-b">
                                                                <th className="text-left py-2 font-bold uppercase">Module</th>
                                                                <th className="text-center py-2 font-bold uppercase">Sem.</th>
                                                                <th className="text-center py-2 font-bold uppercase">Exam</th>
                                                                <th className="text-center py-2 font-bold uppercase">Ratt.</th>
                                                                <th className="text-center py-2 font-bold uppercase">TD</th>
                                                                <th className="text-center py-2 font-bold uppercase">TP</th>
                                                                <th className="text-center py-2 font-bold uppercase">Moy.</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100">
                                                            {h.moduleGrades.sort((a, b) => a.semester - b.semester).map((mg, midx) => (
                                                                <tr key={midx} className="hover:bg-white transition-colors">
                                                                    <td className="py-2 font-bold text-slate-700">{mg.moduleName}</td>
                                                                    <td className="py-2 text-center text-slate-500">S{mg.semester}</td>
                                                                    <td className="py-2 text-center font-bold text-slate-600">{mg.cours ?? '-'}</td>
                                                                    <td className="py-2 text-center font-bold text-rose-600">{mg.rattrapage ?? '-'}</td>
                                                                    <td className="py-2 text-center text-slate-500">{mg.td ?? '-'}</td>
                                                                    <td className="py-2 text-center text-slate-500">{mg.tp ?? '-'}</td>
                                                                    <td className="py-2 text-center font-black text-indigo-600">{mg.average.toFixed(2)}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {db.academicHistories.filter(h => h.userId === student.id).length === 0 && studentModules.length === 0 && (
                                    <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed">
                                        <p className="text-slate-400 italic">Aucun historique validé pour cet étudiant.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })()}
            </div>
        </div>
      )}
    </div>
  );
};
