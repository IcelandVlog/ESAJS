"use client";

import type { ReactNode } from "react";

// Shared look for every control on the login/registration screens: a filled,
// rounded field with a leading icon sitting inside it.
export const authFieldClass =
  "w-full rounded-xl bg-paper dark:bg-white/5 border border-line rounded-xl pl-11 pr-4 py-3 text-sm " +
  "placeholder:text-ink/40 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-400/40 transition";

function FieldIcon({ children }: { children: ReactNode }) {
  return (
    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-ink/40 pointer-events-none">
      {children}
    </span>
  );
}

export function AuthInput({
  icon,
  value,
  onChange,
  placeholder,
  label,
  type = "text",
  required,
}: {
  icon: ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="relative">
      <FieldIcon>{icon}</FieldIcon>
      <input
        type={type}
        required={required}
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? label}
        className={authFieldClass}
      />
    </div>
  );
}

export function AuthSelect({
  icon,
  value,
  onChange,
  label,
  required,
  children,
}: {
  icon: ReactNode;
  value: string;
  onChange: (v: string) => void;
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="relative">
      <FieldIcon>{icon}</FieldIcon>
      <select
        required={required}
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${authFieldClass} appearance-none pr-10`}
      >
        {children}
      </select>
      <span className="absolute inset-y-0 right-0 pr-4 flex items-center text-ink/40 pointer-events-none">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </span>
    </div>
  );
}
