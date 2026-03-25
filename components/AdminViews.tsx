import React, { useState, useEffect } from 'react';
import { generatePassword, clearLocalData } from '../src/store/db';
import { useDB } from '../src/store/DBContext';
import { University, Faculty, Specialty, SystemType, UserRole, User } from '../types';
import { supabaseService } from '../src/services/supabaseService';
// Fixed: Added School to the imports from lucide-react
import { Plus, Building2, Trash2, UserPlus, Printer, Search, School, AlertCircle, RefreshCw, CheckCircle2, Edit3 } from 'lucide-react';

export const AdminDashboard = () => {
    // Vérification des crédits par semestre
    const checkSemesterCredits = () => {
      const semesters = [1, 2];
      let errors: string[] = [];
      semesters.forEach(sem => {
        // Pour chaque spécialité et niveau
        db.specialties.forEach(spec => {
          const levels = db.modules.filter(m => m.specialtyId === spec.id).map(m => m.level);
          Array.from(new Set(levels)).forEach(level => {
            const modules = db.modules.filter(m => m.specialtyId === spec.id && m.semester === sem && m.level === level);
            const totalCredits = modules.reduce((sum, m) => sum + m.credits, 0);
            if (totalCredits !== 30) {
              errors.push(`Spécialité ${spec.name}, niveau ${level}, semestre ${sem}: crédits = ${totalCredits}`);
            }
          });
        });
      });
      return errors;
    };

  const { db, setDb } = useDB();
  const stats = [
    { label: 'Universités', value: db.universities.length, icon: Building2, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Facultés', value: db.faculties.length, icon: Building2, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { label: 'Spécialités', value: db.specialties.length, icon: Building2, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { label: 'Utilisateurs', value: db.users.length, icon: UserPlus, color: 'text-orange-600', bg: 'bg-orange-100' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Tableau de Bord Administrateur</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-xl border border-slate-200 flex items-center gap-4 shadow-sm">
            <div className={`p-3 rounded-lg ${stat.bg} ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
              <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const UniversityManager = () => {
  const { db, setDb } = useDB();
  const [newUni, setNewUni] = useState('');
  const [newFac, setNewFac] = useState({ name: '', uniId: '' });
  const [error, setError] = useState('');
  const [editingUni, setEditingUni] = useState<University | null>(null);
  const [editName, setEditName] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; visible: boolean }>({ message: '', type: 'success', visible: false });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  };

  const addUni = async () => {
    setError('');
    if (!newUni) {
      setError("Veuillez saisir le nom de l'université.");
      return;
    }
    const uni = { id: Date.now().toString(), name: newUni };
    try {
      await supabaseService.saveUniversity(uni);
      setDb(prev => ({ ...prev, universities: [...prev.universities, uni] }));
      setNewUni('');
    } catch (err: any) {
      setError("Erreur lors de l'ajout de l'université");
    }
  };

  const addFac = async () => {
    setError('');
    if (!newFac.name || !newFac.uniId) {
      setError("Veuillez saisir le nom de la faculté et sélectionner une université.");
      return;
    }
    const fac = { id: Date.now().toString(), universityId: newFac.uniId, name: newFac.name };
    try {
      await supabaseService.saveFaculty(fac);
      setDb(prev => ({ ...prev, faculties: [...prev.faculties, fac] }));
      setNewFac({ name: '', uniId: '' });
    } catch (err: any) {
      setError("Erreur lors de l'ajout de la faculté");
    }
  };

  const removeUni = async (id: string) => {
    setError('');
    const uni = db.universities.find(u => u.id === id);
    if (!uni) {
      setError("Université introuvable.");
      return;
    }
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer l'université "${uni.name}" ?`)) return;

    if (db.faculties.some(f => f.universityId === id)) {
      setError("Impossible de supprimer cette université car elle contient des facultés.");
      return;
    }
    try {
      await supabaseService.deleteUniversity(id);
      setDb(prev => ({ ...prev, universities: prev.universities.filter(u => u.id !== id) }));
      showToast(`Université "${uni.name}" supprimée avec succès.`, 'success');
    } catch (err: any) {
      setError("Erreur lors de la suppression");
      showToast("Erreur lors de la suppression de l'université.", 'error');
    }
  };

  const startEditUni = (uni: University) => {
    setEditingUni(uni);
    setEditName(uni.name);
  };

  const saveEditUni = async () => {
    if (!editingUni) return;
    if (!editName.trim()) {
      setError("Le nom de l'université ne peut pas être vide.");
      return;
    }

    if (!window.confirm(`Confirmez-vous la modification du nom de l'université "${editingUni.name}" en "${editName.trim()}" ?`)) {
      return;
    }

    try {
      const updatedUni = { ...editingUni, name: editName.trim() };
      await supabaseService.saveUniversity(updatedUni);
      setDb(prev => ({
        ...prev,
        universities: prev.universities.map(u => (u.id === updatedUni.id ? updatedUni : u))
      }));
      setEditingUni(null);
      setEditName('');
      showToast(`Université mise à jour: ${updatedUni.name}`, 'success');
    } catch (err: any) {
      setError("Erreur lors de la mise à jour de l'université");
      showToast("Erreur lors de la mise à jour de l'université.", 'error');
    }
  };

  const cancelEdit = () => {
    setEditingUni(null);
    setEditName('');
    setError('');
  };

  const removeFac = async (id: string) => {
    setError('');
    if (db.specialties.some(s => s.facultyId === id)) {
      setError("Impossible de supprimer cette faculté car elle contient des spécialités.");
      return;
    }
    try {
      await supabaseService.deleteFaculty(id);
    } catch (err: any) {
      setError("Erreur lors de la suppression");
    }
  };

  return (
    <div className="space-y-8">
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl flex items-center gap-3 text-sm font-medium animate-shake">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {toast.visible && (
        <div className={`fixed bottom-8 right-8 z-50 px-4 py-3 rounded-lg text-white shadow-lg ${
            toast.type === 'success' ? 'bg-green-600' : toast.type === 'error' ? 'bg-rose-600' : 'bg-indigo-600'
          }`}>
          {toast.message}
        </div>
      )}

      <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-indigo-600" />
          Ajouter une Université
        </h3>
        <div className="flex gap-4">
          <input 
            className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
            placeholder="Nom de l'université..."
            value={newUni}
            onChange={e => setNewUni(e.target.value)}
          />
          <button onClick={addUni} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
            Ajouter
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h3 className="font-bold text-slate-700 mb-4">Liste des Universités</h3>
          <div className="space-y-2">
            {db.universities.map(u => (
              <div key={u.id} className="p-4 bg-white border rounded-lg flex justify-between items-center group hover:border-indigo-300">
                <span className="font-medium text-slate-700">{u.name}</span>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  <button onClick={() => startEditUni(u)} className="text-slate-400 hover:text-indigo-500">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => removeUni(u.id)} className="text-slate-400 hover:text-rose-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-bold text-slate-700 mb-4">Gestion des Facultés</h3>
          <div className="bg-white p-4 border rounded-xl space-y-4 mb-4">
             <select 
               className="w-full px-4 py-2 border rounded-lg outline-none"
               value={newFac.uniId}
               onChange={e => setNewFac({...newFac, uniId: e.target.value})}
             >
               <option value="">Sélectionner Université</option>
               {db.universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
             </select>
             <input 
               className="w-full px-4 py-2 border rounded-lg outline-none" 
               placeholder="Nom de la faculté..."
               value={newFac.name}
               onChange={e => setNewFac({...newFac, name: e.target.value})}
             />
             <button onClick={addFac} className="w-full bg-slate-800 text-white py-2 rounded-lg font-medium hover:bg-slate-900 transition-colors">
               Ajouter Faculté
             </button>
          </div>
          <div className="space-y-2">
            {db.faculties.map(f => (
              <div key={f.id} className="p-3 bg-slate-50 border rounded-lg flex justify-between items-center group">
                <div>
                  <span className="font-medium text-slate-700">{f.name}</span>
                  <p className="text-xs text-slate-400">{db.universities.find(u => u.id === f.universityId)?.name}</p>
                </div>
                <button onClick={() => removeFac(f.id)} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {editingUni && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Modifier Université</h3>
            <input
              value={editName}
              onChange={e => setEditName(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg outline-none mb-4"
            />
            <div className="flex justify-end gap-3">
              <button onClick={cancelEdit} className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-100">Annuler</button>
              <button onClick={saveEditUni} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface UserManagerProps {
  currentUser: User;
  onImpersonate?: (user: User) => void;
}

export const UserManager = ({ currentUser, onImpersonate }: UserManagerProps) => {
  const { db, setDb } = useDB();
  const agentSpecialty = currentUser.role === UserRole.AGENT ? db.specialties.find(s => s.agentId === currentUser.id) : undefined;
  const visibleUsers = db.users.filter(u => {
    if (currentUser.role === UserRole.ADMIN) {
      return u.role === UserRole.AGENT;
    }
    if (currentUser.role === UserRole.AGENT) {
      // Teachers/students créés par cet agent
      // ou hérités de l'ancienne logique (sans createdBy) sur sa spécialité
      return (u.role === UserRole.TEACHER || u.role === UserRole.STUDENT) &&
        (u.createdBy === currentUser.id || (!u.createdBy && agentSpecialty && u.specialtyId === agentSpecialty.id));
    }
    return false;
  });

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; visible: boolean }>({ message: '', type: 'info', visible: false });
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUserForm, setEditUserForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthDate: '',
    username: ''
  });

  const filteredUsers = visibleUsers.filter(u => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return true;

    const specialtyName = u.specialtyId ? (db.specialties.find(s => s.id === u.specialtyId)?.name || '') : '';
    return (
      (u.fullName || '').toLowerCase().includes(term) ||
      (u.username || '').toLowerCase().includes(term) ||
      specialtyName.toLowerCase().includes(term)
    );
  });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  };

  const formatDateForInput = (date?: string) => {
    if (!date) return '';
    const french = date.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (french) return `${french[3]}-${french[2]}-${french[1]}`;
    const iso = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (iso) return date;
    return '';
  };

  const startEditUser = (u: User) => {
    setEditingUser(u);
    setEditUserForm({
      firstName: u.firstName || '',
      lastName: u.lastName || '',
      email: u.email || '',
      phone: u.phone || '',
      birthDate: formatDateForInput(u.birthDate),
      username: u.username || ''
    });
  };

  const cancelEditUser = () => {
    setEditingUser(null);
  };

  const saveEditUser = async () => {
    if (!editingUser) return;
    const updatedUser: User = {
      ...editingUser,
      firstName: editUserForm.firstName.trim(),
      lastName: editUserForm.lastName.trim(),
      fullName: `${editUserForm.firstName.trim()} ${editUserForm.lastName.trim()}`.trim(),
      email: editUserForm.email.trim(),
      phone: editUserForm.phone.trim(),
      birthDate: editUserForm.birthDate.trim(),
      username: editUserForm.username.trim()
    };

    if (!updatedUser.firstName || !updatedUser.lastName || !updatedUser.username) {
      showToast('Prénom, nom et nom d’utilisateur sont obligatoires.', 'error');
      return;
    }

    try {
      await supabaseService.saveUser(updatedUser);
      setDb(prev => ({
        ...prev,
        users: prev.users.map(item => (item.id === updatedUser.id ? updatedUser : item))
      }));
      setEditingUser(null);
      showToast('Agent mis à jour avec succès.', 'success');
    } catch (err: any) {
      showToast('Erreur lors de la mise à jour de l’agent.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-slate-800">Tous les utilisateurs</h3>
      <p className="text-sm text-slate-500">Utilisez Modifier/Supprimer pour gérer les utilisateurs listés selon vos droits.</p>
      <div className="mt-4 mb-4 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Rechercher nom, prénom, username ou spécialité..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="search-input w-full md:w-1/2 pl-11"
        />
      </div>

      {toast.visible && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}

      <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-sm">
        <table className="min-w-full text-left">
          <thead className="bg-slate-100 text-slate-600 text-xs uppercase tracking-wider">
            <tr>
              <th className="px-4 py-2">Nom</th>
              <th className="px-4 py-2">Utilisateur</th>
              <th className="px-4 py-2">Mot de passe</th>
              <th className="px-4 py-2">Rôle</th>
              <th className="px-4 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr><td className="px-4 py-3" colSpan={5}>Aucun utilisateur correspondant à la recherche.</td></tr>
            ) : (
              filteredUsers.map(u => {
                const canSeePassword =
                  (currentUser.role === UserRole.ADMIN && u.role === UserRole.AGENT) ||
                  (currentUser.role === UserRole.AGENT && (u.role === UserRole.TEACHER || u.role === UserRole.STUDENT));

                return (
                  <tr key={u.id} className="border-t border-slate-200">
                    <td className="px-4 py-3">{u.fullName || '-'} </td>
                    <td className="px-4 py-3">{u.username}</td>
                    <td className="px-4 py-3">{canSeePassword ? (u.password || '—') : '—'}</td>
                    <td className="px-4 py-3 capitalize">{u.role}</td>
                    <td className="px-4 py-3 flex gap-2">
                      <button
                        onClick={() => startEditUser(u)}
                        className="px-3 py-1 rounded-lg bg-blue-600 text-white text-xs hover:bg-blue-700"
                      >
                        Modifier
                      </button>
                      <button
                        onClick={() => {
                          if (!window.confirm(`Supprimer ${u.fullName || u.username} ?`)) return;
                          supabaseService.deleteUser(u.id).then(() => {
                            setDb(prev => ({
                              ...prev,
                              users: prev.users.filter(item => item.id !== u.id)
                            }));
                            showToast('Agent supprimé', 'success');
                          }).catch((err:any) => {
                            showToast('Erreur lors de la suppression', 'error');
                          });
                        }}
                        className="px-3 py-1 rounded-lg bg-rose-500 text-white text-xs hover:bg-rose-600"
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {editingUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Modifier l'agent</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="space-y-1 text-sm">
                <span>Prénom</span>
                <input
                  type="text"
                  value={editUserForm.firstName}
                  onChange={e => setEditUserForm(prev => ({ ...prev, firstName: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg outline-none"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span>Nom de famille</span>
                <input
                  type="text"
                  value={editUserForm.lastName}
                  onChange={e => setEditUserForm(prev => ({ ...prev, lastName: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg outline-none"
                />
              </label>
              <label className="space-y-1 text-sm col-span-1 sm:col-span-2">
                <span>Email</span>
                <input
                  type="email"
                  value={editUserForm.email}
                  onChange={e => setEditUserForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg outline-none"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span>Téléphone</span>
                <input
                  type="tel"
                  value={editUserForm.phone}
                  onChange={e => setEditUserForm(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg outline-none"
                />
              </label>
              <label className="space-y-1 text-sm">
                <span>Date de naissance</span>
                <input
                  type="date"
                  value={editUserForm.birthDate}
                  onChange={e => setEditUserForm(prev => ({ ...prev, birthDate: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg outline-none"
                />
              </label>
              <label className="space-y-1 text-sm col-span-1 sm:col-span-2">
                <span>Nom d'utilisateur</span>
                <input
                  type="text"
                  value={editUserForm.username}
                  onChange={e => setEditUserForm(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg outline-none"
                />
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={cancelEditUser} className="px-3 py-2 rounded-lg border text-slate-700 hover:bg-slate-100">Annuler</button>
              <button onClick={saveEditUser} className="px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const SpecialtyManager = () => {
  const { db, setDb } = useDB();
  const [showModal, setShowModal] = useState(false);
  const [printData, setPrintData] = useState<any>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newSpec, setNewSpec] = useState({
    name: '',
    facultyId: '',
    system: SystemType.LMD,
    agentFirstName: '',
    agentLastName: '',
    agentUsername: '',
    agentEmail: '',
    agentPhone: '',
    agentBirthDate: ''
  });
  const [editingSpec, setEditingSpec] = useState<Specialty | null>(null);
  const [editSpecName, setEditSpecName] = useState('');
  const [agentReplacementSpec, setAgentReplacementSpec] = useState<Specialty | null>(null);
  const [replacementAgentId, setReplacementAgentId] = useState('');
  const [replacementError, setReplacementError] = useState('');
  const [replacementMode, setReplacementMode] = useState<'existing' | 'new'>('existing');
  const [newAgentInfo, setNewAgentInfo] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    phone: '',
    birthDate: ''
  });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info'; visible: boolean }>({ message: '', type: 'success', visible: false });

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  };

  const replaceAgentForSpecialty = async () => {
    if (!agentReplacementSpec) return;

    let agent;

    if (replacementMode === 'existing') {
      if (!replacementAgentId) {
        setReplacementError("Veuillez sélectionner un agent remplaçant.");
        return;
      }
      agent = db.users.find(u => u.id === replacementAgentId && u.role === UserRole.AGENT);
      if (!agent) {
        setReplacementError("Agent introuvable ou rôle invalide.");
        return;
      }
    } else {
      const { firstName, lastName, username, email, phone, birthDate } = newAgentInfo;
      if (!firstName || !lastName || !username || !email || !phone || !birthDate) {
        setReplacementError('Veuillez remplir toutes les informations du nouvel agent.');
        return;
      }
      if (db.users.some(u => u.username === username)) {
        setReplacementError('Ce nom d’utilisateur existe déjà. Veuillez en choisir un autre.');
        return;
      }

      const userId = Date.now().toString() + '_agent';
      const password = generatePassword();
      const newAgent: User = {
        id: userId,
        username,
        password,
        role: UserRole.AGENT,
        fullName: `${firstName} ${lastName}`,
        firstName,
        lastName,
        email,
        phone,
        birthDate
      };

      try {
        await supabaseService.saveUser(newAgent);
        setDb(prev => ({ ...prev, users: [...prev.users, newAgent] }));
        agent = newAgent;
        showToast(`Nouvel agent créé : ${newAgent.fullName}`, 'success');
      } catch (err: any) {
        setReplacementError(err.message || 'Erreur lors de la création du nouvel agent.');
        showToast('Erreur lors de la création du nouvel agent.', 'error');
        return;
      }
    }

    try {
      const updatedSpec = { ...agentReplacementSpec, agentId: agent.id };
      await supabaseService.saveSpecialty(updatedSpec);
      setDb(prev => ({
        ...prev,
        specialties: prev.specialties.map(s => (s.id === updatedSpec.id ? updatedSpec : s))
      }));
      if (replacementMode === 'new') {
        setPrintData({
          username: agent.username,
          password: agent.password,
          fullName: agent.fullName,
          specialty: updatedSpec.name
        });
      }
      setAgentReplacementSpec(null);
      setReplacementAgentId('');
      setReplacementError('');
      setNewAgentInfo({ firstName: '', lastName: '', username: '', email: '', phone: '', birthDate: '' });
      setReplacementMode('existing');
      showToast(`Agent remplacé pour ${updatedSpec.name}.`, 'success');
    } catch (err: any) {
      setReplacementError(err.message || "Erreur lors du remplacement de l'agent.");
      showToast("Erreur lors du remplacement de l'agent.", 'error');
    }
  };


  const addSpec = async () => {
    setError('');
    if (!newSpec.name || !newSpec.facultyId || !newSpec.agentFirstName || !newSpec.agentLastName || !newSpec.agentUsername || !newSpec.agentEmail || !newSpec.agentPhone || !newSpec.agentBirthDate) {
      setError("Veuillez remplir tous les champs obligatoires pour la spécialité et l'agent.");
      return;
    }
    
    // Check if agent exists
    const existingAgent = db.users.find(u => u.username === newSpec.agentUsername);
    if (existingAgent) {
      setError("L'agent existe déjà avec ce nom d'utilisateur !");
      return;
    }

    const agentId = Date.now().toString() + '_agent';
    const password = generatePassword();
    const newAgent: User = {
      id: agentId,
      username: newSpec.agentUsername,
      password,
      role: UserRole.AGENT,
      fullName: `${newSpec.agentFirstName} ${newSpec.agentLastName}`,
      firstName: newSpec.agentFirstName,
      lastName: newSpec.agentLastName,
      email: newSpec.agentEmail,
      phone: newSpec.agentPhone,
      birthDate: newSpec.agentBirthDate
    };

    const specId = Date.now().toString() + '_spec';
    const newSpecialty: Specialty = {
      id: specId,
      facultyId: newSpec.facultyId,
      name: newSpec.name,
      system: newSpec.system,
      agentId: agentId
    };

    try {
      await supabaseService.saveUser(newAgent);
      await supabaseService.saveSpecialty(newSpecialty);
      setDb(prev => ({ 
        ...prev, 
        users: [...prev.users, newAgent],
        specialties: [...prev.specialties, newSpecialty]
      }));
      setSuccess("Spécialité créée avec succès !");
      showToast("Spécialité créée avec succès !", 'success');
      setPrintData({ username: newAgent.username, password, fullName: newAgent.fullName, specialty: newSpecialty.name });
      setShowModal(false);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la création de la spécialité");
      showToast("Erreur lors de la création de la spécialité.", 'error');
    }
  };

  const startEditSpecialty = (spec: Specialty) => {
    setEditingSpec(spec);
    setEditSpecName(spec.name);
  };

  const saveEditSpecialty = async () => {
    if (!editingSpec) return;
    if (!editSpecName.trim()) {
      setError("Le nom de la spécialité ne peut pas être vide.");
      return;
    }

    if (!window.confirm(`Confirmez-vous la modification de la spécialité "${editingSpec.name}" en "${editSpecName.trim()}" ?`)) {
      return;
    }

    try {
      const updated = { ...editingSpec, name: editSpecName.trim() };
      await supabaseService.saveSpecialty(updated);
      setDb(prev => ({
        ...prev,
        specialties: prev.specialties.map(s => (s.id === updated.id ? updated : s))
      }));
      setEditingSpec(null);
      setEditSpecName('');
      showToast("Spécialité mise à jour avec succès.", 'success');
    } catch (err: any) {
      setError("Erreur lors de la mise à jour de la spécialité");
      showToast("Erreur lors de la mise à jour de la spécialité.", 'error');
    }
  };

  const cancelEditSpecialty = () => {
    setEditingSpec(null);
    setEditSpecName('');
    setError('');
  };

  const removeSpecialty = async (id: string) => {
    const spec = db.specialties.find(s => s.id === id);
    if (!spec) {
      setError("Spécialité introuvable.");
      return;
    }

    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer la spécialité "${spec.name}" ?`)) {
      return;
    }

    if (db.users.some(u => u.specialtyId === id)) {
      setError("Impossible de supprimer cette spécialité car des utilisateurs y sont rattachés.");
      showToast("Impossible de supprimer, des utilisateurs sont rattachés à cette spécialité.", 'error');
      return;
    }

    try {
      await supabaseService.deleteSpecialty?.(id);
      setDb(prev => ({
        ...prev,
        specialties: prev.specialties.filter(s => s.id !== id)
      }));
      showToast("Spécialité supprimée avec succès.", 'success');
    } catch (err: any) {
      setError("Erreur lors de la suppression de la spécialité");
      showToast("Erreur lors de la suppression de la spécialité.", 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-slate-800">Catalogue des Spécialités</h3>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700">
          <Plus className="w-5 h-5" />
          Nouvelle Spécialité
        </button>
      </div>

      {success && (
        <div className="p-4 bg-green-50 border border-green-100 text-green-600 rounded-xl flex items-center gap-3 text-sm font-medium animate-in fade-in slide-in-from-top-4 duration-500">
          <CheckCircle2 className="w-5 h-5" />
          {success}
        </div>
      )}

      {toast.visible && (
        <div className={`fixed bottom-8 right-8 z-50 px-4 py-3 rounded-lg text-white shadow-lg ${
            toast.type === 'success' ? 'bg-green-600' : toast.type === 'error' ? 'bg-rose-600' : 'bg-indigo-600'
          }`}>
          {toast.message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {db.specialties.map(s => {
          const faculty = db.faculties.find(f => f.id === s.facultyId);
          const agent = db.users.find(u => u.id === s.agentId);
          return (
            <div key={s.id} className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">{s.system}</span>
                <div className="flex gap-2">
                  <button onClick={() => {
                    const pass = generatePassword();
                    setPrintData({ username: agent?.username, password: 'Reprinted...', fullName: agent?.fullName, specialty: s.name });
                  }} className="text-slate-400 hover:text-indigo-600">
                    <Printer className="w-5 h-5" />
                  </button>
                  <button onClick={() => startEditSpecialty(s)} className="text-slate-400 hover:text-indigo-600">
                    <Edit3 className="w-5 h-5" />
                  </button>
                  <button onClick={() => {
                      setAgentReplacementSpec(s);
                      setReplacementAgentId(s.agentId || '');
                      setReplacementError('');
                  }} className="text-slate-400 hover:text-yellow-500">
                    <UserPlus className="w-5 h-5" />
                  </button>
                  <button onClick={() => removeSpecialty(s.id)} className="text-slate-400 hover:text-rose-500">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <h4 className="text-lg font-bold text-slate-800 mb-1">{s.name}</h4>
              <p className="text-sm text-slate-500 mb-4">{faculty?.name}</p>
              <div className="pt-4 border-t flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                  {agent?.fullName?.charAt(0)}
                </div>
                <div>
                  <p className="text-xs text-slate-400">Responsable Agent</p>
                  <p className="text-sm font-semibold text-slate-700">{agent?.fullName}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6 text-slate-800">Ajouter Spécialité & Agent</h3>
            {error && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl flex items-center gap-3 text-sm font-medium animate-shake">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nom Spécialité</label>
                <input 
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" 
                  value={newSpec.name}
                  onChange={e => setNewSpec({...newSpec, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Faculté</label>
                  <select 
                    className="w-full px-4 py-2 border rounded-lg outline-none"
                    value={newSpec.facultyId}
                    onChange={e => setNewSpec({...newSpec, facultyId: e.target.value})}
                  >
                    <option value="">Sélectionner</option>
                    {db.faculties.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Système</label>
                  <select 
                    className="w-full px-4 py-2 border rounded-lg outline-none"
                    value={newSpec.system}
                    onChange={e => setNewSpec({...newSpec, system: e.target.value as SystemType})}
                  >
                    {Object.values(SystemType).map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div className="pt-4 border-t">
                <h4 className="font-bold text-indigo-700 mb-3">Informations de l'Agent</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Prénom</label>
                    <input
                      className="w-full px-4 py-2 border rounded-lg outline-none"
                      value={newSpec.agentFirstName}
                      onChange={e => setNewSpec({...newSpec, agentFirstName: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Nom de famille</label>
                    <input
                      className="w-full px-4 py-2 border rounded-lg outline-none"
                      value={newSpec.agentLastName}
                      onChange={e => setNewSpec({...newSpec, agentLastName: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      className="w-full px-4 py-2 border rounded-lg outline-none"
                      value={newSpec.agentEmail}
                      onChange={e => setNewSpec({...newSpec, agentEmail: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Téléphone</label>
                    <input
                      className="w-full px-4 py-2 border rounded-lg outline-none"
                      value={newSpec.agentPhone}
                      onChange={e => setNewSpec({...newSpec, agentPhone: e.target.value})}
                    />
                  </div>
                </div>
                <div className="pt-4">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Date de naissance</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2 border rounded-lg outline-none"
                    value={newSpec.agentBirthDate}
                    onChange={e => setNewSpec({...newSpec, agentBirthDate: e.target.value})}
                  />
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Nom d'Utilisateur</label>
                  <input
                    className="w-full px-4 py-2 border rounded-lg outline-none"
                    placeholder="Ex: agent_info"
                    value={newSpec.agentUsername}
                    onChange={e => setNewSpec({...newSpec, agentUsername: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-6">
                <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border rounded-lg font-medium hover:bg-slate-50">Annuler</button>
                <button onClick={addSpec} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700">Créer Specialté</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingSpec && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-slate-800">Modifier Spécialité</h3>
            {error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl flex items-center gap-2 text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
            <label className="block text-sm font-medium text-slate-700 mb-2">Nom de la spécialité</label>
            <input
              value={editSpecName}
              onChange={e => setEditSpecName(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg outline-none mb-4"
            />
            <div className="flex justify-end gap-3">
              <button onClick={cancelEditSpecialty} className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-100">Annuler</button>
              <button onClick={saveEditSpecialty} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {agentReplacementSpec && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-slate-800">Remplacer l'agent pour {agentReplacementSpec.name}</h3>
            {replacementError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl flex items-center gap-2 text-sm">
                <AlertCircle className="w-4 h-4" />
                {replacementError}
              </div>
            )}
            <div className="mb-4">
              <div className="flex gap-4">
                <button
                  className={`px-3 py-2 rounded-lg ${replacementMode === 'existing' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                  onClick={() => setReplacementMode('existing')}
                >Agent existant</button>
                <button
                  className={`px-3 py-2 rounded-lg ${replacementMode === 'new' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                  onClick={() => setReplacementMode('new')}
                >Nouvel agent</button>
              </div>
            </div>

            {replacementMode === 'existing' ? (
              <>
                <label className="block text-sm font-medium text-slate-700 mb-2">Agent remplaçant</label>
                <select
                  className="w-full px-4 py-2 border rounded-lg outline-none mb-4"
                  value={replacementAgentId}
                  onChange={e => setReplacementAgentId(e.target.value)}
                >
                  <option value="">Sélectionner un agent</option>
                  {db.users
                    .filter(u => u.role === UserRole.AGENT)
                    .map(agent => (
                      <option key={agent.id} value={agent.id}>{agent.fullName || agent.username}</option>
                  ))}
                </select>
              </>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" className="px-3 py-2 border rounded-lg" placeholder="Prénom" value={newAgentInfo.firstName} onChange={e => setNewAgentInfo({...newAgentInfo, firstName: e.target.value})} />
                  <input type="text" className="px-3 py-2 border rounded-lg" placeholder="Nom" value={newAgentInfo.lastName} onChange={e => setNewAgentInfo({...newAgentInfo, lastName: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" className="px-3 py-2 border rounded-lg" placeholder="Nom d'utilisateur" value={newAgentInfo.username} onChange={e => setNewAgentInfo({...newAgentInfo, username: e.target.value})} />
                  <input type="email" className="px-3 py-2 border rounded-lg" placeholder="Email" value={newAgentInfo.email} onChange={e => setNewAgentInfo({...newAgentInfo, email: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" className="px-3 py-2 border rounded-lg" placeholder="Téléphone" value={newAgentInfo.phone} onChange={e => setNewAgentInfo({...newAgentInfo, phone: e.target.value})} />
                  <input type="date" className="px-3 py-2 border rounded-lg" placeholder="Date de naissance" value={newAgentInfo.birthDate} onChange={e => setNewAgentInfo({...newAgentInfo, birthDate: e.target.value})} />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => {
                setAgentReplacementSpec(null);
                setReplacementAgentId('');
                setReplacementError('');
                setReplacementMode('existing');
                setNewAgentInfo({ firstName: '', lastName: '', username: '', email: '', phone: '', birthDate: '' });
              }} className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-100">Annuler</button>
              <button onClick={replaceAgentForSpecialty} className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600">Remplacer</button>
            </div>
          </div>
        </div>
      )}

      {printData && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
          <div className="bg-white p-12 rounded-lg max-w-md w-full shadow-2xl relative text-center">
            <div className="mb-6 flex justify-center">
              <School className="w-12 h-12 text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">Fiche d'Accès - Agent</h3>
            <p className="text-slate-500 mb-6">EduQuest - Système de Gestion</p>
            <div className="bg-slate-50 p-6 rounded-xl border-2 border-dashed border-indigo-200 text-left space-y-3">
              <div>
                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Agent</p>
                <p className="font-bold text-lg">{printData.fullName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Spécialité</p>
                <p className="font-semibold">{printData.specialty}</p>
              </div>
              <div className="pt-3 border-t">
                <p className="text-sm font-medium">Username: <span className="font-mono bg-indigo-100 px-2 py-0.5 rounded">{printData.username}</span></p>
                <p className="text-sm font-medium mt-1">Password: <span className="font-mono bg-indigo-100 px-2 py-0.5 rounded">{printData.password}</span></p>
              </div>
            </div>
            <button 
              onClick={() => { window.print(); setPrintData(null); }} 
              className="mt-8 bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 flex items-center gap-2 mx-auto no-print"
            >
              <Printer className="w-5 h-5" />
              Imprimer & Fermer
            </button>
            <button onClick={() => setPrintData(null)} className="mt-4 text-slate-400 hover:text-slate-600 font-medium no-print">Annuler</button>
          </div>
        </div>
      )}
    </div>
  );
};
