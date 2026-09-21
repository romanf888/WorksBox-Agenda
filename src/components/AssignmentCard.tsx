import React, { useState } from 'react';
import { 
  Check, 
  Clock, 
  Calendar, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  Edit3, 
  Trash2, 
  Bell,
  CheckCircle2,
  FileText,
  Paperclip,
  Download,
  ExternalLink,
  Eye,
  FileCode,
  FileArchive,
  FileSpreadsheet,
  Image as ImageIcon,
  X
} from 'lucide-react';
import { Assignment, ASSIGNMENT_TYPE_LABELS, PRIORITY_LABELS, AttachedFile } from '../types';
import { useAgenda } from '../context/AgendaContext';
import { formatDateFrench, getDeadlineCountdown } from '../utils/dateUtils';
import { formatFileSize } from '../services/fileStorage';

interface AssignmentCardProps {
  assignment: Assignment;
  onEdit: (assignment: Assignment) => void;
}

export const AssignmentCard: React.FC<AssignmentCardProps> = ({ assignment, onEdit }) => {
  const { subjects, toggleCompleteAssignment, deleteAssignment } = useAgenda();
  const [expanded, setExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const subject = subjects.find(s => s.id === assignment.subjectId) || {
    id: 'autre',
    name: 'Autre',
    color: '#6B7280',
    bgClass: 'bg-gray-100 text-gray-700 border-gray-200',
    textClass: 'text-gray-700',
    borderClass: 'border-gray-300',
    iconName: 'GraduationCap'
  };

  const typeInfo = ASSIGNMENT_TYPE_LABELS[assignment.type] || ASSIGNMENT_TYPE_LABELS.other;
  const priorityInfo = PRIORITY_LABELS[assignment.priority] || PRIORITY_LABELS.normal;
  const countdown = getDeadlineCountdown(assignment.dueDate);
  const isCompleted = assignment.status === 'completed';

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Supprimer définitivement le devoir "${assignment.title}" ?`)) {
      setIsDeleting(true);
      await deleteAssignment(assignment.id);
    }
  };

  const reminderLabel: Record<string, string> = {
    daily_before_deadline: '🔔 Chaque jour avant le jour J',
    at_deadline: 'À l\'échéance',
    '1_hour_before': '1h avant',
    '3_hours_before': '3h avant',
    '1_day_before': '1j avant',
    '2_days_before': '2j avant',
    none: 'Aucun'
  };

  const hasFiles = assignment.files && assignment.files.length > 0;
  const hasThumbnail = Boolean(assignment.thumbnailUrl);

  const getFileIcon = (mime: string) => {
    if (mime.startsWith('image/')) return <ImageIcon className="w-3.5 h-3.5 text-blue-500" />;
    if (mime.includes('pdf')) return <FileText className="w-3.5 h-3.5 text-red-500" />;
    if (mime.includes('zip') || mime.includes('rar') || mime.includes('tar')) return <FileArchive className="w-3.5 h-3.5 text-amber-500" />;
    if (mime.includes('code') || mime.includes('javascript') || mime.includes('python')) return <FileCode className="w-3.5 h-3.5 text-emerald-500" />;
    if (mime.includes('sheet') || mime.includes('excel')) return <FileSpreadsheet className="w-3.5 h-3.5 text-green-600" />;
    return <FileText className="w-3.5 h-3.5 text-slate-500" />;
  };

  const handleDownloadFile = (file: AttachedFile) => {
    if (!file.dataUrl) return;
    const a = document.createElement('a');
    a.href = file.dataUrl;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div 
      id={`assignment-card-${assignment.id}`}
      className={`relative rounded-2xl border transition-all duration-200 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md ${
        isCompleted 
          ? 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 opacity-85' 
          : countdown.isOverdue 
            ? 'border-red-300 dark:border-red-900/60 bg-red-50/20 dark:bg-red-950/20' 
            : countdown.isUrgent 
              ? 'border-amber-200 dark:border-amber-900/60' 
              : 'border-slate-200 dark:border-slate-800'
      }`}
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3 sm:gap-4">
          {/* Checkbox */}
          <button
            id={`toggle-complete-${assignment.id}`}
            type="button"
            onClick={() => toggleCompleteAssignment(assignment.id)}
            className={`mt-0.5 shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors cursor-pointer ${
              isCompleted 
                ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs' 
                : 'border-slate-300 dark:border-slate-600 hover:border-emerald-500 dark:hover:border-emerald-500 bg-white dark:bg-slate-800'
            }`}
            title={isCompleted ? 'Marquer comme non fait' : 'Marquer comme terminé / rendu'}
            aria-label="Cocher le devoir"
          >
            {isCompleted && <Check className="w-4 h-4 stroke-[3]" />}
          </button>

          {/* Miniature / Aperçu visuel sur la gauche si présent */}
          {hasThumbnail && (
            <div 
              className="shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700/80 bg-slate-100 dark:bg-slate-800 cursor-pointer shadow-xs hover:opacity-90 transition group relative"
              onClick={() => assignment.thumbnailUrl && setPreviewImage(assignment.thumbnailUrl)}
              title="Cliquer pour agrandir la miniature"
            >
              <img 
                src={assignment.thumbnailUrl} 
                alt={`Miniature ${assignment.title}`}
                className="w-full h-full object-cover" 
              />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                <Eye className="w-4 h-4 drop-shadow-md" />
              </div>
            </div>
          )}

          {/* Main info */}
          <div className="flex-1 min-w-0">
            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5">
              {/* Subject badge */}
              <span 
                className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold border ${subject.bgClass}`}
              >
                <span 
                  className="w-2 h-2 rounded-full mr-1.5 shrink-0" 
                  style={{ backgroundColor: subject.color }} 
                />
                {subject.name}
              </span>

              {/* Type badge */}
              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${typeInfo.badge}`}>
                {typeInfo.label}
              </span>

              {/* Priority badge if urgent */}
              {assignment.priority === 'urgent' && !isCompleted && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900">
                  <AlertCircle className="w-3 h-3 mr-1 shrink-0" />
                  Urgent
                </span>
              )}

              {/* Fichiers badge */}
              {hasFiles && (
                <span 
                  className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900"
                  title={`${assignment.files?.length} fichier(s) joint(s)`}
                >
                  <Paperclip className="w-3 h-3 mr-1 shrink-0" />
                  {assignment.files?.length} {assignment.files?.length === 1 ? 'fichier' : 'fichiers'}
                </span>
              )}

              {/* Reminder timing badge */}
              {assignment.reminderTiming && assignment.reminderTiming !== 'none' && (
                <span 
                  className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs border ${
                    assignment.reminderTiming === 'daily_before_deadline'
                      ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900 font-medium'
                      : 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}
                  title={`Rappel configuré : ${reminderLabel[assignment.reminderTiming] || assignment.reminderTiming}`}
                >
                  <Bell className="w-3 h-3 mr-1 shrink-0 text-slate-500 dark:text-slate-400" />
                  {reminderLabel[assignment.reminderTiming] || assignment.reminderTiming}
                </span>
              )}
            </div>

            {/* Title */}
            <h3 
              className={`text-base font-semibold leading-snug break-words ${
                isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'
              }`}
            >
              {assignment.title}
            </h3>

            {/* Timing / Countdown / Due date */}
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              <span className="inline-flex items-center font-medium">
                <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-400 dark:text-slate-500 shrink-0" />
                Rendu : {formatDateFrench(assignment.dueDate)}
              </span>

              {!isCompleted && (
                <span 
                  className={`inline-flex items-center font-semibold px-2 py-0.5 rounded-full ${
                    countdown.isOverdue 
                      ? 'bg-red-100 dark:bg-red-950/70 text-red-700 dark:text-red-300 font-bold' 
                      : countdown.isUrgent 
                        ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Clock className="w-3 h-3 mr-1 shrink-0" />
                  {countdown.text}
                </span>
              )}

              {assignment.estimatedMinutes && assignment.estimatedMinutes > 0 && (
                <span className="inline-flex items-center text-slate-500 dark:text-slate-400">
                  Durée estimée : {assignment.estimatedMinutes} min
                </span>
              )}

              {isCompleted && assignment.completedAt && (
                <span className="inline-flex items-center text-emerald-700 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1 shrink-0" />
                  Terminé
                </span>
              )}
            </div>

            {/* Description & Fichiers joints dépliables */}
            {(assignment.description || hasFiles) && (
              <div className="mt-2.5">
                {expanded ? (
                  <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl text-xs text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800">
                    {assignment.description && (
                      <div>
                        <div className="flex items-center text-slate-500 dark:text-slate-400 font-medium mb-1">
                          <FileText className="w-3.5 h-3.5 mr-1 shrink-0" />
                          Consignes & Notes :
                        </div>
                        <p className="whitespace-pre-wrap leading-relaxed">
                          {assignment.description}
                        </p>
                      </div>
                    )}

                    {/* Fichiers attachés */}
                    {hasFiles && (
                      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                        <div className="flex items-center text-slate-500 dark:text-slate-400 font-medium mb-1.5">
                          <Paperclip className="w-3.5 h-3.5 mr-1 shrink-0" />
                          Documents et pièces jointes ({assignment.files?.length}) :
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {assignment.files?.map((file) => (
                            <div 
                              key={file.id} 
                              className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {getFileIcon(file.type)}
                                <span className="truncate font-medium text-slate-800 dark:text-slate-200" title={file.name}>
                                  {file.name}
                                </span>
                                <span className="text-[10px] text-slate-400 shrink-0">
                                  ({formatFileSize(file.size)})
                                </span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                {file.type.startsWith('image/') && file.dataUrl && (
                                  <button
                                    type="button"
                                    onClick={() => file.dataUrl && setPreviewImage(file.dataUrl)}
                                    className="p-1 rounded text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                                    title="Aperçu image"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleDownloadFile(file)}
                                  className="p-1 rounded text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                                  title="Télécharger"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {assignment.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 italic">
                        "{assignment.description}"
                      </p>
                    )}
                    {hasFiles && !assignment.description && (
                      <span className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        <Paperclip className="w-3 h-3" /> {assignment.files?.length} document(s) joint(s)
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 shrink-0">
            {(assignment.description || hasFiles) && (
              <button
                id={`expand-desc-${assignment.id}`}
                type="button"
                onClick={() => setExpanded(!expanded)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title={expanded ? 'Masquer détails' : 'Voir détails et fichiers'}
                aria-label="Afficher les détails"
              >
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            )}

            <button
              id={`edit-assignment-${assignment.id}`}
              type="button"
              onClick={() => onEdit(assignment)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors cursor-pointer"
              title="Modifier ce devoir"
              aria-label="Modifier le devoir"
            >
              <Edit3 className="w-4 h-4" />
            </button>

            <button
              id={`delete-assignment-${assignment.id}`}
              type="button"
              disabled={isDeleting}
              onClick={handleDelete}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors cursor-pointer"
              title="Supprimer ce devoir"
              aria-label="Supprimer le devoir"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox / Zoom aperçu image ou miniature */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
          onClick={() => setPreviewImage(null)}
        >
          <div 
            className="relative max-w-2xl max-h-[85vh] bg-white dark:bg-slate-900 rounded-2xl overflow-hidden p-2 shadow-2xl border border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition cursor-pointer z-10"
              title="Fermer l'aperçu"
            >
              <X className="w-5 h-5" />
            </button>
            <img 
              src={previewImage} 
              alt="Aperçu agrandi" 
              className="max-w-full max-h-[80vh] object-contain rounded-xl mx-auto" 
            />
          </div>
        </div>
      )}
    </div>
  );
};
