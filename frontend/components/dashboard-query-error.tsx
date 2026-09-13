"use client";

import { AlertCircle, Lock, RefreshCw, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardQueryErrorProps {
  title?: string;
  error?: unknown;
  onRetry?: () => void;
  className?: string;
}

export function DashboardQueryError({
  title = "Failed to load data",
  error,
  onRetry,
  className = "",
}: DashboardQueryErrorProps) {
  const errorMessage =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "An unexpected error occurred.";

  const isAuthError =
    errorMessage.toLowerCase().includes("not authenticated") ||
    errorMessage.includes("401") ||
    errorMessage.toLowerCase().includes("session expired") ||
    errorMessage.toLowerCase().includes("invalid or expired token") ||
    errorMessage.includes("Server Components render") ||
    errorMessage.includes("digest");

  const isForbiddenError =
    errorMessage.includes("403") ||
    errorMessage.toLowerCase().includes("forbidden") ||
    errorMessage.toLowerCase().includes("permission denied") ||
    errorMessage.toLowerCase().includes("access denied");

  if (isAuthError) {
    return (
      <div
        className={`p-8 flex flex-col items-center justify-center text-center border rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40 my-6 ${className}`}
      >
        <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-4">
          <LogIn className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-neutral-100 mb-1">
          Authentication Required
        </h3>
        <p className="text-sm text-slate-600 dark:text-neutral-400 max-w-md mb-6">
          Your session may have expired or you are not signed in. Please sign in
          again to access this page.
        </p>
        <div className="flex items-center gap-3">
          {onRetry && (
            <Button
              variant="outline"
              onClick={onRetry}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Try Again
            </Button>
          )}
          <Button
            onClick={() => {
              window.location.href = "/login";
            }}
            className="gap-2 bg-amber-600 hover:bg-amber-700 text-white"
          >
            <LogIn className="w-4 h-4" /> Sign In Again
          </Button>
        </div>
      </div>
    );
  }

  if (isForbiddenError) {
    return (
      <div
        className={`p-8 flex flex-col items-center justify-center text-center border rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/40 my-6 ${className}`}
      >
        <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-4">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-neutral-100 mb-1">
          Access Restricted
        </h3>
        <p className="text-sm text-slate-600 dark:text-neutral-400 max-w-md mb-4">
          You don't have permission to access these records with your current role.
          Contact your administrator if you believe this is an error.
        </p>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Try Again
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`p-8 flex flex-col items-center justify-center text-center border rounded-xl bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-800/40 my-6 ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center text-red-600 dark:text-red-400 mb-4">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-neutral-100 mb-1">
        {title}
      </h3>
      <p className="text-sm text-slate-600 dark:text-neutral-400 max-w-md mb-2">
        {errorMessage}
      </p>
      <p className="text-xs text-slate-400 dark:text-neutral-500 mb-6">
        An error occurred while communicating with the backend API.
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
          <RefreshCw className="w-4 h-4" /> Retry Request
        </Button>
      )}
    </div>
  );
}
