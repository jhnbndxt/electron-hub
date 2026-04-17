import { Link } from "react-router";
import { useEffect, useState } from "react";
import { Award, ArrowRight, Sparkles, TrendingUp, Download, CheckCircle, GraduationCap, Briefcase } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getLatestAssessmentResult } from "../../services/assessmentResultService";

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
  const [loading, setLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    // Scroll to top instantly when component mounts
    window.scrollTo({ top: 0, behavior: "instant" });

    const loadResults = async () => {
      const userEmail = userData?.email || "student@gmail.com";

      try {
        const latestResult = await getLatestAssessmentResult(userEmail);

        if (latestResult) {
          setResults({
            track: latestResult.track,
            electives: latestResult.electives,
            scores: latestResult.scores,
            topDomains: latestResult.topDomains,
            topInterests: latestResult.topInterests,
          });
          setLoading(false);
          return;
        }

        const assessmentKey = `assessmentResults_${userEmail}`;
        const storedResults = localStorage.getItem(assessmentKey);
        if (storedResults) {
          setResults(JSON.parse(storedResults));
        } else {
          setResults(null);
        }
      } catch (error) {
        console.error("Error loading assessment results:", error);
        setResults(null);
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [userData]);

  if (loading) {
    return (
      <div className="portal-dashboard-page flex min-h-full items-center justify-center p-4 sm:p-6 lg:p-8 w-full">
        <div className="portal-glass-panel w-full max-w-xl rounded-2xl p-8 text-center">
          <p className="text-xl text-gray-600">Loading assessment results...</p>
        </div>
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

  const { track, electives, scores, topDomains, topInterests } = results;

  // Calculate overall score (average of all domains)
  const overallScore = Math.round((scores.VA + scores.MA + scores.SA + scores.LRA) / 4);

  // Determine track color based on Electron Blue theme
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
  const topDomainSummary = topDomains.length > 0 ? topDomains.join(" and ") : "your strongest domains";
  const topInterestSummary = topInterests.length > 0 ? topInterests.join(" and ") : "your preferred interests";
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
          className="relative mb-8 overflow-hidden rounded-2xl p-6 text-center shadow-2xl sm:p-8 lg:p-12"
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
            <h1 className="mb-4 text-3xl font-bold text-white sm:text-5xl">
              🎉 Congratulations!
            </h1>
            <p className="mb-2 text-xl text-white/90 sm:text-2xl">
              You've Successfully Completed the Assessment
            </p>
            <p className="text-lg text-white/80">
              Your personalized track and elective recommendations are ready
            </p>
          </div>
        </div>

        {/* Download Button Row */}
        <div className="mb-6 flex justify-stretch sm:justify-end">
          <button
            onClick={handleDownloadPDF}
            disabled={isDownloading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3 text-white font-semibold shadow-md transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 print:hidden sm:w-auto"
            style={{ backgroundColor: "var(--electron-blue)" }}
          >
            <Download className="w-5 h-5" />
            {isDownloading ? "Preparing PDF..." : "Download Results as PDF"}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Left Column: Circular Progress & Summary */}
          <div className="lg:col-span-1">
            {/* Circular Progress Card */}
            <div className="mb-6 rounded-xl bg-white p-5 shadow-lg sm:p-8">
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
                    <span className="text-4xl font-bold sm:text-5xl" style={{ color: "var(--electron-blue)" }}>
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
              className="rounded-xl border-t-4 bg-white p-5 shadow-lg sm:p-8"
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
            <div className="mb-6 rounded-xl bg-white p-5 shadow-lg sm:p-8">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-6 h-6" style={{ color: "var(--electron-blue)" }} />
                <h3 className="text-2xl font-bold" style={{ color: "var(--electron-dark-gray)" }}>
                  Detailed Breakdown
                </h3>
              </div>
              
              {/* Table */}
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full">
                  <thead style={{ backgroundColor: "var(--electron-blue)" }}>
                    <tr>
                      <th className="px-6 py-4 text-left text-white font-semibold">Domain</th>
                      <th className="px-6 py-4 text-center text-white font-semibold">Score</th>
                      <th className="px-6 py-4 text-left text-white font-semibold">Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scoreRows.map((domain, index) => (
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
            <div className="mb-6 rounded-xl bg-white p-5 shadow-lg sm:p-8">
              <h3 className="text-2xl font-bold mb-4" style={{ color: "var(--electron-dark-gray)" }}>
                Suggested Electives
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {electives.map((elective, index) => (
                  <div
                    key={index}
                    className="portal-glass-panel flex items-center gap-3 rounded-lg border-l-4 p-4"
                    style={{
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
              className="portal-glass-panel-strong rounded-xl border p-5 shadow-lg sm:p-8"
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
                  <div className="portal-glass-panel mt-4 rounded-lg p-4">
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

        {/* NEW SECTION: Career Pathways */}
        {allCareerPathways.length > 0 && (
          <div className="mb-8 rounded-xl bg-white p-5 shadow-lg sm:p-8">
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
              ))}
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