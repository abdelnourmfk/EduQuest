
import React, { useState, useEffect } from 'react';
import { createNotification } from '../src/store/db';
import { useDB } from '../src/store/DBContext';
import { User, Module, Assignment, SessionType, TimetableEntry, Grade, Resource, UserRole } from '../types';
import { supabaseService } from '../src/services/supabaseService';
import { Calendar, FileSpreadsheet, FolderOpen, Plus, Trash2, Edit3, Users, Info, Save, CheckCircle2, AlertCircle, Bell } from 'lucide-react';

const DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi'];
const SLOTS = ['08:30 - 10:00', '10:10 - 11:40', '11:50 - 13:20', '13:30 - 15:00', '15:10 - 16:40'];

export const TeacherPlanning = ({ teacherId }: { teacherId: string }) => {
  const { db, setDb } = useDB();
  const semester = db.currentSemester;
  const myAssignments = db.assignments.filter(a => a.teacherId === teacherId);
  const myTimetable = db.timetable.filter(t => 
    t.semester === semester && 
    myAssignments.some(a => a.moduleId === t.moduleId && a.type === t.type)
  );

  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);
  const [editDay, setEditDay] = useState(DAYS[0]);
  const [editSlot, setEditSlot] = useState(SLOTS[0]);
  const [editRoom, setEditRoom] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const saveEditedEntry = async () => {
    if (!editingEntry) return;
    setError('');
    setSuccess('');

    if (editDay === editingEntry.day && editSlot === editingEntry.timeSlot) {
      setSuccess('Aucun changement détecté.');
      return;
    }

    // Room conflict: room must be free at the new time
    const roomConflict = db.timetable.find(t =>
      t.id !== editingEntry.id &&
      t.day === editDay &&
      t.timeSlot === editSlot &&
      t.room === editRoom
    );
    if (roomConflict) {
      setError(`La salle ${editingEntry.room} est déjà utilisée à cette heure.`);
      return;
    }

    // Group conflict: le même groupe ne peut pas avoir deux séances en même temps
    const groupConflict = db.timetable.find(t =>
      t.id !== editingEntry.id &&
      t.day === editDay &&
      t.timeSlot === editSlot &&
      t.groupId === editingEntry.groupId
    );
    if (groupConflict) {
      setError(`Le groupe ${editingEntry.groupId} a déjà une séance programmée à cette heure.`);
      return;
    }

    // Teacher conflict: l'enseignant ne peut pas être à deux endroits à la même heure
    const teacherConflict = db.timetable.find(t =>
      t.id !== editingEntry.id &&
      t.day === editDay &&
      t.timeSlot === editSlot &&
      t.teacherId === teacherId
    );
    if (teacherConflict) {
      setError(`Vous avez déjà une autre séance programmée à cette heure.`);
      return;
    }

    const updated = { ...editingEntry, day: editDay, timeSlot: editSlot, room: editRoom };
    try {
      await supabaseService.saveTimetableEntry(updated);
      setDb(prev => ({
        ...prev,
        timetable: prev.timetable.map(t => t.id === updated.id ? updated : t)
      }));
      setSuccess('Modification enregistrée.');
      setEditingEntry(null);
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'enregistrement de la modification.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-slate-800">Mon Emploi du Temps - Semestre {semester}</h3>
        <div className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100 font-black text-sm">
          Année {db.currentAcademicYear}
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
                  const entries = myTimetable.filter(t => t.day === day && t.timeSlot === slot);
                  if (entries.length === 0) return <td key={slot} className="p-2 border bg-slate-50/20"></td>;
                  
                  return (
                    <td key={slot} className="p-2 border bg-indigo-50/50">
                      <div className="flex flex-col gap-2">
                        {entries.map(entry => {
                          const module = db.modules.find(m => m.id === entry.moduleId);
                          const specialty = db.specialties.find(s => s.id === entry.specialtyId);
                          return (
                            <div
                              key={entry.id}
                              className="flex flex-col p-2 bg-white rounded-lg border shadow-sm border-indigo-100 cursor-pointer hover:shadow-md"
                              onClick={() => {
                                setError('');
                                setSuccess('');
                                setEditingEntry(entry);
                                setEditDay(entry.day);
                                setEditSlot(entry.timeSlot);
                                setEditRoom(entry.room);
                              }}
                            >
                              <div className="flex justify-between items-start mb-1">
                                <span className={`text-[8px] px-1 py-0.5 rounded font-bold uppercase ${
                                  entry.type === SessionType.COURS ? 'bg-blue-600 text-white' : 
                                  entry.type === SessionType.TD ? 'bg-purple-600 text-white' : 'bg-teal-600 text-white'
                                }`}>{entry.type}</span>
                                <span className="text-[8px] bg-slate-100 text-slate-500 px-1 py-0.5 rounded font-bold uppercase">{entry.room}</span>
                              </div>
                              <p className="text-[10px] font-bold text-indigo-900 leading-tight">{module?.name}</p>
                              <div className="flex justify-between items-end mt-1">
                                <span className="text-[8px] font-bold text-indigo-400 bg-indigo-50 px-1 rounded truncate max-w-[60px]" title={specialty?.name}>
                                  {specialty?.name}
                                </span>
                                <div className="flex gap-1">
                                  <span className="text-[8px] font-bold text-slate-400">{entry.level}</span>
                                  <span className="text-[8px] text-indigo-500 font-bold uppercase">{entry.groupId}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingEntry && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-2">Modifier ma séance</h3>
            <p className="text-sm text-slate-500 mb-4">Module: <span className="font-semibold">{db.modules.find(m => m.id === editingEntry.moduleId)?.name}</span> — Groupe: <span className="font-semibold">{editingEntry.groupId}</span></p>
            {error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl flex items-center gap-2 text-sm font-medium animate-shake">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl flex items-center gap-2 text-sm font-medium">
                <CheckCircle2 className="w-4 h-4" />
                {success}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Jour</label>
                <select
                  className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                  value={editDay}
                  onChange={e => setEditDay(e.target.value)}
                >
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Créneau</label>
                <select
                  className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                  value={editSlot}
                  onChange={e => setEditSlot(e.target.value)}
                >
                  {SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Salle</label>
              <select
                className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                value={editRoom}
                onChange={e => setEditRoom(e.target.value)}
              >
                {(db.rooms || []).map(r => (
                  <option key={r.id} value={r.name}>{r.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-4 pt-6">
              <button
                onClick={() => setEditingEntry(null)}
                className="flex-1 px-4 py-2 border rounded-lg font-medium hover:bg-slate-50"
              >
                Annuler
              </button>
              <button
                onClick={saveEditedEntry}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const TeacherGrades = ({ teacherId }: { teacherId: string }) => {
  const { db, setDb } = useDB();
  const [isRattrapageMode, setIsRattrapageMode] = useState(false);
  const [isDebtMode, setIsDebtMode] = useState(false);
  const [disputeToReply, setDisputeToReply] = useState<{ studentId: string, gradeId: string, component: string, message: string } | null>(null);
  const [replyText, setReplyText] = useState('');
  
  const myAssignments = db.assignments.filter(a => a.teacherId === teacherId);
  const myModules = db.modules.filter(m => m.semester === db.currentSemester && myAssignments.some(a => a.moduleId === m.id));
  
  // For debt mode: get modules from next level
  const nextLevelModules = db.modules.filter(m => 
    myAssignments.some(a => a.moduleId === m.id) && 
    db.assignments.some(a => a.teacherId === teacherId && a.moduleId === m.id)
  );
  
  const [selectedModule, setSelectedModule] = useState<string>(isDebtMode ? nextLevelModules[0]?.id || '' : myModules[0]?.id || '');
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [localGrades, setLocalGrades] = useState<Record<string, Partial<Grade>>>({});

  // Reset local grades when module changes to prevent cross-module contamination
  useEffect(() => {
    setLocalGrades({});
  }, [selectedModule]);

  const currentModule = db.modules.find(m => m.id === selectedModule);
  const myGroups = Array.from(new Set(db.timetable
    .filter(t => t.moduleId === selectedModule && myAssignments.some(a => a.moduleId === t.moduleId && a.type === t.type))
    .map(t => t.groupId)));

  const calculateModuleAverage = (grade: Grade | undefined) => {
    if (!grade || !currentModule) return 0;
    
    const examScore = Math.max(grade.cours || 0, grade.rattrapage || 0);
    
    // If module has only exam, return exam score
    if (!currentModule.hasTD && !currentModule.hasTP) {
      return currentModule.hasCours ? examScore : 0;
    }
    
    // Calculate CC average for components that exist in the module
    let ccSum = 0;
    let ccCount = 0;
    if (currentModule.hasTD) { ccSum += grade.td || 0; ccCount++; }
    if (currentModule.hasTP) { ccSum += grade.tp || 0; ccCount++; }
    const ccAvg = ccCount > 0 ? ccSum / ccCount : 0;
    
    // Module has both exam and CC components
    if (currentModule.hasCours) {
      return (examScore * 0.6) + (ccAvg * 0.4);
    }
    
    // Module has only CC components (no exam)
    return ccAvg;
  };

  const calculateUnitAverage = (studentId: string, moduleToCheck?: string) => {
    const modToCheck = moduleToCheck || currentModule?.id;
    const mod = db.modules.find(m => m.id === modToCheck);
    if (!mod?.unit) return 0;
    const unitModules = db.modules.filter(m => 
      m.unit === mod.unit && 
      m.specialtyId === mod.specialtyId && 
      m.level === mod.level && 
      m.semester === mod.semester &&
      (!mod.subSpecialty || m.subSpecialty === mod.subSpecialty)
    );
    let total = 0;
    let count = 0;
    for (const unitMod of unitModules) {
      const grade = db.grades.find(g => g.studentId === studentId && g.moduleId === unitMod.id);
      if (grade) {
        total += calculateModuleAverage(grade);
        count++;
      }
    }
    return count > 0 ? total / count : 0;
  };

  // Get students based on mode
  let students: User[] = [];
  
  if (isDebtMode && currentModule) {
    // Mode Dette: Get students from NEXT year with ADMIS_AVEC_DETTE status
    students = db.users.filter(u => {
      if (u.role !== UserRole.STUDENT) return false;
      if (u.specialtyId !== currentModule.specialtyId) return false;
      
      // Find the academic history for this student from previous year
      const studentHistories = db.academicHistories.filter(h => h.userId === u.id && h.status === 'ADMIS_AVEC_DETTE');
      if (studentHistories.length === 0) return false;
      
      // Get the debt module average and unit average from the previous year
      const previousHistory = studentHistories[studentHistories.length - 1];
      const moduleGrade = previousHistory.moduleGrades.find(mg => mg.moduleId === selectedModule);
      
      if (!moduleGrade) return false;
      
      // Check if module average <= 10 and unit average <= 10
      const unitModuleGrades = previousHistory.moduleGrades.filter(mg => {
        const mod = db.modules.find(m => m.id === mg.moduleId);
        return mod?.unit === currentModule.unit;
      });
      
      const unitAvg = unitModuleGrades.length > 0 
        ? unitModuleGrades.reduce((sum, mg) => sum + mg.average, 0) / unitModuleGrades.length 
        : 0;
      
      return moduleGrade.average <= 10 && unitAvg <= 10;
    });
  } else {
    // Normal mode: Get students from current level
    students = db.users.filter(u => 
      u.role === UserRole.STUDENT && 
      u.specialtyId === currentModule?.specialtyId && 
      u.level === currentModule?.level &&
      (!currentModule?.subSpecialty || u.subSpecialty === currentModule.subSpecialty) &&
      (selectedGroup ? u.groupId === selectedGroup : myGroups.includes(u.groupId || ''))
    );
  }

  const handleGradeChange = async (studentId: string, type: 'cours' | 'td' | 'tp' | 'rattrapage', value: string) => {
    setError('');
    const val = value === '' ? undefined : Math.min(20, Math.max(0, parseFloat(value)));
    const existingGrade = db.grades.find(g => g.studentId === studentId && g.moduleId === selectedModule);
    if (existingGrade && existingGrade.approved) {
      setError("Cette note est déjà validée par l'administration et ne peut plus être modifiée.");
      return;
    }
    if (type === 'rattrapage' && calculateUnitAverage(studentId) >= 10) {
      setError("La moyenne de l'unité est supérieure ou égale à 10, vous ne pouvez pas saisir de note de rattrapage pour les modules de cette unité.");
      return;
    }
    setLocalGrades(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [type]: val
      }
    }));
  };

  const submitGrades = async () => {
    setError('');
    setSuccess('');
    if (Object.keys(localGrades).length === 0) {
      setError("Aucune note à enregistrer.");
      return;
    }
    try {
      const updates = [];
      for (const [studentId, gradeData] of Object.entries(localGrades) as [string, Partial<Grade>][] ) {
        const existingGrade = db.grades.find(g => g.studentId === studentId && g.moduleId === selectedModule);
        const gradedataObj = gradeData || {};
        const gradeToSave = existingGrade
          ? { ...existingGrade, ...gradedataObj }
          : { id: Date.now().toString() + studentId, studentId, moduleId: selectedModule, ...gradedataObj, approved: false };
        updates.push(supabaseService.saveGrade(gradeToSave));
        await createNotification(studentId, `Vos notes en ${currentModule?.name} ont été mises à jour.`);
      }
      await Promise.all(updates);
      setDb(prev => ({
        ...prev,
        grades: prev.grades.map(g => {
          const update = localGrades[g.studentId];
          return update && g.moduleId === selectedModule ? { ...g, ...update } : g;
        }).concat(
          (Object.entries(localGrades) as [string, Partial<Grade>][])
            .filter(([studentId]) => !prev.grades.some(g => g.studentId === studentId && g.moduleId === selectedModule))
            .map(([studentId, gradeData]) => ({
              id: Date.now().toString() + studentId,
              studentId,
              moduleId: selectedModule,
              ...gradeData,
              approved: false
            }))
        )
      }));
      setLocalGrades({});
      setSuccess("Notes enregistrées avec succès !");
    } catch (err: any) {
      setError("Erreur lors de l'enregistrement des notes");
    }
  };

  const submitReply = async () => {
    setError('');
    if (!disputeToReply || !replyText) return;

    const dispute = db.gradeDisputes.find(d => d.gradeId === disputeToReply.gradeId && d.component === disputeToReply.component);
    if (!dispute) return;

    const updatedDispute = {
      ...dispute,
      reply: replyText,
      replyDate: new Date().toISOString(),
      resolved: true
    };

    try {
      await supabaseService.saveGradeDispute(updatedDispute);
      await createNotification(disputeToReply.studentId, `L'enseignant a répondu à votre contestation de ${disputeToReply.component} en ${currentModule?.name}. Réponse: ${replyText}`);
      setDisputeToReply(null);
      setReplyText('');
    } catch (err: any) {
      setError("Erreur lors de l'envoi de la réponse");
    }
  };

  const getGradeValue = (studentId: string, type: 'cours' | 'td' | 'tp' | 'rattrapage') => {
    const grade = db.grades.find(g => g.studentId === studentId && g.moduleId === selectedModule);
    if (!grade) return '';
    const val = grade[type];
    return val === undefined ? '' : val;
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center gap-3 text-sm font-medium animate-shake">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl flex items-center gap-3 text-sm font-medium">
          <CheckCircle2 className="w-5 h-5" />
          {success}
        </div>
      )}
      <div className="flex flex-wrap gap-4 bg-slate-50 p-4 rounded-2xl border items-center no-print">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Module</label>
          <select className="w-full px-3 py-2 border rounded-xl outline-none" value={selectedModule} onChange={e => { setSelectedModule(e.target.value); setSelectedGroup(''); }}>
            {myModules.map(m => <option key={m.id} value={m.id}>{m.level} - {m.name}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Groupe</label>
          <select className="w-full px-3 py-2 border rounded-xl outline-none" value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)}>
            <option value="">Tous les groupes</option>
            {myGroups.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-4 pt-4 md:pt-0">
          <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2 border rounded-xl shadow-sm">
            <input type="checkbox" checked={isRattrapageMode} onChange={e => {
              setIsRattrapageMode(e.target.checked);
              if (e.target.checked) setIsDebtMode(false);
            }} className="w-4 h-4 accent-rose-600" />
            <span className={`text-sm font-bold ${isRattrapageMode ? 'text-rose-600' : 'text-slate-500'}`}>Mode Rattrapage</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer bg-white px-4 py-2 border rounded-xl shadow-sm">
            <input type="checkbox" checked={isDebtMode} onChange={e => {
              setIsDebtMode(e.target.checked);
              if (e.target.checked) {
                setIsRattrapageMode(false);
                setSelectedModule(nextLevelModules[0]?.id || '');
              } else {
                setSelectedModule(myModules[0]?.id || '');
              }
            }} className="w-4 h-4 accent-amber-600" />
            <span className={`text-sm font-bold ${isDebtMode ? 'text-amber-600' : 'text-slate-500'}`}>Mode Dette</span>
          </label>
        </div>
      </div>

      <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-500">Étudiant</th>
              <th className="px-6 py-4 text-center text-xs font-bold uppercase text-slate-500">Groupe</th>
              {!isRattrapageMode ? (
                <>
                  {currentModule?.hasCours && <th className="px-6 py-4 text-center text-xs font-bold uppercase text-slate-500">Examen</th>}
                  {currentModule?.hasTD && <th className="px-6 py-4 text-center text-xs font-bold uppercase text-slate-500">TD</th>}
                  {currentModule?.hasTP && <th className="px-6 py-4 text-center text-xs font-bold uppercase text-slate-500">TP</th>}
                </>
              ) : isDebtMode ? (
                <th className="px-6 py-4 text-center text-xs font-bold uppercase text-amber-500">Dette</th>
              ) : (
                <th className="px-6 py-4 text-center text-xs font-bold uppercase text-rose-500">Rattrapage</th>
              )}
              <th className="px-6 py-4 text-center text-xs font-bold uppercase text-slate-500 bg-slate-100">Moyenne Finale</th>
              <th className="px-6 py-4 text-center text-xs font-bold uppercase text-slate-500">Alertes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.map(s => {
              const grade = db.grades.find(g => g.studentId === s.id && g.moduleId === selectedModule);
              const localGrade = localGrades[s.id] || {};
              const mergedGrade = { ...grade, ...localGrade };
              const initialAvg = calculateModuleAverage(mergedGrade);
              const canEnterRattrapage = calculateUnitAverage(s.id) < 10;
              return (
                <tr key={s.id} className={`hover:bg-slate-50 transition-colors ${grade?.dispute ? 'bg-rose-50/30' : ''}`}>
                  <td className="px-6 py-4 font-bold text-slate-700">{s.fullName}</td>
                  <td className="px-6 py-4 text-center text-slate-500 text-sm font-medium">{s.groupId}</td>
                  {!isRattrapageMode ? (
                    <>
                      {currentModule?.hasCours && (
                        <td className="px-6 py-4 text-center">
                          <div className="relative inline-block">
                            <input 
                              type="number" step="0.25" min="0" max="20" 
                              className={`w-16 text-center border rounded-lg py-1.5 focus:ring-2 focus:ring-indigo-500 ${grade?.approved ? 'bg-emerald-50 border-emerald-200 text-emerald-700 cursor-not-allowed' : ''}`} 
                              value={localGrade.cours !== undefined ? localGrade.cours : getGradeValue(s.id, 'cours')} 
                              onChange={e => handleGradeChange(s.id, 'cours', e.target.value)} 
                              disabled={grade?.approved}
                            />
                            {grade?.approved && <CheckCircle2 className="w-3 h-3 text-emerald-500 absolute -top-1 -right-1" />}
                          </div>
                        </td>
                      )}
                      {currentModule?.hasTD && (
                        <td className="px-6 py-4 text-center">
                          <div className="relative inline-block">
                            <input 
                              type="number" step="0.25" min="0" max="20" 
                              className={`w-16 text-center border rounded-lg py-1.5 focus:ring-2 focus:ring-indigo-500 ${grade?.approved ? 'bg-emerald-50 border-emerald-200 text-emerald-700 cursor-not-allowed' : ''}`} 
                              value={localGrade.td !== undefined ? localGrade.td : getGradeValue(s.id, 'td')} 
                              onChange={e => handleGradeChange(s.id, 'td', e.target.value)} 
                              disabled={grade?.approved}
                            />
                            {grade?.approved && <CheckCircle2 className="w-3 h-3 text-emerald-500 absolute -top-1 -right-1" />}
                          </div>
                        </td>
                      )}
                      {currentModule?.hasTP && (
                        <td className="px-6 py-4 text-center">
                          <div className="relative inline-block">
                            <input 
                              type="number" step="0.25" min="0" max="20" 
                              className={`w-16 text-center border rounded-lg py-1.5 focus:ring-2 focus:ring-indigo-500 ${grade?.approved ? 'bg-emerald-50 border-emerald-200 text-emerald-700 cursor-not-allowed' : ''}`} 
                              value={localGrade.tp !== undefined ? localGrade.tp : getGradeValue(s.id, 'tp')} 
                              onChange={e => handleGradeChange(s.id, 'tp', e.target.value)} 
                              disabled={grade?.approved}
                            />
                            {grade?.approved && <CheckCircle2 className="w-3 h-3 text-emerald-500 absolute -top-1 -right-1" />}
                          </div>
                        </td>
                      )}
                    </>
                  ) : isDebtMode ? (
                    <td className="px-6 py-4 text-center">
                      <div className="relative inline-block">
                        <input 
                          type="number" step="0.25" min="0" max="20" 
                          disabled={grade?.approved}
                          className={`w-16 text-center border rounded-lg py-1.5 focus:ring-2 focus:ring-amber-500 ${grade?.approved ? 'bg-emerald-50 border-emerald-200 text-emerald-700 cursor-not-allowed' : 'border-amber-200'}`} 
                          value={localGrade.rattrapage !== undefined ? localGrade.rattrapage : getGradeValue(s.id, 'rattrapage')} 
                          onChange={e => handleGradeChange(s.id, 'rattrapage', e.target.value)} 
                        />
                        {grade?.approved && <CheckCircle2 className="w-3 h-3 text-emerald-500 absolute -top-1 -right-1" />}
                      </div>
                    </td>
                  ) : (
                    <td className="px-6 py-4 text-center">
                      <div className="relative inline-block">
                        <input 
                          type="number" step="0.25" min="0" max="20" 
                          disabled={!canEnterRattrapage || grade?.approved}
                          className={`w-16 text-center border rounded-lg py-1.5 focus:ring-2 focus:ring-rose-500 ${(!canEnterRattrapage || grade?.approved) ? 'bg-slate-100 opacity-50 cursor-not-allowed' : 'border-rose-200'} ${grade?.approved ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : ''}`} 
                          value={localGrade.rattrapage !== undefined ? localGrade.rattrapage : getGradeValue(s.id, 'rattrapage')} 
                          onChange={e => handleGradeChange(s.id, 'rattrapage', e.target.value)} 
                        />
                        {grade?.approved && <CheckCircle2 className="w-3 h-3 text-emerald-500 absolute -top-1 -right-1" />}
                      </div>
                    </td>
                  )}
                  <td className="px-6 py-4 text-center font-bold bg-slate-50 text-indigo-700">
                    {calculateModuleAverage(mergedGrade).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {db.gradeDisputes.filter(d => d.gradeId === grade?.id).map((d, idx) => (
                        <button 
                            key={idx}
                            onClick={() => setDisputeToReply({ studentId: s.id, gradeId: grade!.id, component: d.component, message: d.message })}
                            className={`p-2 rounded-lg transition-all mb-1 block mx-auto ${d.reply ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600 animate-pulse'}`}
                            title={`Contestation ${d.component}`}
                        >
                            <span className="text-[8px] font-bold uppercase">{d.component}</span>
                        </button>
                    ))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {disputeToReply && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
                <h3 className="text-xl font-bold mb-2">Répondre à la contestation</h3>
                <div className="bg-rose-50 p-4 rounded-xl mb-6 border border-rose-100">
                    <p className="text-xs font-bold text-rose-400 uppercase mb-1">Contestation {disputeToReply.component} :</p>
                    <p className="text-sm text-rose-700 italic">"{disputeToReply.message}"</p>
                </div>
                <textarea 
                    className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 mb-6"
                    rows={4}
                    placeholder="Votre réponse..."
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                />
                <div className="flex gap-4">
                    <button onClick={() => setDisputeToReply(null)} className="flex-1 px-4 py-2 border rounded-xl font-bold">Fermer</button>
                    <button onClick={submitReply} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold">Envoyer Réponse</button>
                </div>
            </div>
        </div>
      )}
      
      {Object.keys(localGrades).length > 0 && (
        <div className="flex justify-center">
          <button 
            onClick={submitGrades} 
            className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <Save className="w-5 h-5" />
            Enregistrer les Notes
          </button>
        </div>
      )}
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl flex gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 shrink-0" />
        <p className="text-sm text-blue-700">
          <strong>Rappel Rattrapage :</strong> Le rattrapage remplace uniquement la note d'examen (Cour). La moyenne est recalculée en prenant la meilleure note entre l'examen initial et le rattrapage.
        </p>
      </div>
    </div>
  );
};

export const TeacherResources = ({ teacherId }: { teacherId: string }) => {
  const { db, setDb } = useDB();
  const [showAdd, setShowAdd] = useState(false);
  const [showAnnounce, setShowAnnounce] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const isEditing = Boolean(editingResource);
  const [newRes, setNewRes] = useState({ moduleId: '', title: '', category: SessionType.COURS, type: 'PDF', groupId: '', url: '' });
  const [newResFile, setNewResFile] = useState<File | null>(null);
  const [announce, setAnnounce] = useState({ moduleId: '', groupId: '', message: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmModal, setConfirmModal] = useState<{ title: string, message: string, onConfirm: () => void, type?: 'info' | 'danger' } | null>(null);

  const myAssignments = db.assignments.filter(a => a.teacherId === teacherId);
  const myModules = db.modules.filter(m => myAssignments.some(a => a.moduleId === m.id));

  const addResource = async () => {
    setError('');
    if (!newRes.moduleId || !newRes.title || (!newRes.url && !newResFile)) {
      setError("Veuillez remplir le module, le titre, et fournir soit un URL soit un fichier.");
      return;
    }

    const allowedExt = ['pdf','doc','docx','xls','xlsx','ppt','pptx'];
    let resourceUrl = newRes.url;
    let resourceType = newRes.type;

    if (newResFile) {
      const fileName = newResFile.name.toLowerCase();
      const ext = fileName.substring(fileName.lastIndexOf('.') + 1);
      if (!allowedExt.includes(ext)) {
        setError('Type de fichier non supporté. Autorisé: pdf, doc, docx, xls, xlsx, ppt, pptx.');
        return;
      }
      resourceUrl = URL.createObjectURL(newResFile);
      resourceType = ext.toUpperCase();
    }

    const module = db.modules.find(m => m.id === newRes.moduleId);
    const resourceId = editingResource?.id || Date.now().toString();
    const uploadDate = editingResource?.uploadDate || new Date().toISOString();

    const resourceData = {
      id: resourceId,
      teacherId,
      specialtyId: module?.specialtyId || '',
      uploadDate,
      moduleId: newRes.moduleId,
      title: newRes.title,
      category: newRes.category,
      type: resourceType,
      groupId: newRes.groupId,
      url: resourceUrl || ''
    };

    try {
      await supabaseService.saveResource(resourceData);
      
      // Notify students
      const targetStudents = db.users.filter(u => 
          u.role === UserRole.STUDENT && 
          u.specialtyId === module?.specialtyId && 
          u.level === module?.level &&
          (!newRes.groupId || u.groupId === newRes.groupId)
      );
      const teacherName = db.users.find(u => u.id === teacherId)?.fullName;
      for (const s of targetStudents) {
        await createNotification(s.id, `Nouveau support de cours ajouté par ${teacherName} : ${newRes.title} (${module?.name})`);
      }
      
      setDb(prev => ({
        ...prev,
        resources: isEditing
          ? prev.resources.map(r => r.id === resourceData.id ? resourceData : r)
          : [...prev.resources, resourceData]
      }));
      setSuccess(isEditing ? "Ressource mise à jour avec succès !" : "Ressource ajoutée avec succès !");
      setShowAdd(false);
      setEditingResource(null);
      setNewRes({ moduleId: '', title: '', category: SessionType.COURS, type: 'PDF', groupId: '', url: '' });
      setNewResFile(null);
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'ajout de la ressource");
    }
  };

  const startEditResource = (r: Resource) => {
    setError('');
    setSuccess('');
    setEditingResource(r);
    setNewRes({
      moduleId: r.moduleId,
      title: r.title,
      category: r.category,
      type: r.type,
      groupId: r.groupId,
      url: r.url
    });
    setNewResFile(null);
    setShowAdd(true);
  };

  const deleteResource = (id: string) => {
    setError('');
    setConfirmModal({
      title: "Supprimer la Ressource",
      message: "Voulez-vous vraiment supprimer ce support de cours ?",
      type: 'danger',
      onConfirm: async () => {
        try {
          await supabaseService.deleteResource(id);
          setDb(prev => ({ ...prev, resources: prev.resources.filter(r => r.id !== id) }));
          setConfirmModal(null);
          setSuccess('Ressource supprimée avec succès.');
        } catch (err: any) {
          setError(err.message || "Erreur lors de la suppression");
        }
      }
    });
  };

  const sendAnnouncement = async () => {
    setError('');
    if (!announce.moduleId || !announce.message) {
      setError("Veuillez remplir tous les champs");
      return;
    }
    const module = db.modules.find(m => m.id === announce.moduleId);
    const targetStudents = db.users.filter(u => 
        u.role === UserRole.STUDENT && 
        u.specialtyId === module?.specialtyId && 
        u.level === module?.level &&
        (!announce.groupId || u.groupId === announce.groupId)
    );
    
    const teacherName = db.users.find(u => u.id === teacherId)?.fullName;
    try {
      for (const s of targetStudents) {
        await createNotification(s.id, `Message pédagogique de ${teacherName} (${module?.name}) : ${announce.message}`);
      }
      setShowAnnounce(false);
      setAnnounce({ moduleId: '', groupId: '', message: '' });
    } catch (err: any) {
      setError("Erreur lors de l'envoi de l'annonce");
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center gap-3 text-sm font-medium animate-shake">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}
      <div className="flex justify-between items-center">
        <div>
            <h3 className="text-xl font-bold text-slate-800">Supports & Annonces</h3>
            <p className="text-slate-400 text-sm">Gérez vos fichiers et communiquez avec vos étudiants.</p>
        </div>
        <div className="flex gap-3">
            <button onClick={() => setShowAnnounce(true)} className="bg-amber-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold shadow-md hover:bg-amber-600 transition-all">
                <Bell className="w-5 h-5" /> Envoyer Annonce
            </button>
            <button onClick={() => setShowAdd(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold shadow-md hover:bg-indigo-700 transition-all">
                <Plus className="w-5 h-5" /> Ajouter Support
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {db.resources.filter(r => r.teacherId === teacherId).map(r => (
            <div key={r.id} className="p-5 bg-white border rounded-2xl shadow-sm hover:border-indigo-300 transition-all group relative">
                <div className="flex justify-between items-start mb-3">
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        r.category === SessionType.COURS ? 'bg-blue-100 text-blue-700' : 
                        r.category === SessionType.TD ? 'bg-purple-100 text-purple-700' : 'bg-teal-100 text-teal-700'
                    }`}>{r.category}</span>
                    <div className="flex gap-2">
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold">{r.type}</span>
                        <button onClick={() => startEditResource(r)} className="text-indigo-300 opacity-0 group-hover:opacity-100 hover:text-indigo-500 transition-all">
                            <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteResource(r.id)} className="text-rose-300 opacity-0 group-hover:opacity-100 hover:text-rose-500 transition-all">
                            <Trash2 className="w-4 h-4"/>
                        </button>
                    </div>
                </div>
                <h4 className="font-bold text-slate-800 truncate">{r.title}</h4>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                    <FolderOpen className="w-3 h-3" />
                    {db.modules.find(m => m.id === r.moduleId)?.name}
                </p>
                <div className="mt-4 pt-4 border-t flex justify-between items-center">
                    <span className="text-[10px] text-slate-300">{new Date(r.uploadDate).toLocaleDateString()}</span>
                    <a href={r.url} target="_blank" rel="noreferrer" className="text-indigo-600 text-xs font-bold hover:underline">Consulter</a>
                </div>
            </div>
        ))}
        {db.resources.filter(r => r.teacherId === teacherId).length === 0 && (
            <div className="col-span-3 py-20 text-center border-2 border-dashed rounded-3xl text-slate-300 italic">
                Aucun support de cours partagé.
            </div>
        )}
      </div>

      {showAdd && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
                  <h3 className="text-2xl font-bold mb-6">{isEditing ? 'Modifier le Support' : 'Nouveau Support'}</h3>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Module</label>
                          <select className="w-full px-4 py-2 border rounded-xl outline-none" value={newRes.moduleId} onChange={e => setNewRes({...newRes, moduleId: e.target.value})}>
                              <option value="">Choisir un module...</option>
                              {myModules.map(m => <option key={m.id} value={m.id}>{m.name} ({m.level})</option>)}
                          </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Catégorie</label>
                            <select className="w-full px-4 py-2 border rounded-xl outline-none" value={newRes.category} onChange={e => setNewRes({...newRes, category: e.target.value as SessionType})}>
                                <option value={SessionType.COURS}>Cours</option>
                                <option value={SessionType.TD}>TD</option>
                                <option value={SessionType.TP}>TP</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Format</label>
                            <select className="w-full px-4 py-2 border rounded-xl outline-none" value={newRes.type} onChange={e => setNewRes({...newRes, type: e.target.value})}>
                                <option value="PDF">PDF</option>
                                <option value="DOCX">Word</option>
                                <option value="PPTX">PowerPoint</option>
                                <option value="ZIP">Archive</option>
                                <option value="LINK">Lien Web</option>
                            </select>
                        </div>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Titre du support</label>
                          <input className="w-full px-4 py-2 border rounded-xl outline-none" placeholder="Ex: Chapitre 1 - Introduction" value={newRes.title} onChange={e => setNewRes({...newRes, title: e.target.value})} />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Fichier (.pdf/.doc/.docx/.xls/.xlsx/.ppt/.pptx)</label>
                          <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" className="w-full" onChange={e => setNewResFile(e.target.files?.[0] || null)} />
                          <p className="text-[10px] text-slate-400 mt-1">Ou, si vous n'avez pas de fichier, vous pouvez fournir un URL</p>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">URL du fichier (optionnel)</label>
                          <input className="w-full px-4 py-2 border rounded-xl outline-none" placeholder="https://..." value={newRes.url} onChange={e => setNewRes({...newRes, url: e.target.value})} />
                      </div>
                      <div className="flex gap-4 pt-4">
                          <button onClick={() => { setShowAdd(false); setEditingResource(null); setNewRes({ moduleId: '', title: '', category: SessionType.COURS, type: 'PDF', groupId: '', url: '' }); setNewResFile(null); }} className="flex-1 px-4 py-2 border rounded-xl font-bold">Annuler</button>
                          <button onClick={addResource} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold">{isEditing ? 'Mettre à jour' : 'Enregistrer'}</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {showAnnounce && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
                  <h3 className="text-2xl font-bold mb-6">Envoyer une Annonce</h3>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Module Cible</label>
                          <select className="w-full px-4 py-2 border rounded-xl outline-none" value={announce.moduleId} onChange={e => setAnnounce({...announce, moduleId: e.target.value})}>
                              <option value="">Choisir un module...</option>
                              {myModules.map(m => <option key={m.id} value={m.id}>{m.name} ({m.level})</option>)}
                          </select>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Message</label>
                          <textarea 
                            className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" 
                            rows={5} 
                            placeholder="Votre message pédagogique..." 
                            value={announce.message} 
                            onChange={e => setAnnounce({...announce, message: e.target.value})}
                          />
                      </div>
                      <div className="flex gap-4 pt-4">
                          <button onClick={() => setShowAnnounce(false)} className="flex-1 px-4 py-2 border rounded-xl font-bold">Annuler</button>
                          <button onClick={sendAnnouncement} className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-xl font-bold">Diffuser</button>
                      </div>
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
