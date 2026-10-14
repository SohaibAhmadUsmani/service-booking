"use client";

import { useEffect, useState } from "react";

type Profile = {
  businessName: string;
  bio: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  serviceRadiusKm: string;
  photoUrl: string;
};

// TODO: load from Muzammil's users/profile API (provider profile)
const initialProfile: Profile = {
  businessName: "Maira's Home Services",
  bio: "Experienced home service provider offering cleaning, AC repair and plumbing.",
  email: "mairaasim06@gmail.com",
  phone: "+92 300 0000000",
  city: "Lahore",
  address: "",
  serviceRadiusKm: "15",
  photoUrl: "",
};

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  // Free the temporary preview URL when it changes or the page closes
  useEffect(() => {
    return () => {
      if (profile.photoUrl.startsWith("blob:")) URL.revokeObjectURL(profile.photoUrl);
    };
  }, [profile.photoUrl]);

  function set<K extends keyof Profile>(key: K, value: Profile[K]) {
    setSaved(false);
    setProfile((p) => ({ ...p, [key]: value }));
  }

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErrors((x) => ({ ...x, photo: "Please choose an image file" }));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setErrors((x) => ({ ...x, photo: "Image must be under 2 MB" }));
      return;
    }
    setErrors((x) => {
      const { photo, ...rest } = x;
      return rest;
    });
    // TODO: upload the file to storage and save the returned URL
    set("photoUrl", URL.createObjectURL(file));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (profile.businessName.trim().length < 3) e.businessName = "Business name must be at least 3 characters";
    if (profile.bio.trim().length < 20) e.bio = "Bio must be at least 20 characters";
    if (!/^\S+@\S+\.\S+$/.test(profile.email)) e.email = "Enter a valid email address";
    if (!/^\+?[0-9\s-]{10,15}$/.test(profile.phone)) e.phone = "Enter a valid phone number";
    if (!profile.city.trim()) e.city = "City is required";
    const radius = Number(profile.serviceRadiusKm);
    if (!profile.serviceRadiusKm || radius < 1 || radius > 100) e.serviceRadiusKm = "Enter a radius between 1 and 100 km";
    setErrors((prev) => ({ ...(prev.photo ? { photo: prev.photo } : {}), ...e }));
    return Object.keys(e).length === 0;
  }

  function handleSave() {
    if (!validate()) {
      setSaved(false);
      return;
    }
    // TODO: PUT to the profile API
    console.log("Profile payload", profile);
    setSaved(true);
  }

  const input = "mt-1 w-full rounded-lg border px-3 py-2 text-sm";
  const err = "mt-1 text-xs text-red-600";
  const initials = profile.businessName.trim().charAt(0).toUpperCase() || "P";

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Profile Settings</h1>

      <div className="space-y-6 rounded-xl border bg-white p-6">
        <div className="flex items-center gap-4">
          {profile.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.photoUrl} alt="Profile" className="h-20 w-20 rounded-full object-cover" />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-500 text-2xl font-semibold text-white">
              {initials}
            </div>
          )}
          <div>
            <label className="cursor-pointer rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50">
              Change photo
              <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            </label>
            {profile.photoUrl && (
              <button
                onClick={() => set("photoUrl", "")}
                className="ml-3 text-sm text-red-600 hover:underline"
              >
                Remove
              </button>
            )}
            {errors.photo && <p className={err}>{errors.photo}</p>}
            <p className="mt-1 text-xs text-gray-500">JPG or PNG, up to 2 MB</p>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Business name</label>
          <input className={input} value={profile.businessName} onChange={(e) => set("businessName", e.target.value)} />
          {errors.businessName && <p className={err}>{errors.businessName}</p>}
        </div>

        <div>
          <label className="text-sm font-medium">Bio</label>
          <textarea className={input} rows={4} value={profile.bio} onChange={(e) => set("bio", e.target.value)} />
          <p className="mt-1 text-xs text-gray-500">{profile.bio.length} characters</p>
          {errors.bio && <p className={err}>{errors.bio}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Email</label>
            <input type="email" className={input} value={profile.email} onChange={(e) => set("email", e.target.value)} />
            {errors.email && <p className={err}>{errors.email}</p>}
          </div>
          <div>
            <label className="text-sm font-medium">Phone</label>
            <input className={input} value={profile.phone} onChange={(e) => set("phone", e.target.value)} />
            {errors.phone && <p className={err}>{errors.phone}</p>}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium">City</label>
            <input className={input} value={profile.city} onChange={(e) => set("city", e.target.value)} />
            {errors.city && <p className={err}>{errors.city}</p>}
          </div>
          <div>
            <label className="text-sm font-medium">Service radius (km)</label>
            <input type="number" className={input} value={profile.serviceRadiusKm} onChange={(e) => set("serviceRadiusKm", e.target.value)} />
            {errors.serviceRadiusKm && <p className={err}>{errors.serviceRadiusKm}</p>}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Address (optional)</label>
          <input className={input} value={profile.address} onChange={(e) => set("address", e.target.value)} />
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Save changes
          </button>
          {saved && <span className="text-sm text-green-600">Profile saved</span>}
        </div>
      </div>
    </div>
  );
}