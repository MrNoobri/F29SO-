import React, { useState } from "react";
import { useNavigate } from "react-router";
import {
  User,
  HeartPulse,
  ShieldCheck,
  Lock,
  Mail,
  Phone,
  Shield,
  Save,
  Eye,
  EyeOff,
  Trash2,
  Download,
  CheckCircle,
  AlertTriangle,
  X,
  Plus,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { authAPI } from "../api";
import DashboardDock from "../components/patient/DashboardDock";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ExportModal from "../components/export/ExportModal";

// ─── helpers ────────────────────────────────────────────────────────────────

const TABS = [
  { id: "personal",    label: "Personal Info",      icon: User },
  { id: "medical",     label: "Medical",             icon: HeartPulse,  patientOnly: true },
  { id: "privacy",     label: "Privacy & Sharing",   icon: ShieldCheck },
  { id: "security",    label: "Security",            icon: Lock },
];

const INPUT =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/50 disabled:opacity-50";

const LABEL = "text-sm font-medium text-muted-foreground mb-1.5 block";

// ─── sub-components ─────────────────────────────────────────────────────────

function TagInput({ values = [], onChange, placeholder }) {
  const [input, setInput] = useState("");

  const add = () => {
    const v = input.trim();
    if (v && !values.includes(v)) onChange([...values, v]);
    setInput("");
  };

  const remove = (idx) => onChange(values.filter((_, i) => i !== idx));

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder={placeholder}
          className={INPUT}
        />
        <Button type="button" size="sm" variant="outline" onClick={add}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {values.map((v, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-primary/10 text-primary border border-primary/20"
            >
              {v}
              <button type="button" onClick={() => remove(i)}>
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── tabs ────────────────────────────────────────────────────────────────────

function PersonalTab({ user, onSaved }) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    firstName:   user?.profile?.firstName  || "",
    lastName:    user?.profile?.lastName   || "",
    phone:       user?.profile?.phone      || "",
    dateOfBirth: user?.profile?.dateOfBirth
      ? new Date(user.profile.dateOfBirth).toISOString().split("T")[0]
      : "",
    gender:      user?.profile?.gender     || "",
    street:      user?.profile?.address?.street  || "",
    city:        user?.profile?.address?.city    || "",
    state:       user?.profile?.address?.state   || "",
    zipCode:     user?.profile?.address?.zipCode || "",
    country:     user?.profile?.address?.country || "",
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await authAPI.updateProfile({
        profile: {
          firstName:   form.firstName,
          lastName:    form.lastName,
          phone:       form.phone,
          dateOfBirth: form.dateOfBirth || undefined,
          gender:      form.gender      || undefined,
          address: {
            street:  form.street,
            city:    form.city,
            state:   form.state,
            zipCode: form.zipCode,
            country: form.country,
          },
        },
      });
      onSaved(res.data.data.user);
      toast.success("Personal info saved");
    } catch {
      toast.error("Failed to save personal info");
    } finally {
      setSaving(false);
    }
  };

  const dob = user?.profile?.dateOfBirth
    ? new Date(user.profile.dateOfBirth)
    : null;
  const age = dob
    ? Math.floor((Date.now() - dob) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  return (
    <div className="space-y-6">
      {/* Read-only identity row */}
      <Card>
        <CardContent className="p-5 flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-xl font-bold ring-4 ring-primary/20 shrink-0">
            {`${(form.firstName || "U")[0]}${(form.lastName || "")[0] || ""}`.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-foreground text-lg">
              {form.firstName} {form.lastName}
            </p>
            <div className="flex flex-wrap gap-2 mt-1">
              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 capitalize">
                <Shield className="w-3 h-3" />
                {user?.role || "patient"}
              </span>
              {user?.isEmailVerified && (
                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  <CheckCircle className="w-3 h-3" />
                  Verified
                </span>
              )}
              {age !== null && (
                <span className="text-xs text-muted-foreground">Age {age}</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Editable fields */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personal Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>First Name</label>
              <input className={INPUT} value={form.firstName} onChange={set("firstName")} />
            </div>
            <div>
              <label className={LABEL}>Last Name</label>
              <input className={INPUT} value={form.lastName} onChange={set("lastName")} />
            </div>
          </div>

          <div>
            <label className={LABEL}>
              <Mail className="w-3.5 h-3.5 inline mr-1.5" />
              Email
            </label>
            <p className="text-foreground font-medium text-sm">{user?.email}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>
                <Phone className="w-3.5 h-3.5 inline mr-1.5" />
                Phone
              </label>
              <input type="tel" className={INPUT} value={form.phone} onChange={set("phone")} placeholder="+971 50 000 0000" />
            </div>
            <div>
              <label className={LABEL}>Date of Birth</label>
              <input type="date" className={INPUT} value={form.dateOfBirth} onChange={set("dateOfBirth")} />
            </div>
          </div>

          <div>
            <label className={LABEL}>Gender</label>
            <select className={INPUT} value={form.gender} onChange={set("gender")}>
              <option value="">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Non-binary / Other</option>
              <option value="prefer-not-to-say">Prefer not to say</option>
            </select>
          </div>

          <div>
            <label className={LABEL}>Street Address</label>
            <input className={INPUT} value={form.street} onChange={set("street")} placeholder="123 Main St" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>City</label>
              <input className={INPUT} value={form.city} onChange={set("city")} placeholder="Dubai" />
            </div>
            <div>
              <label className={LABEL}>State / Emirate</label>
              <input className={INPUT} value={form.state} onChange={set("state")} placeholder="Dubai" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Postal Code</label>
              <input className={INPUT} value={form.zipCode} onChange={set("zipCode")} />
            </div>
            <div>
              <label className={LABEL}>Country</label>
              <input className={INPUT} value={form.country} onChange={set("country")} placeholder="UAE" />
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="w-4 h-4" />
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function MedicalTab({ user, onSaved }) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [form, setForm] = useState({
    emergencyName:     user?.patientInfo?.emergencyContact?.name         || "",
    emergencyRelation: user?.patientInfo?.emergencyContact?.relationship || "",
    emergencyPhone:    user?.patientInfo?.emergencyContact?.phone        || "",
    bloodType:         user?.patientInfo?.bloodType                      || "",
    allergies:         user?.patientInfo?.allergies                      || [],
    medications:       user?.patientInfo?.medications                    || [],
    medicalHistory:    user?.patientInfo?.medicalHistory                 || [],
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setArr = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await authAPI.updateProfile({
        patientInfo: {
          emergencyContact: {
            name:         form.emergencyName,
            relationship: form.emergencyRelation,
            phone:        form.emergencyPhone,
          },
          bloodType:      form.bloodType     || undefined,
          allergies:      form.allergies,
          medications:    form.medications,
          medicalHistory: form.medicalHistory,
        },
      });
      onSaved(res.data.data.user);
      toast.success("Medical info saved");
    } catch {
      toast.error("Failed to save medical info");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Emergency Contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Name</label>
              <input className={INPUT} value={form.emergencyName} onChange={set("emergencyName")} />
            </div>
            <div>
              <label className={LABEL}>Relationship</label>
              <input className={INPUT} value={form.emergencyRelation} onChange={set("emergencyRelation")} placeholder="e.g. Parent, Spouse" />
            </div>
          </div>
          <div>
            <label className={LABEL}>Phone</label>
            <input type="tel" className={INPUT} value={form.emergencyPhone} onChange={set("emergencyPhone")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Health Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className={LABEL}>Blood Type</label>
            <select className={INPUT} value={form.bloodType} onChange={set("bloodType")}>
              <option value="">Unknown</option>
              {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={LABEL}>Allergies</label>
            <TagInput values={form.allergies} onChange={setArr("allergies")} placeholder="Add allergy and press Enter" />
          </div>

          <div>
            <label className={LABEL}>Current Medications</label>
            <TagInput values={form.medications} onChange={setArr("medications")} placeholder="Add medication and press Enter" />
          </div>

          <div>
            <label className={LABEL}>Medical History</label>
            <TagInput values={form.medicalHistory} onChange={setArr("medicalHistory")} placeholder="Add condition and press Enter" />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="w-4 h-4" />
          {saving ? "Saving…" : "Save Medical Info"}
        </Button>
        <Button variant="outline" onClick={() => setShowExport(true)} className="gap-2">
          <Download className="w-4 h-4" />
          Export Health Data
        </Button>
      </div>

      <ExportModal isOpen={showExport} onClose={() => setShowExport(false)} />
    </div>
  );
}

function PrivacyTab({ user, onSaved }) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [shareData, setShareData] = useState(user?.privacySettings?.shareDataWithProviders ?? true);
  const [allowNotifs, setAllowNotifs] = useState(user?.privacySettings?.allowNotifications ?? true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleSavePrivacy = async () => {
    try {
      setSaving(true);
      const res = await authAPI.updateProfile({
        privacySettings: {
          shareDataWithProviders: shareData,
          allowNotifications: allowNotifs,
        },
      });
      onSaved(res.data.data.user);
      toast.success("Privacy settings saved");
    } catch {
      toast.error("Failed to save privacy settings");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteInput !== "DELETE") return;
    try {
      setDeleting(true);
      await authAPI.deleteAccount();
      await logout();
      navigate("/login");
    } catch {
      toast.error("Failed to delete account");
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data Sharing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Toggle
            label="Share health data with healthcare providers"
            description="Allows your assigned providers to view your health metrics and records"
            checked={shareData}
            onChange={setShareData}
          />
          <Toggle
            label="Allow notifications from MEDXI"
            description="Receive alerts, appointment reminders, and health updates"
            checked={allowNotifs}
            onChange={setAllowNotifs}
          />
          <Button onClick={handleSavePrivacy} disabled={saving} className="gap-2">
            <Save className="w-4 h-4" />
            {saving ? "Saving…" : "Save Privacy Settings"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your Data</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Download a copy of your health records or request account deletion.
          </p>
          <Button variant="outline" onClick={() => setShowExport(true)} className="gap-2">
            <Download className="w-4 h-4" />
            Download My Data
          </Button>
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base text-destructive flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Deleting your account is permanent. All your data — health records, appointments, and messages — will be removed immediately.
          </p>
          {!showDeleteConfirm ? (
            <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)} className="gap-2">
              <Trash2 className="w-4 h-4" />
              Delete My Account
            </Button>
          ) : (
            <div className="space-y-3 p-4 rounded-lg border border-destructive/30 bg-destructive/5">
              <p className="text-sm font-medium">
                Type <strong>DELETE</strong> to confirm permanent account deletion:
              </p>
              <input
                className={INPUT}
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                placeholder="DELETE"
              />
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  disabled={deleteInput !== "DELETE" || deleting}
                  onClick={handleDeleteAccount}
                  className="gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  {deleting ? "Deleting…" : "Confirm Delete"}
                </Button>
                <Button variant="outline" onClick={() => { setShowDeleteConfirm(false); setDeleteInput(""); }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <ExportModal isOpen={showExport} onClose={() => setShowExport(false)} />
    </div>
  );
}

function Toggle({ label, description, checked, onChange }) {
  return (
    <div className="flex items-start gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 shrink-0 w-10 h-5.5 rounded-full transition-colors ${checked ? "bg-primary" : "bg-muted"}`}
        style={{ height: "22px", width: "40px" }}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-[18px]" : "translate-x-0"}`}
        />
      </button>
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
    </div>
  );
}

function SecurityTab() {
  const toast = useToast();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [showCurrent, setShowCurrent]     = useState(false);
  const [showNew, setShowNew]             = useState(false);
  const [showConfirm, setShowConfirm]     = useState(false);
  const [saving, setSaving]               = useState(false);
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleChangePassword = async () => {
    if (form.newPassword !== form.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    try {
      setSaving(true);
      await authAPI.changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      toast.success("Password changed — please log in again");
      await logout();
      navigate("/login");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to change password");
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Change Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className={LABEL}>Current Password</label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                className={INPUT + " pr-10"}
                value={form.currentPassword}
                onChange={set("currentPassword")}
              />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className={LABEL}>New Password</label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                className={INPUT + " pr-10"}
                value={form.newPassword}
                onChange={set("newPassword")}
              />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Min 8 chars, one uppercase, one number</p>
          </div>
          <div>
            <label className={LABEL}>Confirm New Password</label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                className={INPUT + " pr-10"}
                value={form.confirmPassword}
                onChange={set("confirmPassword")}
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <Button
            onClick={handleChangePassword}
            disabled={saving || !form.currentPassword || !form.newPassword || !form.confirmPassword}
            className="gap-2"
          >
            <Lock className="w-4 h-4" />
            {saving ? "Updating…" : "Update Password"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base text-muted-foreground">Two-Factor Authentication</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            2FA setup is coming soon. This will add an extra layer of security to your account.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function PreferencesTab({ user, onSaved }) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [theme, setTheme] = useState(user?.uiPreferences?.theme || "midnight");
  const [mode, setMode]   = useState(user?.uiPreferences?.mode  || "light");

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await authAPI.updatePreferences({ theme, mode });
      onSaved(res.data.data.user);
      toast.success("Preferences saved");
    } catch {
      toast.error("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  const themes = [
    { id: "crimson",  label: "Crimson",  color: "bg-red-600" },
    { id: "medical",  label: "Medical",  color: "bg-blue-600" },
    { id: "midnight", label: "Midnight", color: "bg-slate-800" },
    { id: "emerald",  label: "Emerald",  color: "bg-emerald-600" },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className={LABEL}>Theme</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {themes.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    theme === t.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <span className={`w-3 h-3 rounded-full shrink-0 ${t.color}`} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={LABEL}>Mode</label>
            <div className="flex gap-3">
              {["light", "dark"].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors capitalize ${
                    mode === m
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="w-4 h-4" />
            {saving ? "Saving…" : "Save Preferences"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── main page ───────────────────────────────────────────────────────────────

const Profile = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("personal");

  const visibleTabs = TABS.filter((t) => !t.patientOnly || user?.role === "patient");

  const handleSaved = (updatedUser) => {
    updateUser(updatedUser);
  };

  const handleSidebarNav = (tabId) => {
    if (user?.role === "provider") {
      navigate("/provider/dashboard", { state: { tab: tabId } });
      return;
    }

    navigate("/dashboard", { state: { tab: tabId } });
  };

  const renderTab = () => {
    switch (activeTab) {
      case "personal":    return <PersonalTab    user={user} onSaved={handleSaved} />;
      case "medical":     return <MedicalTab     user={user} onSaved={handleSaved} />;
      case "privacy":     return <PrivacyTab     user={user} onSaved={handleSaved} />;
      case "security":    return <SecurityTab />;
      default:            return null;
    }
  };

  return (
    <div className="relative min-h-screen bg-transparent">
      <DashboardDock
        activeTab={null}
        onTabChange={handleSidebarNav}
        role={user?.role || "patient"}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-36 sm:pb-40">
        {/* Page header */}
        <div className="mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Profile</h1>
            <p className="text-muted-foreground mt-1">Manage your account and privacy settings</p>
          </div>
        </div>

        <div className="flex gap-6">
          {/* ── Desktop sidebar ─────────────────────────────────────── */}
          <aside className="hidden lg:flex flex-col gap-1 w-52 shrink-0">
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-colors w-full ${
                    activeTab === tab.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {tab.label}
                </button>
              );
            })}
          </aside>

          {/* ── Mobile top tab bar ──────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            <div className="lg:hidden flex gap-1 overflow-x-auto pb-3 mb-4 scrollbar-none">
              {visibleTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                      activeTab === tab.id
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "text-muted-foreground bg-muted/50 hover:bg-muted"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab content */}
            {renderTab()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
