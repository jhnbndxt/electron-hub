import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router";
import { ChevronLeft, ChevronRight, Brain, Calculator, Beaker, Lightbulb, Heart, CheckCircle, BarChart3, FileText, Award, BookOpen, ArrowRight, Sparkles, TrendingUp, GraduationCap, Briefcase, AlertTriangle } from "lucide-react";
import { formatAssessmentResult } from "../../services/assessmentScoringService";
import { getDefaultAssessmentQuestions } from "../../services/assessmentService";
import { supabase } from "../../supabase";
import { LoadingState } from "../components/LoadingState";
import { requestAssessmentAiRecommendation } from "../utils/assessmentAi";
import { savePublicAssessmentResult } from "../../services/assessmentResultService";

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer?: number;
  category: string;
  interestType?: string | null;
}

type AnswerValue = number;

interface Section {
  name: string;
  icon: any;
  questions: Question[];
}

interface AssessmentResult {
  track: string;
  electives: string[];
  scores: {
    VA: number;
    MA: number;
    SA: number;
    LRA: number;
  };
  topDomains: string[];
  topInterests: string[];
  overallScore: number;
  aiRecommendation?: any;
}

const normalizeResultArray = (value: any): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || "").trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];

    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        return normalizeResultArray(JSON.parse(trimmed));
      } catch {
        return [];
      }
    }

    return trimmed
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const normalizeResultText = (value: any, fallback = ""): string => {
  if (typeof value === "string") {
    return value.trim() || fallback;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return normalizeResultArray(value).join(", ") || fallback;
  }

  if (value && typeof value === "object") {
    const likelyText =
      value.text ||
      value.description ||
      value.explanation ||
      value.summary ||
      value.analysis ||
      value.name ||
      value.label ||
      value.value ||
      value.category;

    if (likelyText) {
      return normalizeResultText(likelyText, fallback);
    }

    try {
      return JSON.stringify(value);
    } catch {
      return fallback;
    }
  }

  return fallback;
};

const normalizeResultScore = (value: any) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
};

const normalizeAssessmentResult = (result: any): AssessmentResult | null => {
  if (!result || typeof result !== "object") return null;

  const rawScores = result.scores || {};
  const electives = normalizeResultArray(result.electives ?? [result.elective_1, result.elective_2]);

  return {
    track: normalizeResultText(result.track || result.recommended_track, "General"),
    electives,
    scores: {
      VA: normalizeResultScore(rawScores.VA ?? rawScores.verbal_ability_score ?? result.verbal_ability_score),
      MA: normalizeResultScore(rawScores.MA ?? rawScores.mathematical_ability_score ?? result.mathematical_ability_score),
      SA: normalizeResultScore(rawScores.SA ?? rawScores.spatial_ability_score ?? result.spatial_ability_score),
      LRA: normalizeResultScore(rawScores.LRA ?? rawScores.logical_reasoning_score ?? result.logical_reasoning_score),
    },
    topDomains: normalizeResultArray(result.topDomains ?? result.top_domains),
    topInterests: normalizeResultArray(result.topInterests ?? result.top_interests),
    overallScore: normalizeResultScore(result.overallScore ?? result.overall_score ?? rawScores.overall_score),
    aiRecommendation: result.aiRecommendation || {},
  };
};

function getSuggestedCoursesForPublicResult(track: string, elective: string): string[] {
  const normalizedElective = normalizeResultText(elective).toLowerCase();

  if (track === "Academic") {
    if (normalizedElective.includes("biology")) {
      return ["Medicine", "Nursing", "Biology"];
    } else if (normalizedElective.includes("physics")) {
      return ["Engineering (Civil, Electrical, Mechanical)", "Applied Physics"];
    } else if (normalizedElective.includes("psychology")) {
      return ["Psychology", "Education", "Social Work"];
    } else if (normalizedElective.includes("creative writing")) {
      return ["Communication", "Journalism", "Literature"];
    } else if (normalizedElective.includes("entrepreneurship") || normalizedElective.includes("marketing")) {
      return ["Business Administration", "Marketing", "Management"];
    } else if (normalizedElective.includes("media arts") || normalizedElective.includes("visual arts")) {
      return ["Multimedia Arts", "Film", "Graphic Design"];
    } else if (normalizedElective.includes("coaching") || normalizedElective.includes("fitness")) {
      return ["Physical Education", "Sports Science", "Sports Management"];
    }
  } else if (track === "Technical-Professional") {
    if (normalizedElective.includes("ict")) {
      return ["Information Technology", "Computer Science", "Software Engineering"];
    } else if (normalizedElective.includes("programming")) {
      return ["Software Engineering", "Computer Engineering"];
    } else if (normalizedElective.includes("cookery")) {
      return ["Culinary Arts", "Hospitality Management", "Tourism"];
    } else if (normalizedElective.includes("bread") || normalizedElective.includes("pastry")) {
      return ["Culinary Arts", "Baking & Pastry"];
    } else if (normalizedElective.includes("automotive")) {
      return ["Mechanical Engineering", "Automotive Technology"];
    } else if (normalizedElective.includes("electrical")) {
      return ["Electrical Engineering", "Electronics Engineering"];
    } else if (normalizedElective.includes("agriculture")) {
      return ["Agriculture", "Agribusiness"];
    } else if (normalizedElective.includes("fishery")) {
      return ["Fisheries", "Marine Biology"];
    } else if (normalizedElective.includes("fitness") || normalizedElective.includes("coaching")) {
      return ["Physical Education", "Sports Management"];
    }
  }

  return [];
}

interface PublicAssessmentResultsViewProps {
  result: AssessmentResult | null;
  saveInfo: { fullName: string; email: string };
  saveErrors: { fullName: string; email: string };
  saveStatus: "idle" | "saving" | "saved" | "error";
  saveMessage: string;
  onSaveInfoChange: (nextSaveInfo: { fullName: string; email: string }) => void;
  onSaveErrorsChange: (nextSaveErrors: { fullName: string; email: string }) => void;
  onSave: () => void;
  onRestart: () => void;
}

