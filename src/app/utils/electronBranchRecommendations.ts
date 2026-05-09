export interface ElectronBranch {
  id: string;
  name: string;
  address: string;
  contact: string;
  description: string;
  facebookUrl: string;
  websiteUrl?: string;
  programs: string[];
  categories: string[];
  sourceLabel: string;
}

export interface BranchRecommendation extends ElectronBranch {
  matchScore: number;
  matchedCategories: string[];
  matchedPrograms: string[];
  isBestMatch: boolean;
}

const OFFICIAL_FACEBOOK_URL = "https://www.facebook.com/ElectronCollegeOFFICIAL/";
const OFFICIAL_WEBSITE_URL = "https://electroncollege.edu.ph/";

export const ELECTRON_BRANCHES: ElectronBranch[] = [
  {
    id: "novaliches-main",
    name: "Electron College of Technical Education - Main Branch",
    address: "Electron Tech. Bldg., 664 Quirino Highway, Bagbag, Novaliches, Quezon City, Metro Manila",
    contact: "0917 137 9827",
    websiteUrl: OFFICIAL_WEBSITE_URL,
    facebookUrl: OFFICIAL_FACEBOOK_URL,
    sourceLabel: "Official website and programs page",
    description: "Main campus for college and technical-vocational programs.",
    programs: [
      "Bachelor of Science in Criminology",
      "Bachelor of Science in Information System",
      "Bachelor of Science in Tourism Management",
      "Bachelor of Technical Teacher Education",
      "Food Service Management",
      "Automotive Technology",
      "Electrical Technology",
      "Electronics Technology",
      "Garments, Fashion and Design",
      "Welding and Fabrication Technology",
      "Drafting Technology",
      "Air-Conditioning and Refrigeration Technology",
      "SMAW NC II",
      "Cookery NC II",
      "Bread and Pastry NC II",
      "Events Management NC II",
      "Tourism Promotion Services NC II",
    ],
    categories: [
      "criminology",
      "ict",
      "tourism",
      "hospitality",
      "education",
      "automotive",
      "electrical",
      "electronics",
      "technical",
      "industrial",
      "home-economics",
      "arts-design",
    ],
  },
  {
    id: "gen-t-valenzuela",
    name: "Electron College of Technical Education - Gen. T. Valenzuela Campus",
    address: "108 Gen. T. de Leon St., Valenzuela City, Metro Manila",
    contact: "+63 923 088 9152",
    websiteUrl: OFFICIAL_WEBSITE_URL,
    facebookUrl: OFFICIAL_FACEBOOK_URL,
    sourceLabel: "Official programs page and branch listing references",
    description: "Valenzuela campus for focused skills training.",
    programs: [
      "Cookery NC II",
      "Bread and Pastry NC II",
      "JAVA Programming NC III",
      "Bookkeeping NC II",
      "Trainers Methodology Level I",
      "Technical-vocational programs",
    ],
    categories: ["ict", "programming", "hospitality", "food-service", "business", "technical", "home-economics"],
  },
  {
    id: "malanday-valenzuela",
    name: "Electron College of Technical Education - Malanday Valenzuela Campus",
    address: "Malanday, Valenzuela City, Metro Manila",
    contact: "0962 350 2019",
    websiteUrl: OFFICIAL_WEBSITE_URL,
    facebookUrl: OFFICIAL_FACEBOOK_URL,
    sourceLabel: "Official programs page",
    description: "Skills training campus for hands-on technical pathways.",
    programs: [
      "Contact Center Services NC II",
      "Electrical Installation and Maintenance NC II",
      "Technical-vocational programs",
    ],
    categories: ["ict", "contact-center", "electrical", "technical", "industrial"],
  },
  {
    id: "e-rodriguez-qc",
    name: "Electron College of Technical Education - E. Rodriguez Campus",
    address: "128 E. Rodriguez Sr. Ave., Quezon City, Metro Manila",
    contact: "+63 951 183 8743",
    websiteUrl: OFFICIAL_WEBSITE_URL,
    facebookUrl: OFFICIAL_FACEBOOK_URL,
    sourceLabel: "Public branch directory references",
    description: "Quezon City campus for college and technical programs.",
    programs: [
      "Bachelor of Science in Information System",
      "Bachelor of Science in Tourism Management",
      "Bachelor of Science in Criminology",
      "Technical-vocational programs",
      "Computer and electronics-related programs",
    ],
    categories: ["ict", "tourism", "criminology", "electronics", "technical"],
  },
  {
    id: "caloocan",
    name: "Electron College of Technical Education - Caloocan Campus",
    address: "10th Ave., Grace Park East, Caloocan City, Metro Manila",
    contact: "+63 923 088 9152",
    websiteUrl: OFFICIAL_WEBSITE_URL,
    facebookUrl: OFFICIAL_FACEBOOK_URL,
    sourceLabel: "CourseFinder PH",
    description: "Caloocan campus for college and TESDA pathways.",
    programs: [
      "Bachelor of Science in Tourism Management",
      "Bachelor of Science in Criminology",
      "Bachelor of Science in Information System",
      "Bachelor in Technical Teacher Education",
      "3D Animation NC III",
      "Computer Systems Servicing NC II",
      "Dressmaking NC II",
      "Hairdressing NC II",
      "Massage Therapy NC II",
      "RAC Servicing NC II",
    ],
    categories: [
      "ict",
      "animation",
      "tourism",
      "criminology",
      "education",
      "home-economics",
      "arts-design",
      "technical",
    ],
  },
];

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  ict: [
    "ict",
    "information",
    "computer",
    "programming",
    "software",
    "technology",
    "systems",
    "animation",
    "technical drafting",
    "contact center",
    "visual graphics",
    "media arts",
  ],
  programming: ["programming", "software", "java", "web", "developer"],
  animation: ["animation", "3d", "media arts", "visual arts", "multimedia"],
  tourism: ["tourism", "travel", "tour", "front office", "events"],
  hospitality: ["hospitality", "cookery", "culinary", "food", "bread", "pastry", "restaurant", "housekeeping"],
  "food-service": ["food", "cookery", "culinary", "bread", "pastry", "restaurant"],
  criminology: ["criminology", "law", "public safety", "security"],
  automotive: ["automotive", "mechanical", "engine", "motorcycle"],
  electrical: ["electrical", "electricity", "installation", "power"],
  electronics: ["electronics", "electronic", "computer technology"],
  industrial: ["industrial", "welding", "smaw", "drafting", "refrigeration", "air-conditioning", "automotive"],
  technical: ["technical", "vocational", "techvoc", "tvl", "tesda", "skills"],
  education: ["education", "teacher", "teaching", "trainer", "methodology"],
  business: ["business", "bookkeeping", "accountancy", "abm", "entrepreneurship", "management"],
  "home-economics": ["home economics", "dressmaking", "hairdressing", "beauty", "caregiving", "wellness"],
  "arts-design": ["arts", "design", "garments", "fashion", "illustration", "visual"],
  "contact-center": ["contact center", "communication", "english proficiency"],
};

