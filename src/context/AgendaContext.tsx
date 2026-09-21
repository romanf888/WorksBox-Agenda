import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  firebaseSignOut, 
  onAuthStateChanged, 
  db, 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  writeBatch,
  type User 
} from '../firebase';
import { 
  Assignment, 
  Subject, 
  DEFAULT_SUBJECTS, 
  AppNotification 
} from '../types';
import { getDeadlineCountdown, isOverdue } from '../utils/dateUtils';

// Gestionnaire de notifications & carillon sonore intégré
class NotificationManager {
  private audioCtx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private notifiedSet: Set<string> = new Set();

  constructor() {
    try {
      const saved = sessionStorage.getItem('agenda_notified_keys');
      if (saved) {
        this.notifiedSet = new Set(JSON.parse(saved));
      }
      const soundPref = localStorage.getItem('agenda_sound_enabled');
      if (soundPref !== null) {
        this.soundEnabled = soundPref === 'true';
      }
    } catch {}
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  public getPermission(): NotificationPermission | 'unsupported' {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission;
  }

  public async requestPermission(): Promise<NotificationPermission | 'unsupported'> {
    if (!this.isSupported()) return 'unsupported';
    try {
      return await Notification.requestPermission();
    } catch {
      return Notification.permission;
    }
  }

  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  public setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    try {
      localStorage.setItem('agenda_sound_enabled', enabled ? 'true' : 'false');
    } catch {}
  }

  public playChime(isUrgent = false): void {
    if (!this.soundEnabled) return;
    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) return;

      if (!this.audioCtx || this.audioCtx.state === 'suspended') {
        this.audioCtx = new AudioCtxClass();
      }

      const now = this.audioCtx.currentTime;
      const gainNode = this.audioCtx.createGain();
      gainNode.connect(this.audioCtx.destination);
      gainNode.gain.setValueAtTime(0.12, now);

      const osc = this.audioCtx.createOscillator();
      osc.type = 'sine';
      if (isUrgent) {
        osc.frequency.setValueAtTime(659.25, now);
        osc.frequency.setValueAtTime(880, now + 0.12);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc.start(now);
        osc.stop(now + 0.45);
      } else {
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.15);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
        osc.start(now);
        osc.stop(now + 0.55);
      }
      osc.connect(gainNode);
    } catch {}
  }

  public sendNotification(title: string, body: string, key?: string, isUrgent = false): boolean {
    if (key && this.notifiedSet.has(key)) {
      return false;
    }

    this.playChime(isUrgent);

    if (key) {
      this.notifiedSet.add(key);
      try {
        sessionStorage.setItem('agenda_notified_keys', JSON.stringify(Array.from(this.notifiedSet)));
      } catch {}
    }

    if (this.isSupported() && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
          tag: key,
        });
        return true;
      } catch {}
    }

    return false;
  }
}

const notificationService = new NotificationManager();

interface AgendaContextType {
  user: User | null;
  loadingAuth: boolean;
  isSyncing: boolean;
  assignments: Assignment[];
  subjects: Subject[];
  notifications: AppNotification[];
  unreadNotificationCount: number;
  notificationPermission: NotificationPermission | 'unsupported';
  isSoundEnabled: boolean;
  toggleSound: () => void;
  requestNotifications: () => Promise<void>;
  testNotification: () => void;
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;
  addAssignment: (data: Omit<Assignment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateAssignment: (id: string, updates: Partial<Assignment>) => Promise<void>;
  deleteAssignment: (id: string) => Promise<void>;
  toggleCompleteAssignment: (id: string) => Promise<void>;
  addSubject: (subject: Omit<Subject, 'id'>) => void;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  syncStatusMessage: string;
}

const LOCAL_STORAGE_KEY = 'agenda_local_assignments_v1';
const LOCAL_SUBJECTS_KEY = 'agenda_local_subjects_v1';

const AgendaContext = createContext<AgendaContextType | undefined>(undefined);

export const AgendaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>(DEFAULT_SUBJECTS);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>(
    notificationService.getPermission()
  );
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(notificationService.isSoundEnabled());
  const [syncStatusMessage, setSyncStatusMessage] = useState<string>('Vérification du compte Google...');

