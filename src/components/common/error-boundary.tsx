import React from 'react';
import { Banner, Card, Text } from '@shopify/polaris';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card>
          <div style={{ padding: 'var(--p-space-400)' }}>
            <Banner status="critical">
              <Text variant="headingMd" as="h2">
                Something went wrong
              </Text>
              <Text variant="bodyMd" as="p">
                {this.state.error?.message || 'An unexpected error occurred'}
              </Text>
            </Banner>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
} 