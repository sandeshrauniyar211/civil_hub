// CivilHub brand mark — a precision crosshair / surveyor reticle.
// Designed to feel like an engineering tool logo, not a generic SaaS icon.

import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={cn("h-6 w-6", className)}
      aria-hidden="true"
    >
      {/* Outer ring */}
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.4"
      />
      {/* Inner crosshair */}
      <path
        d="M12 3v4M12 17v4M3 12h4M17 12h4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Diagonal surveyor ticks */}
      <path
        d="M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.6"
      />
      {/* Center dot */}
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-semibold tracking-brand", className)}>
      Civil<span className="text-primary">Hub</span>
    </span>
  );
}

export function BrandCombo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-foreground", className)}>
      <BrandMark className="text-primary" />
      <Wordmark className="text-[15px]" />
    </span>
  );
}
