import { Page, Card, Text, VerticalStack } from "@shopify/polaris";

export default function NotFound() {
  return (
    <Page>
      <div
        style={{
          minHeight: "100vh",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "var(--p-color-bg-subdued)",
        }}
      >
        <Card>
          <VerticalStack gap="400">
            <div style={{ display: "flex", gap: "var(--p-space-200)" }}>
              <span
                style={{
                  display: "inline-flex",
                  color: "var(--p-color-text-critical)",
                }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M12 8v4m0 4h.01"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <Text variant="headingLg" as="h1" color="critical">
                404 Page Not Found
              </Text>
            </div>

            <Text variant="bodyMd" as="p" color="subdued">
              Did you forget to add the page to the router?
            </Text>
          </VerticalStack>
        </Card>
      </div>
    </Page>
  );
}
