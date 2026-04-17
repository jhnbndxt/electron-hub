import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router";

interface Program {
  name: string;
  tier?: string;
  level?: string;
  description: string;
}

interface Cluster {
  name: string;
  programs: Program[];
}

export function TracksAndPrograms() {
  const [expandedPrograms, setExpandedPrograms] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  const toggleProgram = (programId: string) => {
    const newExpanded = new Set(expandedPrograms);
    if (newExpanded.has(programId)) {
      newExpanded.delete(programId);
    } else {
      newExpanded.add(programId);
    }
    setExpandedPrograms(newExpanded);
  };

  const academicTrack: Cluster[] = [
    {
      name: "Arts, Social Sciences, and Humanities",
      programs: [
        {
          name: "Creative Writing",
          tier: "Tier 1",
          description: "Develop narrative skills, poetry, and expressive writing techniques",
        },
        {
          name: "Creative Nonfiction",
          tier: "Tier 1",
          description: "Craft compelling true stories with literary techniques",
        },
        {
          name: "21st Century Literature",
          tier: "Tier 1",
          description: "Study contemporary literary works and global narratives",
        },
        {
          name: "Contemporary Philippine Arts",
          tier: "Tier 1",
          description: "Explore modern Filipino artistic expressions and cultural movements",
        },
        {
          name: "Philippine Politics and Governance",
          tier: "Tier 2",
          description: "Analyze political systems and governance in the Philippines",
        },
        {
          name: "Community Engagement",
          tier: "Tier 2",
          description: "Develop civic awareness and community service skills",
        },
        {
          name: "Disciplines and Ideas in Social Sciences",
          tier: "Tier 2",
          description: "Foundation in sociology, anthropology, and social research",
        },
        {
          name: "Philosophy",
          tier: "Tier 2",
          description: "Examine fundamental questions about existence, knowledge, and ethics",
        },
      ],
    },
    {
      name: "Business and Entrepreneurship",
      programs: [
        {
          name: "Basic Accounting",
          tier: "Tier 1",
          description: "Fundamentals of financial recording and bookkeeping",
        },
        {
          name: "Fundamentals of Accountancy, Business, and Management 1",
          tier: "Tier 1",
          description: "Introduction to ABM core concepts and principles",
        },
        {
          name: "Fundamentals of Accountancy, Business, and Management 2",
          tier: "Tier 1",
          description: "Advanced ABM topics and practical applications",
        },
        {
          name: "Organization and Management",
          tier: "Tier 1",
          description: "Study organizational structures and management principles",
        },
        {
          name: "Business Finance",
          tier: "Tier 2",
          description: "Financial management and corporate finance strategies",
        },
        {
          name: "Applied Economics",
          tier: "Tier 2",
          description: "Real-world economic analysis and decision-making",
        },
        {
          name: "Marketing",
          tier: "Tier 2",
          description: "Marketing strategies, consumer behavior, and brand management",
        },
        {
          name: "Business Math",
          tier: "Tier 2",
          description: "Mathematical applications in business and finance",
        },
      ],
    },
    {
      name: "STEM (Science, Technology, Engineering, Math)",
      programs: [
        {
          name: "General Biology 1",
          tier: "Tier 1",
          description: "Cell biology, genetics, and molecular processes",
        },
        {
          name: "General Biology 2",
          tier: "Tier 1",
          description: "Ecology, evolution, and biodiversity studies",
        },
        {
          name: "General Chemistry 1",
          tier: "Tier 1",
          description: "Matter, chemical reactions, and stoichiometry",
        },
        {
          name: "General Chemistry 2",
          tier: "Tier 1",
          description: "Thermodynamics, kinetics, and equilibrium",
        },
        {
          name: "General Physics 1",
          tier: "Tier 1",
          description: "Mechanics, waves, and thermodynamics",
        },
        {
          name: "General Physics 2",
          tier: "Tier 1",
          description: "Electricity, magnetism, and modern physics",
        },
        {
          name: "Basic Calculus",
          tier: "Tier 1",
          description: "Limits, derivatives, and integrals",
        },
        {
          name: "Pre-Calculus",
          tier: "Tier 2",
          description: "Advanced algebra, trigonometry, and functions",
        },
        {
          name: "Statistics and Probability",
          tier: "Tier 2",
          description: "Data analysis, distributions, and statistical inference",
        },
        {
          name: "Research/Capstone",
          tier: "Tier 2",
          description: "Independent scientific research project",
        },
      ],
    },
    {
      name: "Sports, Health, and Wellness",
      programs: [
        {
          name: "Human Anatomy and Physiology",
          tier: "Tier 1",
          description: "Study body systems and physiological functions",
        },
        {
          name: "Nutrition and Diet Therapy",
          tier: "Tier 1",
          description: "Nutritional science and dietary planning",
        },
        {
          name: "Personal Development",
          tier: "Tier 1",
          description: "Self-awareness, goal-setting, and personal growth",
        },
        {
          name: "Sports Officiating",
          tier: "Tier 2",
          description: "Rules, regulations, and officiating techniques",
        },
        {
          name: "Sports Coaching and Training",
          tier: "Tier 2",
          description: "Coaching methodologies and athlete development",
        },
        {
          name: "Health and Wellness Management",
          tier: "Tier 2",
          description: "Holistic health programs and wellness strategies",
        },
      ],
    },
  ];

  const technicalTrack: Cluster[] = [
    {
      name: "ICT Support & Programming",
      programs: [
        {
          name: "Java Programming",
          level: "NC III",
          description: "Object-oriented programming with Java",
        },
        {
          name: ".NET Programming",
          level: "NC III",
          description: "Application development using Microsoft .NET framework",
        },
        {
          name: "Computer Systems Servicing",
          level: "NC II",
          description: "Hardware troubleshooting, maintenance, and network setup",
        },
        {
          name: "Animation",
          level: "NC III",
          description: "2D/3D animation, visual effects, and motion graphics",
        },
        {
          name: "Contact Center Services",
          level: "NC II",
          description: "Customer service, technical support, and communication skills",
        },
      ],
    },
    {
      name: "Aesthetic & Wellness",
      programs: [
        {
          name: "Beauty Care",
          level: "NC II",
          description: "Hair care, skin treatments, and beauty salon operations",
        },
        {
          name: "Beauty Care",
          level: "NC III",
          description: "Advanced aesthetics, spa management, and specialized treatments",
        },
        {
          name: "Caregiving",
          level: "NC II",
          description: "Healthcare assistance, elderly care, and patient support",
        },
        {
          name: "Massage Therapy",
          level: "NC II",
          description: "Therapeutic massage techniques and wellness services",
        },
      ],
    },
    {
      name: "Automotive & Industrial",
      programs: [
        {
          name: "Electrical Installation and Maintenance",
          level: "NC II",
          description: "Electrical wiring, circuits, and system maintenance",
        },
        {
          name: "Electrical Installation and Maintenance",
          level: "NC III",
          description: "Advanced electrical systems and industrial applications",
        },
        {
          name: "Electronics Servicing",
          level: "NC II",
          description: "Electronic device repair and circuit troubleshooting",
        },
        {
          name: "Mechatronics",
          level: "NC II",
          description: "Integrated mechanical and electronic systems",
        },
        {
          name: "Automotive Servicing",
          level: "NC I",
          description: "Basic vehicle maintenance and minor repairs",
        },
        {
          name: "Automotive Servicing",
          level: "NC II",
          description: "Engine diagnostics, troubleshooting, and major repairs",
        },
      ],
    },
    {
      name: "Hospitality & Tourism",
      programs: [
        {
          name: "Bread and Pastry Production",
          level: "NC II",
          description: "Baking techniques, pastry arts, and bakery operations",
        },
        {
          name: "Cookery",
          level: "NC II",
          description: "Food preparation, cooking methods, and kitchen management",
        },
        {
          name: "Food and Beverage Services",
          level: "NC II",
          description: "Restaurant service, table settings, and guest relations",
        },
        {
          name: "Housekeeping",
          level: "NC II",
          description: "Room maintenance, cleaning standards, and hotel operations",
        },
        {
          name: "Tourism Promotion Services",
          level: "NC II",
          description: "Tour guiding, travel coordination, and destination marketing",
        },
        {
          name: "Events Management",
          level: "NC III",
          description: "Event planning, coordination, and execution",
        },
      ],
    },
  ];

  const renderProgram = (program: Program, index: number, trackPrefix: string) => {
    const programId = `${trackPrefix}-${index}`;
    const isExpanded = expandedPrograms.has(programId);
    const certification = program.tier || program.level;

    return (
      <div key={programId} className="border-b border-gray-200 last:border-b-0">
        <button
          onClick={() => toggleProgram(programId)}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-blue-50 transition-colors text-left group"
        >
          <div className="flex items-center gap-3 flex-1">
            <div
              className="flex-shrink-0 transition-transform"
              style={{ color: "#1E3A8A" }}
            >
              {isExpanded ? (
                <ChevronDown className="w-5 h-5" />
              ) : (
                <ChevronRight className="w-5 h-5" />
              )}
            </div>
            <span className="text-gray-900" style={{ fontSize: "15px" }}>
              {program.name}
            </span>
          </div>
          {certification && (
            <span
              className="px-3 py-1 rounded-full text-xs font-semibold ml-4 flex-shrink-0"
              style={{ backgroundColor: "#E0F2FE", color: "#1E3A8A" }}
            >
              {certification}
            </span>
          )}
        </button>
        {isExpanded && (
          <div className="px-6 pb-4 pl-14 pr-6">
            <p className="text-gray-600 leading-relaxed" style={{ fontSize: "14px" }}>
              {program.description}
              {certification && (
                <span className="block mt-2 text-sm font-medium" style={{ color: "#1E3A8A" }}>
                  Certification Level: {certification}
                </span>
              )}
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderCluster = (cluster: Cluster, trackPrefix: string) => {
    return (
      <div key={cluster.name} className="mb-8">
        <h3
          className="text-xl font-semibold mb-4 pb-3 border-b-2"
          style={{ color: "#1E3A8A", borderColor: "#1E3A8A" }}
        >
          {cluster.name}
        </h3>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          {cluster.programs.map((program, index) =>
            renderProgram(program, index, `${trackPrefix}-${cluster.name}`)
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col gap-6 p-4 sm:p-6 lg:p-8 w-full">
      <div className="w-full max-w-4xl mx-auto">
        {/* Page Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold mb-3" style={{ color: "#1E3A8A" }}>
            All Tracks & Programs
          </h1>
          <p className="text-gray-600 text-lg" style={{ fontSize: "16px" }}>
            Comprehensive catalog of all academic and technical-vocational offerings at Electron
            College
          </p>
        </div>

        {/* ACADEMIC TRACK */}
        <section className="mb-12">
          <div
            className="mb-8 pb-4 border-b-4"
            style={{ borderColor: "#1E3A8A" }}
          >
            <h2 className="text-3xl font-bold" style={{ color: "#1E3A8A" }}>
              ACADEMIC TRACK
            </h2>
            <p className="text-gray-600 mt-2" style={{ fontSize: "15px" }}>
              College preparatory programs focusing on higher education pathways
            </p>
          </div>

          {academicTrack.map((cluster) => renderCluster(cluster, "academic"))}
        </section>

        {/* TECHNICAL-PROFESSIONAL TRACK */}
        <section className="mb-12">
          <div
            className="mb-8 pb-4 border-b-4"
            style={{ borderColor: "#1E3A8A" }}
          >
            <h2 className="text-3xl font-bold" style={{ color: "#1E3A8A" }}>
              TECHNICAL-PROFESSIONAL TRACK
            </h2>
            <p className="text-gray-600 mt-2" style={{ fontSize: "15px" }}>
              Industry-ready skills with National Certification (NC) credentials
            </p>
          </div>

          {technicalTrack.map((cluster) => renderCluster(cluster, "technical"))}
        </section>

        {/* Footer Info */}
        <div className="mt-12 p-6 bg-blue-50 rounded-lg border-2" style={{ borderColor: "#1E3A8A" }}>
          <h3 className="font-semibold text-lg mb-2" style={{ color: "#1E3A8A" }}>
            Need Help Choosing?
          </h3>
          <p className="text-gray-700 mb-4" style={{ fontSize: "15px" }}>
            Take our AI-powered assessment to discover which track and programs align best with your
            interests, skills, and career goals.
          </p>
          <button
            className="px-6 py-3 rounded-lg text-white font-semibold transition-all hover:opacity-90 shadow-sm"
            style={{ backgroundColor: "#1E3A8A", fontSize: "15px" }}
            onClick={() => {
              navigate("/dashboard/assessment");
              window.scrollTo(0, 0);
            }}
          >
            Take Assessment
          </button>
        </div>
      </div>
    </div>
  );
}