-- 0. Salles (Table pour gérer la suppression automatique)
CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY,
    specialty_id TEXT REFERENCES specialties(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT,
    capacity INTEGER,
    UNIQUE(name, specialty_id)
);

-- 1. Universités
CREATE TABLE IF NOT EXISTS universities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL
);

-- 2. Facultés
CREATE TABLE IF NOT EXISTS faculties (
    id TEXT PRIMARY KEY,
    university_id TEXT REFERENCES universities(id) ON DELETE CASCADE,
    name TEXT NOT NULL
);

-- 3. Spécialités
CREATE TABLE IF NOT EXISTS specialties (
    id TEXT PRIMARY KEY,
    faculty_id TEXT REFERENCES faculties(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    system TEXT NOT NULL,
    agent_id TEXT,
    credit_threshold NUMERIC DEFAULT 30,
    doctorat_years INTEGER,
    classic_years INTEGER,
    active_subsystem TEXT,
    current_semester INTEGER DEFAULT 1
);

-- 4. Sous-Spécialités (Parcours)
CREATE TABLE IF NOT EXISTS sub_specialties (
    id TEXT PRIMARY KEY,
    specialty_id TEXT REFERENCES specialties(id) ON DELETE CASCADE,
    level TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL,
    full_name TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    gender TEXT,
    birth_date TEXT,
    birth_place TEXT,
    specialty_id TEXT REFERENCES specialties(id) ON DELETE SET NULL,
    sub_specialty_id TEXT REFERENCES sub_specialties(id) ON DELETE SET NULL,
    sub_specialty TEXT,
    group_id TEXT,
    level TEXT,
    hiring_date TEXT,
    is_approved_for_year BOOLEAN DEFAULT FALSE
);

-- 6. Historique Académique
CREATE TABLE IF NOT EXISTS academic_histories (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    year TEXT NOT NULL,
    level TEXT NOT NULL,
    specialty_id TEXT REFERENCES specialties(id) ON DELETE CASCADE,
    sub_specialty_id TEXT REFERENCES sub_specialties(id) ON DELETE SET NULL,
    semester1_avg NUMERIC,
    semester2_avg NUMERIC,
    annual_avg NUMERIC,
    status TEXT,
    credits INTEGER
);

-- 7. Modules
CREATE TABLE IF NOT EXISTS modules (
    id TEXT PRIMARY KEY,
    specialty_id TEXT REFERENCES specialties(id) ON DELETE CASCADE,
    sub_specialty_id TEXT REFERENCES sub_specialties(id) ON DELETE SET NULL,
    sub_specialty TEXT,
    name TEXT NOT NULL,
    unit TEXT,
    credits NUMERIC,
    coefficient NUMERIC,
    has_cours BOOLEAN DEFAULT TRUE,
    has_td BOOLEAN DEFAULT FALSE,
    has_tp BOOLEAN DEFAULT FALSE,
    semester INTEGER,
    level TEXT
);

-- 8. Affectations (Profs)
CREATE TABLE IF NOT EXISTS assignments (
    id TEXT PRIMARY KEY,
    module_id TEXT REFERENCES modules(id) ON DELETE CASCADE,
    teacher_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL
);

-- 9. Emploi du Temps
CREATE TABLE IF NOT EXISTS timetable_entries (
    id TEXT PRIMARY KEY,
    specialty_id TEXT REFERENCES specialties(id) ON DELETE CASCADE,
    sub_specialty_id TEXT REFERENCES sub_specialties(id) ON DELETE SET NULL,
    sub_specialty TEXT,
    level TEXT,
    semester INTEGER,
    group_id TEXT,
    day TEXT NOT NULL,
    time_slot TEXT NOT NULL,
    module_id TEXT REFERENCES modules(id) ON DELETE CASCADE,
    teacher_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    type TEXT NOT NULL,
    room_id TEXT REFERENCES rooms(id) ON DELETE CASCADE
);

-- 10. Notes
CREATE TABLE IF NOT EXISTS grades (
    id TEXT PRIMARY KEY,
    student_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    module_id TEXT REFERENCES modules(id) ON DELETE CASCADE,
    cours NUMERIC,
    td NUMERIC,
    tp NUMERIC,
    rattrapage NUMERIC,
    approved BOOLEAN DEFAULT FALSE
);

-- 11. Contestations de Notes
CREATE TABLE IF NOT EXISTS grade_disputes (
    id TEXT PRIMARY KEY,
    grade_id TEXT REFERENCES grades(id) ON DELETE CASCADE,
    component TEXT NOT NULL,
    message TEXT NOT NULL,
    date TEXT NOT NULL,
    reply TEXT,
    reply_date TEXT,
    resolved BOOLEAN DEFAULT FALSE
);

-- 12. Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    date TEXT NOT NULL,
    link TEXT,
    read BOOLEAN DEFAULT FALSE
);

-- 13. Ressources
CREATE TABLE IF NOT EXISTS resources (
    id TEXT PRIMARY KEY,
    teacher_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    specialty_id TEXT REFERENCES specialties(id) ON DELETE CASCADE,
    module_id TEXT REFERENCES modules(id) ON DELETE CASCADE,
    group_id TEXT,
    title TEXT NOT NULL,
    type TEXT,
    category TEXT,
    url TEXT NOT NULL,
    upload_date TEXT NOT NULL
);

-- 14. Modules des Ressources
CREATE TABLE IF NOT EXISTS resource_modules (
    resource_id TEXT REFERENCES resources(id) ON DELETE CASCADE,
    module_id TEXT REFERENCES modules(id) ON DELETE CASCADE,
    PRIMARY KEY (resource_id, module_id)
);
