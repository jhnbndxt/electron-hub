import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import { ChevronLeft, ChevronRight, Brain, Calculator, Beaker, Lightbulb, Heart, CheckCircle, BarChart3, FileText, Award, BookOpen, ArrowRight, Sparkles, TrendingUp, GraduationCap, Briefcase } from "lucide-react";

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer?: number;
  category: string;
}

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
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [assessmentCompleted, setAssessmentCompleted] = useState(false);
  const [results, setResults] = useState<AssessmentResult | null>(null);
  const [assessmentStarted, setAssessmentStarted] = useState(false);
  const [userInfo, setUserInfo] = useState({ fullName: "", email: "" });
  const [agreeToPrivacy, setAgreeToPrivacy] = useState(false);
  const [errors, setErrors] = useState({ fullName: "", email: "", privacy: "" });

  useEffect(() => {
    window.scrollTo(0, 0);

    // Check if user has already taken the public assessment
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

    // Load questions from localStorage (same as admin uses)
    loadQuestionsFromStorage();
    setLoading(false);
  }, []);

  const loadQuestionsFromStorage = () => {
    const stored = localStorage.getItem("assessment_questions");
    let questions: Question[] = [];

    if (stored) {
      questions = JSON.parse(stored);
    } else {
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
    return [
      // Verbal Section (1-10)
      {
        id: 1,
        question: "rapid = ?",
        options: ["slow", "fast", "weak", "late"],
        correctAnswer: 1,
        category: "Verbal",
      },
      {
        id: 2,
        question: "assist = ?",
        options: ["help", "ignore", "stop", "delay"],
        correctAnswer: 0,
        category: "Verbal",
      },
      {
        id: 3,
        question: "She _ to school",
        options: ["go", "goes", "going", "gone"],
        correctAnswer: 1,
        category: "Verbal",
      },
      {
        id: 4,
        question: "Correct sentence",
        options: [
          "He don't like math",
          "He doesn't likes math",
          "He doesn't like math",
          "He not like math",
        ],
        correctAnswer: 2,
        category: "Verbal",
      },
      {
        id: 5,
        question: '"Technology helps students learn faster" - Main idea?',
        options: ["dislike", "improves learning", "difficult", "lazy"],
        correctAnswer: 1,
        category: "Verbal",
      },
      {
        id: 6,
        question: "Teacher : School :: Doctor : _",
        options: ["medicine", "hospital", "patient", "clinic"],
        correctAnswer: 1,
        category: "Verbal",
      },
      {
        id: 7,
        question: "Opposite of increase",
        options: ["reduce", "expand", "grow", "rise"],
        correctAnswer: 0,
        category: "Verbal",
      },
      {
        id: 8,
        question: "They _ dinner",
        options: ["eat", "eats", "ate", "eating"],
        correctAnswer: 2,
        category: "Verbal",
      },
      {
        id: 9,
        question: "Incorrect sentence",
        options: ["She sings well", "They plays outside", "We study", "I read"],
        correctAnswer: 1,
        category: "Verbal",
      },
      {
        id: 10,
        question: "manageable = ?",
        options: ["impossible", "easy", "controllable", "useless"],
        correctAnswer: 2,
        category: "Verbal",
      },
      // Math Section (11-20)
      {
        id: 11,
        question: "7(5+3) = ?",
        options: ["48", "56", "64", "40"],
        correctAnswer: 1,
        category: "Math",
      },
      {
        id: 12,
        question: "2x + 4 = 10",
        options: ["2", "3", "4", "5"],
        correctAnswer: 1,
        category: "Math",
      },
      {
        id: 13,
        question: "45% of 200",
        options: ["80", "85", "90", "95"],
        correctAnswer: 2,
        category: "Math",
      },
      {
        id: 14,
        question: "18/24 simplified",
        options: ["2/3", "3/4", "1/2", "4/5"],
        correctAnswer: 1,
        category: "Math",
      },
      {
        id: 15,
        question: "Triangle area (base=10, height=5)",
        options: ["25", "50", "30", "15"],
        correctAnswer: 0,
        category: "Math",
      },
      {
        id: 16,
        question: "2, 4, 8, 16, __",
        options: ["20", "24", "32", "30"],
        correctAnswer: 2,
        category: "Math",
      },
      {
        id: 17,
        question: "4x + 3 = 15",
        options: ["2", "3", "4", "5"],
        correctAnswer: 1,
        category: "Math",
      },
      {
        id: 18,
        question: "Which is a prime number?",
        options: ["15", "21", "29", "35"],
        correctAnswer: 2,
        category: "Math",
      },
      {
        id: 19,
        question: "Speed: 60km in 1 hour",
        options: ["60", "30", "120", "90"],
        correctAnswer: 0,
        category: "Math",
      },
      {
        id: 20,
        question: "Sum of triangle angles",
        options: ["90", "180", "270", "360"],
        correctAnswer: 1,
        category: "Math",
      },
      // Science Section (21-30)
      {
        id: 21,
        question: "What do lungs do?",
        options: ["digest food", "help breathing", "pump blood", "filter toxins"],
        correctAnswer: 1,
        category: "Science",
      },
      {
        id: 22,
        question: "Day and night are caused by:",
        options: ["moon phases", "earth rotation", "sun movement", "seasons"],
        correctAnswer: 1,
        category: "Science",
      },
      {
        id: 23,
        question: "Which is renewable energy?",
        options: ["coal", "oil", "solar", "gas"],
        correctAnswer: 2,
        category: "Science",
      },
      {
        id: 24,
        question: "Gravity is a force that:",
        options: ["pushes away", "pulls objects", "creates heat", "makes light"],
        correctAnswer: 1,
        category: "Science",
      },
      {
        id: 25,
        question: "The heart's main function:",
        options: ["digest", "think", "pump blood", "breathe"],
        correctAnswer: 2,
        category: "Science",
      },
      {
        id: 26,
        question: "Ice when heated:",
        options: ["freezes", "melts", "evaporates", "condenses"],
        correctAnswer: 1,
        category: "Science",
      },
      {
        id: 27,
        question: "Which is NOT matter?",
        options: ["water", "air", "rock", "energy"],
        correctAnswer: 3,
        category: "Science",
      },
      {
        id: 28,
        question: "Plants make food through:",
        options: ["respiration", "digestion", "photosynthesis", "transpiration"],
        correctAnswer: 2,
        category: "Science",
      },
      {
        id: 29,
        question: "Force is measured in:",
        options: ["meters", "newtons", "liters", "watts"],
        correctAnswer: 1,
        category: "Science",
      },
      {
        id: 30,
        question: "Which conducts electricity?",
        options: ["wood", "plastic", "metal", "rubber"],
        correctAnswer: 2,
        category: "Science",
      },
      // Logical Section (31-40)
      {
        id: 31,
        question: "3, 6, 9, 12, __",
        options: ["13", "15", "16", "18"],
        correctAnswer: 1,
        category: "Logical",
      },
      {
        id: 32,
        question: "Which is odd one out?",
        options: ["bus", "train", "plane", "car"],
        correctAnswer: 3,
        category: "Logical",
      },
      {
        id: 33,
        question: "Knife is used to:",
        options: ["cut", "write", "measure", "cook"],
        correctAnswer: 0,
        category: "Logical",
      },
      {
        id: 34,
        question: "A, C, E, G, __",
        options: ["H", "I", "J", "K"],
        correctAnswer: 1,
        category: "Logical",
      },
      {
        id: 35,
        question: "All cats are animals. Some animals are cats.",
        options: ["always true", "sometimes true", "never true", "cannot tell"],
        correctAnswer: 1,
        category: "Logical",
      },
      {
        id: 36,
        question: "1, 1, 2, 3, 5, __",
        options: ["6", "7", "8", "9"],
        correctAnswer: 2,
        category: "Logical",
      },
      {
        id: 37,
        question: "Which is odd one out?",
        options: ["apple", "orange", "grape", "banana"],
        correctAnswer: 3,
        category: "Logical",
      },
      {
        id: 38,
        question: "RIGHT reversed is:",
        options: ["THGIR", "RIGHT", "WRONG", "LEFT"],
        correctAnswer: 0,
        category: "Logical",
      },
      {
        id: 39,
        question: "10:100 :: 5:__",
        options: ["10", "25", "50", "75"],
        correctAnswer: 1,
        category: "Logical",
      },
      {
        id: 40,
        question: "2, 5, 10, 17, __",
        options: ["22", "24", "26", "28"],
        correctAnswer: 2,
        category: "Logical",
      },
      // Interests Section (41-55)
      { id: 41, question: "I enjoy solving math problems", options: [], category: "Interests" },
      { id: 42, question: "I like reading/writing", options: [], category: "Interests" },
      { id: 43, question: "I enjoy science experiments", options: [], category: "Interests" },
      { id: 44, question: "I like hands-on work", options: [], category: "Interests" },
      { id: 45, question: "I am interested in business", options: [], category: "Interests" },
      { id: 46, question: "I like computers/tech", options: [], category: "Interests" },
      { id: 47, question: "I like helping people", options: [], category: "Interests" },
      { id: 48, question: "I enjoy cooking", options: [], category: "Interests" },
      { id: 49, question: "I like arts/design", options: [], category: "Interests" },
      { id: 50, question: "I like outdoor work", options: [], category: "Interests" },
      { id: 51, question: "I prefer practical work", options: [], category: "Interests" },
      { id: 52, question: "I enjoy analyzing problems", options: [], category: "Interests" },
      { id: 53, question: "I like teamwork", options: [], category: "Interests" },
      { id: 54, question: "I like machines/electronics", options: [], category: "Interests" },
      { id: 55, question: "I like physical activities", options: [], category: "Interests" },
    ];
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

  if (assessmentCompleted && results) {
    const { track, electives, scores, topDomains, topInterests, overallScore } = results;
    const trackColor = "var(--electron-blue)";
    const secondaryColor = "var(--electron-red)";

    // Helper function to get suggested college courses
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

    return (
      <div className="min-h-screen p-8" style={{ backgroundColor: "var(--electron-light-gray)" }}>
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
          <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
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
          <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
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
          <div className="bg-white rounded-xl shadow-lg p-8">
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
                className="px-8 py-4 rounded-lg text-white font-semibold transition-all shadow-md hover:opacity-90 flex items-center justify-center gap-2"
                style={{ backgroundColor: "var(--electron-blue)" }}
              >
                <FileText className="w-5 h-5" />
                Create Account & Enroll
              </Link>
              <Link
                to="/login"
                className="px-8 py-4 rounded-lg font-semibold transition-all shadow-md flex items-center justify-center gap-2"
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
              💡 Your assessment results will be automatically saved to your account when you log in
            </p>
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
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  const handleSubmit = () => {
    // Calculate scores (same logic as student dashboard assessment)
    const verbalCorrect = sections[0].questions.filter(
      (q) => answers[q.id] === q.correctAnswer
    ).length;
    const mathCorrect = sections[1].questions.filter(
      (q) => answers[q.id] === q.correctAnswer
    ).length;
    const scienceCorrect = sections[2].questions.filter(
      (q) => answers[q.id] === q.correctAnswer
    ).length;
    const logicalCorrect = sections[3].questions.filter(
      (q) => answers[q.id] === q.correctAnswer
    ).length;

    // Calculate domain scores (0-100)
    const VA = (verbalCorrect / 10) * 100;
    const MA = (mathCorrect / 10) * 100;
    const SA = (scienceCorrect / 10) * 100;
    const LRA = (logicalCorrect / 10) * 100;

    // Calculate interest clusters (scaled to 0-20)
    const academic = ((answers[41] + answers[42] + answers[43] + answers[52]) / 4) * 4;
    const tech = ((answers[44] + answers[46] + answers[54]) / 3) * 4;
    const business = answers[45] * 4;
    const helping = ((answers[47] + answers[53]) / 2) * 4;
    const home = answers[48] * 4;
    const creative = answers[49] * 4;
    const outdoor = answers[50] * 4;
    const physical = answers[55] * 4;
    const practical = answers[51] * 4;

    // Calculate track scores
    const academicScore =
      VA * 0.25 + MA * 0.25 + SA * 0.25 + LRA * 0.15 + academic * 0.1;

    const techProScore =
      tech * 0.3 +
      practical * 0.2 +
      home * 0.15 +
      physical * 0.1 +
      outdoor * 0.1 +
      LRA * 0.1 +
      MA * 0.05;

    // Determine track
    const track = academicScore >= techProScore ? "Academic" : "Technical-Professional";

    // Calculate electives based on track
    let electives: string[] = [];
    
    if (track === "Academic") {
      const stemScore = MA * 0.4 + SA * 0.4 + LRA * 0.2;
      const businessScore = MA * 0.4 + business * 0.4 + VA * 0.2;
      const humanitiesScore = VA * 0.5 + helping * 0.3 + LRA * 0.2;
      const creativeScore = creative * 0.6 + VA * 0.2 + LRA * 0.2;
      const sportsScore = physical * 0.6 + SA * 0.2 + LRA * 0.2;

      const electiveScores = [
        { name: "STEM", score: stemScore, electives: ["Biology", "Physics"] },
        { name: "BUSINESS", score: businessScore, electives: ["Entrepreneurship", "Marketing"] },
        { name: "HUMANITIES", score: humanitiesScore, electives: ["Psychology", "Creative Writing"] },
        { name: "CREATIVE", score: creativeScore, electives: ["Media Arts", "Visual Arts"] },
        { name: "SPORTS", score: sportsScore, electives: ["Coaching", "Fitness"] },
      ];

      electiveScores.sort((a, b) => b.score - a.score);
      electives = electiveScores[0].electives;
    } else {
      const ictScore = tech * 0.5 + LRA * 0.3 + MA * 0.2;
      const homeScore = home * 0.6 + practical * 0.4;
      const industrialScore = tech * 0.4 + practical * 0.4 + MA * 0.2;
      const agriScore = outdoor * 0.6 + practical * 0.4;
      const physicalScore = physical * 0.7 + practical * 0.3;

      const electiveScores = [
        { name: "ICT", score: ictScore, electives: ["ICT", "Programming"] },
        { name: "HOME", score: homeScore, electives: ["Cookery", "Bread & Pastry"] },
        { name: "INDUSTRIAL", score: industrialScore, electives: ["Automotive", "Electrical"] },
        { name: "AGRI", score: agriScore, electives: ["Agriculture", "Fishery"] },
        { name: "PHYSICAL", score: physicalScore, electives: ["Fitness Training", "Coaching"] },
      ];

      electiveScores.sort((a, b) => b.score - a.score);
      electives = electiveScores[0].electives;
    }

    // Determine top domains for explanation
    const domainScores = [
      { name: "Verbal", score: VA },
      { name: "Math", score: MA },
      { name: "Science", score: SA },
      { name: "Logical", score: LRA },
    ];
    domainScores.sort((a, b) => b.score - a.score);
    const topDomains = domainScores.slice(0, 2).map(d => d.name);

    // Determine top interest clusters
    const interestScores = [
      { name: "academic subjects", score: academic },
      { name: "technology", score: tech },
      { name: "business", score: business },
      { name: "helping others", score: helping },
      { name: "culinary arts", score: home },
      { name: "creative work", score: creative },
      { name: "outdoor activities", score: outdoor },
      { name: "physical activities", score: physical },
      { name: "practical work", score: practical },
    ];
    interestScores.sort((a, b) => b.score - a.score);
    const topInterests = interestScores.slice(0, 2).map(i => i.name);

    // Calculate overall score (average of domain scores)
    const overallScore = Math.round((VA + MA + SA + LRA) / 4);

    const assessmentResult: AssessmentResult = {
      track,
      electives,
      scores: { VA, MA, SA, LRA },
      topDomains,
      topInterests,
      overallScore,
    };

    // Save to localStorage as public assessment
    localStorage.setItem("publicAssessmentResults", JSON.stringify(assessmentResult));
    localStorage.setItem("publicAssessmentUserInfo", JSON.stringify(userInfo));

    // Also save by email for potential later linking
    const emailKey = `publicAssessment_${userInfo.email}`;
    localStorage.setItem(emailKey, JSON.stringify({ ...assessmentResult, userInfo, timestamp: new Date().toISOString() }));

    // Show results
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

  const isInterestSection = currentSection === 4;
  const allCurrentQuestionsAnswered = currentSectionData.questions.every(
    (q) => answers[q.id] !== undefined
  );

  const isLastSection = currentSection === sections.length - 1;

  // Start Assessment Screen - shown before assessment begins
  if (!assessmentStarted) {
    return (
      <div className="min-h-screen p-8" style={{ backgroundColor: "var(--electron-light-gray)" }}>
        <div className="max-w-3xl mx-auto">
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

          {/* Start Assessment Form */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
            <h2 className="text-2xl font-bold mb-6" style={{ color: "var(--electron-dark-gray)" }}>
              Start Assessment
            </h2>

            <div className="space-y-6">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={userInfo.fullName}
                  onChange={(e) => {
                    setUserInfo({ ...userInfo, fullName: e.target.value });
                    setErrors({ ...errors, fullName: "" });
                  }}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 ${
                    errors.fullName
                      ? "border-red-300 focus:ring-red-200"
                      : "border-gray-300 focus:ring-blue-200"
                  }`}
                  placeholder="Enter your full name"
                />
                {errors.fullName && (
                  <p className="text-red-600 text-sm mt-1">{errors.fullName}</p>
                )}
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address <span className="text-red-600">*</span>
                </label>
                <input
                  type="email"
                  value={userInfo.email}
                  onChange={(e) => {
                    setUserInfo({ ...userInfo, email: e.target.value });
                    setErrors({ ...errors, email: "" });
                  }}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 ${
                    errors.email
                      ? "border-red-300 focus:ring-red-200"
                      : "border-gray-300 focus:ring-blue-200"
                  }`}
                  placeholder="Enter your email address"
                />
                {errors.email && (
                  <p className="text-red-600 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              {/* Data Privacy Notice */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-700 leading-relaxed">
                  <strong className="text-gray-900">Data Privacy Notice:</strong> This system collects your name and email address in accordance with the Data Privacy Act of 2012 (Republic Act No. 10173). The information you provide will be used solely for generating your assessment results and linking them to your account. Your data will be kept confidential and will not be shared with unauthorized parties.
                </p>
              </div>

              {/* Privacy Consent Checkbox */}
              <div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeToPrivacy}
                    onChange={(e) => {
                      setAgreeToPrivacy(e.target.checked);
                      setErrors({ ...errors, privacy: "" });
                    }}
                    className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-200"
                  />
                  <span className="text-sm text-gray-700">
                    I agree to the collection and use of my personal data for assessment purposes. <span className="text-red-600">*</span>
                  </span>
                </label>
                {errors.privacy && (
                  <p className="text-red-600 text-sm mt-2">{errors.privacy}</p>
                )}
              </div>

              {/* Start Button */}
              <button
                onClick={handleStartAssessment}
                className="w-full px-6 py-4 rounded-lg text-white font-bold text-lg transition-all shadow-lg hover:shadow-xl"
                style={{
                  backgroundColor: "var(--electron-blue)",
                }}
              >
                Start Assessment
              </button>
            </div>
          </div>

          {/* Back to Home */}
          <div className="text-center">
            <Link
              to="/"
              className="text-gray-600 hover:text-gray-800 font-medium inline-flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Main Assessment UI
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
          <div className="mt-4 inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full border border-blue-200">
            <Sparkles className="w-4 h-4" style={{ color: "var(--electron-blue)" }} />
            <span className="text-sm font-medium text-gray-700">No login required - Take it now!</span>
          </div>
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
            
            {/* Connecting Lines */}
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
              className="px-6 py-3 rounded-lg text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center gap-2"
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
              className="px-6 py-3 rounded-lg text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
  );
}
