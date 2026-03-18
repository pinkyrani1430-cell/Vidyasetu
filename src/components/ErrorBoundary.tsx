import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, LogIn } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorInfo: any | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    try {
      // Try to parse the JSON error from Firestore
      const parsed = JSON.parse(error.message);
      return { hasError: true, errorInfo: parsed };
    } catch (e) {
      // Fallback for non-JSON errors
      return { hasError: true, errorInfo: { error: error.message } };
    }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, errorInfo: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      const { errorInfo } = this.state;
      const isPermissionError = errorInfo?.error?.includes('permission-denied') || 
                               errorInfo?.error?.includes('Missing or insufficient permissions');

      return (
        <div className="min-h-screen flex items-center justify-center bg-[#FDFCFB] p-6">
          <div className="max-w-md w-full bg-white p-8 rounded-[2.5rem] border border-[#E5E5E5] shadow-2xl text-center">
            <div className="w-20 h-20 bg-[#FFF5F5] rounded-3xl flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="text-[#FF6B6B]" size={40} />
            </div>
            
            <h2 className="text-2xl font-black text-[#1A1A1A] mb-4">
              {isPermissionError ? 'Access Denied' : 'Something went wrong'}
            </h2>
            
            <p className="text-[#8E8E8E] font-medium mb-8">
              {isPermissionError 
                ? "You don't have permission to perform this action. Please check if you're logged in correctly."
                : errorInfo?.error || "An unexpected error occurred."}
            </p>

            {isPermissionError && !errorInfo?.authInfo?.userId && (
              <div className="mb-6 p-4 bg-[#F5F5F5] rounded-2xl flex items-center gap-3 text-sm font-bold text-[#1A1A1A]">
                <LogIn size={18} className="text-[#FF6B6B]" />
                Please log in to continue
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button 
                onClick={this.handleReset}
                className="w-full py-4 bg-[#1A1A1A] text-white rounded-2xl font-black flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
              >
                <RefreshCw size={20} />
                Try Again
              </button>
              
              {process.env.NODE_ENV === 'development' && (
                <details className="mt-4 text-left">
                  <summary className="text-xs font-bold text-[#8E8E8E] cursor-pointer hover:text-[#1A1A1A]">
                    Technical Details
                  </summary>
                  <pre className="mt-2 p-4 bg-[#F5F5F5] rounded-xl text-[10px] overflow-auto max-h-40">
                    {JSON.stringify(errorInfo, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
