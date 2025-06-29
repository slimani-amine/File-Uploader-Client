import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import config from "../config/env";
import { FileUploadStatus, QueuedFile, UploadStats } from "../lib/schema";
import { calculateBackoffDelay, sleep } from "../lib/upload-utils";

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

export function useUploadQueue() {
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const activeUploads = useRef<Set<string>>(new Set());
  const queryClient = useQueryClient();

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

        xhr.open("POST", `${config.apiUrl}/api/upload`);
        xhr.withCredentials = true; // Enable credentials
        xhr.timeout = 300000; // 5 minutes timeout
        xhr.send(formData);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
    },
  });

  const addFiles = useCallback((files: File[]) => {
    const newQueuedFiles: QueuedFile[] = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      status: "queued" as FileUploadStatus,
      progress: 0,
      retryCount: 0,
    }));

    setQueue((prev) => [...prev, ...newQueuedFiles]);
  }, []);

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

      if (file.retryCount >= config.maxRetryAttempts) {
        console.error(`${file.file.name} has reached maximum retry attempts`);
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
    [queue, updateFileStatus]
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
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Upload failed";

        updateFileStatus(id, {
          status: "failed",
          error: errorMessage,
          progress: 0,
        });

        console.error(`${file.name}: ${errorMessage}`);

        if (queuedFile.retryCount < config.maxRetryAttempts) {
          setTimeout(
            () => retryFile(id),
            calculateBackoffDelay(queuedFile.retryCount)
          );
        }
      } finally {
        activeUploads.current.delete(id);
      }
    },
    [uploadMutation, updateFileStatus, retryFile]
  );

  const processQueue = useCallback(async () => {
    if (isPaused) return;

    const queuedFiles = queue.filter((f) => f.status === "queued");
    const activeCount = activeUploads.current.size;
    const availableSlots = config.maxConcurrentUploads - activeCount;

    if (availableSlots > 0 && queuedFiles.length > 0) {
      const filesToUpload = queuedFiles.slice(0, availableSlots);
      filesToUpload.forEach((file) => uploadFile(file));
    }
  }, [queue, isPaused, uploadFile]);

  const clearCompleted = useCallback(() => {
    setQueue((prev) => prev.filter((file) => file.status !== "completed"));
  }, []);

  const retryAllFailed = useCallback(() => {
    const failedFiles = queue.filter((f) => f.status === "failed");
    failedFiles.forEach((file) => {
      if (file.retryCount < config.maxRetryAttempts) {
        retryFile(file.id);
      }
    });
  }, [queue, retryFile]);

  const pauseQueue = useCallback(() => {
    setIsPaused(true);
  }, []);

  const resumeQueue = useCallback(() => {
    setIsPaused(false);
  }, []);

  useEffect(() => {
    processQueue();
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
    resumeQueue,
    isUploading: uploadMutation.isPending,
  };
}
