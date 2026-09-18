"use client";

import { Suspense } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { LogoMark } from "@/components/Logo";

function LoginContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [localError, setLocalError] = useState("");
  const [pending, setPending] = useState(false);

  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const authError = searchParams.get("error");
  const configError =
    authError === "Configuration"
      ? "Google login is not configured yet. Add AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET in .env.local — see .env.example."
      : authError
        ? "Sign-in failed. Please try again."
        : "";

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      router.replace(callbackUrl);
    }
  }, [status, session, router, callbackUrl]);

  const error = localError || configError;

  const handleGoogle = async () => {
    setPending(true);
    setLocalError("");
    try {
      await signIn("google", { callbackUrl });
    } catch {
      setLocalError("Sign-in failed. Please try again.");
      setPending(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[13px] text-[var(--muted-foreground)]">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-[400px] border border-[var(--border)] bg-[var(--card)] p-8">
        <div className="flex items-center gap-2.5 mb-6">
          <LogoMark className="h-[26px] w-[26px]" />
          <span className="text-[13.5px] font-semibold tracking-[-0.02em]">
            ResearchOS
          </span>
        </div>

        <h1 className="text-[20px] font-semibold tracking-[-0.02em] leading-tight">
          Sign in to your library
        </h1>
        <p className="mt-2 text-[12.5px] leading-[1.6] text-[var(--muted-foreground)]">
          Each Google account gets a private research workspace. Your papers,
          experiments and datasets are only visible to you.
        </p>

        {error && (
          <div className="mt-4 border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/40 px-3 py-2.5">
            <p className="text-[12px] leading-[1.5] text-[#991B1B] dark:text-red-300">
              {error}
            </p>
          </div>
        )}

        <button
          onClick={handleGoogle}
          disabled={pending}
          className="mt-6 w-full h-10 inline-flex items-center justify-center gap-2.5 border border-[var(--border-strong)] bg-[var(--background)] text-[13px] font-medium hover:border-[var(--foreground)] transition-colors disabled:opacity-60"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.9-.1-1.5-.3-2.3H12v4.5h6.5c-.1 1.1-.8 2.7-2.4 3.8l-.1.1 3.5 2.7.2.1c2.2-2 3.8-5 3.8-8.9z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.8-2.9c-1 .7-2.4 1.2-4.1 1.2-3.1 0-5.8-2.1-6.8-5l-.1.1-3.6 2.8v.1C3.5 21.3 7.5 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.2 14.4c-.2-.7-.4-1.5-.4-2.4s.1-1.7.4-2.4l-.1-.1-3.5-2.7-.1.1C.5 8.7 0 10.3 0 12s.5 3.3 1.5 4.9l3.7-2.5z"
            />
            <path
              fill="#EA4335"
              d="M12 4.7c1.8 0 3 .8 3.7 1.4l3.3-3.2C17.9 1.1 15.2 0 12 0 7.5 0 3.5 2.7 1.5 6.9l3.7 2.9c1-2.9 3.7-5.1 6.8-5.1z"
            />
          </svg>
          {pending ? "Redirecting…" : "Continue with Google"}
        </button>

        <p className="mt-4 text-[11px] leading-[1.5] text-[var(--text-tertiary)]">
          By signing in you agree to keep AI summaries verified against source
          files before citing.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-[13px] text-[var(--muted-foreground)]">Loading…</p>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
