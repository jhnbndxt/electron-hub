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
import { supabase } from "../../supabase";

export function Dashboard() {
  const { userData, enrollmentProgress, hasVisitedPayment } = useAuth();
  const { openChat } = useChat();
  const [rejectedDocuments, setRejectedDocuments] = useState<Array<{ name: string; comment: string }>>([]);
  
  // Get first name from full name
  const firstName = userData?.name ? userData.name.split(" ")[0] : "Student";

  // Check for rejected documents from Supabase
  useEffect(() => {
    const checkRejectedDocs = async () => {
      if (!userData?.email) return;

      // Get the user's enrollment and documents
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('id, enrollment_documents(*)')
        .eq('user_id', userData.email)
        .order('created_at', { ascending: false })
        .limit(1);

      const enrollment = enrollments?.[0];
      if (!enrollment?.enrollment_documents) return;

      const documentNames: Record<string, string> = {
        birthCertificate: "PSA Birth Certificate",
        form138: "Form 138 (Report Card)",
        form137: "Form 137",
        goodMoral: "Good Moral Certificate",
        idPicture: "2x2 ID Picture",
        diploma: "Grade 10 Diploma",
      };

      const rejected = enrollment.enrollment_documents
        .filter((doc: any) => doc.status === 'rejected')
        .map((doc: any) => ({
          name: documentNames[doc.document_type] || doc.document_type,
          comment: doc.rejection_comment || doc.rejection_reason || "No comment provided",
        }));

      setRejectedDocuments(rejected);
    };

    checkRejectedDocs();
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
      title: "Payment Step Unlocked",
      message: "Your documents have been verified. You can now proceed to the payment page to complete your enrollment.",
      estimatedTime: "Action required"
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
    const paymentCompleted = enrollmentSteps.find(step => step.name === "Payment Verified")?.status === "completed";
    
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
  const completedStepsCount = enrollmentSteps.filter((step) => step.status === "completed").length;
  const progressPercentage = Math.round((completedStepsCount / enrollmentSteps.length) * 100);
  const nextTask = upcomingTasks[0];
  const heroMessage = rejectedDocuments.length > 0
    ? "A few requirements still need your attention. Review the feedback below, update the affected documents, and continue your enrollment with confidence."
    : isFullyEnrolled
    ? "Your enrollment is complete. Use your portal to stay organized, review your student details, and keep track of the updates that matter next."
    : currentStatusInfo?.message || "Let's continue your enrollment journey at Electron College.";
  const primaryAction = rejectedDocuments.length > 0
    ? { label: "Review document feedback", link: "/dashboard/enrollment" }
    : isFullyEnrolled && nextTask
    ? { label: nextTask.title, link: nextTask.link }
    : nextTask
    ? { label: "Continue next step", link: nextTask.link }
    : { label: "View my results", link: "/dashboard/results" };

  return (
    <div className="portal-dashboard-page p-4 sm:p-6 lg:p-8">
      {/* Welcome Hero */}
      <div className="portal-glass-panel-strong relative mb-8 overflow-hidden rounded-[2rem] p-6 sm:p-8 lg:p-10">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-12 top-0 h-36 w-36 rounded-full bg-blue-200/50 blur-3xl" />
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-sky-100/60 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-red-100/40 blur-3xl" />
        </div>

        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.95fr)] lg:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200/80 bg-blue-50/85 px-4 py-2 text-sm font-semibold text-blue-900 shadow-sm">
              <Sparkles className="h-4 w-4" />
              {isFullyEnrolled ? "Student access unlocked" : "Enrollment in motion"}
            </div>

            <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-[-0.03em] text-slate-900 sm:text-5xl lg:text-[3.65rem]">
              Welcome back,
              <span className="bg-gradient-to-r from-[#1E3A8A] via-[#2563EB] to-[#B91C1C] bg-clip-text pl-3 text-transparent">
                {firstName}
              </span>
              <span className="ml-3 inline-block">👋</span>
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              {heroMessage}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-4 py-2 text-sm font-medium text-slate-700">
                <TrendingUp className="h-4 w-4 text-blue-700" />
                {progressPercentage}% journey completed
              </div>

              {currentStatusInfo?.estimatedTime && (
                <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-4 py-2 text-sm font-medium text-slate-700">
                  <Clock className="h-4 w-4 text-blue-700" />
                  {currentStatusInfo.estimatedTime}
                </div>
              )}

              <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/70 px-4 py-2 text-sm font-medium text-slate-700">
                {rejectedDocuments.length > 0 ? (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                )}
                {rejectedDocuments.length > 0
                  ? `${rejectedDocuments.length} document${rejectedDocuments.length > 1 ? "s" : ""} need attention`
                  : isFullyEnrolled
                  ? "Enrollment complete"
                  : `${Math.max(enrollmentSteps.length - completedStepsCount, 0)} steps remaining`}
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to={primaryAction.link}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1E3A8A] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/20 transition-all hover:-translate-y-0.5 hover:bg-[#1B357D]"
              >
                {primaryAction.label}
                <ArrowRight className="h-4 w-4" />
              </Link>

              <button
                type="button"
                onClick={openChat}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/80 bg-white/70 px-6 py-3.5 text-sm font-semibold text-slate-800 transition-all hover:-translate-y-0.5 hover:bg-white"
              >
                <Sparkles className="h-4 w-4 text-blue-700" />
                Ask AI Assistant
              </button>
            </div>
          </div>

          <div className="portal-glass-panel rounded-[1.75rem] p-5 sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Journey Pulse
                </p>
                <h2 className="mt-2 text-3xl font-semibold text-slate-900">
                  {progressPercentage}% complete
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  {completedStepsCount} of {enrollmentSteps.length} milestones finished
                </p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1E3A8A] to-[#3B82F6] text-white shadow-lg shadow-blue-900/20">
                <Sparkles className="h-7 w-7" />
              </div>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-slate-200/70">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#1E3A8A] via-[#2563EB] to-[#10B981]"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/70 bg-white/65 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Current Stage
                </p>
                <p className="mt-2 text-base font-semibold text-slate-900">
                  {isFullyEnrolled ? "Officially enrolled" : currentStep?.name || "Getting started"}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {currentStatusInfo?.title || "Your portal is ready when you are."}
                </p>
              </div>

              <div className="rounded-2xl border border-white/70 bg-white/65 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Next Move
                </p>
                <p className="mt-2 text-base font-semibold text-slate-900">
                  {nextTask ? nextTask.title : "Explore your student portal"}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {rejectedDocuments.length > 0
                    ? "Resolve document feedback to unlock the next step."
                    : nextTask
                    ? nextTask.dueDate
                    : "Everything is currently on track."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enrolled Student Banner */}
      {isFullyEnrolled && (
        <div className="mb-8 overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.22),_transparent_28%),linear-gradient(135deg,_#0F9F5E_0%,_#12B76A_45%,_#0E9F6E_100%)] p-6 text-white shadow-[0_30px_70px_-36px_rgba(5,150,105,0.55)] sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.9fr)] lg:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-4 py-2 text-sm font-semibold text-emerald-50">
                <Sparkles className="h-4 w-4" />
                After enrollment
              </div>

              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-white/14 shadow-lg shadow-emerald-950/10 ring-1 ring-white/20">
                  <GraduationCap className="h-10 w-10 text-white" />
                </div>

                <div className="flex-1">
                  <h2 className="text-2xl font-semibold leading-tight sm:text-3xl">
                    What happens next on campus
                  </h2>
                  <p className="mt-3 max-w-3xl text-base leading-7 text-emerald-50/95 sm:text-lg">
                    You do not need to complete more enrollment steps right now. The next updates you receive will be operational: schedules, orientation details, ID release, and other start-of-term notices.
                  </p>

                  <div className="mt-5 flex flex-wrap gap-3 text-sm font-medium text-emerald-50/90">
                    <div className="rounded-full border border-white/20 bg-white/10 px-4 py-2">
                      No urgent action today
                    </div>
                    <div className="rounded-full border border-white/20 bg-white/10 px-4 py-2">
                      Check dashboard regularly
                    </div>
                    <div className="rounded-full border border-white/20 bg-white/10 px-4 py-2">
                      Watch your email for notices
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/20 bg-white/12 p-5 backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-50/75">
                What to Watch For
              </p>

              <div className="mt-5 grid gap-3">
                <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/12">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-white" />
                    <div>
                      <p className="font-semibold text-white">Class schedule and section assignment</p>
                      <p className="mt-1 text-sm text-emerald-50/85">Your official section and timetable will appear once released.</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/12">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-white" />
                    <div>
                      <p className="font-semibold text-white">Orientation details and student guidelines</p>
                      <p className="mt-1 text-sm text-emerald-50/85">Expect reminders about orientation, policies, and next campus steps.</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/12">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-white" />
                    <div>
                      <p className="font-semibold text-white">Student ID release and onboarding updates</p>
                      <p className="mt-1 text-sm text-emerald-50/85">Keep checking your dashboard and email for release schedules and announcements.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl bg-emerald-950/20 px-4 py-3 text-sm text-emerald-50/95 ring-1 ring-white/10">
                <span>Stay active here for the latest campus updates.</span>
                <ArrowRight className="h-4 w-4 shrink-0" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enrollment Progress Tracker */}
      <div className="mb-8 rounded-xl border border-gray-200 bg-white p-5 shadow-md sm:p-8">
        <div className="flex items-center gap-3 mb-8">
          <TrendingUp className="w-7 h-7" style={{ color: "var(--electron-blue)" }} />
          <h2 className="text-xl font-semibold sm:text-2xl" style={{ color: "var(--electron-blue)" }}>
            Your Enrollment Journey
          </h2>
        </div>

        {/* 7-Step Linear Progress Stepper */}
        <div className="relative mb-8 overflow-x-auto pb-2">
          <div className="relative min-w-[820px]">
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
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
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
      <div className="rounded-xl border border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
            className="w-full rounded-lg px-6 py-3 text-white font-semibold whitespace-nowrap shadow-md transition-opacity hover:opacity-90 sm:w-auto"
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