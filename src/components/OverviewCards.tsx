import React from 'react';
import { Clock, AlertTriangle, CheckCircle, Flame, CalendarCheck } from 'lucide-react';
import { useAgenda } from '../context/AgendaContext';
import { getDeadlineCountdown, isToday, isOverdue } from '../utils/dateUtils';

export const OverviewCards: React.FC = () => {
  const { assignments, subjects } = useAgenda();

  const total = assignments.length;
  const completedList = assignments.filter((a) => a.status === 'completed');
  const pendingList = assignments.filter((a) => a.status !== 'completed');
  const completedCount = completedList.length;
  const percent = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  // Next upcoming assignment
  const nextAssignment = pendingList[0] || null;
  const nextCountdown = nextAssignment ? getDeadlineCountdown(nextAssignment.dueDate) : null;
  const nextSubject = nextAssignment ? subjects.find(s => s.id === nextAssignment.subjectId) : null;

  // Today count
  const todayPendingCount = pendingList.filter((a) => isToday(a.dueDate)).length;

  // Overdue count
  const overdueCount = pendingList.filter((a) => isOverdue(a.dueDate)).length;

  // Urgent count
  const urgentCount = pendingList.filter((a) => a.priority === 'urgent').length;

  // Total estimated minutes remaining
  const totalEstimatedMinutes = pendingList.reduce((acc, curr) => acc + (curr.estimatedMinutes || 30), 0);
  const remainingHours = Math.floor(totalEstimatedMinutes / 60);
  const remainingMins = totalEstimatedMinutes % 60;

  return (
    <div id="overview-metrics-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Prochain Rendu */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col justify-between transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Prochain rendu
          </span>
          <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="my-2.5">
          {nextAssignment && nextCountdown ? (
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <span 
                  className={`inline-block w-2 h-2 rounded-full`}
                  style={{ backgroundColor: nextSubject?.color || '#3B82F6' }}
                />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                  {nextSubject?.name || 'Matière'}
                </span>
              </div>
              <div className={`text-lg font-bold truncate ${nextCountdown.isOverdue ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                {nextCountdown.text}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5" title={nextAssignment.title}>
                {nextAssignment.title}
              </p>
            </div>
          ) : (
            <div>
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                Tout est à jour !
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                Aucun devoir en attente
              </p>
            </div>
          )}
        </div>

        <div className="text-[11px] text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-2 flex items-center justify-between">
          <span>{pendingList.length} devoir{pendingList.length > 1 ? 's' : ''} restant{pendingList.length > 1 ? 's' : ''}</span>
          {overdueCount > 0 && (
            <span className="text-red-600 dark:text-red-400 font-semibold">{overdueCount} en retard</span>
          )}
        </div>
      </div>

      {/* 2. Devoirs pour aujourd'hui & urgences */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col justify-between transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            À rendre aujourd'hui
          </span>
          <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <CalendarCheck className="w-4 h-4" />
          </div>
        </div>

        <div className="my-2.5">
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {todayPendingCount}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {todayPendingCount === 0 
              ? 'Rien à rendre aujourd\'hui' 
              : `${todayPendingCount} travail${todayPendingCount > 1 ? 's' : ''} prévu${todayPendingCount > 1 ? 's' : ''} ce jour`}
          </p>
        </div>

        <div className="text-[11px] text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-2 flex items-center justify-between">
          <span>Urgent(s) : {urgentCount}</span>
          {urgentCount > 0 && (
            <span className="inline-flex items-center text-red-600 dark:text-red-400 font-medium">
              <Flame className="w-3 h-3 mr-0.5" /> Priorité haute
            </span>
          )}
        </div>
      </div>

      {/* 3. Progression globale */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col justify-between transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Progression
          </span>
          <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle className="w-4 h-4" />
          </div>
        </div>

        <div className="my-2.5">
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{percent}%</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {completedCount}/{total} terminés
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        <div className="text-[11px] text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-2">
          {percent === 100 && total > 0 ? 'Félicitations, tout est bouclé !' : `${total - completedCount} devoir(s) à finaliser`}
        </div>
      </div>

      {/* 4. Temps de travail estimé */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col justify-between transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Temps estimé restant
          </span>
          <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="my-2.5">
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {remainingHours > 0 ? `${remainingHours}h ` : ''}{remainingMins}min
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Charge de travail cumulée
          </p>
        </div>

        <div className="text-[11px] text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-2">
          Moyenne : {pendingList.length > 0 ? Math.round(totalEstimatedMinutes / pendingList.length) : 0} min / devoir
        </div>
      </div>
    </div>
  );
};
