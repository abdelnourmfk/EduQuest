
export enum UserRole {
  ADMIN = 'ADMIN',
  AGENT = 'AGENT',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT'
}

export enum SystemType {
  LMD = 'LMD',
  ENGINEER = 'Ingénieur',
  LMD_ENGINEER = 'LMD + Ingénieur',
  CLASSIC = 'Classique'
}

export enum SessionType {
  COURS = 'Cours',
  TD = 'TD',
  TP = 'TP'
}

export interface SubSpecialty {
  id: string;
  specialtyId: string;
  level: string;
  name: string;
}

export interface User {
  id: string;
  username: string;
  password?: string;
  role: UserRole;
  fullName: string;
  specialtyId?: string;
  subSpecialty?: string; // We'll keep this as string for now to avoid breaking logic, but map it from name
  subSpecialtyId?: string; // New field for ID reference
  groupId?: string;
  level?: string;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  birthPlace?: string;
  gender?: 'M' | 'F';
  address?: string;
  phone?: string;
  email?: string;
  hiringDate?: string;
  createdBy?: string;
  isApprovedForYear?: boolean; // Administrative registration approval
  academicHistory?: AcademicYearRecord[];
}

export interface ModuleGradeRecord {
  id: string;
  academicHistoryId: string;
  moduleId: string;
  moduleName: string;
  cours?: number;
  td?: number;
  tp?: number;
  rattrapage?: number;
  average: number;
  coefficient: number;
  semester: 1 | 2;
}

export interface AcademicYearRecord {
  id: string;
  userId: string;
  year: string; // e.g. "2023-2024"
  level: string;
  specialtyId: string;
  subSpecialtyId?: string;
  semester1Avg: number;
  semester2Avg: number;
  annualAvg: number;
  status: string; // Admis, Ajourné, etc.
  credits?: number;
  moduleGrades?: ModuleGradeRecord[];
}

export interface University {
  id: string;
  name: string;
}

export interface Faculty {
  id: string;
  universityId: string;
  name: string;
}

export interface Specialty {
  id: string;
  facultyId: string;
  name: string;
  system: SystemType;
  agentId?: string;
  creditThreshold?: number; // Default 30 for LMD
  doctoratYears?: number;
  classicYears?: number;
  activeSubsystem?: 'LMD' | 'ENGINEER';
}

export interface Module {
  id: string;
  specialtyId: string;
  subSpecialtyId?: string;
  subSpecialty?: string; // Keep for logic
  name: string;
  unit: string; // UE: Unité d'Enseignement (e.g., Fondamentale, Découverte)
  credits: number;
  coefficient: number;
  hasCours: boolean;
  hasTD: boolean;
  hasTP: boolean;
  semester: 1 | 2;
  level: string;
}

export interface Assignment {
  id: string;
  moduleId: string;
  teacherId: string;
  type: SessionType;
}

export interface TimetableEntry {
  id: string;
  specialtyId: string;
  subSpecialtyId?: string;
  subSpecialty?: string; // Keep for logic
  level: string;
  semester: 1 | 2;
  groupId: string;
  day: string;
  timeSlot: string;
  moduleId: string;
  teacherId?: string;
  type: SessionType;
  room: string;
}

export interface Grade {
  id: string;
  studentId: string;
  moduleId: string;
  cours?: number; // This is Examen
  td?: number;
  tp?: number;
  rattrapage?: number;
  approved: boolean;
}

export interface GradeDispute {
  id: string;
  gradeId: string;
  component: 'td' | 'tp' | 'cours' | 'rattrapage';
  message: string;
  date: string;
  reply?: string;
  replyDate?: string;
  resolved?: boolean;
}

export interface Resource {
  id: string;
  teacherId: string;
  moduleId: string;
  specialtyId: string;
  groupId: string;
  title: string;
  type: string; 
  category: SessionType;
  url: string;
  uploadDate: string;
}

export enum RoomType {
  SALLE = 'SALLE',
  AMPHI = 'AMPHI',
  LABO = 'LABO'
}

export interface Room {
  id: string;
  specialtyId: string;
  name: string;
  type?: string;
  capacity?: number;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  date: string;
  link?: string;
  read: boolean;
}
