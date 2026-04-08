import { Link } from "react-router";
import { ArrowRight, CheckCircle, BookOpen, Award, Users, Sparkles } from "lucide-react";

export function Home() {
  const strands = [
    {
      name: "GA",
      full: "General Academic",
      description: "For students pursuing college preparatory education with emphasis on academic subjects leading to higher education.",
      color: "#1E3A8A",
    },
    {
      name: "TP",
      full: "Technical Professional",
      description: "For students interested in technical and vocational skills development preparing for immediate employment or entrepreneurship.",
      color: "#B91C1C",
    },
  ];

  const processSteps = [
    {
      number: 1,
      title: "Complete Assessment",
      description: "Take our AI-powered assessment test to evaluate your skills and interests.",
    },
    {
      number: 2,
      title: "Review Recommendation",
      description: "Receive personalized strand recommendations based on your assessment results.",
    },
    {
      number: 3,
      title: "Submit Enrollment",
      description: "Complete your enrollment form and submit required documents online.",
    },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section
        className="relative text-white py-24 overflow-hidden"
        style={{ 
          background: "linear-gradient(135deg, #1E3A8A 0%, #1e40af 50%, #2563eb 100%)"
        }}
      >
        {/* Decorative Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-white/20">
                <Sparkles className="w-4 h-4 text-yellow-300" />
                <span className="text-sm font-medium">AI-Powered Strand Recommendation</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                Electron Hub
              </h1>
              <p className="text-xl md:text-2xl text-blue-100 mb-4 font-light">
                Senior High School Online Enrollment and Assessment Portal
              </p>
              <p className="text-lg text-blue-50 mb-8 leading-relaxed">
                Discover your path to success with our AI-assisted strand recommendation system.
                Make informed decisions about your academic future.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/assessment"
                  className="px-8 py-4 rounded-lg text-white transition-all hover:scale-105 hover:shadow-xl inline-flex items-center justify-center gap-2 font-semibold"
                  style={{ backgroundColor: "rgba(255, 255, 255, 0.15)", backdropFilter: "blur(10px)", border: "2px solid white" }}
                >
                  Start Assessment
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  to="/enrollment-info"
                  className="px-8 py-4 rounded-lg text-white transition-all hover:scale-105 hover:shadow-xl inline-flex items-center justify-center gap-2 font-semibold"
                  style={{ backgroundColor: "var(--electron-red)" }}
                >
                  Enroll Now
                </Link>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-white/5 rounded-2xl backdrop-blur-sm"></div>
                <div className="relative rounded-2xl w-full h-96 bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-2xl">
                  <div className="text-center">
                    <BookOpen className="w-20 h-20 text-white/60 mx-auto mb-4" />
                    <p className="text-white/60 text-lg font-light">Campus Preview</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* System Overview */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: "var(--electron-blue)" }}>
              Welcome to Electron College
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              The Electron Hub is the official online enrollment and AI-assisted strand
              recommendation system of Electron College of Technological Education (Malanday).
              Our system provides a structured, efficient, and data-driven approach to help
              students choose the right academic path.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 rounded-xl bg-gradient-to-br from-blue-50 to-white border border-blue-100 hover:shadow-xl transition-all hover:-translate-y-1">
              <div
                className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg"
                style={{ backgroundColor: "var(--electron-blue)" }}
              >
                <BookOpen className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3" style={{ color: "var(--electron-blue)" }}>
                Smart Assessment
              </h3>
              <p className="text-gray-600 leading-relaxed">
                AI-powered evaluation of your academic skills, interests, and strengths
              </p>
            </div>
            <div className="text-center p-8 rounded-xl bg-gradient-to-br from-red-50 to-white border border-red-100 hover:shadow-xl transition-all hover:-translate-y-1">
              <div
                className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg"
                style={{ backgroundColor: "var(--electron-red)" }}
              >
                <Award className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3" style={{ color: "var(--electron-red)" }}>
                Personalized Recommendations
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Receive tailored strand suggestions based on your unique profile
              </p>
            </div>
            <div className="text-center p-8 rounded-xl bg-gradient-to-br from-blue-50 to-white border border-blue-100 hover:shadow-xl transition-all hover:-translate-y-1">
              <div
                className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg"
                style={{ backgroundColor: "var(--electron-blue)" }}
              >
                <Users className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3" style={{ color: "var(--electron-blue)" }}>
                Streamlined Enrollment
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Complete your enrollment process entirely online with ease
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Process Flow */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: "var(--electron-blue)" }}>
              Enrollment Process
            </h2>
            <p className="text-lg md:text-xl text-gray-600">
              Three simple steps to begin your academic journey
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {processSteps.map((step, index) => (
              <div key={step.number} className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 border border-gray-100 relative">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mb-6 shadow-lg"
                  style={{
                    backgroundColor: index % 2 === 0 ? "var(--electron-blue)" : "var(--electron-red)",
                  }}
                >
                  {step.number}
                </div>
                <h3 className="text-2xl font-bold mb-4" style={{ color: "var(--electron-dark-gray)" }}>
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
                {index < processSteps.length - 1 && (
                  <ArrowRight
                    className="hidden md:block absolute -right-4 top-1/2 transform -translate-y-1/2 text-gray-300"
                    style={{ width: "32px", height: "32px" }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Academic Strands */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: "var(--electron-blue)" }}>
              Academic Tracks
            </h2>
            <p className="text-lg md:text-xl text-gray-600">
              Choose from two senior high school tracks tailored to your interests and goals
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {strands.map((strand) => (
              <div
                key={strand.name}
                className="border-2 rounded-2xl p-8 hover:shadow-2xl transition-all hover:-translate-y-1 bg-white"
                style={{ borderColor: strand.color }}
              >
                <div className="flex items-start gap-6">
                  <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0 shadow-lg"
                    style={{ backgroundColor: strand.color }}
                  >
                    {strand.name}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-3" style={{ color: strand.color }}>
                      {strand.full}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">{strand.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Announcements */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: "var(--electron-blue)" }}>
              Announcements
            </h2>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
              <div className="divide-y divide-gray-200">
                <div className="p-8 hover:bg-blue-50/50 transition-colors">
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(185, 28, 28, 0.1)" }}>
                      <CheckCircle className="w-7 h-7" style={{ color: "var(--electron-red)" }} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold mb-3" style={{ color: "var(--electron-dark-gray)" }}>
                        Enrollment Period for SY 2026-2027 Now Open
                      </h3>
                      <p className="text-gray-600 mb-3 leading-relaxed">
                        Online enrollment for incoming Senior High School students is now active.
                        Complete your assessment and submit your application before April 30, 2026.
                      </p>
                      <p className="text-sm text-gray-500 font-medium">Posted on March 1, 2026</p>
                    </div>
                  </div>
                </div>
                <div className="p-8 hover:bg-blue-50/50 transition-colors">
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(30, 58, 138, 0.1)" }}>
                      <CheckCircle className="w-7 h-7" style={{ color: "var(--electron-blue)" }} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold mb-3" style={{ color: "var(--electron-dark-gray)" }}>
                        New AI Assessment System Launched
                      </h3>
                      <p className="text-gray-600 mb-3 leading-relaxed">
                        Experience our enhanced AI-powered strand recommendation system designed to
                        provide more accurate and personalized academic guidance.
                      </p>
                      <p className="text-sm text-gray-500 font-medium">Posted on February 15, 2026</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        className="py-20 text-white text-center relative overflow-hidden"
        style={{ 
          background: "linear-gradient(135deg, #1E3A8A 0%, #1e40af 50%, #2563eb 100%)"
        }}
      >
        {/* Decorative Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-20 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 left-20 w-80 h-80 bg-white rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Begin Your Journey?</h2>
          <p className="text-xl md:text-2xl text-blue-100 mb-10 leading-relaxed font-light">
            Take the first step towards your future. Start your assessment today and discover
            the perfect strand for you.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/login"
              className="px-10 py-4 bg-white rounded-xl transition-all hover:scale-105 hover:shadow-2xl font-semibold text-lg"
              style={{ color: "var(--electron-blue)" }}
            >
              Get Started
            </Link>
            <Link
              to="/about"
              className="px-10 py-4 rounded-xl text-white transition-all hover:scale-105 hover:shadow-2xl font-semibold text-lg border-2 border-white"
              style={{ backgroundColor: "var(--electron-red)" }}
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}