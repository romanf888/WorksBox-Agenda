// Fonctions utilitaires de gestion des dates scolaires et calculs de délais

export function formatDateFrench(isoString: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export function formatFullDateFrench(isoString: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date);
}

export function formatTime(isoString: string): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export function isToday(isoString: string): boolean {
  const date = new Date(isoString);
  const now = new Date();
  return isSameDay(date, now);
}

export function isTomorrow(isoString: string): boolean {
  const date = new Date(isoString);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return isSameDay(date, tomorrow);
}

export function isOverdue(isoString: string): boolean {
  const date = new Date(isoString);
  return date.getTime() < Date.now();
}

export interface DeadlineCountdown {
  text: string;
  isOverdue: boolean;
  isUrgent: boolean; // less than 24h
  days: number;
  hours: number;
  minutes: number;
}

export function getDeadlineCountdown(isoString: string): DeadlineCountdown {
  const target = new Date(isoString).getTime();
  const now = Date.now();
  const diffMs = target - now;
  const isPast = diffMs < 0;
  const absDiff = Math.abs(diffMs);

  const totalMinutes = Math.floor(absDiff / (1000 * 60));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (isPast) {
    if (days === 0 && hours === 0 && minutes < 5) {
      return { text: 'Date limite dépassée il y a un instant', isOverdue: true, isUrgent: true, days, hours, minutes };
    }
    if (days === 0) {
      return { text: `En retard de ${hours}h ${minutes}min`, isOverdue: true, isUrgent: true, days, hours, minutes };
    }
    return { text: `En retard de ${days} jour${days > 1 ? 's' : ''}`, isOverdue: true, isUrgent: true, days, hours, minutes };
  }

  // Future
  if (days === 0) {
    if (hours === 0) {
      return { text: `Dans ${minutes} min`, isOverdue: false, isUrgent: true, days, hours, minutes };
    }
    return { text: `Dans ${hours}h ${minutes > 0 ? `${minutes}m` : ''}`, isOverdue: false, isUrgent: true, days, hours, minutes };
  }

  if (days === 1) {
    return { text: `Demain (${hours}h restantes)`, isOverdue: false, isUrgent: true, days, hours, minutes };
  }

  return { text: `Dans ${days} jours`, isOverdue: false, isUrgent: days <= 2, days, hours, minutes };
}

// Helpers for calendar generation
export function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const date = new Date(year, month, 1);
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

export function getWeekDays(referenceDate: Date): Date[] {
  const curr = new Date(referenceDate);
  // Get Monday (in French week, 1 is Monday, 0 is Sunday)
  const day = curr.getDay();
  const diff = curr.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(curr.setDate(diff));
  monday.setHours(0, 0, 0, 0);

  const week: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    week.push(d);
  }
  return week;
}

export function toInputDateTimeLocal(date: Date): string {
  const pad = (n: number) => (n < 10 ? '0' + n : n);
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} Mo`;
}

