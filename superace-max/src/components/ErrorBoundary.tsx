import React, { useState, useEffect, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function ErrorBoundary({ children, fallback }: ErrorBoundaryProps) {
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handler = (e: ErrorEvent) => {
      setError(e.error ?? new Error(e.message));
    };
    window.addEventListener('error', handler);
    return () => window.removeEventListener('error', handler);
  }, []);

  useEffect(() => {
    const handler = (e: PromiseRejectionEvent) => {
      setError(e.reason instanceof Error ? e.reason : new Error(String(e.reason)));
    };
    window.addEventListener('unhandledrejection', handler);
    return () => window.removeEventListener('unhandledrejection', handler);
  }, []);

  if (error) {
    if (fallback) return fallback;

    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-[#04070d] text-white p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-red-900/50 border border-red-500/50 flex items-center justify-center mb-4">
          <span className="text-3xl">⚠</span>
        </div>
        <h1 className="text-xl font-bold text-red-400 mb-2 font-['Georgia']">
          Something went wrong
        </h1>
        <p className="text-sm text-zinc-400 mb-6 max-w-sm">
          The game encountered an unexpected error. Your balance is safe on the server.
        </p>
        <button
          onClick={() => { setError(null); window.location.reload(); }}
          className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-yellow-500 text-black font-bold rounded-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer"
        >
          Try Again
        </button>
        <p className="text-[10px] text-zinc-600 mt-4 font-mono">
          {error.message}
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
