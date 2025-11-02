
export type PhotoStatus = 'pending' | 'processing' | 'done' | 'error';

export type AITool = 'one-tap' | 'cinematic' | 'vintage' | 'vibrant' | 'soft-glow' | 'remove-object' | 'custom';

export interface Photo {
  id: string;
  file: File;
  originalUrl: string;
  editedUrl?: string;
  status: PhotoStatus;
}
