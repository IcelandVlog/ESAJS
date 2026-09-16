"use client";

import { useState } from "react";
import { IconLock } from "@/components/icons";
import { authFieldClass } from "@/components/AuthField";

export default function PasswordInput({
  value,
  onChange,
  required,
  placeholder,
  label,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
  label?: string;
  className?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-ink/40 pointer-events-none">
        <IconLock />
      </span>
      <input
        type={visible ? "text" : "password"}
        required={required}
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${authFieldClass} pr-11 ${className}`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-0 flex items-center px-4 text-ink/40 hover:text-ink/70"
      >
        {visible ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a18.5 18.5 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}
