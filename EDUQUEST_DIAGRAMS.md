# EduQuest - Diagrams

Ce document décrit la logique principale de l'application `EduQuest` dans le dossier `PFEv3`.

## 1. Diagramme de cas d'utilisation (Use Case)

```mermaid
%%{init: { 'theme': 'base', 'themeVariables': { 'primaryColor': '#8b5cf6', 'secondaryColor': '#f97316', 'tertiaryColor': '#10b981', 'lineColor': '#374151', 'textColor': '#111827' } }}%%
usecaseDiagram
  actor Admin
  actor Agent
  actor Teacher
  actor Student

  Admin --> (Se connecter)
  Admin --> (Gérer les universités)
  Admin --> (Gérer les spécialités)
  Admin --> (Gérer les utilisateurs)
  Admin --> (Voir le tableau de bord)

  Agent --> (Se connecter)
  Agent --> (Voir Suivi & Alertes)
  Agent --> (Gérer les modules)
  Agent --> (Assigner des enseignants)
  Agent --> (Gérer l'emploi du temps)
  Agent --> (Gérer les étudiants)
  Agent --> (Valider inscriptions / notes)

  Teacher --> (Se connecter)
  Teacher --> (Voir planning)
  Teacher --> (Saisir notes)
  Teacher --> (Partager ressources)

  Student --> (Se connecter)
  Student --> (Voir tableau de bord)
  Student --> (Voir emploi du temps)
  Student --> (Voir notes)
  Student --> (Consulter ressources)

  (Se connecter) ..> (Voir Suivi & Alertes) : authentification
  (Gérer les étudiants) ..> (Valider inscriptions / notes) : supervision
```

## 2. Diagramme de séquence - Agent ouvre Suivi & Alertes

```mermaid
sequenceDiagram
  participant Agent as Agent utilisateur
  participant App as App.tsx
  participant DB as DBProvider/useDB
  participant Supabase as supabaseService
  participant Layout as Layout
  participant Monitoring as MonitoringView

  Agent->>App: clique sur "Suivi & Alertes"
  App->>App: setActiveView('monitoring')
  App->>Layout: render(user, activeView)
  Layout->>Monitoring: render(specialtyId)
  Monitoring->>DB: lire db.specialties, db.modules, db.assignments, db.timetable, db.users
  DB-->>Monitoring: retourne les données locales
  Monitoring->>Monitoring: calculer les modules sans enseignant
  Monitoring->>Monitoring: calculer les séances manquantes dans l'EDT
  Monitoring-->>Layout: affiche cartes d'alerte
  Layout-->>Agent: affiche la page Suivi & Alertes
```

## 3. Diagramme de classes du domaine

```mermaid
classDiagram
  class User {
    +string id
    +string username
    +UserRole role
    +string fullName
    +string email
    +string? specialtyId
    +string? subSpecialty
    +string? subSpecialtyId
    +string? groupId
    +string? level
    +boolean? isApprovedForYear
    +AcademicYearRecord[]? academicHistory
  }

  class Specialty {
    +string id
    +string facultyId
    +string name
    +SystemType system
    +string? agentId
    +number? creditThreshold
    +number? doctoratYears
    +number? classicYears
    +string? activeSubsystem
  }

  class SubSpecialty {
    +string id
    +string specialtyId
    +string level
    +string name
  }

  class Module {
    +string id
    +string specialtyId
    +string? subSpecialtyId
    +string? subSpecialty
    +string name
    +string unit
    +number credits
    +number coefficient
    +boolean hasCours
    +boolean hasTD
    +boolean hasTP
    +1|2 semester
    +string level
  }

  class Assignment {
    +string id
    +string moduleId
    +string teacherId
    +SessionType type
  }

  class TimetableEntry {
    +string id
    +string specialtyId
    +string? subSpecialtyId
    +string level
    +1|2 semester
    +string groupId
    +string day
    +string timeSlot
    +string moduleId
    +string? teacherId
    +SessionType type
    +string room
  }

  class Grade {
    +string id
    +string studentId
    +string moduleId
    +number? cours
    +number? td
    +number? tp
    +number? rattrapage
    +boolean approved
  }

  class Notification {
    +string id
    +string userId
    +string message
    +string date
    +string? link
    +boolean read
  }

  class AcademicYearRecord {
    +string id
    +string userId
    +string year
    +string level
    +string specialtyId
    +string? subSpecialtyId
    +number semester1Avg
    +number semester2Avg
    +number annualAvg
    +string status
    +ModuleGradeRecord[]? moduleGrades
  }

  class ModuleGradeRecord {
    +string id
    +string academicHistoryId
    +string moduleId
    +string moduleName
    +number? cours
    +number? td
    +number? tp
    +number? rattrapage
    +number average
    +number coefficient
    +1|2 semester
  }

  class Room {
    +string id
    +string specialtyId
    +string name
    +string? type
    +number? capacity
  }

  class Resource {
    +string id
    +string teacherId
    +string moduleId
    +string specialtyId
    +string groupId
    +string title
    +string type
    +SessionType category
    +string url
    +string uploadDate
  }

  class GradeDispute {
    +string id
    +string gradeId
    +string component
    +string message
    +string date
    +string? reply
    +string? replyDate
    +boolean? resolved
  }

  University "1" --> "*" Faculty
  Faculty "1" --> "*" Specialty
  Specialty "1" --> "*" SubSpecialty
  Specialty "1" --> "*" Module
  Specialty "1" --> "*" Room
  Specialty "1" --> "*" TimetableEntry
  Specialty "1" --> "*" Resource
  Specialty "1" --> "*" AcademicYearRecord

  User "1" --> "*" Notification
  User "1" --> "*" Grade
  User "1" --> "*" AcademicYearRecord
  User "1" --> "*" Resource
  User "1" --> "*" Assignment

  Module "1" --> "*" Assignment
  Module "1" --> "*" TimetableEntry
  Module "1" --> "*" Grade
  Module "1" --> "*" Resource
  Grade "1" --> "*" GradeDispute

  Assignment --> User : teacherId
  Assignment --> Module : moduleId
  Grade --> User : studentId
  Grade --> Module : moduleId
  TimetableEntry --> Module : moduleId
  TimetableEntry --> User : teacherId
  TimetableEntry --> Room : room
  AcademicYearRecord --> User : userId
  AcademicYearRecord --> Specialty : specialtyId
  ModuleGradeRecord --> AcademicYearRecord : academicHistoryId
```

## Notes
- La logique centrale est gérée par `App.tsx`, qui route les vues selon le rôle (`UserRole`) et `activeView`.
- `DBProvider` charge les données de Supabase et les expose via `useDB()`.
- `MonitoringView` est responsable du calcul des alertes `Manque d'Enseignants` et `Manque dans l'EDT`.
- Les types sont définis dans `types.ts`, ce qui constitue le modèle de données principal de l'application.