function PublicAssessmentResultsView({
  result,
  saveInfo,
  saveErrors,
  saveStatus,
  saveMessage,
  onSaveInfoChange,
  onSaveErrorsChange,
  onSave,
  onRestart,
}: PublicAssessmentResultsViewProps) {
  const normalizedResult = normalizeAssessmentResult(result);

  if (!normalizedResult) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-16">
        <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center shadow-xl">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-950">We could not load this result</h1>
          <p className="mt-3 leading-7 text-slate-600">
            The saved result data is incomplete. Restart the public assessment to generate a fresh recommendation.
          </p>
          <button
            onClick={onRestart}
            className="mt-6 rounded-xl bg-[var(--electron-blue)] px-6 py-3 font-semibold text-white shadow-lg"
          >
            Restart Assessment
          </button>
        </div>
      </div>
    );
  }

  const track = normalizeResultText(normalizedResult.track, "General");
  const electives = normalizedResult.electives.length > 0 ? normalizedResult.electives : ["Elective recommendation pending"];
  const topDomains = normalizedResult.topDomains.length > 0 ? normalizedResult.topDomains : ["Balanced aptitude profile"];
  const topInterests = normalizedResult.topInterests.length > 0 ? normalizedResult.topInterests : ["General academic interests"];
  const scores = normalizedResult.scores;
  const overallScore = Math.round(normalizeResultScore(normalizedResult.overallScore));
  const aiRecommendation = normalizedResult.aiRecommendation || {};
  const aiExplanation =
    normalizeResultText(aiRecommendation.overallAnalysis) ||
    `Your assessment points toward the ${track} Track because your answers show strengths in ${topDomains.join(" and ")} with interests connected to ${topInterests.join(" and ")}.`;
  const trackExplanation =
    normalizeResultText(aiRecommendation.trackExplanation) ||
    (track === "Academic"
      ? "This path supports college-preparatory learning, research, and academic specialization."
      : "This path supports practical training, technical competencies, and career-ready preparation.");
  const scoreRows = [
    { label: "Verbal Aptitude", value: scores.VA, icon: Brain },
    { label: "Mathematical Ability", value: scores.MA, icon: Calculator },
    { label: "Science / Spatial Ability", value: scores.SA, icon: Beaker },
    { label: "Logical Reasoning", value: scores.LRA, icon: Lightbulb },
  ];
  const pathwayRows =
    Array.isArray(aiRecommendation.careerPathways) && aiRecommendation.careerPathways.length > 0
      ? aiRecommendation.careerPathways.map((pathway: any) => ({
          category: normalizeResultText(pathway?.category || pathway?.name, "Career Pathway"),
          careers: normalizeResultArray(pathway?.careers ?? pathway?.courses ?? pathway?.items),
        }))
      : electives.map((elective) => ({
          category: elective,
          careers: getSuggestedCoursesForPublicResult(track, elective),
        }));
  const electiveExplanations = [
    normalizeResultText(aiRecommendation.elective1Explanation),
    normalizeResultText(aiRecommendation.elective2Explanation),
  ];
  const getElectiveExplanation = (elective: string, index: number) =>
    electiveExplanations[index] ||
    `${normalizeResultText(elective, "This elective")} is recommended because it connects with your strongest assessment areas, your interests, and the learning direction of the ${track} Track.`;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <section className="bg-[var(--electron-blue)] px-4 py-14 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold">
            <CheckCircle className="h-4 w-4" />
            Assessment Complete
          </div>
          <div className="mt-6 grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Your Assessment Result</h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-blue-100">
                Review your recommended track, electives, strengths, and next-step options. You can save this result by email below.
              </p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-100">Recommended Track</p>
              <p className="mt-2 text-4xl font-bold">{track}</p>
              <p className="mt-3 text-sm leading-6 text-blue-100">{trackExplanation}</p>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <section className="rounded-2xl bg-white p-6 shadow-lg">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Overall Score</p>
              <p className="mt-3 text-6xl font-bold text-[var(--electron-blue)]">{overallScore}%</p>
              <p className="mt-2 text-sm text-slate-500">
                {overallScore >= 80 ? "Excellent readiness" : overallScore >= 60 ? "Good readiness" : "Developing readiness"}
              </p>
            </div>
            <div className="mt-8 space-y-4">
              {scoreRows.map((row) => {
                const Icon = row.icon;
                const score = Math.max(0, Math.min(100, Math.round(normalizeResultScore(row.value))));
                return (
                  <div key={row.label}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <Icon className="h-4 w-4 text-slate-500" />
                        {row.label}
                      </div>
                      <span className="text-sm font-bold text-[var(--electron-blue)]">{score}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div className="h-2 rounded-full bg-[var(--electron-blue)]" style={{ width: `${score}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-2xl bg-white p-6 shadow-lg">
              <div className="flex items-start gap-4">
                <Award className="mt-1 h-8 w-8 text-[var(--electron-blue)]" />
                <div>
                  <h2 className="text-2xl font-bold text-slate-950">Recommended Electives</h2>
                  <p className="mt-2 text-slate-600">These subjects best match your assessment profile.</p>
                </div>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {electives.map((elective, index) => (
                  <div key={`${elective}-${index}`} className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue-700">Elective {index + 1}</p>
                    <p className="mt-2 text-xl font-bold text-slate-950">{normalizeResultText(elective, "Elective")}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {getElectiveExplanation(elective, index)}
                    </p>
                    {getSuggestedCoursesForPublicResult(track, elective).length > 0 && (
                      <p className="mt-3 border-t border-blue-100 pt-3 text-sm leading-6 text-slate-600">
                        Leads to: {getSuggestedCoursesForPublicResult(track, elective).join(", ")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-lg">
              <div className="flex items-start gap-4">
                <Sparkles className="mt-1 h-8 w-8 text-[var(--electron-red)]" />
                <div>
                  <h2 className="text-2xl font-bold text-slate-950">Why This Fits You</h2>
                  <p className="mt-3 leading-7 text-slate-700">{aiExplanation}</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-lg">
            <h2 className="text-xl font-bold text-slate-950">Profile Summary</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm font-bold text-slate-900">Top Strengths</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{topDomains.join(", ")}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm font-bold text-slate-900">Key Interests</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{topInterests.join(", ")}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-lg">
            <h2 className="text-xl font-bold text-slate-950">Possible Pathways</h2>
            <div className="mt-4 space-y-3">
              {pathwayRows.filter((pathway) => pathway.careers.length > 0).slice(0, 4).map((pathway, index) => (
                <div key={`${pathway.category}-${index}`} className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm font-bold text-slate-900">{pathway.category}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{pathway.careers.join(", ")}</p>
                </div>
              ))}
              {pathwayRows.every((pathway) => pathway.careers.length === 0) && (
                <p className="text-sm leading-6 text-slate-600">
                  Your track and electives can support college and career options connected to your strengths.
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl bg-white p-6 shadow-lg">
          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-blue-800">
                <FileText className="h-4 w-4" />
                Optional Save
              </div>
              <h2 className="text-2xl font-bold text-slate-950">Save your assessment results</h2>
              <p className="mt-3 leading-7 text-slate-600">
                Enter your name and email after seeing your result. If the email already has an official assessment, it will not be overwritten.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Full Name</label>
                  <input
                    type="text"
                    value={saveInfo.fullName}
                    onChange={(event) => {
                      onSaveInfoChange({ ...saveInfo, fullName: event.target.value });
                      onSaveErrorsChange({ ...saveErrors, fullName: "" });
                    }}
                    className={`w-full rounded-xl border-2 bg-white px-4 py-3 text-sm outline-none transition-all focus:ring-2 ${
                      saveErrors.fullName ? "border-red-300 focus:ring-red-200" : "border-gray-200 focus:ring-blue-200"
                    }`}
                    placeholder="Your full name"
                  />
                  {saveErrors.fullName && <p className="mt-2 text-sm text-red-600">{saveErrors.fullName}</p>}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Email Address</label>
                  <input
                    type="email"
                    value={saveInfo.email}
                    onChange={(event) => {
                      onSaveInfoChange({ ...saveInfo, email: event.target.value.trimStart().toLowerCase() });
                      onSaveErrorsChange({ ...saveErrors, email: "" });
                    }}
                    className={`w-full rounded-xl border-2 bg-white px-4 py-3 text-sm outline-none transition-all focus:ring-2 ${
                      saveErrors.email ? "border-red-300 focus:ring-red-200" : "border-gray-200 focus:ring-blue-200"
                    }`}
                    placeholder="name@example.com"
                  />
                  {saveErrors.email && <p className="mt-2 text-sm text-red-600">{saveErrors.email}</p>}
                </div>
              </div>

              <button
                onClick={onSave}
                disabled={saveStatus === "saving" || saveStatus === "saved"}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--electron-blue)] px-5 py-3 font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Result Saved" : "Save Result to Email"}
              </button>

              {saveMessage && (
                <div
                  className={`mt-4 rounded-xl border p-4 text-sm font-medium ${
                    saveStatus === "error"
                      ? "border-red-200 bg-red-50 text-red-700"
                      : "border-emerald-200 bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {saveMessage}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl bg-white p-6 text-center shadow-lg">
          <h2 className="text-2xl font-bold text-slate-950">Ready to Enroll?</h2>
          <p className="mt-2 text-slate-600">Create an account or log in to continue with your enrollment application.</p>
          <div className="mt-6 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--electron-blue)] px-6 py-4 font-semibold text-white shadow-md"
            >
              <FileText className="h-5 w-5" />
              Create Account & Enroll
            </Link>
            <Link
              to="/login"
              state={{ fromPublicLogin: true }}
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[var(--electron-blue)] bg-white px-6 py-4 font-semibold text-[var(--electron-blue)] shadow-md"
            >
              <ArrowRight className="h-5 w-5" />
              Login to Continue
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

export function PublicAssessment() {
  const navigate = useNavigate();
  const [currentSection, setCurrentSection] = useState(0);
  const [answers, setAnswers] = useState<Record<number, AnswerValue>>({});
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [assessmentCompleted, setAssessmentCompleted] = useState(false);
  const [results, setResults] = useState<AssessmentResult | null>(null);
  const [assessmentStarted, setAssessmentStarted] = useState(false);
  const [saveInfo, setSaveInfo] = useState({ fullName: "", email: "" });
  const assessmentProgressKey = "publicAssessmentProgress_guest";
  const [saveErrors, setSaveErrors] = useState({ fullName: "", email: "" });
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState("");
  const hasRestoredProgress = useRef(false);
  const publicAssessmentShellStyle = {
    background:
      "radial-gradient(circle at top left, rgba(37, 99, 235, 0.16) 0%, transparent 26%), radial-gradient(circle at top right, rgba(185, 28, 28, 0.1) 0%, transparent 22%), linear-gradient(180deg, #f8fbff 0%, #eef4ff 48%, #f8fafc 100%)",
  };

  const isInterestQuestion = (question: Question) => question.category === "Interests";

  const isQuestionAnswered = (question: Question) => {
    const answer = answers[question.id];

    return typeof answer === "number";
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    localStorage.removeItem("assessment_questions");

    const initializeAssessment = async () => {
      const existingResults = localStorage.getItem("publicAssessmentResults");

      if (existingResults) {
        let restoredResult: AssessmentResult | null = null;

        try {
          restoredResult = normalizeAssessmentResult(JSON.parse(existingResults));
        } catch (error) {
          console.error("Failed to restore public assessment result:", error);
        }

        if (restoredResult) {
          setAssessmentCompleted(true);
          setResults(restoredResult);
          setLoading(false);
          return;
        }

        localStorage.removeItem("publicAssessmentResults");
      }

      await loadQuestionsFromSupabase();
      setLoading(false);
    };

    initializeAssessment();
  }, []);

  useEffect(() => {
    if (loading || assessmentCompleted || sections.length === 0 || hasRestoredProgress.current) return;

    try {
      const savedProgress = localStorage.getItem(assessmentProgressKey) || localStorage.getItem("publicAssessmentProgress_guest");
      if (!savedProgress) {
        hasRestoredProgress.current = true;
        return;
      }

      const parsedProgress = JSON.parse(savedProgress);
      if (parsedProgress?.answers && typeof parsedProgress.answers === "object") {
        setAnswers(parsedProgress.answers);
      }

      if (Number.isInteger(parsedProgress?.currentSection)) {
        setCurrentSection(Math.min(Math.max(parsedProgress.currentSection, 0), sections.length - 1));
      }

      if (typeof parsedProgress?.assessmentStarted === "boolean") {
        setAssessmentStarted(parsedProgress.assessmentStarted);
      }
    } catch (error) {
      console.error("Failed to restore public assessment progress:", error);
    } finally {
      hasRestoredProgress.current = true;
    }
  }, [assessmentCompleted, assessmentProgressKey, loading, sections.length]);

  useEffect(() => {
    if (loading || assessmentCompleted || sections.length === 0 || !hasRestoredProgress.current) return;

    const progressPayload = JSON.stringify({
      answers,
      currentSection,
      assessmentStarted,
      updatedAt: new Date().toISOString(),
    });

    localStorage.setItem(assessmentProgressKey, progressPayload);
  }, [
    answers,
    assessmentCompleted,
    assessmentProgressKey,
    assessmentStarted,
    currentSection,
    loading,
    sections.length,
  ]);

  useEffect(() => {
    if (!loading && sections.length > 0 && assessmentStarted) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [assessmentStarted, currentSection, loading, sections.length]);

  const loadQuestionsFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from("assessment_questions")
        .select("*")
        .order("id");

      if (error || !data || data.length === 0) {
        loadQuestionsFromStorage();
        return;
      }

      const questions: Question[] = data.map((question) => ({
        id: question.id,
        question: question.question,
        options: question.options || [],
        correctAnswer: question.correct_answer,
        category: question.category,
        interestType: question.interest_type || null,
      }));

      const organizedSections: Section[] = [
        {
          name: "Verbal",
          icon: Brain,
          questions: questions.filter((question) => question.category === "Verbal"),
        },
        {
          name: "Math",
          icon: Calculator,
          questions: questions.filter((question) => question.category === "Math"),
        },
        {
          name: "Science",
          icon: Beaker,
          questions: questions.filter((question) => question.category === "Science"),
        },
        {
          name: "Logical",
          icon: Lightbulb,
          questions: questions.filter((question) => question.category === "Logical"),
        },
        {
          name: "Interests",
          icon: Heart,
          questions: questions.filter((question) => question.category === "Interests"),
        },
      ];

      setSections(organizedSections);
    } catch (error) {
      console.error("❌ Error loading questions from Supabase:", error);
      loadQuestionsFromStorage();
    }
  };

  const loadQuestionsFromStorage = () => {
    const stored = localStorage.getItem("assessment_questions");
    let questions: Question[] = [];

    if (stored) {
      questions = JSON.parse(stored);
    } else {
      questions = getDefaultQuestions();
      localStorage.setItem("assessment_questions", JSON.stringify(questions));
    }

    const organizedSections: Section[] = [
      {
        name: "Verbal",
        icon: Brain,
        questions: questions.filter((question) => question.category === "Verbal"),
      },
      {
        name: "Math",
        icon: Calculator,
        questions: questions.filter((question) => question.category === "Math"),
      },
      {
        name: "Science",
        icon: Beaker,
        questions: questions.filter((question) => question.category === "Science"),
      },
      {
        name: "Logical",
        icon: Lightbulb,
        questions: questions.filter((question) => question.category === "Logical"),
      },
      {
        name: "Interests",
        icon: Heart,
        questions: questions.filter((question) => question.category === "Interests"),
      },
    ];

    setSections(organizedSections);
  };

  const getDefaultQuestions = (): Question[] => {
    // Load 75 comprehensive questions from service
    const defaultQuestions = getDefaultAssessmentQuestions();
    
    return defaultQuestions.map((q, index) => ({
      id: index + 1,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      category: q.category,
      interestType: q.interestType || null,
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={publicAssessmentShellStyle}>
        <LoadingState
          message="Retrieving assessment records..."
          subtext="Preparing the public assessment questions."
          compact
        />
      </div>
    );
  }

  if (assessmentCompleted) {
    return (
      <PublicAssessmentResultsView
        result={results}
        saveInfo={saveInfo}
        saveErrors={saveErrors}
        saveStatus={saveStatus}
        saveMessage={saveMessage}
        onSaveInfoChange={setSaveInfo}
        onSaveErrorsChange={setSaveErrors}
        onSave={handleSaveResult}
        onRestart={() => {
          localStorage.removeItem("publicAssessmentResults");
          localStorage.removeItem(assessmentProgressKey);
          localStorage.removeItem("publicAssessmentProgress_guest");
          setAssessmentCompleted(false);
          setResults(null);
          setAssessmentStarted(false);
          setCurrentSection(0);
          setAnswers({});
          setSaveStatus("idle");
          setSaveMessage("");
        }}
      />
    );
  }

  if (assessmentCompleted && results) {
    const normalizedResults = normalizeAssessmentResult(results);

    if (!normalizedResults) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6" style={publicAssessmentShellStyle}>
          <div className="max-w-lg rounded-2xl bg-white p-8 text-center shadow-xl">
            <h1 className="text-2xl font-bold text-slate-950">Unable to load result</h1>
            <p className="mt-3 text-slate-600">
              Please restart the assessment so we can generate a complete recommendation.
            </p>
            <button
              onClick={() => {
                localStorage.removeItem("publicAssessmentResults");
                setAssessmentCompleted(false);
                setResults(null);
                setAssessmentStarted(false);
              }}
              className="mt-6 rounded-xl bg-[var(--electron-blue)] px-5 py-3 font-semibold text-white"
            >
              Restart Assessment
            </button>
          </div>
        </div>
      );
    }

    const { track, electives, scores, topDomains, topInterests, overallScore } = normalizedResults;
    const trackColor = "var(--electron-blue)";
    const secondaryColor = "var(--electron-red)";
    const aiRecommendation = normalizedResults.aiRecommendation || {};
    const topDomainSummary = topDomains.length > 0 ? topDomains.join(" and ") : "your strongest learning areas";
    const topInterestSummary = topInterests.length > 0 ? topInterests.join(" and ") : "your interests";
    const aiOverallAnalysis = normalizeResultText(aiRecommendation.overallAnalysis);
    const aiTrackExplanation = normalizeResultText(aiRecommendation.trackExplanation);
    const aiExplanation =
      aiOverallAnalysis ||
      `You are showing a strong fit for the ${track} Track because your assessment points to strengths in ${topDomainSummary} and interests connected to ${topInterestSummary}. This path can help you build on how you already think, learn, and solve problems while giving you room to explore future study and career options.`;
    const trackExplanation =
      aiTrackExplanation ||
      (track === "Academic"
        ? "You are likely to benefit from a college-preparatory path with structured academic subjects, research tasks, and university-oriented learning."
        : "You are likely to benefit from a practical, skills-based path with hands-on learning, technical competencies, and career-ready preparation.");

    const careerPathways = Array.isArray(aiRecommendation.careerPathways) && aiRecommendation.careerPathways.length > 0
      ? aiRecommendation.careerPathways.map((pathway: any) => ({
          category: normalizeResultText(pathway?.category || pathway?.name, "Recommended Pathway"),
          careers: normalizeResultArray(pathway?.careers ?? pathway?.courses ?? pathway?.items),
        }))
      : electives.map((elective) => ({
          category: elective,
          careers: getSuggestedCoursesForPublicResult(track, elective),
        })).filter((pathway) => pathway.careers.length > 0);

    return (
      <div className="min-h-screen p-4 sm:p-6 lg:p-8" style={{ backgroundColor: "var(--electron-light-gray)" }}>
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" style={{ backgroundColor: trackColor }}>
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-3" style={{ color: "var(--electron-dark-gray)" }}>
              Assessment Complete!
            </h1>
            <p className="text-xl text-gray-600">Here are your personalized results</p>
          </div>

          {/* Main Results Card */}
          <div className="bg-white rounded-xl shadow-lg p-5 sm:p-8 mb-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column - Track Recommendation */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <Award className="w-8 h-8" style={{ color: trackColor }} />
                  <h2 className="text-2xl font-bold" style={{ color: "var(--electron-dark-gray)" }}>
                    Recommended Track
                  </h2>
                </div>
                <div
                  className="p-6 rounded-xl border-2 mb-6"
                  style={{ borderColor: trackColor, backgroundColor: `${trackColor}10` }}
                >
                  <h3 className="text-3xl font-bold mb-2" style={{ color: trackColor }}>
                    {track}
                  </h3>
                  <p className="text-gray-600">
                    {track === "Academic"
                      ? "Prepares you for college and university education"
                      : "Develops technical and vocational skills for immediate employment"}
                  </p>
                </div>

                {/* Elective Subjects */}
                <div className="mb-6">
                  <h3 className="text-xl font-bold mb-4" style={{ color: "var(--electron-dark-gray)" }}>
                    Recommended Electives
                  </h3>
                  <div className="space-y-3">
                    {electives.map((elective, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: trackColor }} />
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800">{elective}</p>
                          {getSuggestedCoursesForPublicResult(track, elective).length > 0 && (
                            <p className="text-sm text-gray-500 mt-1">
                              Leads to: {getSuggestedCoursesForPublicResult(track, elective).join(", ")}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column - Performance Scores */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <BarChart3 className="w-8 h-8" style={{ color: trackColor }} />
                  <h2 className="text-2xl font-bold" style={{ color: "var(--electron-dark-gray)" }}>
                    Your Scores
                  </h2>
                </div>

                {/* Overall Score */}
                <div className="mb-6 p-6 rounded-xl" style={{ backgroundColor: `${trackColor}10` }}>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-600 mb-2">Overall Score</p>
                    <p className="text-5xl font-bold mb-1" style={{ color: trackColor }}>
                      {overallScore}%
                    </p>
                    <p className="text-sm text-gray-500">
                      {overallScore >= 80 ? "Excellent" : overallScore >= 60 ? "Good" : "Fair"}
                    </p>
                  </div>
                </div>

                {/* Domain Breakdown */}
                <div className="space-y-4">
                  {[
                    { name: "Verbal Aptitude", score: scores.VA, icon: Brain },
                    { name: "Mathematical", score: scores.MA, icon: Calculator },
                    { name: "Science", score: scores.SA, icon: Beaker },
                    { name: "Logical Reasoning", score: scores.LRA, icon: Lightbulb },
                  ].map((domain) => {
                    const Icon = domain.icon;
                    return (
                      <div key={domain.name}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">{domain.name}</span>
                          </div>
                          <span className="text-sm font-bold" style={{ color: trackColor }}>
                            {Math.round(domain.score)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all"
                            style={{
                              width: `${domain.score}%`,
                              backgroundColor: trackColor,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Strengths Summary */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h3 className="text-xl font-bold mb-4" style={{ color: "var(--electron-dark-gray)" }}>
                Your Profile Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-6 h-6 mt-1 flex-shrink-0" style={{ color: trackColor }} />
                  <div>
                    <p className="font-semibold text-gray-800 mb-1">Top Strengths</p>
                    <p className="text-gray-600">{topDomains.join(", ")}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Heart className="w-6 h-6 mt-1 flex-shrink-0" style={{ color: secondaryColor }} />
                  <div>
                    <p className="font-semibold text-gray-800 mb-1">Key Interests</p>
                    <p className="text-gray-600">{topInterests.join(", ")}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Explanation and Career Pathways */}
          <div className="bg-white rounded-xl shadow-lg p-5 sm:p-8 mb-6">
            <div className="mb-6 flex items-center gap-3">
              <Sparkles className="h-8 w-8" style={{ color: trackColor }} />
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-700">AI Analysis</p>
                <h2 className="text-2xl font-bold" style={{ color: "var(--electron-dark-gray)" }}>
                  Why this recommendation fits you
                </h2>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
                <p className="text-base leading-7 text-slate-700">{aiExplanation}</p>
                <p className="mt-4 text-sm leading-6 text-slate-600">{trackExplanation}</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="font-bold text-slate-900">Recommended Pathways</h3>
                <div className="mt-4 space-y-3">
                  {careerPathways.length > 0 ? (
                    careerPathways.slice(0, 4).map((pathway: any, index: number) => (
                      <div key={`${pathway.category}-${index}`} className="rounded-xl bg-slate-50 p-3">
                        <p className="text-sm font-bold text-slate-900">{pathway.category}</p>
                        <p className="mt-1 text-sm text-slate-600">
                          {normalizeResultArray(pathway.careers).join(", ")}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-600">
                      Your recommended track and electives can open study and career options connected to your strengths and interests.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Available Tracks */}
          <div className="bg-white rounded-xl shadow-lg p-5 sm:p-8 mb-6">
            <h2 className="text-2xl font-bold mb-6" style={{ color: "var(--electron-dark-gray)" }}>
              Available Academic Tracks
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border-2 rounded-xl p-6" style={{ borderColor: "var(--electron-blue)" }}>
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: "var(--electron-blue)" }}>
                    GA
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-1" style={{ color: "var(--electron-blue)" }}>
                      Academic
                    </h3>
                    <p className="text-sm text-gray-600">
                      College preparatory education with emphasis on academic subjects
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-700">Sample Electives:</p>
                  <div className="flex flex-wrap gap-2">
                    {["STEM", "Business", "Humanities", "Arts", "Sports"].map((elective) => (
                      <span key={elective} className="px-3 py-1 text-xs font-medium rounded-full text-white" style={{ backgroundColor: "var(--electron-blue)" }}>
                        {elective}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-2 rounded-xl p-6" style={{ borderColor: "var(--electron-red)" }}>
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold" style={{ backgroundColor: "var(--electron-red)" }}>
                    TP
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-1" style={{ color: "var(--electron-red)" }}>
                      Technical-Professional
                    </h3>
                    <p className="text-sm text-gray-600">
                      Technical and vocational skills for immediate employment
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-700">Sample Electives:</p>
                  <div className="flex flex-wrap gap-2">
                    {["ICT", "Culinary", "Automotive", "Agriculture"].map((elective) => (
                      <span key={elective} className="px-3 py-1 text-xs font-medium rounded-full text-white" style={{ backgroundColor: "var(--electron-red)" }}>
                        {elective}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Save Result */}
          <div className="bg-white rounded-xl shadow-lg p-5 sm:p-8 mb-6">
            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
              <div>
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-blue-800">
                  <FileText className="h-4 w-4" />
                  Optional Save
                </div>
                <h2 className="text-2xl font-bold" style={{ color: "var(--electron-dark-gray)" }}>
                  Save your assessment results
                </h2>
                <p className="mt-3 leading-7 text-gray-600">
                  Save your assessment results to your email so you can access them later or use them when creating your student account.
                </p>
                <p className="mt-3 text-sm text-gray-500">
                  If your email already has an official assessment result, we will preserve the existing result and will not overwrite it.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">Full Name</label>
                    <input
                      type="text"
                      value={saveInfo.fullName}
                      onChange={(event) => {
                        setSaveInfo((current) => ({ ...current, fullName: event.target.value }));
                        setSaveErrors((current) => ({ ...current, fullName: "" }));
                      }}
                      className={`w-full rounded-xl border-2 bg-white px-4 py-3 text-sm outline-none transition-all focus:ring-2 ${
                        saveErrors.fullName ? "border-red-300 focus:ring-red-200" : "border-gray-200 focus:ring-blue-200"
                      }`}
                      placeholder="Your full name"
                    />
                    {saveErrors.fullName && <p className="mt-2 text-sm text-red-600">{saveErrors.fullName}</p>}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">Email Address</label>
                    <input
                      type="email"
                      value={saveInfo.email}
                      onChange={(event) => {
                        setSaveInfo((current) => ({ ...current, email: event.target.value.trimStart().toLowerCase() }));
                        setSaveErrors((current) => ({ ...current, email: "" }));
                      }}
                      className={`w-full rounded-xl border-2 bg-white px-4 py-3 text-sm outline-none transition-all focus:ring-2 ${
                        saveErrors.email ? "border-red-300 focus:ring-red-200" : "border-gray-200 focus:ring-blue-200"
                      }`}
                      placeholder="name@example.com"
                    />
                    {saveErrors.email && <p className="mt-2 text-sm text-red-600">{saveErrors.email}</p>}
                  </div>
                </div>

                <button
                  onClick={handleSaveResult}
                  disabled={saveStatus === "saving" || saveStatus === "saved"}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
                  style={{ backgroundColor: "var(--electron-blue)" }}
                >
                  {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Result Saved" : "Save Result to Email"}
                </button>

                {saveMessage && (
                  <div
                    className={`mt-4 rounded-xl border p-4 text-sm font-medium ${
                      saveStatus === "error"
                        ? "border-red-200 bg-red-50 text-red-700"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {saveMessage}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-white rounded-xl shadow-lg p-5 sm:p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2" style={{ color: "var(--electron-dark-gray)" }}>
                Ready to Enroll?
              </h2>
              <p className="text-gray-600">
                Create an account or log in to continue with your enrollment application
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="w-full sm:w-auto px-6 sm:px-8 py-4 rounded-lg text-white font-semibold transition-all shadow-md hover:opacity-90 flex items-center justify-center gap-2"
                style={{ backgroundColor: "var(--electron-blue)" }}
              >
                <FileText className="w-5 h-5" />
                Create Account & Enroll
              </Link>
              <Link
                to="/login"
                state={{ fromPublicLogin: true }}
                className="w-full sm:w-auto px-6 sm:px-8 py-4 rounded-lg font-semibold transition-all shadow-md flex items-center justify-center gap-2"
                style={{
                  backgroundColor: "white",
                  color: "var(--electron-blue)",
                  border: "2px solid var(--electron-blue)"
                }}
              >
                <ArrowRight className="w-5 h-5" />
                Login to Continue
              </Link>
            </div>
            <p className="text-center text-sm text-gray-500 mt-6">
              💡 Your assessment results will be linked to your account when you log in. Retakes are disabled after completion.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const currentSectionData = sections[currentSection];
  const totalQuestions = sections.reduce((sum, section) => sum + section.questions.length, 0);
  const answeredQuestions = sections.reduce((sum, section) => {
    return sum + section.questions.filter((question) => isQuestionAnswered(question)).length;
  }, 0);
  const progress = (answeredQuestions / totalQuestions) * 100;
  const remainingQuestions = Math.max(totalQuestions - answeredQuestions, 0);
  const assessmentHighlights = [
    {
      title: "AI-guided track fit",
      description: "Discover whether the Academic or Technical-Professional path matches your current strengths.",
      icon: Sparkles,
      accent: "from-[#1E3A8A] to-[#2563EB]",
    },
    {
      title: "Elective subject matches",
      description: "See which subjects align with the way you think, solve problems, and learn.",
      icon: BookOpen,
      accent: "from-[#2563EB] to-[#0EA5E9]",
    },
    {
      title: "Career direction signals",
      description: "Preview study and career pathways connected to your recommended strand and electives.",
      icon: Briefcase,
      accent: "from-[#B91C1C] to-[#EF4444]",
    },
  ];

  const handleAnswer = (questionId: number, answerIndex: number) => {
    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      [questionId]: answerIndex,
    }));
  };

  const handleNext = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
    }
  };

  const handlePrevious = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      const questionsByCategory: Record<string, Question[]> = {
      Verbal: [],
      Math: [],
      Science: [],
      Logical: [],
      Interests: [],
    };

    sections.forEach((section) => {
      if (questionsByCategory[section.name] !== undefined) {
        questionsByCategory[section.name] = section.questions;
      }
    });

    const formattedResult = await formatAssessmentResult(answers, questionsByCategory as any);
    if (!formattedResult) {
      console.error("❌ Error formatting public assessment result");
      return;
    }

    const VA = formattedResult.scores.verbal_ability_score;
    const MA = formattedResult.scores.mathematical_ability_score;
    const SA = formattedResult.scores.spatial_ability_score;
    const LRA = formattedResult.scores.logical_reasoning_score;
    const academicInterest = formattedResult.interestClusters?.academic || 0;
    const communicationInterest =
      Math.round(((formattedResult.interestClusters?.creative || 0) + (formattedResult.interestClusters?.helping || 0)) / 2);
    const creativeInterest = formattedResult.interestClusters?.creative || 0;
    const leadershipInterest = formattedResult.interestClusters?.business || 0;
    const technicalInterest = formattedResult.interestClusters?.tech || 0;
    const socialInterest = formattedResult.interestClusters?.helping || 0;
    const recommendedTrack = formattedResult.track;
    let aiRecommendation: any = null;

    try {
      aiRecommendation = await requestAssessmentAiRecommendation({
        track: recommendedTrack,
        VA,
        MA,
        SA,
        LRA,
        academicInterest,
        communicationInterest,
        creativeInterest,
        leadershipInterest,
        technicalInterest,
        socialInterest,
      });
    } catch (error) {
      console.error("Public assessment AI recommendation failed; using scoring fallback:", error);
    }

    if (aiRecommendation && !aiRecommendation.raw) {
      const aiElectives = normalizeResultArray([aiRecommendation.elective1, aiRecommendation.elective2]);

      const aiTrack = normalizeResultText(aiRecommendation.recommendedTrack);
      formattedResult.track = aiTrack || formattedResult.track;
      formattedResult.recommended_track = aiTrack || formattedResult.recommended_track;
      formattedResult.electives = aiElectives.length > 0 ? aiElectives : formattedResult.electives;
      formattedResult.elective_1 = aiElectives[0] || formattedResult.elective_1;
      formattedResult.elective_2 = aiElectives[1] || formattedResult.elective_2;
    }

    const assessmentResult: AssessmentResult = {
      track: formattedResult.track,
      electives: formattedResult.electives,
      scores: {
        VA: formattedResult.scores.verbal_ability_score,
        MA: formattedResult.scores.mathematical_ability_score,
        SA: formattedResult.scores.spatial_ability_score,
        LRA: formattedResult.scores.logical_reasoning_score,
      },
      topDomains: formattedResult.topDomains,
      topInterests: formattedResult.topInterests,
      overallScore: formattedResult.scores.overall_score,
      aiRecommendation,
    };

    const normalizedResult = normalizeAssessmentResult(assessmentResult);
    if (!normalizedResult) {
      console.error("Public assessment result normalization failed");
      return;
    }

    localStorage.setItem("publicAssessmentResults", JSON.stringify(normalizedResult));
    localStorage.removeItem(assessmentProgressKey);
    localStorage.removeItem("publicAssessmentProgress_guest");

    setResults(normalizedResult);
    setAssessmentCompleted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("Public assessment submission failed:", error);
    }
  };

  const handleStartAssessment = () => {
    setAssessmentStarted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  async function handleSaveResult() {
    if (!results) return;

    const nextErrors = { fullName: "", email: "" };
    const normalizedEmail = saveInfo.email.trim().toLowerCase();
    let hasError = false;

    if (!saveInfo.fullName.trim()) {
      nextErrors.fullName = "Full name is required.";
      hasError = true;
    }

    if (!normalizedEmail) {
      nextErrors.email = "Email address is required.";
      hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      nextErrors.email = "Please enter a valid email address.";
      hasError = true;
    }

    setSaveErrors(nextErrors);
    if (hasError) return;

    setSaveStatus("saving");
    setSaveMessage("");
    localStorage.setItem(
      `publicAssessment_${normalizedEmail}`,
      JSON.stringify({ ...results, userInfo: { fullName: saveInfo.fullName.trim(), email: normalizedEmail }, timestamp: new Date().toISOString() })
    );

    try {
      const response = await savePublicAssessmentResult({
        fullName: saveInfo.fullName.trim(),
        email: normalizedEmail,
        assessmentData: results,
      });
      setSaveInfo((current) => ({ ...current, email: normalizedEmail }));
      setSaveStatus("saved");
      setSaveMessage(response?.message || "Your assessment result has been saved.");
    } catch (error: any) {
      setSaveStatus("error");
      setSaveMessage(
        error?.message ||
          "Your result was saved in this browser, but it could not be saved to the database right now."
      );
    }
  }

  const allCurrentQuestionsAnswered = currentSectionData.questions.every(
    (question) => isQuestionAnswered(question)
  );

  const isLastSection = currentSection === sections.length - 1;

  // Start Assessment Screen - shown before assessment begins
  if (!assessmentStarted) {
    return (
      <div>
        <section
          className="relative overflow-hidden py-28 text-white"
          style={{
            background: "linear-gradient(135deg, #1E3A8A 0%, #1e40af 50%, #2563eb 100%)",
          }}
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute left-10 top-20 h-72 w-72 rounded-full bg-white blur-3xl" />
            <div className="absolute bottom-20 right-10 h-96 w-96 rounded-full bg-white blur-3xl" />
          </div>

          <div className="relative z-10 mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-yellow-300" />
              <span className="text-sm font-medium">AI-guided strand discovery</span>
            </div>

            <h1 className="mb-6 text-5xl font-bold tracking-tight md:text-7xl">
              Track Recommendation Assessment
            </h1>
            <p className="mx-auto max-w-3xl text-xl font-light text-blue-100 md:text-2xl">
              Discover the strand, electives, and learning direction that best fit your strengths before you enroll.
            </p>
          </div>
        </section>

        <section className="bg-white py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl text-center">
              <h2 className="mb-6 text-4xl font-bold md:text-5xl" style={{ color: "#1E3A8A" }}>
                Start your AI assessment
              </h2>
              <p className="mb-8 text-lg leading-relaxed text-gray-600">
                This guided assessment evaluates how you think, solve problems, and respond to different learning situations so Electron College can recommend the track that suits you best.
              </p>
              <div
                className="inline-block rounded-lg px-8 py-4 text-lg font-semibold text-white shadow-lg"
                style={{ backgroundColor: "#B91C1C" }}
              >
                {totalQuestions} Questions • {sections.length} Focus Areas • No Login Required
              </div>
            </div>
          </div>
        </section>

        <section className="py-20" style={{ backgroundColor: "#F8FAFC" }}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-4xl font-bold md:text-5xl" style={{ color: "#1E3A8A" }}>
                What you will get
              </h2>
              <p className="mx-auto max-w-3xl text-lg text-gray-600">
                The assessment gives you a clearer direction before you submit enrollment requirements.
              </p>
              <div className="mx-auto mt-4 h-1 w-24 rounded-full" style={{ backgroundColor: "#B91C1C" }}></div>
            </div>

            <div className="grid gap-6 lg:grid-cols-4">
                  {assessmentHighlights.map((highlight, index) => {
                    const HighlightIcon = highlight.icon;
                    const accentColor = index % 2 === 0 ? "#1E3A8A" : "#B91C1C";

                    return (
                      <div key={highlight.title} className="rounded-2xl bg-white p-6 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl xl:p-8">
                        <div
                          className="mb-4 flex h-16 w-16 items-center justify-center rounded-full shadow-md"
                          style={{ backgroundColor: accentColor }}
                        >
                          <HighlightIcon className="h-8 w-8 text-white" />
                        </div>
                        <h3 className="mb-3 text-xl font-bold text-gray-900 xl:text-2xl">{highlight.title}</h3>
                        <p className="leading-relaxed text-gray-600">{highlight.description}</p>
                      </div>
                    );
                  })}

              <div className="rounded-2xl bg-white p-6 shadow-lg xl:p-8">
                <h3 className="mb-4 text-xl font-bold xl:text-2xl" style={{ color: "#1E3A8A" }}>
                  Assessment coverage
                </h3>
                <div className="flex flex-wrap gap-3">
                  {sections.map((section) => {
                    const SectionIcon = section.icon;
                    return (
                      <div key={section.name} className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-900">
                        <SectionIcon className="h-4 w-4" />
                        {section.name}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mx-auto mt-12 max-w-3xl rounded-2xl bg-white p-6 text-center shadow-xl sm:p-8">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1E3A8A] text-white shadow-lg">
                <Brain className="h-6 w-6" />
              </div>
              <p className="text-sm font-bold tracking-[0.16em] text-red-600 uppercase">Start Here</p>
              <h2 className="mt-3 text-3xl font-bold text-gray-900">Begin Assessment Instantly</h2>
              <p className="mx-auto mt-2 max-w-2xl text-gray-600">
                No sign-up, email, or personal information is needed before you start. You can save your results after seeing your recommendation.
              </p>

              <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-5">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-2xl font-bold text-blue-900">{totalQuestions}</p>
                    <p className="mt-1 text-xs font-semibold text-blue-700">Questions</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-900">{sections.length}</p>
                    <p className="mt-1 text-xs font-semibold text-blue-700">Focus Areas</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-900">0</p>
                    <p className="mt-1 text-xs font-semibold text-blue-700">Forms First</p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleStartAssessment}
                className="mx-auto mt-6 flex w-full max-w-md items-center justify-center gap-3 rounded-2xl px-6 py-5 text-lg font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl"
                style={{ backgroundColor: "var(--electron-blue)" }}
              >
                Start Assessment
                <ArrowRight className="h-5 w-5" />
              </button>

              <p className="mt-5 text-center text-sm text-gray-500">
                Your results appear immediately after the final section. Saving by email happens only after you choose to save.
              </p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Main Assessment UI
  return (
    <div>
      <section
        className="relative overflow-hidden py-20 text-white"
        style={{
          background: "linear-gradient(135deg, #1E3A8A 0%, #1e40af 50%, #2563eb 100%)",
        }}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute left-10 top-16 h-64 w-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-10 right-10 h-72 w-72 rounded-full bg-white blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-yellow-300" />
            <span className="text-sm font-medium">Assessment in progress</span>
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-6xl">
            Track Recommendation Assessment
          </h1>
          <p className="mx-auto max-w-3xl text-lg text-blue-100 md:text-xl">
            Work through each section in order. Your answers are used to build your final track and elective recommendation.
          </p>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="mb-4 text-4xl font-bold" style={{ color: "#1E3A8A" }}>
              {currentSectionData.name} Section
            </h2>
            <p className="text-lg text-gray-600">
              You have answered {answeredQuestions} of {totalQuestions} questions. Keep going to unlock your final recommendation.
            </p>
            <div
              className="mt-8 inline-block rounded-lg px-8 py-4 text-lg font-semibold text-white shadow-lg"
              style={{ backgroundColor: "#B91C1C" }}
            >
              Section {currentSection + 1} of {sections.length} • {remainingQuestions} Questions Remaining
            </div>
          </div>
        </div>
      </section>

      <section className="py-16" style={{ backgroundColor: "#F8FAFC" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="mb-6 rounded-2xl bg-white p-6 shadow-lg sm:p-8">
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold" style={{ color: "#1E3A8A" }}>
                    Assessment Progress
                  </h2>
                  <p className="mt-2 text-gray-600">Move through each focus area in order.</p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-900">
                  <TrendingUp className="h-4 w-4" />
                  {Math.round(progress)}% Complete
                </div>
              </div>

              <div className="relative overflow-x-auto pb-2">
                <div className="relative flex min-w-[720px] justify-between gap-4">
            {sections.map((section, index) => {
              const Icon = section.icon;
              const isActive = index === currentSection;
              const isCompleted = index < currentSection;

              return (
                <div key={index} className="relative z-10 flex flex-1 flex-col items-center">
                  <div
                    className={`mb-2 flex h-12 w-12 items-center justify-center rounded-full transition-all ${
                      isActive
                        ? "text-white shadow-lg"
                        : isCompleted
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}
                    style={
                      isActive ? { backgroundColor: "var(--electron-blue)" } : {}
                    }
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      isActive
                        ? "text-blue-900"
                        : isCompleted
                        ? "text-green-600"
                        : "text-gray-500"
                    }`}
                  >
                    {section.name}
                  </span>
                </div>
              );
            })}
            
            {/* Connecting Lines */}
            <div className="absolute left-0 right-0 top-6 -z-10 flex items-center px-12">
              {sections.slice(0, -1).map((_, index) => (
                <div
                  key={index}
                  className={`flex-1 h-1 transition-colors ${
                    index < currentSection ? "bg-green-500" : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
            </div>
              </div>
            </div>

            <div className="mb-6 rounded-2xl bg-white p-6 shadow-lg sm:p-8">
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2
                    className="text-2xl font-bold"
                    style={{ color: "var(--electron-dark-gray)" }}
                  >
                    {currentSectionData.name}
                  </h2>
                  <p className="mt-2 text-gray-600">
                    {currentSectionData.name === "Interests"
                      ? "Rate each statement using the 5-point scale before moving to the next section."
                      : "Answer every question carefully before moving to the next section."}
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
                  <BarChart3 className="h-4 w-4" />
                  {currentSectionData.questions.length} Questions
                </div>
              </div>

              <div className="space-y-8">
                {currentSectionData.questions.map((question, qIndex) => (
                  <div key={question.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
                      Question {qIndex + 1}
                    </div>
                    <p className="mb-4 text-lg font-medium text-gray-800">
                      {qIndex + 1}. {question.question}
                    </p>

                    {isInterestQuestion(question) ? (
                      <div>
                        <div className="mb-4 flex flex-col gap-2 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm text-blue-900 sm:flex-row sm:items-center sm:justify-between">
                          <span className="font-semibold">Choose the response that best matches you.</span>
                          <span className="text-xs font-medium text-blue-700">Higher ratings mean stronger agreement.</span>
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-5">
                          {question.options.map((option, optIndex) => {
                            const ratingValue = 5 - optIndex;
                            const isSelected = answers[question.id] === ratingValue;

                            return (
                              <label
                                key={optIndex}
                                className={`flex min-h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 px-3 py-4 text-center transition-all ${
                                  isSelected
                                    ? "border-blue-500 bg-blue-50 text-blue-900 shadow-sm ring-2 ring-blue-100"
                                    : "border-gray-300 bg-white text-gray-700 hover:border-blue-300"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`interest-${question.id}`}
                                  checked={isSelected}
                                  onChange={() => handleAnswer(question.id, ratingValue)}
                                  className="h-5 w-5 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-200"
                                />
                                <span className="text-lg font-bold leading-none">{ratingValue}</span>
                                <span className="text-xs font-semibold leading-5">{option.replace(/^\d+\s*-\s*/, "")}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {question.options.map((option, optIndex) => (
                          <button
                            key={optIndex}
                            onClick={() => handleAnswer(question.id, optIndex)}
                            className={`rounded-xl border-2 px-4 py-3.5 text-left transition-all ${
                              answers[question.id] === optIndex
                                ? "text-white shadow-md"
                                : "border-gray-300 bg-white text-gray-700 hover:border-blue-300"
                            }`}
                            style={
                              answers[question.id] === optIndex
                                ? { backgroundColor: "var(--electron-blue)", borderColor: "var(--electron-blue)" }
                                : {}
                            }
                          >
                            <span className="font-semibold mr-2">
                              {String.fromCharCode(97 + optIndex)}.
                            </span>
                            {option}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <button
                  onClick={handlePrevious}
                  disabled={currentSection === 0}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border-2 px-6 py-3 font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    borderColor: "var(--electron-blue)",
                    color: "var(--electron-blue)",
                  }}
                >
                  <ChevronLeft className="w-5 h-5" />
                  Previous
                </button>

                {!allCurrentQuestionsAnswered && (
                  <p className="text-center text-sm text-gray-500 sm:text-left">
                    {currentSectionData.name === "Interests"
                      ? "Rate every interest statement to continue."
                      : "Answer every question in this section to continue."}
                  </p>
                )}

                {isLastSection ? (
                  <button
                    onClick={handleSubmit}
                    disabled={!allCurrentQuestionsAnswered}
                    className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-white font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 shadow-lg"
                    style={{
                      backgroundColor: "var(--electron-blue)",
                    }}
                  >
                    Submit Assessment
                    <CheckCircle className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    disabled={!allCurrentQuestionsAnswered}
                    className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-white font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50"
                    style={{
                      backgroundColor: "var(--electron-blue)",
                    }}
                  >
                    Next
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
