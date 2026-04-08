import { Link } from "react-router";
import {
  Sparkles,
  CheckCircle2,
  Circle,
  Clock,
  FileCheck,
  BookOpen,
  TrendingUp,
  ArrowRight,
  FolderCheck,
  UserCheck,
  GraduationCap,
  UserPlus,
  Brain,
  Upload,
  CreditCard,
  ShieldCheck,
  CircleDot,
  AlertCircle,
  XCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useChat } from "../context/ChatContext";
import { useState, useEffect } from "react";

export function Dashboard() {
  const { userData, enrollmentProgress, updateEnrollmentProgress, hasVisitedPayment } = useAuth();
  const { openChat } = useChat();
  const [rejectedDocuments, setRejectedDocuments] = useState<Array<{ name: string; comment: string }>>([]);
  
  // Get first name from full name
  const firstName = userData?.name ? userData.name.split(" ")[0] : "Student";

  // Check for rejected documents
  useEffect(() => {
    if (userData?.email) {
      const docVerification = JSON.parse(localStorage.getItem("document_verification") || "{}");
      const userDocs = docVerification[userData.email] || {};
      
      const documentNames: Record<string, string> = {
        psaBirthCertificate: "PSA Birth Certificate",
        form138: "Form 138 (Report Card)",
        form137: "Form 137",
        goodMoral: "Good Moral Certificate",
        idPicture: "2x2 ID Picture",
        diploma: "Grade 10 Diploma",
      };

      const rejected = Object.entries(userDocs)
        .filter(([_, doc]: [string, any]) => doc.status === "rejected")
        .map(([key, doc]: [string, any]) => ({
          name: documentNames[key] || key,
          comment: doc.rejectionComment || "No comment provided",
        }));

      setRejectedDocuments(rejected);
    }
  }, [userData]);

  // Define the 7 enrollment steps with icons
  const enrollmentStepsConfig = [
    { icon: UserPlus },
    { icon: Brain },
    { icon: Upload },
    { icon: FileCheck },
    { icon: CreditCard },
    { icon: ShieldCheck },
    { icon: GraduationCap },
  ];

  // Merge enrollment progress from context with icon config
  const enrollmentSteps = enrollmentProgress.map((step, index) => ({
    ...step,
    icon: enrollmentStepsConfig[index].icon,
  }));

  // Get current step for status message
  const currentStep = enrollmentSteps.find(step => step.status === "current");
  const currentStepIndex = enrollmentSteps.findIndex(step => step.status === "current");
  
  // Check if documents are verified
  const documentsVerified = enrollmentSteps.find(step => step.name === "Documents Verified")?.status === "completed";
  
  // Dynamic status messages based on current step
  const statusMessages: Record<string, { title: string; message: string; estimatedTime?: string }> = {
    "Account Created": {
      title: "Account Successfully Created",
      message: "Welcome to Electron College! Your account is now active. Please proceed to take the AI Assessment to discover your ideal academic strand.",
      estimatedTime: "Next step available now"
    },
    "AI Assessment Completed": {
      title: "Assessment Completed",
      message: "Assessment completed. You may now proceed to the enrollment process.",
      estimatedTime: "Next step available now"
    },
    "Documents Submitted": {
      title: "Documents Successfully Submitted",
      message: "Thank you for submitting your enrollment documents. Our registrar team will now review your submissions.",
      estimatedTime: "Verification in progress"
    },
    "Documents Verified": {
      title: "Awaiting Registrar Verification",
      message: "The Registrar is currently reviewing your uploaded documents. Please allow 1-2 business days for your documents to be verified.",
      estimatedTime: "1-2 business days"
    },
    "Payment Submitted": {
      title: "Payment Under Review",
      message: "Your payment has been submitted successfully. Our finance team is verifying your payment details.",
      estimatedTime: "Processing within 24 hours"
    },
    "Payment Verified": {
      title: "Final Verification in Progress",
      message: "Your payment has been verified. Our team is completing the final steps to officially enroll you.",
      estimatedTime: "Almost there!"
    },
    "Enrolled": {
      title: "🎉 Congratulations! You're Officially Enrolled",
      message: "Welcome to Electron College! You have successfully completed the enrollment process.",
      estimatedTime: "Enrollment complete"
    }
  };
  
  // Check if student is fully enrolled
  const isFullyEnrolled = enrollmentSteps.find(step => step.name === "Enrolled")?.status === "completed";

  const currentStatusInfo = currentStep ? statusMessages[currentStep.name] : null;

  // Dynamic upcoming tasks based on enrollment progress
  const getUpcomingTasks = () => {
    const tasks = [];
    
    // Check if assessment is completed
    const assessmentCompleted = enrollmentSteps.find(step => step.name === "AI Assessment Completed")?.status === "completed";
    
    // Check if documents are submitted
    const documentsSubmitted = enrollmentSteps.find(step => step.name === "Documents Submitted")?.status === "completed";
    
    // Check if payment is completed
    const paymentCompleted = enrollmentSteps.find(step => step.name === "Payment Completed")?.status === "completed";
    
    // Task 1: Complete Assessment (if not done)
    if (!assessmentCompleted) {
      tasks.push({
        title: "Take Your AI Assessment",
        description: "Get personalized track and elective recommendations based on your skills and interests",
        dueDate: "Required",
        priority: "high",
        link: "/dashboard/assessment",
        icon: "clock"
      });
    }
    
    // Task 2: Submit Documents (if assessment done but documents not submitted)
    if (assessmentCompleted && !documentsSubmitted) {
      tasks.push({
        title: "Upload Your Documents",
        description: "Submit required documents: PSA Birth Certificate, Report Card, and 2x2 Photo",
        dueDate: "Next Step",
        priority: "high",
        link: "/dashboard/enrollment",
        icon: "file"
      });
    }
    
    // Task 3: Documents Under Review
    if (documentsSubmitted && !documentsVerified && rejectedDocuments.length === 0) {
      tasks.push({
        title: "Documents Under Review",
        description: "Your documents are being reviewed by our registrar. You'll be notified once approved.",
        dueDate: "In Progress",
        priority: "medium",
        link: "/dashboard/enrollment",
        icon: "info"
      });
    }
    
    // Task 4: Complete Payment (if documents approved but payment not done)
    if (documentsVerified && !paymentCompleted && !hasVisitedPayment) {
      tasks.push({
        title: "Complete Your Payment",
        description: "Review payment options and complete your enrollment fee to secure your slot",
        dueDate: "Action Required",
        priority: "high",
        link: "/dashboard/payment",
        icon: "payment"
      });
    }
    
    // Task 5: View Results (if assessment completed)
    if (assessmentCompleted) {
      tasks.push({
        title: "View Your Assessment Results",
        description: "Review your recommended tracks, electives, and career pathways",
        dueDate: "Available",
        priority: "low",
        link: "/dashboard/results",
        icon: "chart"
      });
    }
    
    // If fully enrolled, show helpful post-enrollment tasks
    if (isFullyEnrolled) {
      return [
        {
          title: "Check Your Profile",
          description: "Review and update your student information and contact details",
          dueDate: "Recommended",
          priority: "low",
          link: "/dashboard/profile",
          icon: "user"
        },
        {
          title: "Explore Academic Tracks",
          description: "Learn more about your chosen track and available subjects",
          dueDate: "Informational",
          priority: "low",
          link: "/tracks",
          icon: "book"
        }
      ];
    }
    
    return tasks.slice(0, 3); // Show max 3 tasks
  };

  const upcomingTasks = getUpcomingTasks();

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-4xl mb-2" style={{ color: "var(--electron-blue)" }}>
          Welcome back, {firstName}! 👋
        </h1>
        <p className="text-gray-600 text-lg">
          {isFullyEnrolled ? "You're officially an Electron College student!" : "Let's continue your enrollment journey at Electron College"}
        </p>
      </div>

      {/* Enrolled Student Banner */}
      {isFullyEnrolled && (
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-8 mb-8 text-white">
          <div className="flex items-start gap-6">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-3">
                🎉 Welcome to Electron College Community!
              </h2>
              <p className="text-green-50 mb-4 leading-relaxed">
                Congratulations! You have successfully completed your enrollment. Your class schedule, section assignment, and orientation details will be announced soon. Please check back regularly for updates and monitor your email for important announcements regarding:
              </p>
              <ul className="space-y-2 text-green-50 mb-4">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  <span>Class schedule and section assignment</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  <span>Student orientation date and venue</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  <span>School policies and guidelines</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  <span>Student ID distribution schedule</span>
                </li>
              </ul>
              <p className="text-sm text-green-100">
                <strong>Important:</strong> Keep checking your dashboard and email for further instructions. Welcome aboard!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Enrollment Progress Tracker */}
      <div className="bg-white rounded-xl shadow-md p-8 mb-8 border border-gray-200">
        <div className="flex items-center gap-3 mb-8">
          <TrendingUp className="w-7 h-7" style={{ color: "var(--electron-blue)" }} />
          <h2 className="text-2xl font-semibold" style={{ color: "var(--electron-blue)" }}>
            Your Enrollment Journey
          </h2>
        </div>

        {/* 7-Step Linear Progress Stepper */}
        <div className="relative mb-8 overflow-hidden">
          {/* Connector Line Background */}
          <div 
            className="absolute h-1 bg-gray-200" 
            style={{ 
              top: '32px', 
              left: '60px', 
              right: '60px',
              zIndex: 0
            }}
          ></div>
          
          <div className="flex items-start justify-between relative">
            {enrollmentSteps.map((step, index) => {
              const StepIcon = step.icon;
              return (
                <div key={step.name} className="flex flex-col items-center relative" style={{ flex: '1 1 0', minWidth: '120px' }}>
                  {/* Step Circle */}
                  <div className="relative z-10 mb-3">
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center border-4 transition-all ${
                        step.status === "completed"
                          ? "bg-white"
                          : step.status === "current"
                          ? "bg-white"
                          : "bg-white"
                      }`}
                      style={
                        step.status === "completed"
                          ? { borderColor: "#1E3A8A", backgroundColor: "#1E3A8A" }
                          : step.status === "current"
                          ? { borderColor: "#1E3A8A" }
                          : { borderColor: "#E5E7EB" }
                      }
                    >
                      {step.status === "completed" ? (
                        <CheckCircle2 className="w-8 h-8 text-white" />
                      ) : step.status === "current" ? (
                        <CircleDot
                          className="w-8 h-8"
                          style={{ color: "#1E3A8A" }}
                        />
                      ) : (
                        <StepIcon className="w-7 h-7 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Step Label */}
                  <div className="text-center">
                    <p
                      className={`text-xs font-semibold leading-tight ${
                        step.status === "completed" || step.status === "current"
                          ? ""
                          : "text-gray-400"
                      }`}
                      style={
                        step.status === "completed" || step.status === "current"
                          ? { color: "#1E3A8A" }
                          : {}
                      }
                    >
                      {step.name}
                    </p>
                  </div>

                  {/* Progress Line Segment - Show blue line if current step is completed OR next step is completed/current */}
                  {index < enrollmentSteps.length - 1 && (
                    <div
                      className="absolute h-1"
                      style={{
                        top: '32px',
                        left: '50%',
                        right: '-50%',
                        backgroundColor: (step.status === "completed" || enrollmentSteps[index + 1]?.status === "completed" || enrollmentSteps[index + 1]?.status === "current") && step.status !== "pending" ? "#1E3A8A" : "transparent",
                        zIndex: 1
                      }}
                    ></div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Current Status Card */}
        {currentStatusInfo && (
          <div 
            className="rounded-lg p-6 border-l-4"
            style={{ 
              backgroundColor: "#F8FAFC",
              borderLeftColor: "#1E3A8A"
            }}
          >
            <div className="flex items-start gap-4">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "#1E3A8A" }}
              >
                <CircleDot className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-2" style={{ color: "#1E3A8A" }}>
                  Status: {currentStatusInfo.title}
                </h3>
                <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                  {currentStatusInfo.message}
                </p>
                {currentStatusInfo.estimatedTime && (
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <Clock className="w-4 h-4" style={{ color: "#1E3A8A" }} />
                    <span style={{ color: "#1E3A8A" }}>
                      {currentStatusInfo.estimatedTime}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Rejected Documents Alert */}
        {rejectedDocuments.length > 0 && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-4">
              <AlertCircle className="w-6 h-6 text-red-500" />
              <h3 className="text-lg font-bold mb-2" style={{ color: "#DC2626" }}>
                Document Rejection Notice
              </h3>
            </div>
            <p className="text-sm text-gray-700 mb-3 leading-relaxed">
              Your documents have been reviewed and some have been rejected. Please address the following issues:
            </p>
            <ul className="space-y-2 text-sm text-gray-700 mb-4">
              {rejectedDocuments.map((doc, index) => (
                <li key={index} className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span>{doc.name}: {doc.comment}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-gray-700 mb-3 leading-relaxed">
              Please resubmit the corrected documents to proceed with your enrollment.
            </p>
          </div>
        )}
      </div>

      {/* Upcoming Tasks and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {upcomingTasks.map((task, index) => (
          <Link
            key={index}
            to={task.link}
            className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all group"
          >
            <div className="flex items-start justify-between mb-4">
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform ${
                  task.priority === "high"
                    ? "bg-red-100"
                    : task.priority === "medium"
                    ? "bg-blue-100"
                    : "bg-gray-100"
                }`}
              >
                {task.priority === "high" ? (
                  <Clock className="w-6 h-6" style={{ color: "var(--electron-red)" }} />
                ) : task.priority === "medium" ? (
                  <FileCheck className="w-6 h-6" style={{ color: "var(--electron-blue)" }} />
                ) : (
                  <BookOpen className="w-6 h-6 text-gray-600" />
                )}
              </div>
              <span
                className={`text-xs font-semibold px-3 py-1 rounded-full ${
                  task.priority === "high"
                    ? "bg-red-100 text-red-700"
                    : task.priority === "medium"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {task.dueDate}
              </span>
            </div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--electron-dark-gray)" }}>
              {task.title}
            </h3>
            <p className="text-sm text-gray-600 mb-4">{task.description}</p>
            <div className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--electron-blue)" }}>
              Get Started
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        ))}
      </div>

      {/* Help Section */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: "var(--electron-dark-gray)" }}>
              Need Help? We're Here for You!
            </h3>
            <p className="text-gray-600">
              Have questions about the enrollment process? Our AI assistant is available 24/7
              to guide you through every step.
            </p>
          </div>
          <button
            className="px-6 py-3 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity shadow-md whitespace-nowrap"
            style={{ backgroundColor: "var(--electron-blue)" }}
            onClick={openChat}
          >
            Chat with AI Assistant
          </button>
        </div>
      </div>
    </div>
  );
}