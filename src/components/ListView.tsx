import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  AlertTriangle, 
  Calendar, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp,
  Inbox
} from 'lucide-react';
import { Assignment, AssignmentType, AssignmentStatus } from '../types';
import { useAgenda } from '../context/AgendaContext';
import { AssignmentCard } from './AssignmentCard';
import { isToday, isTomorrow, isOverdue } from '../utils/dateUtils';

interface ListViewProps {
  onAddNew: () => void;
  onEditAssignment: (assignment: Assignment) => void;
}

export const ListView: React.FC<ListViewProps> = ({ onAddNew, onEditAssignment }) => {
  const { assignments, subjects } = useAgenda();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showCompleted, setShowCompleted] = useState<boolean>(true);

  // Filtered assignments
  const filteredAssignments = useMemo(() => {
    return assignments.filter((item) => {
      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesDesc = item.description?.toLowerCase().includes(query);
        const subj = subjects.find(s => s.id === item.subjectId);
        const matchesSubj = subj?.name.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesSubj) return false;
      }

      // Subject filter
      if (selectedSubjectId !== 'all' && item.subjectId !== selectedSubjectId) {
        return false;
      }

      // Status filter
      if (selectedStatus === 'todo' && item.status === 'completed') return false;
      if (selectedStatus === 'completed' && item.status !== 'completed') return false;

      // Type filter
      if (selectedType !== 'all' && item.type !== selectedType) {
        return false;
      }

      return true;
    });
  }, [assignments, searchTerm, selectedSubjectId, selectedStatus, selectedType, subjects]);

  // Group into categories
  const groups = useMemo(() => {
    const overdue: Assignment[] = [];
    const today: Assignment[] = [];
    const tomorrow: Assignment[] = [];
    const thisWeek: Assignment[] = [];
    const later: Assignment[] = [];
    const completed: Assignment[] = [];

    const now = new Date();
    const next7Days = new Date(now);
    next7Days.setDate(now.getDate() + 7);

    filteredAssignments.forEach((item) => {
      if (item.status === 'completed') {
        completed.push(item);
        return;
      }

      if (isOverdue(item.dueDate)) {
        overdue.push(item);
      } else if (isToday(item.dueDate)) {
        today.push(item);
      } else if (isTomorrow(item.dueDate)) {
        tomorrow.push(item);
      } else {
        const itemDate = new Date(item.dueDate);
        if (itemDate <= next7Days) {
          thisWeek.push(item);
        } else {
          later.push(item);
        }
      }
    });

    return { overdue, today, tomorrow, thisWeek, later, completed };
  }, [filteredAssignments]);

  return (
    <div id="list-view-container" className="space-y-6">
      {/* Search & Filters Bar */}
      <search role="search" aria-label="Rechercher et filtrer les devoirs" className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-3 transition-colors block">
        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="search-assignments-input"
            type="search"
            placeholder="Rechercher un devoir, une matière, une consigne..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 outline-none transition"
          />
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs text-slate-400 dark:text-slate-400 font-medium flex items-center mr-1">
            <Filter className="w-3 h-3 mr-1" /> Filtres :
          </span>

          {/* Matière select */}
          <select
            id="filter-subject-select"
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="text-xs py-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
          >
            <option value="all">Toutes les matières</option>
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>

          {/* Statut select */}
          <select
            id="filter-status-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs py-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
          >
            <option value="all">Tous les statuts</option>
            <option value="todo">À faire uniquement</option>
            <option value="completed">Terminés / Rendus</option>
          </select>

          {/* Type select */}
          <select
            id="filter-type-select"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="text-xs py-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
          >
            <option value="all">Tous les types</option>
            <option value="exercise">Exercices</option>
            <option value="dm">Devoir Maison (DM)</option>
            <option value="exam">Contrôle / DS</option>
            <option value="project">Exposé / Projet</option>
            <option value="reading">Lecture</option>
          </select>

          {(searchTerm || selectedSubjectId !== 'all' || selectedStatus !== 'all' || selectedType !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedSubjectId('all');
                setSelectedStatus('all');
                setSelectedType('all');
              }}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline ml-auto"
            >
              Réinitialiser
            </button>
          )}
        </div>
      </search>

      {/* Empty State */}
      {filteredAssignments.length === 0 && (
        <aside aria-label="État vide" className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center shadow-xs transition-colors">
          <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-white">Aucun devoir ne correspond</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {searchTerm || selectedSubjectId !== 'all' 
              ? 'Essayez de modifier vos filtres de recherche.' 
              : 'Votre agenda est vide pour le moment. Ajoutez votre premier devoir !'}
          </p>
          <button
            type="button"
            onClick={onAddNew}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
          >
            + Ajouter un devoir
          </button>
        </aside>
      )}

      {/* Sections by timeline */}

      {/* 1. OVERDUE (En retard) */}
      {groups.overdue.length > 0 && (
        <section id="section-overdue" className="space-y-3">
          <header className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <h3 className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              Devoirs en retard ({groups.overdue.length})
            </h3>
          </header>
          <ul className="space-y-2.5 list-none p-0 m-0">
            {groups.overdue.map((a) => (
              <li key={a.id}>
                <AssignmentCard assignment={a} onEdit={onEditAssignment} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 2. TODAY (Aujourd'hui) */}
      {groups.today.length > 0 && (
        <section id="section-today" className="space-y-3">
          <header className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              À rendre aujourd'hui ({groups.today.length})
            </h3>
          </header>
          <ul className="space-y-2.5 list-none p-0 m-0">
            {groups.today.map((a) => (
              <li key={a.id}>
                <AssignmentCard assignment={a} onEdit={onEditAssignment} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 3. TOMORROW (Demain) */}
      {groups.tomorrow.length > 0 && (
        <section id="section-tomorrow" className="space-y-3">
          <header className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              À rendre demain ({groups.tomorrow.length})
            </h3>
          </header>
          <ul className="space-y-2.5 list-none p-0 m-0">
            {groups.tomorrow.map((a) => (
              <li key={a.id}>
                <AssignmentCard assignment={a} onEdit={onEditAssignment} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 4. THIS WEEK (Cette semaine) */}
      {groups.thisWeek.length > 0 && (
        <section id="section-thisweek" className="space-y-3">
          <header className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              Cette semaine ({groups.thisWeek.length})
            </h3>
          </header>
          <ul className="space-y-2.5 list-none p-0 m-0">
            {groups.thisWeek.map((a) => (
              <li key={a.id}>
                <AssignmentCard assignment={a} onEdit={onEditAssignment} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 5. LATER (Plus tard) */}
      {groups.later.length > 0 && (
        <section id="section-later" className="space-y-3">
          <header className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              Plus tard ({groups.later.length})
            </h3>
          </header>
          <ul className="space-y-2.5 list-none p-0 m-0">
            {groups.later.map((a) => (
              <li key={a.id}>
                <AssignmentCard assignment={a} onEdit={onEditAssignment} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 6. COMPLETED (Terminés / Rendus) */}
      {groups.completed.length > 0 && (
        <section id="section-completed" className="space-y-3 pt-2">
          <header>
            <button
              type="button"
              onClick={() => setShowCompleted(!showCompleted)}
              className="flex items-center justify-between w-full text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
              aria-expanded={showCompleted}
            >
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Devoirs terminés & rendus ({groups.completed.length})
              </span>
              {showCompleted ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </header>

          {showCompleted && (
            <ul className="space-y-2.5 list-none p-0 m-0">
              {groups.completed.map((a) => (
                <li key={a.id}>
                  <AssignmentCard assignment={a} onEdit={onEditAssignment} />
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
};
