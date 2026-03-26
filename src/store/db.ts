
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

export const generatePassword = (length: number = 8): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charsLength = chars.length;

  // Use Web Crypto API for cryptographically secure randomness when available
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const randomValues = new Uint32Array(length);
    window.crypto.getRandomValues(randomValues);

    let password = '';
    for (let i = 0; i < length; i++) {
      const index = randomValues[i] % charsLength;
      password += chars.charAt(index);
    }
    return password;
  }

  // Fallback: in environments without Web Crypto, use a less secure method
  // (should only be hit in non-browser contexts).
  let fallbackPassword = '';
  for (let i = 0; i < length; i++) {
    const index = Math.floor(Math.random() * charsLength);
    fallbackPassword += chars.charAt(index);
  }
  return fallbackPassword;
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
