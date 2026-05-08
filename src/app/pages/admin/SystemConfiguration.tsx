import { useEffect, useMemo, useState } from "react";
import {
  Settings,
  Server,
  Database,
  Globe,
  Shield,
  Save,
  RefreshCw,
  LoaderCircle,
  CalendarDays,
  Users,
  Grid3x3,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  X,
} from "lucide-react";
import { LoadingState } from "../../components/LoadingState";
import { DashboardPageHeader } from "../../components/DashboardPageHeader";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../../supabase";
import {
  getSystemSettings,
  saveSystemSettings,
} from "../../../services/systemSettingsService";

function getCurrentSchoolYear(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth();

  return month >= 6 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

function normalizeAcademicYear(rawValue) {
  const normalizedValue = String(rawValue || "").trim();
  return /^\d{4}-\d{4}$/.test(normalizedValue) ? normalizedValue : getCurrentSchoolYear();
}

function formatDateLabel(dateValue) {
  if (!dateValue) {
    return "Not set";
  }

  const parsedDate = new Date(dateValue);
  if (Number.isNaN(parsedDate.getTime())) {
    return dateValue;
  }

  return parsedDate.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const CONFIGURATION_FIELD_LABELS = {
  institution_name: "Institution Name",
  system_timezone: "System Timezone",
  academic_year: "Academic Year",
  support_email: "Support Email",
  enrollment_start_date: "Enrollment Start Date",
  enrollment_end_date: "Enrollment End Date",
  default_section_capacity: "Default Section Capacity",
  enrollment_open: "Enrollment Status",
  maintenance_mode: "Maintenance Mode",
};

function formatConfigurationValue(fieldKey, value) {
  if (value === null || value === undefined || value === "") {
    return "Not set";
  }

  if (fieldKey === "enrollment_open") {
    return value ? "Open" : "Closed";
  }

  if (fieldKey === "maintenance_mode") {
    return value ? "Enabled" : "Disabled";
  }

  if (fieldKey === "enrollment_start_date" || fieldKey === "enrollment_end_date") {
    return formatDateLabel(value);
  }

  if (fieldKey === "default_section_capacity") {
    return `${value} students`;
  }

  return String(value);
}

function buildConfigurationChanges(previousSettings, nextSettings) {
  if (!previousSettings || !nextSettings) {
    return [];
  }

  return Object.keys(CONFIGURATION_FIELD_LABELS)
    .filter((fieldKey) => previousSettings[fieldKey] !== nextSettings[fieldKey])
    .map((fieldKey) => ({
      key: fieldKey,
      label: CONFIGURATION_FIELD_LABELS[fieldKey],
      previousValue: formatConfigurationValue(fieldKey, previousSettings[fieldKey]),
      nextValue: formatConfigurationValue(fieldKey, nextSettings[fieldKey]),
    }));
}

function formatLastUpdated(lastUpdatedAt) {
  if (!lastUpdatedAt) {
    return "Not yet saved";
  }

  const parsedDate = new Date(lastUpdatedAt);
  if (Number.isNaN(parsedDate.getTime())) {
    return lastUpdatedAt;
  }

  return parsedDate.toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function normalizeSettingsForCompare(settings) {
  return JSON.stringify(settings || {});
}

function buildValidationErrors(settings) {
  const nextErrors = {};

  if (!String(settings.institution_name || "").trim()) {
    nextErrors.institution_name = "Institution name is required.";
  }

  if (!String(settings.system_timezone || "").trim()) {
    nextErrors.system_timezone = "Timezone is required.";
  }

  if (!/^\d{4}-\d{4}$/.test(String(settings.academic_year || "").trim())) {
    nextErrors.academic_year = "Use the format YYYY-YYYY.";
  }

  const supportEmail = String(settings.support_email || "").trim();
  if (!supportEmail) {
    nextErrors.support_email = "Support email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmail)) {
    nextErrors.support_email = "Use a valid email address.";
  }

  const enrollmentStartDate = new Date(settings.enrollment_start_date);
  const enrollmentEndDate = new Date(settings.enrollment_end_date);
  if (Number.isNaN(enrollmentStartDate.getTime())) {
    nextErrors.enrollment_start_date = "Enrollment start date is required.";
  }
  if (Number.isNaN(enrollmentEndDate.getTime())) {
    nextErrors.enrollment_end_date = "Enrollment end date is required.";
  }
  if (
    !Number.isNaN(enrollmentStartDate.getTime()) &&
    !Number.isNaN(enrollmentEndDate.getTime()) &&
    enrollmentStartDate.getTime() > enrollmentEndDate.getTime()
  ) {
    nextErrors.enrollment_end_date = "Enrollment end date must be on or after the start date.";
  }

  [
    ["default_section_capacity", "Default section capacity"],
  ].forEach(([fieldKey, label]) => {
    const parsedValue = Number(settings[fieldKey]);

    if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
      nextErrors[fieldKey] = `${label} must be greater than zero.`;
    }
  });

  return nextErrors;
}

export function SystemConfiguration() {
  const { userData } = useAuth();
  const [settings, setSettings] = useState(null);
  const [initialSettings, setInitialSettings] = useState(null);
  const [runtimeSummary, setRuntimeSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [source, setSource] = useState("supabase");
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [notice, setNotice] = useState(null);
  const [errors, setErrors] = useState({});
  const [showConfirmSaveModal, setShowConfirmSaveModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastSavedBy, setLastSavedBy] = useState(null);

  const loadRuntimeSummary = async (academicYear) => {
    const currentSchoolYear = normalizeAcademicYear(academicYear);
    const currentUrl = typeof window !== "undefined" ? window.location.origin : "Unavailable";
    const hasSupabaseConfiguration = Boolean(
      import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
    );

    try {
      const [usersResult, enrolledResult, pendingResult, sectionsResult] = await Promise.all([
        supabase.from("users").select("id", { count: "exact", head: true }),
        supabase.from("enrollments").select("id", { count: "exact", head: true }).eq("status", "enrolled"),
        supabase
          .from("enrollments")
          .select("id", { count: "exact", head: true })
          .in("status", ["pending_documents", "pending_review"]),
        supabase.from("sections").select("id", { count: "exact", head: true }).eq("school_year", currentSchoolYear),
      ]);

      const countErrors = [usersResult.error, enrolledResult.error, pendingResult.error, sectionsResult.error].filter(Boolean);
      if (countErrors.length > 0) {
        throw countErrors[0];
      }

      return {
        mode: import.meta.env.PROD ? "Production" : "Development",
        currentUrl,
        hasSupabaseConfiguration,
        connectionStatus: "connected",
        totalUsers: usersResult.count || 0,
        enrolledStudents: enrolledResult.count || 0,
        pendingApplications: pendingResult.count || 0,
        currentYearSections: sectionsResult.count || 0,
        currentSchoolYear,
      };
    } catch (error) {
      return {
        mode: import.meta.env.PROD ? "Production" : "Development",
        currentUrl,
        hasSupabaseConfiguration,
        connectionStatus: "degraded",
        totalUsers: null,
        enrolledStudents: null,
        pendingApplications: null,
        currentYearSections: null,
        currentSchoolYear,
        warning: error?.message || "Unable to load live runtime metrics.",
      };
    }
  };

  const loadConfiguration = async () => {
    setLoading(true);

    const settingsResult = await getSystemSettings();
    const nextRuntimeSummary = await loadRuntimeSummary(settingsResult.data.academic_year);

    setSettings(settingsResult.data);
    setInitialSettings(settingsResult.data);
    setSource(settingsResult.source);
    setLastUpdatedAt(settingsResult.lastUpdatedAt);
    setRuntimeSummary(nextRuntimeSummary);
    setErrors({});

    if (settingsResult.warning) {
      setNotice({ type: "warning", message: settingsResult.warning });
    } else if (nextRuntimeSummary.warning) {
      setNotice({ type: "warning", message: nextRuntimeSummary.warning });
    } else {
      setNotice(null);
    }

    setLoading(false);
  };

  useEffect(() => {
    void loadConfiguration();
  }, []);

  const hasChanges = useMemo(() => {
    return normalizeSettingsForCompare(settings) !== normalizeSettingsForCompare(initialSettings);
  }, [initialSettings, settings]);

  const pendingConfigurationChanges = useMemo(() => {
    return buildConfigurationChanges(initialSettings, settings);
  }, [initialSettings, settings]);

  const runtimeCards = useMemo(() => {
    if (!runtimeSummary || !settings) {
      return [];
    }

    const enrollmentWindow = `${formatDateLabel(settings.enrollment_start_date)} to ${formatDateLabel(
      settings.enrollment_end_date
    )}`;

    return [
      {
        label: "Runtime Mode",
        value: runtimeSummary.mode,
        detail: runtimeSummary.currentUrl,
        icon: Server,
        color: "#1E3A8A",
        bgColor: "#DBEAFE",
      },
      {
        label: "Data Source",
        value: source === "supabase" ? "Supabase Configuration" : "Browser-local Configuration",
        detail:
          source === "supabase"
            ? runtimeSummary.connectionStatus === "connected"
              ? "Configuration and runtime metrics are both using live Supabase data."
              : runtimeSummary.hasSupabaseConfiguration
                ? "Configuration is stored in Supabase, but runtime metrics are partially unavailable."
                : "Configuration is stored remotely, but Supabase environment variables are incomplete."
            : runtimeSummary.connectionStatus === "connected"
              ? "Runtime metrics are live, but configuration changes are currently stored only in this browser."
              : "Both configuration and runtime summary are currently running in fallback mode.",
        icon: Database,
        color: source === "supabase" && runtimeSummary.connectionStatus === "connected" ? "#10B981" : "#F59E0B",
        bgColor: source === "supabase" && runtimeSummary.connectionStatus === "connected" ? "#D1FAE5" : "#FEF3C7",
      },
      {
        label: "Academic Year",
        value: settings.academic_year,
        detail: enrollmentWindow,
        icon: CalendarDays,
        color: "#2563EB",
        bgColor: "#DBEAFE",
      },
      {
        label: "Enrollment Status",
        value: settings.enrollment_open ? "Open" : "Closed",
        detail: `${runtimeSummary.pendingApplications ?? 0} pending applications`,
        icon: Users,
        color: settings.enrollment_open ? "#10B981" : "#EF4444",
        bgColor: settings.enrollment_open ? "#D1FAE5" : "#FEE2E2",
      },
      {
        label: "Enrolled Students",
        value: runtimeSummary.enrolledStudents == null ? "Unavailable" : String(runtimeSummary.enrolledStudents),
        detail: runtimeSummary.totalUsers == null ? "Live user totals unavailable" : `${runtimeSummary.totalUsers} total users`,
        icon: Users,
        color: "#7C3AED",
        bgColor: "#F3E8FF",
      },
      {
        label: "Current School Year Sections",
        value:
          runtimeSummary.currentYearSections == null ? "Unavailable" : String(runtimeSummary.currentYearSections),
        detail: runtimeSummary.currentSchoolYear,
        icon: Grid3x3,
        color: "#0891B2",
        bgColor: "#CFFAFE",
      },
    ];
  }, [runtimeSummary, settings, source]);

  const configurationSections = useMemo(() => {
    if (!settings) {
      return [];
    }

    return [
      {
        title: "General Settings",
        icon: Globe,
        color: "#1E3A8A",
        bgColor: "#DBEAFE",
        description: "Core institution labels and calendar settings used across the branch coordinator experience.",
        fields: [
          { key: "institution_name", label: "Institution Name", type: "text" },
          { key: "system_timezone", label: "System Timezone", type: "select", options: ["Asia/Manila", "UTC", "Asia/Singapore"] },
          { key: "academic_year", label: "Academic Year", type: "text" },
          { key: "support_email", label: "Support Email", type: "email" },
        ],
      },
      {
        title: "Enrollment Controls",
        icon: Settings,
        color: "#10B981",
        bgColor: "#D1FAE5",
        description: "Settings that affect enrollment availability and the application window.",
        fields: [
          { key: "enrollment_start_date", label: "Enrollment Start Date", type: "date" },
          { key: "enrollment_end_date", label: "Enrollment End Date", type: "date" },
          { key: "default_section_capacity", label: "Default Section Capacity", type: "number", min: 1 },
        ],
        toggles: [
          {
            key: "enrollment_open",
            label: "Enrollment Open",
            description: "Allow new students to submit applications and continue the enrollment flow.",
          },
        ],
      },
      {
        title: "Advanced Controls",
        icon: Shield,
        color: "#EF4444",
        bgColor: "#FEE2E2",
        description: "High-impact switches for maintenance and troubleshooting. Apply changes with caution.",
        toggles: [
          {
            key: "maintenance_mode",
            label: "Maintenance Mode",
            description: "Restrict normal user access while maintenance or data fixes are being performed.",
          },
        ],
      },
    ];
  }, [settings]);

  const handleFieldChange = (fieldKey, value) => {
    setSettings((currentSettings) => ({
      ...currentSettings,
      [fieldKey]: value,
    }));

    setErrors((currentErrors) => {
      if (!currentErrors[fieldKey]) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[fieldKey];
      return nextErrors;
    });
  };

  const handleSaveClick = () => {
    const validationErrors = buildValidationErrors(settings || {});
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      setNotice({ type: "error", message: "Please fix the highlighted settings before saving." });
      return;
    }

    if (pendingConfigurationChanges.length === 0) {
      return;
    }

    setNotice(null);
    setShowConfirmSaveModal(true);
  };

  const handleConfirmSave = async () => {
    if (saving) {
      return;
    }

    setShowConfirmSaveModal(false);
    setSaving(true);
    const saveResult = await saveSystemSettings(settings, userData?.id || userData?.email || null);
    setSaving(false);

    setSettings(saveResult.data);
    setInitialSettings(saveResult.data);
    setSource(saveResult.source);
    setLastUpdatedAt(saveResult.lastUpdatedAt);
    setLastSavedBy(userData?.name || userData?.email || "Current user");

    const nextRuntimeSummary = await loadRuntimeSummary(saveResult.data.academic_year);
    setRuntimeSummary(nextRuntimeSummary);

    if (saveResult.warning) {
      setNotice({ type: "warning", message: saveResult.warning });
      return;
    }

    setNotice(null);
    setShowSuccessModal(true);
  };

  if (loading || !settings) {
    return (
      <div className="portal-dashboard-page p-4 sm:p-6 lg:p-8">
        <LoadingState
          message="Checking system configuration..."
          subtext="Loading enrollment, maintenance, and notification settings."
        />
      </div>
    );
  }

  return (
    <div className="portal-dashboard-page p-4 sm:p-6 lg:p-8">
      <DashboardPageHeader
        badge="System Settings"
        title="System Configuration"
        subtitle={`Manage branch-level system settings using live, persisted data. Last updated: ${formatLastUpdated(lastUpdatedAt)}`}
        icon={Settings}
        actions={
          <>
          <button
            type="button"
            onClick={() => void loadConfiguration()}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            type="button"
            onClick={handleSaveClick}
            disabled={saving || !hasChanges}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Configuration
          </button>
          </>
        }
      />

      {notice && (
        <div
          className="mb-6 rounded-lg border px-4 py-3 text-sm"
          style={{
            backgroundColor:
              notice.type === "success" ? "#ECFDF5" : notice.type === "warning" ? "#FFFBEB" : "#FEF2F2",
            borderColor:
              notice.type === "success" ? "#A7F3D0" : notice.type === "warning" ? "#FDE68A" : "#FECACA",
            color:
              notice.type === "success" ? "#065F46" : notice.type === "warning" ? "#92400E" : "#991B1B",
          }}
        >
          <div className="flex items-start gap-2">
            {notice.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 mt-0.5" />
            ) : (
              <AlertTriangle className="h-4 w-4 mt-0.5" />
            )}
            <span>{notice.message}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 mb-6">
        {runtimeCards.map((card) => {
          const CardIcon = card.icon;

          return (
            <div key={card.label} className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-gray-900">{card.value}</p>
                </div>
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-lg"
                  style={{ backgroundColor: card.bgColor }}
                >
                  <CardIcon className="h-5 w-5" style={{ color: card.color }} />
                </div>
              </div>
              <p className="text-sm text-gray-500 leading-6">{card.detail}</p>
            </div>
          );
        })}
      </div>

      <div className="space-y-6">
        {configurationSections.map((section) => {
          const SectionIcon = section.icon;

          return (
            <div key={section.title} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-lg"
                    style={{ backgroundColor: section.bgColor }}
                  >
                    <SectionIcon className="h-6 w-6" style={{ color: section.color }} />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{section.title}</h2>
                    <p className="text-sm text-gray-600 mt-1 max-w-3xl">{section.description}</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {section.fields && section.fields.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {section.fields.map((field) => (
                      <div key={field.key}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {field.label}
                        </label>
                        {field.type === "select" ? (
                          <select
                            value={settings[field.key]}
                            onChange={(event) => handleFieldChange(field.key, event.target.value)}
                            className={`w-full rounded-lg border px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              errors[field.key] ? "border-red-400" : "border-gray-300"
                            }`}
                          >
                            {field.options.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={field.type}
                            min={field.min}
                            value={settings[field.key]}
                            onChange={(event) =>
                              handleFieldChange(
                                field.key,
                                field.type === "number" ? Number(event.target.value) : event.target.value
                              )
                            }
                            className={`w-full rounded-lg border px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              errors[field.key] ? "border-red-400" : "border-gray-300"
                            }`}
                          />
                        )}
                        {errors[field.key] && (
                          <p className="mt-2 text-sm text-red-600">{errors[field.key]}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {section.toggles && section.toggles.length > 0 && (
                  <div className="grid grid-cols-1 gap-4">
                    {section.toggles.map((toggle) => (
                      <div
                        key={toggle.key}
                        className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 p-4"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900">{toggle.label}</p>
                          <p className="text-sm text-gray-500 mt-1">{toggle.description}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleFieldChange(toggle.key, !settings[toggle.key])}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            settings[toggle.key] ? "bg-blue-600" : "bg-gray-300"
                          }`}
                          aria-label={toggle.label}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              settings[toggle.key] ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Configuration Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Enrollment Window</p>
            <p className="mt-1 font-medium text-gray-900">
              {formatDateLabel(settings.enrollment_start_date)} to {formatDateLabel(settings.enrollment_end_date)}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Default Section Capacity</p>
            <p className="mt-1 font-medium text-gray-900">{settings.default_section_capacity} students</p>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-500">
          Active data source: <span className="font-medium text-gray-700">{source === "supabase" ? "Supabase" : "Browser-local fallback"}</span>
        </div>
      </div>

      {showConfirmSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
            onClick={() => {
              if (!saving) {
                setShowConfirmSaveModal(false);
              }
            }}
          />
          <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                    <Settings className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-950">Confirm Configuration Changes</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Review the modified settings before applying them to the system.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowConfirmSaveModal(false)}
                  disabled={saving}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Close confirmation modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="max-h-[62vh] overflow-y-auto px-5 py-5 sm:px-6">
              <div className="space-y-3">
                {pendingConfigurationChanges.map((change) => (
                  <div key={change.key} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-blue-600" />
                      <p className="text-sm font-semibold text-slate-900">{change.label}</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                      <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                        <p className="text-xs font-medium text-slate-500">Previous</p>
                        <p className="mt-1 break-words text-sm font-semibold text-slate-800">{change.previousValue}</p>
                      </div>
                      <div className="flex justify-center text-blue-700">
                        <ArrowRight className="h-5 w-5" />
                      </div>
                      <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2">
                        <p className="text-xs font-medium text-blue-700">New</p>
                        <p className="mt-1 break-words text-sm font-semibold text-blue-950">{change.nextValue}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
              <button
                type="button"
                onClick={() => setShowConfirmSaveModal(false)}
                disabled={saving}
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmSave()}
                disabled={saving}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Confirm Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm" onClick={() => setShowSuccessModal(false)} />
          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-emerald-100 bg-white text-center shadow-2xl">
            <div className="px-6 pb-6 pt-8">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="h-9 w-9" />
              </div>
              <h2 className="mt-5 text-2xl font-semibold text-slate-950">
                System configuration updated successfully.
              </h2>
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm text-slate-600">
                <p>
                  <span className="font-semibold text-slate-800">Saved:</span> {formatLastUpdated(lastUpdatedAt)}
                </p>
                {lastSavedBy && (
                  <p className="mt-1">
                    <span className="font-semibold text-slate-800">Updated by:</span> {lastSavedBy}
                  </p>
                )}
              </div>
            </div>
            <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