  // Clean any old sample tasks from previous versions in localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed: Assignment[] = JSON.parse(saved);
        const filtered = Array.isArray(parsed) 
          ? parsed.filter(item => !item.id.startsWith('sample-')) 
          : [];
        if (filtered.length !== (parsed ? parsed.length : 0)) {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
        }
      }
    } catch {}
  }, []);

  // Load custom subjects if stored
  useEffect(() => {
    try {
      const savedSubjects = localStorage.getItem(LOCAL_SUBJECTS_KEY);
      if (savedSubjects) {
        const parsed = JSON.parse(savedSubjects);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSubjects(parsed);
        }
      }
    } catch {}
  }, []);

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoadingAuth(false);
      if (currentUser) {
        setSyncStatusMessage(`Connecté avec ${currentUser.displayName || currentUser.email}`);
      } else {
        setSyncStatusMessage('Mode local (connectez Google pour synchroniser vos PC)');
      }
    });

    return () => unsubscribe();
  }, []);

  // Listen to Data (Firestore if user logged in, or LocalStorage)
  useEffect(() => {
    if (loadingAuth) return;

    if (user) {
      // User is logged in: listen to Firestore collection in real-time!
      setIsSyncing(true);
      const userAssignmentsRef = collection(db, 'users', user.uid, 'assignments');

      const unsubscribeSnapshot = onSnapshot(
        userAssignmentsRef,
        (snapshot) => {
          const list: Assignment[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            list.push({
              id: docSnap.id,
              userId: user.uid,
              title: data.title || '',
              subjectId: data.subjectId || 'autre',
              type: data.type || 'exercise',
              dueDate: data.dueDate || '',
              priority: data.priority || 'normal',
              status: data.status || 'todo',
              description: data.description || '',
              estimatedMinutes: data.estimatedMinutes || 30,
              reminderTiming: data.reminderTiming || '1_day_before',
              completedAt: data.completedAt || null,
              files: Array.isArray(data.files) ? data.files : [],
              thumbnailUrl: data.thumbnailUrl || undefined,
              createdAt: data.createdAt || new Date().toISOString(),
              updatedAt: data.updatedAt || new Date().toISOString(),
            });
          });

          // Sort by due date ascending
          list.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

          // If user just logged in and Firestore is empty, check if we have local assignments to import
          if (list.length === 0) {
            try {
              const localSaved = localStorage.getItem(LOCAL_STORAGE_KEY);
              if (localSaved) {
                const parsedLocal: Assignment[] = JSON.parse(localSaved);
                if (parsedLocal.length > 0) {
                  // Import local into Firestore
                  const batch = writeBatch(db);
                  parsedLocal.forEach((item) => {
                    const newDocRef = doc(userAssignmentsRef);
                    batch.set(newDocRef, {
                      ...item,
                      id: newDocRef.id,
                      userId: user.uid,
                      updatedAt: new Date().toISOString()
                    });
                  });
                  batch.commit().catch(console.error);
                  localStorage.removeItem(LOCAL_STORAGE_KEY);
                }
              }
            } catch {}
          }

          setAssignments(list);
          setIsSyncing(false);
          setSyncStatusMessage('Synchronisé avec Firebase Cloud');
        },
        (error) => {
          console.error('Firestore snapshot error:', error);
          setIsSyncing(false);
          setSyncStatusMessage('Erreur de synchronisation Firebase');
        }
      );

      return () => unsubscribeSnapshot();
    } else {
      // User is not logged in: assignments is empty (no predefined tasks)
      setAssignments([]);
    }
  }, [user, loadingAuth]);

  // Save to LocalStorage if not logged in
  const saveLocalAssignments = useCallback((newList: Assignment[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newList));
    } catch {}
  }, []);

  // Check permissions update
  const refreshPermissionState = useCallback(() => {
    setNotificationPermission(notificationService.getPermission());
  }, []);

  // Background reminder & deadline watcher
  useEffect(() => {
    const checkDeadlinesAndReminders = () => {
      const now = Date.now();
      const newNotifications: AppNotification[] = [];

      assignments.forEach((assignment) => {
        if (assignment.status === 'completed') return;

        const dueTime = new Date(assignment.dueDate).getTime();
        if (isNaN(dueTime)) return;

        const diffMinutes = Math.floor((dueTime - now) / (1000 * 60));
        const subj = subjects.find(s => s.id === assignment.subjectId)?.name || 'Devoir';

        // 1. Is it overdue?
        if (diffMinutes < 0) {
          const overdueKey = `overdue_${assignment.id}_${new Date().toDateString()}`;
          const sent = notificationService.sendNotification(
            `⚠️ Devoir en retard : ${subj}`,
            `"${assignment.title}" devait être rendu. N'attends plus pour le terminer !`,
            overdueKey,
            true
          );
          if (sent) {
            newNotifications.push({
              id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              assignmentId: assignment.id,
              title: `Devoir en retard : ${subj}`,
              message: `"${assignment.title}" a dépassé son échéance.`,
              timestamp: new Date().toISOString(),
              isRead: false,
              type: 'overdue'
            });
          }
        }

        // 2. Is it approaching reminder timing?
        let shouldRemind = false;
        let timingLabel = '';

        const diffHours = (dueTime - now) / (1000 * 60 * 60);
        const diffDays = Math.ceil(diffHours / 24);

        switch (assignment.reminderTiming) {
          case 'daily_before_deadline':
            // Alerte quotidienne chaque jour avant le jour J
            if (diffHours > 0) {
              shouldRemind = true;
              if (diffDays <= 1) {
                timingLabel = `Jour J - C'est à rendre aujourd'hui ou demain !`;
              } else {
                timingLabel = `Rappel quotidien (J-${diffDays}) : reste ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
              }
            }
            break;
          case 'at_deadline':
            shouldRemind = diffMinutes >= 0 && diffMinutes <= 15;
            timingLabel = 'Date limite imminente !';
            break;
          case '1_hour_before':
            shouldRemind = diffMinutes > 0 && diffMinutes <= 60;
            timingLabel = 'Rendu dans moins d\'une heure !';
            break;
          case '3_hours_before':
            shouldRemind = diffMinutes > 0 && diffMinutes <= 180;
            timingLabel = 'Rendu dans moins de 3 heures !';
            break;
          case '1_day_before':
            shouldRemind = diffMinutes > 0 && diffMinutes <= 1440;
            timingLabel = 'À rendre demain ou sous 24h !';
            break;
          case '2_days_before':
            shouldRemind = diffMinutes > 0 && diffMinutes <= 2880;
            timingLabel = 'À rendre dans les prochains jours.';
            break;
          default:
            break;
        }

        if (shouldRemind) {
          const reminderKey = `reminder_${assignment.id}_${assignment.reminderTiming}_${new Date().toDateString()}`;
          const countdown = getDeadlineCountdown(assignment.dueDate);
          const sent = notificationService.sendNotification(
            `🔔 Rappel Devoir : ${subj}`,
            `"${assignment.title}" - ${timingLabel} (${countdown.text})`,
            reminderKey,
            assignment.priority === 'urgent'
          );

          if (sent) {
            newNotifications.push({
              id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              assignmentId: assignment.id,
              title: `Rappel : ${subj}`,
              message: `"${assignment.title}" (${countdown.text})`,
              timestamp: new Date().toISOString(),
              isRead: false,
              type: assignment.priority === 'urgent' ? 'urgent' : 'reminder'
            });
          }
        }
      });

      if (newNotifications.length > 0) {
        setNotifications((prev) => [...newNotifications, ...prev].slice(0, 30));
      }
    };

    // Run immediately and every 30 seconds
    checkDeadlinesAndReminders();
    const interval = setInterval(checkDeadlinesAndReminders, 30000);
    return () => clearInterval(interval);
  }, [assignments, subjects]);

  // Request browser notification permission
  const requestNotifications = async () => {
    const res = await notificationService.requestPermission();
    setNotificationPermission(res);
    refreshPermissionState();
    if (res === 'granted') {
      notificationService.sendNotification(
        '🎉 Notifications activées !',
        'Tu recevras les rappels de devoirs scolaires directement sur ton PC.',
        'welcome_notif'
      );
    }
  };

  // Sound toggle
  const toggleSound = () => {
    const next = !isSoundEnabled;
    notificationService.setSoundEnabled(next);
    setIsSoundEnabled(next);
    if (next) {
      notificationService.playChime(false);
    }
  };

  // Test notification
  const testNotification = () => {
    notificationService.sendNotification(
      '🔔 Test de rappel Agenda scolaire',
      'Le carillon sonore et les alertes fonctionnent parfaitement sur votre ordinateur !',
      `test_${Date.now()}`,
      false
    );
    setNotifications((prev) => [
      {
        id: `notif_test_${Date.now()}`,
        assignmentId: '',
        title: 'Test de rappel réussi',
        message: 'Vos alertes sonores et notifications sont opérationnelles sur ce PC.',
        timestamp: new Date().toISOString(),
        isRead: false,
        type: 'reminder'
      },
      ...prev
    ]);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  // Add Assignment
  const addAssignment = async (data: Omit<Assignment, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
    const now = new Date().toISOString();
    const newDocData = {
      ...data,
      createdAt: now,
      updatedAt: now
    };

    if (user) {
      setIsSyncing(true);
      try {
        const colRef = collection(db, 'users', user.uid, 'assignments');
        const docRef = await addDoc(colRef, newDocData);
        setIsSyncing(false);
        return docRef.id;
      } catch (err) {
        console.error('Failed to add assignment in Firestore:', err);
        setIsSyncing(false);
        throw err;
      }
    } else {
      const newId = `local_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newAssignment: Assignment = {
        ...newDocData,
        id: newId
      };
      const updated = [...assignments, newAssignment].sort(
        (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      );
      setAssignments(updated);
      saveLocalAssignments(updated);
      return newId;
    }
  };

  // Update Assignment
  const updateAssignment = async (id: string, updates: Partial<Assignment>) => {
    const now = new Date().toISOString();
    const finalUpdates = {
      ...updates,
      updatedAt: now
    };

    if (user) {
      setIsSyncing(true);
      try {
        const docRef = doc(db, 'users', user.uid, 'assignments', id);
        await updateDoc(docRef, finalUpdates);
        setIsSyncing(false);
      } catch (err) {
        console.error('Failed to update assignment in Firestore:', err);
        setIsSyncing(false);
        throw err;
      }
    } else {
      const updated = assignments.map((item) => (item.id === id ? { ...item, ...finalUpdates } : item));
      setAssignments(updated);
      saveLocalAssignments(updated);
    }
  };

  // Delete Assignment
  const deleteAssignment = async (id: string) => {
    if (user) {
      setIsSyncing(true);
      try {
        const docRef = doc(db, 'users', user.uid, 'assignments', id);
        await deleteDoc(docRef);
        setIsSyncing(false);
      } catch (err) {
        console.error('Failed to delete assignment in Firestore:', err);
        setIsSyncing(false);
        throw err;
      }
    } else {
      const updated = assignments.filter((item) => item.id !== id);
      setAssignments(updated);
      saveLocalAssignments(updated);
    }
  };

  // Toggle Complete / Rendu
  const toggleCompleteAssignment = async (id: string) => {
    const target = assignments.find((item) => item.id === id);
    if (!target) return;

    const isNowCompleted = target.status !== 'completed';
    const newStatus = isNowCompleted ? 'completed' : 'todo';
    const completedAt = isNowCompleted ? new Date().toISOString() : null;

    if (isNowCompleted) {
      // Trigger motivational confetti!
      try {
        confetti({
          particleCount: 55,
          spread: 60,
          origin: { y: 0.75 }
        });
      } catch {}
    }

    await updateAssignment(id, {
      status: newStatus,
      completedAt
    });
  };

  // Add custom subject
  const addSubject = (newSub: Omit<Subject, 'id'>) => {
    const id = `subj_${Date.now()}`;
    const subjectWithId: Subject = { ...newSub, id };
    const updated = [...subjects, subjectWithId];
    setSubjects(updated);
    try {
      localStorage.setItem(LOCAL_SUBJECTS_KEY, JSON.stringify(updated));
    } catch {}
  };

  // Sign In with Google
  const signInWithGoogle = async () => {
    try {
      setIsSyncing(true);
      await signInWithPopup(auth, googleProvider);
      setIsSyncing(false);
    } catch (error) {
      console.error('Google Sign In Error:', error);
      setIsSyncing(false);
      alert('La connexion Google a rencontré un problème. Vérifiez les popups autorisés.');
    }
  };

  // Sign Out
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setSyncStatusMessage('Déconnecté - Mode local');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const unreadNotificationCount = useMemo(() => {
    return notifications.filter(n => !n.isRead).length;
  }, [notifications]);

  return (
    <AgendaContext.Provider
      value={{
        user,
        loadingAuth,
        isSyncing,
        assignments,
        subjects,
        notifications,
        unreadNotificationCount,
        notificationPermission,
        isSoundEnabled,
        toggleSound,
        requestNotifications,
        testNotification,
        markNotificationAsRead,
        clearNotifications,
        addAssignment,
        updateAssignment,
        deleteAssignment,
        toggleCompleteAssignment,
        addSubject,
        signInWithGoogle,
        signOut,
        syncStatusMessage
      }}
    >
      {children}
    </AgendaContext.Provider>
  );
};

export const useAgenda = () => {
  const context = useContext(AgendaContext);
  if (!context) {
    throw new Error('useAgenda must be used within an AgendaProvider');
  }
  return context;
};
