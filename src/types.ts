export type AssignmentType = 'dm' | 'exercise' | 'exam' | 'project' | 'reading' | 'other';

export type PriorityLevel = 'low' | 'normal' | 'urgent';

export type AssignmentStatus = 'todo' | 'in_progress' | 'completed';

export type ReminderTiming = 
  | 'daily_before_deadline' 
  | '1_day_before' 
  | '2_days_before' 
  | '3_hours_before' 
  | '1_hour_before' 
  | 'at_deadline' 
  | 'none';

export interface AttachedFile {
  id: string;
  name: string;
  size: number; // in bytes (max 5MB = 5 * 1024 * 1024)
  type: string; // mime type
  dataUrl?: string; // base64 or blob URL
  uploadedAt: string;
}

export interface Subject {
  id: string;
  name: string;
  color: string; // hex or primary tone
  bgClass: string;
  textClass: string;
  borderClass: string;
  iconName: string;
}

export interface Assignment {
  id: string;
  userId?: string;
  title: string;
  subjectId: string;
  type: AssignmentType;
  dueDate: string; // ISO string: YYYY-MM-DDTHH:mm
  priority: PriorityLevel;
  status: AssignmentStatus;
  description?: string;
  estimatedMinutes?: number;
  reminderTiming: ReminderTiming;
  completedAt?: string | null;
  files?: AttachedFile[]; // max 5 files, max 5MB each
  thumbnailUrl?: string; // miniature preview (compressed dataUrl or preset identifier)
  createdAt: string;
  updatedAt: string;
}

export interface AppNotification {
  id: string;
  assignmentId: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  type: 'urgent' | 'reminder' | 'overdue' | 'success';
}

export const DEFAULT_SUBJECTS: Subject[] = [
  {
    id: 'maths',
    name: 'Mathématiques',
    color: '#3B82F6',
    bgClass: 'bg-blue-50 text-blue-700 border-blue-200',
    textClass: 'text-blue-700',
    borderClass: 'border-blue-500',
    iconName: 'Calculator'
  },
  {
    id: 'francais',
    name: 'Français',
    color: '#D97706',
    bgClass: 'bg-amber-50 text-amber-700 border-amber-200',
    textClass: 'text-amber-700',
    borderClass: 'border-amber-500',
    iconName: 'BookOpen'
  },
  {
    id: 'histoire-geo',
    name: 'Histoire - Géo',
    color: '#10B981',
    bgClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    textClass: 'text-emerald-700',
    borderClass: 'border-emerald-500',
    iconName: 'Globe'
  },
  {
    id: 'physique-chimie',
    name: 'Physique - Chimie',
    color: '#8B5CF6',
    bgClass: 'bg-purple-50 text-purple-700 border-purple-200',
    textClass: 'text-purple-700',
    borderClass: 'border-purple-500',
    iconName: 'FlaskConical'
  },
  {
    id: 'svt',
    name: 'SVT',
    color: '#059669',
    bgClass: 'bg-teal-50 text-teal-700 border-teal-200',
    textClass: 'text-teal-700',
    borderClass: 'border-teal-500',
    iconName: 'Leaf'
  },
  {
    id: 'anglais',
    name: 'Anglais (LV1)',
    color: '#EC4899',
    bgClass: 'bg-pink-50 text-pink-700 border-pink-200',
    textClass: 'text-pink-700',
    borderClass: 'border-pink-500',
    iconName: 'Languages'
  },
  {
    id: 'espagnol',
    name: 'Espagnol / LV2',
    color: '#F97316',
    bgClass: 'bg-orange-50 text-orange-700 border-orange-200',
    textClass: 'text-orange-700',
    borderClass: 'border-orange-500',
    iconName: 'Globe2'
  },
  {
    id: 'philosophie',
    name: 'Philosophie / SES',
    color: '#0284C7',
    bgClass: 'bg-sky-50 text-sky-700 border-sky-200',
    textClass: 'text-sky-700',
    borderClass: 'border-sky-500',
    iconName: 'Brain'
  },
  {
    id: 'nsi',
    name: 'NSI / Informatique',
    color: '#475569',
    bgClass: 'bg-slate-100 text-slate-700 border-slate-200',
    textClass: 'text-slate-700',
    borderClass: 'border-slate-500',
    iconName: 'Code'
  },
  {
    id: 'autre',
    name: 'Autre matière',
    color: '#6B7280',
    bgClass: 'bg-gray-100 text-gray-700 border-gray-200',
    textClass: 'text-gray-700',
    borderClass: 'border-gray-400',
    iconName: 'GraduationCap'
  }
];

export const ASSIGNMENT_TYPE_LABELS: Record<AssignmentType, { label: string; short: string; badge: string }> = {
  dm: { label: 'Devoir Maison (DM)', short: 'DM', badge: 'bg-indigo-100 text-indigo-800' },
  exercise: { label: 'Exercices', short: 'Exos', badge: 'bg-blue-100 text-blue-800' },
  exam: { label: 'Contrôle / DS', short: 'DS', badge: 'bg-rose-100 text-rose-800' },
  project: { label: 'Exposé / Projet', short: 'Projet', badge: 'bg-purple-100 text-purple-800' },
  reading: { label: 'Lecture / Fiche', short: 'Lecture', badge: 'bg-amber-100 text-amber-800' },
  other: { label: 'Autre travail', short: 'Travail', badge: 'bg-gray-100 text-gray-800' }
};

export const PRIORITY_LABELS: Record<PriorityLevel, { label: string; badge: string; dot: string }> = {
  urgent: { label: 'Urgente', badge: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500' },
  normal: { label: 'Normale', badge: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  low: { label: 'Basse', badge: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-400' }
};
