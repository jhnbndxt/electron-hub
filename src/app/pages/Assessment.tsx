import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, ChevronRight, Brain, Calculator, Beaker, Lightbulb, Heart, CheckCircle, BarChart3, FileText } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { saveAssessmentResult } from "../../services/assessmentResultService";
import { getQuestionsByCategory, calculateDynamicScores, determineTrack, getTopDomains, getTopInterests } from "../../services/assessmentScoringService";
import { getDefaultAssessmentQuestions } from "../../services/assessmentService";
import { supabase } from "../../supabase";

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer?: number; // Index of correct answer (for objective questions)
  category: string;
}

interface Section {
  name: string;
  icon: any;
  questions: Question[];
}

export function Assessment() {
  const navigate = useNavigate();
  const { userData, updateEnrollmentProgress } = useAuth();
  const [currentSection, setCurrentSection] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [assessmentCompleted, setAssessmentCompleted] = useState(false);

  useEffect(() => {
    // Scroll to top immediately when component mounts
    window.scrollTo(0, 0);

    // Clear old cached questions from localStorage to force fresh load
    localStorage.removeItem("assessment_questions");

    const initializeAssessment = async () => {
      // Check if user has already taken the assessment
      const userEmail = userData?.email || "student@gmail.com";
      const existingResults = localStorage.getItem(`assessmentResults_${userEmail}`);

      if (existingResults) {
        // User has already taken the assessment, show completion message
        setAssessmentCompleted(true);
        setLoading(false);
        return;
      }

      // Check for public assessment results and transfer them
      const publicResults = localStorage.getItem("publicAssessmentResults");
      if (publicResults && userEmail) {
        // Transfer public assessment to user account
        localStorage.setItem(`assessmentResults_${userEmail}`, publicResults);
        
        // Also save to assessment history via Supabase
        try {
          const publicAssessment = JSON.parse(publicResults);
          await saveAssessmentResult(userEmail, publicAssessment);
        } catch (error) {
          console.error("Error saving assessment result:", error);
        }
        
        // Clear public assessment
        localStorage.removeItem("publicAssessmentResults");
        
        // Update enrollment progress
        updateEnrollmentProgress("AI Assessment Completed", "completed");
        updateEnrollmentProgress("Documents Submitted", "current");
        
        // Show completion message
        setAssessmentCompleted(true);
        setLoading(false);
        return;
      }

      // Load questions from Supabase first, fallback to default if needed
      await loadQuestionsFromSupabase();
      setLoading(false);
    };

    initializeAssessment();
  }, [userData, updateEnrollmentProgress]);

  const loadQuestionsFromSupabase = async () => {
    try {
      console.log("📚 Loading questions from Supabase...");
      
      // Fetch questions from assessment_questions table
      const { data, error } = await supabase
        .from('assessment_questions')
        .select('*')
        .order('id');

      if (error || !data || data.length === 0) {
        console.warn("⚠️ No questions in Supabase, using default questions");
        loadQuestionsFromStorage();
        return;
      }

      // Convert Supabase data to Question format
      const questions: Question[] = data.map(q => ({
        id: q.id,
        question: q.question,
        options: q.options || [],
        correctAnswer: q.correct_answer,
        category: q.category
      }));

      console.log(`✅ Loaded ${questions.length} questions from Supabase`);

      // Organize questions by category
      const organizedSections: Section[] = [
        {
          name: "Verbal",
          icon: Brain,
          questions: questions.filter(q => q.category === "Verbal"),
        },
        {
          name: "Math",
          icon: Calculator,
          questions: questions.filter(q => q.category === "Math"),
        },
        {
          name: "Science",
          icon: Beaker,
          questions: questions.filter(q => q.category === "Science"),
        },
        {
          name: "Logical",
          icon: Lightbulb,
          questions: questions.filter(q => q.category === "Logical"),
        },
        {
          name: "Interests",
          icon: Heart,
          questions: questions.filter(q => q.category === "Interests"),
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
      // If no questions in storage, use default questions
      questions = getDefaultQuestions();
      localStorage.setItem("assessment_questions", JSON.stringify(questions));
    }

    // Organize questions by category
    const organizedSections: Section[] = [
      {
        name: "Verbal",
        icon: Brain,
        questions: questions.filter(q => q.category === "Verbal"),
      },
      {
        name: "Math",
        icon: Calculator,
        questions: questions.filter(q => q.category === "Math"),
      },
      {
        name: "Science",
        icon: Beaker,
        questions: questions.filter(q => q.category === "Science"),
      },
      {
        name: "Logical",
        icon: Lightbulb,
        questions: questions.filter(q => q.category === "Logical"),
      },
      {
        name: "Interests",
        icon: Heart,
        questions: questions.filter(q => q.category === "Interests"),
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
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--electron-light-gray)" }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: "var(--electron-blue)" }}></div>
          <p className="text-gray-600">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (assessmentCompleted) {
    return (
      <div className="h-screen overflow-hidden flex items-center justify-center p-8" style={{ backgroundColor: "var(--electron-light-gray)" }}>
        <div className="max-w-2xl w-full">
          {/* Success Card */}
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Blue Header */}
            <div
              className="p-8 text-center"
              style={{
                background: "linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)",
              }}
            >
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 mb-4">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Assessment Completed Successfully!
              </h1>
              <p className="text-lg text-white/90">
                🎉 Congratulations on completing your assessment
              </p>
            </div>

            {/* Content */}
            <div className="p-8">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-6 mb-6 rounded-r-lg">
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

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
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
                    border: "2px solid var(--electron-blue)"
                  }}
                >
                  <FileText className="w-5 h-5" />
                  Continue Enrollment
                </button>
              </div>

              <p className="text-center text-sm text-gray-500 mt-6">
                💡 You may now proceed to view your results or continue with the enrollment process
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentSectionData = sections[currentSection];
  const totalQuestions = sections.reduce((sum, section) => sum + section.questions.length, 0);
  const answeredQuestions = Object.keys(answers).length;
  const progress = (answeredQuestions / totalQuestions) * 100;

  const handleAnswer = (questionId: number, answerIndex: number) => {
    setAnswers({
      ...answers,
      [questionId]: answerIndex,
    });
  };

  const handleNext = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(currentSection + 1);
      // Auto-scroll to top of page
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const handleSubmit = async () => {
    console.log("🚀 Submitting assessment with dynamic scoring...");
    
    // Use dynamic scoring service
    const scores = await calculateDynamicScores(answers);
    
    if (!scores) {
      console.error("❌ Failed to calculate scores");
      alert("Error calculating scores. Please try again.");
      return;
    }

    const userEmail = userData?.email || "student@gmail.com";
    
    // Determine track
    const track = determineTrack(scores);
    
    // Get top 2 domains
    const questionsByCategory = await getQuestionsByCategory();
    const topDomains = getTopDomains(scores);
    const topInterests = getTopInterests(answers, questionsByCategory);

    // Determine electives based on track (simplified)
    const electives = ['Elective 1', 'Elective 2']; // Can be customized further

    // Prepare result for storage
    const assessmentResult = {
      verbal_ability_score: scores.verbal_ability_score,
      mathematical_ability_score: scores.mathematical_ability_score,
      spatial_ability_score: scores.spatial_ability_score,
      logical_reasoning_score: scores.logical_reasoning_score,
      overall_score: scores.overall_score,
      recommended_track: track,
      electives,
      topDomains,
      topInterests,
      // Legacy compatibility
      track,
      VA: scores.verbal_ability_score,
      MA: scores.mathematical_ability_score,
      SA: scores.spatial_ability_score,
      LRA: scores.logical_reasoning_score,
    };

    console.log("📊 Assessment Result:", assessmentResult);

    // Save to assessment history via Supabase
    try {
      await saveAssessmentResult(userEmail, assessmentResult);
      console.log("✅ Assessment result saved to Supabase");
    } catch (error) {
      console.error("❌ Error saving assessment result:", error);
    }

    // Update enrollment progress - Mark AI Assessment as completed
    updateEnrollmentProgress("AI Assessment Completed", "completed");
    updateEnrollmentProgress("Documents Submitted", "current");

    // Navigate to results and scroll to top instantly
    navigate("/dashboard/results");
    // Use setTimeout to ensure navigation completes before scroll
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "instant" });
    }, 0);
  };

  const isInterestSection = currentSection === 4;
  const allCurrentQuestionsAnswered = currentSectionData.questions.every(
    (q) => answers[q.id] !== undefined
  );

  const isLastSection = currentSection === sections.length - 1;

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: "var(--electron-light-gray)" }}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
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

        {/* Progress Bar Steps */}
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
            
            {/* Connecting Lines - Behind circles */}
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

          {/* Overall Progress */}
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

        {/* Question Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <h2
            className="text-2xl font-bold mb-6"
            style={{ color: "var(--electron-dark-gray)" }}
          >
            {currentSectionData.name}
          </h2>

          <div className="space-y-8">
            {currentSectionData.questions.map((question, qIndex) => (
              <div key={question.id} className="pb-6 border-b border-gray-200 last:border-b-0">
                <p className="text-lg mb-4 font-medium text-gray-800">
                  {question.id}. {question.question}
                </p>

                {isInterestSection ? (
                  // Likert scale for interest questions
                  <div className="grid grid-cols-5 gap-3">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        onClick={() => handleAnswer(question.id, value)}
                        className={`py-3 px-2 rounded-lg border-2 transition-all text-sm font-medium text-center ${
                          answers[question.id] === value
                            ? "text-white shadow-md"
                            : "border-gray-300 text-gray-700 hover:border-blue-300"
                        }`}
                        style={
                          answers[question.id] === value
                            ? { backgroundColor: "var(--electron-blue)", borderColor: "var(--electron-blue)" }
                            : {}
                        }
                      >
                        {value === 1 && "Strongly Disagree"}
                        {value === 2 && "Disagree"}
                        {value === 3 && "Neutral"}
                        {value === 4 && "Agree"}
                        {value === 5 && "Strongly Agree"}
                      </button>
                    ))}
                  </div>
                ) : (
                  // Multiple choice for objective questions
                  <div className="grid grid-cols-2 gap-3">
                    {question.options.map((option, optIndex) => (
                      <button
                        key={optIndex}
                        onClick={() => handleAnswer(question.id, optIndex)}
                        className={`py-3 px-4 rounded-lg border-2 transition-all text-left ${
                          answers[question.id] === optIndex
                            ? "text-white shadow-md"
                            : "border-gray-300 text-gray-700 hover:border-blue-300"
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
        </div>

        {/* Navigation Buttons */}
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

        {/* Helper Text */}
        {!allCurrentQuestionsAnswered && (
          <p className="text-center text-sm text-gray-500 mt-4">
            Please answer all questions in this section to continue
          </p>
        )}
      </div>
    </div>
  );
}