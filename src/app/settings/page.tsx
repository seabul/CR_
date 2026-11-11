"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { toast } from "sonner";

interface SettingsData {
  name: string;
  institution: string;
  department: string;
  batch: string;
  phone: string;
}

const defaults: SettingsData = {
  name: "",
  institution: "Manarat International University",
  department: "Computer Science & Engineering",
  batch: "66",
  phone: "",
};

export default function SettingsPage() {
  const [formData, setFormData] = useState<SettingsData>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then(async (response) => {
        if (!response.ok) throw new Error("Failed to load settings");
        const data = await response.json();
        setFormData({
          name: data.name || "",
          institution: data.institution || defaults.institution,
          department: data.department || defaults.department,
          batch: data.batch || defaults.batch,
          phone: data.phone || "",
        });
      })
      .catch(() => toast.error("Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  const updateField = (field: keyof SettingsData, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save settings");
      }
      toast.success("Settings saved successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Settings
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Configure your university and report information.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-[#0c1322]"
        >
          {(Object.keys(formData) as Array<keyof SettingsData>).map((field) => (
            <label key={field} className="block">
              <span className="mb-1.5 block text-xs font-semibold capitalize text-slate-700 dark:text-slate-300">
                {field === "batch" ? "Batch / Section" : field}
              </span>
              <input
                required={field !== "phone"}
                disabled={loading}
                value={formData[field]}
                onChange={(event) => updateField(field, event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-teal-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-white"
              />
            </label>
          ))}
          <button
            type="submit"
            disabled={loading || saving}
            className="rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-teal-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </form>
      </div>
    </AppShell>
  );
}
