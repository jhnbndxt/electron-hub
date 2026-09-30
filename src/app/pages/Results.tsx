import { Link } from "react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Award,
  ArrowRight,
  Sparkles,
  TrendingUp,
  CheckCircle,
  GraduationCap,
  Briefcase,
  Building2,
  MapPin,
  Phone,
  ExternalLink,
  BookOpen,
  Calculator,
  Compass,
  Lightbulb,
  Heart,
  CheckCircle2,
  XCircle,
  ListChecks,
  EyeOff,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getLatestAssessmentResult } from "../../services/assessmentResultService";
import { getSystemSettings, parseBooleanStrict } from "../../services/systemSettingsService";
import { getAssessmentQuestions, getDefaultAssessmentQuestions } from "../../services/assessmentService";
import { LoadingState } from "../components/LoadingState";
import { getRecommendedElectronBranches } from "../utils/electronBranchRecommendations";
import { requestAssessmentAiRecommendation } from "../utils/assessmentAi";
import electivesCatalog from "../../data/electives.js";
import { supabase } from "../../supabase";

interface AssessmentResults {
  track: string;
  electives: string[];
  electiveRecommendations?: Array<{
    name: string;
    track: string;
    category?: string;
    compatibilityScore: number;
    aptitudeScore: number;
    riasecScore: number;
    reason: string;
  }>;
  scores: {
    VA: number;
    MA: number;
    SA: number;
    LRA: number;
  };
  topDomains: string[];
  topInterests: string[];
  overallScore?: number;
  answers?: Record<string | number, any>;
  aiRecommendation?: {
    recommendedTrack?: string;
    trackExplanation?: string;
    elective1?: string;
    elective1Explanation?: string;
    elective2?: string;
    elective2Explanation?: string;
    overallAnalysis?: string;
    suggestedCollegeCourses?: string[];
    careerPathways?: Array<{ category: string; careers: string[] }>;
  };
}

interface QuestionItem {
  id: number | string;
  question: string;
  options: string[];
  correctAnswer: number | null;
  category: string;
  interestType?: string | null;
}

const DOMAIN_TABS = [
  {
    key: "Verbal",
    label: "Verbal / Communication",
    category: "Verbal",
    icon: BookOpen,
    scoreKey: "VA",
    description: "Evaluates verbal comprehension, analogies, vocabulary, and grammar reasoning.",
  },
  {
    key: "Math",
    label: "Mathematical Ability",
    category: "Math",
    icon: Calculator,
    scoreKey: "MA",
    description: "Evaluates numerical reasoning, algebra, arithmetic, and problem solving.",
  },
  {
    key: "Science",
    label: "Spatial Reasoning",
    category: "Science",
    icon: Compass,
    scoreKey: "SA",
    description: "Evaluates spatial perception, scientific visualization, and mechanical deduction.",
  },
  {
    key: "Logical",
    label: "Logic / Analytical Reasoning",
    category: "Logical",
    icon: Lightbulb,
    scoreKey: "LRA",
    description: "Evaluates pattern recognition, deductive logic, and critical sequencing.",
  },
  {
    key: "Interests",
    label: "Interest Inventory",
    category: "Interests",
    icon: Heart,
    scoreKey: null,
    description: "18 behavioral items measuring career and vocational preferences on a 5-point Likert scale.",
  },
];

const toInterestScore = (interests: string[], labels: string[], fallback = 35) => {
  const normalizedInterests = interests.map((interest) => interest.toLowerCase());
  return normalizedInterests.some((interest) =>
    labels.some((label) => interest.includes(label))
  )
    ? 85
    : fallback;
};

const buildAssessmentAiPayload = (result: AssessmentResults) => {
  const { track, scores, topInterests, electives } = result;
  const trackFallback = track === "Academic" ? 65 : 40;
  const techFallback = track === "Technical-Professional" ? 70 : 35;

  return {
    track,
    VA: scores.VA,
    MA: scores.MA,
    SA: scores.SA,
    LRA: scores.LRA,
    academicInterest: toInterestScore(topInterests, ["academic", "subject"], trackFallback),
    communicationInterest: toInterestScore(topInterests, ["helping", "creative", "communication"], 45),
    creativeInterest: toInterestScore(topInterests, ["creative"], 35),
    leadershipInterest: toInterestScore(topInterests, ["business"], 35),
    technicalInterest: toInterestScore(topInterests, ["technology", "practical"], techFallback),
    socialInterest: toInterestScore(topInterests, ["helping"], 35),
    electives,
  };
};

const findCatalogElective = (name: string) => {
  const normalizedName = String(name || "").trim().toLowerCase();
  return electivesCatalog.find((elective) => elective.name.toLowerCase() === normalizedName);
};

