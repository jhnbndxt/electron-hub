import { useState } from "react";
import { useNavigate } from "react-router";
import { ChevronRight, ChevronLeft, Check } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Progress } from "../../components/ui/progress";
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group";
import { Label } from "../../components/ui/label";

const assessmentCategories = [
  {
    category: "Academic Skills",
    questions: [
      {
        id: 1,
        question: "How would you rate your interest in Mathematics and Science?",
        options: [
          "Very High - I excel and enjoy these subjects",
          "High - I perform well in these areas",
          "Moderate - Average performance",
          "Low - Not my strong suit",
        ],
      },
      {
        id: 2,
        question: "Do you enjoy solving complex problems and analytical thinking?",
        options: [
          "Yes, I love challenging problems",
          "Yes, but only sometimes",
          "Not particularly",
          "I prefer other types of tasks",
        ],
      },
    ],
  },
  {
    category: "Interests",
    questions: [
      {
        id: 3,
        question: "Which field interests you the most?",
        options: [
          "Technology and Engineering",
          "Business and Management",
          "Arts and Humanities",
          "Technical and Vocational Skills",
        ],
      },
      {
        id: 4,
        question: "What type of career appeals to you?",
        options: [
          "Research, Engineering, or Medicine",
          "Business, Entrepreneurship, or Finance",
          "Creative or Social Sciences",
          "Hands-on Technical Work",
        ],
      },
    ],
  },
  {
    category: "Personal Strengths",
    questions: [
      {
        id: 5,
        question: "Which describes your strengths best?",
        options: [
          "Analytical and logical thinking",
          "Leadership and decision-making",
          "Creativity and communication",
          "Practical and technical skills",
        ],
      },
      {
        id: 6,
        question: "How do you prefer to learn?",
        options: [
          "Through experiments and research",
          "Through case studies and real-world applications",
          "Through discussion and exploration",
          "Through hands-on practice",
        ],
      },
    ],
  },
];

export function AssessmentPage() {
  const navigate = useNavigate();
  const [currentCategory, setCurrentCategory] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const totalQuestions = assessmentCategories.reduce(
    (acc, cat) => acc + cat.questions.length,
    0
  );
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / totalQuestions) * 100;

  const currentQuestions = assessmentCategories[currentCategory].questions;
  const allQuestionsInCategoryAnswered = currentQuestions.every((q) =>
    answers.hasOwnProperty(q.id)
  );

  const handleAnswer = (questionId: number, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleNext = () => {
    if (currentCategory < assessmentCategories.length - 1) {
      setCurrentCategory((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentCategory > 0) {
      setCurrentCategory((prev) => prev - 1);
    }
  };

  const handleSubmit = () => {
    // In a real app, this would send data to the backend
    navigate("/dashboard/results");
  };

  const isLastCategory = currentCategory === assessmentCategories.length - 1;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-4xl mb-2 text-[#1E3A8A]">Strand Assessment</h1>
        <p className="text-gray-600">
          Answer the questions honestly to receive accurate strand recommendations
        </p>
      </div>

      {/* Progress */}
      <Card className="p-6 border-2 border-[#1E3A8A]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Overall Progress</span>
          <span className="text-sm text-[#1E3A8A]">
            {answeredCount} / {totalQuestions} questions
          </span>
        </div>
        <Progress value={progress} className="h-3" />
      </Card>

      {/* Category Indicator */}
      <div className="flex items-center gap-4">
        {assessmentCategories.map((cat, index) => (
          <div
            key={index}
            className={`flex items-center gap-2 flex-1 p-3 rounded-lg border-2 ${
              index === currentCategory
                ? "bg-[#1E3A8A] text-white border-[#1E3A8A]"
                : index < currentCategory
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-gray-50 border-gray-200 text-gray-500"
            }`}
          >
            {index < currentCategory && (
              <Check className="h-5 w-5 flex-shrink-0" />
            )}
            <div className="flex-1">
              <div className="text-xs opacity-75">Step {index + 1}</div>
              <div className="text-sm">{cat.category}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Questions */}
      <Card className="p-8 border-2 border-gray-200">
        <h2 className="text-2xl mb-6 text-[#1E3A8A]">
          {assessmentCategories[currentCategory].category}
        </h2>

        <div className="space-y-8">
          {currentQuestions.map((q, index) => (
            <div key={q.id} className="space-y-4">
              <h3 className="text-lg">
                {index + 1}. {q.question}
              </h3>
              <RadioGroup
                value={answers[q.id] || ""}
                onValueChange={(value) => handleAnswer(q.id, value)}
              >
                <div className="space-y-3">
                  {q.options.map((option, optIndex) => (
                    <div
                      key={optIndex}
                      className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-colors ${
                        answers[q.id] === option
                          ? "border-[#1E3A8A] bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <RadioGroupItem value={option} id={`q${q.id}-${optIndex}`} />
                      <Label
                        htmlFor={`q${q.id}-${optIndex}`}
                        className="flex-1 cursor-pointer"
                      >
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>
          ))}
        </div>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          onClick={handlePrevious}
          disabled={currentCategory === 0}
          variant="outline"
          size="lg"
        >
          <ChevronLeft className="mr-2 h-5 w-5" />
          Previous
        </Button>

        {isLastCategory ? (
          <Button
            onClick={handleSubmit}
            disabled={!allQuestionsInCategoryAnswered}
            className="bg-[#B91C1C] hover:bg-[#991B1B]"
            size="lg"
          >
            Submit Assessment
            <Check className="ml-2 h-5 w-5" />
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            disabled={!allQuestionsInCategoryAnswered}
            className="bg-[#1E3A8A] hover:bg-[#1E40AF]"
            size="lg"
          >
            Next
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Help Text */}
      <Card className="p-4 bg-blue-50 border-2 border-blue-200">
        <p className="text-sm text-gray-700">
          <strong>Tip:</strong> Answer all questions in each category to proceed.
          Your responses will help us provide the most accurate strand
          recommendation for your academic journey.
        </p>
      </Card>
    </div>
  );
}
