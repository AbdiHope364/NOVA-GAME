import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught Error in UI:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-lg shadow-2xl flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-rose-400" />
            </div>
            <h1 className="text-2xl font-black text-white">Something went wrong</h1>
            <p className="text-xs text-slate-400 leading-relaxed font-mono bg-slate-950 p-3 rounded-lg border border-slate-800 w-full overflow-x-auto text-left">
              {this.state.error?.message || 'An unexpected runtime error occurred.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-bold rounded-xl shadow-lg hover:brightness-110 transition-all text-sm"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
