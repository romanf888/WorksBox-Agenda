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
    <section id="subjects-view-container" aria-label="Matières scolaires et devoirs par discipline" className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {subjects.map((subj) => {
          const subjAssignments = assignments.filter((a) => a.subjectId === subj.id);
          const pendingAssignments = subjAssignments.filter((a) => a.status !== 'completed');
          const completedCount = subjAssignments.filter((a) => a.status === 'completed').length;
          const totalEstimatedMins = pendingAssignments.reduce((acc, curr) => acc + (curr.estimatedMinutes || 30), 0);

          return (
            <article
              key={subj.id}
              id={`subject-card-${subj.id}`}
              className="wb-card p-5 flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <header className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span 
                      className="w-3.5 h-3.5 rounded-full shadow-xs shrink-0" 
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
                </header>

                {/* Quick stats for subject */}
                <dl className="grid grid-cols-3 gap-2 py-3 text-center bg-slate-50/70 dark:bg-slate-800/60 rounded-xl my-3 text-xs m-0">
                  <div>
                    <dd className="font-bold text-slate-900 dark:text-white text-sm m-0">{pendingAssignments.length}</dd>
                    <dt className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-medium">À faire</dt>
                  </div>
                  <div>
                    <dd className="font-bold text-emerald-600 dark:text-emerald-400 text-sm m-0">{completedCount}</dd>
                    <dt className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-medium">Rendu(s)</dt>
                  </div>
                  <div>
                    <dd className="font-bold text-indigo-600 dark:text-indigo-400 text-sm m-0">
                      {totalEstimatedMins > 0 ? `${totalEstimatedMins}m` : '0m'}
                    </dd>
                    <dt className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-medium">Estimé</dt>
                  </div>
                </dl>

                {/* List of assignments in this subject */}
                <div className="mt-2">
                  {subjAssignments.length === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-slate-500 italic text-center py-4">
                      Aucun devoir enregistré pour cette matière.
                    </p>
                  ) : (
                    <ul className="space-y-2.5 list-none p-0 m-0">
                      {subjAssignments.map((a) => (
                        <li key={a.id}>
                          <AssignmentCard assignment={a} onEdit={onEditAssignment} />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
