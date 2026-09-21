import React from 'react';
import { Plus, BookOpen, Clock, CheckCircle } from 'lucide-react';
import { Assignment } from '../types';
import { useAgenda } from '../context/AgendaContext';
import { AssignmentCard } from './AssignmentCard';

interface SubjectsViewProps {
  onAddForSubject: (subjectId: string) => void;
  onEditAssignment: (assignment: Assignment) => void;
}

export const SubjectsView: React.FC<SubjectsViewProps> = ({
  onAddForSubject,
  onEditAssignment
}) => {
  const { subjects, assignments } = useAgenda();

  return (
    <div id="subjects-view-container" className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {subjects.map((subj) => {
          const subjAssignments = assignments.filter((a) => a.subjectId === subj.id);
          const pendingAssignments = subjAssignments.filter((a) => a.status !== 'completed');
          const completedCount = subjAssignments.filter((a) => a.status === 'completed').length;
          const totalEstimatedMins = pendingAssignments.reduce((acc, curr) => acc + (curr.estimatedMinutes || 30), 0);

          return (
            <div
              key={subj.id}
              id={`subject-card-${subj.id}`}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between transition-colors"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span 
                      className="w-3.5 h-3.5 rounded-full shadow-xs" 
                      style={{ backgroundColor: subj.color }} 
                    />
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{subj.name}</h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => onAddForSubject(subj.id)}
                    className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition cursor-pointer"
                    title={`Ajouter un devoir en ${subj.name}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Devoir</span>
                  </button>
                </div>

                {/* Quick stats for subject */}
                <div className="grid grid-cols-3 gap-2 py-3 text-center bg-slate-50/70 dark:bg-slate-800/60 rounded-xl my-3 text-xs">
                  <div>
                    <span className="block font-bold text-slate-900 dark:text-white text-sm">{pendingAssignments.length}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">À faire</span>
                  </div>
                  <div>
                    <span className="block font-bold text-emerald-600 dark:text-emerald-400 text-sm">{completedCount}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">Rendu(s)</span>
                  </div>
                  <div>
                    <span className="block font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                      {totalEstimatedMins > 0 ? `${totalEstimatedMins}m` : '0m'}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">Estimé</span>
                  </div>
                </div>

                {/* List of assignments in this subject */}
                <div className="space-y-2.5 mt-2">
                  {subjAssignments.length === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-slate-500 italic text-center py-4">
                      Aucun devoir enregistré pour cette matière.
                    </p>
                  ) : (
                    subjAssignments.map((a) => (
                      <AssignmentCard key={a.id} assignment={a} onEdit={onEditAssignment} />
                    ))
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
