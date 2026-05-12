import { useEffect, useState } from "react";
import { Link } from "react-router";
import { CheckCircle, FileText, Send, Sparkles, GraduationCap, UserPlus, Brain, CreditCard } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getSystemSettings } from "../../services/systemSettingsService";

function formatDateLabel(dateValue) {
  if (!dateValue) {
    return "Not set";
  }

  const parsedDate = new Date(dateValue);
  if (Number.isNaN(parsedDate.getTime())) {
    return dateValue;
  }

  return parsedDate.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getCurrentAcademicYear() {
  const now = new Date();
  const year = now.getFullYear();
  return now.getMonth() >= 6 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

function getDefaultEnrollmentWindow(academicYear) {
  const startYear = Number.parseInt(String(academicYear || "").split("-")[0], 10);
  const normalizedYear = Number.isFinite(startYear) ? startYear : new Date().getFullYear();

  return {
    start: `${normalizedYear}-03-01`,
    end: `${normalizedYear}-04-30`,
  };
}

export function EnrollmentInfo() {
  const { userRole } = useAuth();
  const [systemSettings, setSystemSettings] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      const result = await getSystemSettings();
      if (active && result?.data) {
        setSystemSettings(result.data);
      }
    }

    void loadSettings();
    return () => {
      active = false;
    };
  }, []);

  const fallbackAcademicYear = systemSettings?.academic_year ?? getCurrentAcademicYear();
  const defaultWindow = getDefaultEnrollmentWindow(fallbackAcademicYear);
  const enrollmentStartDate = systemSettings?.enrollment_start_date ?? defaultWindow.start;
  const enrollmentEndDate = systemSettings?.enrollment_end_date ?? defaultWindow.end;
  const academicYearLabel = systemSettings?.academic_year ?? fallbackAcademicYear;
  const enrollmentOpen = systemSettings?.enrollment_open !== false;
  const enrollmentPeriodText = `${formatDateLabel(enrollmentStartDate)} - ${formatDateLabel(enrollmentEndDate)} for Academic Year ${academicYearLabel}`;

  const requiredDocuments = [
    "Form 138 (Report Card)",
    "Birth Certificate",
    "ID Picture",
    "Grade 10 Diploma",
  ];

  const optionalDocuments = [
    "ESC Certificate",
    "Form 137",
    "Certificate of Good Moral",
  ];

  const enrollmentSteps = [
    {
      icon: UserPlus,
      title: "Create an Account",
      description:
        "Register for Electron Hub or sign in with your existing account to start your application.",
    },
    {
      icon: Brain,
      title: "Take AI Assessment",
      description:
        "Answer the AI-assisted assessment to receive guidance for the track that fits your strengths.",
    },
    {
      icon: Send,
      title: "Submit Enrollment Form",
      description:
        "Complete the online form, upload required documents, and submit your application for registrar review.",
    },
    {
      icon: CreditCard,
      title: "Process Payment",
      description:
        "Proceed with the cashier payment step after your application has been cleared for processing.",
    },
    {
      icon: CheckCircle,
      title: "Officially Enrolled",
      description:
        "Receive enrollment confirmation once your records, documents, and payment are complete.",
    },
  ];

  return (
    <div>
      {/* Hero Section with Gradient */}
      <section
        className="relative text-white py-32 overflow-hidden"
        style={{ 
          background: "linear-gradient(135deg, #1E3A8A 0%, #1e40af 50%, #2563eb 100%)"
        }}
      >
        {/* Decorative Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-white/20">
            <GraduationCap className="w-4 h-4 text-yellow-300" />
            <span className="text-sm font-medium">Simple & Fast Enrollment</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">
            Enrollment Information
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto font-light">
            Everything you need to know about enrolling at Electron College
          </p>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: "#1E3A8A" }}>
              Welcome to Electron College Enrollment
            </h2>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Our streamlined online enrollment process makes it easy for prospective students
              to apply for admission. With our AI-assisted strand recommendation system, you'll
              receive personalized guidance to help you choose the best academic path.
            </p>
            <div
              className="inline-block px-8 py-4 rounded-lg text-white shadow-lg font-semibold text-lg"
              style={{ backgroundColor: "#B91C1C" }}
            >
              Enrollment Period: {enrollmentPeriodText}
            </div>
            {!enrollmentOpen && (
              <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-6 text-red-900">
                <h3 className="text-xl font-semibold mb-2">Enrollment is currently closed</h3>
                <p className="text-sm text-red-800">
                  The enrollment window is currently closed. Please check back during the next open enrollment period or contact the registrar for assistance.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Enrollment Process */}
      <section className="py-16 sm:py-20" style={{ backgroundColor: "#F8FAFC" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: "#1E3A8A" }}>
              How to Enroll
            </h2>
            <p className="mx-auto max-w-3xl text-lg md:text-xl text-gray-600">
              Follow the complete enrollment path below. Each step keeps your application moving toward official enrollment.
            </p>
            <div className="w-24 h-1 mx-auto mt-4 rounded-full" style={{ backgroundColor: "#B91C1C" }}></div>
          </div>

          <div className="relative mx-auto max-w-7xl">
            <div className="absolute left-8 right-8 top-12 hidden h-0.5 bg-gradient-to-r from-blue-200 via-slate-200 to-red-200 lg:block"></div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
              {enrollmentSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={step.title} className="smooth-hover relative rounded-2xl border border-slate-200 bg-white p-5 shadow-lg shadow-blue-950/5 hover:shadow-xl">
                    <div className="mb-5 flex items-center justify-between gap-3">
                      <div
                        className="flex h-14 w-14 items-center justify-center rounded-2xl shadow-md"
                        style={{
                          backgroundColor:
                            index % 2 === 0 ? "#1E3A8A" : "#B91C1C",
                        }}
                      >
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <div
                        className="rounded-full px-3 py-1 text-xs font-bold tracking-wide"
                        style={{
                          backgroundColor: index % 2 === 0 ? "rgba(30, 58, 138, 0.09)" : "rgba(185, 28, 28, 0.09)",
                          color: index % 2 === 0 ? "#1E3A8A" : "#B91C1C",
                        }}
                      >
                        STEP {index + 1}
                      </div>
                    </div>
                    <h3 className="text-lg font-bold leading-tight" style={{ color: "#1F2937" }}>
                      {step.title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-gray-600">{step.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl mb-8 text-center" style={{ color: "var(--electron-blue)" }}>
              Enrollment Requirements
            </h2>
            <div className="bg-gray-50 p-8 rounded-lg">
              <p className="text-gray-600 mb-6">
                Please prepare the following documents before proceeding with your enrollment:
              </p>
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--electron-blue)" }}>
                    Required Documents
                  </h3>
                  <ul className="space-y-4">
                    {requiredDocuments.map((requirement, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle
                          className="w-6 h-6 flex-shrink-0 mt-0.5"
                          style={{ color: "var(--electron-red)" }}
                        />
                        <span className="text-gray-700">{requirement}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4" style={{ color: "var(--electron-blue)" }}>
                    Optional / To Follow Up
                  </h3>
                  <ul className="space-y-4">
                    {optionalDocuments.map((requirement, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle
                          className="w-6 h-6 flex-shrink-0 mt-0.5"
                          style={{ color: "var(--electron-red)" }}
                        />
                        <span className="text-gray-700">{requirement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div
                className="mt-6 p-4 rounded-md border-l-4"
                style={{
                  backgroundColor: "#FEF3C7",
                  borderColor: "var(--electron-red)",
                }}
              >
                <p className="text-sm text-gray-700">
                  <strong>Note:</strong> All documents should be scanned and saved in PDF or
                  image format (JPG, PNG) for online submission.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Strands Overview */}
      <section className="py-16" style={{ backgroundColor: "var(--electron-light-gray)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl mb-4" style={{ color: "var(--electron-blue)" }}>
              Available Tracks
            </h2>
            <p className="text-lg text-gray-600">
              Choose from two senior high school tracks
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-md border-t-4" style={{ borderColor: "var(--electron-blue)" }}>
              <h3 className="text-xl mb-2" style={{ color: "var(--electron-blue)" }}>
                Academic
              </h3>
              <p className="text-gray-600">
                For students pursuing college preparatory education with emphasis on academic subjects leading to higher education.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md border-t-4" style={{ borderColor: "var(--electron-red)" }}>
              <h3 className="text-xl mb-2" style={{ color: "var(--electron-red)" }}>
                Technical Professional
              </h3>
              <p className="text-gray-600">
                For students interested in technical and vocational skills development preparing for immediate employment or entrepreneurship.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Electives & Programs Section */}
      <section className="py-20 bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: "#1E3A8A" }}>
              Explore Our Electives & Programs
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Review the specific subjects and NC certificates available under each track to prepare for your enrollment.
            </p>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
            {/* Left Column: Academic Track */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-2xl font-bold mb-6 pb-4 border-b-4" style={{ color: "#1E3A8A", borderColor: "#1E3A8A" }}>
                ACADEMIC TRACK ELECTIVES
              </h3>

              {/* Arts, Social Sciences, & Humanities */}
              <div className="mb-8">
                <h4 className="font-semibold text-lg mb-3" style={{ color: "#1E3A8A" }}>
                  Arts, Social Sciences, & Humanities
                </h4>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>Creative Composition 1</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>Philippine Governance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>Leadership & Management in the Arts</span>
                  </li>
                </ul>
              </div>

              {/* Business & Entrepreneurship */}
              <div className="mb-8">
                <h4 className="font-semibold text-lg mb-3" style={{ color: "#1E3A8A" }}>
                  Business & Entrepreneurship
                </h4>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>Basic Accounting</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>Business Economics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>Contemporary Marketing</span>
                  </li>
                </ul>
              </div>

              {/* STEM */}
              <div className="mb-8">
                <h4 className="font-semibold text-lg mb-3" style={{ color: "#1E3A8A" }}>
                  STEM
                </h4>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>Finite Mathematics 1 & 2</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>Biology 1 & 2</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>Physics 1 & 2</span>
                  </li>
                </ul>
              </div>

              {/* Sports, Health, & Wellness */}
              <div>
                <h4 className="font-semibold text-lg mb-3" style={{ color: "#1E3A8A" }}>
                  Sports, Health, & Wellness
                </h4>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>Human Movement 1</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>Sports Activity Management</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span>Sports Coaching</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Right Column: Technical-Professional Track */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-2xl font-bold mb-6 pb-4 border-b-4" style={{ color: "#B91C1C", borderColor: "#B91C1C" }}>
                TECHNICAL-PROFESSIONAL ELECTIVES
              </h3>

              {/* Aesthetic, Wellness, & Care */}
              <div className="mb-8">
                <h4 className="font-semibold text-lg mb-3" style={{ color: "#B91C1C" }}>
                  Aesthetic, Wellness, & Care
                </h4>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">•</span>
                    <span>Beauty Care NC II</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">•</span>
                    <span>Caregiving NC II</span>
                  </li>
                </ul>
              </div>

              {/* Agri-Fishery & Food */}
              <div className="mb-8">
                <h4 className="font-semibold text-lg mb-3" style={{ color: "#B91C1C" }}>
                  Agri-Fishery & Food
                </h4>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">•</span>
                    <span>Food Processing NC II</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">•</span>
                    <span>Agricultural Crops NC II</span>
                  </li>
                </ul>
              </div>

              {/* ICT Support & Programming */}
              <div className="mb-8">
                <h4 className="font-semibold text-lg mb-3" style={{ color: "#B91C1C" }}>
                  ICT Support & Programming
                </h4>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">•</span>
                    <span>Java NC III</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">•</span>
                    <span>.NET Technology NC III</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">•</span>
                    <span>Computer Systems Servicing NC II</span>
                  </li>
                </ul>
              </div>

              {/* Hospitality & Tourism */}
              <div className="mb-8">
                <h4 className="font-semibold text-lg mb-3" style={{ color: "#B91C1C" }}>
                  Hospitality & Tourism
                </h4>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">•</span>
                    <span>Events Management NC II</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">•</span>
                    <span>Bakery Operations NC II</span>
                  </li>
                </ul>
              </div>

              {/* Industrial & Automotive */}
              <div>
                <h4 className="font-semibold text-lg mb-3" style={{ color: "#B91C1C" }}>
                  Industrial & Automotive
                </h4>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">•</span>
                    <span>Automotive Servicing NC II</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 mt-1">•</span>
                    <span>Mechatronics NC II</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl mb-4" style={{ color: "var(--electron-blue)" }}>
            Ready to Enroll?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Start your enrollment journey today. Login to your account or create a new one to
            begin the process.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              to="/login"
              state={{ fromPublicLogin: true }}
              className="smooth-button px-8 py-3 rounded-md text-white hover:shadow-lg"
              style={{ backgroundColor: "var(--electron-blue)" }}
            >
              Login to Continue
            </Link>
            <Link
              to={userRole === "student" ? "/dashboard/assessment" : "/login?from=assessment"}
              state={userRole === "student" ? undefined : { fromPublicLogin: true }}
              className="smooth-button px-8 py-3 rounded-md text-white hover:shadow-lg"
              style={{ backgroundColor: "var(--electron-blue)" }}
              preventScrollReset={false}
            >
              Start Assessment
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
