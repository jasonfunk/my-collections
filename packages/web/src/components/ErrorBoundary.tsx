import React, { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback ?? <DefaultFallback />;
    }
    return this.props.children;
  }
}

function DefaultFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="rounded-lg border bg-card p-8 text-center shadow-sm max-w-md w-full">
        <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
        <p className="text-muted-foreground mb-6 text-sm">
          An unexpected error occurred. Reload the page to try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Reload page
        </button>
      </div>
    </div>
  );
}

export function PageErrorFallback() {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="rounded-lg border bg-card p-6 text-center shadow-sm max-w-sm w-full">
        <h2 className="text-lg font-semibold mb-2">Page error</h2>
        <p className="text-muted-foreground mb-4 text-sm">
          This page encountered an error. You can navigate away using the links below.
        </p>
        <a
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Go to dashboard
        </a>
      </div>
    </div>
  );
}
