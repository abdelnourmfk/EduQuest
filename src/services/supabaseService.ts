
import { supabase } from '../lib/supabase';
import { 
  User, University, Faculty, Specialty, SubSpecialty, Module, 
  Assignment, TimetableEntry, Grade, Resource, Notification,
  AcademicYearRecord, GradeDispute, Room
} from '../../types';

export const supabaseService = {
  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase.from('users').select('*');
    if (error) throw error;
    return (data || []).map(u => ({
      ...u,
      fullName: u.full_name,
      specialtyId: u.specialty_id,
      subSpecialtyId: u.sub_specialty_id,
      subSpecialty: u.sub_specialty,
      groupId: u.group_id,
      birthDate: u.birth_date,
      birthPlace: u.birth_place,
      hiringDate: u.hiring_date,
      isApprovedForYear: u.is_approved_for_year
    }));
  },

  async saveUser(user: User) {
    const { error } = await supabase.from('users').upsert({
      id: user.id,
      username: user.username,
      password: user.password,
      role: user.role,
      full_name: user.fullName,
      specialty_id: user.specialtyId,
      sub_specialty_id: user.subSpecialtyId,
      sub_specialty: user.subSpecialty,
      group_id: user.groupId,
      level: user.level,
      first_name: user.firstName,
      last_name: user.lastName,
      birth_date: user.birthDate,
      birth_place: user.birthPlace,
      gender: user.gender,
      address: user.address,
      phone: user.phone,
      email: user.email,
      hiring_date: user.hiringDate,
      is_approved_for_year: user.isApprovedForYear
    });
    if (error) throw error;
  },

  async getUniversities(): Promise<University[]> {
    const { data, error } = await supabase.from('universities').select('*');
    if (error) throw error;
    return data || [];
  },

  async getFaculties(): Promise<Faculty[]> {
    const { data, error } = await supabase.from('faculties').select('*');
    if (error) throw error;
    return (data || []).map(f => ({
      ...f,
      universityId: f.university_id
    }));
  },

  async getSpecialties(): Promise<Specialty[]> {
    const { data, error } = await supabase.from('specialties').select('*');
    if (error) throw error;
    return (data || []).map(s => ({
      ...s,
      facultyId: s.faculty_id,
      agentId: s.agent_id,
      creditThreshold: s.credit_threshold,
      doctoratYears: s.doctorat_years,
      classicYears: s.classic_years,
      activeSubsystem: s.active_subsystem
    }));
  },

  async getSubSpecialties(): Promise<SubSpecialty[]> {
    const { data, error } = await supabase.from('sub_specialties').select('*');
    if (error) throw error;
    return (data || []).map(s => ({
      ...s,
      specialtyId: s.specialty_id
    }));
  },

  async getModules(): Promise<Module[]> {
    const { data, error } = await supabase.from('modules').select('*');
    if (error) throw error;
    return (data || []).map(m => ({
      ...m,
      specialtyId: m.specialty_id,
      subSpecialtyId: m.sub_specialty_id,
      subSpecialty: m.sub_specialty,
      hasCours: m.has_cours,
      hasTD: m.has_td,
      hasTP: m.has_tp
    }));
  },

  async getAssignments(): Promise<Assignment[]> {
    const { data, error } = await supabase.from('assignments').select('*');
    if (error) throw error;
    return (data || []).map(a => ({
      ...a,
      moduleId: a.module_id,
      teacherId: a.teacher_id
    }));
  },

  async getTimetable(): Promise<TimetableEntry[]> {
    const { data, error } = await supabase.from('timetable_entries').select('*');
    if (error) throw error;
    return (data || []).map(t => ({
      ...t,
      specialtyId: t.specialty_id,
      subSpecialtyId: t.sub_specialty_id,
      subSpecialty: t.sub_specialty,
      groupId: t.group_id,
      timeSlot: t.time_slot,
      moduleId: t.module_id,
      teacherId: t.teacher_id
    }));
  },

  async getGrades(): Promise<Grade[]> {
    const { data, error } = await supabase.from('grades').select('*');
    if (error) throw error;
    return (data || []).map(g => ({
      ...g,
      studentId: g.student_id,
      moduleId: g.module_id
    }));
  },

  async getNotifications(): Promise<Notification[]> {
    const { data, error } = await supabase.from('notifications').select('*');
    if (error) throw error;
    return (data || []).map(n => ({
      ...n,
      userId: n.user_id
    }));
  },

  async getResources(): Promise<Resource[]> {
    const { data, error } = await supabase.from('resources').select('*');
    if (error) throw error;
    return (data || []).map(r => ({
      ...r,
      teacherId: r.teacher_id,
      moduleId: r.module_id || '',
      specialtyId: r.specialty_id,
      groupId: r.group_id || 'Tous',
      uploadDate: r.upload_date
    }));
  },

  async saveResource(r: Resource) {
    const { error } = await supabase.from('resources').upsert({
      id: r.id,
      teacher_id: r.teacherId,
      module_id: r.moduleId,
      specialty_id: r.specialtyId,
      group_id: r.groupId,
      title: r.title,
      type: r.type,
      category: r.category,
      url: r.url,
      upload_date: r.uploadDate
    });
    if (error) throw error;
  },

  async deleteResource(id: string) {
    const { error } = await supabase.from('resources').delete().eq('id', id);
    if (error) throw error;
  },

  async saveNotification(n: Notification) {
    const { error } = await supabase.from('notifications').upsert({
      id: n.id,
      user_id: n.userId,
      message: n.message,
      date: n.date,
      link: n.link,
      read: n.read
    });
    if (error) throw error;
  },

  async saveGrade(g: Grade) {
    const { error } = await supabase.from('grades').upsert({
      id: g.id,
      student_id: g.studentId,
      module_id: g.moduleId,
      cours: g.cours,
      td: g.td,
      tp: g.tp,
      rattrapage: g.rattrapage,
      approved: g.approved
    });
    if (error) throw error;
  },

  async saveTimetableEntry(t: TimetableEntry) {
    const { error } = await supabase.from('timetable_entries').upsert({
      id: t.id,
      specialty_id: t.specialtyId,
      sub_specialty_id: t.subSpecialtyId,
      sub_specialty: t.subSpecialty,
      level: t.level,
      semester: t.semester,
      group_id: t.groupId,
      day: t.day,
      time_slot: t.timeSlot,
      module_id: t.moduleId,
      teacher_id: t.teacherId ? t.teacherId : null,
      type: t.type,
      room: t.room
    });
    if (error) throw error;
  },

  async deleteTimetableEntry(id: string) {
    const { error } = await supabase.from('timetable_entries').delete().eq('id', id);
    if (error) throw error;
  },

  async saveAssignment(a: Assignment) {
    const { error } = await supabase.from('assignments').upsert({
      id: a.id,
      module_id: a.moduleId,
      teacher_id: a.teacherId,
      type: a.type
    });
    if (error) throw error;
  },

  async deleteAssignment(id: string) {
    const { error } = await supabase.from('assignments').delete().eq('id', id);
    if (error) throw error;
  },

  async saveModule(m: Module) {
    const { error } = await supabase.from('modules').upsert({
      id: m.id,
      specialty_id: m.specialtyId,
      sub_specialty_id: m.subSpecialtyId,
      sub_specialty: m.subSpecialty,
      name: m.name,
      unit: m.unit,
      credits: m.credits,
      coefficient: m.coefficient,
      has_cours: m.hasCours,
      has_td: m.hasTD,
      has_tp: m.hasTP,
      semester: m.semester,
      level: m.level
    });
    if (error) throw error;
  },

  async deleteModule(id: string) {
    const { error } = await supabase.from('modules').delete().eq('id', id);
    if (error) throw error;
  },

  async saveSpecialty(s: Specialty) {
    const { error } = await supabase.from('specialties').upsert({
      id: s.id,
      faculty_id: s.facultyId,
      name: s.name,
      system: s.system,
      agent_id: s.agentId,
      credit_threshold: s.creditThreshold,
      doctorat_years: s.doctoratYears,
      classic_years: s.classicYears,
      active_subsystem: s.activeSubsystem
    });
    if (error) throw error;
  },

  async saveFaculty(f: Faculty) {
    const { error } = await supabase.from('faculties').upsert({
      id: f.id,
      university_id: f.universityId,
      name: f.name
    });
    if (error) throw error;
  },

  async saveUniversity(u: University) {
    const { error } = await supabase.from('universities').upsert({
      id: u.id,
      name: u.name
    });
    if (error) throw error;
  },

  async deleteUniversity(id: string) {
    const { error } = await supabase.from('universities').delete().eq('id', id);
    if (error) throw error;
  },

  async deleteFaculty(id: string) {
    const { error } = await supabase.from('faculties').delete().eq('id', id);
    if (error) throw error;
  },

  async deleteSpecialty(id: string) {
    const { error } = await supabase.from('specialties').delete().eq('id', id);
    if (error) throw error;
  },

  async saveSubSpecialty(s: SubSpecialty) {
    const { error } = await supabase.from('sub_specialties').upsert({
      id: s.id,
      specialty_id: s.specialtyId,
      level: s.level,
      name: s.name
    });
    if (error) throw error;
  },

  async deleteSubSpecialty(id: string) {
    const { error } = await supabase.from('sub_specialties').delete().eq('id', id);
    if (error) throw error;
  },

  async getAcademicHistories(): Promise<AcademicYearRecord[]> {
    const { data, error } = await supabase.from('academic_histories').select('*');
    if (error) throw error;
    
    const { data: gradesData, error: gradesError } = await supabase.from('academic_history_grades').select('*');
    if (gradesError) throw gradesError;

    return (data || []).map(h => ({
      ...h,
      userId: h.user_id,
      specialtyId: h.specialty_id,
      subSpecialtyId: h.sub_specialty_id,
      semester1Avg: h.semester1_avg,
      semester2Avg: h.semester2_avg,
      annualAvg: h.annual_avg,
      moduleGrades: (gradesData || [])
        .filter(g => g.academic_history_id === h.id)
        .map(g => ({
          ...g,
          academicHistoryId: g.academic_history_id,
          moduleId: g.module_id,
          moduleName: g.module_name
        }))
    }));
  },

  async saveAcademicHistory(h: AcademicYearRecord) {
    const { error } = await supabase.from('academic_histories').upsert({
      id: h.id,
      user_id: h.userId,
      year: h.year,
      level: h.level,
      specialty_id: h.specialtyId,
      sub_specialty_id: h.subSpecialtyId,
      semester1_avg: h.semester1Avg,
      semester2_avg: h.semester2Avg,
      annual_avg: h.annualAvg,
      status: h.status,
      credits: h.credits
    });
    if (error) throw error;

    if (h.moduleGrades) {
      for (const mg of h.moduleGrades) {
        await supabase.from('academic_history_grades').upsert({
          id: mg.id,
          academic_history_id: h.id,
          module_id: mg.moduleId,
          module_name: mg.moduleName,
          cours: mg.cours,
          td: mg.td,
          tp: mg.tp,
          rattrapage: mg.rattrapage,
          average: mg.average,
          coefficient: mg.coefficient,
          semester: mg.semester
        });
      }
    }
  },

  async getGradeDisputes(): Promise<GradeDispute[]> {
    const { data, error } = await supabase.from('grade_disputes').select('*');
    if (error) throw error;
    return (data || []).map(d => ({
      ...d,
      gradeId: d.grade_id,
      replyDate: d.reply_date
    }));
  },

  async saveGradeDispute(d: GradeDispute) {
    const { error } = await supabase.from('grade_disputes').upsert({
      id: d.id,
      grade_id: d.gradeId,
      component: d.component,
      message: d.message,
      date: d.date,
      reply: d.reply,
      reply_date: d.replyDate,
      resolved: d.resolved
    });
    if (error) throw error;
  },

  async deleteGradeDispute(id: string) {
    const { error } = await supabase.from('grade_disputes').delete().eq('id', id);
    if (error) throw error;
  },

  async getRooms(): Promise<Room[]> {
    const { data, error } = await supabase.from('rooms').select('*');
    if (error) throw error;
    return (data || []).map(r => ({
      id: r.id,
      specialtyId: 'global', // Since table doesn't have specialty_id, make rooms global
      name: r.name,
      type: undefined,
      capacity: undefined
    }));
  },

  async saveRoom(r: Room) {
    const { error } = await supabase.from('rooms').upsert({
      id: r.id,
      name: r.name
    });
    if (error) throw error;
  },

  async deleteRoom(id: string) {
    const { error } = await supabase.from('rooms').delete().eq('id', id);
    if (error) throw error;
  },

  async deleteUser(id: string) {
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw error;
  },

  async deleteGrade(id: string) {
    const { error } = await supabase.from('grades').delete().eq('id', id);
    if (error) throw error;
  },

  async deleteNotification(id: string) {
    const { error } = await supabase.from('notifications').delete().eq('id', id);
    if (error) throw error;
  },

  async deleteAcademicHistory(id: string) {
    const { error } = await supabase.from('academic_histories').delete().eq('id', id);
    if (error) throw error;
  },

  subscribeToChanges(callback: (payload: any) => void) {
    return supabase
      .channel('public-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
        },
        (payload) => {
          callback(payload);
        }
      )
      .subscribe();
  }
};
