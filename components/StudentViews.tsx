
import React, { useState } from 'react';
import { createNotification } from '../src/store/db';
import { useDB } from '../src/store/DBContext';
import { User, Module, Grade, SessionType, AcademicYearRecord, GradeDispute } from '../types';
import { supabaseService } from '../src/services/supabaseService';
import { Award, FileText, Calendar, Bell, ChevronRight, ChevronDown, Printer, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';

export const StudentDashboard = ({ studentId }: { studentId: string }) => {
  const { db } = useDB();
  const student = db.users.find(u => u.id === studentId);
  if (!student) return null;

  const specialty = db.specialties.find(s => s.id === student.specialtyId);
  const hasSubSpecialties = specialty ? db.subSpecialties.filter(s => s.specialtyId === specialty.id).length > 0 : false;

  if (!student.isApprovedForYear) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Inscription en attente</h2>
        <p className="text-slate-500 max-w-md mx-auto">
          Votre inscription administrative pour l'année en cours n'a pas encore été validée par l'administration. 
          Veuillez contacter le service de scolarité pour finaliser votre dossier.
        </p>
      </div>
    );
  }

  const notifications = db.notifications.filter(n => n.userId === studentId).slice(0, 5);
  
  // Get current timetable
  const myTimetable = db.timetable.filter(t => {
    const m = db.modules.find(mod => mod.id === t.moduleId);
    
    if (t.semester === db.currentSemester && t.specialtyId === student.specialtyId && t.level === student.level) {
      return (t.groupId === student.groupId || t.groupId === 'Tous') &&
             (!student.subSpecialty || !m?.subSpecialty || m?.subSpecialty === student.subSpecialty) &&
             (!student.subSpecialty || t.subSpecialty === student.subSpecialty);
    }

    return false;
  });

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-indigo-700 to-indigo-900 rounded-3xl p-8 text-white shadow-xl">
        <h2 className="text-3xl font-bold">Bonjour, {student.fullName} !</h2>
        <p className="text-indigo-200 mt-2">Bienvenue sur votre espace étudiant • {student.level}{student.subSpecialty ? ` • ${student.subSpecialty}` : (!hasSubSpecialties ? ' • Tronc Commun' : '')} • Groupe {student.groupId}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-500" />
            Dernières Notifications
          </h3>
          <div className="space-y-4">
            {notifications.map(n => (
              <div key={n.id} className="p-4 bg-white border rounded-2xl flex items-start gap-4 shadow-sm">
                <div className={`p-2 rounded-lg ${n.read ? 'bg-slate-100 text-slate-400' : 'bg-indigo-100 text-indigo-600'}`}>
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-slate-700 font-medium leading-tight">{n.message}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{new Date(n.date).toLocaleString('fr-FR')}</p>
                </div>
              </div>
            ))}
            {notifications.length === 0 && <p className="text-slate-400 italic">Aucune notification.</p>}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-500" />
            Mon Emploi du Temps
          </h3>
          <div className="bg-white border rounded-3xl p-6 shadow-sm">
            <div className="space-y-4">
              {myTimetable.slice(0, 3).map(t => (
                <div key={t.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                  <div className="text-center min-w-[60px]">
                    <p className="text-[10px] font-bold text-indigo-600 uppercase">{t.day.slice(0, 3)}</p>
                    <p className="text-xs font-bold text-slate-400">{t.timeSlot.split(' - ')[0]}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-800">{db.modules.find(m => m.id === t.moduleId)?.name}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">{t.type} • {t.room}</p>
                  </div>
                </div>
              ))}
              {myTimetable.length === 0 && <p className="text-slate-400 text-xs italic">Aucun cours programmé.</p>}
              <button className="w-full py-2 text-indigo-600 text-xs font-bold hover:underline">Voir tout l'emploi du temps</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const StudentNotifications = ({ studentId }: { studentId: string }) => {
  const { db, setDb } = useDB();
  const student = db.users.find(u => u.id === studentId);
  if (!student) return null;

  if (!student.isApprovedForYear) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Inscription en attente</h2>
        <p className="text-slate-500 max-w-md mx-auto">
          Votre inscription administrative pour l'année en cours n'a pas encore été validée.
        </p>
      </div>
    );
  }

  const notifications = db.notifications
    .filter(n => n.userId === studentId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const markAllAsRead = () => {
    setDb(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => n.userId === studentId ? { ...n, read: true } : n)
    }));
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-3xl font-bold text-slate-900">Notifications</h3>
          <p className="text-slate-500 mt-2">Toutes vos notifications récentes sont affichées ici.</p>
        </div>
        <button onClick={markAllAsRead} className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all">
          Marquer tout comme lu
        </button>
      </div>

      <div className="space-y-4">
        {notifications.length > 0 ? notifications.map(n => (
          <div key={n.id} className={`p-4 bg-white border rounded-2xl flex items-start gap-4 shadow-sm ${n.read ? 'border-slate-200' : 'border-indigo-300 bg-indigo-50/60'}`}>
            <div className={`p-3 rounded-lg ${n.read ? 'bg-slate-100 text-slate-400' : 'bg-indigo-600 text-white'}`}>
              <Bell className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-slate-700 font-medium leading-tight">{n.message}</p>
              <p className="text-[10px] text-slate-400 mt-1">{new Date(n.date).toLocaleString('fr-FR')}</p>
            </div>
          </div>
        )) : (
          <div className="p-8 bg-white border border-slate-200 rounded-3xl text-center text-slate-400 italic">
            Aucune notification.
          </div>
        )}
      </div>
    </div>
  );
};

