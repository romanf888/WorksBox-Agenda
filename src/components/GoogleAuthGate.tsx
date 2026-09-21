import React, { useState } from 'react';
import { 
  GraduationCap, 
  Sparkles, 
  ShieldCheck, 
  Laptop, 
  BellRing, 
  Calendar, 
  Moon, 
  Sun,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useAgenda } from '../context/AgendaContext';
import { useTheme } from '../context/ThemeContext';

export const GoogleAuthGate: React.FC = () => {
  const { signInWithGoogle, isSyncing } = useAgenda();
  const { theme, toggleTheme } = useTheme();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);

  const handleSignIn = async () => {
    setErrorMsg(null);
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        err?.message?.includes('popup-blocked')
          ? 'La fenêtre de connexion a été bloquée par votre navigateur. Veuillez autoriser les fenêtres pop-up.'
          : 'La connexion avec Google a échoué. Veuillez réessayer.'
      );
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between transition-colors duration-200">
      
      {/* Top Bar with Logo & Dark Mode toggle */}
      <header className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-slate-900 dark:text-white leading-tight">
              WorksBox Agenda
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Synchronisation Cloud Google & Rappels PC
            </p>
          </div>
        </div>

        {/* Theme Toggle Button */}
        <button
          id="auth-theme-toggle"
          type="button"
          onClick={toggleTheme}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shadow-xs flex items-center gap-2 text-xs font-medium"
          title={theme === 'dark' ? 'Passer au mode clair' : 'Passer au mode sombre'}
          aria-label="Basculer le thème"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Mode Clair</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline">Mode Sombre</span>
            </>
          )}
        </button>
      </header>

      {/* Main Content Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xl shadow-slate-200/40 dark:shadow-none transition-colors duration-200">
          
          <div className="text-center space-y-3 mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 mb-2">
              <Calendar className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Connexion Obligatoire
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Connectez votre compte Google pour accéder à votre agenda scolaire personnel et synchroniser vos devoirs en temps réel sur tous vos PC.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Google Sign-in Button */}
          <div className="space-y-4">
            <button
              id="google-auth-login-btn"
              type="button"
              onClick={handleSignIn}
              disabled={isSigningIn || isSyncing}
              className="w-full py-3.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-100 font-semibold text-sm transition shadow-sm hover:shadow-md flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group active:scale-[0.99]"
            >
              {isSigningIn ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  <span>Connexion à Google en cours...</span>
                </>
              ) : (
                <>
                  {/* Google G SVG */}
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
                  <span className="group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                    Continuer avec un compte Google
                  </span>
                </>
              )}
            </button>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2.5">
                <Laptop className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>Synchronisation immédiate entre votre PC portable et votre PC fixe</span>
              </div>
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Sauvegarde sécurisée dans votre espace Firestore privé</span>
              </div>
              <div className="flex items-center gap-2.5">
                <BellRing className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
                <span>Rappels sonores et notifications PC configurables</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-300">
              <Sparkles className="w-3 h-3 text-blue-500" />
              Agenda vierge prêt à accueillir vos matières et devoirs
            </span>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto px-4 py-4 text-center text-xs text-slate-400 dark:text-slate-600">
        Agenda Scolaire • Compte Google & Base de données Firebase Firestore
      </footer>

    </div>
  );
};
