"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import DefaultAvatar from "@/components/DefaultAvatar";
import { resizeImageToDataUrl } from "@/lib/resizeImage";

export default function ProfileView({
  role,
  name,
  initialPhotoUrl,
}: {
  role: "admin" | "student";
  name: string;
  initialPhotoUrl: string | null;
}) {
  const router = useRouter();
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoUrl, setPhotoUrl] = useState(initialPhotoUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError(t("profile.invalidImage"));
      return;
    }

    setError("");
    setUploading(true);
    try {
      const dataUrl = await resizeImageToDataUrl(file);
      const res = await fetch("/api/me/photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoUrl: dataUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("profile.uploadFailed"));
      } else {
        setPhotoUrl(data.photoUrl);
        router.refresh();
      }
    } catch {
      setError(t("profile.uploadFailed"));
    } finally {
      setUploading(false);
    }
  }

  async function handleRemovePhoto() {
    setError("");
    setUploading(true);
    try {
      const res = await fetch("/api/me/photo", { method: "DELETE" });
      if (res.ok) {
        setPhotoUrl(null);
        router.refresh();
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <h1 className="font-display text-2xl text-heading mb-2 text-center">{t("profile.title")}</h1>

      <div className="bg-surface border border-line rounded-lg p-6 text-center space-y-5">
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="relative w-20 h-20 rounded-full overflow-hidden group disabled:opacity-60"
            aria-label={t("profile.changePhoto")}
          >
            {photoUrl ? (
              <Image src={photoUrl} alt={name} fill className="object-cover" unoptimized />
            ) : (
              <DefaultAvatar className="w-full h-full" />
            )}
            <span className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs">
              {t("profile.changePhoto")}
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="flex items-center gap-3 text-xs">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="text-heading font-medium hover:underline disabled:opacity-60"
            >
              {uploading ? t("profile.uploading") : t("profile.changePhoto")}
            </button>
            {photoUrl && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                disabled={uploading}
                className="text-clay hover:underline disabled:opacity-60"
              >
                {t("profile.removePhoto")}
              </button>
            )}
          </div>
          {error && <p className="text-clay text-xs">{error}</p>}
        </div>

        <div>
          <p className="text-ink/60 text-sm">{t("profile.loggedInAs")}</p>
          <p className="text-heading font-medium text-lg mt-1">{name}</p>
          <p className="text-ink/50 text-xs mt-0.5">
            {role === "admin" ? t("login.roleAdmin") : t("login.roleStudent")}
          </p>
        </div>

        <Link
          href={role === "admin" ? "/admin" : "/student"}
          className="block w-full bg-gradient-to-r from-brand-blue to-brand-pink text-white py-2.5 rounded font-medium hover:opacity-90 transition-opacity"
        >
          {role === "admin" ? t("profile.goToAdmin") : t("profile.goToStudent")}
        </Link>

        <button
          onClick={handleLogout}
          className="block w-full border border-line rounded py-2.5 text-sm text-ink/70 hover:bg-paper transition-colors"
        >
          {t("nav.logout")}
        </button>
      </div>
    </div>
  );
}
