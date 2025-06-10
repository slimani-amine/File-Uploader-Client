import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import FileUploader from "./pages/file-uploader";
import NotFound from "./pages/not-found";
import { AppProvider } from "@shopify/polaris";
import "@shopify/polaris/build/esm/styles.css";
import enTranslations from "@shopify/polaris/locales/en.json";

function Router() {
  return (
    <Switch>
      <Route path="/" component={FileUploader} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AppProvider i18n={enTranslations}>
      <QueryClientProvider client={queryClient}>
        <Router />
      </QueryClientProvider>
    </AppProvider>
  );
}

export default App;
