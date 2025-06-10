import React from "react";
import {
  Badge,
  Banner,
  Button,
  Card,
  HorizontalStack,
  Layout,
  ProgressBar,
  Text,
  VerticalStack
} from "@shopify/polaris";
import { QueuedFile, UploadStats } from "../lib/schema";
import { formatFileSize, getFileIcon } from "../lib/upload-utils";
import { MAX_CONCURRENT_UPLOADS } from "../lib/config";

const DeleteIcon = (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M6 8V15C6 16.1046 6.89543 17 8 17H12C13.1046 17 14 16.1046 14 15V8"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9 11V13"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M11 11V13"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M4 6H16"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8 6V5C8 3.89543 8.89543 3 10 3H10C11.1046 3 12 3.89543 12 5V6"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const RefreshIcon = (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M4 4V8H8"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16 16V12H12"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M5.07 14.93C3.21 13.07 3.21 9.93 5.07 8.07C6.93 6.21 10.07 6.21 11.93 8.07L16 12"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const DownloadIcon = (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M10 3V13M10 13L6 9M10 13L14 9M4 17H16"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

interface FileQueueProps {
  queue: QueuedFile[];
  stats: UploadStats;
  isPaused: boolean;
  onRetryFile: (id: string) => void;
  onRemoveFile: (id: string) => void;
  onClearCompleted: () => void;
  onRetryAllFailed: () => void;
  onPauseQueue: () => void;
}

function getStatusBadge(status: QueuedFile["status"]) {
  switch (status) {
    case "uploading":
      return <Badge status="info">Uploading</Badge>;
    case "completed":
      return <Badge status="success">Completed</Badge>;
    case "failed":
      return <Badge status="critical">Failed</Badge>;
    case "retrying":
      return <Badge status="warning">Retrying</Badge>;
    case "queued":
    default:
      return <Badge>Queued</Badge>;
  }
}

function FileItem({
  file,
  onRetry,
  onRemove,
}: {
  file: QueuedFile;
  onRetry: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <Card>
      <div style={{ padding: "var(--p-space-400)" }}>
        <HorizontalStack align="space-between" blockAlign="center">
          <HorizontalStack gap="200">
            <div className="text-2xl">{getFileIcon(file.file.type)}</div>
            <VerticalStack gap="100">
              <Text variant="bodyMd" as="p" fontWeight="bold">
                {file.file.name}
              </Text>
              <Text variant="bodySm" as="p" color="subdued">
                {formatFileSize(file.file.size)}
              </Text>

              {(file.status === "uploading" || file.status === "failed") && (
                <VerticalStack gap="100">
                  <ProgressBar
                    progress={file.progress}
                    color={file.status === "failed" ? "critical" : "primary"}
                    size="small"
                  />
                  {file.status === "failed" && file.error && (
                    <Text variant="bodySm" as="p" color="critical">
                      {file.error}
                    </Text>
                  )}
                </VerticalStack>
              )}

              {file.status === "failed" && (
                <Button
                  plain
                  onClick={() => onRetry(file.id)}
                  icon={RefreshIcon}
                >
                  Retry Upload
                </Button>
              )}
            </VerticalStack>
          </HorizontalStack>

          <HorizontalStack gap="200">
            {getStatusBadge(file.status)}

            {file.retryCount > 0 && <Badge>{`Retry ${file.retryCount}`}</Badge>}

            {file.status === "completed" && file.uploadedFileId && (
              <a
                href={`/api/files/${file.uploadedFileId}/download`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "inline-flex" }}
              >
                <Button plain icon={DownloadIcon} />
              </a>
            )}

            <Button plain onClick={() => onRemove(file.id)} icon={DeleteIcon} />
          </HorizontalStack>
        </HorizontalStack>
      </div>
    </Card>
  );
}

export function FileQueue({
  queue,
  stats,
  isPaused,
  onRetryFile,
  onRemoveFile,
  onClearCompleted,
  onRetryAllFailed,
  onPauseQueue,
}: FileQueueProps) {
  return (
    <VerticalStack gap="400">
      {/* Queue Status Alert */}
      {stats.uploading > 0 && (
        <Banner status="warning">
          <p>
            <strong>Queue Status:</strong> Currently uploading {stats.uploading}{" "}
            of 2 maximum concurrent files.
            {stats.queued > 0 && ` ${stats.queued} files waiting in queue.`}
          </p>
        </Banner>
      )}

      {/* Upload Statistics */}
      <Card>
        <div style={{ padding: "var(--p-space-400)" }}>
          <Layout>
            <Layout.Section>
              <HorizontalStack align="space-evenly">
                <VerticalStack align="center">
                  <Text variant="headingLg" as="h2">
                    {stats.totalFiles}
                  </Text>
                  <Text variant="bodySm" as="p" color="subdued">
                    Total Files
                  </Text>
                </VerticalStack>
                <VerticalStack align="center">
                  <Text variant="headingLg" as="h2">
                    {stats.uploading}
                  </Text>
                  <Text variant="bodySm" as="p" color="subdued">
                    Uploading
                  </Text>
                </VerticalStack>
                <VerticalStack align="center">
                  <Text variant="headingLg" as="h2">
                    {stats.completed}
                  </Text>
                  <Text variant="bodySm" as="p" color="subdued">
                    Completed
                  </Text>
                </VerticalStack>
                <VerticalStack align="center">
                  <Text variant="headingLg" as="h2">
                    {stats.failed}
                  </Text>
                  <Text variant="bodySm" as="p" color="subdued">
                    Failed
                  </Text>
                </VerticalStack>
                <VerticalStack align="center">
                  <Text variant="headingLg" as="h2">
                    {stats.queued}
                  </Text>
                  <Text variant="bodySm" as="p" color="subdued">
                    In Queue
                  </Text>
                </VerticalStack>
              </HorizontalStack>
            </Layout.Section>
          </Layout>
        </div>
      </Card>

      {/* File List */}
      <Card>
        <div style={{ padding: "var(--p-space-400)" }}>
          <VerticalStack gap="200">
            <Text variant="headingMd" as="h2">
              Upload Queue
            </Text>
            <Text variant="bodySm" as="p" color="subdued">
              Files are processed ${MAX_CONCURRENT_UPLOADS} at a time for optimal performance
            </Text>
          </VerticalStack>
        </div>
        <div style={{ padding: "var(--p-space-400)" }}>
          <VerticalStack gap="200">
            {queue.length === 0 ? (
              <Text alignment="center" as="p" color="subdued">
                No files in queue. Drop files above to get started.
              </Text>
            ) : (
              queue.map((file) => (
                <FileItem
                  key={file.id}
                  file={file}
                  onRetry={onRetryFile}
                  onRemove={onRemoveFile}
                />
              ))
            )}
          </VerticalStack>
        </div>
      </Card>

      {/* Action Buttons */}
      {queue.length > 0 && (
        <Card>
          <div style={{ padding: "var(--p-space-400)" }}>
            <HorizontalStack align="start" gap="200">
              <Button primary={isPaused} onClick={onPauseQueue}>
                {isPaused ? "Resume Queue" : "Pause Queue"}
              </Button>

              {stats.completed > 0 && (
                <Button onClick={onClearCompleted}>Clear Completed</Button>
              )}

              {stats.failed > 0 && (
                <Button onClick={onRetryAllFailed}>Retry All Failed</Button>
              )}
            </HorizontalStack>
          </div>
        </Card>
      )}
    </VerticalStack>
  );
}
