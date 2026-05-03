import { useState, useEffect } from "react";
import { Users, Grid3x3, BookOpen, X, Edit2, Trash2, Save, Download } from "lucide-react";
import { getEnrolledStudents } from "../../../services/adminService";
import { useAuth } from "../../context/AuthContext";
import { ConfirmationModal } from "../../components/ConfirmationModal";
import { supabase } from "../../../supabase";

interface EnrolledStudent {
  id: string;
  name: string;
  email: string;
  track: string;
  elective1: string;
  elective2: string;
  yearLevel: string;
  sectionId?: string;
  section?: string;
}

interface Section {
  id: string;
  name: string;
  track: string;
  elective1?: string;
  elective2?: string;
  combinationKey?: string;
  yearLevel: string;
  students: EnrolledStudent[];
  maxCapacity: number;
}

type SectionConfirmation =
  | { type: "delete-section"; sectionId: string; sectionName: string; studentCount: number }
  | { type: "remove-student"; sectionId: string; enrollmentId: string; studentName: string; sectionName: string }
  | null;

function getCurrentSchoolYear(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth();

  return month >= 6 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}

function getCurrentSemester(date = new Date()) {
  return date.getMonth() <= 4 ? 2 : 1;
}

function toDisplayYearLevel(value?: string | null) {
  const normalizedValue = String(value || "").trim();

  if (!normalizedValue) {
    return "Grade 11";
  }

  if (/^grade\s+/i.test(normalizedValue)) {
    return normalizedValue;
  }

  if (/^\d+$/.test(normalizedValue)) {
    return `Grade ${normalizedValue}`;
  }

  return normalizedValue;
}

function toDatabaseGradeLevel(value?: string | null) {
  return toDisplayYearLevel(value).replace(/^Grade\s+/i, "").trim();
}

function ensureSectionNameForSchoolYear(name: string, schoolYear: string) {
  const trimmedName = name.trim().replace(/\s*\(\d{4}-\d{4}\)\s*$/, "");
  return `${trimmedName} (${schoolYear})`;
}

function normalizeSectionField(value?: string | null, fallback = "Not Set") {
  const normalizedValue = String(value || "").trim();
  return normalizedValue || fallback;
}

function getStudentCombinationKey(student: Pick<EnrolledStudent, "track" | "elective1" | "elective2">) {
  return JSON.stringify([
    normalizeSectionField(student.track),
    normalizeSectionField(student.elective1),
    normalizeSectionField(student.elective2),
  ]);
}

function parseCombinationKey(combinationKey: string) {
  const [track, elective1, elective2] = JSON.parse(combinationKey) as [string, string, string];

  return {
    track,
    elective1,
    elective2,
  };
}

function getSectionIdentity(students: EnrolledStudent[]) {
  if (students.length === 0) {
    return null;
  }

  const combinations = new Map<
    string,
    { combinationKey: string; track: string; elective1: string; elective2: string; count: number }
  >();

  students.forEach((student) => {
    const combinationKey = getStudentCombinationKey(student);
    const existingCombination = combinations.get(combinationKey);

    if (existingCombination) {
      existingCombination.count += 1;
      return;
    }

    combinations.set(combinationKey, {
      combinationKey,
      track: normalizeSectionField(student.track),
      elective1: normalizeSectionField(student.elective1),
      elective2: normalizeSectionField(student.elective2),
      count: 1,
    });
  });

  const [dominantCombination] = [...combinations.values()].sort((leftCombination, rightCombination) => {
    if (rightCombination.count !== leftCombination.count) {
      return rightCombination.count - leftCombination.count;
    }

    return leftCombination.combinationKey.localeCompare(rightCombination.combinationKey);
  });

  return dominantCombination || null;
}

