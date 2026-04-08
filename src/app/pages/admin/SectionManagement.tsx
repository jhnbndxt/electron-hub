import { useState, useEffect } from "react";
import { Users, Grid3x3, Search, Plus, BookOpen, X, Edit2, Trash2, Save } from "lucide-react";

interface EnrolledStudent {
  id: string;
  name: string;
  email: string;
  track: string;
  yearLevel: string;
  section?: string;
}

interface Section {
  id: string;
  name: string;
  track: string;
  yearLevel: string;
  students: EnrolledStudent[];
  maxCapacity: number;
}

export function SectionManagement() {
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", maxCapacity: 40 });
  const [autoGenerateSettings, setAutoGenerateSettings] = useState({
    maxStudentsPerSection: 40,
  });

  useEffect(() => {
    loadEnrolledStudents();
    loadSections();
  }, []);

  const loadEnrolledStudents = () => {
    // Get all enrolled students (those who have completed enrollment process)
    const applications = JSON.parse(localStorage.getItem("pending_applications") || "[]");
    const enrolled: EnrolledStudent[] = [];
    
    applications.forEach((app: any) => {
      // Check if student has completed enrollment by checking their progress
      const progressKey = `enrollment_progress_${app.email}`;
      const progress = JSON.parse(localStorage.getItem(progressKey) || "[]");
      const enrolledStep = progress.find((step: any) => step.name === "Enrolled");
      
      // Include students who are enrolled or payment verified
      if (enrolledStep?.status === "completed" || app.status === "Payment Verified" || app.status === "Enrolled") {
        enrolled.push({
          id: app.id || app.email,
          name: app.studentName || `${app.firstName || ''} ${app.lastName || ''}`.trim() || app.email,
          email: app.email,
          track: app.preferredTrack || app.recommendedTrack || app.track || "Not Set",
          yearLevel: app.yearLevel || "Grade 11",
          section: app.section || null,
        });
      }
    });
    
    setEnrolledStudents(enrolled);
  };

  const loadSections = () => {
    const savedSections = JSON.parse(localStorage.getItem("class_sections") || "[]");
    
    // Remove any sections with old ID format (contains only timestamp-counter)
    // New format: section-timestamp-randomstring-groupindex-sectionindex
    const validSections = savedSections.filter((section: Section) => {
      const idParts = section.id.split('-');
      // Old format has 3 parts: section-timestamp-counter
      // New format has 5 parts: section-timestamp-random-groupindex-sectionindex
      return idParts.length >= 5;
    });
    
    // Also remove any duplicate section IDs (in case of corrupted data)
    const uniqueSections = validSections.filter((section: Section, index: number, self: Section[]) => 
      index === self.findIndex((s) => s.id === section.id)
    );
    
    setSections(uniqueSections);
    
    // If we found invalid/duplicate sections, save the cleaned version
    if (uniqueSections.length !== savedSections.length) {
      localStorage.setItem("class_sections", JSON.stringify(uniqueSections));
    }
  };

  const autoGenerateSections = () => {
    const { maxStudentsPerSection } = autoGenerateSettings;
    
    // Clear existing sections before generating new ones
    localStorage.setItem("class_sections", "[]");
    
    // Group students by track and year level
    const grouped: Record<string, EnrolledStudent[]> = {};
    enrolledStudents.forEach(student => {
      const key = `${student.track}-${student.yearLevel}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(student);
    });

    const newSections: Section[] = [];
    
    // Generate sections for each group
    Object.entries(grouped).forEach(([key, students], groupIndex) => {
      const [track, yearLevel] = key.split('-');
      const numSections = Math.ceil(students.length / maxStudentsPerSection);
      
      for (let i = 0; i < numSections; i++) {
        const sectionLetter = String.fromCharCode(65 + i); // A, B, C, etc.
        const sectionStudents = students.slice(i * maxStudentsPerSection, (i + 1) * maxStudentsPerSection);
        
        // Generate a truly unique ID using timestamp, random number, and counters
        const uniqueId = `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${groupIndex}-${i}`;
        
        newSections.push({
          id: uniqueId,
          name: `${track} - ${yearLevel} ${sectionLetter}`,
          track,
          yearLevel,
          students: sectionStudents,
          maxCapacity: maxStudentsPerSection,
        });

        // Update student records with assigned section
        sectionStudents.forEach(student => {
          const applications = JSON.parse(localStorage.getItem("pending_applications") || "[]");
          const updatedApps = applications.map((app: any) => 
            app.email === student.email ? { ...app, section: `${yearLevel} ${sectionLetter}` } : app
          );
          localStorage.setItem("pending_applications", JSON.stringify(updatedApps));
        });
      }
    });

    setSections(newSections);
    localStorage.setItem("class_sections", JSON.stringify(newSections));
    
    alert(`Successfully generated ${newSections.length} sections!`);
    loadEnrolledStudents(); // Reload to show updated sections
  };

  const clearAllSections = () => {
    if (confirm("Are you sure you want to clear all sections? This will remove all section assignments.")) {
      // Clear sections from localStorage
      localStorage.setItem("class_sections", "[]");
      setSections([]);
      
      // Remove section assignments from all students
      const applications = JSON.parse(localStorage.getItem("pending_applications") || "[]");
      const updatedApps = applications.map((app: any) => {
        const { section, ...rest } = app;
        return rest;
      });
      localStorage.setItem("pending_applications", JSON.stringify(updatedApps));
      
      // Reload students to reflect changes
      loadEnrolledStudents();
      
      alert("All sections have been cleared successfully!");
    }
  };

  const handleEditSection = (section: Section) => {
    setEditingSection(section.id);
    setEditForm({
      name: section.name,
      maxCapacity: section.maxCapacity,
    });
  };

  const handleSaveEdit = (sectionId: string) => {
    const updatedSections = sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          name: editForm.name,
          maxCapacity: editForm.maxCapacity,
        };
      }
      return section;
    });

    setSections(updatedSections);
    localStorage.setItem("class_sections", JSON.stringify(updatedSections));
    setEditingSection(null);
    alert("Section updated successfully!");
  };

  const handleCancelEdit = () => {
    setEditingSection(null);
    setEditForm({ name: "", maxCapacity: 40 });
  };

  const handleDeleteSection = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    if (confirm(`Are you sure you want to delete section "${section.name}"? This will remove section assignments for ${section.students.length} students.`)) {
      // Remove the section
      const updatedSections = sections.filter(s => s.id !== sectionId);
      setSections(updatedSections);
      localStorage.setItem("class_sections", JSON.stringify(updatedSections));

      // Remove section assignments from students in this section
      const applications = JSON.parse(localStorage.getItem("pending_applications") || "[]");
      const updatedApps = applications.map((app: any) => {
        // If student is in this section, remove their section assignment
        const isInSection = section.students.some(s => s.email === app.email);
        if (isInSection) {
          const { section: _, ...rest } = app;
          return rest;
        }
        return app;
      });
      localStorage.setItem("pending_applications", JSON.stringify(updatedApps));

      // Reload students to reflect changes
      loadEnrolledStudents();
      
      alert("Section deleted successfully!");
    }
  };

  const handleRemoveStudentFromSection = (sectionId: string, studentEmail: string) => {
    if (confirm("Are you sure you want to remove this student from the section?")) {
      // Update sections
      const updatedSections = sections.map(section => {
        if (section.id === sectionId) {
          return {
            ...section,
            students: section.students.filter(s => s.email !== studentEmail),
          };
        }
        return section;
      });
      setSections(updatedSections);
      localStorage.setItem("class_sections", JSON.stringify(updatedSections));

      // Remove section from student application
      const applications = JSON.parse(localStorage.getItem("pending_applications") || "[]");
      const updatedApps = applications.map((app: any) => {
        if (app.email === studentEmail) {
          const { section, ...rest } = app;
          return rest;
        }
        return app;
      });
      localStorage.setItem("pending_applications", JSON.stringify(updatedApps));

      // Reload students
      loadEnrolledStudents();
      
      alert("Student removed from section successfully!");
    }
  };

  const unsectionedStudents = enrolledStudents.filter(s => !s.section);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Section Management</h1>
        <p className="text-gray-600">Generate and manage class sections for enrolled students</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
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

        <div className="bg-white rounded-lg p-6 border border-gray-200">
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

        <div className="bg-white rounded-lg p-6 border border-gray-200">
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
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Grid3x3 className="w-5 h-5" />
          Auto-Generate Sections
        </button>
        
        <div className="flex items-center gap-3 bg-white border border-gray-300 rounded-lg px-4">
          <label className="text-sm text-gray-600">Max per section:</label>
          <input
            type="number"
            value={autoGenerateSettings.maxStudentsPerSection}
            onChange={(e) => setAutoGenerateSettings({
              ...autoGenerateSettings,
              maxStudentsPerSection: parseInt(e.target.value) || 40,
            })}
            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="10"
            max="50"
          />
        </div>
        
        <button
          onClick={clearAllSections}
          className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center gap-2"
        >
          <X className="w-5 h-5" />
          Clear All Sections
        </button>
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
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sections List */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6">
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
                        onChange={(e) => setEditForm({ ...editForm, maxCapacity: parseInt(e.target.value) || 40 })}
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
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                          {section.track}
                        </span>
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
                        {section.students.map((student) => (
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
                              onClick={() => handleRemoveStudentFromSection(section.id, student.email)}
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
    </div>
  );
}