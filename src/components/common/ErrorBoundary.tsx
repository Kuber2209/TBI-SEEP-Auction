'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
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
    console.error('Uncaught error in UI component:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[260px] p-6 rounded-xl bg-[#f9f8f6] border border-red-200 flex flex-col items-center justify-center text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-lg bg-red-50 border border-red-200 text-red-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#33404f]">
              {this.props.fallbackTitle || 'A Component Rendering Error Occurred'}
            </h3>
            <p className="text-xs text-[#6b7a8d] max-w-sm mt-1">
              {this.state.error?.message || 'The system caught an unexpected exception and preserved application state.'}
            </p>
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 rounded-md bg-[#1a5c3e] hover:bg-[#154c33] text-xs font-semibold text-white flex items-center gap-2 transition shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Component State</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
