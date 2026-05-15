import { useState, useEffect, useRef } from "react";
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
import { getSystemSettings } from "../../services/systemSettingsService";
import { LoadingState } from "../components/LoadingState";
import { 
  saveDraft, 
  loadDraft, 
  checkExistingEnrollment, 
  getUserEnrollment,
  submitEnrollment,
  uploadDocument 
} from "../../services/enrollmentService";
import { triggerNotification } from "../../services/notificationService";
import { supabase } from "../../supabase";
import electivesDataset from "../../data/electives";
import {
  getBarangays,
  getCities,
  getCitiesByProvince,
  getProvinces,
  getRegions,
} from "../../services/addressService";

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

const allElectives = Array.from(
  new Set(
    [
      ...academicElectives,
      ...technicalElectives,
      ...((electivesDataset as Array<{ name?: string }>).map((elective) => elective.name).filter(Boolean) as string[]),
    ].sort((first, second) => first.localeCompare(second))
  )
);

const guardianFields = [
  "guardianLastName",
  "guardianFirstName",
  "guardianMiddleName",
  "guardianOccupation",
  "guardianContact",
] as const;

const normalizeSexForEnrollment = (value?: string | null) => {
  const normalizedValue = String(value || "").trim().toLowerCase();

  if (normalizedValue === "male") return "Male";
  if (normalizedValue === "female") return "Female";

  return value || "";
};

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
  const { updateEnrollmentProgress, userData, logout } = useAuth();
  const enrollmentDraftKey = `enrollmentFormDraft_${userData?.email || "guest"}`;
  const [currentPage, setCurrentPage] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [aiRecommendation, setAiRecommendation] = useState<{
    track: string;
    electives: string[];
  } | null>(null);
  const [hasAssessment, setHasAssessment] = useState(true);
  const [showAlreadySubmittedModal, setShowAlreadySubmittedModal] = useState(false);
  const [isSubmittedEnrollment, setIsSubmittedEnrollment] = useState(false);
  const [submittedSummaryData, setSubmittedSummaryData] = useState<Record<string, any> | null>(null);
  const [certificationChecked, setCertificationChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);
  const [systemSettings, setSystemSettings] = useState<any>(null);
  const [regions, setRegions] = useState<any[]>([]);
  const [availableProvinces, setAvailableProvinces] = useState<any[]>([]);
  const [availableCities, setAvailableCities] = useState<any[]>([]);
  const [availableBarangays, setAvailableBarangays] = useState<any[]>([]);
  const [addressLoading, setAddressLoading] = useState({
    regions: false,
    provinces: false,
    cities: false,
    barangays: false,
  });
  const [addressError, setAddressError] = useState("");
  const hasRestoredDraft = useRef(false);

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

  const stripFileFields = (data: Partial<FormData>) => {
    const { form138, form137, goodMoral, birthCertificate, idPicture, diploma, escCertificate, ...restData } = data;
    return restData;
  };

  const getGuardianFromParent = (data: Partial<FormData>, source = data.guardianSource) => {
    if (source === "father") {
      return {
        guardianLastName: data.fatherLastName || "",
        guardianFirstName: data.fatherFirstName || "",
        guardianMiddleName: data.fatherMiddleName || "",
        guardianOccupation: data.fatherOccupation || "",
        guardianContact: data.fatherContact || "",
      };
    }

    if (source === "mother") {
      return {
        guardianLastName: data.motherLastName || "",
        guardianFirstName: data.motherFirstName || "",
        guardianMiddleName: data.motherMiddleName || "",
        guardianOccupation: data.motherOccupation || "",
        guardianContact: data.motherContact || "",
      };
    }

    return {
      guardianLastName: data.guardianLastName || "",
      guardianFirstName: data.guardianFirstName || "",
      guardianMiddleName: data.guardianMiddleName || "",
      guardianOccupation: data.guardianOccupation || "",
      guardianContact: data.guardianContact || "",
    };
  };

  const applyGuardianSelection = <T extends Partial<FormData>>(data: T): T => ({
    ...data,
    ...(data.guardianSource === "father" || data.guardianSource === "mother"
      ? getGuardianFromParent(data, data.guardianSource)
      : {}),
  });

  const clearGuardianFields = <T extends Partial<FormData>>(data: T): T => {
    const nextData = { ...data };
    guardianFields.forEach((field) => {
      (nextData as Record<string, any>)[field] = "";
    });
    return nextData;
  };

  const applyRegistrationData = (source: any = {}) => {
    const registrationSex = normalizeSexForEnrollment(source.sex || source.gender);

    setFormData(prev => ({
      ...prev,
      firstName: prev.firstName || source.firstName || source.first_name || "",
      lastName: prev.lastName || source.lastName || source.last_name || "",
      middleName: prev.middleName || source.middleName || source.middle_name || "",
      suffix: prev.suffix && prev.suffix !== "None" ? prev.suffix : source.suffix || "None",
      sex: normalizeSexForEnrollment(prev.sex || registrationSex),
      birthday: prev.birthday || source.birthDate || source.birth_date || "",
      email: prev.email || source.email || userData?.email || "",
      contactNumber: prev.contactNumber || source.contactNumber || source.contact_number || "",
      nationality: prev.nationality || source.nationality || "Filipino",
      religion: prev.religion || source.religion || "",
      civilStatus: prev.civilStatus || source.civilStatus || source.civil_status || "",
      region: prev.region || source.region || "",
      province: prev.province || source.province || "",
      city: prev.city || source.city || "",
      barangay: prev.barangay || source.barangay || "",
      homeAddress: prev.homeAddress || source.homeAddress || source.home_address || "",
      facebookName: prev.facebookName || source.facebookName || source.facebook_name || "",
      lrn: prev.lrn || source.lrn || "",
    }));
  };

  const mergeDraftWithRegistrationData = (draftData: Partial<FormData>, registrationSource: any = {}) => ({
    ...draftData,
    sex: normalizeSexForEnrollment(draftData.sex || registrationSource.sex || registrationSource.gender),
    birthday: draftData.birthday || registrationSource.birthDate || registrationSource.birth_date || "",
    contactNumber: draftData.contactNumber || registrationSource.contactNumber || registrationSource.contact_number || "",
  });

  const normalizeSubmittedRecord = (record: any) => {
    const source = record?.form_data || record || {};

    return {
      admissionType: source.admissionType || source.admission_type || "",
      previousStudentId: source.previousStudentId || source.previous_student_id || "",
      lrn: source.lrn || "",
      isWorkingStudent: source.isWorkingStudent ?? source.is_working_student ?? false,
      lastName: source.lastName || source.last_name || "",
      firstName: source.firstName || source.first_name || "",
      middleName: source.middleName || source.middle_name || "",
      suffix: source.suffix || "None",
      sex: normalizeSexForEnrollment(source.sex),
      civilStatus: source.civilStatus || source.civil_status || "",
      religion: source.religion || "",
      nationality: source.nationality || "Filipino",
      disability: source.disability || "Not Applicable",
      disabilityOther: source.disabilityOther || source.disability_other || "",
      indigenousGroup: source.indigenousGroup || source.indigenous_group || "Not Applicable",
      indigenousGroupOther: source.indigenousGroupOther || source.indigenous_group_other || "",
      birthday: source.birthday || source.birth_date || "",
      email: source.email || "",
      contactNumber: source.contactNumber || source.contact_number || "",
      facebookName: source.facebookName || source.facebook_name || "",
      region: source.region || "",
      province: source.province || "",
      city: source.city || "",
      barangay: source.barangay || "",
      homeAddress: source.homeAddress || source.home_address || "",
      fatherLastName: source.fatherLastName || source.father_last_name || "",
      fatherFirstName: source.fatherFirstName || source.father_first_name || "",
      fatherMiddleName: source.fatherMiddleName || source.father_middle_name || "",
      fatherOccupation: source.fatherOccupation || source.father_occupation || "",
      fatherContact: source.fatherContact || source.father_contact || "",
      motherMaidenName: source.motherMaidenName || source.mother_maiden_name || "",
      motherLastName: source.motherLastName || source.mother_last_name || "",
      motherFirstName: source.motherFirstName || source.mother_first_name || "",
      motherMiddleName: source.motherMiddleName || source.mother_middle_name || "",
      motherOccupation: source.motherOccupation || source.mother_occupation || "",
      motherContact: source.motherContact || source.mother_contact || "",
      guardianSource: source.guardianSource || source.guardian_source || "",
      guardianLastName: source.guardianLastName || source.guardian_last_name || "",
      guardianFirstName: source.guardianFirstName || source.guardian_first_name || "",
      guardianMiddleName: source.guardianMiddleName || source.guardian_middle_name || "",
      guardianOccupation: source.guardianOccupation || source.guardian_occupation || "",
      guardianContact: source.guardianContact || source.guardian_contact || "",
      is4PsMember: source.is4PsMember ?? source.is_4ps_member ?? false,
      preferredTrack: source.preferredTrack || source.preferred_track || "",
      elective1: source.elective1 || source.elective_1 || "",
      elective2: source.elective2 || source.elective_2 || "",
      yearLevel: source.yearLevel || source.year_level || "",
      primarySchool: source.primarySchool || source.primary_school || "",
      primaryYearGraduated: source.primaryYearGraduated || source.primary_year_graduated || "",
      secondarySchool: source.secondarySchool || source.secondary_school || "",
      secondaryYearGraduated: source.secondaryYearGraduated || source.secondary_year_graduated || "",
      grade10Adviser: source.grade10Adviser || source.grade_10_adviser || "",
      form138: source.form138 || null,
      form137: source.form137 || null,
      goodMoral: source.goodMoral || null,
      birthCertificate: source.birthCertificate || null,
      idPicture: source.idPicture || null,
      diploma: source.diploma || null,
      escCertificate: source.escCertificate || null,
      documents: record.enrollment_documents || source.documents || [],
    };
  };

  // Load AI assessment results on mount
  useEffect(() => {
    const userEmail = userData?.email;
    if (!userEmail) {
      setIsInitializing(false);
      return;
    }

    const initializeForm = async () => {
      try {
        // Check if enrollment already submitted
        const { data: existingEnrollment } = await checkExistingEnrollment(userEmail);
        if (existingEnrollment) {
          // Load the full enrollment data
          const { data: enrollmentData } = await getUserEnrollment(userEmail);
          if (enrollmentData) {
            setIsSubmittedEnrollment(true);
            setCurrentPage(7);
            setSubmittedSummaryData(normalizeSubmittedRecord(enrollmentData));
            setIsInitializing(false);
            return;
          }
        }

        let restoredDraftData: any = null;
        let registrationSource: any = userData || {};

        try {
          const localDraft = localStorage.getItem(enrollmentDraftKey);
          if (localDraft) {
            const parsedDraft = JSON.parse(localDraft);
            restoredDraftData = parsedDraft.formData || null;

            if (Number.isInteger(parsedDraft.currentPage)) {
              setCurrentPage(Math.min(Math.max(parsedDraft.currentPage, 1), 7));
            }

            if (typeof parsedDraft.certificationChecked === "boolean") {
              setCertificationChecked(parsedDraft.certificationChecked);
            }

            console.log("Enrollment draft restored from local storage");
          }
        } catch (error) {
          console.error("Failed to restore local enrollment draft:", error);
        }

        try {
          const { data: registrationData } = await supabase
            .from("users")
            .select("*")
            .eq("email", userEmail)
            .single();

          registrationSource = registrationData || userData || {};
          applyRegistrationData(registrationSource);
        } catch (error) {
          console.error("Failed to fetch registration data:", error);
          applyRegistrationData(userData || {});
        }

        if (restoredDraftData) {
          const restData = mergeDraftWithRegistrationData(restoredDraftData, registrationSource);
          setFormData(prev => applyGuardianSelection({ ...prev, ...restData }));
          restoredDraftData = restData;
        }
        
        // Try to restore autosaved draft
        const { data: draftData } = await loadDraft(userEmail);
        if (draftData && !restoredDraftData) {
          try {
            const { currentPage: draftPage, certificationChecked: draftCertification, lastSaved, ...rawDraftData } = draftData;
            const restData = mergeDraftWithRegistrationData(
              stripFileFields(rawDraftData as Partial<FormData>),
              registrationSource
            );
            setFormData(prev => applyGuardianSelection({ ...prev, ...restData }));
            if (Number.isInteger(draftPage)) {
              setCurrentPage(Math.min(Math.max(draftPage, 1), 7));
            }
            if (typeof draftCertification === "boolean") {
              setCertificationChecked(draftCertification);
            }
            restoredDraftData = restData;
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
            if (!restoredDraftData && !draftData) {
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
      } finally {
        hasRestoredDraft.current = true;
        setIsInitializing(false);
      }
    };
    
    initializeForm();
  }, [userData]);

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      setIsSettingsLoading(true);

      try {
        const result = await getSystemSettings();
        if (active) {
          setSystemSettings(result?.data ?? { enrollment_open: true });
        }
      } catch (error) {
        console.error('Error loading system settings:', error);
        if (active) {
          setSystemSettings({ enrollment_open: true });
        }
      } finally {
        if (active) {
          setIsSettingsLoading(false);
        }
      }
    }

    void loadSettings();

    return () => {
      active = false;
    };
  }, []);

  const isEnrollmentOpen = systemSettings?.enrollment_open !== false;
  const isLoading = isInitializing || isSettingsLoading;
  const selectedRegion = regions.find((region) => region.name === formData.region);
  const selectedProvince = availableProvinces.find((province) => province.name === formData.province);
  const selectedCity = availableCities.find((city) => city.name === formData.city);

  const mergeCurrentOption = (items: any[], value: string) => {
    if (!value || items.some((item) => item.name === value)) {
      return items;
    }

    return [{ code: value, name: value }, ...items];
  };

  useEffect(() => {
    let active = true;

    async function loadPsgcRegions() {
      setAddressLoading((state) => ({ ...state, regions: true }));
      setAddressError("");

      try {
        const data = await getRegions();
        if (active) {
          setRegions(data);
        }
      } catch (error) {
        console.error("Failed to load PSGC regions:", error);
        if (active) {
          setAddressError("Unable to load Philippine address data. Please check your connection and try again.");
        }
      } finally {
        if (active) {
          setAddressLoading((state) => ({ ...state, regions: false }));
        }
      }
    }

    void loadPsgcRegions();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadRegionAddresses() {
      setAvailableProvinces([]);
      setAvailableCities([]);
      setAvailableBarangays([]);

      if (!selectedRegion?.code) {
        return;
      }

      setAddressLoading((state) => ({ ...state, provinces: true, cities: true }));
      setAddressError("");

      try {
        const [provinceData, cityData] = await Promise.all([
          getProvinces(selectedRegion.code),
          getCities(selectedRegion.code),
        ]);

        if (active) {
          setAvailableProvinces(provinceData);
          setAvailableCities(provinceData.length === 0 ? cityData : []);
        }
      } catch (error) {
        console.error("Failed to load PSGC region addresses:", error);
        if (active) {
          setAddressError("Unable to load provinces or cities for the selected region.");
        }
      } finally {
        if (active) {
          setAddressLoading((state) => ({ ...state, provinces: false, cities: false }));
        }
      }
    }

    void loadRegionAddresses();

    return () => {
      active = false;
    };
  }, [selectedRegion?.code]);

  useEffect(() => {
    let active = true;

    async function loadProvinceCities() {
      if (!selectedProvince?.code) {
        return;
      }

      setAvailableCities([]);
      setAvailableBarangays([]);
      setAddressLoading((state) => ({ ...state, cities: true }));
      setAddressError("");

      try {
        const cityData = await getCitiesByProvince(selectedProvince.code);
        if (active) {
          setAvailableCities(cityData);
        }
      } catch (error) {
        console.error("Failed to load PSGC province cities:", error);
        if (active) {
          setAddressError("Unable to load cities or municipalities for the selected province.");
        }
      } finally {
        if (active) {
          setAddressLoading((state) => ({ ...state, cities: false }));
        }
      }
    }

    void loadProvinceCities();

    return () => {
      active = false;
    };
  }, [selectedProvince?.code]);

  useEffect(() => {
    let active = true;

    async function loadCityBarangays() {
      setAvailableBarangays([]);

      if (!selectedCity?.code) {
        return;
      }

      setAddressLoading((state) => ({ ...state, barangays: true }));
      setAddressError("");

      try {
        const barangayData = await getBarangays(selectedCity.code);
        if (active) {
          setAvailableBarangays(barangayData);
        }
      } catch (error) {
        console.error("Failed to load PSGC barangays:", error);
        if (active) {
          setAddressError("Unable to load barangays for the selected city or municipality.");
        }
      } finally {
        if (active) {
          setAddressLoading((state) => ({ ...state, barangays: false }));
        }
      }
    }

    void loadCityBarangays();

    return () => {
      active = false;
    };
  }, [selectedCity?.code]);

  // Auto-fill form with user data from AuthContext
  useEffect(() => {
    if (userData) {
      console.log("[EnrollmentForm] Auto-filling form with user data:", userData);
      applyRegistrationData(userData);
    }
  }, [userData?.email, userData?.firstName]);

  useEffect(() => {
    if (isSubmittedEnrollment || (formData.guardianSource !== "father" && formData.guardianSource !== "mother")) {
      return;
    }

    const syncedGuardian = getGuardianFromParent(formData, formData.guardianSource);
    const needsSync = guardianFields.some((field) => formData[field] !== syncedGuardian[field]);

    if (needsSync) {
      setFormData(prev => ({
        ...prev,
        ...getGuardianFromParent(prev, prev.guardianSource),
      }));
    }
  }, [
    formData.fatherLastName,
    formData.fatherFirstName,
    formData.fatherMiddleName,
    formData.fatherOccupation,
    formData.fatherContact,
    formData.motherLastName,
    formData.motherFirstName,
    formData.motherMiddleName,
    formData.motherOccupation,
    formData.motherContact,
    formData.guardianSource,
    formData.guardianLastName,
    formData.guardianFirstName,
    formData.guardianMiddleName,
    formData.guardianOccupation,
    formData.guardianContact,
    isSubmittedEnrollment,
  ]);

  // Autosave effect - save draft on every form data change
  useEffect(() => {
    const userEmail = userData?.email;
    if (!userEmail || isInitializing || isSubmittedEnrollment || !hasRestoredDraft.current) return;

    // Don't save if form is completely empty
    const hasData = Object.values(formData).some(value => {
      if (typeof value === 'string') return value.length > 0;
      if (typeof value === 'boolean') return value;
      return false;
    });

    if (hasData) {
      // Save draft (excluding File objects)
      const dataToSave = stripFileFields(formData);
      const draft = {
        ...dataToSave,
        currentPage,
        certificationChecked,
        lastSaved: new Date().toISOString()
      };
      localStorage.setItem(
        enrollmentDraftKey,
        JSON.stringify({
          formData: dataToSave,
          currentPage,
          certificationChecked,
          lastSaved: draft.lastSaved,
        })
      );
      saveDraft(userEmail, draft);
    }
  }, [
    certificationChecked,
    currentPage,
    enrollmentDraftKey,
    formData,
    isInitializing,
    isSubmittedEnrollment,
    userData,
  ]);

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
              sex: normalizeSexForEnrollment(savedFormData.sex),
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
    // Don't allow changes if this is a submitted enrollment
    if (isSubmittedEnrollment) return;
    
    setFormData(prev => {
      const nextValue = field === "sex" && typeof value === "string" ? normalizeSexForEnrollment(value) : value;
      let newData = { ...prev, [field]: nextValue };
      
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

      if (field === "guardianSource") {
        const nextSource = value === prev.guardianSource ? "" : String(value);
        newData = {
          ...newData,
          guardianSource: nextSource,
          ...(nextSource === "father" || nextSource === "mother"
            ? getGuardianFromParent(newData, nextSource)
            : getGuardianFromParent(clearGuardianFields(newData), "")),
        };
      } else if (newData.guardianSource === "father" || newData.guardianSource === "mother") {
        newData = applyGuardianSelection(newData);
      }
      
      return newData;
    });
    
    // Clear error when user starts typing
    if (errors[field] || field === "guardianSource") {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        if (field === "guardianSource") {
          guardianFields.forEach((guardianField) => {
            delete newErrors[guardianField];
          });
        }
        return newErrors;
      });
    }
  };

  const handleFileChange = (field: keyof FormData, file: File | null) => {
    // Don't allow changes if this is a submitted enrollment
    if (isSubmittedEnrollment) return;
    
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
    const normalizedPhone = phone.trim().replace(/[\s-]/g, "");
    const phoneRegex = /^(09\d{9}|\+639\d{9})$/;
    return phoneRegex.test(normalizedPhone);
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
        newErrors.contactNumber = "Please enter a valid Philippine mobile number (09XXXXXXXXX or +639XXXXXXXXX).";
      }
      if (!formData.facebookName) newErrors.facebookName = "This field is required";
    }

    if (page === 2) {
      if (!formData.region) newErrors.region = "This field is required";
      if (availableProvinces.length > 0 && !formData.province) {
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
        newErrors.fatherContact = "Please enter a valid Philippine mobile number (09XXXXXXXXX or +639XXXXXXXXX).";
      }
      if (!formData.motherMaidenName) newErrors.motherMaidenName = "This field is required";
      if (!formData.motherLastName) newErrors.motherLastName = "This field is required";
      if (!formData.motherFirstName) newErrors.motherFirstName = "This field is required";
      if (!formData.motherOccupation) newErrors.motherOccupation = "This field is required";
      if (!formData.motherContact) {
        newErrors.motherContact = "This field is required";
      } else if (!validatePhoneNumber(formData.motherContact)) {
        newErrors.motherContact = "Please enter a valid Philippine mobile number (09XXXXXXXXX or +639XXXXXXXXX).";
      }
      
      const guardianData = getGuardianFromParent(formData, formData.guardianSource);
      if (!guardianData.guardianLastName) newErrors.guardianLastName = "This field is required";
      if (!guardianData.guardianFirstName) newErrors.guardianFirstName = "This field is required";
      if (!guardianData.guardianOccupation) newErrors.guardianOccupation = "This field is required";
      if (!guardianData.guardianContact) {
        newErrors.guardianContact = "This field is required";
      } else if (!validatePhoneNumber(guardianData.guardianContact)) {
        newErrors.guardianContact = "Please enter a valid Philippine mobile number (09XXXXXXXXX or +639XXXXXXXXX).";
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

    if (!validatePage(3)) {
      setCurrentPage(3);
      return;
    }

    if (!validatePage(6)) return;

    const userEmail = userData?.email;
    if (!userEmail) {
      alert("Unable to submit enrollment. Please sign in again.");
      return;
    }

    setIsSubmitting(true);
    try {
      const userId = userEmail; // Use email as user identifier (custom auth, not Supabase Auth)
      
      const syncedFormData = applyGuardianSelection(formData);

      // Create enrollment submission data
      const enrollmentData = {
        studentName: `${syncedFormData.firstName} ${syncedFormData.middleName} ${syncedFormData.lastName}`,
        email: syncedFormData.email,
        contactNumber: syncedFormData.contactNumber,
        submissionDate: new Date().toISOString(),
        ...syncedFormData,
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

      const uploadedDocuments = Object.entries(documentFiles)
        .filter(([, file]) => file)
        .map(([docType]) => ({ document_type: docType }));

      setSubmittedSummaryData(normalizeSubmittedRecord({
        ...enrollmentResult,
        enrollment_documents: uploadedDocuments,
        form_data: enrollmentData,
      }));
      localStorage.removeItem(enrollmentDraftKey);
      setIsSubmittedEnrollment(true);
      setCurrentPage(7);
      navigate("/dashboard/payment");
    } catch (error) {
      console.error('Enrollment submission error:', error);
      alert('Failed to submit enrollment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getAvailableElectives = () => {
    return allElectives;
  };

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
    placeholder?: string,
    disabled: boolean = false
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
          disabled={isSubmittedEnrollment || disabled}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors[field] ? "border-red-500" : "border-gray-300"
          } ${isSubmittedEnrollment || disabled ? "bg-gray-50 cursor-not-allowed opacity-60" : ""}`}
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
        disabled={isSubmittedEnrollment}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          errors[field] ? "border-red-500" : "border-gray-300"
        } ${isSubmittedEnrollment ? "bg-gray-50 cursor-not-allowed opacity-60" : ""}`}
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
        } ${isSubmittedEnrollment ? "opacity-60 cursor-not-allowed bg-gray-50" : ""}`}
      >
        <input
          type="file"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
          onChange={(e) => handleFileChange(field, e.target.files?.[0] || null)}
          disabled={isSubmittedEnrollment}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex items-center gap-3">
          <Upload className="w-5 h-5 text-gray-400" />
          <div>
            <p className="text-sm text-gray-700">
              {formData[field] ? (formData[field] as File).name : "Click to upload or drag and drop"}
            </p>
            <p className="text-xs text-gray-500">PDF, image, Office document, or text file</p>
          </div>
          {formData[field] && !isSubmittedEnrollment && (
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
      className="space-y-6 bg-white/95 border border-slate-200 shadow-sm rounded-3xl p-6"
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
            disabled={isSubmittedEnrollment}
            className="w-4 h-4 text-blue-600 disabled:cursor-not-allowed"
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
      {renderInput("Contact Number", "contactNumber", "tel", true, "09XXXXXXXXX or +639XXXXXXXXX")}
      {renderInput("Facebook / Messenger Name", "facebookName")}
    </motion.div>
  );

  // Page 2: Address
  const renderPage2 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6 bg-white/95 border border-slate-200 shadow-sm rounded-3xl p-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-blue-900 flex items-center justify-center">
          <MapPin className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Address</h2>
      </div>

      {addressError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {addressError}
        </div>
      )}

      {renderSelect(
        addressLoading.regions ? "Region (loading...)" : "Region",
        "region",
        mergeCurrentOption(regions, formData.region)
      )}
      
      {formData.region && (addressLoading.provinces || availableProvinces.length > 0 || formData.province) && (
        renderSelect(
          addressLoading.provinces ? "Province (loading...)" : "Province",
          "province",
          mergeCurrentOption(availableProvinces, formData.province)
        )
      )}
      
      {formData.region && (availableProvinces.length === 0 || formData.province) && (
        renderSelect(
          addressLoading.cities ? "Municipality / City (loading...)" : "Municipality / City",
          "city",
          mergeCurrentOption(availableCities, formData.city)
        )
      )}
      
      {formData.city && (
        renderSelect(
          addressLoading.barangays ? "Barangay (loading...)" : "Barangay",
          "barangay",
          mergeCurrentOption(availableBarangays, formData.barangay)
        )
      )}
      
      {renderInput("Home / Street Address", "homeAddress", "text", true, "House No., Street, etc.")}
    </motion.div>
  );

  // Page 3: Parent/Guardian Information
  const renderPage3 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6 bg-white/95 border border-slate-200 shadow-sm rounded-3xl p-6"
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
        {renderInput("Contact Number", "fatherContact", "tel", true, "09XXXXXXXXX or +639XXXXXXXXX")}
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
        {renderInput("Contact Number", "motherContact", "tel", true, "09XXXXXXXXX or +639XXXXXXXXX")}
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
              readOnly
              onClick={() => handleInputChange("guardianSource", "father")}
              disabled={isSubmittedEnrollment}
              className="w-4 h-4 text-blue-600 disabled:cursor-not-allowed"
            />
            <span className="text-sm font-medium text-gray-700">Same as Father's Information</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="guardianSource"
              value="mother"
              checked={formData.guardianSource === "mother"}
              readOnly
              onClick={() => handleInputChange("guardianSource", "mother")}
              disabled={isSubmittedEnrollment}
              className="w-4 h-4 text-blue-600 disabled:cursor-not-allowed"
            />
            <span className="text-sm font-medium text-gray-700">Same as Mother's Information</span>
          </label>
          <p className="text-xs text-gray-500">Select an option again to clear it and enter guardian details manually.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {renderInput("Last Name", "guardianLastName", "text", true, undefined, Boolean(formData.guardianSource))}
        {renderInput("First Name", "guardianFirstName", "text", true, undefined, Boolean(formData.guardianSource))}
        {renderInput("Middle Name", "guardianMiddleName", "text", false, undefined, Boolean(formData.guardianSource))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderInput("Occupation", "guardianOccupation", "text", true, undefined, Boolean(formData.guardianSource))}
        {renderInput("Contact Number", "guardianContact", "tel", true, "09XXXXXXXXX or +639XXXXXXXXX", Boolean(formData.guardianSource))}
      </div>

      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.is4PsMember}
            onChange={(e) => handleInputChange("is4PsMember", e.target.checked)}
            disabled={isSubmittedEnrollment}
            className="w-4 h-4 text-blue-600 disabled:cursor-not-allowed"
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
      className="space-y-6 bg-white/95 border border-slate-200 shadow-sm rounded-3xl p-6"
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
      className="space-y-6 bg-white/95 border border-slate-200 shadow-sm rounded-3xl p-6"
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
      className="space-y-6 bg-white/95 border border-slate-200 shadow-sm rounded-3xl p-6"
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
  const renderPage7 = () => {
    const summaryData = applyGuardianSelection(submittedSummaryData || formData);
    const fullName = [summaryData.firstName, summaryData.middleName, summaryData.lastName]
      .filter(Boolean)
      .join(" ");
    const nameDisplay = [fullName, summaryData.suffix && summaryData.suffix !== "None" ? summaryData.suffix : ""]
      .filter(Boolean)
      .join(" ");
    const guardianRelationship =
      summaryData.guardianSource === "father"
        ? "Father"
        : summaryData.guardianSource === "mother"
        ? "Mother"
        : "Manual";
    const documents = summaryData.documents || [];
    const hasDocument = (key: string) => {
      if (documents.some((doc: any) => doc.document_type === key || doc.type === key)) {
        return true;
      }

      const documentField = summaryData[key as keyof FormData];
      if (documentField instanceof File) {
        return true;
      }
      return typeof documentField === "string" && documentField.length > 0;
    };

    const summaryTitle = isSubmittedEnrollment ? "Enrollment Summary" : "Review Your Enrollment";
    const summaryNote = isSubmittedEnrollment
      ? "You have successfully submitted your enrollment information."
      : "Review the information below before submitting your enrollment.";

    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="space-y-6 bg-white/95 border border-slate-200 shadow-sm rounded-3xl p-6"
      >
        <div className="flex flex-col gap-2">
          <div className="inline-flex items-center gap-3 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-900">
            <Eye className="w-4 h-4" />
            {summaryTitle}
          </div>
          <p className="text-gray-600">{summaryNote}</p>
        </div>

        <div className="grid gap-6">
          <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-full bg-blue-900 p-3 text-white">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                <p className="text-sm text-gray-600">Submitted student details</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-700">
              <div><span className="text-gray-500">Admission Type:</span> <span className="font-medium">{summaryData.admissionType}</span></div>
              <div><span className="text-gray-500">LRN:</span> <span className="font-medium">{summaryData.lrn}</span></div>
              <div><span className="text-gray-500">Name:</span> <span className="font-medium">{nameDisplay}</span></div>
              <div><span className="text-gray-500">Sex:</span> <span className="font-medium">{summaryData.sex}</span></div>
              <div><span className="text-gray-500">Civil Status:</span> <span className="font-medium">{summaryData.civilStatus}</span></div>
              <div><span className="text-gray-500">Birthday:</span> <span className="font-medium">{summaryData.birthday}</span></div>
              <div><span className="text-gray-500">Religion:</span> <span className="font-medium">{summaryData.religion}</span></div>
              <div><span className="text-gray-500">Nationality:</span> <span className="font-medium">{summaryData.nationality}</span></div>
              <div><span className="text-gray-500">Disability:</span> <span className="font-medium">{summaryData.disability}</span></div>
              <div><span className="text-gray-500">Indigenous Group:</span> <span className="font-medium">{summaryData.indigenousGroup}</span></div>
              <div><span className="text-gray-500">Email:</span> <span className="font-medium">{summaryData.email}</span></div>
              <div><span className="text-gray-500">Contact Number:</span> <span className="font-medium">{summaryData.contactNumber}</span></div>
              <div><span className="text-gray-500">Facebook / Messenger Name:</span> <span className="font-medium">{summaryData.facebookName}</span></div>
              <div><span className="text-gray-500">Working Student:</span> <span className="font-medium">{summaryData.isWorkingStudent ? "Yes" : "No"}</span></div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-full bg-blue-900 p-3 text-white">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Address</h3>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-700">
              <div><span className="text-gray-500">Region:</span> <span className="font-medium">{summaryData.region}</span></div>
              <div><span className="text-gray-500">Province:</span> <span className="font-medium">{summaryData.province}</span></div>
              <div><span className="text-gray-500">City / Municipality:</span> <span className="font-medium">{summaryData.city}</span></div>
              <div><span className="text-gray-500">Barangay:</span> <span className="font-medium">{summaryData.barangay}</span></div>
              <div className="sm:col-span-2"><span className="text-gray-500">Home Address:</span> <span className="font-medium">{summaryData.homeAddress}</span></div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-full bg-blue-900 p-3 text-white">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Parents & Guardians</h3>
              </div>
            </div>
            <div className="space-y-6 text-sm text-slate-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><span className="text-gray-500">Father's Name:</span> <span className="font-medium">{summaryData.fatherLastName}, {summaryData.fatherFirstName} {summaryData.fatherMiddleName}</span></div>
                <div><span className="text-gray-500">Occupation:</span> <span className="font-medium">{summaryData.fatherOccupation}</span></div>
                <div><span className="text-gray-500">Contact Number:</span> <span className="font-medium">{summaryData.fatherContact}</span></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><span className="text-gray-500">Mother's Maiden Name:</span> <span className="font-medium">{summaryData.motherMaidenName}</span></div>
                <div><span className="text-gray-500">Mother's Name:</span> <span className="font-medium">{summaryData.motherLastName}, {summaryData.motherFirstName} {summaryData.motherMiddleName}</span></div>
                <div><span className="text-gray-500">Occupation:</span> <span className="font-medium">{summaryData.motherOccupation}</span></div>
                <div><span className="text-gray-500">Contact Number:</span> <span className="font-medium">{summaryData.motherContact}</span></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><span className="text-gray-500">Guardian Relationship:</span> <span className="font-medium">{guardianRelationship}</span></div>
                <div><span className="text-gray-500">Guardian Name:</span> <span className="font-medium">{summaryData.guardianLastName}, {summaryData.guardianFirstName} {summaryData.guardianMiddleName}</span></div>
                <div><span className="text-gray-500">Occupation:</span> <span className="font-medium">{summaryData.guardianOccupation}</span></div>
                <div><span className="text-gray-500">Contact Number:</span> <span className="font-medium">{summaryData.guardianContact}</span></div>
              </div>

              <div><span className="text-gray-500">4Ps Member:</span> <span className="font-medium">{summaryData.is4PsMember ? "Yes" : "No"}</span></div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-full bg-blue-900 p-3 text-white">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Enrollment Details</h3>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-700">
              <div><span className="text-gray-500">Preferred Track:</span> <span className="font-medium">{summaryData.preferredTrack}</span></div>
              <div><span className="text-gray-500">Year Level:</span> <span className="font-medium">{summaryData.yearLevel}</span></div>
              <div><span className="text-gray-500">Elective 1:</span> <span className="font-medium">{summaryData.elective1}</span></div>
              <div><span className="text-gray-500">Elective 2:</span> <span className="font-medium">{summaryData.elective2}</span></div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-full bg-blue-900 p-3 text-white">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Educational Background</h3>
              </div>
            </div>
            <div className="space-y-4 text-sm text-slate-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><span className="text-gray-500">Primary School:</span> <span className="font-medium">{summaryData.primarySchool}</span></div>
                <div><span className="text-gray-500">Year Graduated:</span> <span className="font-medium">{summaryData.primaryYearGraduated}</span></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><span className="text-gray-500">Secondary School:</span> <span className="font-medium">{summaryData.secondarySchool}</span></div>
                <div><span className="text-gray-500">Year Graduated:</span> <span className="font-medium">{summaryData.secondaryYearGraduated}</span></div>
              </div>
              <div><span className="text-gray-500">Grade 10 Adviser:</span> <span className="font-medium">{summaryData.grade10Adviser}</span></div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-full bg-blue-900 p-3 text-white">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Documents Summary</h3>
              </div>
            </div>
            <div className="grid gap-3 text-sm text-slate-700">
              {[
                { key: "form138", label: "Form 138 (Report Card)" },
                { key: "form137", label: "Form 137" },
                { key: "goodMoral", label: "Certificate of Good Moral" },
                { key: "birthCertificate", label: "Birth Certificate" },
                { key: "idPicture", label: "ID Picture" },
                { key: "diploma", label: "Grade 10 Diploma" },
                { key: "escCertificate", label: "ESC Certificate" },
              ].map((doc) => (
                <div key={doc.key} className="flex items-center gap-2">
                  {hasDocument(doc.key) ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  ) : (
                    <X className="w-4 h-4 text-gray-400" />
                  )}
                  <span className={hasDocument(doc.key) ? "text-slate-700" : "text-gray-400"}>{doc.label}</span>
                </div>
              ))}
            </div>
          </section>
          {!isSubmittedEnrollment && (
            <div className="rounded-3xl border border-slate-200 bg-blue-50 p-4 text-sm text-slate-700">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={certificationChecked}
                  onChange={(e) => setCertificationChecked(e.target.checked)}
                  className="mt-1 h-4 w-4 text-blue-600"
                />
                <span>
                  I certify that all information provided is true and correct. I understand that submitting false information
                  may result in enrollment delays or denial.
                </span>
              </label>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  if (isLoading) {
    return (
      <div className="portal-dashboard-page flex min-h-screen w-full items-center justify-center p-4 sm:p-6 lg:p-8">
        <LoadingState
          message="Preparing enrollment information..."
          subtext="Checking enrollment status, saved drafts, and assessment recommendations."
          compact
        />
      </div>
    );
  }

  if (!isEnrollmentOpen && !isSubmittedEnrollment) {
    return (
      <div className="portal-dashboard-page flex min-h-screen w-full items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-xl">
          <div className="rounded-[1.5rem] border border-red-200 bg-red-50 p-6 text-center shadow-sm sm:p-8">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-200 bg-white text-red-600 shadow-sm">
              <AlertCircle className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-bold leading-tight text-slate-950 sm:text-4xl">
              Enrollment is currently closed
            </h1>
            <p className="mx-auto mt-4 max-w-lg text-base leading-7 text-slate-700">
              The enrollment window is not open at this time. Please check back later or contact the registrar for updates.
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-100"
              >
                <ArrowLeft className="h-4 w-4" />
                Go Back
              </button>
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[var(--electron-blue)] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_34px_-22px_rgba(30,58,138,0.85)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-200"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="portal-dashboard-page flex flex-col gap-6 p-4 sm:p-6 lg:p-8 w-full min-h-screen bg-transparent">
      <div className="w-full max-w-4xl mx-auto">
        {/* Loading State - Prevent form flicker */}
        {isInitializing && (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ backgroundColor: "var(--electron-blue)", opacity: 0.2 }}>
                <div className="w-8 h-8 rounded-full border-4 border-gray-300 border-t-blue-600 animate-spin" style={{ borderTopColor: "var(--electron-blue)" }}></div>
              </div>
              <p className="text-gray-600 font-medium">Loading your enrollment information...</p>
            </div>
          </div>
        )}

        {!isInitializing && (
          <>
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold" style={{ color: "var(--electron-blue)" }}>
            <FileText className="h-4 w-4" />
            Student Enrollment System
          </div>
          <h1 className="text-4xl font-bold mb-2" style={{ color: "var(--electron-blue)" }}>
            {isSubmittedEnrollment ? "Enrollment Summary" : currentPage === 7 ? "Enrollment Review" : "Enrollment Form"}
          </h1>
          <p className="text-gray-600 text-lg">
            {isSubmittedEnrollment
              ? "You have successfully submitted your enrollment information."
              : currentPage === 7
              ? "Review your enrollment details below, then submit when you are ready."
              : "Please complete all required fields to proceed with your enrollment."}
          </p>
        </div>

        {isSubmittedEnrollment && (
          <div className="mb-6 rounded-3xl border border-blue-200 bg-blue-50 p-6 text-sm text-slate-900 shadow-sm">
            <div className="mb-4">
              <p className="font-semibold">Your enrollment information has been submitted.</p>
              <p className="mt-2 text-sm text-slate-700">
                Submitted information can no longer be edited. Please contact the administrator for any changes.
              </p>
            </div>
            <button
              onClick={() => navigate("/contact")}
              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-3 text-white font-semibold hover:bg-blue-700 transition-colors"
            >
              Go to Contact Page
            </button>
          </div>
        )}

        {!isSubmittedEnrollment && renderPageIndicator()}

        {/* Form Content */}
        <div className="mb-6">
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
                className="w-full sm:w-auto px-6 py-3 bg-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-400 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                <ArrowLeft className="w-5 h-5" />
                Previous
              </button>
            )}
            <button
              onClick={handleNext}
              className="w-full sm:w-auto sm:ml-auto px-6 py-3 text-white font-bold rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
              style={{ backgroundColor: "var(--electron-blue)" }}
            >
              Next
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
        {currentPage === 7 && !isSubmittedEnrollment && (
          <>
            {isSubmitting && (
              <div className="rounded-3xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 mb-4">
                Submitting your enrollment information. Please wait while we process your submission...
              </div>
            )}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
              <button
                onClick={handlePrevious}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-3 bg-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-400 transition-all flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ArrowLeft className="w-5 h-5" />
                Previous
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full sm:w-auto sm:ml-auto px-6 py-3 text-white font-bold rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
                style={{ backgroundColor: "var(--electron-blue)" }}
              >
                {isSubmitting ? "Submitting..." : "Submit Enrollment"}
              </button>
            </div>
          </>
        )}
          </>
        )}
      </div>

    </div>
  );
}
