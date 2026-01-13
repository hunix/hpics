import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home, Bug, Copy, CheckCircle } from 'lucide-react';
import { ErrorService, CapturedError } from '@/services/ErrorService';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  retryCount?: number;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryAttempts: number;
  isRetrying: boolean;
  capturedError: CapturedError | null;
  copiedRefId: boolean;
}

export class ErrorBoundaryWithRecovery extends Component<Props, State> {
  private retryTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryAttempts: 0,
      isRetrying: false,
      capturedError: null,
      copiedRefId: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
    
    // Capture error with ErrorService for persistence and reference ID
    ErrorService.capture(error, {
      component: errorInfo.componentStack?.split('\n')[1]?.trim() || 'Unknown',
      action: 'render',
    }).then(capturedError => {
      this.setState({ capturedError });
    });

    // Attempt auto-recovery for transient errors
    if (this.isTransientError(error) && this.state.retryAttempts < (this.props.retryCount || 3)) {
      this.scheduleRetry();
    }
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  isTransientError(error: Error): boolean {
    const transientMessages = [
      'network',
      'fetch',
      'timeout',
      'connection',
      'ECONNREFUSED',
      'ETIMEDOUT',
      'failed to fetch',
      'load failed',
    ];
    
    const errorMessage = error.message.toLowerCase();
    return transientMessages.some(msg => errorMessage.includes(msg));
  }

  scheduleRetry() {
    const delay = Math.min(1000 * Math.pow(2, this.state.retryAttempts), 10000); // Exponential backoff, max 10s
    
    this.setState({ isRetrying: true });
    
    this.retryTimeout = setTimeout(() => {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryAttempts: prevState.retryAttempts + 1,
        isRetrying: false,
      }));
    }, delay);
  }

  handleManualRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryAttempts: 0,
      isRetrying: false,
      capturedError: null,
      copiedRefId: false,
    });
  };

  handleCopyRefId = () => {
    if (this.state.capturedError?.referenceId) {
      navigator.clipboard.writeText(this.state.capturedError.referenceId);
      this.setState({ copiedRefId: true });
      setTimeout(() => this.setState({ copiedRefId: false }), 2000);
    }
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  getErrorType(): 'network' | 'permission' | 'validation' | 'unknown' {
    const error = this.state.error;
    if (!error) return 'unknown';
    
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return 'network';
    }
    if (message.includes('permission') || message.includes('unauthorized') || message.includes('forbidden')) {
      return 'permission';
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return 'validation';
    }
    
    return 'unknown';
  }

  getRecoveryMessage(): { title: string; description: string; canRetry: boolean } {
    const errorType = this.getErrorType();
    
    switch (errorType) {
      case 'network':
        return {
          title: 'Connection Issue',
          description: 'Unable to connect to the server. Please check your internet connection and try again.',
          canRetry: true,
        };
      case 'permission':
        return {
          title: 'Access Denied',
          description: 'You don\'t have permission to access this resource. Please sign in or contact support.',
          canRetry: false,
        };
      case 'validation':
        return {
          title: 'Invalid Data',
          description: 'There was an issue with the data. Please refresh and try again.',
          canRetry: true,
        };
      default:
        return {
          title: 'Something Went Wrong',
          description: 'An unexpected error occurred. Our team has been notified.',
          canRetry: true,
        };
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { title, description, canRetry } = this.getRecoveryMessage();
      const { isRetrying, retryAttempts } = this.state;

      return (
        <div className="min-h-[200px] flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 rounded-full bg-destructive/10 w-fit">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Reference ID for support */}
              {this.state.capturedError?.referenceId && (
                <div className="flex items-center justify-center gap-2 p-2 bg-muted rounded-md">
                  <span className="text-xs text-muted-foreground">Reference ID:</span>
                  <code className="text-xs font-mono font-medium">
                    {this.state.capturedError.referenceId}
                  </code>
                  <button
                    onClick={this.handleCopyRefId}
                    className="p-1 hover:bg-background rounded transition-colors"
                    title="Copy reference ID"
                  >
                    {this.state.copiedRefId ? (
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </button>
                </div>
              )}

              {isRetrying && (
                <div className="text-center text-sm text-muted-foreground">
                  <RefreshCw className="h-4 w-4 animate-spin inline-block mr-2" />
                  Attempting to recover... (Attempt {retryAttempts + 1})
                </div>
              )}

              <div className="flex flex-col gap-2">
                {canRetry && (
                  <Button onClick={this.handleManualRetry} disabled={isRetrying}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
                    Try Again
                  </Button>
                )}
                <Button variant="outline" onClick={this.handleGoHome}>
                  <Home className="h-4 w-4 mr-2" />
                  Go to Dashboard
                </Button>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 text-xs">
                  <summary className="cursor-pointer flex items-center gap-1 text-muted-foreground hover:text-foreground">
                    <Bug className="h-3 w-3" />
                    Technical Details
                  </summary>
                  <pre className="mt-2 p-2 bg-muted rounded text-[10px] overflow-auto max-h-32">
                    {this.state.error.message}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC for wrapping components
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundaryWithRecovery {...errorBoundaryProps}>
        <WrappedComponent {...props} />
      </ErrorBoundaryWithRecovery>
    );
  };
}
