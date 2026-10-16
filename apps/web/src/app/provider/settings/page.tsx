"use client";

import { useEffect, useState } from "react";
import { PASSWORD_REGEX, PHONE_E164_REGEX } from "@service-booking/shared";
import type { UserProfile } from "@service-booking/shared";
import { useAuth } from "../../../lib/auth/AuthContext";
import { useAuthedApi } from "../../../lib/api/useAuthedApi";

// The response may be { data: user }, { data: { user } } or the user itself
function pickUser(json: unknown): UserProfile | null {
  const root = (json ?? {}) as Record<string, unknown>;
  const data = (root.data ?? root) as Record<string, unknown>;
  const candidate = (data.user ?? data) as Record<string, unknown>;
  return candidate && typeof candidate.id === "string" ? (candidate as unknown as UserProfile) : null;
}

export default function SettingsPage() {
  const request = useAuthedApi();
  const { token, setSession } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({});
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMessage, setPwMessage] = useState("");
  const [pwError, setPwError] = useState("");

  function fill(u: UserProfile) {
    setProfile(u);
    setFirstName(u.firstName ?? "");
    setLastName(u.lastName ?? "");
    setPhone(u.phone ?? "");
    setAvatarUrl(u.avatarUrl ?? "");
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const json = await request<unknown>("/api/users/me");
        const u = pickUser(json);
        if (!cancelled && u) fill(u);
        if (!cancelled && !u) setLoadError("Unexpected response from the server");
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : "Could not load your profile");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [request]);

  function validateProfile() {
    const e: Record<string, string> = {};
    if (!firstName.trim()) e.firstName = "First name is required";
    if (!lastName.trim()) e.lastName = "Last name is required";
    if (phone.trim() && !PHONE_E164_REGEX.test(phone.trim())) {
      e.phone = "Use international format, for example +923001234567";
    }
    if (avatarUrl.trim() && !/^https:\/\/\S+$/.test(avatarUrl.trim())) {
      e.avatarUrl = "Photo link must start with https://";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    setSaved(false);
    setSaveError("");
    if (!validateProfile()) return;
    setSaving(true);
    try {
      const json = await request<unknown>("/api/users/me", {
        method: "PATCH",
        body: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
          avatarUrl: avatarUrl.trim(),
        },
      });
      const updated = pickUser(json);
      if (updated) {
        fill(updated);
        // keep the top bar in sync with the new name
        if (token) setSession(token, updated);
      }
      setSaved(true);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Could not save your profile");
    } finally {
      setSaving(false);
    }
  }

  async function handlePassword() {
    setPwMessage("");
    setPwError("");
    const e: Record<string, string> = {};
    if (!currentPassword) e.currentPassword = "Enter your current password";
    if (!PASSWORD_REGEX.test(newPassword)) {
      e.newPassword = "8 to 72 characters with an uppercase letter, a lowercase letter, a number and a symbol";
    } else if (newPassword === currentPassword) {
      e.newPassword = "New password must be different from the current one";
    }
    if (confirmPassword !== newPassword) e.confirmPassword = "Passwords do not match";
    setPwErrors(e);
    if (Object.keys(e).length > 0) return;

    setPwSaving(true);
    try {
      await request("/api/users/me/password", {
        method: "PUT",
        body: { currentPassword, newPassword },
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPwMessage("Password changed. If you are asked to log in again, use the new password.");
    } catch (err) {
      setPwError(err instanceof Error ? err.message : "Could not change your password");
    } finally {
      setPwSaving(false);
    }
  }

  const input = "mt-1 w-full rounded-lg border px-3 py-2 text-sm";
  const err = "mt-1 text-xs text-red-600";
  const details = profile?.providerDetails ?? null;
  const initials = (firstName.trim().charAt(0) || profile?.email?.charAt(0) || "P").toUpperCase();
  const showAvatar = /^https:\/\/\S+$/.test(avatarUrl.trim());

  if (loading) return <div className="text-sm text-gray-500">Loading your profile...</div>;

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Profile Settings</h1>

      {loadError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </div>
      )}

      <div className="space-y-6 rounded-xl border bg-white p-6">
        <div className="flex items-center gap-4">
          {showAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl.trim()} alt="Profile" className="h-20 w-20 rounded-full object-cover" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-500 text-2xl font-semibold text-white">
              {initials}
            </div>
          )}
          <div className="flex-1">
            <label className="text-sm font-medium">Photo link (optional)</label>
            <input
              className={input}
              placeholder="https://..."
              value={avatarUrl}
              onChange={(e) => {
                setSaved(false);
                setAvatarUrl(e.target.value);
              }}
            />
            {errors.avatarUrl && <p className={err}>{errors.avatarUrl}</p>}
            <p className="mt-1 text-xs text-gray-500">Photo upload is not available yet. Paste an https link to an image.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium">First name</label>
            <input className={input} value={firstName} onChange={(e) => { setSaved(false); setFirstName(e.target.value); }} />
            {errors.firstName && <p className={err}>{errors.firstName}</p>}
          </div>
          <div>
            <label className="text-sm font-medium">Last name</label>
            <input className={input} value={lastName} onChange={(e) => { setSaved(false); setLastName(e.target.value); }} />
            {errors.lastName && <p className={err}>{errors.lastName}</p>}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Email</label>
            <input className={`${input} bg-gray-50 text-gray-500`} value={profile?.email ?? ""} disabled />
            <p className="mt-1 text-xs text-gray-500">Email cannot be changed here.</p>
          </div>
          <div>
            <label className="text-sm font-medium">Phone</label>
            <input
              className={input}
              placeholder="+923001234567"
              value={phone}
              onChange={(e) => { setSaved(false); setPhone(e.target.value); }}
            />
            {errors.phone && <p className={err}>{errors.phone}</p>}
          </div>
        </div>

        {saveError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{saveError}</div>
        )}

        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
          {saved && <span className="text-sm text-green-600">Profile saved</span>}
        </div>
      </div>

      <div className="space-y-3 rounded-xl border bg-white p-6">
        <h2 className="font-medium">Business details</h2>
        <p className="text-xs text-gray-500">Shown on your public profile. Editing these is not available yet.</p>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-gray-500">Business name</dt>
            <dd className="font-medium">{details?.businessName || "Not set"}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Service category</dt>
            <dd className="font-medium">{details?.serviceCategory || "Not set"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-gray-500">Bio</dt>
            <dd className="font-medium">{details?.bio || "Not set"}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Rating</dt>
            <dd className="font-medium">
              {details?.rating?.toFixed(1) ?? "0.0"} ({details?.reviewCount ?? 0} reviews)
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Verification</dt>
            <dd className="font-medium">{details?.isVerified ? "Verified" : "Not verified"}</dd>
          </div>
        </dl>
      </div>

      <div className="space-y-4 rounded-xl border bg-white p-6">
        <h2 className="font-medium">Change password</h2>
        <div>
          <label className="text-sm font-medium">Current password</label>
          <input type="password" className={input} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          {pwErrors.currentPassword && <p className={err}>{pwErrors.currentPassword}</p>}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium">New password</label>
            <input type="password" className={input} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            {pwErrors.newPassword && <p className={err}>{pwErrors.newPassword}</p>}
          </div>
          <div>
            <label className="text-sm font-medium">Confirm new password</label>
            <input type="password" className={input} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            {pwErrors.confirmPassword && <p className={err}>{pwErrors.confirmPassword}</p>}
          </div>
        </div>
        {pwError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{pwError}</div>
        )}
        {pwMessage && <p className="text-sm text-green-600">{pwMessage}</p>}
        <button
          onClick={handlePassword}
          disabled={pwSaving}
          className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
        >
          {pwSaving ? "Updating..." : "Update password"}
        </button>
      </div>
    </div>
  );
}