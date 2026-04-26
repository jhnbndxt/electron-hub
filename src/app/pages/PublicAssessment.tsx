import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { ChevronLeft, ChevronRight, Brain, Calculator, Beaker, Lightbulb, Heart, CheckCircle, BarChart3, FileText, Award, BookOpen, ArrowRight, Sparkles, TrendingUp, GraduationCap, Briefcase } from "lucide-react";
import { formatAssessmentResult } from "../../services/assessmentScoringService";
import { getDefaultAssessmentQuestions } from "../../services/assessmentService";
import { supabase } from "../../supabase";

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer?: number;
  category: string;
}

type AnswerValue = number | number[];

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
  const [userInfo, setUserInfo] = useState({ fullName: "", email: "" });
  const [agreeToPrivacy, setAgreeToPrivacy] = useState(false);
  const [errors, setErrors] = useState({ fullName: "", email: "", privacy: "" });
  const publicAssessmentShellStyle = {
    background:
      "radial-gradient(circle at top left, rgba(37, 99, 235, 0.16) 0%, transparent 26%), radial-gradient(circle at top right, rgba(185, 28, 28, 0.1) 0%, transparent 22%), linear-gradient(180deg, #f8fbff 0%, #eef4ff 48%, #f8fafc 100%)",
  };

  const isInterestQuestion = (question: Question) => question.category === "Interests";

  const getSelectedInterestAnswers = (questionId: number) => {
    const answer = answers[questionId];
    return Array.isArray(answer) ? answer : [];
  };

  const isQuestionAnswered = (question: Question) => {
    const answer = answers[question.id];

    if (isInterestQuestion(question)) {
      return Array.isArray(answer) && answer.length > 0;
    }

    return typeof answer === "number";
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    localStorage.removeItem("assessment_questions");

    const initializeAssessment = async () => {
      const existingResults = localStorage.getItem("publicAssessmentResults");
      const storedUserInfo = localStorage.getItem("publicAssessmentUserInfo");

      if (existingResults) {
        setAssessmentCompleted(true);
        setResults(JSON.parse(existingResults));
        if (storedUserInfo) {
          setUserInfo(JSON.parse(storedUserInfo));
        }
        setLoading(false);
        return;
      }

      await loadQuestionsFromSupabase();
      setLoading(false);
    };

    initializeAssessment();
  }, []);

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
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={publicAssessmentShellStyle}>
        <div className="portal-glass-panel rounded-[1.75rem] px-10 py-9 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: "var(--electron-blue)" }}></div>
          <p className="text-gray-600">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (assessmentCompleted && results) {
    const { track, electives, scores, topDomains, topInterests, overallScore } = results;
    const trackColor = "var(--electron-blue)";
    const secondaryColor = "var(--electron-red)";

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
    };

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
                          {getSuggestedCourses(track, elective).length > 0 && (
                            <p className="text-sm text-gray-500 mt-1">
                              Leads to: {getSuggestedCourses(track, elective).join(", ")}
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
                      General Academic
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

  const handleInterestToggle = (questionId: number, optionIndex: number) => {
    setAnswers((currentAnswers) => {
      const currentSelections = Array.isArray(currentAnswers[questionId])
        ? [...(currentAnswers[questionId] as number[])]
        : [];
      const nextSelections = currentSelections.includes(optionIndex)
        ? currentSelections.filter((currentIndex) => currentIndex !== optionIndex)
        : [...currentSelections, optionIndex].sort((leftIndex, rightIndex) => leftIndex - rightIndex);
      const nextAnswers = { ...currentAnswers };

      if (nextSelections.length === 0) {
        delete nextAnswers[questionId];
      } else {
        nextAnswers[questionId] = nextSelections;
      }

      return nextAnswers;
    });
  };

  const handleNext = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const handleSubmit = async () => {
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
    };

    localStorage.setItem("publicAssessmentResults", JSON.stringify(assessmentResult));
    localStorage.setItem("publicAssessmentUserInfo", JSON.stringify(userInfo));

    const emailKey = `publicAssessment_${userInfo.email}`;
    localStorage.setItem(emailKey, JSON.stringify({ ...assessmentResult, userInfo, timestamp: new Date().toISOString() }));

    setResults(assessmentResult);
    setAssessmentCompleted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleStartAssessment = () => {
    // Validate form
    const newErrors = { fullName: "", email: "", privacy: "" };
    let hasError = false;

    if (!userInfo.fullName.trim()) {
      newErrors.fullName = "Full name is required";
      hasError = true;
    }

    if (!userInfo.email.trim()) {
      newErrors.email = "Email address is required";
      hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userInfo.email)) {
      newErrors.email = "Please enter a valid email address";
      hasError = true;
    }

    if (!agreeToPrivacy) {
      newErrors.privacy = "You must agree to the data privacy policy to continue";
      hasError = true;
    }

    setErrors(newErrors);

    if (!hasError) {
      setAssessmentStarted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

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
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.95fr)] lg:items-start">
              <div>
                <div className="mb-12">
                  <h2 className="mb-4 text-4xl font-bold md:text-5xl" style={{ color: "#1E3A8A" }}>
                    What you will get
                  </h2>
                  <p className="text-lg text-gray-600">
                    The assessment gives you a clearer direction before you submit enrollment requirements.
                  </p>
                  <div className="mx-auto mt-4 h-1 w-24 rounded-full lg:mx-0" style={{ backgroundColor: "#B91C1C" }}></div>
                </div>

                <div className="grid gap-6">
                  {assessmentHighlights.map((highlight, index) => {
                    const HighlightIcon = highlight.icon;
                    const accentColor = index % 2 === 0 ? "#1E3A8A" : "#B91C1C";

                    return (
                      <div key={highlight.title} className="rounded-2xl bg-white p-8 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                        <div
                          className="mb-4 flex h-16 w-16 items-center justify-center rounded-full shadow-md"
                          style={{ backgroundColor: accentColor }}
                        >
                          <HighlightIcon className="h-8 w-8 text-white" />
                        </div>
                        <h3 className="mb-3 text-2xl font-bold text-gray-900">{highlight.title}</h3>
                        <p className="leading-relaxed text-gray-600">{highlight.description}</p>
                      </div>
                    );
                  })}

                  <div className="rounded-2xl bg-white p-8 shadow-lg">
                    <h3 className="mb-4 text-2xl font-bold" style={{ color: "#1E3A8A" }}>
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
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-xl sm:p-8 lg:sticky lg:top-24">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold tracking-[0.16em] text-red-600 uppercase">Start Here</p>
                    <h2 className="mt-3 text-3xl font-bold text-gray-900">Begin Assessment</h2>
                    <p className="mt-2 text-gray-600">
                      Enter your details so your results can be saved and linked to your account later.
                    </p>
                  </div>
                  <div className="hidden h-14 w-14 items-center justify-center rounded-2xl bg-[#1E3A8A] text-white shadow-lg sm:flex">
                    <Brain className="h-6 w-6" />
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Full Name <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={userInfo.fullName}
                      onChange={(e) => {
                        setUserInfo({ ...userInfo, fullName: e.target.value });
                        setErrors({ ...errors, fullName: "" });
                      }}
                      className={`w-full rounded-xl border-2 px-4 py-3 text-sm outline-none transition-all focus:ring-2 ${
                        errors.fullName
                          ? "border-red-300 focus:ring-red-200"
                          : "border-gray-300 focus:ring-blue-200"
                      }`}
                      placeholder="Enter your full name"
                    />
                    {errors.fullName && <p className="mt-2 text-sm text-red-600">{errors.fullName}</p>}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Email Address <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="email"
                      value={userInfo.email}
                      onChange={(e) => {
                        setUserInfo({ ...userInfo, email: e.target.value });
                        setErrors({ ...errors, email: "" });
                      }}
                      className={`w-full rounded-xl border-2 px-4 py-3 text-sm outline-none transition-all focus:ring-2 ${
                        errors.email
                          ? "border-red-300 focus:ring-red-200"
                          : "border-gray-300 focus:ring-blue-200"
                      }`}
                      placeholder="Enter your email address"
                    />
                    {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
                  </div>

                  <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
                    <p className="text-sm leading-relaxed text-gray-700">
                      <strong className="text-gray-900">Data Privacy Notice:</strong> Your name and email are collected in accordance with the Data Privacy Act of 2012. They are used only to generate your assessment results and associate them with your account. Your data will remain confidential and will not be shared with unauthorized parties.
                    </p>
                  </div>

                  <div>
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={agreeToPrivacy}
                        onChange={(e) => {
                          setAgreeToPrivacy(e.target.checked);
                          setErrors({ ...errors, privacy: "" });
                        }}
                        className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-200"
                      />
                      <span className="text-sm text-gray-700">
                        I agree to the collection and use of my personal data for assessment purposes. <span className="text-red-600">*</span>
                      </span>
                    </label>
                    {errors.privacy && <p className="mt-2 text-sm text-red-600">{errors.privacy}</p>}
                  </div>

                  <button
                    onClick={handleStartAssessment}
                    className="w-full rounded-lg px-6 py-4 text-lg font-bold text-white shadow-lg transition-all hover:shadow-xl"
                    style={{ backgroundColor: "var(--electron-blue)" }}
                  >
                    Start Assessment
                  </button>

                  <p className="text-center text-sm text-gray-500">
                    Your results appear immediately after the last section and can be linked to your portal later.
                  </p>
                </div>
              </div>
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
                      ? "Use the checklist and select every option that applies to you before moving to the next section."
                      : "Answer every question carefully before moving to the next section."}
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700">
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
                        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-red-600">
                          Select all that apply
                        </p>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {question.options.map((option, optIndex) => {
                            const selectedOptions = getSelectedInterestAnswers(question.id);
                            const isSelected = selectedOptions.includes(optIndex);

                            return (
                              <label
                                key={optIndex}
                                className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 px-4 py-3.5 transition-all ${
                                  isSelected
                                    ? "border-blue-200 bg-blue-50 text-blue-900 shadow-sm"
                                    : "border-gray-300 bg-white text-gray-700 hover:border-blue-300"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleInterestToggle(question.id, optIndex)}
                                  className="mt-0.5 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-200"
                                />
                                <span className="text-sm font-medium leading-6">{option}</span>
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
                      ? "Choose at least one checklist item for every interest question to continue."
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