function getMostCommonYearLevel(students: EnrolledStudent[]) {
  const yearLevelCounts = new Map<string, number>();

  students.forEach((student) => {
    const yearLevel = toDisplayYearLevel(student.yearLevel);
    yearLevelCounts.set(yearLevel, (yearLevelCounts.get(yearLevel) || 0) + 1);
  });

  const [mostCommonYearLevel] = [...yearLevelCounts.entries()].sort((leftEntry, rightEntry) => {
    if (rightEntry[1] !== leftEntry[1]) {
      return rightEntry[1] - leftEntry[1];
    }

    return leftEntry[0].localeCompare(rightEntry[0]);
  });

  return mostCommonYearLevel?.[0] || "Grade 11";
}

function toSectionCodePart(value?: string | null, maxLength = 4) {
  const cleanedValue = String(value || "")
    .replace(/&/g, " and ")
    .replace(/[^A-Za-z0-9]+/g, " ")
    .trim();

  if (!cleanedValue) {
    return "NA";
  }

  const words = cleanedValue.split(/\s+/).filter(Boolean);

  if (words.length === 1) {
    return words[0].slice(0, maxLength).toUpperCase();
  }

  const acronym = words.map((word) => word[0]).join("").toUpperCase();
  if (acronym.length >= 2 && acronym.length <= maxLength) {
    return acronym;
  }

  return words
    .map((word) => word.slice(0, 2))
    .join("")
    .slice(0, maxLength)
    .toUpperCase();
}

function buildAutoSectionName(
  track: string,
  elective1: string,
  elective2: string,
  sectionIndex: number,
  schoolYear: string
) {
  const baseName = [
    toSectionCodePart(track, 3),
    toSectionCodePart(elective1, 4),
    toSectionCodePart(elective2, 4),
    String(sectionIndex).padStart(2, "0"),
  ].join("-");

  return ensureSectionNameForSchoolYear(baseName, schoolYear);
}

function sortStudentsByName(students: EnrolledStudent[]) {
  return [...students].sort((leftStudent, rightStudent) => {
    const nameComparison = leftStudent.name.localeCompare(rightStudent.name);
    if (nameComparison !== 0) {
      return nameComparison;
    }

    return leftStudent.email.localeCompare(rightStudent.email);
  });
}

