import React, { Suspense } from "react";
import { Page, Card, Layout, Text, Banner, Loading } from "@shopify/polaris";
import { FileQueue } from "../components/file-queue";
import { useUploadQueue } from "../hooks/use-upload-queue";
import { UploadDropzone } from "../components/upload-dropzone";
import { ErrorBoundary } from "../components/common/error-boundary";

export default function FileUploader() {
  const {
    queue,
    stats,
    isPaused,
    addFiles,
    removeFile,
    retryFile,
    clearCompleted,
    retryAllFailed,
    pauseQueue,
  } = useUploadQueue();

  return (
    <Page>
      <Layout>
        <Layout.Section>
          <ErrorBoundary>
            <Card>
              <div style={{ padding: "var(--p-space-400)" }}>
                <Text variant="headingLg" as="h1">
                  File Upload Manager
                </Text>
                <Text variant="bodyMd" as="p" color="subdued">
                  Upload multiple files with intelligent queue management
                </Text>
              </div>
            </Card>
          </ErrorBoundary>
        </Layout.Section>

        <Layout.Section>
          <ErrorBoundary>
            <Card>
              <div style={{ padding: "var(--p-space-400)" }}>
                <Suspense fallback={<Loading />}>
                  <UploadDropzone onFilesSelected={addFiles} disabled={isPaused} />
                </Suspense>
              </div>
            </Card>
          </ErrorBoundary>
        </Layout.Section>

        <Layout.Section>
          <ErrorBoundary>
            <Suspense fallback={<Loading />}>
              <FileQueue
                queue={queue}
                stats={stats}
                isPaused={isPaused}
                onRetryFile={retryFile}
                onRemoveFile={removeFile}
                onClearCompleted={clearCompleted}
                onRetryAllFailed={retryAllFailed}
                onPauseQueue={pauseQueue}
              />
            </Suspense>
          </ErrorBoundary>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