function getAssessmentCategories(values: string[]) {
  const haystack = values.join(" ").toLowerCase();
  const categories = Object.entries(CATEGORY_KEYWORDS)
    .filter(([, keywords]) => keywords.some((keyword) => haystack.includes(keyword)))
    .map(([category]) => category);

  return Array.from(new Set(categories));
}

function programMatchesCategories(program: string, categories: string[]) {
  const normalizedProgram = program.toLowerCase();

  return categories.some((category) => {
    const keywords = CATEGORY_KEYWORDS[category] || [category];
    return keywords.some((keyword) => normalizedProgram.includes(keyword));
  });
}

const COURSE_PROGRAM_KEYWORDS: Record<string, string[]> = {
  "information technology": ["information system", "computer systems", "programming", "java"],
  "computer science": ["information system", "computer systems", "programming", "java"],
  "software engineering": ["information system", "programming", "java"],
  "computer engineering": ["computer systems", "electronics", "electrical", "information system"],
  tourism: ["tourism management", "tourism promotion", "events management"],
  "hospitality management": ["food service", "cookery", "bread", "pastry"],
  "culinary arts": ["food service", "cookery", "bread", "pastry"],
  "baking & pastry": ["bread", "pastry"],
  "automotive technology": ["automotive technology"],
  "mechanical engineering": ["automotive technology", "welding", "fabrication"],
  "electrical engineering": ["electrical technology", "electrical installation"],
  "electronics engineering": ["electronics technology", "electronics"],
  education: ["teacher education", "technical teacher", "trainers methodology"],
  "physical education": ["teacher education", "technical teacher", "trainers methodology"],
  criminology: ["criminology"],
  "business administration": ["bookkeeping"],
  marketing: ["bookkeeping"],
  management: ["bookkeeping", "food service", "events management"],
  "multimedia arts": ["3d animation", "garments", "fashion", "design"],
  film: ["3d animation", "visual", "media"],
  "graphic design": ["3d animation", "garments", "fashion", "design"],
};

