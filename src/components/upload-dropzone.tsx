import { useCallback, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  Text,
  Button,
  VerticalStack,
  HorizontalStack,
  Icon,
} from "@shopify/polaris";
import { UploadMajor } from "@shopify/polaris-icons";

interface UploadDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

export const UploadDropzone = ({
  onFilesSelected,
  disabled = false,
}: UploadDropzoneProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) {
        setIsDragOver(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);
      if (files.length === 0) {
        toast({
          title: "No Files",
          description: "No files were dropped",
          variant: "destructive",
        });
        return;
      }

      // Validate file sizes (500MB limit)
      const maxSize = 500 * 1024 * 1024;
      const oversizedFiles = files.filter((file) => file.size > maxSize);

      if (oversizedFiles.length > 0) {
        toast({
          title: "Files Too Large",
          description: `${oversizedFiles.length} file(s) exceed the 500MB limit`,
          variant: "destructive",
        });
        return;
      }

      onFilesSelected(files);
    },
    [disabled, onFilesSelected, toast]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        onFilesSelected(files);
      }
      // Clear input value to allow selecting the same file again
      e.target.value = "";
    },
    [onFilesSelected]
  );

  const handleClick = useCallback(() => {
    if (!disabled) {
      const input = document.getElementById("file-input") as HTMLInputElement;
      input?.click();
    }
  }, [disabled]);

  return (
    <Card>
      <div
        style={{
          border: `2px dashed ${
            isDragOver && !disabled
              ? "var(--p-color-border-info)"
              : "var(--p-color-border)"
          }`,
          borderRadius: "var(--p-border-radius-200)",
          padding: "var(--p-space-800)",
          textAlign: "center",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
          backgroundColor:
            isDragOver && !disabled
              ? "var(--p-color-bg-info-subdued)"
              : "transparent",
          transition: "all 200ms ease-in-out",
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <VerticalStack gap="400" align="center">
          <div
            style={{
              width: "48px",
              height: "48px",
              color: "var(--p-color-text-subdued)",
            }}
          >
            <Icon source={UploadMajor} />
          </div>

          <VerticalStack gap="200" align="center">
            <Text variant="headingMd" as="h2">
              Drop files here to upload
            </Text>
            <Text variant="bodySm" color="subdued" as="p">
              or click to browse files
            </Text>
          </VerticalStack>

          <Button primary disabled={disabled}>
            Choose Files
          </Button>
        </VerticalStack>

        <input
          id="file-input"
          type="file"
          multiple
          style={{ display: "none" }}
          onChange={handleFileInput}
          disabled={disabled}
        />
      </div>
    </Card>
  );
};
