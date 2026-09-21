import React, { useState } from 'react';
import { 
  GraduationCap, 
  Plus, 
  Bell, 
  Volume2, 
  VolumeX, 
  LogOut, 
  User as UserIcon,
  Cloud,
  CheckCircle,
  RefreshCw,
  Moon,
  Sun
} from 'lucide-react';
import { useAgenda } from '../context/AgendaContext';
import { useTheme } from '../context/ThemeContext';

interface NavbarProps {
  onOpenAddModal: () => void;
  onOpenNotificationCenter: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAddModal,
  onOpenNotificationCenter
}) => {
  const { 
    user, 
    signInWithGoogle, 
    signOut, 
    isSyncing, 
    unreadNotificationCount,
    isSoundEnabled,
    toggleSound
  } = useAgenda();

  const { theme, toggleTheme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-white text-lg tracking-tight">
                  WorksBox Agenda
                </span>
                <span className="hidden sm:inline-block text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900">
                  Scolaire
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden md:block">
                Organisation des devoirs & rappels de rendu synchronisés
              </p>
            </div>
          </div>

          {/* Right actions: Theme Toggle + Sound + Notif + User Menu + Add Button */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            
            {/* Dark Mode Toggle Button */}
            <button
              id="theme-toggle-btn"
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/70 transition cursor-pointer shadow-xs"
              title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
              aria-label="Basculer le mode sombre/clair"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            {/* Sound toggle */}
            <button
              id="toggle-sound-btn"
              type="button"
              onClick={toggleSound}
              className={`p-2 rounded-xl border transition cursor-pointer ${
                isSoundEnabled 
                  ? 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/70' 
                  : 'border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
              }`}
              title={isSoundEnabled ? 'Sons des rappels activés (cliquer pour couper)' : 'Sons coupés'}
              aria-label="Contrôle du son des rappels"
            >
              {isSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Notification Bell */}
            <button
              id="open-notifications-btn"
              type="button"
              onClick={onOpenNotificationCenter}
              className="relative p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/70 transition cursor-pointer"
              title="Centre de rappels et alertes"
              aria-label="Ouvrir le centre de notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs animate-pulse">
                  {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                </span>
              )}
            </button>

            {/* Google Auth Status / Button */}
            {user ? (
              <div className="relative">
                <button
                  id="user-profile-menu-btn"
                  type="button"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-slate-700/50 transition cursor-pointer text-left"
                >
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName || 'Compte Google'} 
                      className="w-7 h-7 rounded-full object-cover border border-blue-200 dark:border-blue-700"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-xs">
                      {user.displayName?.charAt(0) || <UserIcon className="w-3.5 h-3.5" />}
                    </div>
                  )}
                  <div className="hidden lg:block text-xs">
                    <div className="font-semibold text-slate-900 dark:text-slate-100 leading-tight truncate max-w-[120px]">
                      {user.displayName || 'Utilisateur'}
                    </div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse" />
                      Sync PC active
                    </div>
                  </div>
                </button>

                {/* Dropdown Menu */}
                {showUserMenu && (
                  <div 
                    id="user-menu-dropdown"
                    className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 p-4 z-50 animate-in fade-in zoom-in-95"
                  >
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
                      {user.photoURL ? (
                        <img 
                          src={user.photoURL} 
                          alt="Avatar" 
                          className="w-10 h-10 rounded-full border border-blue-200 dark:border-blue-700"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-sm">
                          {user.displayName?.charAt(0) || 'U'}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-900 dark:text-white text-sm truncate">
                          {user.displayName || 'Compte Google'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                      </div>
                    </div>

                    <div className="py-3 text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
                      <div className="flex items-center text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                        Synchronisation Firebase active
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        Connecté avec ce même compte sur vos autres PC, vos devoirs s'actualisent en direct.
                      </p>
                      {isSyncing && (
                        <div className="flex items-center text-blue-600 dark:text-blue-400 text-[11px] mt-1">
                          <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                          Synchronisation en cours...
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                      <button
                        id="signout-btn"
                        type="button"
                        onClick={() => {
                          setShowUserMenu(false);
                          signOut();
                        }}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-semibold transition cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Se déconnecter
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                id="google-signin-btn"
                type="button"
                onClick={signInWithGoogle}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-800 dark:text-slate-100 text-xs font-semibold transition shadow-xs cursor-pointer"
                title="Connectez-vous avec Google pour synchroniser vos devoirs entre vos PC"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.665-5.17 3.665-9.12z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.13C3.28 21.43 7.36 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.13z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.28 2.57 1.25 6.58l4.03 3.13c.95-2.83 3.6-4.96 6.72-4.96z"
                  />
                </svg>
                <span className="hidden sm:inline">Connexion Google</span>
                <span className="sm:hidden">Connexion</span>
              </button>
            )}

            {/* Primary Add Assignment Button */}
            <button
              id="add-assignment-top-btn"
              type="button"
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Nouveau devoir</span>
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};

