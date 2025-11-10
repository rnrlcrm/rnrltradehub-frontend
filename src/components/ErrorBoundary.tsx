/**
 * Error Boundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import Card from './ui/Card';
import { Button } from './ui/Form';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // You can also log the error to an error reporting service
    // logErrorToService(error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <Card title="Something went wrong">
            <div className="space-y-4">
              <p className="text-red-600">
                An unexpected error occurred. Please try refreshing the page.
              </p>
              
              {this.state.error && (
                <details className="bg-red-50 p-4 rounded border border-red-200">
                  <summary className="cursor-pointer font-medium text-sm text-red-800">
                    Error Details
                  </summary>
                  <div className="mt-2 text-xs text-red-700 font-mono">
                    <p><strong>Error:</strong> {this.state.error.message}</p>
                    {this.state.error.stack && (
                      <pre className="mt-2 overflow-auto max-h-64 text-xs">
                        {this.state.error.stack}
                      </pre>
                    )}
                  </div>
                </details>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={this.handleReset}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Try Again
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800"
                >
                  Refresh Page
                </Button>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

// Functional Error Boundary Fallback Components
export const SettingsErrorFallback: React.FC = () => (
  <Card title="Settings Error">
    <div className="space-y-4">
      <p className="text-red-600">
        Failed to load settings. This could be due to a network issue or server error.
      </p>
      <div className="flex gap-3">
        <Button
          onClick={() => window.location.reload()}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Reload Page
        </Button>
        <Button
          onClick={() => window.location.hash = '#dashboard'}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800"
        >
          Go to Dashboard
        </Button>
      </div>
    </div>
  </Card>
);

export const FormErrorFallback: React.FC = () => (
  <div className="p-4 bg-red-50 border border-red-200 rounded">
    <p className="text-red-600 text-sm">
      Failed to load form. Please try again or contact support if the problem persists.
    </p>
  </div>
);
