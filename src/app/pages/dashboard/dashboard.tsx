import { Link } from "react-router";
import {
  ArrowRight,
  CheckCircle,
  Clock,
  AlertCircle,
  FileText,
  Award,
  BookOpen,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Progress } from "../../components/ui/progress";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";

export function DashboardPage() {
  const completionPercentage = 33; // Example: assessment completed
  const { userData } = useAuth();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  // Get user's name
  const userName = userData?.name || "Student";

  // Show welcome modal when component mounts
  useEffect(() => {
    // Check if we should show the modal (e.g., first visit after login)
    const hasSeenWelcome = sessionStorage.getItem("hasSeenWelcome");
    if (!hasSeenWelcome) {
      setShowWelcomeModal(true);
      sessionStorage.setItem("hasSeenWelcome", "true");
    }
  }, []);

  const handleCloseModal = () => {
    setShowWelcomeModal(false);
  };

  return (
    <>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div>
          <h1 className="text-4xl mb-2">Welcome back, {userName}!</h1>
          <p className="text-gray-600">
            Here's your enrollment progress and important updates
          </p>
        </div>

        {/* Progress Tracker */}
        <Card className="p-6 border-2 border-[#1E3A8A]">
          <h2 className="text-2xl mb-4 text-[#1E3A8A]">Enrollment Progress</h2>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Overall Progress</span>
              <span className="text-sm text-[#1E3A8A]">
                {completionPercentage}%
              </span>
            </div>
            <Progress value={completionPercentage} className="h-3" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border-2 border-green-200">
              <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg mb-1">Assessment</h3>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
              <Clock className="h-6 w-6 text-[#1E3A8A] flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg mb-1">Recommendation</h3>
                <p className="text-sm text-gray-600">In Progress</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
              <AlertCircle className="h-6 w-6 text-gray-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg mb-1">Enrollment</h3>
                <p className="text-sm text-gray-600">Not Started</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 border-2 hover:border-[#1E3A8A] transition-colors">
            <div className="bg-[#1E3A8A] text-white w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="text-xl mb-2">Continue Assessment</h3>
            <p className="text-gray-600 mb-4">
              Complete your strand assessment to get personalized recommendations
            </p>
            <Link to="/dashboard/assessment">
              <Button className="w-full bg-[#1E3A8A] hover:bg-[#1E40AF]">
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </Card>

          <Card className="p-6 border-2 hover:border-[#B91C1C] transition-colors">
            <div className="bg-[#B91C1C] text-white w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <Award className="h-6 w-6" />
            </div>
            <h3 className="text-xl mb-2">View Results</h3>
            <p className="text-gray-600 mb-4">
              Check your assessment results and strand recommendations
            </p>
            <Link to="/dashboard/results">
              <Button className="w-full bg-[#B91C1C] hover:bg-[#991B1B]">
                View Results
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </Card>

          <Card className="p-6 border-2 hover:border-[#1E3A8A] transition-colors">
            <div className="bg-[#1E3A8A] text-white w-12 h-12 rounded-full flex items-center justify-center mb-4">
              <BookOpen className="h-6 w-6" />
            </div>
            <h3 className="text-xl mb-2">Explore Programs</h3>
            <p className="text-gray-600 mb-4">
              Discover academic and technical-vocational tracks
            </p>
            <Link to="/enrollment-info">
              <Button className="w-full bg-[#1E3A8A] hover:bg-[#1E40AF]">
                Explore
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </Card>
        </div>

        {/* Notifications */}
        <div>
          <h2 className="text-2xl mb-4 text-[#1E3A8A]">
            Notifications & Updates
          </h2>
          <div className="space-y-4">
            <Card className="p-4 border-l-4 border-[#B91C1C]">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-[#B91C1C] flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-lg">Action Required</h3>
                    <span className="text-sm text-gray-500">Today</span>
                  </div>
                  <p className="text-gray-600">
                    Complete your strand assessment to proceed with enrollment
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 border-l-4 border-[#1E3A8A]">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-[#1E3A8A] flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-lg">Enrollment Period Open</h3>
                    <span className="text-sm text-gray-500">March 15</span>
                  </div>
                  <p className="text-gray-600">
                    Online enrollment for SY 2026-2027 is now accepting applications
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 border-l-4 border-[#1E3A8A]">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-[#1E3A8A] flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-lg">New Assessment Available</h3>
                    <span className="text-sm text-gray-500">March 10</span>
                  </div>
                  <p className="text-gray-600">
                    Updated AI-assisted strand recommendation system is now live
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Important Dates */}
        <Card className="p-6 bg-blue-50 border-2 border-blue-200">
          <h2 className="text-2xl mb-4 text-[#1E3A8A]">Important Dates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="bg-[#B91C1C] text-white px-3 py-1 rounded text-sm">
                MAR 1
              </div>
              <div>
                <h3 className="mb-1">Enrollment Opens</h3>
                <p className="text-sm text-gray-600">
                  Online enrollment period begins
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-[#1E3A8A] text-white px-3 py-1 rounded text-sm">
                MAY 31
              </div>
              <div>
                <h3 className="mb-1">Enrollment Deadline</h3>
                <p className="text-sm text-gray-600">
                  Last day to submit applications
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-[#B91C1C] text-white px-3 py-1 rounded text-sm">
                JUN 15
              </div>
              <div>
                <h3 className="mb-1">Orientation Day</h3>
                <p className="text-sm text-gray-600">
                  New student orientation program
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-[#1E3A8A] text-white px-3 py-1 rounded text-sm">
                JUN 20
              </div>
              <div>
                <h3 className="mb-1">Classes Begin</h3>
                <p className="text-sm text-gray-600">
                  First day of school year 2026-2027
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Welcome Modal */}
      {showWelcomeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            className="bg-white max-w-md w-full animate-scaleIn"
            style={{
              borderRadius: "16px",
              boxShadow:
                "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            }}
          >
            <div className="p-8 text-center">
              {/* Success Icon with Waving Hand */}
              <div className="mb-6 flex justify-center">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "#DBEAFE" }}
                >
                  <div className="relative">
                    <CheckCircle
                      className="w-10 h-10"
                      style={{ color: "#1E3A8A" }}
                    />
                    <span
                      className="absolute -top-2 -right-2 text-2xl animate-wave"
                      style={{ transformOrigin: "70% 70%" }}
                    >
                      👋
                    </span>
                  </div>
                </div>
              </div>

              {/* Welcome Message */}
              <h2
                className="text-3xl font-semibold mb-3"
                style={{ color: "#1E3A8A" }}
              >
                Welcome back, {userName}!
              </h2>
              <p className="text-gray-600 mb-8 leading-relaxed">
                We're excited to have you here. Your enrollment journey continues—let's make it great together!
              </p>

              {/* Get Started Button */}
              <button
                onClick={handleCloseModal}
                className="w-full py-4 text-white font-semibold rounded-xl transition-all hover:opacity-90 shadow-lg"
                style={{ backgroundColor: "#1E3A8A" }}
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes wave {
          0%,
          100% {
            transform: rotate(0deg);
          }
          25% {
            transform: rotate(20deg);
          }
          75% {
            transform: rotate(-10deg);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }

        .animate-wave {
          animation: wave 0.6s ease-in-out 2;
        }
      `}</style>
    </>
  );
}