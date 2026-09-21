import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ListTodo, 
  BookOpen, 
  Plus, 
  Clock, 
  GraduationCap,
  Sparkles,
  Loader2
} from 'lucide-react';
import { AgendaProvider, useAgenda } from './context/AgendaContext';
import { ThemeProvider } from './context/ThemeContext';
import { GoogleAuthGate } from './components/GoogleAuthGate';
import { Navbar } from './components/Navbar';
import { SyncBanner } from './components/SyncBanner';
import { OverviewCards } from './components/OverviewCards';
import { CalendarView } from './components/CalendarView';
import { ListView } from './components/ListView';
import { SubjectsView } from './components/SubjectsView';
import { AssignmentModal } from './components/AssignmentModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { Assignment } from './types';

type ActiveTab = 'calendar' | 'list' | 'subjects';

const AgendaAppContent: React.FC = () => {
  const { assignments, user, loadingAuth } = useAgenda();
  const [activeTab, setActiveTab] = useState<ActiveTab>('calendar');
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [initialDateForNew, setInitialDateForNew] = useState<Date | null>(null);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);

  // If Firebase Auth is still initializing, show a sleek loading screen
  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 transition-colors">
        <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4 animate-pulse">
          <GraduationCap className="w-6 h-6" />
        </div>
        <div className="flex items-center gap-2.5 text-sm font-medium text-slate-600 dark:text-slate-300">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
          <span>Chargement de votre agenda scolaire...</span>
        </div>
      </div>
    );
  }

  // Mandatory Google Authentication Gate
  if (!user) {
    return <GoogleAuthGate />;
  }

  const handleOpenAddModal = (date?: Date) => {
    setEditingAssignment(null);
    setInitialDateForNew(date || null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setIsAddModalOpen(true);
  };

  const handleAddForSubject = (subjectId: string) => {
    setEditingAssignment(null);
    setInitialDateForNew(null);
    setIsAddModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900 transition-colors">
      {/* Top Navigation */}
      <Navbar 
        onOpenAddModal={() => handleOpenAddModal()} 
        onOpenNotificationCenter={() => setIsNotificationCenterOpen(true)} 
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Sync Status Banner */}
        <SyncBanner />

        {/* School Overview Metrics */}
        <OverviewCards />

        {/* View Switcher Tabs Bar */}
        <nav aria-label="Modes d'affichage de l'agenda" className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 dark:bg-slate-800/80 rounded-xl" role="tablist">
            <button
              id="tab-calendar"
              role="tab"
              aria-selected={activeTab === 'calendar'}
              type="button"
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'calendar'
                  ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              <span>Agenda & Calendrier</span>
            </button>

            <button
              id="tab-list"
              role="tab"
              aria-selected={activeTab === 'list'}
              type="button"
              onClick={() => setActiveTab('list')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'list'
                  ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <ListTodo className="w-4 h-4" />
              <span>Échéancier & Liste</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold">
                {assignments.filter(a => a.status !== 'completed').length}
              </span>
            </button>

            <button
              id="tab-subjects"
              role="tab"
              aria-selected={activeTab === 'subjects'}
              type="button"
              onClick={() => setActiveTab('subjects')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'subjects'
                  ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Matières scolaires</span>
            </button>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
            {assignments.filter(a => a.status === 'completed').length} devoirs bouclés sur {assignments.length}
          </div>
        </nav>

        {/* View Contents */}
        <section aria-label="Espace de travail actif">
          {activeTab === 'calendar' && (
            <CalendarView 
              onAddOnDate={(d) => handleOpenAddModal(d)}
              onEditAssignment={handleOpenEditModal}
            />
          )}

          {activeTab === 'list' && (
            <ListView 
              onAddNew={() => handleOpenAddModal()}
              onEditAssignment={handleOpenEditModal}
            />
          )}

          {activeTab === 'subjects' && (
            <SubjectsView 
              onAddForSubject={handleAddForSubject}
              onEditAssignment={handleOpenEditModal}
            />
          )}
        </section>

      </main>

      {/* Floating Add Button for Mobile */}
      <aside className="fixed bottom-5 right-5 sm:hidden z-30" aria-label="Action rapide mobile">
        <button
          id="fab-add-assignment"
          type="button"
          onClick={() => handleOpenAddModal()}
          className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex items-center justify-center active:scale-95 transition cursor-pointer"
          aria-label="Ajouter un devoir"
        >
          <Plus className="w-7 h-7 stroke-[2.5]" />
        </button>
      </aside>

      {/* Modals */}
      <AssignmentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        assignmentToEdit={editingAssignment}
        initialDate={initialDateForNew}
      />

      <NotificationCenterModal
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 py-5 text-center text-xs text-slate-500 dark:text-slate-400 bg-white/70 dark:bg-slate-900/70 transition-colors">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">WorksBox Agenda</span>
            <span>— Synchronisation Google Firebase & Rappels</span>
          </div>
          <div className="text-slate-400 dark:text-slate-500 text-[11px]">
            Synchronisation en temps réel entre tous vos PC via votre compte Google.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AgendaProvider>
        <AgendaAppContent />
      </AgendaProvider>
    </ThemeProvider>
  );
}