export const StudentGrades = ({ studentId }: { studentId: string }) => {
  const { db, setDb } = useDB();
  const [activeSemester, setActiveSemester] = useState<1 | 2>(1);
  const [disputeModal, setDisputeModal] = useState<{ gradeId: string, moduleId: string, component: 'td' | 'tp' | 'cours' | 'rattrapage' } | null>(null);
  const [disputeMessage, setDisputeMessage] = useState('');
  const [error, setError] = useState('');
  const [viewHistory, setViewHistory] = useState(false);

  const student = db.users.find(u => u.id === studentId);
  const spec = db.specialties.find(s => s.id === student?.specialtyId);
  if (!student) return null;

  if (!student.isApprovedForYear) {
    return <div className="p-10 text-center text-slate-400 italic">Accès restreint. Inscription administrative requise.</div>;
  }

  const allModules = db.modules.filter(m => m.specialtyId === student.specialtyId && m.level === student.level);
  
  const calculateModuleAvg = (m: Module, g: Grade | undefined) => {
    if (!g) return 0;
    
    const examScore = Math.max(g.cours || 0, g.rattrapage || 0);
    
    // If module has only exam, return exam score
    if (!m.hasTD && !m.hasTP) {
      return m.hasCours ? examScore : 0;
    }
    
    // Calculate CC average for components that exist
    let ccSum = 0;
    let ccCount = 0;
    if (m.hasTD) { ccSum += g.td || 0; ccCount++; }
    if (m.hasTP) { ccSum += g.tp || 0; ccCount++; }
    const ccAvg = ccCount > 0 ? ccSum / ccCount : 0;
    
    // Module has both exam and CC components
    if (m.hasCours) {
      return (examScore * 0.6) + (ccAvg * 0.4);
    }
    
    // Module has only CC components
    return ccAvg;
  };

  const calculateSemesterData = (sem: 1 | 2) => {
    const semModules = allModules.filter(m => m.semester === sem);
    let totalCoeff = 0, weightedSum = 0, totalCredits = 0;
    
    // Group modules by unit for compensation
    const units = Array.from(new Set(semModules.map(m => m.unit)));
    const unitStats = units.map(uName => {
        const uModules = semModules.filter(m => m.unit === uName);
        let uCoeff = 0, uWeighted = 0, uCreditsTotal = 0;
        uModules.forEach(m => {
            const g = db.grades.find(gr => gr.studentId === studentId && gr.moduleId === m.id);
            const avg = calculateModuleAvg(m, g);
            uCoeff += m.coefficient;
            uWeighted += avg * m.coefficient;
            uCreditsTotal += m.credits;
        });
        const uAvg = uCoeff > 0 ? uWeighted / uCoeff : 0;
        return { name: uName, avg: uAvg, creditsTotal: uCreditsTotal, modules: uModules };
    });

    unitStats.forEach(u => {
        const uCoeffTotal = u.modules.reduce((acc, curr) => acc + curr.coefficient, 0);
        weightedSum += u.avg * uCoeffTotal;
        totalCoeff += uCoeffTotal;
        // Credit compensation logic: if Unit Avg >= 10, all credits are acquired
        if (u.avg >= 10) {
            totalCredits += u.creditsTotal;
        } else {
            // Only modules with avg >= 10 get credits
            u.modules.forEach(m => {
                const g = db.grades.find(gr => gr.studentId === studentId && gr.moduleId === m.id);
                if (calculateModuleAvg(m, g) >= 10) totalCredits += m.credits;
            });
        }
    });

    const semAvg = totalCoeff > 0 ? weightedSum / totalCoeff : 0;
    return { avg: semAvg, credits: totalCredits, units: unitStats };
  };

  const s1 = calculateSemesterData(1);
  const s2 = calculateSemesterData(2);
  const annualAvg = (s1.avg + s2.avg) / 2;
  const totalCredits = s1.credits + s2.credits;
  const threshold = spec?.creditThreshold || 30;

  const getStatus = () => {
    const hasRattrapage = db.grades.some(g => g.studentId === studentId && g.rattrapage !== undefined);
    if (annualAvg >= 10) {
        return { label: hasRattrapage ? 'ADMIS AVEC RATTRAPAGE' : 'ADMIS NORMAL', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 };
    }
    if (totalCredits >= threshold) return { label: 'ADMIS AVEC DETTE', color: 'bg-amber-100 text-amber-700', icon: AlertCircle };
    return { label: 'AJOURNÉ', color: 'bg-rose-100 text-rose-700', icon: XCircle };
  };

  const status = getStatus();

  const submitDispute = async () => {
    setError('');
    if (!disputeModal || !disputeMessage) {
      setError("Veuillez saisir un message pour votre contestation.");
      return;
    }
    
    const newDispute: GradeDispute = {
        id: Math.random().toString(36).substr(2, 9),
        gradeId: disputeModal.gradeId,
        component: disputeModal.component,
        message: disputeMessage,
        date: new Date().toISOString()
    };

    try {
      await supabaseService.saveGradeDispute(newDispute);

      // Notify teacher
      const assignment = db.assignments.find(a => a.moduleId === disputeModal.moduleId && (
          (disputeModal.component === 'cours' && a.type === SessionType.COURS) ||
          (disputeModal.component === 'td' && a.type === SessionType.TD) ||
          (disputeModal.component === 'tp' && a.type === SessionType.TP)
      ));
      
      const moduleName = db.modules.find(m => m.id === disputeModal.moduleId)?.name;
      if (assignment) {
          await createNotification(assignment.teacherId, `Un étudiant a contesté sa note de ${disputeModal.component} en ${moduleName}. Message: ${disputeMessage}`);
      } else {
          // Fallback to any teacher assigned to this module
          const anyAssignment = db.assignments.find(a => a.moduleId === disputeModal.moduleId);
          if (anyAssignment) {
              await createNotification(anyAssignment.teacherId, `Un étudiant a contesté sa note de ${disputeModal.component} en ${moduleName}. Message: ${disputeMessage}`);
          }
      }

      setDisputeModal(null);
      setDisputeMessage('');
    } catch (err: any) {
      setError("Erreur lors de l'envoi de la contestation");
    }
  };

  if (viewHistory) {
    const academicHistory = db.academicHistories.filter(h => h.userId === studentId);
    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold text-slate-800">Historique Académique</h3>
                <button onClick={() => setViewHistory(false)} className="text-indigo-600 font-bold hover:underline">Retour aux notes actuelles</button>
            </div>
            <div className="space-y-6">
                {academicHistory.map((h) => (
                    <div key={h.id} className="bg-white border rounded-3xl p-6 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-xl font-bold text-slate-800">{h.year} • {h.level}</h4>
                            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold uppercase">{h.status}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="p-3 bg-slate-50 rounded-xl">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Moyenne S1</p>
                                <p className="text-lg font-bold text-indigo-600">{h.semester1Avg.toFixed(2)}</p>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-xl">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Moyenne S2</p>
                                <p className="text-lg font-bold text-indigo-600">{h.semester2Avg.toFixed(2)}</p>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-xl">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Moyenne Générale</p>
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
                                                {h.status === 'ADMIS_AVEC_DETTE' && <th className="text-center py-2 font-bold uppercase text-amber-600">Dette</th>}
                                                <th className="text-center py-2 font-bold uppercase">TD</th>
                                                <th className="text-center py-2 font-bold uppercase">TP</th>
                                                <th className="text-center py-2 font-bold uppercase">Moy.</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {h.moduleGrades.sort((a, b) => a.semester - b.semester).map((mg, midx) => (
                                                <tr key={midx} className="hover:bg-slate-50 transition-colors">
                                                    <td className="py-2 font-bold text-slate-700">{mg.moduleName}</td>
                                                    <td className="py-2 text-center text-slate-500">S{mg.semester}</td>
                                                    <td className="py-2 text-center font-bold text-slate-600">{mg.cours ?? '-'}</td>
                                                    {h.status === 'ADMIS_AVEC_DETTE' && (
                                                        <td className="py-2 text-center font-bold text-amber-600">{mg.rattrapage ?? '-'}</td>
                                                    )}
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
                {academicHistory.length === 0 && (
                    <p className="text-slate-400 italic text-center py-10">Aucun historique disponible.</p>
                )}
            </div>
        </div>
    );
  }

  const yearGrades = db.grades.filter(g => g.studentId === studentId && allModules.some(m => m.id === g.moduleId));
  const s2Modules = allModules.filter(m => m.semester === 2);
  const s2Grades = db.grades.filter(g => g.studentId === studentId && s2Modules.some(m => m.id === g.moduleId));
  const s2Approved = s2Grades.length > 0 && s2Grades.every(g => g.approved) && s2Grades.length === s2Modules.length;
  const allGradesApproved = yearGrades.length > 0 && yearGrades.every(g => g.approved) && yearGrades.length === allModules.length;

  return (
    <div className="space-y-10">
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl flex items-center gap-3 text-sm font-medium animate-shake">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}
      <div className="flex justify-between items-center no-print">
        <h3 className="text-2xl font-bold text-slate-800">Résultats Académiques</h3>
        <div className="flex items-center gap-4">
            <div className="flex bg-slate-100 p-1 rounded-xl">
                <button onClick={() => setActiveSemester(1)} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeSemester === 1 ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>S1</button>
                <button onClick={() => setActiveSemester(2)} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeSemester === 2 ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>S2</button>
            </div>
            <button onClick={() => setViewHistory(true)} className="text-slate-500 font-bold hover:text-indigo-600 text-sm">Historique</button>
            <button onClick={() => window.print()} className="flex items-center gap-2 bg-slate-800 text-white px-6 py-2.5 rounded-2xl font-bold shadow-lg hover:bg-slate-900 transition-all">
            <Printer className="w-5 h-5" /> Imprimer
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 no-print">
        <div className="bg-white p-6 rounded-3xl border shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Moyenne S1</p>
          <p className="text-3xl font-black text-indigo-600 mt-2">{s1.avg.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Moyenne S2</p>
          <p className="text-3xl font-black text-indigo-600 mt-2">{s2.avg.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Crédits Totaux</p>
          <p className="text-3xl font-black text-indigo-600 mt-2">{totalCredits} / 60</p>
        </div>
        {s2Approved ? (
            <div className={`p-6 rounded-3xl shadow-sm border flex flex-col justify-center ${status.color}`}>
                <p className="text-xs font-bold uppercase tracking-widest opacity-70 text-center">Résultat Annuel</p>
                <p className="text-xl font-black mt-2 text-center">{status.label}</p>
            </div>
        ) : (
            <div className="p-6 rounded-3xl shadow-sm border flex flex-col justify-center bg-slate-50 text-slate-400">
                <p className="text-xs font-bold uppercase tracking-widest opacity-70 text-center">Résultat Annuel</p>
                <p className="text-sm font-bold mt-2 text-center italic">En attente de validation S2</p>
            </div>
        )}
      </div>

      <div className="space-y-12">
        {[activeSemester].map(semNum => {
            const semData = semNum === 1 ? s1 : s2;
            return (
                <div key={semNum} className="space-y-6">
                    <h4 className="text-lg font-bold text-slate-800 flex items-center gap-3">
                        <div className="w-2 h-6 bg-indigo-500 rounded-full"></div>
                        Détail Semestre {semNum}
                    </h4>
                    <div className="bg-white border rounded-3xl overflow-hidden shadow-sm">
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b">
                                <tr className="text-[10px] uppercase font-bold text-slate-400">
                                    <th className="px-6 py-4 text-left">Module / Unité</th>
                                    <th className="px-4 py-4 text-center">Examen</th>
                                    {status.label === 'ADMIS AVEC DETTE' && <th className="px-4 py-4 text-center">Dette</th>}
                                    <th className="px-4 py-4 text-center">TD/TP</th>
                                    <th className="px-4 py-4 text-center">Moyenne</th>
                                    <th className="px-4 py-4 text-center">Crédits</th>
                                </tr>
                            </thead>
                            <tbody>
                                {semData.units.map(u => (
                                    <React.Fragment key={u.name}>
                                        <tr className="bg-slate-50/50">
                                            <td colSpan={3} className="px-6 py-2 font-black text-xs text-indigo-600 uppercase italic">{u.name}</td>
                                            <td className="px-4 py-2 text-center font-black text-xs text-indigo-600 underline">Compens: {u.avg.toFixed(2)}</td>
                                            <td className="px-4 py-2 text-center font-black text-xs text-indigo-600">Total: {u.avg >= 10 ? u.creditsTotal : '0'}</td>
                                        </tr>
                                        {u.modules.map(m => {
                                            const g = db.grades.find(gr => gr.studentId === studentId && gr.moduleId === m.id);
                                            const avg = calculateModuleAvg(m, g);
                                            const gained = u.avg >= 10 || avg >= 10;
                                            const hasDispute = (comp: string) => db.gradeDisputes.some(d => d.gradeId === g?.id && d.component === comp);
                                            
                                            return (
                                                <tr key={m.id} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <p className="font-bold text-slate-700 text-sm">{m.name}</p>
                                                        <p className="text-[10px] text-slate-400">Coeff: {m.coefficient} • Crédit: {m.credits}</p>
                                                    </td>
                                                    <td className="px-4 py-4 text-center text-sm">
                                                        <div 
                                                            className={`cursor-pointer hover:bg-indigo-50 p-1 rounded transition-all ${hasDispute('cours') ? 'border border-rose-200 bg-rose-50' : ''}`}
                                                            onClick={() => g && !g.approved && setDisputeModal({ gradeId: g.id, moduleId: m.id, component: 'cours' })}
                                                        >
                                                            {g?.cours !== undefined ? g.cours : '-'}
                                                            {hasDispute('cours') && <p className="text-[8px] text-rose-500 font-bold mt-1">Contesté</p>}
                                                        </div>
                                                    </td>
                                                    {status.label === 'ADMIS AVEC DETTE' && (
                                                        <td className="px-4 py-4 text-center text-sm">
                                                            <div 
                                                                className={`cursor-pointer hover:bg-amber-50 p-1 rounded transition-all ${hasDispute('rattrapage') ? 'border border-rose-200 bg-rose-50' : ''}`}
                                                                onClick={() => g && !g.approved && setDisputeModal({ gradeId: g.id, moduleId: m.id, component: 'rattrapage' })}
                                                            >
                                                                {g?.rattrapage !== undefined ? (
                                                                    <span className="text-amber-600 font-bold">{g.rattrapage}</span>
                                                                ) : ('-')}
                                                                {hasDispute('rattrapage') && <p className="text-[8px] text-rose-500 font-bold mt-1">Contesté</p>}
                                                            </div>
                                                        </td>
                                                    )}
                                                    <td className="px-4 py-4 text-center text-sm text-slate-500">
                                                        <div className="flex flex-col gap-1">
                                                            {m.hasTD && (
                                                                <span 
                                                                    className={`cursor-pointer hover:text-indigo-600 p-0.5 rounded ${hasDispute('td') ? 'bg-rose-50 text-rose-500 font-bold' : ''}`}
                                                                    onClick={() => g && !g.approved && setDisputeModal({ gradeId: g.id, moduleId: m.id, component: 'td' })}
                                                                >
                                                                    TD: {g?.td !== undefined ? g.td : '-'}
                                                                </span>
                                                            )}
                                                            {m.hasTP && (
                                                                <span 
                                                                    className={`cursor-pointer hover:text-indigo-600 p-0.5 rounded ${hasDispute('tp') ? 'bg-rose-50 text-rose-500 font-bold' : ''}`}
                                                                    onClick={() => g && !g.approved && setDisputeModal({ gradeId: g.id, moduleId: m.id, component: 'tp' })}
                                                                >
                                                                    TP: {g?.tp !== undefined ? g.tp : '-'}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className={`px-4 py-4 text-center font-bold ${avg >= 10 ? 'text-emerald-600' : 'text-rose-500'}`}>{avg.toFixed(2)}</td>
                                                    <td className="px-4 py-4 text-center font-bold">
                                                        {gained ? <span className="text-emerald-600">+{m.credits}</span> : <span className="text-slate-200">0</span>}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        })}
      </div>

      {disputeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
                <h3 className="text-xl font-bold mb-2">Contester la note</h3>
                {error && (
                  <div className="mb-4 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl flex items-center gap-3 text-sm font-medium animate-shake">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                  </div>
                )}
                <p className="text-sm text-slate-500 mb-6">Envoyez un message à l'enseignant concernant votre note de {disputeModal.component}.</p>
                <textarea 
                    className="w-full px-4 py-3 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 mb-6"
                    rows={4}
                    placeholder="Expliquez pourquoi vous pensez qu'il y a une erreur..."
                    value={disputeMessage}
                    onChange={e => setDisputeMessage(e.target.value)}
                />
                <div className="flex gap-4">
                    <button onClick={() => setDisputeModal(null)} className="flex-1 px-4 py-2 border rounded-xl font-bold">Annuler</button>
                    <button onClick={submitDispute} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold">Envoyer</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export const StudentTimetable = ({ studentId }: { studentId: string }) => {
  const { db } = useDB();
  const student = db.users.find(u => u.id === studentId);
  if (!student) return null;

  if (!student.isApprovedForYear) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Inscription en attente</h2>
        <p className="text-slate-500 max-w-md mx-auto">
          Votre inscription administrative pour l'année en cours n'a pas encore été validée par l'administration. 
        </p>
      </div>
    );
  }

  const DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi'];
  const SLOTS = ['08:30 - 10:00', '10:10 - 11:40', '11:50 - 13:20', '13:30 - 15:00', '15:10 - 16:40'];

  const myTimetable = db.timetable.filter(t => {
    const m = db.modules.find(mod => mod.id === t.moduleId);
    const mySpecModules = db.modules.filter(mod => mod.specialtyId === student.specialtyId && mod.level === student.level);
    
    if (t.semester === db.currentSemester && t.specialtyId === student.specialtyId && t.level === student.level) {
      return (t.groupId === student.groupId || t.groupId === 'Tous') &&
             (!student.subSpecialty || !m?.subSpecialty || m?.subSpecialty === student.subSpecialty);
    }

    if (t.semester === db.currentSemester && !m?.subSpecialty && t.level === student.level) {
      const ourEquivalentModule = mySpecModules.find(mod => mod.name === m?.name && !mod.subSpecialty);
      if (ourEquivalentModule) {
        return (t.groupId === student.groupId || t.groupId === 'Tous');
      }
    }

    return false;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center no-print">
        <div>
          <h3 className="text-2xl font-bold text-slate-800">Mon Emploi du Temps</h3>
          <p className="text-slate-500 text-sm">Consultez votre planning hebdomadaire des cours.</p>
        </div>
        <button onClick={() => window.print()} className="flex items-center gap-2 bg-slate-800 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-900 shadow-lg transition-all active:scale-95">
          <Printer className="w-5 h-5" />
          Imprimer
        </button>
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
                  const entry = myTimetable.find(t => t.day === day && t.timeSlot === slot);
                  const module = entry ? db.modules.find(m => m.id === entry.moduleId) : null;
                  const assignment = entry ? db.assignments.find(a => a.moduleId === entry.moduleId && a.type === entry.type) : null;
                  const teacher = assignment ? db.users.find(u => u.id === assignment.teacherId) : null;

                  return (
                    <td 
                      key={slot} 
                      className={`p-2 border relative min-h-[100px] h-32 transition-colors ${entry ? 'bg-indigo-50/30' : ''}`}
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
                        </div>
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const StudentResources = ({ studentId }: { studentId: string }) => {
  const { db } = useDB();
  const student = db.users.find(u => u.id === studentId);
  if (!student) return null;

  const myResources = db.resources.filter(r => 
    r.specialtyId === student.specialtyId && 
    (!r.groupId || r.groupId === student.groupId)
  );

  const modulesWithResources = Array.from(new Set(myResources.map(r => r.moduleId)));

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-2xl font-bold text-slate-800">Supports de Cours & TD</h3>
        <p className="text-slate-500">Téléchargez les documents partagés par vos enseignants.</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {modulesWithResources.map(modId => {
          const module = db.modules.find(m => m.id === modId);
          const modResources = myResources.filter(r => r.moduleId === modId);
          
          return (
            <div key={modId} className="space-y-4">
              <h4 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                <div className="w-1.5 h-5 bg-indigo-500 rounded-full"></div>
                {module?.name}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {modResources.map(r => (
                  <a 
                    key={r.id} 
                    href={r.url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="p-4 bg-white border rounded-2xl shadow-sm hover:border-indigo-300 hover:shadow-md transition-all group"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        r.category === 'Cours' ? 'bg-blue-100 text-blue-700' : 
                        r.category === 'TD' ? 'bg-purple-100 text-purple-700' : 'bg-teal-100 text-teal-700'
                      }`}>{r.category}</span>
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold">{r.type}</span>
                    </div>
                    <h5 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{r.title}</h5>
                    <div className="mt-4 flex items-center justify-between text-[10px] text-slate-400">
                      <span>Par {db.users.find(u => u.id === r.teacherId)?.fullName}</span>
                      <span>{new Date(r.uploadDate).toLocaleDateString()}</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          );
        })}
        {modulesWithResources.length === 0 && (
          <div className="py-20 text-center border-2 border-dashed rounded-3xl text-slate-300 italic">
            Aucun support disponible pour le moment.
          </div>
        )}
      </div>
    </div>
  );
};
