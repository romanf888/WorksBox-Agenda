import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon, 
  Clock, 
  Check,
  CalendarDays,
  Grid,
  Sparkles,
  Paperclip,
  Eye
} from 'lucide-react';
import { Assignment } from '../types';
import { useAgenda } from '../context/AgendaContext';
import { isSameDay, formatTime, getDaysInMonth, getWeekDays } from '../utils/dateUtils';

interface CalendarViewProps {
  onAddOnDate: (date: Date) => void;
  onEditAssignment: (assignment: Assignment) => void;
}

// Hours displayed in the timetable (from 07:00 to 20:00)
const TIMETABLE_HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

export const CalendarView: React.FC<CalendarViewProps> = ({
  onAddOnDate,
  onEditAssignment
}) => {
  const { assignments, subjects, toggleCompleteAssignment } = useAgenda();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  // Mode default: 'schedule' (Emploi du temps avec heures)
  const [calendarMode, setCalendarMode] = useState<'schedule' | 'month'>('schedule');
  const [showWeekend, setShowWeekend] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNameFrench = new Intl.DateTimeFormat('fr-FR', {
    month: 'long',
    year: 'numeric'
  }).format(currentDate);

  const prevPeriod = () => {
    if (calendarMode === 'month') {
      setCurrentDate(new Date(year, month - 1, 1));
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
    }
  };

  const nextPeriod = () => {
    if (calendarMode === 'month') {
      setCurrentDate(new Date(year, month + 1, 1));
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Month days
  const monthDays = getDaysInMonth(year, month);
  const firstDay = monthDays[0];
  const firstDayIndex = (firstDay.getDay() + 6) % 7;
  const paddingDays = Array.from({ length: firstDayIndex });

  // Week days for timetable
  const allWeekDays = getWeekDays(currentDate);
  const displayWeekDays = showWeekend ? allWeekDays : allWeekDays.slice(0, 5);

  const weekdaysHeader = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  const getAssignmentsForDay = (day: Date) => {
    return assignments.filter((a) => {
      const aDate = new Date(a.dueDate);
      return isSameDay(aDate, day);
    });
  };

  const getAssignmentsForHourSlot = (day: Date, hour: number) => {
    return assignments.filter((a) => {
      const aDate = new Date(a.dueDate);
      return isSameDay(aDate, day) && aDate.getHours() === hour;
    });
  };

  const handleSlotClick = (day: Date, hour: number) => {
    const targetDate = new Date(day);
    targetDate.setHours(hour, 0, 0, 0);
    onAddOnDate(targetDate);
  };

  const now = new Date();

  return (
    <section id="agenda-calendar-container" aria-label="Calendrier et emploi du temps scolaire" className="wb-card rounded-2xl sm:rounded-3xl shadow-xs overflow-hidden">
      
      {/* Calendar Top Controls Header */}
      <header className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-850/50">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <button
              id="cal-prev-btn"
              type="button"
              onClick={prevPeriod}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition cursor-pointer"
              title="Semaine / Mois précédent"
              aria-label="Période précédente"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              id="cal-next-btn"
              type="button"
              onClick={nextPeriod}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition cursor-pointer"
              title="Semaine / Mois suivant"
              aria-label="Période suivante"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div>
            <h2 id="calendar-title" className="text-base sm:text-lg font-bold text-slate-900 dark:text-white capitalize">
              {calendarMode === 'schedule' ? (
                <>
                  Semaine du {displayWeekDays[0]?.getDate()} {new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(displayWeekDays[0])} au {displayWeekDays[displayWeekDays.length - 1]?.getDate()} {new Intl.DateTimeFormat('fr-FR', { month: 'short', year: 'numeric' }).format(displayWeekDays[displayWeekDays.length - 1])}
                </>
              ) : (
                monthNameFrench
              )}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {calendarMode === 'schedule' ? 'Emploi du temps hebdomadaire avec créneaux horaires' : 'Vue calendrier mensuel des devoirs'}
            </p>
          </div>

          <button
            id="cal-today-btn"
            type="button"
            onClick={goToToday}
            className="ml-2 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition cursor-pointer shadow-2xs"
          >
            Aujourd'hui
          </button>
        </div>

        {/* View Mode Toggle & Weekend Filter */}
        <div className="flex items-center gap-2">
          {calendarMode === 'schedule' && (
            <button
              type="button"
              onClick={() => setShowWeekend(!showWeekend)}
              className="hidden sm:inline-flex items-center px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 cursor-pointer"
            >
              {showWeekend ? 'Masquer Week-end' : 'Afficher Sam/Dim'}
            </button>
          )}

          <div className="flex items-center gap-1 bg-slate-200/80 dark:bg-slate-800 p-1 rounded-xl" role="group" aria-label="Mode de vue calendrier">
            <button
              id="mode-schedule-btn"
              type="button"
              onClick={() => setCalendarMode('schedule')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                calendarMode === 'schedule' 
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Emploi du temps</span>
            </button>
            <button
              id="mode-month-btn"
              type="button"
              onClick={() => setCalendarMode('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                calendarMode === 'month' 
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Vue Mois</span>
            </button>
          </div>
        </div>
      </header>

      {/* SCHEDULE VIEW (EMPLOI DU TEMPS AVEC LES HEURES AFFICHÉES) */}
      {calendarMode === 'schedule' && (
        <div className="overflow-x-auto">
          <div className="min-w-[760px]">
            {/* Timetable Header with Days */}
            <div className={`grid border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850/80 sticky top-0 z-10 ${showWeekend ? 'grid-cols-8' : 'grid-cols-6'}`}>
              {/* Corner: Heures */}
              <div className="p-3 border-r border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-center">
                <Clock className="w-4 h-4 text-slate-400 mb-0.5" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Heures
                </span>
              </div>

              {/* Day headers */}
              {displayWeekDays.map((day) => {
                const isCurrent = isSameDay(day, now);
                const dayName = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(day);
                const dayNum = day.getDate();
                const monthShort = new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(day);

                return (
                  <div 
                    key={day.toISOString()}
                    className={`p-2.5 text-center border-r last:border-r-0 border-slate-200 dark:border-slate-800 transition ${
                      isCurrent ? 'bg-blue-50/60 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300' : ''
                    }`}
                  >
                    <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {dayName}
                    </span>
                    <div className="flex items-center justify-center gap-1 mt-0.5">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold ${
                        isCurrent 
                          ? 'bg-blue-600 text-white shadow-xs' 
                          : 'text-slate-900 dark:text-slate-100'
                      }`}>
                        {dayNum}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        {monthShort}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Timetable Body (Hourly Rows) */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {TIMETABLE_HOURS.map((hour) => {
                const hourFormatted = `${hour.toString().padStart(2, '0')}:00`;

                return (
                  <div 
                    key={hour}
                    className={`grid ${showWeekend ? 'grid-cols-8' : 'grid-cols-6'} group hover:bg-slate-50/40 dark:hover:bg-slate-850/20 transition-colors`}
                  >
                    {/* Hour Column */}
                    <div className="p-2.5 border-r border-slate-200 dark:border-slate-800 text-right pr-3 bg-slate-50/40 dark:bg-slate-850/30 flex items-start justify-end">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 tabular-nums">
                        {hourFormatted}
                      </span>
                    </div>

                    {/* Day Slots */}
                    {displayWeekDays.map((day) => {
                      const slotAssignments = getAssignmentsForHourSlot(day, hour);
                      const isCurrentDay = isSameDay(day, now);
                      const isCurrentHour = isCurrentDay && now.getHours() === hour;

                      return (
                        <div
                          key={`${day.toISOString()}-${hour}`}
                          onClick={() => handleSlotClick(day, hour)}
                          className={`min-h-[74px] p-1.5 border-r last:border-r-0 border-slate-200 dark:border-slate-800 relative transition cursor-pointer hover:bg-blue-50/30 dark:hover:bg-blue-950/20 group/cell ${
                            isCurrentHour 
                              ? 'bg-blue-50/40 dark:bg-blue-950/30' 
                              : isCurrentDay 
                                ? 'bg-slate-50/20 dark:bg-slate-850/20' 
                                : ''
                          }`}
                        >
                          {/* Add button on hover for empty or quick add */}
                          <div className="absolute top-1 right-1 opacity-0 group-hover/cell:opacity-100 transition-opacity z-10">
                            <span 
                              className="p-1 rounded-md bg-white dark:bg-slate-700 text-slate-500 hover:text-blue-600 shadow-2xs inline-flex"
                              title={`Ajouter un devoir à ${hourFormatted}`}
                            >
                              <Plus className="w-3 h-3" />
                            </span>
                          </div>

                          {/* Render assignments in this hour slot */}
                          <div className="space-y-1.5">
                            {slotAssignments.map((a) => {
                              const subj = subjects.find(s => s.id === a.subjectId);
                              const isDone = a.status === 'completed';
                              const hasThumb = Boolean(a.thumbnailUrl);
                              const hasFiles = a.files && a.files.length > 0;

                              return (
                                <div
                                  key={a.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEditAssignment(a);
                                  }}
                                  className={`rounded-xl p-2 border text-xs transition cursor-pointer shadow-xs hover:shadow-md flex items-start gap-2 ${
                                    isDone
                                      ? 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 opacity-60'
                                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500'
                                  }`}
                                  style={{
                                    borderLeftWidth: '4px',
                                    borderLeftColor: subj?.color || '#3B82F6'
                                  }}
                                >
                                  {/* Thumbnail preview if available */}
                                  {hasThumb && (
                                    <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700 bg-slate-100">
                                      <img 
                                        src={a.thumbnailUrl} 
                                        alt="Miniature" 
                                        className="w-full h-full object-cover" 
                                      />
                                    </div>
                                  )}

                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-1 mb-0.5">
                                      <span 
                                        className="text-[9px] font-bold px-1.5 py-0.2 rounded text-white truncate max-w-[80px]"
                                        style={{ backgroundColor: subj?.color || '#3B82F6' }}
                                      >
                                        {subj?.name}
                                      </span>
                                      <span className="text-[10px] text-slate-400 font-mono">
                                        {formatTime(a.dueDate)}
                                      </span>
                                    </div>

                                    <p className={`font-semibold line-clamp-1 leading-tight text-slate-800 dark:text-slate-100 ${isDone ? 'line-through text-slate-400' : ''}`}>
                                      {a.title}
                                    </p>

                                    {/* Indicators (files, daily reminder) */}
                                    <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400">
                                      {hasFiles && (
                                        <span className="inline-flex items-center gap-0.5 text-blue-600 dark:text-blue-400" title={`${a.files?.length} fichier(s)`}>
                                          <Paperclip className="w-2.5 h-2.5" />
                                          {a.files?.length}
                                        </span>
                                      )}
                                      {a.reminderTiming === 'daily_before_deadline' && (
                                        <span className="text-amber-600 dark:text-amber-400" title="Rappel quotidien actif">
                                          🔔 Quotidien
                                        </span>
                                      )}
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleCompleteAssignment(a.id);
                                        }}
                                        className={`ml-auto px-1 rounded text-[9px] font-semibold transition ${
                                          isDone 
                                            ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60' 
                                            : 'text-slate-500 hover:text-emerald-600'
                                        }`}
                                      >
                                        {isDone ? '✓ Fait' : 'Fait'}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MONTH VIEW */}
      {calendarMode === 'month' && (
        <div className="p-3 sm:p-5">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {weekdaysHeader.map((d) => (
              <div key={d} className="py-1 text-xs font-bold text-slate-400 uppercase tracking-wider">
                {d}
              </div>
            ))}
          </div>

          {/* Month grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {paddingDays.map((_, i) => (
              <div key={`padding-${i}`} className="min-h-[85px] sm:min-h-[105px] rounded-xl bg-slate-50/50 dark:bg-slate-850/30 opacity-40" />
            ))}

            {monthDays.map((day) => {
              const dayAssignments = getAssignmentsForDay(day);
              const isTodayCell = isSameDay(day, new Date());
              const uncompletedCount = dayAssignments.filter(a => a.status !== 'completed').length;

              return (
                <div 
                  key={day.toISOString()}
                  onClick={() => onAddOnDate(day)}
                  className={`min-h-[85px] sm:min-h-[105px] p-2 rounded-xl border flex flex-col justify-between transition cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xs group ${
                    isTodayCell 
                      ? 'border-blue-500 bg-blue-50/20 dark:bg-blue-950/20 ring-1 ring-blue-500/30' 
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span 
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        isTodayCell 
                          ? 'bg-blue-600 text-white shadow-xs' 
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {day.getDate()}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddOnDate(day);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition"
                      title="Ajouter un devoir pour ce jour"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Task list / preview chips */}
                  <div className="mt-1 space-y-1 overflow-hidden">
                    {dayAssignments.slice(0, 2).map((a) => {
                      const subj = subjects.find(s => s.id === a.subjectId);
                      const isDone = a.status === 'completed';

                      return (
                        <div
                          key={a.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditAssignment(a);
                          }}
                          className={`px-1.5 py-0.5 rounded text-[10px] truncate font-medium flex items-center gap-1 ${
                            isDone 
                              ? 'line-through bg-slate-100 dark:bg-slate-800 text-slate-400' 
                              : 'bg-blue-50 dark:bg-blue-950/60 text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          <span 
                            className="w-1.5 h-1.5 rounded-full shrink-0" 
                            style={{ backgroundColor: subj?.color || '#3B82F6' }}
                          />
                          <span className="truncate">{a.title}</span>
                        </div>
                      );
                    })}

                    {dayAssignments.length > 2 && (
                      <span className="text-[10px] text-slate-400 font-semibold block text-center">
                        +{dayAssignments.length - 2} autre(s)
                      </span>
                    )}
                  </div>

                  <div className="mt-1 text-[10px] text-right">
                    {uncompletedCount > 0 ? (
                      <span className="text-amber-600 dark:text-amber-400 font-bold">
                        {uncompletedCount} à faire
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};
