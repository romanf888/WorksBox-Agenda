import React from 'react';
import { 
  X, 
  Bell, 
  Volume2, 
  VolumeX, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Trash2,
  Sparkles,
  Laptop
} from 'lucide-react';
import { useAgenda } from '../context/AgendaContext';
import { formatDateFrench } from '../utils/dateUtils';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose
}) => {
  const {
    notifications,
    unreadNotificationCount,
    notificationPermission,
    requestNotifications,
    testNotification,
    isSoundEnabled,
    toggleSound,
    markNotificationAsRead,
    clearNotifications
  } = useAgenda();

  if (!isOpen) return null;

  return (
    <dialog 
      id="notification-center-modal"
      open
      aria-modal="true"
      aria-labelledby="notification-center-title"
      className="wb-dialog"
    >
      <div 
        id="notification-center-backdrop"
        className="wb-dialog-backdrop"
        onClick={onClose}
      />
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 my-8 transition-all z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-850/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 id="notification-center-title" className="text-base font-bold text-slate-900 dark:text-white">
                Centre de notifications & rappels
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Alertes pour devoirs scolaires et dates limites de rendu
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="p-6 space-y-5">
          {/* Notification Permission Card */}
          <section aria-label="Paramètres de notification du PC" className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <Laptop className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Notifications du navigateur sur ce PC
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Recevez des alertes pop-up même lorsque vous êtes sur un autre onglet.
                  </p>
                </div>
              </div>

              {notificationPermission === 'granted' ? (
                <span className="flex items-center text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full flex-shrink-0">
                  <CheckCircle className="w-3.5 h-3.5 mr-1" />
                  Activées
                </span>
              ) : (
                <span className="flex items-center text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2.5 py-1 rounded-full flex-shrink-0">
                  <AlertCircle className="w-3.5 h-3.5 mr-1" />
                  {notificationPermission === 'denied' ? 'Bloquées' : 'Non activées'}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {notificationPermission !== 'granted' && (
                <button
                  id="request-notification-btn"
                  type="button"
                  onClick={requestNotifications}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  Activer les alertes sur ce PC
                </button>
              )}

              <button
                id="test-notification-btn"
                type="button"
                onClick={testNotification}
                className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Tester la notification & le carillon
              </button>

              <button
                type="button"
                onClick={toggleSound}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  isSoundEnabled 
                    ? 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700' 
                    : 'border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300'
                }`}
              >
                {isSoundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span>{isSoundEnabled ? 'Son : Activé' : 'Son : Muet'}</span>
              </button>
            </div>
          </section>

          {/* List of recent notifications */}
          <section aria-label="Historique des notifications">
            <header className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Historique des alertes ({notifications.length})
              </h4>
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={clearNotifications}
                  className="text-xs text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  Effacer l'historique
                </button>
              )}
            </header>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {notifications.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400 dark:text-slate-500">
                  <Bell className="w-6 h-6 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                  Aucune alerte récente. Vous serez notifié dès qu'un devoir approche de sa date limite !
                </div>
              ) : (
                <ul className="space-y-2 list-none p-0 m-0">
                  {notifications.map((notif) => (
                    <li
                      key={notif.id}
                      onClick={() => markNotificationAsRead(notif.id)}
                      className={`p-3 rounded-xl border text-xs transition cursor-pointer ${
                        notif.isRead 
                          ? 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-70' 
                          : 'bg-blue-50/40 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900 shadow-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-semibold ${notif.type === 'overdue' ? 'text-red-700 dark:text-red-400' : 'text-slate-900 dark:text-slate-100'}`}>
                          {notif.title}
                        </span>
                        <time className="text-[10px] text-slate-400 dark:text-slate-500">
                          {formatDateFrench(notif.timestamp)}
                        </time>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 mt-1">{notif.message}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            Fermer
          </button>
        </footer>
      </div>
    </dialog>
  );
};