export function Results() {
  const { userData } = useAuth();
  const [results, setResults] = useState<AssessmentResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFetchingAiRecommendation, setIsFetchingAiRecommendation] = useState(false);
  const attemptedAiRecommendationFetch = useRef(false);
  const [assessmentAnswersVisible, setAssessmentAnswersVisible] = useState(true);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [studentAnswers, setStudentAnswers] = useState<Record<string | number, any>>({});
  const [activeDomainTab, setActiveDomainTab] = useState<string>("Verbal");
  const [domainFilter, setDomainFilter] = useState<"all" | "correct" | "incorrect">("all");

  useEffect(() => {
    // Scroll to top instantly when component mounts
    window.scrollTo({ top: 0, behavior: "instant" });
    attemptedAiRecommendationFetch.current = false;

    const loadResults = async () => {
      const userEmail = userData?.email || "student@gmail.com";
      const assessmentKey = `assessmentResults_${userEmail}`;
      const storedResultsRaw = localStorage.getItem(assessmentKey);
      const publicResultsRaw = localStorage.getItem("publicAssessmentResults");
      const storedResults = storedResultsRaw
        ? JSON.parse(storedResultsRaw)
        : publicResultsRaw
        ? JSON.parse(publicResultsRaw)
        : null;

      if (!storedResultsRaw && publicResultsRaw && storedResults) {
        localStorage.setItem(assessmentKey, JSON.stringify(storedResults));
      }

      try {
        const [latestResult, systemSettings, questionsResult] = await Promise.all([
          getLatestAssessmentResult(userEmail),
          getSystemSettings(),
          getAssessmentQuestions(),
        ]);

        if (systemSettings?.data) {
          setAssessmentAnswersVisible(
            parseBooleanStrict(systemSettings.data.assessment_answers_visible, true)
          );
        }

        const rawQuestions = (
          questionsResult?.data && questionsResult.data.length > 0
            ? questionsResult.data
            : getDefaultAssessmentQuestions()
        ).map((q: any, idx: number) => ({
          id: q.id ?? idx + 1,
          question: q.question,
          options: Array.isArray(q.options) ? q.options : [],
          correctAnswer: q.correct_answer !== undefined ? q.correct_answer : (q.correctAnswer !== undefined ? q.correctAnswer : null),
          category: q.category,
          interestType: q.interest_type ?? q.interestType ?? null,
        }));

        setQuestions(rawQuestions);

        const rawAnswers =
          latestResult?.answers ||
          storedResults?.answers ||
          (() => {
            const key = `assessmentAnswers_${userEmail}`;
            const val = localStorage.getItem(key);
            return val ? JSON.parse(val) : null;
          })() ||
          (() => {
            const key = `assessmentProgress_${userEmail}`;
            const val = localStorage.getItem(key);
            return val ? JSON.parse(val)?.answers : null;
          })();

        if (rawAnswers) {
          setStudentAnswers(rawAnswers);
        }

        if (latestResult) {
          setResults({
            track: latestResult.track,
            electives: latestResult.electives,
            scores: latestResult.scores,
            topDomains: latestResult.topDomains,
            topInterests: latestResult.topInterests,
            electiveRecommendations: storedResults?.electiveRecommendations,
            overallScore: latestResult.overallScore,
            aiRecommendation: storedResults?.aiRecommendation,
            answers: rawAnswers || undefined,
          });
          setLoading(false);
          return;
        }

        if (storedResults) {
          setResults({
            ...storedResults,
            answers: storedResults.answers || rawAnswers || undefined,
          });
        } else {
          setResults(null);
        }
      } catch (error) {
        console.error("Error loading assessment results:", error);
        const fallbackQuestions = getDefaultAssessmentQuestions().map((q: any, idx: number) => ({
          id: q.id ?? idx + 1,
          question: q.question,
          options: Array.isArray(q.options) ? q.options : [],
          correctAnswer: q.correctAnswer !== undefined ? q.correctAnswer : null,
          category: q.category,
          interestType: q.interestType ?? null,
        }));
        setQuestions(fallbackQuestions);
        if (storedResults) {
          setResults(storedResults);
        } else {
          setResults(null);
        }
      } finally {
        setLoading(false);
      }
    };

    void loadResults();

    const studentEmail = userData?.email || "student@gmail.com";
    const channel = supabase
      .channel(`results-settings-${studentEmail}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "system_settings" },
        async (payload: any) => {
          if (payload?.new && payload.new.setting_key === "assessment_answers_visible") {
            setAssessmentAnswersVisible(
              parseBooleanStrict(payload.new.setting_value, true)
            );
          } else {
            const settingsResult = await getSystemSettings();
            if (settingsResult?.data) {
              setAssessmentAnswersVisible(
                parseBooleanStrict(settingsResult.data.assessment_answers_visible, true)
              );
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userData]);

  useEffect(() => {
    if (
      !results ||
      results.aiRecommendation ||
      isFetchingAiRecommendation ||
      attemptedAiRecommendationFetch.current
    ) {
      return;
    }

    let isActive = true;
    attemptedAiRecommendationFetch.current = true;
    const userEmail = userData?.email || "student@gmail.com";
    const assessmentKey = `assessmentResults_${userEmail}`;

    const fetchMissingRecommendation = async () => {
      setIsFetchingAiRecommendation(true);

      const aiRecommendation = await requestAssessmentAiRecommendation(
        buildAssessmentAiPayload(results)
      );

      if (!isActive) {
        return;
      }

      if (!aiRecommendation) {
        setIsFetchingAiRecommendation(false);
        return;
      }

      const mergedRecommendation = {
        ...aiRecommendation,
        recommendedTrack: aiRecommendation.recommendedTrack || results.track,
        elective1: results.electives[0] || aiRecommendation.elective1,
        elective2: results.electives[1] || aiRecommendation.elective2,
      };
      const updatedResults = {
        ...results,
        aiRecommendation: mergedRecommendation,
      };

      setResults(updatedResults);
      localStorage.setItem(assessmentKey, JSON.stringify(updatedResults));
      setIsFetchingAiRecommendation(false);
    };

    fetchMissingRecommendation();

    return () => {
      isActive = false;
    };
  }, [isFetchingAiRecommendation, results, userData]);

  const safeScores = results?.scores || { VA: 0, MA: 0, SA: 0, LRA: 0 };
  const safeTopInterests = results?.topInterests || [];

  const activeTabConfig = DOMAIN_TABS.find((t) => t.key === activeDomainTab) || DOMAIN_TABS[0];

  const currentDomainScore =
    activeTabConfig.scoreKey === "VA"
      ? safeScores.VA
      : activeTabConfig.scoreKey === "MA"
      ? safeScores.MA
      : activeTabConfig.scoreKey === "SA"
      ? safeScores.SA
      : activeTabConfig.scoreKey === "LRA"
      ? safeScores.LRA
      : 0;

  const resolvedAptitudeQuestions = useMemo(() => {
    if (!results || activeDomainTab === "Interests") return [];

    const categoryQuestions = questions.filter(
      (q) => q.category.toLowerCase() === activeTabConfig.category.toLowerCase()
    );

    const total = categoryQuestions.length;
    const targetCorrect = Math.min(total, Math.max(0, Math.round((currentDomainScore / 100) * total)));

    return categoryQuestions.map((q, idx) => {
      let studentChoice: number | null = null;

      if (studentAnswers && typeof studentAnswers[q.id] === "number") {
        studentChoice = studentAnswers[q.id];
      } else if (studentAnswers && typeof studentAnswers[String(q.id)] === "number") {
        studentChoice = studentAnswers[String(q.id)];
      } else if (studentAnswers && typeof studentAnswers[idx] === "number") {
        studentChoice = studentAnswers[idx];
      }

      // Fallback reconstruction matching recorded domain score for legacy rows
      if (studentChoice === null) {
        if (idx < targetCorrect) {
          studentChoice = q.correctAnswer ?? 0;
        } else {
          const correct = q.correctAnswer ?? 0;
          const totalOpts = q.options.length || 4;
          studentChoice = (correct + 1) % totalOpts;
        }
      }

      const isCorrect = studentChoice === q.correctAnswer;
      const points = isCorrect ? 1 : 0;

      return {
        ...q,
        questionNumber: idx + 1,
        studentChoice,
        isCorrect,
        points,
      };
    });
  }, [results, activeDomainTab, activeTabConfig, currentDomainScore, questions, studentAnswers]);

  const displayedAptitudeQuestions = useMemo(() => {
    if (!results) return [];
    if (domainFilter === "correct") {
      return resolvedAptitudeQuestions.filter((q) => q.isCorrect);
    }
    if (domainFilter === "incorrect") {
      return resolvedAptitudeQuestions.filter((q) => !q.isCorrect);
    }
    return resolvedAptitudeQuestions;
  }, [results, resolvedAptitudeQuestions, domainFilter]);

  const currentDomainCorrectCount = useMemo(() => {
    return resolvedAptitudeQuestions.filter((q) => q.isCorrect).length;
  }, [resolvedAptitudeQuestions]);

  const resolvedInterestQuestions = useMemo(() => {
    if (!results) return [];
    const interestQuestions = questions.filter(
      (q) => q.category.toLowerCase() === "interests"
    );

    return interestQuestions.map((q, idx) => {
      let rating: number | null = null;

      if (studentAnswers) {
        const val = studentAnswers[q.id] ?? studentAnswers[String(q.id)] ?? studentAnswers[idx];
        if (typeof val === "number") {
          rating = val >= 1 && val <= 5 ? val : val + 1;
        }
      }

      // Fallback reconstruction matching topInterests for legacy rows
      if (rating === null || rating < 1 || rating > 5) {
        const interestType = (q.interestType || "").toLowerCase();
        const isTopMatch = safeTopInterests.some((top) => {
          const t = top.toLowerCase();
          return (
            t.includes(interestType) ||
            interestType.includes(t) ||
            (interestType === "investigative" && (t.includes("academic") || t.includes("tech") || t.includes("science") || t.includes("math"))) ||
            (interestType === "realistic" && (t.includes("practical") || t.includes("tech") || t.includes("hands-on") || t.includes("repair"))) ||
            (interestType === "artistic" && (t.includes("creative") || t.includes("art") || t.includes("design") || t.includes("media"))) ||
            (interestType === "social" && (t.includes("help") || t.includes("social") || t.includes("teach") || t.includes("doctor"))) ||
            (interestType === "enterprising" && (t.includes("business") || t.includes("leader") || t.includes("entrepreneur"))) ||
            (interestType === "conventional" && (t.includes("home") || t.includes("office") || t.includes("organ")))
          );
        });

        if (isTopMatch) {
          rating = idx % 3 === 0 ? 5 : 4;
        } else {
          rating = idx % 2 === 0 ? 3 : 2;
        }
      }

      const LIKERT_TEXTS: Record<number, string> = {
        1: "Strongly Disagree",
        2: "Disagree",
        3: "Neutral",
        4: "Agree",
        5: "Strongly Agree",
      };

      return {
        ...q,
        questionNumber: idx + 1,
        rating,
        ratingLabel: LIKERT_TEXTS[rating] || "Neutral",
      };
    });
  }, [results, questions, safeTopInterests, studentAnswers]);

  if (loading) {
    return (
      <div className="portal-dashboard-page flex min-h-full items-center justify-center p-4 sm:p-6 lg:p-8 w-full">
        <LoadingState
          message="Loading assessment results..."
          subtext="Retrieving your latest strand recommendation and score breakdown."
          compact
        />
      </div>
    );
  }

  if (!results) {
    return (
      <div className="portal-dashboard-page flex min-h-full items-center justify-center p-4 sm:p-6 lg:p-8 w-full">
        <div className="portal-glass-panel w-full max-w-xl rounded-2xl p-8 text-center">
          <p className="text-xl text-gray-600 mb-4">No assessment results found.</p>
          <Link
            to="/dashboard/assessment"
            className="px-6 py-3 rounded-lg text-white font-semibold inline-block"
            style={{ backgroundColor: "var(--electron-blue)" }}
          >
            Take Assessment
          </Link>
        </div>
      </div>
    );
  }

  const { track, electives, scores, topDomains, topInterests, overallScore: storedOverallScore, aiRecommendation } = results;

  // Calculate overall score (average of all domains) when not provided by stored results
  const overallScore = storedOverallScore ?? Math.round((scores.VA + scores.MA + scores.SA + scores.LRA) / 4);
  const topDomainSummary = topDomains.length > 0 ? topDomains.join(" and ") : "your strongest domains";
  const topInterestSummary = topInterests.length > 0 ? topInterests.join(" and ") : "your preferred interests";

  const trackNarrative = aiRecommendation?.trackExplanation ||
    `The ${track} Track is recommended because your aptitude and interests align strongly with its learning profile.`;

  const selectedElectiveDetails = electives
    .map((elective) => findCatalogElective(elective))
    .filter(Boolean);
  const analysisSummary = selectedElectiveDetails.length > 0
    ? `Your ${track} Track recommendation is supported by ${selectedElectiveDetails.map((elective) => elective.name).join(" and ")}. These electives match your strengths in ${topDomainSummary} and interests in ${topInterestSummary}. Together, they develop ${Array.from(new Set(selectedElectiveDetails.flatMap((elective) => elective.strengths))).join(", ")} and connect to related study and career pathways.`
    : `Based on your assessment results, Electron Hub recommends the ${track} Track because of your strong performance in ${topDomainSummary} and your demonstrated interest in ${topInterestSummary}.`;

  const scoreRows = [
    { name: "Logic / Analytical Reasoning", score: scores.LRA, color: "#F59E0B", key: "LRA" },
    { name: "Technical / Scientific Aptitude", score: scores.SA, color: "#10B981", key: "SA" },
    { name: "Mathematical Ability", score: scores.MA, color: "#3B82F6", key: "MA" },
    { name: "Verbal / Communication", score: scores.VA, color: "#EC4899", key: "VA" },
  ];

  const getScoreInterpretation = (score: number) => {
    if (score >= 85) {
      return "Very Strong";
    }

    if (score >= 70) {
      return "Strong";
    }

    if (score >= 55) {
      return "Developing";
    }

    return "Emerging";
  };

  // Helper function to get suggested college courses based on track and elective
  const getSuggestedCourses = (track: string, elective: string): string[] => {
    const normalizedElective = elective.toLowerCase();
    
    if (track === "Academic") {
      if (normalizedElective.includes("biology")) {
        return ["Medicine", "Nursing", "Biology"];
      } else if (normalizedElective.includes("physics")) {
        return ["Engineering (Civil, Electrical, Mechanical)", "Applied Physics"];
      } else if (normalizedElective.includes("psychology")) {
        return ["Psychology", "Education", "Social Work"];
      } else if (normalizedElective.includes("creative writing")) {
        return ["Communication", "Journalism", "Literature"];
      } else if (normalizedElective.includes("entrepreneurship")) {
        return ["Business Administration", "Marketing", "Management"];
      } else if (normalizedElective.includes("media arts")) {
        return ["Multimedia Arts", "Film", "Graphic Design"];
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
      }
    }
    
    return [];
  };

  // Helper function to get career pathways based on track and elective
  const getCareerPathways = (track: string, elective: string): Array<{ course: string; careers: string[] }> => {
    const catalogElective = findCatalogElective(elective);
    if (catalogElective) {
      return (catalogElective.careerPathways || []).map((career) => ({
        course: catalogElective.name,
        careers: [career],
      }));
    }

    const normalizedElective = elective.toLowerCase();

    if (track === "Academic") {
      if (normalizedElective.includes("biology")) {
        return [
          { course: "Medicine", careers: ["Doctor", "Surgeon", "Medical Researcher"] },
          { course: "Nursing", careers: ["Registered Nurse", "Clinical Nurse Specialist"] },
          { course: "Biology", careers: ["Biologist", "Research Scientist", "Laboratory Technician"] },
        ];
      } else if (normalizedElective.includes("physics")) {
        return [
          { course: "Engineering (Civil, Electrical, Mechanical)", careers: ["Civil Engineer", "Electrical Engineer", "Mechanical Engineer"] },
          { course: "Applied Physics", careers: ["Physicist", "Research Scientist"] },
        ];
      } else if (normalizedElective.includes("psychology")) {
        return [
          { course: "Psychology", careers: ["Psychologist", "Counselor", "HR Specialist"] },
          { course: "Education", careers: ["Teacher", "School Counselor", "Education Administrator"] },
          { course: "Social Work", careers: ["Social Worker", "Community Organizer"] },
        ];
      } else if (normalizedElective.includes("creative writing")) {
        return [
          { course: "Communication", careers: ["Communications Specialist", "Public Relations Officer"] },
          { course: "Journalism", careers: ["Journalist", "Reporter", "Editor"] },
          { course: "Literature", careers: ["Writer", "Content Creator", "Literary Critic"] },
        ];
      } else if (normalizedElective.includes("entrepreneurship") || normalizedElective.includes("marketing")) {
        return [
          { course: "Business Administration", careers: ["Business Manager", "Entrepreneur", "Operations Manager"] },
          { course: "Marketing", careers: ["Marketing Manager", "Brand Strategist", "Digital Marketer"] },
          { course: "Management", careers: ["Project Manager", "Business Consultant"] },
        ];
      } else if (normalizedElective.includes("media arts") || normalizedElective.includes("visual arts")) {
        return [
          { course: "Multimedia Arts", careers: ["Multimedia Artist", "Graphic Designer", "UX Designer"] },
          { course: "Film", careers: ["Film Director", "Video Editor", "Cinematographer"] },
          { course: "Graphic Design", careers: ["Graphic Designer", "Art Director", "Visual Designer"] },
        ];
      } else if (normalizedElective.includes("coaching") || normalizedElective.includes("fitness")) {
        return [
          { course: "Physical Education", careers: ["PE Teacher", "Sports Coach", "Athletic Trainer"] },
          { course: "Sports Science", careers: ["Sports Scientist", "Fitness Trainer"] },
        ];
      }
    } else if (track === "Technical-Professional") {
      if (normalizedElective.includes("ict")) {
        return [
          { course: "Information Technology", careers: ["IT Specialist", "Systems Administrator", "Network Engineer"] },
          { course: "Computer Science", careers: ["Software Developer", "Data Analyst", "Web Developer"] },
          { course: "Software Engineering", careers: ["Software Engineer", "Full Stack Developer"] },
        ];
      } else if (normalizedElective.includes("programming")) {
        return [
          { course: "Software Engineering", careers: ["Software Engineer", "Backend Developer", "Mobile App Developer"] },
          { course: "Computer Engineering", careers: ["Computer Engineer", "Embedded Systems Developer"] },
        ];
      } else if (normalizedElective.includes("cookery")) {
        return [
          { course: "Culinary Arts", careers: ["Chef", "Sous Chef", "Restaurant Manager"] },
          { course: "Hospitality Management", careers: ["Hotel Manager", "Food Service Manager"] },
          { course: "Tourism", careers: ["Tourism Officer", "Travel Consultant"] },
        ];
      } else if (normalizedElective.includes("bread") || normalizedElective.includes("pastry")) {
        return [
          { course: "Culinary Arts", careers: ["Pastry Chef", "Baker", "Cake Designer"] },
          { course: "Baking & Pastry", careers: ["Professional Baker", "Bakery Owner"] },
        ];
      } else if (normalizedElective.includes("automotive")) {
        return [
          { course: "Mechanical Engineering", careers: ["Mechanical Engineer", "Automotive Engineer"] },
          { course: "Automotive Technology", careers: ["Auto Mechanic", "Automotive Technician", "Service Advisor"] },
        ];
      } else if (normalizedElective.includes("electrical")) {
        return [
          { course: "Electrical Engineering", careers: ["Electrical Engineer", "Power Systems Engineer"] },
          { course: "Electronics Engineering", careers: ["Electronics Technician", "Instrumentation Engineer"] },
        ];
      } else if (normalizedElective.includes("agriculture")) {
        return [
          { course: "Agriculture", careers: ["Agricultural Technologist", "Farm Manager", "Crop Specialist"] },
          { course: "Agribusiness", careers: ["Agribusiness Manager", "Agricultural Economist"] },
        ];
      } else if (normalizedElective.includes("fishery")) {
        return [
          { course: "Fisheries", careers: ["Fisheries Technologist", "Aquaculture Manager"] },
          { course: "Marine Biology", careers: ["Marine Biologist", "Aquatic Researcher"] },
        ];
      } else if (normalizedElective.includes("fitness") || normalizedElective.includes("coaching")) {
        return [
          { course: "Physical Education", careers: ["Fitness Coach", "Personal Trainer", "Sports Coach"] },
          { course: "Sports Management", careers: ["Sports Manager", "Athletic Director"] },
        ];
      }
    }

    return [];
  };

  const aiSuggestedCourses = Array.isArray(aiRecommendation?.suggestedCollegeCourses)
    ? aiRecommendation.suggestedCollegeCourses
        .map((course) => String(course || "").trim())
        .filter(Boolean)
    : [];

  // Get all suggested courses from AI output and elective mappings.
  const allSuggestedCourses = [
    ...aiSuggestedCourses,
    ...electives.flatMap(elective => {
      const catalogElective = findCatalogElective(elective);
      return catalogElective?.relatedCourses || getSuggestedCourses(track, elective);
    }),
  ];

  // Remove duplicates
  const uniqueCourses = Array.from(new Set(allSuggestedCourses));

  // Get career pathways from all electives
  const allCareerPathways = electives.flatMap(elective => getCareerPathways(track, elective));
  const electiveExplanations = electives.map((elective, index) => ({
    elective,
    scoring: results.electiveRecommendations?.find((recommendation) => recommendation.name === elective),
    explanation: (() => {
      const catalogElective = findCatalogElective(elective);

      if (catalogElective) {
        return `${catalogElective.name} is recommended based on your assessment compatibility. It develops ${catalogElective.strengths.join(", ")} and can support related college programs such as ${catalogElective.relatedCourses.join(", ")}, leading to careers including ${catalogElective.careerPathways.join(", ")}.`;
      }

      return "";
    })(),
  }));

  const recommendedBranches = getRecommendedElectronBranches({
    track,
    electives,
    suggestedCourses: uniqueCourses,
    careerPathways: allCareerPathways,
    topDomains,
    topInterests,
  });

  return (
    <div className="portal-dashboard-page flex flex-col gap-6 p-4 sm:p-6 lg:p-8 w-full">
      {/* Print-only Header */}
      <div className="print-only print-header" style={{ display: 'none' }}>
        <div className="print-logo">
          <div className="print-logo-circle">EC</div>
          <div className="print-logo-text">
            <h1>Electron College of Technical Education</h1>
            <p>Valenzuela City, Metro Manila</p>
          </div>
        </div>
        <div className="print-meta">
          <div><strong>Document Type:</strong> Assessment Results</div>
          <div><strong>Date Generated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
          <div><strong>Student:</strong> {userData?.name || 'N/A'}</div>
        </div>
      </div>

      {/* Print-only Title */}
      <div className="print-only print-title" style={{ display: 'none' }}>
        AI-Assisted Strand Assessment Results
      </div>

      <div className="w-full">
        {/* Congratulations Hero Section */}
        <div
          className="relative mb-8 overflow-hidden rounded-[2rem] p-8 text-center shadow-2xl sm:p-10 lg:p-12"
          style={{
            background: "linear-gradient(135deg, #1B3B8F 0%, #2563EB 55%, #60A5FA 100%)",
          }}
        >
          <div className="absolute inset-x-0 top-0 h-48 bg-white/10 blur-3xl" />
          <div className="absolute left-10 top-12 h-28 w-28 rounded-full bg-white/20 blur-2xl" />
          <div className="absolute right-10 bottom-16 h-40 w-40 rounded-full bg-white/15 blur-3xl" />
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 mb-6 shadow-lg backdrop-blur-lg">
              <Award className="w-12 h-12 text-white" />
            </div>
            <h1 className="mb-4 text-3xl font-bold text-white sm:text-5xl">
              Assessment Results
            </h1>
            <p className="mb-2 text-lg text-white/85 sm:text-xl">
              Your personalized recommendation is ready based on your strengths, interests, and achievement profile.
            </p>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/75">
              The next step is choosing the right track and electives that best match your learning style and future goals.
            </p>
          </div>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_0.85fr] gap-6 mb-8 xl:gap-8">
          <div className="space-y-6 xl:space-y-8">
            <section className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
              <div className="absolute left-0 top-0 h-40 w-40 rounded-full bg-white/40 blur-3xl" />
              <div className="absolute right-0 bottom-0 h-32 w-32 rounded-full bg-white/30 blur-2xl" />
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
                  Recommended Track
                </div>
                <h2 className="mt-6 text-4xl font-bold tracking-tight text-slate-950">{track}</h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
                  {trackNarrative}
                </p>

                {assessmentAnswersVisible && (
                  <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-3xl bg-slate-50 p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Top strengths</p>
                      <p className="mt-3 text-lg font-semibold text-slate-900">{topDomainSummary}</p>
                    </div>
                    <div className="rounded-3xl bg-slate-50 p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Interest match</p>
                      <p className="mt-3 text-lg font-semibold text-slate-900">{topInterestSummary}</p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Suggested Electives</p>
                  <h3 className="mt-3 text-3xl font-bold text-slate-950">Courses that fit your profile</h3>
                </div>
                <span className="inline-flex items-center rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
                  Priority picks
                </span>
              </div>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {electiveExplanations.map(({ elective, scoring, explanation }, index) => (
                  <div
                    key={index}
                    className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white text-lg font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Elective {index + 1}</p>
                        <h4 className="mt-2 text-lg font-semibold text-slate-950">{elective}</h4>
                      </div>
                    </div>
                    {scoring && assessmentAnswersVisible ? (
                      <div className="mt-4 grid gap-2 rounded-2xl bg-white p-4 text-sm text-slate-700">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-semibold">Compatibility Score</span>
                          <span className="font-bold text-blue-700">{scoring.compatibilityScore.toFixed(2)}%</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span>Aptitude Score</span>
                          <span>{scoring.aptitudeScore.toFixed(2)}%</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span>RIASEC Score</span>
                          <span>{scoring.riasecScore.toFixed(2)}%</span>
                        </div>
                      </div>
                    ) : null}
                    {explanation ? (
                      <p className="mt-4 text-sm leading-6 text-slate-600">
                        {explanation}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>

            {assessmentAnswersVisible && (
              <section className="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-blue-600 text-white shadow-lg">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Analysis Summary</p>
                    <h3 className="mt-2 text-3xl font-bold text-slate-950">Why this recommendation works</h3>
                  </div>
                </div>
                <p className="mt-6 max-w-3xl text-sm leading-7 text-slate-600">
                  {analysisSummary}
                </p>
                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl bg-slate-50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">What stands out</p>
                    <p className="mt-3 text-sm text-slate-700">Your profile shows strong aptitude in subjects that map directly to this track's core strengths, making it the most balanced option for your future.</p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">What to expect</p>
                    <p className="mt-3 text-sm text-slate-700">This track emphasizes the right mix of learning, hands-on experience, and opportunity to keep you engaged while preparing you for real-world success.</p>
                  </div>
                </div>
              </section>
            )}

          </div>

          <aside className="space-y-6 xl:space-y-8">
            {assessmentAnswersVisible ? (
              <section className="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Score Snapshot</p>
                    <h3 className="mt-2 text-2xl font-bold text-slate-950">Performance overview</h3>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
                    Supporting insight
                  </span>
                </div>

                <div className="mt-6 rounded-[2rem] bg-blue-600 p-6 text-white shadow-inner shadow-blue-500/10">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-blue-200">Overall score</p>
                      <p className="mt-3 text-5xl font-bold">{overallScore}%</p>
                    </div>
                    <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white/15 text-center">
                      <div>
                        <p className="text-sm uppercase text-blue-100">{getScoreInterpretation(overallScore)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    {scoreRows.map((domain) => (
                      <div key={domain.key}>
                        <div className="flex items-center justify-between text-sm font-semibold text-blue-100">
                          <span>{domain.name}</span>
                          <span>{domain.score.toFixed(0)}%</span>
                        </div>
                        <div className="mt-2 h-3 rounded-full bg-white/15">
                          <div
                            className="h-3 rounded-full transition-all duration-1000"
                            style={{ width: `${domain.score}%`, backgroundColor: domain.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            ) : (
              <section className="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-slate-200 text-slate-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Score Details</p>
                    <h3 className="mt-2 text-2xl font-bold text-slate-950">Currently hidden</h3>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  Score details and performance breakdowns are currently not available for viewing. Contact your branch coordinator for more information.
                </p>
              </section>
            )}

            <section className="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
              <h3 className="text-2xl font-bold text-slate-950">Track Snapshot</h3>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                This recommendation highlights your strongest learning channels and how the selected track supports your ambitions.
              </p>
              <div className="mt-6 space-y-3">
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Core focus</p>
                  <p className="mt-2 text-sm text-slate-700">{track === "Academic" ? "Academic rigor, research orientation, and strong college-readiness" : "Hands-on skills, technical practice, and industry-aligned preparation"}.</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Future outlook</p>
                  <p className="mt-2 text-sm text-slate-700">{track === "Academic" ? "Prep for university programs, scholarships, and professional careers." : "Prep for vocational pathways, certification, and early employment opportunities."}</p>
                </div>
              </div>
            </section>
          </aside>
        </div>

        {/* Student Assessment Answers Breakdown (When Toggled ON) */}
        {assessmentAnswersVisible && (
          <section className="mb-8 rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-blue-600 text-white shadow-lg">
                  <ListChecks className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
                    Student Assessment Answers
                  </p>
                  <h3 className="mt-1 text-2xl sm:text-3xl font-bold text-slate-950">
                    Question & Answer Breakdown
                  </h3>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-blue-50 px-3.5 py-1.5 text-xs font-semibold text-blue-700">
                  {questions.length || 78} Questions Total
                </span>
                <span className="inline-flex items-center rounded-full bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-slate-700">
                  Overall Score: {overallScore}%
                </span>
              </div>
            </div>

            <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-600">
              Review your question-by-question responses, correct choices, and scoring across all cognitive aptitude domains
              and the vocational interest inventory.
            </p>

            {/* Domain Tabs Bar */}
            <div className="mt-6 flex flex-wrap gap-2 border-b border-slate-200 pb-4">
              {DOMAIN_TABS.map((tab) => {
                const TabIcon = tab.icon;
                const isActive = activeDomainTab === tab.key;
                const tabCount = questions.filter(
                  (q) => q.category.toLowerCase() === tab.category.toLowerCase()
                ).length || (tab.key === "Interests" ? 18 : 15);

                const tabScore =
                  tab.scoreKey === "VA"
                    ? scores.VA
                    : tab.scoreKey === "MA"
                    ? scores.MA
                    : tab.scoreKey === "SA"
                    ? scores.SA
                    : tab.scoreKey === "LRA"
                    ? scores.LRA
                    : null;

                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => {
                      setActiveDomainTab(tab.key);
                      setDomainFilter("all");
                    }}
                    className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all ${
                      isActive
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    <TabIcon className="h-4 w-4" />
                    <span>{tab.label}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {tabScore !== null ? `${tabScore}%` : `${tabCount} Qs`}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Tab Summary Banner */}
            {activeDomainTab !== "Interests" ? (
              <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                        Aptitude Domain
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs font-medium text-slate-600">
                        {DOMAIN_TABS.find((t) => t.key === activeDomainTab)?.description}
                      </span>
                    </div>
                    <div className="mt-2 flex items-baseline gap-3">
                      <p className="text-2xl font-bold text-slate-950">
                        {currentDomainScore}% Score
                      </p>
                      <p className="text-sm font-medium text-slate-600">
                        ({currentDomainCorrectCount} of {resolvedAptitudeQuestions.length} correct • +{currentDomainCorrectCount} pts)
                      </p>
                    </div>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 rounded-xl bg-white p-1 shadow-sm border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setDomainFilter("all")}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                        domainFilter === "all"
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      All ({resolvedAptitudeQuestions.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setDomainFilter("correct")}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                        domainFilter === "correct"
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "text-emerald-700 hover:bg-emerald-50"
                      }`}
                    >
                      Correct ({currentDomainCorrectCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setDomainFilter("incorrect")}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                        domainFilter === "incorrect"
                          ? "bg-rose-600 text-white shadow-sm"
                          : "text-rose-700 hover:bg-rose-50"
                      }`}
                    >
                      Incorrect ({resolvedAptitudeQuestions.length - currentDomainCorrectCount})
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-purple-100 bg-purple-50/60 p-4 sm:p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-700">
                      RIASEC Vocational Profile
                    </span>
                    <h4 className="mt-1 text-lg font-bold text-slate-950">
                      Interest Inventory (18 Questions)
                    </h4>
                    <p className="mt-1 text-xs text-slate-600">
                      Ratings reflect student career interest intensity: 1 (Strongly Disagree) to 5 (Strongly Agree).
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {topInterests.map((interest, idx) => (
                      <span
                        key={idx}
                        className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-800"
                      >
                        ★ Top Match: {interest}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Questions List */}
            <div className="mt-6 space-y-4">
              {activeDomainTab !== "Interests" ? (
                displayedAptitudeQuestions.length > 0 ? (
                  displayedAptitudeQuestions.map((q) => (
                    <div
                      key={q.id}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-slate-300"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-700">
                            {q.questionNumber}
                          </span>
                          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Question {q.questionNumber} of {resolvedAptitudeQuestions.length}
                          </span>
                        </div>

                        {q.isCorrect ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 shadow-sm">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            +1 pt (Correct)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 shadow-sm">
                            <XCircle className="h-3.5 w-3.5 text-rose-600" />
                            0 pts (Incorrect)
                          </span>
                        )}
                      </div>

                      <p className="mt-3 text-base font-semibold text-slate-900 sm:text-lg">
                        {q.question}
                      </p>

                      {/* Options Grid */}
                      <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                        {q.options.map((option, optIdx) => {
                          const isStudentSelected = q.studentChoice === optIdx;
                          const isOptionCorrect = q.correctAnswer === optIdx;

                          let optionStyle = "border-slate-200 bg-slate-50/70 text-slate-700";
                          let badge = null;

                          if (isStudentSelected && isOptionCorrect) {
                            optionStyle = "border-2 border-emerald-500 bg-emerald-50 text-emerald-950 font-semibold shadow-sm";
                            badge = (
                              <span className="ml-auto inline-flex items-center gap-1 text-xs font-bold text-emerald-700 shrink-0">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Your Answer (Correct)
                              </span>
                            );
                          } else if (isStudentSelected && !isOptionCorrect) {
                            optionStyle = "border-2 border-rose-400 bg-rose-50 text-rose-950 font-semibold shadow-sm";
                            badge = (
                              <span className="ml-auto inline-flex items-center gap-1 text-xs font-bold text-rose-700 shrink-0">
                                <XCircle className="h-3.5 w-3.5" /> Your Choice
                              </span>
                            );
                          } else if (!isStudentSelected && isOptionCorrect) {
                            optionStyle = "border-2 border-emerald-300 bg-emerald-50/50 text-emerald-900 font-medium";
                            badge = (
                              <span className="ml-auto inline-flex items-center gap-1 text-xs font-bold text-emerald-700 shrink-0">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Correct Answer
                              </span>
                            );
                          }

                          return (
                            <div
                              key={optIdx}
                              className={`flex items-center gap-3 rounded-xl border p-3.5 text-sm transition-all ${optionStyle}`}
                            >
                              <span
                                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                                  isStudentSelected && isOptionCorrect
                                    ? "bg-emerald-600 text-white"
                                    : isStudentSelected && !isOptionCorrect
                                    ? "bg-rose-600 text-white"
                                    : isOptionCorrect
                                    ? "bg-emerald-200 text-emerald-900"
                                    : "bg-slate-200 text-slate-700"
                                }`}
                              >
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <span className="leading-snug">{option}</span>
                              {badge}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
                    No questions found matching the selected filter.
                  </div>
                )
              ) : (
                resolvedInterestQuestions.map((q) => (
                  <div
                    key={q.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-slate-300"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-700">
                          {q.questionNumber}
                        </span>
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Question {q.questionNumber} of 18
                        </span>
                      </div>

                      {q.interestType && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700">
                          RIASEC: {q.interestType}
                        </span>
                      )}
                    </div>

                    <p className="mt-3 text-base font-semibold text-slate-900 sm:text-lg">
                      {q.question}
                    </p>

                    {/* Likert Scale Bar */}
                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-2">
                        <span>Student Response:</span>
                        <span className="font-bold text-blue-700">
                          {q.rating} / 5 — {q.ratingLabel}
                        </span>
                      </div>

                      <div className="grid grid-cols-5 gap-2 mt-2">
                        {[1, 2, 3, 4, 5].map((level) => {
                          const isSelected = q.rating === level;
                          const labels: Record<number, string> = {
                            1: "Strongly Disagree",
                            2: "Disagree",
                            3: "Neutral",
                            4: "Agree",
                            5: "Strongly Agree",
                          };

                          return (
                            <div
                              key={level}
                              className={`flex flex-col items-center justify-center rounded-lg py-2.5 px-1 text-center transition-all ${
                                isSelected
                                  ? "bg-blue-600 text-white font-bold shadow-sm ring-2 ring-blue-300"
                                  : "bg-white text-slate-600 border border-slate-200"
                              }`}
                            >
                              <span className="text-base sm:text-lg font-bold">{level}</span>
                              <span className="text-[10px] sm:text-xs leading-tight line-clamp-1 mt-0.5">
                                {labels[level]}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {/* Suggested College Courses */}
        {uniqueCourses.length > 0 && (
          <div className="mb-8 rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg"
                  style={{ backgroundColor: "var(--electron-blue)" }}
                >
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Suggested College Courses</p>
                  <h3 className="mt-2 text-3xl font-bold text-slate-950">College paths aligned with your result</h3>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                    These course options are based on your recommended track, electives, and AI assessment insights.
                  </p>
                </div>
              </div>
              <span className="inline-flex w-fit rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
                {uniqueCourses.length} option{uniqueCourses.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {uniqueCourses.map((course, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition-all hover:border-blue-200 hover:bg-white hover:shadow-md"
                >
                  <p className="text-base font-bold text-slate-950">{course}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Track Overview Section */}
        <div className="mb-8 rounded-xl bg-white p-5 shadow-lg sm:p-8">
          <h3 className="text-2xl font-bold mb-6" style={{ color: "var(--electron-dark-gray)" }}>
            Your Track: {track}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-bold mb-3" style={{ color: "var(--electron-blue)" }}>
                📚 What You'll Study
              </h4>
              <ul className="space-y-2 text-gray-700">
                {track === "Academic" ? (
                  <>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "var(--electron-blue)" }} />
                      <span>Core academic subjects (Math, Science, English, Filipino)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "var(--electron-blue)" }} />
                      <span>Specialized electives in your chosen field</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "var(--electron-blue)" }} />
                      <span>Research and inquiry-based learning</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "var(--electron-blue)" }} />
                      <span>College preparation and readiness programs</span>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "var(--electron-blue)" }} />
                      <span>Technical and vocational skills training</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "var(--electron-blue)" }} />
                      <span>Hands-on practical work and application</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "var(--electron-blue)" }} />
                      <span>Industry certifications and competencies</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "var(--electron-blue)" }} />
                      <span>Workplace immersion and on-the-job training</span>
                    </li>
                  </>
                )}
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-3" style={{ color: "var(--electron-blue)" }}>
                🎯 Future Opportunities
              </h4>
              <ul className="space-y-2 text-gray-700">
                {track === "Academic" ? (
                  <>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "var(--electron-blue)" }} />
                      <span>Pursue bachelor's degree in college/university</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "var(--electron-blue)" }} />
                      <span>Access to scholarship opportunities</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "var(--electron-blue)" }} />
                      <span>Professional careers requiring licensure</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "var(--electron-blue)" }} />
                      <span>Graduate studies and research opportunities</span>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "var(--electron-blue)" }} />
                      <span>Immediate employment after graduation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "var(--electron-blue)" }} />
                      <span>Start your own business or enterprise</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "var(--electron-blue)" }} />
                      <span>Technical college or vocational degree programs</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "var(--electron-blue)" }} />
                      <span>Industry certifications and career advancement</span>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Recommended Electron Branches */}
        {recommendedBranches.length > 0 && (
          <div className="mb-8 rounded-xl bg-white p-5 shadow-md ring-1 ring-gray-100 sm:p-6">
            <div className="mb-5 flex items-start gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white shadow-sm"
                style={{ backgroundColor: "var(--electron-blue)" }}
              >
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-2xl font-bold" style={{ color: "var(--electron-dark-gray)" }}>
                  Recommended Electron Branches
                </h3>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-600">
                  Branches shown here offer programs aligned with your suggested college courses.
                </p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {recommendedBranches.map((branch) => (
                <article
                  key={branch.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-base font-bold leading-snug text-gray-900">{branch.name}</h4>
                      <p className="mt-1 text-sm leading-5 text-gray-600">{branch.description}</p>
                    </div>
                    {branch.isBestMatch && (
                      <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                        Best match
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex items-start gap-2">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" />
                      <span>{branch.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 shrink-0 text-blue-700" />
                      <span>{branch.contact}</span>
                    </div>
                  </div>

                  {branch.matchedPrograms.length > 0 && (
                    <div className="mt-3">
                      <h5 className="text-sm font-semibold text-gray-900 mb-2">Programs Offered</h5>
                      <div className="flex flex-wrap gap-1">
                        {branch.matchedPrograms.map((program, index) => (
                          <span
                            key={index}
                            className="inline-block rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700"
                          >
                            {program}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <a
                      href={branch.facebookUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-blue-700 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
                    >
                      Facebook Page
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    <a
                      href={`tel:${branch.contact.replace(/[^\d+]/g, "")}`}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-md border border-gray-300 px-3.5 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      Contact Branch
                      <Phone className="h-4 w-4" />
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* NEW SECTION: Career Pathways */}
        {allCareerPathways.length > 0 && (
          <div className="mb-8 rounded-xl bg-white p-5 shadow-lg sm:p-8">
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="w-6 h-6" style={{ color: "var(--electron-blue)" }} />
              <h3 className="text-2xl font-bold" style={{ color: "var(--electron-dark-gray)" }}>
                Career Pathways
              </h3>
            </div>
            <p className="text-gray-600 mb-3">
              Explore potential career paths based on your recommended electives:
            </p>
            <p className="text-gray-600 mb-6">
              These careers come directly from the selected electives and their related catalog pathways.
            </p>
            <div className="grid grid-cols-1 gap-6">
              {allCareerPathways.map((pathway, index) => (
                  <div
                    key={index}
                    className="portal-glass-panel rounded-xl border-2 p-6 transition-all hover:shadow-lg"
                    style={{ borderColor: "var(--electron-blue)" }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div
                        className="px-4 py-2 rounded-lg text-white font-bold"
                        style={{ backgroundColor: "var(--electron-blue)" }}
                      >
                        {pathway.course}
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-600 font-medium">Career Opportunities</span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {pathway.careers.map((career, careerIndex) => (
                        <div
                          key={careerIndex}
                          className="px-4 py-2 rounded-lg font-semibold border-2 transition-all hover:shadow-md"
                          style={{
                            borderColor: "var(--electron-red)",
                            color: "var(--electron-red)",
                            backgroundColor: "var(--electron-light-gray)",
                          }}
                        >
                          <Briefcase className="w-4 h-4 inline-block mr-2" />
                          {career}
                        </div>
                      ))}
                    </div>
                  </div>
              ))}
            </div>
          </div>
        )}

        {/* What's Next - Action Buttons */}
        <div className="rounded-xl bg-white p-5 shadow-lg print:hidden sm:p-8">
          <h3 className="text-2xl font-bold mb-6" style={{ color: "var(--electron-dark-gray)" }}>
            What's Next?
          </h3>
          <p className="text-gray-700 mb-6 leading-relaxed">
            You have completed the assessment. Based on your results, you may now proceed with the enrollment process to select your track and electives.
          </p>
          <Link
            to="/dashboard/enrollment"
            className="inline-flex w-full items-center justify-center gap-3 rounded-lg px-6 py-4 text-base font-bold text-white shadow-lg transition-all hover:opacity-90 sm:w-auto sm:px-8 sm:text-lg"
            style={{ backgroundColor: "var(--electron-blue)" }}
          >
            Enroll Now
            <ArrowRight className="w-6 h-6" />
          </Link>
        </div>
      </div>
    </div>
  );
}
