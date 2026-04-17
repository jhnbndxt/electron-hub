import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ArrowRight, CheckCircle, BookOpen, Award, Users, Sparkles, Megaphone, Plus, Pencil, Trash2, X, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { ConfirmationModal } from "../components/ConfirmationModal";
import { createAnnouncement, deleteAnnouncement, getAnnouncements, hasCustomAnnouncements, syncAnnouncementsToRemote, updateAnnouncement } from "../../services/announcementService";

type AnnouncementAccent = "blue" | "red";

interface Announcement {
  id: string;
  title: string;
  content: string;
  postedAt: string;
  accentColor: AnnouncementAccent;
  createdAt?: string | null;
  updatedAt?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
}

interface AnnouncementFormState {
  title: string;
  content: string;
  postedAt: string;
  accentColor: AnnouncementAccent;
}

const buildInitialAnnouncementFormState = (): AnnouncementFormState => ({
  title: "",
  content: "",
  postedAt: new Date().toISOString().split("T")[0],
  accentColor: "blue",
});

const formatAnnouncementDate = (value: string) => {
  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Recently posted";
  }

  return parsedDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const getAnnouncementAccentStyles = (accentColor: AnnouncementAccent) => {
  if (accentColor === "red") {
    return {
      iconBackground: "rgba(185, 28, 28, 0.1)",
      iconColor: "var(--electron-red)",
      hoverClassName: "hover:bg-red-50/40",
      badgeClassName: "border-red-200 bg-red-50 text-red-700",
    };
  }

  return {
    iconBackground: "rgba(30, 58, 138, 0.1)",
    iconColor: "var(--electron-blue)",
    hoverClassName: "hover:bg-blue-50/50",
    badgeClassName: "border-blue-200 bg-blue-50 text-blue-700",
  };
};

const validateAnnouncementForm = (formState: AnnouncementFormState) => {
  const trimmedTitle = formState.title.trim();
  const trimmedContent = formState.content.trim();

  if (!trimmedTitle) {
    return "Enter an announcement title.";
  }

  if (trimmedTitle.length < 6) {
    return "Announcement title must be at least 6 characters long.";
  }

  if (!trimmedContent) {
    return "Enter the announcement details.";
  }

  if (trimmedContent.length < 20) {
    return "Announcement details must be at least 20 characters long.";
  }

  if (!formState.postedAt) {
    return "Select a posted date.";
  }

  const postedDate = new Date(formState.postedAt);
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  if (Number.isNaN(postedDate.getTime())) {
    return "Use a valid posted date.";
  }

  if (postedDate > today) {
    return "Posted date cannot be in the future.";
  }

  return "";
};

