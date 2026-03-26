
import { 
  User, UserRole, University, Faculty, Specialty, SubSpecialty, Module, 
  Assignment, TimetableEntry, Grade, Resource, Notification, SystemType, SessionType,
  AcademicYearRecord, GradeDispute, Room
} from '../../types';
import { supabaseService } from '../services/supabaseService';

export interface DB {
  users: User[];
  universities: University[];
  faculties: Faculty[];
  specialties: Specialty[];
  subSpecialties: SubSpecialty[];
  modules: Module[];
  assignments: Assignment[];
  timetable: TimetableEntry[];
  grades: Grade[];
  resources: Resource[];
  notifications: Notification[];
  academicHistories: AcademicYearRecord[];
  gradeDisputes: GradeDispute[];
  rooms: Room[];
  currentSemester: 1 | 2;
  currentAcademicYear: string;
}

export const INITIAL_DB: DB = {
  users: [],
  universities: [],
  faculties: [],
  specialties: [],
  subSpecialties: [],
  modules: [],
  assignments: [],
  timetable: [],
  grades: [],
  resources: [],
  notifications: [],
  academicHistories: [],
  gradeDisputes: [],
  rooms: [],
  currentSemester: 1,
  currentAcademicYear: '2025-2026'
};

let localDB: DB = INITIAL_DB;

export const getDB = (): DB => {
  return localDB;
};

export const setLocalDB = (db: DB) => {
  localDB = db;
};

export const clearLocalData = () => {
  // No longer using localStorage for DB
  localDB = INITIAL_DB;
  window.location.reload();
};

// This function will be called by App.tsx to load data from Supabase
export const loadDBFromSupabase = async (): Promise<DB> => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Supabase credentials missing!");
    return INITIAL_DB;
  }

  try {
    console.log("🔄 Fetching data from Supabase...");
    const [
      users, universities, faculties, specialties, 
      modules, assignments, timetable, grades, notifications, resources,
      subSpecialties, academicHistories, gradeDisputes, rooms
    ] = await Promise.all([
      supabaseService.getUsers(),
      supabaseService.getUniversities(),
      supabaseService.getFaculties(),
      supabaseService.getSpecialties(),
      supabaseService.getModules(),
      supabaseService.getAssignments(),
      supabaseService.getTimetable(),
      supabaseService.getGrades(),
      supabaseService.getNotifications(),
      supabaseService.getResources(),
      supabaseService.getSubSpecialties(),
      supabaseService.getAcademicHistories(),
      supabaseService.getGradeDisputes(),
      supabaseService.getRooms()
    ]);

    console.log("✅ Supabase data fetch successful");

    localDB = {
      ...INITIAL_DB,
      users, universities, faculties, specialties, subSpecialties,
      modules, assignments, timetable, grades, 
      resources,
      notifications,
      academicHistories,
      gradeDisputes,
      rooms
    };
    
    return localDB;
  } catch (error) {
    console.error("❌ Error loading DB from Supabase:", error);
    return localDB;
  }
};

export const generatePassword = (): string => {
  const length = 8;
  const charset = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const charsetLength = charset.length; // 36
  const result: string[] = [];

  // Use window.crypto.getRandomValues for cryptographically secure randomness
  const cryptoObj = window.crypto || (window as any).msCrypto;
  if (!cryptoObj || typeof cryptoObj.getRandomValues !== 'function') {
    // Fallback should be extremely unlikely in modern browsers; in case it happens,
    // throw to avoid silently generating weak passwords.
    throw new Error('Secure random number generator not available.');
  }

  while (result.length < length) {
    const buffer = new Uint8Array(16);
    cryptoObj.getRandomValues(buffer);
    for (let i = 0; i < buffer.length && result.length < length; i++) {
      const randomByte = buffer[i];
      // Avoid modulo bias by only using values within a uniform range
      if (randomByte < 252) { // 252 is the largest multiple of 36 less than 256
        const index = randomByte % charsetLength;
        result.push(charset.charAt(index));
      }
    }
  }

  return result.join('');
};

export const createNotification = async (userId: string, message: string, link?: string) => {
  const n: Notification = {
    id: Math.random().toString(36).substr(2, 9),
    userId,
    message,
    date: new Date().toISOString(),
    link,
    read: false
  };
  
  try {
    await supabaseService.saveNotification(n);
  } catch (error) {
    console.error("Error saving notification to Supabase:", error);
  }
};
