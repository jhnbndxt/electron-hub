import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, ChevronRight, Brain, Calculator, Beaker, Lightbulb, Heart, CheckCircle, BarChart3, FileText } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getLatestAssessmentResult, saveAssessmentResult } from "../../services/assessmentResultService";
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

export function Assessment() {
  const navigate = useNavigate();
  const { userData, updateEnrollmentProgress } = useAuth();
  const [currentSection, setCurrentSection] = useState(0);
  const [answers, setAnswers] = useState<Record<number, AnswerValue>>({});
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [assessmentCompleted, setAssessmentCompleted] = useState(false);

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
      const userEmail = userData?.email || "student@gmail.com";
      const existingResult = await getLatestAssessmentResult(userEmail);

      if (existingResult) {
        setAssessmentCompleted(true);
        setLoading(false);
        return;
      }

      const publicResults = localStorage.getItem("publicAssessmentResults");
      if (publicResults && userEmail) {
        localStorage.setItem(`assessmentResults_${userEmail}`, publicResults);

        try {
          const publicAssessment = JSON.parse(publicResults);
          await saveAssessmentResult(userEmail, publicAssessment);
        } catch (error) {
          console.error("Error saving assessment result:", error);
        }

        localStorage.removeItem("publicAssessmentResults");
        updateEnrollmentProgress("AI Assessment Completed", "completed");
        updateEnrollmentProgress("Documents Submitted", "current");
        setAssessmentCompleted(true);
        setLoading(false);
        return;
      }

      await loadQuestionsFromSupabase();
      setLoading(false);
    };

    initializeAssessment();
  }, [userData, updateEnrollmentProgress]);

  useEffect(() => {
    const shellMain = document.querySelector(".portal-glass-main") as HTMLElement | null;

    if (!shellMain) {
      return;
    }

    const previousOverflowY = shellMain.style.overflowY;
    const previousOverscrollBehavior = shellMain.style.overscrollBehavior;
    const shouldLockViewport = window.innerWidth >= 1024 && (loading || assessmentCompleted);

    if (shouldLockViewport) {
      shellMain.scrollTop = 0;
      shellMain.style.overflowY = "hidden";
      shellMain.style.overscrollBehavior = "none";
    }

    return () => {
      shellMain.style.overflowY = previousOverflowY;
      shellMain.style.overscrollBehavior = previousOverscrollBehavior;
    };
  }, [loading, assessmentCompleted]);

  const loadQuestionsFromSupabase = async () => {
    try {
      console.log("📚 Loading questions from Supabase...");

      const { data, error } = await supabase
        .from("assessment_questions")
        .select("*")
        .order("id");

      if (error || !data || data.length === 0) {
        console.warn("⚠️ No questions in Supabase, using default questions");
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

      console.log(`✅ Loaded ${questions.length} questions from Supabase`);

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
    console.log("📦 Loading questions from localStorage...");
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
    const defaultQuestions = getDefaultAssessmentQuestions();

    return defaultQuestions.map((question, index) => ({
      id: index + 1,
      question: question.question,
      options: question.options,
      correctAnswer: question.correctAnswer,
      category: question.category,
    }));
  };

  if (loading) {
    return (
      <div className="portal-dashboard-page flex min-h-[calc(100dvh-4rem)] items-center justify-center p-4 sm:p-6 lg:h-[calc(100dvh-5rem)] lg:min-h-0 lg:overflow-hidden lg:p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: "var(--electron-blue)" }}></div>
          <p className="text-gray-600">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (assessmentCompleted) {
    return (
      <div className="portal-dashboard-page flex min-h-[calc(100dvh-4rem)] items-center justify-center p-4 sm:p-6 lg:h-[calc(100dvh-5rem)] lg:min-h-0 lg:overflow-hidden lg:p-8">
        <div className="max-w-2xl w-full">
          <div className="portal-glass-panel-strong overflow-hidden rounded-2xl shadow-2xl">
            <div
              className="p-6 text-center sm:p-8"
              style={{
                background: "linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)",
              }}
            >
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 mb-4">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
              <h1 className="mb-2 text-3xl font-bold text-white sm:text-4xl">
                Assessment Completed Successfully!
              </h1>
              <p className="text-base text-white/90 sm:text-lg">
                🎉 Congratulations on completing your assessment
              </p>
            </div>

            <div className="p-5 sm:p-8">
              <div className="mb-6 rounded-r-lg border-l-4 border-blue-500 bg-blue-50/70 p-6 backdrop-blur-sm">
                <p className="text-gray-800 leading-relaxed">
                  Your responses have been <strong className="text-blue-700">recorded and evaluated</strong>.
                  The AI has analyzed your answers and generated personalized track and elective recommendations
                  tailored to your strengths and interests.
                </p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: "var(--electron-blue)" }}>
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Track Recommendation Ready</h3>
                    <p className="text-sm text-gray-600">View your AI-powered track analysis (Academic or Technical-Professional)</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: "var(--electron-blue)" }}>
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Elective Subjects Identified</h3>
                    <p className="text-sm text-gray-600">See which specialized subjects match your profile</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: "var(--electron-blue)" }}>
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Career Pathways Mapped</h3>
                    <p className="text-sm text-gray-600">Discover college courses and career options aligned with your results</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row">
                <button
                  onClick={() => navigate("/dashboard/results")}
                  className="flex-1 px-8 py-4 rounded-lg text-white font-semibold transition-all shadow-md hover:opacity-90 flex items-center justify-center gap-2"
                  style={{ backgroundColor: "var(--electron-blue)" }}
                >
                  <BarChart3 className="w-5 h-5" />
                  View My Results
                </button>
                <button
                  onClick={() => navigate("/dashboard/enrollment")}
                  className="flex-1 px-8 py-4 rounded-lg font-semibold transition-all shadow-md flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: "white",
                    color: "var(--electron-blue)",
                    border: "2px solid var(--electron-blue)",
                  }}
                >
                  <FileText className="w-5 h-5" />
                  Continue Enrollment
                </button>
              </div>

              <p className="text-center text-sm text-gray-500 mt-6">
                💡 Your assessment has already been recorded. Retakes are disabled after submission.
              </p>
            </div>
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

  const scrollAssessmentTop = () => {
    const scrollTarget =
      (document.querySelector(".portal-glass-main") as HTMLElement | null) ||
      document.scrollingElement ||
      document.documentElement ||
      document.body;

    const scrollToTop = (element: HTMLElement | Element) => {
      if (element instanceof HTMLElement && "scrollTo" in element) {
        try {
          (element as HTMLElement).scrollTo({ top: 0, behavior: "smooth" });
        } catch {
          (element as HTMLElement).scrollTop = 0;
        }
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };

    scrollToTop(scrollTarget);
  };

  useEffect(() => {
    const raf = window.requestAnimationFrame(() => {
      scrollAssessmentTop();
    });
    return () => window.cancelAnimationFrame(raf);
  }, [currentSection]);

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
    console.log("🚀 Submitting assessment with dynamic scoring...");

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

    const assessmentResult = await formatAssessmentResult(answers, questionsByCategory);
    if (!assessmentResult) {
      console.error("❌ Error formatting assessment result");
      return;
    }

    console.log("📊 Assessment Result:", assessmentResult);

    const userEmail = userData?.email || "student@gmail.com";

    localStorage.setItem(
      `assessmentResults_${userEmail}`,
      JSON.stringify({
        track: assessmentResult.track,
        electives: assessmentResult.electives,
        scores: {
          VA: assessmentResult.scores.verbal_ability_score,
          MA: assessmentResult.scores.mathematical_ability_score,
          SA: assessmentResult.scores.spatial_ability_score,
          LRA: assessmentResult.scores.logical_reasoning_score,
        },
        topDomains: assessmentResult.topDomains,
        topInterests: assessmentResult.topInterests,
        overallScore: assessmentResult.scores.overall_score,
      })
    );

    try {
      await saveAssessmentResult(userEmail, assessmentResult);
      console.log("✅ Assessment result saved to Supabase");
    } catch (error) {
      console.error("❌ Error saving assessment result:", error);
    }

    updateEnrollmentProgress("AI Assessment Completed", "completed");
    updateEnrollmentProgress("Documents Submitted", "current");

    navigate("/dashboard/results");
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "instant" });
    }, 0);
  };

  const allCurrentQuestionsAnswered = currentSectionData.questions.every(
    (question) => isQuestionAnswered(question)
  );

  const isLastSection = currentSection === sections.length - 1;

  return (
    <div className="portal-dashboard-page p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1
            className="text-4xl font-bold mb-3"
            style={{ color: "var(--electron-dark-gray)" }}
          >
            Track Recommendation Assessment
          </h1>
          <p className="text-xl" style={{ color: "var(--electron-blue)" }}>
            Powered by AI
          </p>
          <p className="text-gray-600 mt-2">
            Answer the following to determine your recommended track and electives
          </p>
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-start mb-4 relative">
            {sections.map((section, index) => {
              const Icon = section.icon;
              const isActive = index === currentSection;
              const isCompleted = index < currentSection;

              return (
                <div key={index} className="flex flex-col items-center flex-1 relative z-10">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all ${
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

            <div className="absolute top-6 left-0 right-0 flex items-center px-12 -z-10">
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

          <div className="mt-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Overall Progress</span>
              <span>
                {answeredQuestions} / {totalQuestions} questions
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="h-3 rounded-full transition-all duration-300"
                style={{
                  width: `${progress}%`,
                  backgroundColor: "var(--electron-blue)",
                }}
              />
            </div>
          </div>
        </div>

        <div className="portal-glass-panel mb-6 rounded-xl p-5 shadow-lg sm:p-8">
          <h2
            className="text-2xl font-bold mb-6"
            style={{ color: "var(--electron-dark-gray)" }}
          >
            {currentSectionData.name}
          </h2>

          <div className="space-y-8">
            {currentSectionData.questions.map((question, questionIndex) => (
              <div key={question.id} className="pb-6 border-b border-gray-200 last:border-b-0">
                <p className="text-lg mb-4 font-medium text-gray-800">
                  {questionIndex + 1}. {question.question}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {isInterestQuestion(question) ? (
                    <div className="sm:col-span-2">
                      <p className="mb-4 text-sm font-medium text-red-600">Select all that apply.</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {question.options.map((option, optionIndex) => {
                          const selectedOptions = getSelectedInterestAnswers(question.id);
                          const isSelected = selectedOptions.includes(optionIndex);

                          return (
                            <label
                              key={optionIndex}
                              className={`flex cursor-pointer items-start gap-3 rounded-lg border-2 px-4 py-3 transition-all ${
                                isSelected
                                  ? "border-blue-200 bg-blue-50 text-blue-900 shadow-sm"
                                  : "border-gray-300 bg-white text-gray-700 hover:border-blue-300"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleInterestToggle(question.id, optionIndex)}
                                className="mt-0.5 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-200"
                              />
                              <span className="text-sm font-medium leading-6">{option}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    question.options.map((option, optionIndex) => (
                      <button
                        key={optionIndex}
                        onClick={() => handleAnswer(question.id, optionIndex)}
                        className={`py-3 px-4 rounded-lg border-2 transition-all text-left ${
                          answers[question.id] === optionIndex
                            ? "text-white shadow-md"
                            : "border-gray-300 text-gray-700 hover:border-blue-300"
                        }`}
                        style={
                          answers[question.id] === optionIndex
                            ? { backgroundColor: "var(--electron-blue)", borderColor: "var(--electron-blue)" }
                            : {}
                        }
                      >
                        <span className="font-semibold mr-2">
                          {String.fromCharCode(97 + optionIndex)}.
                        </span>
                        {option}
                      </button>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={handlePrevious}
            disabled={currentSection === 0}
            className="px-6 py-3 rounded-lg border-2 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            style={{
              borderColor: "var(--electron-blue)",
              color: "var(--electron-blue)",
            }}
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>

          {isLastSection ? (
            <button
              onClick={handleSubmit}
              disabled={!allCurrentQuestionsAnswered}
              className="px-8 py-3 rounded-lg text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:opacity-90"
              style={{ backgroundColor: "var(--electron-red)" }}
            >
              Submit Assessment
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!allCurrentQuestionsAnswered}
              className="px-6 py-3 rounded-lg text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md"
              style={{ backgroundColor: "var(--electron-blue)" }}
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>

        {!allCurrentQuestionsAnswered && (
          <p className="text-center text-sm text-gray-500 mt-4">
            {currentSectionData.name === "Interests"
              ? "Please choose at least one checklist item for every interest question to continue"
              : "Please answer all questions in this section to continue"}
          </p>
        )}
      </div>
    </div>
  );
}