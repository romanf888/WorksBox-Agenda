import React from 'react';
import { Cloud, Laptop, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAgenda } from '../context/AgendaContext';

export const SyncBanner: React.FC = () => {
  const { user, signInWithGoogle, isSyncing } = useAgenda();

  if (user) {
    return (
      <div 
        id="sync-status-connected"
        className="bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs text-emerald-900 dark:text-emerald-200 shadow-xs"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center flex-shrink-0">
            <Cloud className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-emerald-900 dark:text-emerald-100">
              Synchronisation Firebase active sur vos ordinateurs
            </p>
            <p className="text-emerald-700 dark:text-emerald-300/80 text-[11px]">
              Vos devoirs et dates de rendu sont enregistrés sur le Cloud pour {user.email}.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-emerald-800 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-900/50 px-3 py-1.5 rounded-xl">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>{isSyncing ? 'Mise à jour en temps réel...' : 'Prêt & synchronisé'}</span>
        </div>
      </div>
    );
  }

  return null;
};

