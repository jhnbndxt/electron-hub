import { Link } from "react-router";
import { useEffect, useState } from "react";
import {
  Award,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Download,
  CheckCircle,
  GraduationCap,
  Briefcase,
  Building2,
  MapPin,
  Phone,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getLatestAssessmentResult } from "../../services/assessmentResultService";
import { LoadingState } from "../components/LoadingState";
import { getRecommendedElectronBranches } from "../utils/electronBranchRecommendations";

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
  overallScore?: number;
  aiRecommendation?: {
    recommendedTrack?: string;
    trackExplanation?: string;
    elective1?: string;
    elective1Explanation?: string;
    elective2?: string;
    elective2Explanation?: string;
    overallAnalysis?: string;
    suggestedCollegeCourses?: string[];
    careerPathways?: Array<{ category: string; careers: string[] }>;
  };
}

export function Results() {
  const { userData } = useAuth();
  const [results, setResults] = useState<AssessmentResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    // Scroll to top instantly when component mounts
    window.scrollTo({ top: 0, behavior: "instant" });

    const loadResults = async () => {
      const userEmail = userData?.email || "student@gmail.com";
      const assessmentKey = `assessmentResults_${userEmail}`;
      const storedResultsRaw = localStorage.getItem(assessmentKey);
      const storedResults = storedResultsRaw ? JSON.parse(storedResultsRaw) : null;

      try {
        const latestResult = await getLatestAssessmentResult(userEmail);

        if (latestResult) {
          setResults({
            track: latestResult.track,
            electives: latestResult.electives,
            scores: latestResult.scores,
            topDomains: latestResult.topDomains,
            topInterests: latestResult.topInterests,
            overallScore: latestResult.overallScore,
            aiRecommendation: storedResults?.aiRecommendation,
          });
          setLoading(false);
          return;
        }

        if (storedResults) {
          setResults(storedResults);
        } else {
          setResults(null);
        }
      } catch (error) {
        console.error("Error loading assessment results:", error);
        if (storedResults) {
          setResults(storedResults);
        } else {
          setResults(null);
        }
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [userData]);

  if (loading) {
    return (
      <div className="portal-dashboard-page flex min-h-full items-center justify-center p-4 sm:p-6 lg:p-8 w-full">
        <LoadingState
          message="Loading assessment results..."
          subtext="Retrieving your latest strand recommendation and score breakdown."
          compact
        />
      </div>
    );
  }

  if (!results) {
    return (
      <div className="portal-dashboard-page flex min-h-full items-center justify-center p-4 sm:p-6 lg:p-8 w-full">
        <div className="portal-glass-panel w-full max-w-xl rounded-2xl p-8 text-center">
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

  const { track, electives, scores, topDomains, topInterests, overallScore: storedOverallScore, aiRecommendation } = results;

  // Calculate overall score (average of all domains) when not provided by stored results
  const overallScore = storedOverallScore ?? Math.round((scores.VA + scores.MA + scores.SA + scores.LRA) / 4);
  const topDomainSummary = topDomains.length > 0 ? topDomains.join(" and ") : "your strongest domains";
  const topInterestSummary = topInterests.length > 0 ? topInterests.join(" and ") : "your preferred interests";

  const trackNarrative = aiRecommendation?.trackExplanation ||
    `The ${track} Track is recommended because your aptitude and interests align strongly with its learning profile.`;

  const analysisSummary = aiRecommendation?.overallAnalysis ||
    `Based on your assessment results, Electron Hub recommends the ${track} Track because of your strong performance in ${topDomainSummary} and your demonstrated interest in ${topInterestSummary}. This recommendation is designed to align your strengths with future study and career opportunities.`;

  const trackColor = "var(--electron-blue)";
  const secondaryColor = "var(--electron-red)";
  const generatedDateLabel = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const scoreRows = [
    { name: "Logic / Analytical Reasoning", score: scores.LRA, color: "#F59E0B", key: "LRA" },
    { name: "Technical / Scientific Aptitude", score: scores.SA, color: "#10B981", key: "SA" },
    { name: "Mathematical Ability", score: scores.MA, color: "#3B82F6", key: "MA" },
    { name: "Verbal / Communication", score: scores.VA, color: "#EC4899", key: "VA" },
  ];
  const trackStudyHighlights =
    track === "Academic"
      ? [
          "Core academic subjects in Math, Science, English, and Filipino",
          "Specialized electives aligned with your recommended field",
          "Research, inquiry, and college-readiness activities",
          "Structured preparation for tertiary education",
        ]
      : [
          "Hands-on technical and vocational skills development",
          "Practical application through workshops and performance tasks",
          "Industry-aligned competencies and certification readiness",
          "Work immersion and employment-oriented preparation",
        ];
  const trackOpportunityHighlights =
    track === "Academic"
      ? [
          "Bachelor's degree pathways in college or university",
          "Scholarship and honors-track opportunities",
          "Professional careers that require advanced study or licensure",
          "Graduate studies and research-oriented options",
        ]
      : [
          "Immediate employment after graduation",
          "Entrepreneurship or small-business opportunities",
          "Technical college and vocational degree pathways",
          "Industry certifications and skills-based career advancement",
        ];
  const recommendationSummary = `Based on your assessment results, Electron Hub recommends the ${track} Track because of your strong performance in ${topDomainSummary} and your demonstrated interest in ${topInterestSummary}. This recommendation is designed to align your strengths with future study and career opportunities.`;
  const trackExplanation =
    track === "Academic"
      ? "The Academic Track provides a solid foundation for higher education. It supports students who perform well in structured academic work and want to build toward university courses and professional careers."
      : "The Technical-Professional Track emphasizes applied learning and practical competencies. It is well-suited for students who thrive in skill-based environments and want strong preparation for employment, entrepreneurship, or technical degree programs.";

  const getScoreInterpretation = (score: number) => {
    if (score >= 85) {
      return "Very Strong";
    }

    if (score >= 70) {
      return "Strong";
    }

    if (score >= 55) {
      return "Developing";
    }

    return "Emerging";
  };

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
  const aiCareerPathways = Array.isArray(aiRecommendation?.careerPathways)
    ? aiRecommendation.careerPathways.filter(
        (pathway) => pathway?.category && Array.isArray(pathway.careers) && pathway.careers.length > 0
      )
    : [];
  const recommendedBranches = getRecommendedElectronBranches({
    track,
    electives,
    suggestedCourses: uniqueCourses,
    careerPathways: aiCareerPathways.length > 0 ? aiCareerPathways : allCareerPathways,
    topDomains,
    topInterests,
  });

  const handleDownloadPDF = async () => {
    setIsDownloading(true);

    try {
      const [{ jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);

      const doc = new jsPDF({ unit: "pt", format: "letter" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 48;
      const topMargin = 96;
      const bottomMargin = 52;
      const contentWidth = pageWidth - margin * 2;
      const cardGap = 14;
      const cardWidth = (contentWidth - cardGap) / 2;
      const cardHeight = 76;
      let cursorY = topMargin;

      const ensureSpace = (height: number) => {
        if (cursorY + height > pageHeight - bottomMargin) {
          doc.addPage();
          cursorY = topMargin;
        }
      };

      const addSectionTitle = (title: string) => {
        ensureSpace(28);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(30, 58, 138);
        doc.text(title, margin, cursorY);
        cursorY += 10;
        doc.setDrawColor(219, 234, 254);
        doc.setLineWidth(1);
        doc.line(margin, cursorY, pageWidth - margin, cursorY);
        cursorY += 18;
      };

      const addParagraph = (
        text: string,
        options?: {
          x?: number;
          width?: number;
          fontSize?: number;
          lineHeight?: number;
          gapAfter?: number;
          color?: [number, number, number];
        }
      ) => {
        const x = options?.x ?? margin;
        const width = options?.width ?? contentWidth;
        const fontSize = options?.fontSize ?? 11;
        const lineHeight = options?.lineHeight ?? 14;
        const gapAfter = options?.gapAfter ?? 10;
        const color = options?.color ?? [51, 65, 85];
        const lines = doc.splitTextToSize(text, width);

        ensureSpace(lines.length * lineHeight + gapAfter + 4);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(fontSize);
        doc.setTextColor(color[0], color[1], color[2]);
        doc.text(lines, x, cursorY);
        cursorY += lines.length * lineHeight + gapAfter;
      };

      const getLastAutoTableFinalY = () => {
        const lastAutoTable = (doc as any).lastAutoTable as { finalY?: number } | undefined;
        return lastAutoTable?.finalY ?? cursorY;
      };

      const drawMetricCard = (
        x: number,
        y: number,
        label: string,
        value: string,
        accent: [number, number, number]
      ) => {
        doc.setDrawColor(226, 232, 240);
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(x, y, cardWidth, cardHeight, 12, 12, "FD");
        doc.setFillColor(accent[0], accent[1], accent[2]);
        doc.roundedRect(x + 12, y + 12, 5, cardHeight - 24, 5, 5, "F");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139);
        doc.text(label.toUpperCase(), x + 28, y + 22);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(31, 41, 55);
        const valueLines = doc.splitTextToSize(value, cardWidth - 42);
        doc.text(valueLines, x + 28, y + 42);
      };

      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(31, 41, 55);
      doc.text("AI-Assisted Strand Assessment Results", pageWidth / 2, cursorY, {
        align: "center",
      });
      cursorY += 24;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(100, 116, 139);
      doc.text(
        "Personalized recommendation report generated from your Electron Hub assessment.",
        pageWidth / 2,
        cursorY,
        { align: "center" }
      );
      cursorY += 28;

      ensureSpace(cardHeight * 2 + cardGap + 24);
      const summaryCards = [
        { label: "Recommended Track", value: track, accent: [30, 58, 138] as [number, number, number] },
        { label: "Overall Score", value: `${overallScore}%`, accent: [185, 28, 28] as [number, number, number] },
        { label: "Top Strengths", value: topDomains.join(", ") || "Not available", accent: [16, 185, 129] as [number, number, number] },
        { label: "Top Interests", value: topInterests.join(", ") || "Not available", accent: [245, 158, 11] as [number, number, number] },
      ];

      summaryCards.forEach((card, index) => {
        const x = margin + (index % 2) * (cardWidth + cardGap);
        const y = cursorY + Math.floor(index / 2) * (cardHeight + cardGap);
        drawMetricCard(x, y, card.label, card.value, card.accent);
      });
      cursorY += cardHeight * 2 + cardGap + 22;

      addSectionTitle("Recommendation Summary");
      const recommendationLines = doc.splitTextToSize(
        `${recommendationSummary} ${trackExplanation}`,
        contentWidth - 32
      );
      const recommendationBoxHeight = recommendationLines.length * 14 + 40;
      ensureSpace(recommendationBoxHeight + 8);
      doc.setFillColor(239, 246, 255);
      doc.setDrawColor(191, 219, 254);
      doc.roundedRect(margin, cursorY, contentWidth, recommendationBoxHeight, 12, 12, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(30, 58, 138);
      doc.text(`Recommended Track: ${track}`, margin + 16, cursorY + 22);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(51, 65, 85);
      doc.text(recommendationLines, margin + 16, cursorY + 42);
      cursorY += recommendationBoxHeight + 20;

      addSectionTitle("Performance Breakdown");
      autoTable(doc, {
        startY: cursorY,
        margin: { top: topMargin, right: margin, bottom: bottomMargin, left: margin },
        head: [["Domain", "Score", "Interpretation"]],
        body: scoreRows.map((domain) => [
          domain.name,
          `${domain.score.toFixed(0)}%`,
          getScoreInterpretation(domain.score),
        ]),
        theme: "grid",
        styles: {
          fontSize: 10.5,
          cellPadding: 8,
          textColor: [31, 41, 55],
          lineColor: [226, 232, 240],
          lineWidth: 1,
        },
        headStyles: {
          fillColor: [30, 58, 138],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        bodyStyles: {
          valign: "middle",
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: {
          1: { halign: "center", fontStyle: "bold" },
          2: { halign: "center" },
        },
      });
      cursorY = getLastAutoTableFinalY() + 22;

      addSectionTitle("Suggested Electives");
      autoTable(doc, {
        startY: cursorY,
        margin: { top: topMargin, right: margin, bottom: bottomMargin, left: margin },
        head: [["Priority", "Elective"]],
        body: electives.map((elective, index) => [`Elective ${index + 1}`, elective]),
        theme: "grid",
        styles: {
          fontSize: 10.5,
          cellPadding: 8,
          textColor: [31, 41, 55],
          lineColor: [226, 232, 240],
          lineWidth: 1,
        },
        headStyles: {
          fillColor: [30, 58, 138],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: {
          0: { cellWidth: 94, halign: "center", fontStyle: "bold" },
        },
      });
      cursorY = getLastAutoTableFinalY() + 22;

      addSectionTitle("Track Overview");
      autoTable(doc, {
        startY: cursorY,
        margin: { top: topMargin, right: margin, bottom: bottomMargin, left: margin },
        head: [["What You'll Study", "Future Opportunities"]],
        body: [[
          trackStudyHighlights.map((item) => `• ${item}`).join("\n"),
          trackOpportunityHighlights.map((item) => `• ${item}`).join("\n"),
        ]],
        theme: "grid",
        styles: {
          fontSize: 10.5,
          cellPadding: 10,
          textColor: [31, 41, 55],
          lineColor: [226, 232, 240],
          lineWidth: 1,
          valign: "top",
        },
        headStyles: {
          fillColor: [30, 58, 138],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
      });
      cursorY = getLastAutoTableFinalY() + 22;

      if (uniqueCourses.length > 0) {
        addSectionTitle("Suggested College Courses");
        autoTable(doc, {
          startY: cursorY,
          margin: { top: topMargin, right: margin, bottom: bottomMargin, left: margin },
          head: [["Course Options"]],
          body: uniqueCourses.map((course) => [course]),
          theme: "grid",
          styles: {
            fontSize: 10.5,
            cellPadding: 8,
            textColor: [31, 41, 55],
            lineColor: [226, 232, 240],
            lineWidth: 1,
          },
          headStyles: {
            fillColor: [30, 58, 138],
            textColor: [255, 255, 255],
            fontStyle: "bold",
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252],
          },
        });
        cursorY = getLastAutoTableFinalY() + 22;
      }

      if (allCareerPathways.length > 0) {
        addSectionTitle("Career Pathways");
        autoTable(doc, {
          startY: cursorY,
          margin: { top: topMargin, right: margin, bottom: bottomMargin, left: margin },
          head: [["College Course", "Career Opportunities"]],
          body: allCareerPathways.map((pathway) => [
            pathway.course,
            pathway.careers.join(", "),
          ]),
          theme: "grid",
          styles: {
            fontSize: 10.2,
            cellPadding: 8,
            textColor: [31, 41, 55],
            lineColor: [226, 232, 240],
            lineWidth: 1,
            valign: "top",
          },
          headStyles: {
            fillColor: [30, 58, 138],
            textColor: [255, 255, 255],
            fontStyle: "bold",
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252],
          },
          columnStyles: {
            0: { cellWidth: 156, fontStyle: "bold" },
          },
        });
        cursorY = getLastAutoTableFinalY() + 22;
      }

      addSectionTitle("Advisory Note");
      addParagraph(
        "Use this report as a guide when selecting your strand and planning your enrollment. You may share it with your parents, guardians, or guidance counselor to support your academic decision-making.",
        { gapAfter: 0 }
      );

      const totalPages = doc.getNumberOfPages();
      for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
        doc.setPage(pageNumber);

        doc.setFillColor(30, 58, 138);
        doc.circle(margin + 16, 40, 16, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(255, 255, 255);
        doc.text("EC", margin + 16, 44, { align: "center" });

        doc.setTextColor(31, 41, 55);
        doc.setFontSize(16);
        doc.text("Electron College of Technical Education", margin + 42, 36);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(107, 114, 128);
        doc.text("Valenzuela City, Metro Manila", margin + 42, 51);

        doc.setFontSize(9);
        doc.setTextColor(75, 85, 99);
        doc.text(`Generated: ${generatedDateLabel}`, pageWidth - margin, 36, { align: "right" });
        doc.text(`Student: ${userData?.name || "N/A"}`, pageWidth - margin, 50, { align: "right" });

        doc.setDrawColor(30, 58, 138);
        doc.setLineWidth(1.2);
        doc.line(margin, 68, pageWidth - margin, 68);

        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.8);
        doc.line(margin, pageHeight - 34, pageWidth - margin, pageHeight - 34);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text("Electron Hub Assessment Results", margin, pageHeight - 20);
        doc.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - margin, pageHeight - 20, {
          align: "right",
        });
      }

      const studentFileName = (userData?.name || "student")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      doc.save(`assessment-results-${studentFileName || "student"}.pdf`);
    } catch (error) {
      console.error("Error generating assessment results PDF:", error);
      window.alert("Unable to generate the assessment results PDF right now. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="portal-dashboard-page flex flex-col gap-6 p-4 sm:p-6 lg:p-8 w-full">
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
          className="relative mb-8 overflow-hidden rounded-[2rem] p-8 text-center shadow-2xl sm:p-10 lg:p-12"
          style={{
            background: "linear-gradient(135deg, #1B3B8F 0%, #2563EB 55%, #60A5FA 100%)",
          }}
        >
          <div className="absolute inset-x-0 top-0 h-48 bg-white/10 blur-3xl" />
          <div className="absolute left-10 top-12 h-28 w-28 rounded-full bg-white/20 blur-2xl" />
          <div className="absolute right-10 bottom-16 h-40 w-40 rounded-full bg-white/15 blur-3xl" />
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 mb-6 shadow-lg backdrop-blur-lg">
              <Award className="w-12 h-12 text-white" />
            </div>
            <h1 className="mb-4 text-3xl font-bold text-white sm:text-5xl">
              Assessment Results
            </h1>
            <p className="mb-2 text-lg text-white/85 sm:text-xl">
              Your personalized recommendation is ready based on your strengths, interests, and achievement profile.
            </p>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/75">
              The next step is choosing the right track and electives that best match your learning style and future goals.
            </p>
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-white/95 px-8 py-3 text-sm font-semibold text-blue-800 shadow-xl shadow-blue-900/10 transition-all hover:bg-white print:hidden"
            >
              <Download className="w-5 h-5" />
              {isDownloading ? "Preparing PDF..." : "Download Results as PDF"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_0.85fr] gap-8 mb-8">
          <div className="space-y-8">
            <section className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
              <div className="absolute left-0 top-0 h-40 w-40 rounded-full bg-white/40 blur-3xl" />
              <div className="absolute right-0 bottom-0 h-32 w-32 rounded-full bg-white/30 blur-2xl" />
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
                  Recommended Track
                </div>
                <h2 className="mt-6 text-4xl font-bold tracking-tight text-slate-950">{track}</h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
                  {trackNarrative}
                </p>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl bg-slate-50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Top strengths</p>
                    <p className="mt-3 text-lg font-semibold text-slate-900">{topDomainSummary}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Interest match</p>
                    <p className="mt-3 text-lg font-semibold text-slate-900">{topInterestSummary}</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Suggested Electives</p>
                  <h3 className="mt-3 text-3xl font-bold text-slate-950">Courses that fit your profile</h3>
                </div>
                <span className="inline-flex items-center rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
                  Priority picks
                </span>
              </div>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {electives.map((elective, index) => (
                  <div
                    key={index}
                    className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white text-lg font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Elective {index + 1}</p>
                        <h4 className="mt-2 text-lg font-semibold text-slate-950">{elective}</h4>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-blue-600 text-white shadow-lg">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Analysis Summary</p>
                  <h3 className="mt-2 text-3xl font-bold text-slate-950">Why this recommendation works</h3>
                </div>
              </div>
              <p className="mt-6 max-w-3xl text-sm leading-7 text-slate-600">
                {analysisSummary}
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">What stands out</p>
                  <p className="mt-3 text-sm text-slate-700">Your profile shows strong aptitude in subjects that map directly to this track’s core strengths, making it the most balanced option for your future.</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">What to expect</p>
                  <p className="mt-3 text-sm text-slate-700">This track emphasizes the right mix of learning, hands-on experience, and opportunity to keep you engaged while preparing you for real-world success.</p>
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-8">
            <section className="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Score Snapshot</p>
                  <h3 className="mt-2 text-2xl font-bold text-slate-950">Performance overview</h3>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600">
                  Supporting insight
                </span>
              </div>

              <div className="mt-6 rounded-[2rem] bg-blue-600 p-6 text-white shadow-inner shadow-blue-500/10">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-blue-200">Overall score</p>
                    <p className="mt-3 text-5xl font-bold">{overallScore}%</p>
                  </div>
                  <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white/15 text-center">
                    <div>
                      <p className="text-sm uppercase text-blue-100">{getScoreInterpretation(overallScore)}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {scoreRows.map((domain) => (
                    <div key={domain.key}>
                      <div className="flex items-center justify-between text-sm font-semibold text-blue-100">
                        <span>{domain.name}</span>
                        <span>{domain.score.toFixed(0)}%</span>
                      </div>
                      <div className="mt-2 h-3 rounded-full bg-white/15">
                        <div
                          className="h-3 rounded-full transition-all duration-1000"
                          style={{ width: `${domain.score}%`, backgroundColor: domain.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/60 bg-white/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
              <h3 className="text-2xl font-bold text-slate-950">Track Snapshot</h3>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                This recommendation highlights your strongest learning channels and how the selected track supports your ambitions.
              </p>
              <div className="mt-6 space-y-3">
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Core focus</p>
                  <p className="mt-2 text-sm text-slate-700">{track === "Academic" ? "Academic rigor, research orientation, and strong college-readiness" : "Hands-on skills, technical practice, and industry-aligned preparation"}.</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Future outlook</p>
                  <p className="mt-2 text-sm text-slate-700">{track === "Academic" ? "Prep for university programs, scholarships, and professional careers." : "Prep for vocational pathways, certification, and early employment opportunities."}</p>
                </div>
              </div>
            </section>
          </aside>
        </div>

        {/* Track Overview Section */}
        <div className="mb-8 rounded-xl bg-white p-5 shadow-lg sm:p-8">
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
          <div className="mb-8 rounded-xl bg-white p-5 shadow-lg sm:p-8">
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
                  className="portal-glass-panel rounded-lg border-l-4 p-4 transition-all hover:shadow-md"
                  style={{
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

        {/* Recommended Electron Branches */}
        {recommendedBranches.length > 0 && (
          <div className="mb-8 rounded-xl bg-white p-5 shadow-md ring-1 ring-gray-100 sm:p-6">
            <div className="mb-5 flex items-start gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white shadow-sm"
                style={{ backgroundColor: "var(--electron-blue)" }}
              >
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-2xl font-bold" style={{ color: "var(--electron-dark-gray)" }}>
                  Recommended Electron Branches
                </h3>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-600">
                  Branches shown here offer programs aligned with your suggested college courses.
                </p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {recommendedBranches.map((branch) => (
                <article
                  key={branch.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-base font-bold leading-snug text-gray-900">{branch.name}</h4>
                      <p className="mt-1 text-sm leading-5 text-gray-600">{branch.description}</p>
                    </div>
                    {branch.isBestMatch && (
                      <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                        Best match
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex items-start gap-2">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" />
                      <span>{branch.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 shrink-0 text-blue-700" />
                      <span>{branch.contact}</span>
                    </div>
                  </div>

                  {branch.matchedPrograms.length > 0 && (
                    <div className="mt-3">
                      <h5 className="text-sm font-semibold text-gray-900 mb-2">Programs Offered</h5>
                      <div className="flex flex-wrap gap-1">
                        {branch.matchedPrograms.map((program, index) => (
                          <span
                            key={index}
                            className="inline-block rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-700"
                          >
                            {program}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <a
                      href={branch.facebookUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-blue-700 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
                    >
                      Facebook Page
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    <a
                      href={`tel:${branch.contact.replace(/[^\d+]/g, "")}`}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-md border border-gray-300 px-3.5 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      Contact Branch
                      <Phone className="h-4 w-4" />
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* NEW SECTION: Career Pathways */}
        {(aiCareerPathways.length > 0 || allCareerPathways.length > 0) && (
          <div className="mb-8 rounded-xl bg-white p-5 shadow-lg sm:p-8">
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="w-6 h-6" style={{ color: "var(--electron-blue)" }} />
              <h3 className="text-2xl font-bold" style={{ color: "var(--electron-dark-gray)" }}>
                Career Pathways
              </h3>
            </div>
            <p className="text-gray-600 mb-3">
              {aiCareerPathways.length > 0
                ? "The AI recommendation identifies career categories that match your strengths, track, and elective choices."
                : "Explore potential career paths based on your recommended track and electives:"}
            </p>
            <p className="text-gray-600 mb-6">
              {aiCareerPathways.length > 0
                ? "These career paths are tailored to your aptitude, interests, and recommended track."
                : "These careers reflect your elective choices and cognitive strengths, making them well-suited pathways to build a meaningful and sustainable future."}
            </p>
            <div className="grid grid-cols-1 gap-6">
              {aiCareerPathways.length > 0 ? (
                aiCareerPathways.map((pathway, categoryIndex) => (
                  <div
                    key={categoryIndex}
                    className="portal-glass-panel rounded-xl border-2 p-6 transition-all hover:shadow-lg"
                    style={{ borderColor: "var(--electron-blue)" }}
                  >
                    <div className="mb-4">
                      <p className="text-sm uppercase tracking-[0.24em] text-slate-400">{pathway.category}</p>
                      <h4 className="mt-2 text-xl font-bold text-slate-900">Career opportunities</h4>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {pathway.careers.map((career, careerIndex) => (
                        <span
                          key={careerIndex}
                          className="rounded-full border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700"
                        >
                          {career}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                allCareerPathways.map((pathway, index) => (
                  <div
                    key={index}
                    className="portal-glass-panel rounded-xl border-2 p-6 transition-all hover:shadow-lg"
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
                ))
              )}
            </div>
          </div>
        )}

        {/* What's Next - Action Buttons */}
        <div className="rounded-xl bg-white p-5 shadow-lg print:hidden sm:p-8">
          <h3 className="text-2xl font-bold mb-6" style={{ color: "var(--electron-dark-gray)" }}>
            What's Next?
          </h3>
          <p className="text-gray-700 mb-6 leading-relaxed">
            You have completed the assessment. Based on your results, you may now proceed with the enrollment process to select your track and electives.
          </p>
          <Link
            to="/dashboard/enrollment"
            className="inline-flex w-full items-center justify-center gap-3 rounded-lg px-6 py-4 text-base font-bold text-white shadow-lg transition-all hover:opacity-90 sm:w-auto sm:px-8 sm:text-lg"
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
