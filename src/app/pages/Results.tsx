import { Link } from "react-router";
import { useEffect, useState } from "react";
import { Award, ArrowRight, Sparkles, TrendingUp, Download, CheckCircle, GraduationCap, Briefcase } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface AssessmentResults {
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
}

export function Results() {
  const { userData } = useAuth();
  const [results, setResults] = useState<AssessmentResults | null>(null);

  useEffect(() => {
    // Scroll to top instantly when component mounts
    window.scrollTo({ top: 0, behavior: "instant" });

    // Use user-specific key (matches assessmentStorage.ts)
    const userEmail = userData?.email || "student@gmail.com";
    const assessmentKey = `assessmentResults_${userEmail}`;
    const storedResults = localStorage.getItem(assessmentKey);
    if (storedResults) {
      setResults(JSON.parse(storedResults));
    }
  }, [userData]);

  // Download results as PDF (simulated with print)
  const handleDownloadPDF = () => {
    window.print();
  };

  if (!results) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center" style={{ backgroundColor: "var(--electron-light-gray)" }}>
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">No assessment results found.</p>
          <Link
            to="/dashboard/assessment"
            className="px-6 py-3 rounded-lg text-white font-semibold inline-block"
            style={{ backgroundColor: "var(--electron-blue)" }}
          >
            Take Assessment
          </Link>
        </div>
      </div>
    );
  }

  const { track, electives, scores, topDomains, topInterests } = results;

  // Calculate overall score (average of all domains)
  const overallScore = Math.round((scores.VA + scores.MA + scores.SA + scores.LRA) / 4);

  // Determine track color based on Electron Blue theme
  const trackColor = "var(--electron-blue)";
  const secondaryColor = "var(--electron-red)";

  // Helper function to get suggested college courses based on track and elective
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

  // Helper function to get career pathways based on track and elective
  const getCareerPathways = (track: string, elective: string): Array<{ course: string; careers: string[] }> => {
    const normalizedElective = elective.toLowerCase();

    if (track === "Academic") {
      if (normalizedElective.includes("biology")) {
        return [
          { course: "Medicine", careers: ["Doctor", "Surgeon", "Medical Researcher"] },
          { course: "Nursing", careers: ["Registered Nurse", "Clinical Nurse Specialist"] },
          { course: "Biology", careers: ["Biologist", "Research Scientist", "Laboratory Technician"] },
        ];
      } else if (normalizedElective.includes("physics")) {
        return [
          { course: "Engineering (Civil, Electrical, Mechanical)", careers: ["Civil Engineer", "Electrical Engineer", "Mechanical Engineer"] },
          { course: "Applied Physics", careers: ["Physicist", "Research Scientist"] },
        ];
      } else if (normalizedElective.includes("psychology")) {
        return [
          { course: "Psychology", careers: ["Psychologist", "Counselor", "HR Specialist"] },
          { course: "Education", careers: ["Teacher", "School Counselor", "Education Administrator"] },
          { course: "Social Work", careers: ["Social Worker", "Community Organizer"] },
        ];
      } else if (normalizedElective.includes("creative writing")) {
        return [
          { course: "Communication", careers: ["Communications Specialist", "Public Relations Officer"] },
          { course: "Journalism", careers: ["Journalist", "Reporter", "Editor"] },
          { course: "Literature", careers: ["Writer", "Content Creator", "Literary Critic"] },
        ];
      } else if (normalizedElective.includes("entrepreneurship") || normalizedElective.includes("marketing")) {
        return [
          { course: "Business Administration", careers: ["Business Manager", "Entrepreneur", "Operations Manager"] },
          { course: "Marketing", careers: ["Marketing Manager", "Brand Strategist", "Digital Marketer"] },
          { course: "Management", careers: ["Project Manager", "Business Consultant"] },
        ];
      } else if (normalizedElective.includes("media arts") || normalizedElective.includes("visual arts")) {
        return [
          { course: "Multimedia Arts", careers: ["Multimedia Artist", "Graphic Designer", "UX Designer"] },
          { course: "Film", careers: ["Film Director", "Video Editor", "Cinematographer"] },
          { course: "Graphic Design", careers: ["Graphic Designer", "Art Director", "Visual Designer"] },
        ];
      } else if (normalizedElective.includes("coaching") || normalizedElective.includes("fitness")) {
        return [
          { course: "Physical Education", careers: ["PE Teacher", "Sports Coach", "Athletic Trainer"] },
          { course: "Sports Science", careers: ["Sports Scientist", "Fitness Trainer"] },
        ];
      }
    } else if (track === "Technical-Professional") {
      if (normalizedElective.includes("ict")) {
        return [
          { course: "Information Technology", careers: ["IT Specialist", "Systems Administrator", "Network Engineer"] },
          { course: "Computer Science", careers: ["Software Developer", "Data Analyst", "Web Developer"] },
          { course: "Software Engineering", careers: ["Software Engineer", "Full Stack Developer"] },
        ];
      } else if (normalizedElective.includes("programming")) {
        return [
          { course: "Software Engineering", careers: ["Software Engineer", "Backend Developer", "Mobile App Developer"] },
          { course: "Computer Engineering", careers: ["Computer Engineer", "Embedded Systems Developer"] },
        ];
      } else if (normalizedElective.includes("cookery")) {
        return [
          { course: "Culinary Arts", careers: ["Chef", "Sous Chef", "Restaurant Manager"] },
          { course: "Hospitality Management", careers: ["Hotel Manager", "Food Service Manager"] },
          { course: "Tourism", careers: ["Tourism Officer", "Travel Consultant"] },
        ];
      } else if (normalizedElective.includes("bread") || normalizedElective.includes("pastry")) {
        return [
          { course: "Culinary Arts", careers: ["Pastry Chef", "Baker", "Cake Designer"] },
          { course: "Baking & Pastry", careers: ["Professional Baker", "Bakery Owner"] },
        ];
      } else if (normalizedElective.includes("automotive")) {
        return [
          { course: "Mechanical Engineering", careers: ["Mechanical Engineer", "Automotive Engineer"] },
          { course: "Automotive Technology", careers: ["Auto Mechanic", "Automotive Technician", "Service Advisor"] },
        ];
      } else if (normalizedElective.includes("electrical")) {
        return [
          { course: "Electrical Engineering", careers: ["Electrical Engineer", "Power Systems Engineer"] },
          { course: "Electronics Engineering", careers: ["Electronics Technician", "Instrumentation Engineer"] },
        ];
      } else if (normalizedElective.includes("agriculture")) {
        return [
          { course: "Agriculture", careers: ["Agricultural Technologist", "Farm Manager", "Crop Specialist"] },
          { course: "Agribusiness", careers: ["Agribusiness Manager", "Agricultural Economist"] },
        ];
      } else if (normalizedElective.includes("fishery")) {
        return [
          { course: "Fisheries", careers: ["Fisheries Technologist", "Aquaculture Manager"] },
          { course: "Marine Biology", careers: ["Marine Biologist", "Aquatic Researcher"] },
        ];
      } else if (normalizedElective.includes("fitness") || normalizedElective.includes("coaching")) {
        return [
          { course: "Physical Education", careers: ["Fitness Coach", "Personal Trainer", "Sports Coach"] },
          { course: "Sports Management", careers: ["Sports Manager", "Athletic Director"] },
        ];
      }
    }

    return [];
  };

  // Get all suggested courses from all electives
  const allSuggestedCourses = electives.flatMap(elective =>
    getSuggestedCourses(track, elective)
  );

  // Remove duplicates
  const uniqueCourses = Array.from(new Set(allSuggestedCourses));

  // Get career pathways from all electives
  const allCareerPathways = electives.flatMap(elective =>
    getCareerPathways(track, elective)
  );

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: "var(--electron-light-gray)" }}>
      {/* Print-only Header */}
      <div className="print-only print-header" style={{ display: 'none' }}>
        <div className="print-logo">
          <div className="print-logo-circle">EC</div>
          <div className="print-logo-text">
            <h1>Electron College of Technical Education</h1>
            <p>Valenzuela City, Metro Manila</p>
          </div>
        </div>
        <div className="print-meta">
          <div><strong>Document Type:</strong> Assessment Results</div>
          <div><strong>Date Generated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
          <div><strong>Student:</strong> {userData?.name || 'N/A'}</div>
        </div>
      </div>

      {/* Print-only Title */}
      <div className="print-only print-title" style={{ display: 'none' }}>
        AI-Assisted Strand Assessment Results
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Congratulations Hero Section */}
        <div
          className="relative overflow-hidden rounded-2xl shadow-2xl p-12 mb-8 text-center"
          style={{
            background: "linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)",
          }}
        >
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-white opacity-10 rounded-full -translate-x-32 -translate-y-32" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white opacity-10 rounded-full translate-x-32 translate-y-32" />
          
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 mb-6">
              <Award className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-5xl font-bold text-white mb-4">
              🎉 Congratulations!
            </h1>
            <p className="text-2xl text-white/90 mb-2">
              You've Successfully Completed the Assessment
            </p>
            <p className="text-lg text-white/80">
              Your personalized track and elective recommendations are ready
            </p>
          </div>
        </div>

        {/* Download Button Row */}
        <div className="flex justify-end mb-6">
          <button
            onClick={handleDownloadPDF}
            className="px-6 py-3 rounded-lg text-white font-semibold transition-all hover:opacity-90 shadow-md inline-flex items-center gap-2 print:hidden"
            style={{ backgroundColor: "var(--electron-blue)" }}
          >
            <Download className="w-5 h-5" />
            Download Results as PDF
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Left Column: Circular Progress & Summary */}
          <div className="lg:col-span-1">
            {/* Circular Progress Card */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
              <h3 className="text-xl font-bold mb-6 text-center" style={{ color: "var(--electron-blue)" }}>
                Overall Score
              </h3>
              
              {/* Circular Progress Chart */}
              <div className="flex items-center justify-center mb-6">
                <div className="relative w-48 h-48">
                  <svg className="w-48 h-48 transform -rotate-90">
                    {/* Background circle */}
                    <circle
                      cx="96"
                      cy="96"
                      r="88"
                      stroke="#E5E7EB"
                      strokeWidth="16"
                      fill="none"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="96"
                      cy="96"
                      r="88"
                      stroke="var(--electron-blue)"
                      strokeWidth="16"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 88}`}
                      strokeDashoffset={`${2 * Math.PI * 88 * (1 - overallScore / 100)}`}
                      strokeLinecap="round"
                      className="transition-all duration-1000"
                    />
                  </svg>
                  {/* Center text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-bold" style={{ color: "var(--electron-blue)" }}>
                      {overallScore}%
                    </span>
                    <span className="text-sm text-gray-500 mt-1">Score</span>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 text-green-700">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-semibold">Assessment Completed</span>
                </div>
              </div>
            </div>

            {/* Recommended Track Card */}
            <div
              className="bg-white rounded-xl shadow-lg p-8 border-t-4"
              style={{ borderColor: "var(--electron-blue)" }}
            >
              <p className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide text-center">
                Recommended Track
              </p>
              <h2
                className="text-3xl font-bold text-center mb-4"
                style={{ color: "var(--electron-blue)" }}
              >
                {track}
              </h2>
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5" style={{ color: "var(--electron-blue)" }} />
                <span className="text-sm text-gray-600 italic">
                  AI-Powered Analysis
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Detailed Breakdown */}
          <div className="lg:col-span-2">
            {/* Detailed Score Breakdown Table */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-6 h-6" style={{ color: "var(--electron-blue)" }} />
                <h3 className="text-2xl font-bold" style={{ color: "var(--electron-dark-gray)" }}>
                  Detailed Breakdown
                </h3>
              </div>
              
              {/* Table */}
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="w-full">
                  <thead style={{ backgroundColor: "var(--electron-blue)" }}>
                    <tr>
                      <th className="px-6 py-4 text-left text-white font-semibold">Domain</th>
                      <th className="px-6 py-4 text-center text-white font-semibold">Score</th>
                      <th className="px-6 py-4 text-left text-white font-semibold">Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: "Logic / Analytical Reasoning", score: scores.LRA, color: "#F59E0B", key: "LRA" },
                      { name: "Technical / Scientific Aptitude", score: scores.SA, color: "#10B981", key: "SA" },
                      { name: "Mathematical Ability", score: scores.MA, color: "#3B82F6", key: "MA" },
                      { name: "Verbal / Communication", score: scores.VA, color: "#EC4899", key: "VA" },
                    ].map((domain, index) => (
                      <tr key={domain.key} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                        <td className="px-6 py-4 font-semibold" style={{ color: "var(--electron-dark-gray)" }}>
                          {domain.name}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-2xl font-bold" style={{ color: domain.color }}>
                            {domain.score.toFixed(0)}%
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                              className="h-3 rounded-full transition-all duration-1000"
                              style={{
                                width: `${domain.score}%`,
                                backgroundColor: domain.color,
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Suggested Electives */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
              <h3 className="text-2xl font-bold mb-4" style={{ color: "var(--electron-dark-gray)" }}>
                Suggested Electives
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {electives.map((elective, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg border-l-4 flex items-center gap-3"
                    style={{
                      backgroundColor: "var(--electron-light-gray)",
                      borderColor: index === 0 ? "var(--electron-blue)" : "var(--electron-red)",
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                      style={{ backgroundColor: index === 0 ? "var(--electron-blue)" : "var(--electron-red)" }}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">Elective {index + 1}</p>
                      <h4 className="text-lg font-bold" style={{ color: "var(--electron-dark-gray)" }}>
                        {elective}
                      </h4>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Analysis */}
            <div
              className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg p-8 border-2"
              style={{ borderColor: "var(--electron-blue)" }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white flex-shrink-0"
                  style={{ backgroundColor: "var(--electron-blue)" }}
                >
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-3" style={{ color: "var(--electron-blue)" }}>
                    AI Analysis & Explanation
                  </h3>
                  <p className="text-lg leading-relaxed text-gray-800 mb-4">
                    Based on your assessment results, we recommend the <strong style={{ color: "var(--electron-blue)" }}>{track} Track</strong> due to your exceptional performance in <strong>{topDomains.join(" and ")}</strong> and demonstrated interests in <strong>{topInterests.join(" and ")}</strong>. This track aligns perfectly with your cognitive strengths and personal passions, positioning you for academic excellence and career success.
                  </p>
                  <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: "white" }}>
                    <h4 className="font-bold text-gray-900 mb-2">Why This Track?</h4>
                    <p className="text-gray-700 leading-relaxed">
                      {track === "Academic"
                        ? "The Academic Track prepares you for college and university education with a strong foundation in academic subjects. You'll develop critical thinking, research skills, and subject mastery that will serve you well in higher education and professional careers requiring advanced knowledge."
                        : "The Technical-Professional Track equips you with practical, hands-on skills for immediate employment or entrepreneurship. You'll gain industry-relevant competencies, certifications, and real-world experience that prepare you for the workforce or starting your own business."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Track Overview Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h3 className="text-2xl font-bold mb-6" style={{ color: "var(--electron-dark-gray)" }}>
            Your Track: {track}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-bold mb-3" style={{ color: "var(--electron-blue)" }}>
                📚 What You'll Study
              </h4>
              <ul className="space-y-2 text-gray-700">
                {track === "Academic" ? (
                  <>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "var(--electron-blue)" }} />
                      <span>Core academic subjects (Math, Science, English, Filipino)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "var(--electron-blue)" }} />
                      <span>Specialized electives in your chosen field</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "var(--electron-blue)" }} />
                      <span>Research and inquiry-based learning</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "var(--electron-blue)" }} />
                      <span>College preparation and readiness programs</span>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "var(--electron-blue)" }} />
                      <span>Technical and vocational skills training</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "var(--electron-blue)" }} />
                      <span>Hands-on practical work and application</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "var(--electron-blue)" }} />
                      <span>Industry certifications and competencies</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "var(--electron-blue)" }} />
                      <span>Workplace immersion and on-the-job training</span>
                    </li>
                  </>
                )}
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-3" style={{ color: "var(--electron-blue)" }}>
                🎯 Future Opportunities
              </h4>
              <ul className="space-y-2 text-gray-700">
                {track === "Academic" ? (
                  <>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "var(--electron-blue)" }} />
                      <span>Pursue bachelor's degree in college/university</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "var(--electron-blue)" }} />
                      <span>Access to scholarship opportunities</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "var(--electron-blue)" }} />
                      <span>Professional careers requiring licensure</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "var(--electron-blue)" }} />
                      <span>Graduate studies and research opportunities</span>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "var(--electron-blue)" }} />
                      <span>Immediate employment after graduation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "var(--electron-blue)" }} />
                      <span>Start your own business or enterprise</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "var(--electron-blue)" }} />
                      <span>Technical college or vocational degree programs</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "var(--electron-blue)" }} />
                      <span>Industry certifications and career advancement</span>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* NEW SECTION: Suggested College Courses */}
        {uniqueCourses.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap className="w-6 h-6" style={{ color: "var(--electron-blue)" }} />
              <h3 className="text-2xl font-bold" style={{ color: "var(--electron-dark-gray)" }}>
                Suggested College Courses
              </h3>
            </div>
            <p className="text-gray-600 mb-6">
              Based on your recommendation, here are some college courses you may pursue:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {uniqueCourses.map((course, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg border-l-4 transition-all hover:shadow-md"
                  style={{
                    backgroundColor: "var(--electron-light-gray)",
                    borderColor: "var(--electron-blue)",
                  }}
                >
                  <p className="font-semibold" style={{ color: "var(--electron-dark-gray)" }}>
                    {course}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* NEW SECTION: Career Pathways */}
        {allCareerPathways.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="w-6 h-6" style={{ color: "var(--electron-blue)" }} />
              <h3 className="text-2xl font-bold" style={{ color: "var(--electron-dark-gray)" }}>
                Career Pathways
              </h3>
            </div>
            <p className="text-gray-600 mb-6">
              Explore potential career paths based on your recommended track and electives:
            </p>
            <div className="grid grid-cols-1 gap-6">
              {allCareerPathways.map((pathway, index) => (
                <div
                  key={index}
                  className="border-2 rounded-xl p-6 transition-all hover:shadow-lg"
                  style={{ borderColor: "var(--electron-blue)" }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="px-4 py-2 rounded-lg text-white font-bold"
                      style={{ backgroundColor: "var(--electron-blue)" }}
                    >
                      {pathway.course}
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-600 font-medium">Career Opportunities</span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {pathway.careers.map((career, careerIndex) => (
                      <div
                        key={careerIndex}
                        className="px-4 py-2 rounded-lg font-semibold border-2 transition-all hover:shadow-md"
                        style={{
                          borderColor: "var(--electron-red)",
                          color: "var(--electron-red)",
                          backgroundColor: "var(--electron-light-gray)",
                        }}
                      >
                        <Briefcase className="w-4 h-4 inline-block mr-2" />
                        {career}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* What's Next - Action Buttons */}
        <div className="bg-white rounded-xl shadow-lg p-8 print:hidden">
          <h3 className="text-2xl font-bold mb-6" style={{ color: "var(--electron-dark-gray)" }}>
            What's Next?
          </h3>
          <p className="text-gray-700 mb-6 leading-relaxed">
            You have completed the assessment. Based on your results, you may now proceed with the enrollment process to select your track and electives.
          </p>
          <Link
            to="/dashboard/enrollment"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-lg text-white font-bold text-lg transition-all hover:opacity-90 shadow-lg"
            style={{ backgroundColor: "var(--electron-blue)" }}
          >
            Enroll Now
            <ArrowRight className="w-6 h-6" />
          </Link>
        </div>

        {/* Print hint */}
        <div className="mt-8 text-center print:hidden">
          <p className="text-sm text-gray-500">
            💡 Tip: Click "Download Results as PDF" to save or share your results with parents or guidance counselors!
          </p>
        </div>
      </div>
    </div>
  );
}