function sanitizeFileName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function SectionManagement() {
  const { userData } = useAuth();
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", maxCapacity: 50 });
  const [pendingConfirmation, setPendingConfirmation] = useState<SectionConfirmation>(null);
  const [autoGenerateSettings, setAutoGenerateSettings] = useState({
    maxStudentsPerSection: 50,
  });
  const [downloadingSectionId, setDownloadingSectionId] = useState<string | null>(null);
  const currentSchoolYear = getCurrentSchoolYear();
  const currentSemester = getCurrentSemester();

  useEffect(() => {
    void loadSectionData();
  }, [currentSchoolYear]);

  const loadSectionData = async () => {
    const [{ data: enrollments, error: enrollmentError }, { data: sectionRows, error: sectionError }] = await Promise.all([
      getEnrolledStudents(),
      supabase
        .from("sections")
        .select("id, section_code, grade_level, track, capacity, school_year, semester")
        .eq("school_year", currentSchoolYear)
        .order("section_code"),
    ]);

    if (enrollmentError || !enrollments) {
      console.error("Error loading enrolled students:", enrollmentError);
      setEnrolledStudents([]);
      setSections([]);
      return;
    }

    if (sectionError) {
      console.error("Error loading sections:", sectionError);
      setEnrolledStudents([]);
      setSections([]);
      return;
    }

    const currentSections = sectionRows || [];
    const currentSectionIds = currentSections.map((section) => section.id);

    let assignmentRows: Array<{ enrollment_id: string; section_id: string }> = [];
    if (currentSectionIds.length > 0) {
      const { data: assignments, error: assignmentError } = await supabase
        .from("section_assignments")
        .select("enrollment_id, section_id")
        .eq("status", "active")
        .in("section_id", currentSectionIds);

      if (assignmentError) {
        console.error("Error loading section assignments:", assignmentError);
        setEnrolledStudents([]);
        setSections([]);
        return;
      }

      assignmentRows = assignments || [];
    }

    const sectionNameById = new Map(currentSections.map((section) => [section.id, section.section_code]));
    const assignmentsByEnrollmentId = new Map(
      assignmentRows.map((assignment) => [
        assignment.enrollment_id,
        {
          sectionId: assignment.section_id,
          sectionName: sectionNameById.get(assignment.section_id) || undefined,
        },
      ])
    );

    const studentsByEnrollmentId = new Map<string, EnrolledStudent>();
    const enrolled = enrollments
      .map((enrollment: any) => {
        const formData = enrollment.form_data || {};
        const email = enrollment.user_id || formData.email || "";

        if (!email) {
          return null;
        }

        const student = {
          id: enrollment.id,
          name:
            formData.studentName ||
            `${formData.firstName || ""} ${formData.lastName || ""}`.trim() ||
            email,
          email,
          track: normalizeSectionField(
            formData.preferredTrack ||
              formData.preferred_track ||
              formData.recommendedTrack ||
              formData.track,
            "Not Set"
          ),
          elective1: normalizeSectionField(formData.elective1, "Not Set"),
          elective2: normalizeSectionField(formData.elective2, "Not Set"),
          yearLevel: toDisplayYearLevel(formData.yearLevel || formData.year_level),
          sectionId: assignmentsByEnrollmentId.get(enrollment.id)?.sectionId,
          section: assignmentsByEnrollmentId.get(enrollment.id)?.sectionName,
        };

        studentsByEnrollmentId.set(enrollment.id, student);
        return student;
      })
      .filter(Boolean) as EnrolledStudent[];

    const studentsBySectionId = new Map<string, EnrolledStudent[]>();
    assignmentRows.forEach((assignment) => {
      const assignedStudent = studentsByEnrollmentId.get(assignment.enrollment_id);
      if (!assignedStudent) {
        return;
      }

      const existingStudents = studentsBySectionId.get(assignment.section_id) || [];
      existingStudents.push(assignedStudent);
      studentsBySectionId.set(assignment.section_id, existingStudents);
    });

    const mappedSections = currentSections.map((section) => {
      const assignedStudents = studentsBySectionId.get(section.id) || [];
      const sectionIdentity = getSectionIdentity(assignedStudents);

      return {
        id: section.id,
        name: section.section_code,
        track: sectionIdentity?.track || section.track,
        elective1: sectionIdentity?.elective1,
        elective2: sectionIdentity?.elective2,
        combinationKey: sectionIdentity?.combinationKey,
        yearLevel: toDisplayYearLevel(section.grade_level),
        students: sortStudentsByName(assignedStudents),
        maxCapacity: section.capacity || 50,
      };
    });

    setEnrolledStudents(enrolled);
    setSections(mappedSections);
  };

  const autoGenerateSections = async () => {
    const configuredCapacity = Number(autoGenerateSettings.maxStudentsPerSection);
    const maxStudentsPerSection = Number.isFinite(configuredCapacity)
      ? Math.max(1, Math.trunc(configuredCapacity))
      : 50;

    if (enrolledStudents.length === 0) {
      return;
    }

    const currentSectionIds = sections.map((section) => section.id);
    const reusableSections = sections
      .map((section) => {
        const sectionIdentity = section.combinationKey
          ? {
              combinationKey: section.combinationKey,
              track: normalizeSectionField(section.track),
              elective1: normalizeSectionField(section.elective1, "Not Set"),
              elective2: normalizeSectionField(section.elective2, "Not Set"),
            }
          : getSectionIdentity(section.students);

        if (!sectionIdentity) {
          return null;
        }

        return {
          id: section.id,
          name: section.name,
          track: sectionIdentity.track,
          elective1: sectionIdentity.elective1,
          elective2: sectionIdentity.elective2,
          combinationKey: sectionIdentity.combinationKey,
          plannedStudents: [] as EnrolledStudent[],
          isExisting: true,
        };
      })
      .filter(Boolean)
      .sort((leftSection, rightSection) => leftSection.name.localeCompare(rightSection.name)) as Array<{
        id: string;
        name: string;
        track: string;
        elective1: string;
        elective2: string;
        combinationKey: string;
        plannedStudents: EnrolledStudent[];
        isExisting: boolean;
      }>;

    const reusableSectionIds = new Set(reusableSections.map((section) => section.id));
    const sectionsByCombination = new Map<string, typeof reusableSections>();
    reusableSections.forEach((section) => {
      const matchingSections = sectionsByCombination.get(section.combinationKey) || [];
      matchingSections.push(section);
      sectionsByCombination.set(section.combinationKey, matchingSections);
    });

    const nextSectionIndexByCombination = new Map<string, number>();
    reusableSections.forEach((section) => {
      nextSectionIndexByCombination.set(
        section.combinationKey,
        (nextSectionIndexByCombination.get(section.combinationKey) || 0) + 1
      );
    });

    const seededStudentIds = new Set<string>();
    reusableSections.forEach((section) => {
      const currentSection = sections.find((loadedSection) => loadedSection.id === section.id);
      const preservedStudents = sortStudentsByName(
        currentSection?.students.filter(
          (student) => getStudentCombinationKey(student) === section.combinationKey
        ) || []
      ).slice(0, maxStudentsPerSection);

      preservedStudents.forEach((student) => {
        section.plannedStudents.push(student);
        seededStudentIds.add(student.id);
      });
    });

    const createSectionPlan = (student: EnrolledStudent) => {
      const combinationKey = getStudentCombinationKey(student);
      const { track, elective1, elective2 } = parseCombinationKey(combinationKey);
      const nextSectionIndex = (nextSectionIndexByCombination.get(combinationKey) || 0) + 1;
      nextSectionIndexByCombination.set(combinationKey, nextSectionIndex);

      const newSection = {
        id: `new-${combinationKey}-${nextSectionIndex}`,
        name: buildAutoSectionName(track, elective1, elective2, nextSectionIndex, currentSchoolYear),
        track,
        elective1,
        elective2,
        combinationKey,
        plannedStudents: [] as EnrolledStudent[],
        isExisting: false,
      };

      const matchingSections = sectionsByCombination.get(combinationKey) || [];
      matchingSections.push(newSection);
      sectionsByCombination.set(combinationKey, matchingSections);

      return newSection;
    };

    const findSectionWithCapacity = (combinationKey: string) => {
      const matchingSections = sectionsByCombination.get(combinationKey) || [];

      return [...matchingSections]
        .filter((section) => section.plannedStudents.length < maxStudentsPerSection)
        .sort((leftSection, rightSection) => {
          if (leftSection.plannedStudents.length !== rightSection.plannedStudents.length) {
            return leftSection.plannedStudents.length - rightSection.plannedStudents.length;
          }

          if (leftSection.isExisting !== rightSection.isExisting) {
            return leftSection.isExisting ? -1 : 1;
          }

          return leftSection.name.localeCompare(rightSection.name);
        })[0];
    };

    const remainingStudents = sortStudentsByName(
      enrolledStudents.filter((student) => !seededStudentIds.has(student.id))
    );

    remainingStudents.forEach((student) => {
      const combinationKey = getStudentCombinationKey(student);
      const targetSection = findSectionWithCapacity(combinationKey) || createSectionPlan(student);
      targetSection.plannedStudents.push(student);
    });

    const activeExistingSections = reusableSections.filter((section) => section.plannedStudents.length > 0);
    const newSections = [...sectionsByCombination.values()]
      .flat()
      .filter((section) => !section.isExisting && section.plannedStudents.length > 0);
    const sectionsToDelete = sections
      .filter(
        (section) =>
          !reusableSectionIds.has(section.id) ||
          reusableSections.find((plannedSection) => plannedSection.id === section.id)?.plannedStudents.length === 0
      )
      .map((section) => section.id);

    try {
      const timestamp = new Date().toISOString();
      const finalSections = activeExistingSections.map((section) => ({
        id: section.id,
        students: section.plannedStudents,
      }));

      for (const section of activeExistingSections) {
        const plannedYearLevel = getMostCommonYearLevel(section.plannedStudents);
        const { error: updateError } = await supabase
          .from("sections")
          .update({
            track: section.track,
            grade_level: toDatabaseGradeLevel(plannedYearLevel),
            capacity: maxStudentsPerSection,
            updated_at: timestamp,
          })
          .eq("id", section.id);

        if (updateError) {
          alert(`Failed to update existing section: ${updateError.message}`);
          return;
        }
      }

      for (const section of newSections) {
        const plannedYearLevel = getMostCommonYearLevel(section.plannedStudents);
        const { data: insertedSection, error: sectionInsertError } = await supabase
          .from("sections")
          .insert({
            section_code: section.name,
            grade_level: toDatabaseGradeLevel(plannedYearLevel),
            track: section.track,
            capacity: maxStudentsPerSection,
            school_year: currentSchoolYear,
            semester: currentSemester,
            updated_at: timestamp,
          })
          .select("id")
          .single();

        if (sectionInsertError || !insertedSection) {
          alert(`Failed to save section: ${sectionInsertError?.message || "Unknown error"}`);
          return;
        }

        finalSections.push({
          id: insertedSection.id,
          students: section.plannedStudents,
        });
      }

      if (currentSectionIds.length > 0) {
        const { error: assignmentDeleteError } = await supabase
          .from("section_assignments")
          .delete()
          .eq("status", "active")
          .in("section_id", currentSectionIds);

        if (assignmentDeleteError) {
          alert(`Failed to refresh section assignments: ${assignmentDeleteError.message}`);
          return;
        }
      }

      const assignmentPayload = finalSections.flatMap((section) =>
        section.students.map((student) => ({
          enrollment_id: student.id,
          section_id: section.id,
          assigned_by: userData?.id || null,
          status: "active",
          assigned_at: timestamp,
          updated_at: timestamp,
        }))
      );

      if (assignmentPayload.length > 0) {
        const { error: assignmentInsertError } = await supabase
          .from("section_assignments")
          .insert(assignmentPayload);

        if (assignmentInsertError) {
          alert(`Failed to save section assignments: ${assignmentInsertError.message}`);
          return;
        }
      }

      if (sectionsToDelete.length > 0) {
        const { error: sectionDeleteError } = await supabase
          .from("sections")
          .delete()
          .in("id", sectionsToDelete);

        if (sectionDeleteError) {
          alert(`Failed to remove duplicate sections: ${sectionDeleteError.message}`);
          return;
        }
      }

      alert(
        `Successfully organized ${assignmentPayload.length} students into ${finalSections.length} sections!`
      );
      await loadSectionData();
    } catch (error) {
      console.error("Auto-generate sections error:", error);
      alert("Failed to auto-generate sections. Please try again.");
    }
  };

  const handleEditSection = (section: Section) => {
    setEditingSection(section.id);
    setEditForm({
      name: section.name,
      maxCapacity: section.maxCapacity,
    });
  };

  const handleSaveEdit = async (sectionId: string) => {
    const normalizedSectionName = ensureSectionNameForSchoolYear(editForm.name, currentSchoolYear);

    const { error } = await supabase
      .from("sections")
      .update({
        section_code: normalizedSectionName,
        capacity: editForm.maxCapacity,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sectionId);

    if (error) {
      alert(`Failed to update section: ${error.message}`);
      return;
    }

    setEditingSection(null);
    await loadSectionData();
    alert("Section updated successfully!");
  };

  const handleCancelEdit = () => {
    setEditingSection(null);
    setEditForm({ name: "", maxCapacity: 50 });
  };

  const handleDeleteSection = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    setPendingConfirmation({
      type: "delete-section",
      sectionId,
      sectionName: section.name,
      studentCount: section.students.length,
    });
  };

  const confirmDeleteSection = async (sectionId: string) => {
    const { error } = await supabase
      .from("sections")
      .delete()
      .eq("id", sectionId);

    if (error) {
      alert(`Failed to delete section: ${error.message}`);
      return;
    }

    await loadSectionData();
    alert("Section deleted successfully!");
  };

  const handleRemoveStudentFromSection = (
    sectionId: string,
    enrollmentId: string,
    studentName: string,
    sectionName: string
  ) => {
    setPendingConfirmation({
      type: "remove-student",
      sectionId,
      enrollmentId,
      studentName,
      sectionName,
    });
  };

  const confirmRemoveStudentFromSection = async (sectionId: string, enrollmentId: string) => {
    const { error } = await supabase
      .from("section_assignments")
      .delete()
      .eq("section_id", sectionId)
      .eq("enrollment_id", enrollmentId)
      .eq("status", "active");

    if (error) {
      alert(`Failed to remove student from section: ${error.message}`);
      return;
    }

    await loadSectionData();
    alert("Student removed from section successfully!");
  };

  const handleConfirmPendingAction = async () => {
    if (!pendingConfirmation) {
      return;
    }

    switch (pendingConfirmation.type) {
      case "delete-section":
        await confirmDeleteSection(pendingConfirmation.sectionId);
        break;
      case "remove-student":
        await confirmRemoveStudentFromSection(
          pendingConfirmation.sectionId,
          pendingConfirmation.enrollmentId
        );
        break;
      default:
        break;
    }
  };

  const getConfirmationContent = () => {
    if (!pendingConfirmation) {
      return {
        title: "",
        message: "",
        confirmText: "Confirm",
        type: "info" as const,
      };
    }

    switch (pendingConfirmation.type) {
      case "delete-section":
        return {
          title: `Delete ${pendingConfirmation.sectionName}?`,
          message: `This will remove the section and unassign ${pendingConfirmation.studentCount} student${pendingConfirmation.studentCount === 1 ? "" : "s"} currently linked to it.`,
          confirmText: "Delete Section",
          type: "danger" as const,
        };
      case "remove-student":
        return {
          title: "Remove Student From Section",
          message: `${pendingConfirmation.studentName} will be removed from ${pendingConfirmation.sectionName} and returned to the unsectioned list.`,
          confirmText: "Remove Student",
          type: "danger" as const,
        };
      default:
        return {
          title: "",
          message: "",
          confirmText: "Confirm",
          type: "info" as const,
        };
    }
  };

  const handleDownloadSectionPdf = async (section: Section) => {
    setDownloadingSectionId(section.id);

    try {
      const sortedStudents = sortStudentsByName(section.students);
      const [{ jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);

      const doc = new jsPDF({ unit: "pt", format: "letter" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 48;
      const contentWidth = pageWidth - margin * 2;
      const topMargin = 96;
      const bottomMargin = 52;
      const generatedDateLabel = new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const electiveSummary = [section.elective1, section.elective2].filter(Boolean).join(" • ") || "Not Set";
      let cursorY = topMargin;

      const getLastAutoTableFinalY = () => {
        const lastAutoTable = (doc as any).lastAutoTable as { finalY?: number } | undefined;
        return lastAutoTable?.finalY ?? cursorY;
      };

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
        const fontSize = options?.fontSize ?? 10.8;
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

      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(31, 41, 55);
      doc.text("Section Student List", pageWidth / 2, cursorY, { align: "center" });
      cursorY += 24;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(100, 116, 139);
      doc.text(
        "Branch Coordinator export for section assignments and enrolled students.",
        pageWidth / 2,
        cursorY,
        { align: "center" }
      );
      cursorY += 24;

      ensureSpace(120);
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, cursorY, contentWidth, 116, 12, 12, "FD");

      const summaryRows = [
        ["Section", section.name],
        ["School Year", currentSchoolYear],
        ["Track", section.track],
        ["Year Level", section.yearLevel],
        ["Electives", electiveSummary],
        ["Students", `${sortedStudents.length} / ${section.maxCapacity}`],
      ] as const;

      summaryRows.forEach(([label, value], index) => {
        const columnIndex = index % 2;
        const rowIndex = Math.floor(index / 2);
        const x = margin + 18 + columnIndex * (contentWidth / 2);
        const y = cursorY + 24 + rowIndex * 28;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text(`${label.toUpperCase()}:`, x, y);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        doc.setTextColor(31, 41, 55);
        doc.text(doc.splitTextToSize(String(value), contentWidth / 2 - 38), x, y + 14);
      });
      cursorY += 136;

      addSectionTitle("Alphabetical Student List");
      addParagraph(
        "The students below are sorted alphabetically by full name for section roster reference.",
        { gapAfter: 14 }
      );

      if (sortedStudents.length > 0) {
        autoTable(doc, {
          startY: cursorY,
          margin: { top: topMargin, right: margin, bottom: bottomMargin, left: margin },
          head: [["No.", "Student Name", "Email", "Year Level"]],
          body: sortedStudents.map((student, index) => [
            String(index + 1),
            student.name,
            student.email,
            student.yearLevel,
          ]),
          theme: "grid",
          styles: {
            fontSize: 10.4,
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
            0: { cellWidth: 42, halign: "center" },
            3: { cellWidth: 84, halign: "center" },
          },
        });
        cursorY = getLastAutoTableFinalY() + 20;
      } else {
        addParagraph("No students are currently assigned to this section.", {
          gapAfter: 0,
          color: [107, 114, 128],
        });
      }

      addSectionTitle("Coordinator Note");
      addParagraph(
        "Use this section roster for coordination, verification, and classroom assignment planning. Regenerate sections after enrollment changes so the latest student assignments are reflected in new exports.",
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
        doc.text("Section Management Export", margin + 42, 51);

        doc.setFontSize(9);
        doc.setTextColor(75, 85, 99);
        doc.text(`Generated: ${generatedDateLabel}`, pageWidth - margin, 36, { align: "right" });
        doc.text(`Prepared by: ${userData?.name || "Branch Coordinator"}`, pageWidth - margin, 50, {
          align: "right",
        });

        doc.setDrawColor(30, 58, 138);
        doc.setLineWidth(1.2);
        doc.line(margin, 68, pageWidth - margin, 68);

        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.8);
        doc.line(margin, pageHeight - 34, pageWidth - margin, pageHeight - 34);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text(section.name, margin, pageHeight - 20);
        doc.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - margin, pageHeight - 20, {
          align: "right",
        });
      }

      doc.save(`section-roster-${sanitizeFileName(section.name) || "section"}.pdf`);
    } catch (error) {
      console.error("Error generating section PDF:", error);
      window.alert("Unable to generate the section PDF right now. Please try again.");
    } finally {
      setDownloadingSectionId((currentId) => (currentId === section.id ? null : currentId));
    }
  };

  const unsectionedStudents = sortStudentsByName(enrolledStudents.filter(s => !s.section));

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold" style={{ color: "var(--electron-blue)" }}>
          <Grid3x3 className="h-4 w-4" />
          Section Management
        </div>
        <h1 className="text-4xl font-bold mb-2" style={{ color: "var(--electron-blue)" }}>Section Management</h1>
        <p className="text-gray-600 text-lg">Generate and manage class sections for enrolled students</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Students</p>
              <p className="text-3xl font-bold text-gray-900">{enrolledStudents.length}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Sections</p>
              <p className="text-3xl font-bold text-gray-900">{sections.length}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <Grid3x3 className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Unsectioned</p>
              <p className="text-3xl font-bold text-gray-900">{unsectionedStudents.length}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mb-6 flex gap-4">
        <button
          onClick={autoGenerateSections}
          disabled={enrolledStudents.length === 0}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold transition-all hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          <Grid3x3 className="w-5 h-5" />
          Auto-Generate Sections
        </button>
        
        <div className="flex items-center gap-3 bg-white border border-gray-300 rounded-lg px-4 shadow-sm">
          <label className="text-sm text-gray-600">Max per section:</label>
          <input
            type="number"
            value={autoGenerateSettings.maxStudentsPerSection}
            onChange={(e) => setAutoGenerateSettings({
              ...autoGenerateSettings,
              maxStudentsPerSection: parseInt(e.target.value) || 50,
            })}
            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="10"
            max="50"
          />
        </div>
      </div>

      {/* Debug Info & Unsectioned Students */}
      {enrolledStudents.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800 mb-2">
            <strong>No enrolled students found.</strong> Students will appear here after:
          </p>
          <ul className="text-sm text-yellow-700 ml-4 space-y-1">
            <li>• Completing the enrollment form</li>
            <li>• Uploading and getting documents approved</li>
            <li>• Submitting and having payment verified</li>
            <li>• Being marked as "Enrolled" by the registrar</li>
          </ul>
        </div>
      )}

      {/* Unsectioned Students List */}
      {unsectionedStudents.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 mb-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Unsectioned Students ({unsectionedStudents.length})</h2>
            <p className="text-sm text-gray-600 mt-1">These students are enrolled but not yet assigned to sections</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {unsectionedStudents.map((student) => (
                <div key={student.id} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-semibold text-blue-600">
                      {student.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{student.name}</p>
                    <p className="text-xs text-gray-500 truncate">{student.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{student.track}</span>
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{student.yearLevel}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">{student.elective1}</span>
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">{student.elective2}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sections List */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Generated Sections</h2>
        </div>
        
        {sections.length === 0 ? (
          <div className="p-12 text-center">
            <Grid3x3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No sections generated yet</h3>
            <p className="text-gray-600 mb-6">
              Click "Auto-Generate Sections" to automatically create sections based on enrolled students
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {sections.map((section) => (
              <div key={section.id} className="p-6 hover:bg-gray-50 transition-colors">
                {editingSection === section.id ? (
                  // Edit Mode
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Section Name</label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., STEM - Grade 11 A"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Max Capacity</label>
                      <input
                        type="number"
                        value={editForm.maxCapacity}
                        onChange={(e) => setEditForm({ ...editForm, maxCapacity: parseInt(e.target.value) || 50 })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        min="10"
                        max="100"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleSaveEdit(section.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        Save Changes
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{section.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {section.students.length} / {section.maxCapacity} students
                        </p>
                        {(section.elective1 || section.elective2) && (
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            {section.elective1 && (
                              <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                {section.elective1}
                              </span>
                            )}
                            {section.elective2 && (
                              <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                                {section.elective2}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                          {section.track}
                        </span>
                        <button
                          onClick={() => void handleDownloadSectionPdf(section)}
                          disabled={downloadingSectionId === section.id}
                          className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                          title="Download section roster PDF"
                        >
                          <Download className="w-4 h-4" />
                          {downloadingSectionId === section.id ? "Preparing..." : "PDF"}
                        </button>
                        <button
                          onClick={() => handleEditSection(section)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Section"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteSection(section.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Section"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${(section.students.length / section.maxCapacity) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">
                        {Math.round((section.students.length / section.maxCapacity) * 100)}%
                      </span>
                    </div>

                    <details className="group">
                      <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800 font-medium">
                        View Students ({section.students.length})
                      </summary>
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                        {sortStudentsByName(section.students).map((student) => (
                          <div key={student.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group/student">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-semibold text-blue-600">
                                {student.name.charAt(0)}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{student.name}</p>
                              <p className="text-xs text-gray-500 truncate">{student.email}</p>
                            </div>
                            <button
                              onClick={() =>
                                handleRemoveStudentFromSection(
                                  section.id,
                                  student.id,
                                  student.name,
                                  section.name
                                )
                              }
                              className="opacity-0 group-hover/student:opacity-100 p-1 text-red-600 hover:bg-red-50 rounded transition-all"
                              title="Remove from section"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </details>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={Boolean(pendingConfirmation)}
        title={getConfirmationContent().title}
        message={getConfirmationContent().message}
        confirmText={getConfirmationContent().confirmText}
        cancelText="Cancel"
        type={getConfirmationContent().type}
        onConfirm={handleConfirmPendingAction}
        onClose={() => setPendingConfirmation(null)}
      />
    </div>
  );
}