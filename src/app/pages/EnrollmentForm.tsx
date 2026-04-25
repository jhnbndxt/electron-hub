import { useState, useEffect } from "react";
import { 
  FileText, 
  Upload, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight,
  User,
  MapPin,
  Users,
  BookOpen,
  GraduationCap,
  FileCheck,
  Eye,
  Sparkles,
  AlertCircle,
  X,
  Info
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";
import { useAuth } from "../context/AuthContext";
import { motion } from "motion/react";
import { getLatestAssessmentResult } from "../../services/assessmentResultService";
import { 
  saveDraft, 
  loadDraft, 
  checkExistingEnrollment, 
  submitEnrollment,
  uploadDocument 
} from "../../services/enrollmentService";
import { triggerNotification } from "../../services/notificationService";
import { supabase } from "../../supabase";
import {
  regions,
  getProvincesByRegion,
  getCitiesByProvince,
  getCitiesByRegion,
  getBarangaysByCity,
} from "../utils/philippineAddress";

// Academic electives
const academicElectives = [
  "Biology",
  "Physics",
  "Psychology",
  "Creative Writing",
  "Entrepreneurship",
  "Marketing",
  "Media Arts",
  "Visual Arts",
  "Coaching",
  "Fitness",
  "Sports"
];

// Technical-Professional electives
const technicalElectives = [
  "ICT",
  "Programming",
  "Cookery",
  "Bread & Pastry",
  "Automotive",
  "Electrical",
  "Agriculture",
  "Fishery",
  "Fitness Training",
  "Coaching"
];

interface FormData {
  // Page 1: Basic Information
  admissionType: string;
  previousStudentId: string;
  lrn: string;
  isWorkingStudent: boolean;
  lastName: string;
  firstName: string;
  middleName: string;
  suffix: string;
  sex: string;
  civilStatus: string;
  religion: string;
  nationality: string;
  disability: string;
  disabilityOther: string;
  indigenousGroup: string;
  indigenousGroupOther: string;
  birthday: string;
  email: string;
  contactNumber: string;
  facebookName: string;

  // Page 2: Address
  region: string;
  province: string;
  city: string;
  barangay: string;
  homeAddress: string;

  // Page 3: Parent/Guardian
  fatherLastName: string;
  fatherFirstName: string;
  fatherMiddleName: string;
  fatherOccupation: string;
  fatherContact: string;
  motherMaidenName: string;
  motherLastName: string;
  motherFirstName: string;
  motherMiddleName: string;
  motherOccupation: string;
  motherContact: string;
  guardianSource: string;
  guardianLastName: string;
  guardianFirstName: string;
  guardianMiddleName: string;
  guardianOccupation: string;
  guardianContact: string;
  is4PsMember: boolean;

  // Page 4: Enrollment Information
  preferredTrack: string;
  elective1: string;
  elective2: string;
  yearLevel: string;

  // Page 5: Educational Background
  primarySchool: string;
  primaryYearGraduated: string;
  secondarySchool: string;
  secondaryYearGraduated: string;
  grade10Adviser: string;

  // Page 6: Documents
  form138: File | null;
  form137: File | null;
  goodMoral: File | null;
  birthCertificate: File | null;
  idPicture: File | null;
  diploma: File | null;
  escCertificate: File | null;
}

export function EnrollmentForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { updateEnrollmentProgress, userData } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [aiRecommendation, setAiRecommendation] = useState<{
    track: string;
    electives: string[];
  } | null>(null);
  const [hasAssessment, setHasAssessment] = useState(true);
  const [showAlreadySubmittedModal, setShowAlreadySubmittedModal] = useState(false);
  const [certificationChecked, setCertificationChecked] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    admissionType: "",
    previousStudentId: "",
    lrn: "",
    isWorkingStudent: false,
    lastName: "",
    firstName: "",
    middleName: "",
    suffix: "None",
    sex: "",
    civilStatus: "",
    religion: "",
    nationality: "Filipino",
    disability: "Not Applicable",
    disabilityOther: "",
    indigenousGroup: "Not Applicable",
    indigenousGroupOther: "",
    birthday: "",
    email: "",
    contactNumber: "",
    facebookName: "",
    region: "",
    province: "",
    city: "",
    barangay: "",
    homeAddress: "",
    fatherLastName: "",
    fatherFirstName: "",
    fatherMiddleName: "",
    fatherOccupation: "",
    fatherContact: "",
    motherMaidenName: "",
    motherLastName: "",
    motherFirstName: "",
    motherMiddleName: "",
    motherOccupation: "",
    motherContact: "",
    guardianSource: "",
    guardianLastName: "",
    guardianFirstName: "",
    guardianMiddleName: "",
    guardianOccupation: "",
    guardianContact: "",
    is4PsMember: false,
    preferredTrack: "",
    elective1: "",
    elective2: "",
    yearLevel: "",
    primarySchool: "",
    primaryYearGraduated: "",
    secondarySchool: "",
    secondaryYearGraduated: "",
    grade10Adviser: "",
    form138: null,
    form137: null,
    goodMoral: null,
    birthCertificate: null,
    idPicture: null,
    diploma: null,
    escCertificate: null,
  });

  // Load AI assessment results on mount
  useEffect(() => {
    const userEmail = userData?.email || "student@gmail.com";
    
    const initializeForm = async () => {
      // Check if enrollment already submitted
      const { data: existingEnrollment } = await checkExistingEnrollment(userEmail);
      if (existingEnrollment) {
        setShowAlreadySubmittedModal(true);
        return;
      }
      
      // Try to restore autosaved draft
      const { data: draftData } = await loadDraft(userEmail);
      if (draftData) {
        try {
          const { form138, form137, goodMoral, birthCertificate, idPicture, diploma, escCertificate, ...restData } = draftData;
          setFormData(prev => ({ ...prev, ...restData }));
          console.log("✅ Enrollment draft restored from Supabase");
        } catch (error) {
          console.error("Failed to restore draft:", error);
        }
      }
      
      // Load AI assessment results
      try {
        const result = await getLatestAssessmentResult(userEmail);
        
        if (result) {
          setAiRecommendation({
            track: result.track,
            electives: result.electives,
          });
          
          // Only set default values if no draft exists
          if (!draftData) {
            setFormData(prev => ({
              ...prev,
              preferredTrack: result.track,
              elective1: result.electives[0] || "",
              elective2: result.electives[1] || "",
            }));
          }
          setHasAssessment(true);
        } else {
          setHasAssessment(false);
        }
      } catch (error) {
        console.error("Error loading assessment results:", error);
        setHasAssessment(false);
      }
    };
    
    initializeForm();
  }, [userData]);

  // Auto-fill form with user data from AuthContext
  useEffect(() => {
    if (userData && userData.firstName) {
      console.log("[EnrollmentForm] Auto-filling form with user data:", userData);
      setFormData(prev => ({
        ...prev,
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        middleName: userData.middleName || "",
        sex: userData.sex || "",
        birthday: userData.birthDate || "",
        email: userData.email || "",
        contactNumber: userData.contactNumber || "",
      }));
    }
  }, [userData?.email, userData?.firstName]);

  // Autosave effect - save draft on every form data change
  useEffect(() => {
    const userEmail = userData?.email;
    if (!userEmail) return;

    // Don't save if form is completely empty
    const hasData = Object.values(formData).some(value => {
      if (typeof value === 'string') return value.length > 0;
      if (typeof value === 'boolean') return value;
      return false;
    });

    if (hasData) {
      // Save draft (excluding File objects)
      const { form138, form137, goodMoral, birthCertificate, idPicture, diploma, escCertificate, ...dataToSave } = formData;
      const draft = {
        ...dataToSave,
        lastSaved: new Date().toISOString()
      };
      saveDraft(userEmail, draft);
    }
  }, [formData, userData]);

  // Handle re-upload navigation from notification
  useEffect(() => {
    const reupload = searchParams.get('reupload');
    if (reupload === 'true' && userData?.email) {
      const initializeReupload = async () => {
        // Load the existing enrollment data
        const { data: enrollmentData, error } = await checkExistingEnrollment(userData.email);

        if (enrollmentData) {
          try {
            const formDataFromDb = enrollmentData.form_data || {};
            // Load the form data (excluding file uploads which need to be re-uploaded)
            const { form138, form137, goodMoral, birthCertificate, idPicture, diploma, escCertificate, ...savedFormData } = formDataFromDb;
            setFormData(prev => ({
              ...prev,
              ...savedFormData,
              // Clear the file fields so user can re-upload
              form138: null,
              form137: null,
              goodMoral: null,
              birthCertificate: null,
              idPicture: null,
              diploma: null,
              escCertificate: null,
            }));

            // Navigate directly to page 6 (document upload)
            setCurrentPage(6);
          } catch (e) {
            console.error("Failed to load enrollment data:", e);
          }
        }
      };

      initializeReupload();
    }
  }, [searchParams, userData]);

  const handleInputChange = (field: keyof FormData, value: string | boolean | File | null) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Handle address cascade resets inline to avoid multiple useEffect chains
      if (field === "region") {
        newData.province = "";
        newData.city = "";
        newData.barangay = "";
      } else if (field === "province") {
        newData.city = "";
        newData.barangay = "";
      } else if (field === "city") {
        newData.barangay = "";
      }
      
      // Handle admission type year level auto-set
      if (field === "admissionType" && value === "New Regular") {
        newData.yearLevel = "Grade 11";
      }
      
      return newData;
    });
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleFileChange = (field: keyof FormData, file: File | null) => {
    setFormData(prev => ({ ...prev, [field]: file }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Phone number validation
  const validatePhoneNumber = (phone: string): boolean => {
    const phoneRegex = /^09\d{9}$/;
    return phoneRegex.test(phone);
  };

  // Birthday validation (no future dates)
  const validateBirthday = (date: string): boolean => {
    const today = new Date();
    const birthDate = new Date(date);
    return birthDate <= today;
  };

  const validatePage = (page: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (page === 1) {
      if (!formData.admissionType) newErrors.admissionType = "This field is required";
      if (formData.admissionType === "Returnee" && !formData.previousStudentId) {
        newErrors.previousStudentId = "This field is required for Returnees";
      }
      if (!formData.lrn) newErrors.lrn = "This field is required";
      if (formData.lrn && formData.lrn.length > 12) newErrors.lrn = "LRN must not exceed 12 digits";
      if (!formData.lastName) newErrors.lastName = "This field is required";
      if (!formData.firstName) newErrors.firstName = "This field is required";
      if (!formData.sex) newErrors.sex = "This field is required";
      if (!formData.civilStatus) newErrors.civilStatus = "This field is required";
      if (!formData.religion) newErrors.religion = "This field is required";
      if (!formData.nationality) newErrors.nationality = "This field is required";
      if (formData.disability === "Others" && !formData.disabilityOther) {
        newErrors.disabilityOther = "Please specify disability";
      }
      if (formData.indigenousGroup === "Others" && !formData.indigenousGroupOther) {
        newErrors.indigenousGroupOther = "Please specify indigenous group";
      }
      if (!formData.birthday) {
        newErrors.birthday = "This field is required";
      } else if (!validateBirthday(formData.birthday)) {
        newErrors.birthday = "Please enter a valid birthdate. Future dates are not allowed.";
      }
      if (!formData.email) newErrors.email = "This field is required";
      if (!formData.contactNumber) {
        newErrors.contactNumber = "This field is required";
      } else if (!validatePhoneNumber(formData.contactNumber)) {
        newErrors.contactNumber = "Please enter a valid Philippine mobile number (09XXXXXXXXX).";
      }
      if (!formData.facebookName) newErrors.facebookName = "This field is required";
    }

    if (page === 2) {
      if (!formData.region) newErrors.region = "This field is required";
      if (formData.region !== "National Capital Region (NCR)" && !formData.province) {
        newErrors.province = "This field is required";
      }
      if (!formData.city) newErrors.city = "This field is required";
      if (!formData.barangay) newErrors.barangay = "This field is required";
      if (!formData.homeAddress) newErrors.homeAddress = "This field is required";
    }

    if (page === 3) {
      if (!formData.fatherLastName) newErrors.fatherLastName = "This field is required";
      if (!formData.fatherFirstName) newErrors.fatherFirstName = "This field is required";
      if (!formData.fatherOccupation) newErrors.fatherOccupation = "This field is required";
      if (!formData.fatherContact) {
        newErrors.fatherContact = "This field is required";
      } else if (!validatePhoneNumber(formData.fatherContact)) {
        newErrors.fatherContact = "Please enter a valid Philippine mobile number (09XXXXXXXXX).";
      }
      if (!formData.motherMaidenName) newErrors.motherMaidenName = "This field is required";
      if (!formData.motherLastName) newErrors.motherLastName = "This field is required";
      if (!formData.motherFirstName) newErrors.motherFirstName = "This field is required";
      if (!formData.motherOccupation) newErrors.motherOccupation = "This field is required";
      if (!formData.motherContact) {
        newErrors.motherContact = "This field is required";
      } else if (!validatePhoneNumber(formData.motherContact)) {
        newErrors.motherContact = "Please enter a valid Philippine mobile number (09XXXXXXXXX).";
      }
      
      if (!formData.guardianSource) {
        if (!formData.guardianLastName) newErrors.guardianLastName = "This field is required";
        if (!formData.guardianFirstName) newErrors.guardianFirstName = "This field is required";
        if (!formData.guardianOccupation) newErrors.guardianOccupation = "This field is required";
        if (!formData.guardianContact) {
          newErrors.guardianContact = "This field is required";
        } else if (!validatePhoneNumber(formData.guardianContact)) {
          newErrors.guardianContact = "Please enter a valid Philippine mobile number (09XXXXXXXXX).";
        }
      }
    }

    if (page === 4) {
      if (!formData.preferredTrack) newErrors.preferredTrack = "This field is required";
      if (!formData.elective1) newErrors.elective1 = "This field is required";
      if (!formData.elective2) newErrors.elective2 = "This field is required";
      if (formData.elective1 && formData.elective2 && formData.elective1 === formData.elective2) {
        newErrors.elective2 = "Elective 1 and Elective 2 must be different";
      }
      if (!formData.yearLevel) newErrors.yearLevel = "This field is required";
    }

    if (page === 5) {
      if (!formData.primarySchool) newErrors.primarySchool = "This field is required";
      if (!formData.primaryYearGraduated) newErrors.primaryYearGraduated = "This field is required";
      if (!formData.secondarySchool) newErrors.secondarySchool = "This field is required";
      if (!formData.secondaryYearGraduated) newErrors.secondaryYearGraduated = "This field is required";
      if (formData.admissionType === "New Regular" && !formData.grade10Adviser) {
        newErrors.grade10Adviser = "This field is required for New Regular students";
      }
    }

    if (page === 6) {
      if (!formData.form138) newErrors.form138 = "This document is required";
      if (!formData.birthCertificate) newErrors.birthCertificate = "This document is required";
      if (!formData.idPicture) newErrors.idPicture = "This document is required";
      if (!formData.diploma) newErrors.diploma = "This document is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validatePage(currentPage)) {
      setCurrentPage(prev => Math.min(prev + 1, 7));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevious = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    if (!certificationChecked) {
      alert("Please certify that the information you provided is true and correct before submitting.");
      return;
    }
    
    if (validatePage(6)) {
      const userEmail = userData?.email || "student@gmail.com";
      const userId = userEmail; // Use email as user identifier (custom auth, not Supabase Auth)
      
      // Create enrollment submission data
      const enrollmentData = {
        studentName: `${formData.firstName} ${formData.middleName} ${formData.lastName}`,
        email: formData.email,
        contactNumber: formData.contactNumber,
        submissionDate: new Date().toISOString(),
        ...formData,
        // Exclude file objects
        form138: undefined,
        form137: undefined,
        goodMoral: undefined,
        birthCertificate: undefined,
        idPicture: undefined,
        diploma: undefined,
        escCertificate: undefined,
      };

      // Prepare documents for upload
      const documentFiles = {
        form138: formData.form138,
        form137: formData.form137,
        goodMoral: formData.goodMoral,
        birthCertificate: formData.birthCertificate,
        idPicture: formData.idPicture,
        diploma: formData.diploma,
        escCertificate: formData.escCertificate,
      };

      // Submit to Supabase
      const { error, data: enrollmentResult } = await submitEnrollment(userId, enrollmentData, documentFiles);

      if (error) {
        alert(`Error submitting enrollment: ${error}`);
        console.error('Enrollment submission error:', error);
        return;
      }

      console.log('✅ Enrollment submitted to Supabase successfully', enrollmentResult);

      // Add notification via Supabase
      try {
        await triggerNotification(userEmail, 'ENROLLMENT_SUBMITTED');
      } catch (error) {
        console.error('Error creating notification:', error);
      }

      // Update enrollment progress
      updateEnrollmentProgress("Documents Submitted", "completed");
      updateEnrollmentProgress("Documents Verified", "current");
      
      // Navigate to payment
      navigate("/dashboard/payment");
    }
  };

  const getAvailableElectives = () => {
    return formData.preferredTrack === "Academic" ? academicElectives : technicalElectives;
  };

  // Get available provinces, cities, barangays
  const availableProvinces = formData.region === "National Capital Region (NCR)" 
    ? [] 
    : getProvincesByRegion(regions.find(r => r.name === formData.region)?.code || "");

  const availableCities = formData.region === "National Capital Region (NCR)"
    ? getCitiesByRegion("NCR")
    : formData.province
    ? getCitiesByProvince(availableProvinces.find(p => p.name === formData.province)?.code || "")
    : [];

  const availableBarangays = formData.city
    ? getBarangaysByCity(availableCities.find(c => c.name === formData.city)?.code || "")
    : [];

  const renderPageIndicator = () => {
    const pages = [
      { num: 1, label: "Basic Info", icon: User },
      { num: 2, label: "Address", icon: MapPin },
      { num: 3, label: "Parents", icon: Users },
      { num: 4, label: "Enrollment", icon: BookOpen },
      { num: 5, label: "Education", icon: GraduationCap },
      { num: 6, label: "Documents", icon: FileCheck },
      { num: 7, label: "Summary", icon: Eye },
    ];

    return (
      <div className="mb-8 overflow-x-auto py-4">
        <div className="flex items-center justify-center gap-2 min-w-max px-4">
          {pages.map((page, index) => {
            const Icon = page.icon;
            const isActive = currentPage === page.num;
            const isCompleted = currentPage > page.num;

            return (
              <div key={page.num} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      isActive
                        ? "bg-blue-900 text-white scale-110"
                        : isCompleted
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                  </div>
                  <span
                    className={`text-xs mt-1 font-medium whitespace-nowrap ${
                      isActive ? "text-blue-900" : isCompleted ? "text-green-600" : "text-gray-500"
                    }`}
                  >
                    {page.label}
                  </span>
                </div>
                {index < pages.length - 1 && (
                  <div
                    className={`w-8 h-0.5 mx-2 ${
                      isCompleted ? "bg-green-500" : "bg-gray-300"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderInput = (
    label: string,
    field: keyof FormData,
    type: string = "text",
    required: boolean = true,
    placeholder?: string
  ) => {
    // Get max date for birthday (today)
    const maxDate = type === "date" ? new Date().toISOString().split('T')[0] : undefined;

    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input
          type={type}
          value={formData[field] as string}
          onChange={(e) => handleInputChange(field, e.target.value)}
          max={maxDate}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors[field] ? "border-red-500" : "border-gray-300"
          }`}
          placeholder={placeholder}
        />
        {errors[field] && (
          <p className="text-red-500 text-xs mt-1">{errors[field]}</p>
        )}
      </div>
    );
  };

  const renderSelect = (
    label: string,
    field: keyof FormData,
    options: string[] | { code: string; name: string }[],
    required: boolean = true
  ) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        value={formData[field] as string}
        onChange={(e) => handleInputChange(field, e.target.value)}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          errors[field] ? "border-red-500" : "border-gray-300"
        }`}
      >
        <option value="">Select {label}</option>
        {options.map((option) => {
          if (typeof option === "string") {
            return <option key={option} value={option}>{option}</option>;
          } else {
            return <option key={option.code} value={option.name}>{option.name}</option>;
          }
        })}
      </select>
      {errors[field] && (
        <p className="text-red-500 text-xs mt-1">{errors[field]}</p>
      )}
    </div>
  );

  const renderFileUpload = (
    label: string,
    field: keyof FormData,
    required: boolean = true
  ) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
        {!required && <span className="text-gray-500 text-xs">(Optional)</span>}
      </label>
      <div
        className={`relative border-2 border-dashed rounded-md p-4 transition-colors ${
          errors[field] ? "border-red-500 bg-red-50" : "border-gray-300 hover:border-blue-500"
        }`}
      >
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => handleFileChange(field, e.target.files?.[0] || null)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex items-center gap-3">
          <Upload className="w-5 h-5 text-gray-400" />
          <div>
            <p className="text-sm text-gray-700">
              {formData[field] ? (formData[field] as File).name : "Click to upload or drag and drop"}
            </p>
            <p className="text-xs text-gray-500">PDF, JPG, or PNG</p>
          </div>
          {formData[field] && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleFileChange(field, null);
              }}
              className="ml-auto p-1 hover:bg-gray-200 rounded-full"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>
      </div>
      {errors[field] && (
        <p className="text-red-500 text-xs mt-1">{errors[field]}</p>
      )}
    </div>
  );

  // Page 1: Basic Information
  const renderPage1 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-blue-900 flex items-center justify-center">
          <User className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Basic Information</h2>
      </div>

      {renderSelect("Admission Type", "admissionType", ["New Regular", "Transferee", "Returnee"])}

      {formData.admissionType === "Returnee" && (
        renderInput("Previous Student ID Number", "previousStudentId", "text", true, "Enter previous ID")
      )}

      {renderInput("LRN (Learner Reference Number)", "lrn", "text", true, "Max 12 digits")}

      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.isWorkingStudent}
            onChange={(e) => handleInputChange("isWorkingStudent", e.target.checked)}
            className="w-4 h-4 text-blue-600"
          />
          <span className="text-sm font-medium text-gray-700">Are you a working student?</span>
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderInput("Last Name", "lastName")}
        {renderInput("First Name", "firstName")}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderInput("Middle Name", "middleName", "text", false)}
        {renderSelect("Suffix", "suffix", ["None", "Jr.", "Sr.", "II", "III", "IV"])}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderSelect("Sex", "sex", ["Male", "Female"])}
        {renderSelect("Civil Status", "civilStatus", ["Single", "Married", "Widowed", "Separated"])}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderInput("Religion", "religion")}
        {renderSelect("Nationality", "nationality", ["Filipino", "American", "Chinese", "Japanese", "Korean", "Others"])}
      </div>

      {renderSelect("Disability", "disability", [
        "Not Applicable",
        "Visual Impairment",
        "Hearing Impairment",
        "Speech Impairment",
        "Mobility Impairment",
        "Cognitive Impairment",
        "Psychosocial Disability",
        "Chronic Illness",
        "Multiple Disabilities",
        "Others"
      ])}

      {formData.disability === "Others" && renderInput("Specify Disability", "disabilityOther")}

      {renderSelect("Indigenous People Group", "indigenousGroup", [
        "Not Applicable",
        "Aeta",
        "Badjao",
        "Igorot",
        "Lumad",
        "Mangyan",
        "Manobo",
        "Tausug",
        "T'boli",
        "Yakan",
        "Others"
      ])}

      {formData.indigenousGroup === "Others" && renderInput("Specify Indigenous Group", "indigenousGroupOther")}

      {renderInput("Birthday", "birthday", "date")}

      {renderInput("Email Address", "email", "email", true, "example@gmail.com")}
      {renderInput("Contact Number", "contactNumber", "tel", true, "09XXXXXXXXX")}
      {renderInput("Facebook / Messenger Name", "facebookName")}
    </motion.div>
  );

  // Page 2: Address
  const renderPage2 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-blue-900 flex items-center justify-center">
          <MapPin className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Address</h2>
      </div>

      {renderSelect("Region", "region", regions)}
      
      {formData.region && formData.region !== "National Capital Region (NCR)" && (
        renderSelect("Province", "province", availableProvinces.map(p => p.name))
      )}
      
      {((formData.region === "National Capital Region (NCR)") || formData.province) && (
        renderSelect("Municipality / City", "city", availableCities.map(c => c.name))
      )}
      
      {formData.city && (
        renderSelect("Barangay", "barangay", availableBarangays.map(b => b.name))
      )}
      
      {renderInput("Home / Street Address", "homeAddress", "text", true, "House No., Street, etc.")}
    </motion.div>
  );

  // Page 3: Parent/Guardian Information
  const renderPage3 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-blue-900 flex items-center justify-center">
          <Users className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Parent / Guardian Information</h2>
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-900 p-4 rounded">
        <h3 className="font-bold text-blue-900 mb-2">Father's Information</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {renderInput("Last Name", "fatherLastName")}
        {renderInput("First Name", "fatherFirstName")}
        {renderInput("Middle Name", "fatherMiddleName", "text", false)}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderInput("Occupation", "fatherOccupation")}
        {renderInput("Contact Number", "fatherContact", "tel", true, "09XXXXXXXXX")}
      </div>

      <div className="bg-pink-50 border-l-4 border-pink-600 p-4 rounded mt-8">
        <h3 className="font-bold text-pink-900 mb-2">Mother's Information</h3>
      </div>

      {renderInput("Maiden Name", "motherMaidenName")}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {renderInput("Last Name", "motherLastName")}
        {renderInput("First Name", "motherFirstName")}
        {renderInput("Middle Name", "motherMiddleName", "text", false)}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderInput("Occupation", "motherOccupation")}
        {renderInput("Contact Number", "motherContact", "tel", true, "09XXXXXXXXX")}
      </div>

      <div className="bg-gray-50 border-l-4 border-gray-600 p-4 rounded mt-8">
        <h3 className="font-bold text-gray-900 mb-4">Guardian Information</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="guardianSource"
              value="father"
              checked={formData.guardianSource === "father"}
              onChange={(e) => handleInputChange("guardianSource", e.target.value)}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-sm font-medium text-gray-700">Same as Father's Information</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="guardianSource"
              value="mother"
              checked={formData.guardianSource === "mother"}
              onChange={(e) => handleInputChange("guardianSource", e.target.value)}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-sm font-medium text-gray-700">Same as Mother's Information</span>
          </label>
        </div>
      </div>

      {!formData.guardianSource && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {renderInput("Last Name", "guardianLastName")}
            {renderInput("First Name", "guardianFirstName")}
            {renderInput("Middle Name", "guardianMiddleName", "text", false)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderInput("Occupation", "guardianOccupation")}
            {renderInput("Contact Number", "guardianContact", "tel", true, "09XXXXXXXXX")}
          </div>
        </>
      )}

      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.is4PsMember}
            onChange={(e) => handleInputChange("is4PsMember", e.target.checked)}
            className="w-4 h-4 text-blue-600"
          />
          <span className="text-sm font-medium text-gray-700">4Ps Member?</span>
        </label>
      </div>
    </motion.div>
  );

  // Page 4: Enrollment Information
  const renderPage4 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-blue-900 flex items-center justify-center">
          <BookOpen className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Enrollment Information</h2>
      </div>

      {/* Advisory if no assessment */}
      {!hasAssessment && (
        <div className="portal-glass-panel-strong rounded-xl border p-4" style={{ borderColor: "var(--electron-blue)" }}>
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-blue-900 font-semibold mb-1">Recommended: Complete AI Assessment</p>
              <p className="text-sm text-blue-800 mb-3">
                It is recommended to complete the AI Assessment to receive personalized track and elective recommendations before finalizing your enrollment.
              </p>
              <button
                onClick={() => navigate("/dashboard/assessment")}
                className="px-4 py-2 bg-blue-900 text-white font-medium rounded-lg hover:bg-blue-800 transition-colors text-sm flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Take AI Assessment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Assessment Result Display */}
      {aiRecommendation && (
        <div className="portal-glass-panel-strong rounded-xl border-2 p-6" style={{ borderColor: "var(--electron-blue)" }}>
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-900 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-blue-900 mb-1">AI Assessment Result</h3>
              <p className="text-sm text-gray-600">Based on your completed assessment</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-white rounded-lg p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Recommended Track</p>
              <p className="text-lg font-bold text-blue-900">{aiRecommendation.track}</p>
            </div>

            <div className="bg-white rounded-lg p-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Recommended Electives</p>
              <div className="flex flex-wrap gap-2">
                {aiRecommendation.electives.map((elective, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-900 text-white text-sm font-medium rounded-full"
                  >
                    {elective}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2 text-xs text-gray-600">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>You can follow the AI recommendation or choose your own track and electives below.</p>
          </div>
        </div>
      )}

      {/* Student Choice */}
      <div className="portal-glass-panel rounded-xl p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Your Choice</h3>

        {renderSelect("Preferred Track", "preferredTrack", ["Academic", "Technical-Professional"])}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {renderSelect("Elective 1", "elective1", getAvailableElectives())}
          {renderSelect("Elective 2", "elective2", getAvailableElectives())}
        </div>
      </div>

      {formData.admissionType === "New Regular" ? (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Year Level <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value="Grade 11"
            readOnly
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700"
          />
          <p className="text-xs text-gray-500 mt-1">Fixed for New Regular students</p>
        </div>
      ) : (
        renderSelect("Year Level", "yearLevel", ["Grade 11", "Grade 12"])
      )}
    </motion.div>
  );

  // Page 5: Educational Background
  const renderPage5 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-blue-900 flex items-center justify-center">
          <GraduationCap className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Educational Background</h2>
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-900 p-4 rounded">
        <h3 className="font-bold text-blue-900 mb-2">Primary Education</h3>
      </div>

      {renderInput("School Name", "primarySchool")}
      {renderInput("Year Graduated", "primaryYearGraduated", "number", true, "YYYY")}

      <div className="bg-green-50 border-l-4 border-green-600 p-4 rounded mt-8">
        <h3 className="font-bold text-green-900 mb-2">Secondary Education (Junior High School)</h3>
      </div>

      {renderInput("School Name", "secondarySchool")}
      {renderInput("Year Graduated", "secondaryYearGraduated", "number", true, "YYYY")}

      {formData.admissionType === "New Regular" && (
        renderInput("Grade 10 Adviser", "grade10Adviser", "text", true, "Full name of adviser")
      )}
    </motion.div>
  );

  // Page 6: Document Upload
  const renderPage6 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-blue-900 flex items-center justify-center">
          <FileCheck className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Required Documents</h2>
      </div>

      <p className="text-gray-600">Please upload clear and readable copies of the following documents:</p>

      {renderFileUpload("Form 138 (Report Card)", "form138")}
      {renderFileUpload("Form 137", "form137", false)}
      {renderFileUpload("Certificate of Good Moral", "goodMoral", false)}
      {renderFileUpload("PSA Authenticated Birth Certificate (2 copies)", "birthCertificate")}
      {renderFileUpload("2\"x2\" ID Picture (White Background, 2 copies)", "idPicture")}
      {renderFileUpload("Photocopy of Grade 10 Diploma", "diploma")}
      {renderFileUpload("ESC Certificate (only if from private JHS)", "escCertificate", false)}

      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-yellow-900 mb-1">Important Notice</p>
          <p className="text-sm text-yellow-800">
            All uploaded documents must also be submitted as physical hard copies to the Registrar's Office upon acceptance or confirmation of enrollment.
          </p>
        </div>
      </div>
    </motion.div>
  );

  // Page 7: Summary
  const renderPage7 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-blue-900 flex items-center justify-center">
          <Eye className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Review & Submit</h2>
      </div>

      <div className="portal-glass-panel rounded-xl p-6 space-y-6">
        {/* Basic Information */}
        <div>
          <h3 className="font-bold text-gray-800 mb-3 pb-2 border-b">Basic Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-600">Admission Type:</span> <span className="font-medium">{formData.admissionType}</span></div>
            <div><span className="text-gray-600">LRN:</span> <span className="font-medium">{formData.lrn || "N/A"}</span></div>
            <div><span className="text-gray-600">Name:</span> <span className="font-medium">{formData.firstName} {formData.middleName && `${formData.middleName} `}{formData.lastName} {formData.suffix && formData.suffix !== "None" ? formData.suffix : ""}</span></div>
            <div><span className="text-gray-600">Sex:</span> <span className="font-medium">{formData.sex}</span></div>
            <div><span className="text-gray-600">Civil Status:</span> <span className="font-medium">{formData.civilStatus}</span></div>
            <div><span className="text-gray-600">Birthday:</span> <span className="font-medium">{formData.birthday}</span></div>
            <div><span className="text-gray-600">Religion:</span> <span className="font-medium">{formData.religion}</span></div>
            <div><span className="text-gray-600">Nationality:</span> <span className="font-medium">{formData.nationality}</span></div>
            <div><span className="text-gray-600">Disability:</span> <span className="font-medium">{formData.disability}</span></div>
            <div><span className="text-gray-600">Indigenous Group:</span> <span className="font-medium">{formData.indigenousGroup}</span></div>
            <div><span className="text-gray-600">Email:</span> <span className="font-medium">{formData.email}</span></div>
            <div><span className="text-gray-600">Contact Number:</span> <span className="font-medium">{formData.contactNumber}</span></div>
            <div><span className="text-gray-600">Facebook Name:</span> <span className="font-medium">{formData.facebookName || "N/A"}</span></div>
            <div><span className="text-gray-600">Working Student:</span> <span className="font-medium">{formData.isWorkingStudent ? "Yes" : "No"}</span></div>
          </div>
        </div>

        {/* Address */}
        <div>
          <h3 className="font-bold text-gray-800 mb-3 pb-2 border-b flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Address
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-600">Region:</span> <span className="font-medium">{formData.region}</span></div>
            <div><span className="text-gray-600">Province:</span> <span className="font-medium">{formData.province}</span></div>
            <div><span className="text-gray-600">City:</span> <span className="font-medium">{formData.city}</span></div>
            <div><span className="text-gray-600">Barangay:</span> <span className="font-medium">{formData.barangay}</span></div>
            <div className="col-span-1 sm:col-span-2"><span className="text-gray-600">Home Address:</span> <span className="font-medium">{formData.homeAddress}</span></div>
          </div>
        </div>

        {/* Parents/Guardians */}
        <div>
          <h3 className="font-bold text-gray-800 mb-3 pb-2 border-b flex items-center gap-2">
            <Users className="w-5 h-5" />
            Parents & Guardians
          </h3>
          <div className="space-y-4">
            {/* Father */}
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Father</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm ml-4">
                <div><span className="text-gray-600">Name:</span> <span className="font-medium">{formData.fatherLastName}, {formData.fatherFirstName} {formData.fatherMiddleName && `${formData.fatherMiddleName}`}</span></div>
                <div><span className="text-gray-600">Occupation:</span> <span className="font-medium">{formData.fatherOccupation}</span></div>
                <div><span className="text-gray-600">Contact:</span> <span className="font-medium">{formData.fatherContact}</span></div>
              </div>
            </div>
            
            {/* Mother */}
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Mother</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm ml-4">
                <div><span className="text-gray-600">Maiden Name:</span> <span className="font-medium">{formData.motherMaidenName}</span></div>
                <div><span className="text-gray-600">Current Name:</span> <span className="font-medium">{formData.motherLastName}, {formData.motherFirstName} {formData.motherMiddleName && `${formData.motherMiddleName}`}</span></div>
                <div><span className="text-gray-600">Occupation:</span> <span className="font-medium">{formData.motherOccupation}</span></div>
                <div><span className="text-gray-600">Contact:</span> <span className="font-medium">{formData.motherContact}</span></div>
              </div>
            </div>

            {/* Guardian (if applicable) */}
            {formData.guardianSource && (
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">Guardian</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm ml-4">
                  <div><span className="text-gray-600">Relationship:</span> <span className="font-medium">{formData.guardianSource}</span></div>
                  <div><span className="text-gray-600">Name:</span> <span className="font-medium">{formData.guardianLastName}, {formData.guardianFirstName} {formData.guardianMiddleName && `${formData.guardianMiddleName}`}</span></div>
                  <div><span className="text-gray-600">Occupation:</span> <span className="font-medium">{formData.guardianOccupation}</span></div>
                  <div><span className="text-gray-600">Contact:</span> <span className="font-medium">{formData.guardianContact}</span></div>
                </div>
              </div>
            )}

            <div>
              <div className="text-sm"><span className="text-gray-600">4Ps Member:</span> <span className="font-medium">{formData.is4PsMember ? "Yes" : "No"}</span></div>
            </div>
          </div>
        </div>

        {/* Enrollment */}
        <div>
          <h3 className="font-bold text-gray-800 mb-3 pb-2 border-b flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            Enrollment Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-600">Track:</span> <span className="font-medium">{formData.preferredTrack}</span></div>
            <div><span className="text-gray-600">Year Level:</span> <span className="font-medium">{formData.yearLevel}</span></div>
            <div><span className="text-gray-600">Elective 1:</span> <span className="font-medium">{formData.elective1}</span></div>
            <div><span className="text-gray-600">Elective 2:</span> <span className="font-medium">{formData.elective2}</span></div>
          </div>
        </div>

        {/* Education */}
        <div>
          <h3 className="font-bold text-gray-800 mb-3 pb-2 border-b flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Educational Background
          </h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Primary School</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm ml-4">
                <div><span className="text-gray-600">School Name:</span> <span className="font-medium">{formData.primarySchool}</span></div>
                <div><span className="text-gray-600">Year Graduated:</span> <span className="font-medium">{formData.primaryYearGraduated}</span></div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Secondary School</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm ml-4">
                <div><span className="text-gray-600">School Name:</span> <span className="font-medium">{formData.secondarySchool}</span></div>
                <div><span className="text-gray-600">Year Graduated:</span> <span className="font-medium">{formData.secondaryYearGraduated}</span></div>
              </div>
            </div>
            <div>
              <div className="text-sm"><span className="text-gray-600">Grade 10 Adviser:</span> <span className="font-medium">{formData.grade10Adviser}</span></div>
            </div>
          </div>
        </div>

        {/* Documents */}
        <div>
          <h3 className="font-bold text-gray-800 mb-3 pb-2 border-b flex items-center gap-2">
            <FileCheck className="w-5 h-5" />
            Uploaded Documents
          </h3>
          <div className="space-y-2 text-sm">
            {formData.form138 ? <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600" /> Form 138</div> : <div className="flex items-center gap-2 text-gray-400"><X className="w-4 h-4" /> Form 138</div>}
            {formData.form137 ? <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600" /> Form 137</div> : <div className="flex items-center gap-2 text-gray-400"><X className="w-4 h-4" /> Form 137</div>}
            {formData.goodMoral ? <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600" /> Good Moral Certificate</div> : <div className="flex items-center gap-2 text-gray-400"><X className="w-4 h-4" /> Good Moral Certificate</div>}
            {formData.birthCertificate ? <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600" /> Birth Certificate</div> : <div className="flex items-center gap-2 text-gray-400"><X className="w-4 h-4" /> Birth Certificate</div>}
            {formData.idPicture ? <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600" /> ID Picture</div> : <div className="flex items-center gap-2 text-gray-400"><X className="w-4 h-4" /> ID Picture</div>}
            {formData.diploma ? <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600" /> Grade 10 Diploma</div> : <div className="flex items-center gap-2 text-gray-400"><X className="w-4 h-4" /> Grade 10 Diploma</div>}
            {formData.escCertificate ? <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600" /> ESC Certificate</div> : <div className="flex items-center gap-2 text-gray-400"><X className="w-4 h-4" /> ESC Certificate</div>}
          </div>
        </div>
      </div>

      <div className="portal-glass-panel-strong rounded-xl border p-4" style={{ borderColor: "var(--electron-blue)" }}>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={certificationChecked}
            onChange={(e) => setCertificationChecked(e.target.checked)}
            className="w-5 h-5 text-blue-600 mt-0.5 cursor-pointer"
          />
          <span className="text-sm text-gray-700">
            <strong>I hereby certify</strong> that all information and uploaded documents are true and correct. I understand that providing false information may result in disqualification.
          </span>
        </label>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <button
          onClick={handlePrevious}
          className="w-full sm:w-auto px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Previous
        </button>
        <button
          onClick={handleSubmit}
          className="w-full sm:w-auto px-6 py-3 bg-blue-900 text-white font-bold rounded-lg hover:bg-blue-800 transition-colors flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-5 h-5" />
          Submit Enrollment Form
        </button>
      </div>
    </motion.div>
  );

  return (
    <div className="portal-dashboard-page flex flex-col gap-6 p-4 sm:p-6 lg:p-8 w-full">
      <div className="w-full max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{ color: "var(--electron-blue)" }}>
            Enrollment Form
          </h1>
          <p className="text-gray-600">
            Please complete all required fields to proceed with your enrollment
          </p>
        </div>

        {/* Page Indicator */}
        {renderPageIndicator()}

        {/* Form Content */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 md:p-8 mb-6">
          {currentPage === 1 && renderPage1()}
          {currentPage === 2 && renderPage2()}
          {currentPage === 3 && renderPage3()}
          {currentPage === 4 && renderPage4()}
          {currentPage === 5 && renderPage5()}
          {currentPage === 6 && renderPage6()}
          {currentPage === 7 && renderPage7()}
        </div>

        {/* Navigation Buttons */}
        {currentPage < 7 && (
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            {currentPage > 1 && (
              <button
                onClick={handlePrevious}
                className="w-full sm:w-auto px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Previous
              </button>
            )}
            <button
              onClick={handleNext}
              className="w-full sm:w-auto sm:ml-auto px-6 py-3 bg-blue-900 text-white font-semibold rounded-lg hover:bg-blue-800 transition-colors flex items-center justify-center gap-2"
            >
              Next
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Already Submitted Modal */}
      {showAlreadySubmittedModal && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 z-50"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div className="portal-glass-modal w-full max-w-md rounded-xl">
            {/* Success Icon */}
            <div className="p-6 text-center border-b border-gray-200">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Enrollment Already Submitted
              </h3>
              <p className="text-gray-600">
                You have already submitted your enrollment form. Your application is currently being reviewed by the Registrar.
              </p>
            </div>

            {/* Action Button */}
            <div className="p-6">
              <button
                onClick={() => navigate("/dashboard")}
                className="w-full py-4 rounded-xl text-white font-semibold transition-all"
                style={{ backgroundColor: "#1E3A8A" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1E40AF")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#1E3A8A")}
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}