function normalizeCourseName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function programMatchesSuggestedCourse(program: string, course: string) {
  const normalizedProgram = normalizeCourseName(program);
  const normalizedCourse = normalizeCourseName(course);
  const keywords = COURSE_PROGRAM_KEYWORDS[normalizedCourse] || [normalizedCourse];

  return keywords.some((keyword) => {
    const normalizedKeyword = normalizeCourseName(keyword);
    return normalizedProgram.includes(normalizedKeyword) || normalizedKeyword.includes(normalizedProgram);
  });
}

export function getRecommendedElectronBranches({
  track,
  electives,
  suggestedCourses,
  careerPathways,
  topDomains,
  topInterests,
}: {
  track: string;
  electives: string[];
  suggestedCourses: string[];
  careerPathways: Array<{ course?: string; category?: string; careers: string[] }>;
  topDomains: string[];
  topInterests: string[];
}): BranchRecommendation[] {
  const hasSuggestedCourseFilter = suggestedCourses.length > 0;
  const assessmentCategories = getAssessmentCategories([
    track,
    ...electives,
    ...suggestedCourses,
    ...careerPathways.flatMap((pathway) => [pathway.category || pathway.course || "", ...pathway.careers]),
    ...topDomains,
    ...topInterests,
  ]);

  const fallbackCategories = track === "Technical-Professional" ? ["technical"] : ["education", "business", "ict"];
  const activeCategories = assessmentCategories.length > 0 ? assessmentCategories : fallbackCategories;

  const recommendations = ELECTRON_BRANCHES.map((branch) => {
    const matchedCategories = branch.categories.filter((category) => activeCategories.includes(category));
    const courseMatchedPrograms = branch.programs.filter((program) =>
      suggestedCourses.some((course) => programMatchesSuggestedCourse(program, course))
    );
    const categoryMatchedPrograms = branch.programs.filter((program) => programMatchesCategories(program, activeCategories));
    const matchedPrograms = hasSuggestedCourseFilter ? courseMatchedPrograms : categoryMatchedPrograms;
    const matchScore = matchedPrograms.length * 4 + matchedCategories.length;

    return {
      ...branch,
      matchScore,
      matchedCategories,
      matchedPrograms,
      isBestMatch: false,
    };
  })
    .filter((branch) => (hasSuggestedCourseFilter ? branch.matchedPrograms.length > 0 : branch.matchScore > 0))
    .sort((left, right) => right.matchScore - left.matchScore);

  if (recommendations.length > 0) {
    recommendations[0] = {
      ...recommendations[0],
      isBestMatch: true,
    };
  }

  return recommendations.slice(0, 4);
}
