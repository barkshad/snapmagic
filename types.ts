
export type PhotoStatus = 'pending' | 'processing' | 'done' | 'error';

export type FilterType = 'one-tap' | 'cinematic' | 'vintage' | 'vibrant' | 'soft-glow';

export interface Photo {
  id: string;
  file: File;
  originalUrl: string;
  editedUrl?: string;
  status: PhotoStatus;
}
