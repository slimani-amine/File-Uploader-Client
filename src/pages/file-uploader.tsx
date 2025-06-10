import { Page, Card, Layout, Text, Banner } from "@shopify/polaris";
import { FileQueue } from "@/components/file-queue";
import { useUploadQueue } from "@/hooks/use-upload-queue";
import { UploadDropzone } from "@/components/upload-dropzone";

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
        </Layout.Section>

        <Layout.Section>
          <Card>
            <div style={{ padding: "var(--p-space-400)" }}>
              <UploadDropzone onFilesSelected={addFiles} disabled={isPaused} />
            </div>
          </Card>
        </Layout.Section>

        <Layout.Section>
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
        </Layout.Section>
      </Layout>
    </Page>
  );
}
