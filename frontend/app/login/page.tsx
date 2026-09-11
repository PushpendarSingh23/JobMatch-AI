"use client";

import { useState } from "react";
import { useAsgardeo } from "@asgardeo/nextjs";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Copy01Icon,
  CheckmarkCircle02Icon,
  ShieldKeyIcon,
  ArrowRight02Icon,
  Login01Icon,
} from "@hugeicons/core-free-icons";

const DEMO_USERNAME = "demo@jobmatch-ai.dev";
const DEMO_PASSWORD = "Demo@123#";

function CredentialRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex items-center justify-between">
      <span className="text-[13px] font-medium text-slate-500">{label}</span>
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-800 cursor-pointer hover:text-teal-600 transition-colors"
      >
        {value}
        <HugeiconsIcon
          icon={copied ? CheckmarkCircle02Icon : Copy01Icon}
          className={`size-4 ${copied ? "text-teal-600" : "text-slate-400"}`}
          strokeWidth={2}
        />
      </button>
    </div>
  );
}

export default function LoginPage() {
  const { signIn } = useAsgardeo();
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    try {
      if (signIn) {
        await signIn();
      }
    } catch (err) {
      console.error("Sign in error:", err);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-svh items-center justify-center p-6 md:p-8 bg-slate-50 relative">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col gap-6">
        <div className="flex flex-col items-center text-center gap-2">
          <div className="p-3.5 bg-teal-50 text-teal-600 rounded-2xl mb-1">
            <HugeiconsIcon icon={ShieldKeyIcon} className="size-8" strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Sign in to JobMatch AI
          </h1>
          <p className="text-xs text-slate-500 max-w-xs">
            AI-powered job matching and recruitment platform authenticated via WSO2 Asgardeo SSO.
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <button
            type="button"
            disabled={loading}
            onClick={handleSignIn}
            className="w-full py-3.5 px-5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-semibold text-sm rounded-2xl transition-all flex items-center justify-center gap-2.5 shadow-md shadow-teal-600/20 cursor-pointer disabled:opacity-50"
          >
            <HugeiconsIcon icon={Login01Icon} className="size-5" />
            <span>{loading ? "Redirecting to Asgardeo..." : "Sign In with Asgardeo"}</span>
            <HugeiconsIcon icon={ArrowRight02Icon} className="size-4 ml-auto" />
          </button>
        </div>

        <div className="border-t border-slate-100 pt-5 flex flex-col gap-3">
          <p className="text-xs font-semibold text-slate-700 flex items-center gap-2">
            <span className="inline-block size-2 rounded-full bg-teal-500" />
            Demo User Credentials
          </p>
          <div className="flex flex-col gap-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
            <CredentialRow label="Username" value={DEMO_USERNAME} />
            <CredentialRow label="Password" value={DEMO_PASSWORD} />
          </div>
        </div>
      </div>
    </div>
  );
}