export function Home() {
  const { userRole, userData } = useAuth();
  const canManageAnnouncements = userRole === "branchcoordinator" || userData?.adminType === "branchcoordinator";
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(true);
  const [announcementError, setAnnouncementError] = useState("");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null);
  const [announcementForm, setAnnouncementForm] = useState<AnnouncementFormState>(buildInitialAnnouncementFormState);
  const [isSavingAnnouncement, setIsSavingAnnouncement] = useState(false);
  const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null);

  const strands = [
    {
      name: "GA",
      full: "General Academic",
      description: "For students pursuing college preparatory education with emphasis on academic subjects leading to higher education.",
      color: "#1E3A8A",
    },
    {
      name: "TP",
      full: "Technical Professional",
      description: "For students interested in technical and vocational skills development preparing for immediate employment or entrepreneurship.",
      color: "#B91C1C",
    },
  ];

  const processSteps = [
    {
      number: 1,
      title: "Complete Assessment",
      description: "Take our AI-powered assessment test to evaluate your skills and interests.",
    },
    {
      number: 2,
      title: "Review Recommendation",
      description: "Receive personalized strand recommendations based on your assessment results.",
    },
    {
      number: 3,
      title: "Submit Enrollment",
      description: "Complete your enrollment form and submit required documents online.",
    },
  ];

  const maxAnnouncementDate = new Date().toISOString().split("T")[0];
  const announcementFormError = validateAnnouncementForm(announcementForm);

  const loadAnnouncements = async (showLoadingState = true) => {
    if (showLoadingState) {
      setIsLoadingAnnouncements(true);
    }

    const { data, error, source } = await getAnnouncements();

    if (error) {
      setAnnouncementError(error);
    }

    let nextAnnouncements = Array.isArray(data) ? data : [];

    if (canManageAnnouncements && source === "local" && hasCustomAnnouncements(nextAnnouncements)) {
      const actorReference = userData?.id || userData?.email || null;
      const { error: syncError } = await syncAnnouncementsToRemote(nextAnnouncements, actorReference);

      if (syncError) {
        setAnnouncementError(typeof syncError === "string" ? syncError : "Unable to sync announcements to shared storage.");
      } else {
        const refreshedAnnouncements = await getAnnouncements();
        nextAnnouncements = Array.isArray(refreshedAnnouncements.data) ? refreshedAnnouncements.data : nextAnnouncements;
      }
    }

    setAnnouncements(nextAnnouncements);

    if (showLoadingState) {
      setIsLoadingAnnouncements(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, [canManageAnnouncements, userData?.email, userData?.id]);

  const closeAnnouncementEditor = () => {
    setIsEditorOpen(false);
    setEditingAnnouncementId(null);
    setAnnouncementForm(buildInitialAnnouncementFormState());
  };

  const openCreateAnnouncementEditor = () => {
    setAnnouncementError("");
    setEditingAnnouncementId(null);
    setAnnouncementForm(buildInitialAnnouncementFormState());
    setIsEditorOpen(true);
  };

  const openEditAnnouncementEditor = (announcement: Announcement) => {
    setAnnouncementError("");
    setEditingAnnouncementId(announcement.id);
    setAnnouncementForm({
      title: announcement.title,
      content: announcement.content,
      postedAt: announcement.postedAt,
      accentColor: announcement.accentColor,
    });
    setIsEditorOpen(true);
  };

  const handleAnnouncementFieldChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;

    if (announcementError) {
      setAnnouncementError("");
    }

    setAnnouncementForm((currentFormState) => ({
      ...currentFormState,
      [name]: value,
    }));
  };

  const handleSaveAnnouncement = async (event: React.FormEvent) => {
    event.preventDefault();
    setAnnouncementError("");

    if (announcementFormError) {
      setAnnouncementError(announcementFormError);
      return;
    }

    setIsSavingAnnouncement(true);

    const payload = {
      title: announcementForm.title.trim(),
      content: announcementForm.content.trim(),
      postedAt: announcementForm.postedAt,
      accentColor: announcementForm.accentColor,
      updatedBy: userData?.id || userData?.email || null,
      createdBy: userData?.id || userData?.email || null,
      actorReference: userData?.id || userData?.email || null,
    };

    try {
      if (editingAnnouncementId) {
        const { error } = await updateAnnouncement(editingAnnouncementId, payload);

        if (error) {
          setAnnouncementError(error);
          setIsSavingAnnouncement(false);
          return;
        }
      } else {
        const { error } = await createAnnouncement(payload);

        if (error) {
          setAnnouncementError(error);
          setIsSavingAnnouncement(false);
          return;
        }
      }

      await loadAnnouncements(false);
      closeAnnouncementEditor();
    } finally {
      setIsSavingAnnouncement(false);
    }
  };

  const handleDeleteAnnouncement = async () => {
    if (!announcementToDelete) {
      return;
    }

    setAnnouncementError("");
    const targetAnnouncement = announcementToDelete;
    const { error } = await deleteAnnouncement(targetAnnouncement.id, userData?.id || userData?.email || null);

    if (error) {
      setAnnouncementError(error);
      return;
    }

    await loadAnnouncements(false);
  };

  return (
    <div>
      {/* Hero Section */}
      <section
        className="relative text-white py-16 sm:py-20 md:py-24 overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #1E3A8A 0%, #1e40af 50%, #2563eb 100%)"
        }}
      >
        {/* Decorative Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-white/20">
                <Sparkles className="w-4 h-4 text-yellow-300" />
                <span className="text-sm font-medium">AI-Powered Strand Recommendation</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight">
                Electron Hub
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl text-blue-100 mb-4 font-light">
                Senior High School Online Enrollment and Assessment Portal
              </p>
              <p className="text-lg text-blue-50 mb-8 leading-relaxed">
                Discover your path to success with our AI-assisted strand recommendation system.
                Make informed decisions about your academic future.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 w-full">
                <Link
                  to="/assessment"
                  className="px-8 py-4 rounded-lg text-white transition-all hover:scale-105 hover:shadow-xl inline-flex items-center justify-center gap-2 font-semibold w-full sm:w-auto"
                  style={{ backgroundColor: "rgba(255, 255, 255, 0.15)", backdropFilter: "blur(10px)", border: "2px solid white" }}
                >
                  Start Assessment
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/enrollment-info"
                  className="px-8 py-4 rounded-lg text-white transition-all hover:scale-105 hover:shadow-xl inline-flex items-center justify-center gap-2 font-semibold w-full sm:w-auto"
                  style={{ backgroundColor: "var(--electron-red)" }}
                >
                  Enroll Now
                </Link>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-white/5 rounded-2xl backdrop-blur-sm"></div>
                <div className="relative rounded-2xl w-full h-96 bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-2xl">
                  <div className="text-center">
                    <BookOpen className="w-20 h-20 text-white/60 mx-auto mb-4" />
                    <p className="text-white/60 text-lg font-light">Campus Preview</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* System Overview */}
      <section className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: "var(--electron-blue)" }}>
              Welcome to Electron College
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              The Electron Hub is the official online enrollment and AI-assisted strand
              recommendation system of Electron College of Technological Education (Malanday).
              Our system provides a structured, efficient, and data-driven approach to help
              students choose the right academic path.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-xl bg-gradient-to-br from-blue-50 to-white border border-blue-100 hover:shadow-xl transition-all hover:-translate-y-1">
              <div
                className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg"
                style={{ backgroundColor: "var(--electron-blue)" }}
              >
                <BookOpen className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3" style={{ color: "var(--electron-blue)" }}>
                Smart Assessment
              </h3>
              <p className="text-gray-600 leading-relaxed">
                AI-powered evaluation of your academic skills, interests, and strengths
              </p>
            </div>
            <div className="text-center p-8 rounded-xl bg-gradient-to-br from-red-50 to-white border border-red-100 hover:shadow-xl transition-all hover:-translate-y-1">
              <div
                className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg"
                style={{ backgroundColor: "var(--electron-red)" }}
              >
                <Award className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3" style={{ color: "var(--electron-red)" }}>
                Personalized Recommendations
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Receive tailored strand suggestions based on your unique profile
              </p>
            </div>
            <div className="text-center p-8 rounded-xl bg-gradient-to-br from-blue-50 to-white border border-blue-100 hover:shadow-xl transition-all hover:-translate-y-1">
              <div
                className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg"
                style={{ backgroundColor: "var(--electron-blue)" }}
              >
                <Users className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3" style={{ color: "var(--electron-blue)" }}>
                Streamlined Enrollment
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Complete your enrollment process entirely online with ease
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Process Flow */}
      <section className="py-12 sm:py-16 md:py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: "var(--electron-blue)" }}>
              Enrollment Process
            </h2>
            <p className="text-lg md:text-xl text-gray-600">
              Three simple steps to begin your academic journey
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {processSteps.map((step, index) => (
              <div key={step.number} className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 border border-gray-100 relative">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mb-6 shadow-lg"
                  style={{
                    backgroundColor: index % 2 === 0 ? "var(--electron-blue)" : "var(--electron-red)",
                  }}
                >
                  {step.number}
                </div>
                <h3 className="text-2xl font-bold mb-4" style={{ color: "var(--electron-dark-gray)" }}>
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
                {index < processSteps.length - 1 && (
                  <ArrowRight
                    className="hidden md:block absolute -right-4 top-1/2 transform -translate-y-1/2 text-gray-300"
                    style={{ width: "32px", height: "32px" }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Academic Strands */}
      <section className="py-12 sm:py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: "var(--electron-blue)" }}>
              Academic Tracks
            </h2>
            <p className="text-lg md:text-xl text-gray-600">
              Choose from two senior high school tracks tailored to your interests and goals
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {strands.map((strand) => (
              <div
                key={strand.name}
                className="border-2 rounded-2xl p-8 hover:shadow-2xl transition-all hover:-translate-y-1 bg-white"
                style={{ borderColor: strand.color }}
              >
                <div className="flex items-start gap-6">
                  <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 shadow-lg"
                    style={{ backgroundColor: strand.color }}
                  >
                    {strand.name}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-3" style={{ color: strand.color }}>
                      {strand.full}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">{strand.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Announcements */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: "var(--electron-blue)" }}>
              Announcements
            </h2>
            <p className="mx-auto max-w-3xl text-lg text-gray-600">
              Stay updated with the latest enrollment schedules, system notices, and campus-wide announcements.
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            {canManageAnnouncements && (
              <div className="mb-6 overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-lg">
                <div className="border-b border-blue-100 bg-gradient-to-r from-blue-50 via-white to-red-50 px-6 py-6 sm:px-8">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="max-w-2xl">
                      <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
                        <Megaphone className="h-3.5 w-3.5" />
                        Coordinator Controls
                      </div>
                      <h3 className="mt-4 text-2xl font-bold text-slate-900">Manage public announcements</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
                        Branch Coordinators can publish, edit, and remove announcements that appear on the public home page.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={openCreateAnnouncementEditor}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1E3A8A] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5 hover:bg-[#1e40af]"
                    >
                      <Plus className="h-4 w-4" />
                      Add Announcement
                    </button>
                  </div>
                </div>

                {isEditorOpen && (
                  <form onSubmit={handleSaveAnnouncement} className="space-y-5 px-6 py-6 sm:px-8">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="text-xl font-semibold text-slate-900">
                          {editingAnnouncementId ? "Edit announcement" : "Create announcement"}
                        </h4>
                        <p className="mt-1 text-sm text-slate-500">
                          Changes are reflected in the announcement feed immediately after saving.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={closeAnnouncementEditor}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 transition-colors hover:text-slate-700"
                        aria-label="Close announcement editor"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label htmlFor="announcement-title" className="mb-2 block text-sm font-semibold text-slate-700">
                          Title
                        </label>
                        <input
                          id="announcement-title"
                          name="title"
                          type="text"
                          value={announcementForm.title}
                          onChange={handleAnnouncementFieldChange}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition-all focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                          placeholder="Enter announcement title"
                        />
                      </div>

                      <div>
                        <label htmlFor="announcement-postedAt" className="mb-2 block text-sm font-semibold text-slate-700">
                          Posted date
                        </label>
                        <input
                          id="announcement-postedAt"
                          name="postedAt"
                          type="date"
                          max={maxAnnouncementDate}
                          value={announcementForm.postedAt}
                          onChange={handleAnnouncementFieldChange}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition-all focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                        />
                      </div>

                      <div>
                        <label htmlFor="announcement-accentColor" className="mb-2 block text-sm font-semibold text-slate-700">
                          Accent color
                        </label>
                        <select
                          id="announcement-accentColor"
                          name="accentColor"
                          value={announcementForm.accentColor}
                          onChange={handleAnnouncementFieldChange}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition-all focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                        >
                          <option value="blue">Electron Blue</option>
                          <option value="red">Electron Red</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label htmlFor="announcement-content" className="mb-2 block text-sm font-semibold text-slate-700">
                          Details
                        </label>
                        <textarea
                          id="announcement-content"
                          name="content"
                          rows={5}
                          value={announcementForm.content}
                          onChange={handleAnnouncementFieldChange}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition-all focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
                          placeholder="Write the announcement details shown to students and applicants."
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm text-slate-500">
                        Use clear, public-facing language. The announcement card will show the selected date and accent color.
                      </p>
                      <div className="flex flex-col-reverse gap-3 sm:flex-row">
                        <button
                          type="button"
                          onClick={closeAnnouncementEditor}
                          className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSavingAnnouncement}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1E3A8A] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5 hover:bg-[#1e40af] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isSavingAnnouncement && <Loader2 className="h-4 w-4 animate-spin" />}
                          {editingAnnouncementId ? "Save Changes" : "Publish Announcement"}
                        </button>
                      </div>
                    </div>

                    {announcementFormError && (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        {announcementFormError}
                      </div>
                    )}
                  </form>
                )}
              </div>
            )}

            {announcementError && (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {announcementError}
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
              {isLoadingAnnouncements ? (
                <div className="flex items-center justify-center gap-3 px-8 py-16 text-slate-500">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading announcements...
                </div>
              ) : announcements.length === 0 ? (
                <div className="px-8 py-16 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                    <Megaphone className="h-8 w-8" />
                  </div>
                  <h3 className="mt-5 text-2xl font-semibold text-slate-900">No announcements yet</h3>
                  <p className="mt-2 text-base text-slate-500">
                    Public announcements will appear here as soon as the Branch Coordinator publishes one.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {announcements.map((announcement) => {
                    const accentStyles = getAnnouncementAccentStyles(announcement.accentColor);

                    return (
                      <div key={announcement.id} className={`p-8 transition-colors ${accentStyles.hoverClassName}`}>
                        <div className="flex items-start gap-6">
                          <div
                            className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: accentStyles.iconBackground }}
                          >
                            <CheckCircle className="w-7 h-7" style={{ color: accentStyles.iconColor }} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                              <div className="min-w-0 flex-1">
                                <div className="mb-3 inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-center ${accentStyles.badgeClassName}">
                                  {announcement.accentColor === "red" ? "Priority Update" : "System Update"}
                                </div>
                                <h3 className="text-2xl font-bold mb-3" style={{ color: "var(--electron-dark-gray)" }}>
                                  {announcement.title}
                                </h3>
                                <p className="text-gray-600 mb-3 leading-relaxed whitespace-pre-line">
                                  {announcement.content}
                                </p>
                                <p className="text-sm text-gray-500 font-medium">Posted on {formatAnnouncementDate(announcement.postedAt)}</p>
                              </div>

                              {canManageAnnouncements && (
                                <div className="flex shrink-0 flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() => openEditAnnouncementEditor(announcement)}
                                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800"
                                  >
                                    <Pencil className="h-4 w-4" />
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setAnnouncementToDelete(announcement)}
                                    className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        className="py-20 text-white text-center relative overflow-hidden"
        style={{ 
          background: "linear-gradient(135deg, #1E3A8A 0%, #1e40af 50%, #2563eb 100%)"
        }}
      >
        {/* Decorative Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-20 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 left-20 w-80 h-80 bg-white rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Begin Your Journey?</h2>
          <p className="text-xl md:text-2xl text-blue-100 mb-10 leading-relaxed font-light">
            Take the first step towards your future. Start your assessment today and discover
            the perfect strand for you.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/login"
              className="px-10 py-4 bg-white rounded-xl transition-all hover:scale-105 hover:shadow-2xl font-semibold text-lg"
              style={{ color: "var(--electron-blue)" }}
            >
              Get Started
            </Link>
            <Link
              to="/about"
              className="px-10 py-4 rounded-xl text-white transition-all hover:scale-105 hover:shadow-2xl font-semibold text-lg border-2 border-white"
              style={{ backgroundColor: "var(--electron-red)" }}
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      <ConfirmationModal
        isOpen={Boolean(announcementToDelete)}
        onClose={() => setAnnouncementToDelete(null)}
        onConfirm={handleDeleteAnnouncement}
        title="Delete announcement?"
        message={
          announcementToDelete
            ? `This will remove \"${announcementToDelete.title}\" from the public home page announcement feed.`
            : ""
        }
        confirmText="Delete Announcement"
        cancelText="Keep Announcement"
        type="danger"
      />
    </div>
  );
}