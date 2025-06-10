export type FileUploadStatus =
  | "queued"
  | "uploading"
  | "completed"
  | "failed"
  | "retrying";

export interface QueuedFile {
  id: string;
  file: File;
  status: FileUploadStatus;
  progress: number;
  retryCount: number;
  error?: string;
  uploadedFileId?: string;
}

export interface UploadStats {
  totalFiles: number;
  uploading: number;
  completed: number;
  failed: number;
  queued: number;
}
