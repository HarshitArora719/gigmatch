import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    }
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-paper flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-[28px] p-8 border border-border/70 shadow-lg text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-coral/15 text-coral flex items-center justify-center mx-auto shadow-xs">
              <AlertTriangle size={28} />
            </div>

            <div className="space-y-1.5">
              <h2 className="font-display text-2xl font-extrabold text-ink tracking-tight">
                Something went wrong
              </h2>
              <p className="text-xs text-ink/60 font-medium">
                An unexpected application error occurred. We've captured the state for recovery.
              </p>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <div className="p-3.5 rounded-xl bg-soft text-left text-[11px] font-mono text-coral/90 overflow-x-auto max-h-32 border border-border/40">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full sm:w-auto btn-primary !py-2.5 !px-5 !text-xs inline-flex items-center justify-center gap-2"
              >
                <RefreshCw size={14} />
                <span>Reload Page</span>
              </button>
              <button
                onClick={this.handleGoHome}
                className="w-full sm:w-auto btn-secondary !py-2.5 !px-5 !text-xs inline-flex items-center justify-center gap-2"
              >
                <Home size={14} />
                <span>Return Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
