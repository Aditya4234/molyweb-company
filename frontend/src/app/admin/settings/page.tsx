"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, Building2, CreditCard, Shield, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getOrganizationSettings, updateOrganizationSettings, changePassword, updateProfile } from "@/lib/api";

export default function SettingsPage() {
  const { user, refreshSession } = useAuth();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [org, setOrg] = useState({
    companyName: "", email: "", phone: "", address: "", city: "", state: "", pincode: "", gstin: "", pan: "", website: "",
  });
  const [profile, setProfile] = useState({ name: "" });
  const [passwords, setPasswords] = useState({ current: "", next: "" });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getOrganizationSettings()
      .then((s) => setOrg({
        companyName: s.companyName || "",
        email: s.email || "",
        phone: s.phone || "",
        address: s.address || "",
        city: s.city || "",
        state: s.state || "",
        pincode: s.pincode || "",
        gstin: s.gstin || "",
        pan: s.pan || "",
        website: s.website || "",
      }))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (user?.name) setProfile({ name: user.name });
  }, [user]);

  const handleSaveOrg = async () => {
    try {
      await updateOrganizationSettings(org);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile({ name: profile.name });
      await refreshSession();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleChangePassword = async () => {
    try {
      await changePassword(passwords.current, passwords.next);
      setPasswords({ current: "", next: "" });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      setError(e.message);
    }
  };

  if (loading) return <div className="p-8 text-gray-500">Loading settings...</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 lg:p-8 min-w-0">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your account and organization settings</p>
      </motion.div>

      {error && <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      <div className="space-y-6 max-w-2xl">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><User size={20} /></div>
            <div><h2 className="text-lg font-semibold text-gray-900">Profile</h2><p className="text-sm text-gray-500">{user?.email}</p></div>
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">Display Name</label>
              <input type="text" value={profile.name} onChange={(e) => setProfile({ name: e.target.value })} className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100" />
            </div>
            <button onClick={handleSaveProfile} className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">Save Profile</button>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600"><Building2 size={20} /></div>
            <div><h2 className="text-lg font-semibold text-gray-900">Organization</h2><p className="text-sm text-gray-500">Company details used on invoices</p></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {(["companyName", "email", "phone", "website", "address", "city", "state", "pincode"] as const).map((key) => (
              <div key={key} className={`space-y-1.5 ${key === "address" ? "sm:col-span-2" : ""}`}>
                <label className="text-sm font-medium text-gray-700 capitalize">{key.replace(/([A-Z])/g, " $1")}</label>
                <input type="text" value={org[key]} onChange={(e) => setOrg((p) => ({ ...p, [key]: e.target.value }))} className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100" />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"><CreditCard size={20} /></div>
            <div><h2 className="text-lg font-semibold text-gray-900">Tax & Finance</h2></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">GSTIN</label><input type="text" value={org.gstin} onChange={(e) => setOrg((p) => ({ ...p, gstin: e.target.value }))} className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100" /></div>
            <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">PAN</label><input type="text" value={org.pan} onChange={(e) => setOrg((p) => ({ ...p, pan: e.target.value }))} className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100" /></div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600"><Shield size={20} /></div>
            <div><h2 className="text-lg font-semibold text-gray-900">Security</h2></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">Current Password</label><input type="password" value={passwords.current} onChange={(e) => setPasswords((p) => ({ ...p, current: e.target.value }))} className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100" /></div>
            <div className="space-y-1.5"><label className="text-sm font-medium text-gray-700">New Password</label><input type="password" value={passwords.next} onChange={(e) => setPasswords((p) => ({ ...p, next: e.target.value }))} className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100" /></div>
          </div>
          <button onClick={handleChangePassword} className="mt-4 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Change Password</button>
        </div>

        <div className="flex justify-end">
          <button onClick={handleSaveOrg} className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition">
            <Save size={18} /> {saved ? "Saved!" : "Save Settings"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
