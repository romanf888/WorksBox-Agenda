import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  BookOpen, 
  AlertCircle, 
  Bell, 
  Plus, 
  Check, 
  Paperclip, 
  Image as ImageIcon, 
  Trash2, 
  Upload, 
  FileText, 
  FileArchive, 
  FileCode, 
  FileSpreadsheet, 
  Sparkles 
} from 'lucide-react';
import { Assignment, AssignmentType, PriorityLevel, ReminderTiming, AttachedFile } from '../types';
import { useAgenda } from '../context/AgendaContext';
import { toInputDateTimeLocal } from '../utils/dateUtils';
import { 
  MAX_FILE_SIZE_BYTES, 
  MAX_FILES_COUNT, 
  formatFileSize, 
  readFileAsDataURL, 
  createOptimizedThumbnail, 
  saveFileLocally, 
  THUMBNAIL_PRESETS, 
  getPresetThumbnailDataUrl,
  ThumbnailPreset
} from '../services/fileStorage';

interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignmentToEdit?: Assignment | null;
  initialDate?: Date | null;
}

export const AssignmentModal: React.FC<AssignmentModalProps> = ({
  isOpen,
  onClose,
  assignmentToEdit,
  initialDate
}) => {
  const { subjects, addAssignment, updateAssignment, addSubject } = useAgenda();

  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('maths');
  const [type, setType] = useState<AssignmentType>('exercise');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('normal');
  const [reminderTiming, setReminderTiming] = useState<ReminderTiming>('daily_before_deadline');
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Files state (max 5, 5 Mo max each)
  const [files, setFiles] = useState<AttachedFile[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Miniature / Thumbnail state
  const [thumbnailUrl, setThumbnailUrl] = useState<string | undefined>(undefined);
  const [isUploadingThumb, setIsUploadingThumb] = useState(false);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  // Custom subject creation inline
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');

  // Pre-fill fields on open / edit
  useEffect(() => {
    setFileError(null);
    if (assignmentToEdit) {
      setTitle(assignmentToEdit.title);
      setSubjectId(assignmentToEdit.subjectId);
      setType(assignmentToEdit.type);
      setDueDate(assignmentToEdit.dueDate);
      setPriority(assignmentToEdit.priority);
      setReminderTiming(assignmentToEdit.reminderTiming || 'daily_before_deadline');
      setEstimatedMinutes(assignmentToEdit.estimatedMinutes || 30);
      setDescription(assignmentToEdit.description || '');
      setFiles(assignmentToEdit.files || []);
      setThumbnailUrl(assignmentToEdit.thumbnailUrl || undefined);
    } else {
      setTitle('');
      setSubjectId(subjects[0]?.id || 'maths');
      setType('exercise');
      setPriority('normal');
      setReminderTiming('daily_before_deadline');
      setEstimatedMinutes(30);
      setDescription('');
      setFiles([]);
      setThumbnailUrl(undefined);

      // Default due date: tomorrow at 08:00 or given initialDate
      const base = initialDate ? new Date(initialDate) : new Date();
      if (!initialDate) {
        base.setDate(base.getDate() + 1);
        base.setHours(8, 0, 0, 0);
      }
      setDueDate(toInputDateTimeLocal(base));
    }
  }, [assignmentToEdit, initialDate, isOpen, subjects]);

  if (!isOpen) return null;

  // Quick date presets
  const setQuickDueDate = (daysFromNow: number, hours: number) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromNow);
    d.setHours(hours, 0, 0, 0);
    setDueDate(toInputDateTimeLocal(d));
  };

  const setQuickDueDateNextMonday = () => {
    const d = new Date();
    const day = d.getDay();
    const daysUntilMonday = ((1 - day + 7) % 7) || 7;
    d.setDate(d.getDate() + daysUntilMonday);
    d.setHours(8, 0, 0, 0);
    setDueDate(toInputDateTimeLocal(d));
  };

  // Gestion des fichiers joints (5 max, 5 Mo max)
  const handleFileSelection = async (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return;
    setFileError(null);

    if (files.length + selectedFiles.length > MAX_FILES_COUNT) {
      setFileError(`Limite atteinte : Vous ne pouvez pas dépasser ${MAX_FILES_COUNT} fichiers au total par devoir.`);
      return;
    }

    setIsUploadingFiles(true);
    const newAttachedFiles: AttachedFile[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];

      if (file.size > MAX_FILE_SIZE_BYTES) {
        setFileError(`Le fichier « ${file.name} » dépasse la taille maximale de 5 Mo (${(file.size / (1024 * 1024)).toFixed(1)} Mo).`);
        continue;
      }

      try {
        const fileId = `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const dataUrl = await readFileAsDataURL(file);
        
        // Sauvegarde locale IndexedDB
        await saveFileLocally(fileId, dataUrl);

        const attached: AttachedFile = {
          id: fileId,
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          dataUrl,
          uploadedAt: new Date().toISOString()
        };
        newAttachedFiles.push(attached);

        // Si aucune miniature n'est encore définie et que c'est une image, on peut suggérer/appliquer
        if (!thumbnailUrl && file.type.startsWith('image/')) {
          try {
            const thumb = await createOptimizedThumbnail(dataUrl);
            setThumbnailUrl(thumb);
          } catch {}
        }
      } catch (err) {
        console.error('Erreur lecture fichier:', err);
      }
    }

    setFiles((prev) => [...prev, ...newAttachedFiles].slice(0, MAX_FILES_COUNT));
    setIsUploadingFiles(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveFile = (fileId: string) => {
    setFiles((prev) => prev.filter(f => f.id !== fileId));
  };

  // Gestion de la miniature personnalisée
  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner un fichier image valide (JPG, PNG, WebP).');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      alert('L\'image dépasse 5 Mo.');
      return;
    }

    setIsUploadingThumb(true);
    try {
      const compressedThumb = await createOptimizedThumbnail(file);
      setThumbnailUrl(compressedThumb);
    } catch (err) {
      console.error('Erreur traitement miniature:', err);
    } finally {
      setIsUploadingThumb(false);
      if (thumbInputRef.current) thumbInputRef.current.value = '';
    }
  };

  const handleSelectPresetThumbnail = (preset: ThumbnailPreset) => {
    const dataUrl = getPresetThumbnailDataUrl(preset);
    setThumbnailUrl(dataUrl);
  };

  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;
    const colors = ['#0284C7', '#7C3AED', '#DB2777', '#059669', '#D97706'];
    const chosenColor = colors[Math.floor(Math.random() * colors.length)];
    
    addSubject({
      name: newSubjectName.trim(),
      color: chosenColor,
      bgClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      textClass: 'text-indigo-700',
      borderClass: 'border-indigo-500',
      iconName: 'BookOpen'
    });
    setNewSubjectName('');
    setIsAddingSubject(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) return;

    setIsSubmitting(true);
    try {
      if (assignmentToEdit) {
        await updateAssignment(assignmentToEdit.id, {
          title: title.trim(),
          subjectId,
          type,
          dueDate,
          priority,
          reminderTiming,
          estimatedMinutes: Number(estimatedMinutes),
          description: description.trim(),
          files,
          thumbnailUrl
        });
      } else {
        await addAssignment({
          title: title.trim(),
          subjectId,
          type,
          dueDate,
          priority,
          status: 'todo',
          reminderTiming,
          estimatedMinutes: Number(estimatedMinutes),
          description: description.trim(),
          files,
          thumbnailUrl,
          completedAt: null
        });
      }
      onClose();
    } catch (err) {
      console.error('Error saving assignment:', err);
      alert('Une erreur est survenue lors de l\'enregistrement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFileIcon = (mime: string) => {
    if (mime.startsWith('image/')) return <ImageIcon className="w-4 h-4 text-blue-500" />;
    if (mime.includes('pdf')) return <FileText className="w-4 h-4 text-red-500" />;
    if (mime.includes('zip') || mime.includes('rar') || mime.includes('tar')) return <FileArchive className="w-4 h-4 text-amber-500" />;
    if (mime.includes('code') || mime.includes('javascript') || mime.includes('python')) return <FileCode className="w-4 h-4 text-emerald-500" />;
    if (mime.includes('sheet') || mime.includes('excel')) return <FileSpreadsheet className="w-4 h-4 text-green-600" />;
    return <FileText className="w-4 h-4 text-slate-500" />;
  };

  return (
    <div 
      id="assignment-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div 
        id="assignment-modal-container"
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-7 my-6 text-slate-900 dark:text-slate-100 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/70 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {assignmentToEdit ? 'Modifier le devoir' : 'Nouveau devoir scolaire'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Planification des devoirs, fichiers joints et rappels PC
              </p>
            </div>
          </div>
          
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          
          {/* Titre */}
          <div>
            <label htmlFor="assignment-title" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Intitulé du devoir *
            </label>
            <input
              id="assignment-title"
              type="text"
              required
              autoFocus
              placeholder="Ex: Exercices 12 à 15 p. 84, DM de Géométrie, Exposé d'Histoire..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-950/60 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-medium transition"
            />
          </div>

          {/* Matière & Type (2 columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Matière */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="assignment-subject" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Matière scolaire *
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddingSubject(!isAddingSubject)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  {isAddingSubject ? 'Annuler' : 'Autre matière'}
                </button>
              </div>

              {isAddingSubject ? (
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="Nom de la matière..."
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCreateSubject}
                    className="px-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 cursor-pointer"
                  >
                    Ajouter
                  </button>
                </div>
              ) : (
                <select
                  id="assignment-subject"
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
                >
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Type */}
            <div>
              <label htmlFor="assignment-type" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Type de travail *
              </label>
              <select
                id="assignment-type"
                value={type}
                onChange={(e) => setType(e.target.value as AssignmentType)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
              >
                <option value="exercise">Exercices</option>
                <option value="dm">Devoir Maison (DM)</option>
                <option value="exam">Contrôle / DS / Interro</option>
                <option value="project">Exposé / Projet</option>
                <option value="reading">Lecture / Fiche de lecture</option>
                <option value="other">Autre travail</option>
              </select>
            </div>
          </div>

          {/* Date & Heure de rendu */}
          <div>
            <label htmlFor="assignment-due-date" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Date et heure de rendu (Échéance sur l'Emploi du temps) *
            </label>
            <input
              id="assignment-due-date"
              type="datetime-local"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-medium"
            />
            {/* Quick date presets */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[11px] text-slate-400 self-center mr-1">Raccourcis :</span>
              <button
                type="button"
                onClick={() => setQuickDueDate(1, 8)}
                className="px-2 py-0.5 rounded-md text-[11px] bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition cursor-pointer"
              >
                Demain 8h
              </button>
              <button
                type="button"
                onClick={() => setQuickDueDate(1, 14)}
                className="px-2 py-0.5 rounded-md text-[11px] bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition cursor-pointer"
              >
                Demain 14h
              </button>
              <button
                type="button"
                onClick={() => setQuickDueDate(2, 8)}
                className="px-2 py-0.5 rounded-md text-[11px] bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition cursor-pointer"
              >
                Après-demain
              </button>
              <button
                type="button"
                onClick={setQuickDueDateNextMonday}
                className="px-2 py-0.5 rounded-md text-[11px] bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition cursor-pointer"
              >
                Lundi prochain
              </button>
            </div>
          </div>

          {/* Priorité & Rappel automatique (2 columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Priorité */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Priorité
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['low', 'normal', 'urgent'] as PriorityLevel[]).map((lvl) => {
                  const isSelected = priority === lvl;
                  const label = lvl === 'low' ? 'Basse' : lvl === 'normal' ? 'Normale' : 'Urgente';
                  const activeClass = 
                    lvl === 'urgent' 
                      ? 'bg-red-50 dark:bg-red-950/60 border-red-500 text-red-700 dark:text-red-300' 
                      : lvl === 'normal' 
                        ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-800 dark:text-amber-300' 
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-400 text-slate-700 dark:text-slate-300';

                  return (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setPriority(lvl)}
                      className={`py-1.5 px-2 rounded-xl border text-xs font-medium transition cursor-pointer text-center ${
                        isSelected ? `${activeClass} font-bold shadow-xs` : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notification de rappel avec "Chaque jour avant le jour J" */}
            <div>
              <label htmlFor="assignment-reminder" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                <Bell className="w-3.5 h-3.5 inline mr-1 text-slate-500 dark:text-slate-400" />
                Notification de rappel
              </label>
              <select
                id="assignment-reminder"
                value={reminderTiming}
                onChange={(e) => setReminderTiming(e.target.value as ReminderTiming)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm"
              >
                <option value="daily_before_deadline">🔔 Chaque jour avant le jour J (Rappel quotidien)</option>
                <option value="1_day_before">1 jour avant l'échéance</option>
                <option value="2_days_before">2 jours avant l'échéance</option>
                <option value="3_hours_before">3 heures avant</option>
                <option value="1_hour_before">1 heure avant</option>
                <option value="at_deadline">Au moment exact de la date limite</option>
                <option value="none">Aucun rappel</option>
              </select>
            </div>
          </div>

          {/* MINIATURE / APERÇU DU RAPPEL */}
          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Miniature & Aperçu visuel du rappel
                </span>
              </div>
              {thumbnailUrl && (
                <button
                  type="button"
                  onClick={() => setThumbnailUrl(undefined)}
                  className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 transition cursor-pointer"
                >
                  Supprimer la miniature
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Thumbnail preview box */}
              <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden bg-white dark:bg-slate-800 shrink-0 shadow-xs relative group">
                {thumbnailUrl ? (
                  <img 
                    src={thumbnailUrl} 
                    alt="Aperçu miniature" 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="text-center p-1 text-slate-400 dark:text-slate-500">
                    <ImageIcon className="w-6 h-6 mx-auto mb-0.5 opacity-60" />
                    <span className="text-[10px] block leading-tight">Aucun aperçu</span>
                  </div>
                )}
              </div>

              {/* Selection controls */}
              <div className="flex-1 space-y-2 w-full">
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={thumbInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailUpload}
                    className="hidden"
                    id="thumbnail-file-input"
                  />
                  <button
                    type="button"
                    onClick={() => thumbInputRef.current?.click()}
                    disabled={isUploadingThumb}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-blue-600" />
                    <span>{isUploadingThumb ? 'Compression...' : 'Importer une photo'}</span>
                  </button>

                  <span className="text-[11px] text-slate-400">ou choisir un thème :</span>
                </div>

                {/* Preset badges */}
                <div className="flex flex-wrap gap-1.5">
                  {THUMBNAIL_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPresetThumbnail(preset)}
                      className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-400 text-[11px] flex items-center gap-1 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                      title={preset.label}
                    >
                      <span>{preset.icon}</span>
                      <span>{preset.label.split('/')[0].trim()}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* FICHIERS JOINTS (5 MO MAX PAR FICHIER, 5 FICHIERS MAX) */}
          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Fichiers joints ({files.length} / {MAX_FILES_COUNT})
                </span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Max 5 Mo / fichier • 5 fichiers max
              </span>
            </div>

            {/* Error banner */}
            {fileError && (
              <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start gap-2 text-xs text-red-700 dark:text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{fileError}</span>
              </div>
            )}

            {/* Upload trigger button */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={(e) => handleFileSelection(e.target.files)}
              className="hidden"
              id="assignment-file-input"
            />

            {files.length < MAX_FILES_COUNT && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingFiles}
                className="w-full py-3 px-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 bg-white dark:bg-slate-800/80 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-2 transition cursor-pointer hover:bg-blue-50/40 dark:hover:bg-blue-950/20"
              >
                <Upload className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>
                  {isUploadingFiles ? 'Ajout en cours...' : 'Ajouter des documents, énoncés, scans ou photos (max 5 Mo)'}
                </span>
              </button>
            )}

            {/* Files list */}
            {files.length > 0 && (
              <div className="space-y-2 mt-2">
                {files.map((file) => {
                  const isImg = file.type.startsWith('image/');
                  return (
                    <div 
                      key={file.id} 
                      className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700/60 flex items-center justify-center shrink-0">
                          {getFileIcon(file.type)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {file.name}
                          </p>
                          <span className="text-[10px] text-slate-400">
                            {formatFileSize(file.size)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isImg && (
                          <button
                            type="button"
                            onClick={() => file.dataUrl && setThumbnailUrl(file.dataUrl)}
                            className="px-2 py-1 rounded-md text-[10px] font-medium bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition cursor-pointer"
                            title="Utiliser cette image comme miniature du rappel"
                          >
                            Miniature
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(file.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                          title="Supprimer ce fichier"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Temps estimé */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="estimated-minutes" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5 inline mr-1 text-slate-500 dark:text-slate-400" />
                Temps estimé : {estimatedMinutes} minutes
              </label>
              <span className="text-xs text-slate-400">
                {estimatedMinutes >= 60 ? `${Math.floor(estimatedMinutes / 60)}h${estimatedMinutes % 60 ? `${estimatedMinutes % 60}m` : ''}` : ''}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="estimated-minutes"
                type="range"
                min="10"
                max="180"
                step="5"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                className="flex-1 accent-blue-600 cursor-pointer"
              />
              <div className="flex gap-1 text-[11px]">
                {[15, 30, 45, 60, 90].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setEstimatedMinutes(mins)}
                    className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Consignes & Notes */}
          <div>
            <label htmlFor="assignment-description" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Consignes, pages du manuel ou détails
            </label>
            <textarea
              id="assignment-description"
              rows={2}
              placeholder="Ex: Rendre sur feuille double au propre. Ne pas oublier le schéma à l'encre..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs leading-relaxed"
            />
          </div>

          {/* Actions button */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              id="submit-assignment-btn"
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition cursor-pointer active:scale-98 flex items-center gap-2"
            >
              {isSubmitting ? (
                <span>Enregistrement...</span>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>{assignmentToEdit ? 'Mettre à jour' : 'Ajouter à l\'agenda'}</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
