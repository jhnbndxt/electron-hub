import { BookOpen, GraduationCap, TrendingUp } from "lucide-react";

export function Strands() {
  // SHS Strands with descriptions
  const shsStrands = [
    {
      name: "STEM",
      fullName: "Science, Technology, Engineering, and Mathematics",
      description: "Focused on scientific and mathematical concepts, preparing students for engineering, IT, medicine, and research fields.",
      icon: "🔬",
    },
    {
      name: "ABM",
      fullName: "Accountancy, Business, and Management",
      description: "Prepares students for business, finance, and entrepreneurship careers with focus on economics and management.",
      icon: "💼",
    },
    {
      name: "HUMSS",
      fullName: "Humanities and Social Sciences",
      description: "Explores human behavior, society, culture, and communications for careers in education, psychology, and social work.",
      icon: "📚",
    },
    {
      name: "GAS",
      fullName: "General Academic Strand",
      description: "Provides a flexible curriculum allowing students to explore various disciplines before choosing their Senior High program.",
      icon: "🎯",
    },
    {
      name: "TVL-ICT",
      fullName: "Technical-Vocational-Livelihood: Information and Communications Technology",
      description: "Focused on computer programming and emerging technologies, preparing students for immediate employment or further studies in IT.",
      icon: "💻",
    },
  ];

  const electronPrograms = [
    {
      strand: "STEM",
      programs: [
        "Bachelor of Science in Computer Science",
        "Bachelor of Science in Information Technology",
        "Bachelor of Science in Electronics Engineering Technology",
        "Bachelor of Science in Mechanical Engineering Technology",
      ],
    },
    {
      strand: "ABM",
      programs: [
        "Bachelor of Science in Business Administration",
        "Bachelor of Science in Accountancy",
        "Bachelor of Science in Entrepreneurship",
      ],
    },
    {
      strand: "TVL",
      programs: [
        "Diploma in Computer Technology",
        "Diploma in Electronics Technology",
        "Certificate in Automotive Technology",
        "Certificate in Electrical Technology",
      ],
    },
  ];

  const seniorHighPrograms = {
    STEM: [
      { name: "Engineering", description: "Civil, Mechanical, Electrical, Electronics" },
      { name: "Computer Science", description: "Software Development, AI, Data Science" },
      { name: "Medicine", description: "Doctor of Medicine, Nursing, Allied Health" },
      { name: "Architecture", description: "Architectural Design and Planning" },
      { name: "Mathematics", description: "Pure and Applied Mathematics" },
    ],
    ABM: [
      { name: "Business Administration", description: "Management, Marketing, HR" },
      { name: "Accountancy", description: "Financial Accounting, Auditing" },
      { name: "Economics", description: "Macro and Microeconomics" },
      { name: "Entrepreneurship", description: "Business Innovation and Startups" },
    ],
    HUMSS: [
      { name: "Education", description: "Teaching and Pedagogy" },
      { name: "Psychology", description: "Clinical and Counseling Psychology" },
      { name: "Communication", description: "Media, Journalism, Broadcasting" },
      { name: "Social Work", description: "Community Development and Welfare" },
    ],
    GAS: [
      { name: "Liberal Arts", description: "Humanities, Social Sciences" },
      { name: "Communication", description: "Media, Journalism, Broadcasting" },
      { name: "Education", description: "Teaching and Pedagogy" },
      { name: "Psychology", description: "Clinical and Counseling Psychology" },
    ],
    "TVL-ICT": [
      { name: "Information Technology", description: "IT, Software Development, Cybersecurity" },
      { name: "Computer Engineering", description: "Hardware and Systems Design" },
      { name: "Animation & Game Development", description: "Digital Media and Interactive Design" },
      { name: "Web Development", description: "Frontend, Backend, and Full-Stack Development" },
    ],
  };

  const externalInstitutions = [
    "University of the Philippines",
    "Ateneo de Manila University",
    "De La Salle University",
    "University of Santo Tomas",
    "Mapúa University",
    "Technological University of the Philippines",
  ];

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 w-full">
      <div className="w-full max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl mb-2" style={{ color: "var(--electron-blue)" }}>
            Strands & Programs
          </h1>
          <p className="text-gray-600">
            Explore your academic options and plan your educational pathway
          </p>
        </div>

        {/* SHS Strands Overview */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8 border-t-4" style={{ borderColor: "var(--electron-blue)" }}>
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "var(--electron-blue)" }}
            >
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl" style={{ color: "var(--electron-blue)" }}>
                Senior High School Strands
              </h2>
              <p className="text-gray-600">
                Choose the strand that aligns with your interests and career goals
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-6">
            {shsStrands.map((strand, index) => (
              <div
                key={strand.name}
                className="border-2 rounded-lg p-6 hover:shadow-lg transition-all"
                style={{
                  borderColor: index % 2 === 0 ? "var(--electron-blue)" : "var(--electron-red)",
                }}
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{strand.icon}</div>
                  <div className="flex-1">
                    <h3
                      className="text-xl font-bold mb-1"
                      style={{
                        color: index % 2 === 0 ? "var(--electron-blue)" : "var(--electron-red)",
                      }}
                    >
                      {strand.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2 italic">{strand.fullName}</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{strand.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Electron Senior High Programs (Priority) */}
        <div
          className="bg-white rounded-lg shadow-lg p-8 mb-8 border-t-4"
          style={{ borderColor: "var(--electron-red)" }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "var(--electron-blue)" }}
            >
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl" style={{ color: "var(--electron-blue)" }}>
                Programs Available at Electron Senior High School
              </h2>
              <p className="text-gray-600">
                Continue your education with us - aligned with your chosen strand
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {electronPrograms.map((section, index) => (
              <div
                key={section.strand}
                className="border-l-4 pl-6 py-4"
                style={{
                  borderColor: index % 2 === 0 ? "var(--electron-blue)" : "var(--electron-red)",
                }}
              >
                <h3
                  className="text-xl mb-3"
                  style={{
                    color: index % 2 === 0 ? "var(--electron-blue)" : "var(--electron-red)",
                  }}
                >
                  {section.strand} Strand - Available Programs
                </h3>
                <ul className="space-y-2">
                  {section.programs.map((program, pIndex) => (
                    <li key={pIndex} className="flex items-start gap-2">
                      <span
                        className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor:
                            index % 2 === 0 ? "var(--electron-blue)" : "var(--electron-red)",
                        }}
                      ></span>
                      <span className="text-gray-700">{program}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div
            className="mt-6 p-4 rounded-md"
            style={{ backgroundColor: "#EFF6FF" }}
          >
            <p className="text-sm" style={{ color: "var(--electron-blue)" }}>
              <strong>Special Offer:</strong> Electron Senior High students enjoy tuition discounts
              and priority admission when continuing their education with us.
            </p>
          </div>
        </div>

        {/* Senior High Program Recommendations by Strand */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <GraduationCap className="w-7 h-7" style={{ color: "var(--electron-blue)" }} />
            <h2 className="text-2xl" style={{ color: "var(--electron-blue)" }}>
              Senior High Program Recommendations by Strand
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-6">
            {Object.entries(seniorHighPrograms).map(([strand, programs], sIndex) => (
              <div key={strand} className="space-y-4">
                <h3
                  className="text-xl pb-2 border-b-2"
                  style={{
                    color: sIndex % 2 === 0 ? "var(--electron-blue)" : "var(--electron-red)",
                    borderColor: sIndex % 2 === 0 ? "var(--electron-blue)" : "var(--electron-red)",
                  }}
                >
                  {strand}
                </h3>
                {programs.map((program, cIndex) => (
                  <div
                    key={cIndex}
                    className="p-4 rounded-md"
                    style={{ backgroundColor: "var(--electron-light-gray)" }}
                  >
                    <h4 className="mb-1" style={{ color: "var(--electron-dark-gray)" }}>
                      {program.name}
                    </h4>
                    <p className="text-sm text-gray-600">{program.description}</p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* External Institutions (Optional Reference) */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-6 h-6 text-gray-500" />
            <div>
              <h2 className="text-xl text-gray-700">
                Other Institutions Offering Similar Programs (Optional Reference)
              </h2>
              <p className="text-sm text-gray-500">
                For informational purposes only - no affiliation or endorsement
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {externalInstitutions.map((institution, index) => (
              <div
                key={index}
                className="p-4 rounded-md border border-gray-300"
                style={{ backgroundColor: "#FAFAFA" }}
              >
                <p className="text-sm text-gray-600">{institution}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 rounded-md bg-gray-100 border border-gray-300">
            <p className="text-xs text-gray-600">
              <strong>Note:</strong> This list is provided for reference only. Electron Senior High
              is not affiliated with these institutions. We recommend exploring programs at
              Electron Senior High first for continuity and available benefits.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}