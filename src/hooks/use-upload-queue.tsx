import { useState, useCallback, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { QueuedFile, FileUploadStatus, UploadStats } from "@shared/schema";
import { sleep, calculateBackoffDelay } from "@/lib/upload-utils";
import { useToast } from "@/hooks/use-toast";

interface UploadResponse {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  createdAt: string;
}

// Configuration from environment variables with fallbacks
const MAX_CONCURRENT_UPLOADS = parseInt(
  import.meta.env.VITE_MAX_CONCURRENT_UPLOADS || "2",
  10
);
const MAX_RETRY_ATTEMPTS = parseInt(
  import.meta.env.VITE_MAX_RETRY_ATTEMPTS || "3",
  10
);

export function useUploadQueue() {
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const activeUploads = useRef<Set<string>>(new Set());
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async ({
      file,
      onProgress,
    }: {
      file: File;
      onProgress: (progress: number) => void;
    }) => {
      const formData = new FormData();
      formData.append("file", file);

      const xhr = new XMLHttpRequest();

      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded * 100) / e.total);
            onProgress(progress);
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (e) {
              reject(new Error("Invalid response format"));
            }
          } else {
            try {
              const errorResponse = JSON.parse(xhr.responseText);
              reject(new Error(errorResponse.error || `HTTP ${xhr.status}`));
            } catch (e) {
              reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
            }
          }
        });

        xhr.addEventListener("error", () => {
          reject(new Error("Network error"));
        });

        xhr.addEventListener("timeout", () => {
          reject(new Error("Upload timeout"));
        });

        xhr.open("POST", "/api/upload");
        xhr.timeout = 300000; // 5 minutes timeout
        xhr.send(formData);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
    },
  });

  const addFiles = useCallback(
    (files: File[]) => {
      const newQueuedFiles: QueuedFile[] = files.map((file) => ({
        id: crypto.randomUUID(),
        file,
        status: "queued" as FileUploadStatus,
        progress: 0,
        retryCount: 0,
      }));

      setQueue((prev) => [...prev, ...newQueuedFiles]);

      toast({
        title: "Files Added",
        description: `${files.length} file(s) added to upload queue`,
        variant: "default",
      });
    },
    [toast]
  );

  const updateFileStatus = useCallback(
    (id: string, updates: Partial<QueuedFile>) => {
      setQueue((prev) =>
        prev.map((file) => (file.id === id ? { ...file, ...updates } : file))
      );
    },
    []
  );

  const removeFile = useCallback((id: string) => {
    setQueue((prev) => prev.filter((file) => file.id !== id));
    activeUploads.current.delete(id);
  }, []);

  const retryFile = useCallback(
    async (id: string) => {
      const file = queue.find((f) => f.id === id);
      if (!file) return;

      if (file.retryCount >= MAX_RETRY_ATTEMPTS) {
        toast({
          title: "Retry Limit Reached",
          description: `${file.file.name} has reached maximum retry attempts`,
          variant: "destructive",
        });
        return;
      }

      updateFileStatus(id, {
        status: "retrying",
        progress: 0,
        error: undefined,
        retryCount: file.retryCount + 1,
      });

      const delay = calculateBackoffDelay(file.retryCount);
      await sleep(delay);

      updateFileStatus(id, { status: "queued" });
    },
    [queue, updateFileStatus, toast]
  );

  const uploadFile = useCallback(
    async (queuedFile: QueuedFile) => {
      const { id, file } = queuedFile;

      activeUploads.current.add(id);
      updateFileStatus(id, { status: "uploading", progress: 0 });

      try {
        const result = (await uploadMutation.mutateAsync({
          file,
          onProgress: (progress) => {
            updateFileStatus(id, { progress });
          },
        })) as UploadResponse;

        updateFileStatus(id, {
          status: "completed",
          progress: 100,
          uploadedFileId: result.id,
        });

        toast({
          title: "Upload Complete",
          description: `${file.name} uploaded successfully`,
          variant: "default",
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Upload failed";

        updateFileStatus(id, {
          status: "failed",
          error: errorMessage,
          progress: 0,
        });

        toast({
          title: "Upload Failed",
          description: `${file.name}: ${errorMessage}`,
          variant: "destructive",
        });

        if (queuedFile.retryCount < MAX_RETRY_ATTEMPTS) {
          setTimeout(
            () => retryFile(id),
            calculateBackoffDelay(queuedFile.retryCount)
          );
        }
      } finally {
        activeUploads.current.delete(id);
      }
    },
    [uploadMutation, updateFileStatus, toast, retryFile]
  );

  const processQueue = useCallback(async () => {
    if (isPaused) return;

    const queuedFiles = queue.filter((f) => f.status === "queued");
    const activeCount = activeUploads.current.size;
    const availableSlots = MAX_CONCURRENT_UPLOADS - activeCount;

    if (availableSlots > 0 && queuedFiles.length > 0) {
      const filesToUpload = queuedFiles.slice(0, availableSlots);
      filesToUpload.forEach((file) => uploadFile(file));
    }
  }, [queue, isPaused, uploadFile]);

  const clearCompleted = useCallback(() => {
    setQueue((prev) => prev.filter((file) => file.status !== "completed"));
    toast({
      title: "Completed Files Cleared",
      description: "All completed uploads have been removed from the queue",
      variant: "default",
    });
  }, [toast]);

  const retryAllFailed = useCallback(() => {
    const failedFiles = queue.filter((f) => f.status === "failed");
    failedFiles.forEach((file) => {
      if (file.retryCount < MAX_RETRY_ATTEMPTS) {
        retryFile(file.id);
      }
    });

    if (failedFiles.length > 0) {
      toast({
        title: "Retrying Failed Uploads",
        description: `Retrying ${failedFiles.length} failed upload(s)`,
        variant: "default",
      });
    }
  }, [queue, retryFile, toast]);

  const pauseQueue = useCallback(() => {
    setIsPaused((prev) => !prev);
    toast({
      title: isPaused ? "Queue Resumed" : "Queue Paused",
      description: isPaused
        ? "Upload queue processing resumed"
        : "Upload queue processing paused",
      variant: "default",
    });
  }, [isPaused, toast]);

  useEffect(() => {
    const interval = setInterval(processQueue, 1000);
    return () => clearInterval(interval);
  }, [processQueue]);

  const stats: UploadStats = {
    totalFiles: queue.length,
    uploading: queue.filter((f) => f.status === "uploading").length,
    completed: queue.filter((f) => f.status === "completed").length,
    failed: queue.filter((f) => f.status === "failed").length,
    queued: queue.filter(
      (f) => f.status === "queued" || f.status === "retrying"
    ).length,
  };

  return {
    queue,
    stats,
    isPaused,
    addFiles,
    removeFile,
    retryFile,
    clearCompleted,
    retryAllFailed,
    pauseQueue,
    isUploading: uploadMutation.isPending,
  };
}
