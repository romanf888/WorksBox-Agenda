// Service utilitaire pour la gestion des fichiers joints (5 Mo max, 5 fichiers max)
// et optimisation des miniatures pour synchronisation Firestore fluide

import { AttachedFile } from '../types';

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 Mo
export const MAX_FILES_COUNT = 5;

// IndexedDB pour stocker les gros fichiers localement sans saturer la limite de document Firestore (1 Mo)
const DB_NAME = 'AgendaDevoirsFilesDB';
const STORE_NAME = 'files_store';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB non supporté'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveFileLocally(fileId: string, dataUrl: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put({ id: fileId, dataUrl, savedAt: Date.now() });
  } catch (err) {
    console.warn('Impossible de stocker dans IndexedDB:', err);
    try {
      // Fallback sessionStorage / memory
      sessionStorage.setItem(`agenda_file_${fileId}`, dataUrl.slice(0, 1000000));
    } catch {}
  }
}

export async function getFileLocally(fileId: string): Promise<string | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(fileId);
      req.onsuccess = () => resolve(req.result?.dataUrl || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return sessionStorage.getItem(`agenda_file_${fileId}`);
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} Mo`;
}

// Convertit un fichier en DataURL
export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

// Crée une miniature compressée pour synchroniser dans Firestore (< 25 Ko)
export function createOptimizedThumbnail(imageSource: string | File): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      let dataUrl = typeof imageSource === 'string' ? imageSource : await readFileAsDataURL(imageSource);
      
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 220; // 220px max dimension
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        // Background blanc pour éviter transparence noire en JPEG
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Compression JPEG qualité 0.75
        const compressed = canvas.toDataURL('image/jpeg', 0.75);
        resolve(compressed);
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    } catch (e) {
      reject(e);
    }
  });
}

// Miniatures thématiques prêtes à l'emploi avec couleurs scolaires
export interface ThumbnailPreset {
  id: string;
  label: string;
  icon: string;
  color: string;
  gradient: string;
}

export const THUMBNAIL_PRESETS: ThumbnailPreset[] = [
  {
    id: 'preset-maths',
    label: 'Maths / Équations',
    icon: '📐',
    color: '#2563EB',
    gradient: 'from-blue-500 to-indigo-600'
  },
  {
    id: 'preset-francais',
    label: 'Français / Rédaction',
    icon: '📖',
    color: '#D97706',
    gradient: 'from-amber-500 to-orange-600'
  },
  {
    id: 'preset-histoire',
    label: 'Histoire / Géo',
    icon: '🌍',
    color: '#059669',
    gradient: 'from-emerald-500 to-teal-600'
  },
  {
    id: 'preset-science',
    label: 'Sciences / Labo',
    icon: '🧪',
    color: '#7C3AED',
    gradient: 'from-purple-500 to-violet-600'
  },
  {
    id: 'preset-langues',
    label: 'Langues vivantes',
    icon: '🗣️',
    color: '#DB2777',
    gradient: 'from-pink-500 to-rose-600'
  },
  {
    id: 'preset-code',
    label: 'Informatique / NSI',
    icon: '💻',
    color: '#0284C7',
    gradient: 'from-sky-500 to-cyan-600'
  },
  {
    id: 'preset-dm',
    label: 'Devoir Maison (DM)',
    icon: '📝',
    color: '#4F46E5',
    gradient: 'from-indigo-500 to-blue-600'
  },
  {
    id: 'preset-ds',
    label: 'Contrôle / Examen',
    icon: '⏱️',
    color: '#DC2626',
    gradient: 'from-rose-500 to-red-600'
  },
  {
    id: 'preset-lecture',
    label: 'Lecture / Roman',
    icon: '📚',
    color: '#EA580C',
    gradient: 'from-orange-500 to-amber-600'
  }
];

// Génère un aperçu SVG léger sous forme de DataURL pour un preset
export function getPresetThumbnailDataUrl(preset: ThumbnailPreset): string {
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${preset.color}" />
        <stop offset="100%" stop-color="#1E293B" />
      </linearGradient>
    </defs>
    <rect width="200" height="200" rx="28" fill="url(#grad)" />
    <text x="100" y="105" font-size="70" text-anchor="middle" dominant-baseline="central">${preset.icon}</text>
    <text x="100" y="165" font-size="16" font-family="sans-serif" font-weight="bold" fill="#ffffff" text-anchor="middle">${preset.label.split('/')[0].trim()}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
