import React, { Suspense } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { AppProvider, Loading, Frame } from "@shopify/polaris";
import "@shopify/polaris/build/esm/styles.css";
import enTranslations from "@shopify/polaris/locales/en.json";
import { ErrorBoundary } from "./components/common/error-boundary";

const FileUploader = React.lazy(() => import("./pages/file-uploader"));
const NotFound = React.lazy(() => import("./pages/not-found"));

function Router() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<Loading />}>
        <Switch>
          <Route path="/" component={FileUploader} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppProvider i18n={enTranslations}>
        <QueryClientProvider client={queryClient}>
          <Frame>
            <Router />
          </Frame>
        </QueryClientProvider>
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
