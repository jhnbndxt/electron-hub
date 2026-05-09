console.log(
  "ENV:",
  process.env.GROQ_API_KEY ? "GROQ_API_KEY is set" : "GROQ_API_KEY is missing"
);

const jsonHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function sendJson(response, status, payload) {
  Object.entries(jsonHeaders).forEach(([key, value]) => {
    response.setHeader(key, value);
  });

  return response.status(status).json(payload);
}

function parseAiJson(text = "") {
  const cleanedText = String(text)
    .trim()
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(cleanedText);
  } catch {
    return {
      raw: cleanedText,
    };
  }
}

const electives = [
  {
    name: "Biology 1",
    track: "Academic",
    group: "STEM",
    idealFor: ["academic interest", "science aptitude", "healthcare interest", "research"],
    strengths: ["life science", "observation", "scientific reasoning"],
    relatedCourses: ["BS Biology", "BS Nursing", "BS Medical Technology"],
    careerPathways: ["Biologist", "Nurse", "Medical Technologist"],
  },
  {
    name: "Biology 2",
    track: "Academic",
    group: "STEM",
    idealFor: ["academic interest", "science aptitude", "healthcare interest", "research"],
    strengths: ["advanced biology", "laboratory thinking", "scientific analysis"],
    relatedCourses: ["BS Biology", "BS Nursing", "BS Pharmacy"],
    careerPathways: ["Research Assistant", "Healthcare Professional", "Pharmacist"],
  },
  {
    name: "Chemistry 1",
    track: "Academic",
    group: "STEM",
    idealFor: ["academic interest", "mathematics", "science aptitude", "laboratory work"],
    strengths: ["chemical analysis", "precision", "problem solving"],
    relatedCourses: ["BS Chemistry", "BS Chemical Engineering", "BS Pharmacy"],
    careerPathways: ["Chemist", "Chemical Engineer", "Pharmacist"],
  },
  {
    name: "Chemistry 2",
    track: "Academic",
    group: "STEM",
    idealFor: ["academic interest", "mathematics", "science aptitude", "laboratory work"],
    strengths: ["advanced chemistry", "analytical thinking", "laboratory procedures"],
    relatedCourses: ["BS Chemistry", "BS Chemical Engineering", "BS Medical Technology"],
    careerPathways: ["Laboratory Analyst", "Chemical Engineer", "Medical Technologist"],
  },
  {
    name: "Physics 1",
    track: "Academic",
    group: "STEM",
    idealFor: ["mathematics", "logical reasoning", "spatial aptitude", "engineering interest"],
    strengths: ["mechanics", "quantitative reasoning", "scientific modeling"],
    relatedCourses: ["BS Physics", "BS Civil Engineering", "BS Mechanical Engineering"],
    careerPathways: ["Engineer", "Physicist", "Researcher"],
  },
  {
    name: "Physics 2",
    track: "Academic",
    group: "STEM",
    idealFor: ["mathematics", "logical reasoning", "spatial aptitude", "engineering interest"],
    strengths: ["advanced physics", "systems thinking", "technical analysis"],
    relatedCourses: ["BS Electrical Engineering", "BS Mechanical Engineering", "BS Physics"],
    careerPathways: ["Electrical Engineer", "Mechanical Engineer", "Researcher"],
  },
  {
    name: "Earth and Space Science 1",
    track: "Academic",
    group: "STEM",
    idealFor: ["science aptitude", "environmental interest", "spatial reasoning", "research"],
    strengths: ["earth systems", "observation", "scientific inquiry"],
    relatedCourses: ["BS Geology", "BS Environmental Science", "BS Geography"],
    careerPathways: ["Environmental Specialist", "Geologist", "Science Educator"],
  },
  {
    name: "Earth and Space Science 2",
    track: "Academic",
    group: "STEM",
    idealFor: ["science aptitude", "spatial reasoning", "astronomy interest", "environmental interest"],
    strengths: ["space science", "systems analysis", "scientific interpretation"],
    relatedCourses: ["BS Astronomy", "BS Environmental Science", "BS Geology"],
    careerPathways: ["Science Researcher", "Environmental Analyst", "Science Educator"],
  },
  {
    name: "Pre-Calculus 1",
    track: "Academic",
    group: "STEM",
    idealFor: ["high mathematical ability", "logical reasoning", "engineering interest"],
    strengths: ["functions", "algebra", "quantitative analysis"],
    relatedCourses: ["BS Mathematics", "BS Engineering", "BS Computer Science"],
    careerPathways: ["Engineer", "Data Analyst", "Mathematician"],
  },
  {
    name: "Pre-Calculus 2",
    track: "Academic",
    group: "STEM",
    idealFor: ["high mathematical ability", "logical reasoning", "technical interest"],
    strengths: ["advanced functions", "mathematical modeling", "problem solving"],
    relatedCourses: ["BS Mathematics", "BS Engineering", "BS Statistics"],
    careerPathways: ["Engineer", "Statistician", "Data Analyst"],
  },
  {
    name: "Trigonometry 1",
    track: "Academic",
    group: "STEM",
    idealFor: ["mathematics", "spatial aptitude", "engineering interest"],
    strengths: ["angle measurement", "spatial reasoning", "technical calculation"],
    relatedCourses: ["BS Civil Engineering", "BS Architecture", "BS Mechanical Engineering"],
    careerPathways: ["Engineer", "Architect", "Surveyor"],
  },
  {
    name: "Trigonometry 2",
    track: "Academic",
    group: "STEM",
    idealFor: ["mathematics", "spatial aptitude", "technical drawing"],
    strengths: ["advanced trigonometry", "measurement", "design calculation"],
    relatedCourses: ["BS Engineering", "BS Architecture", "BS Mathematics"],
    careerPathways: ["Engineer", "Architect", "Technical Designer"],
  },
  {
    name: "Finite Mathematics 1",
    track: "Academic",
    group: "STEM",
    idealFor: ["mathematics", "business interest", "logical reasoning"],
    strengths: ["discrete math", "decision analysis", "quantitative reasoning"],
    relatedCourses: ["BS Mathematics", "BS Statistics", "BS Business Analytics"],
    careerPathways: ["Data Analyst", "Business Analyst", "Statistician"],
  },
  {
    name: "Finite Mathematics 2",
    track: "Academic",
    group: "STEM",
    idealFor: ["mathematics", "logical reasoning", "data interest"],
    strengths: ["advanced decision math", "modeling", "statistical thinking"],
    relatedCourses: ["BS Statistics", "BS Data Science", "BS Business Analytics"],
    careerPathways: ["Data Analyst", "Statistician", "Operations Analyst"],
  },
  {
    name: "Research Methods",
    track: "Academic",
    group: "STEM",
    idealFor: ["academic interest", "logical reasoning", "communication", "investigation"],
    strengths: ["research design", "evidence evaluation", "academic writing"],
    relatedCourses: ["BS Psychology", "BS Education", "BS Biology"],
    careerPathways: ["Researcher", "Teacher", "Policy Analyst"],
  },
  {
    name: "Design and Innovation",
    track: "Academic",
    group: "STEM",
    idealFor: ["creative interest", "technical interest", "problem solving", "innovation"],
    strengths: ["design thinking", "prototyping", "creative problem solving"],
    relatedCourses: ["BS Industrial Design", "BS Engineering", "BS Information Technology"],
    careerPathways: ["Product Designer", "Engineer", "Innovation Specialist"],
  },
  {
    name: "Empowerment Technologies",
    track: "Academic",
    group: "STEM",
    idealFor: ["technical interest", "digital literacy", "communication", "creative interest"],
    strengths: ["digital tools", "online collaboration", "technology application"],
    relatedCourses: ["BS Information Technology", "BS Computer Science", "BS Multimedia Arts"],
    careerPathways: ["IT Specialist", "Digital Content Creator", "Systems Support Staff"],
  },
  {
    name: "Basic Accounting",
    track: "Academic",
    group: "Business and Entrepreneurship",
    idealFor: ["mathematics", "business interest", "detail orientation"],
    strengths: ["financial records", "accuracy", "numerical reasoning"],
    relatedCourses: ["BS Accountancy", "BS Management Accounting", "BS Business Administration"],
    careerPathways: ["Accountant", "Bookkeeper", "Financial Analyst"],
  },
  {
    name: "Business Economics",
    track: "Academic",
    group: "Business and Entrepreneurship",
    idealFor: ["business interest", "mathematics", "logical reasoning", "leadership"],
    strengths: ["market analysis", "decision making", "economic reasoning"],
    relatedCourses: ["BS Economics", "BS Business Administration", "BS Entrepreneurship"],
    careerPathways: ["Economist", "Business Analyst", "Entrepreneur"],
  },
  {
    name: "Business Finance and Taxation",
    track: "Academic",
    group: "Business and Entrepreneurship",
    idealFor: ["mathematics", "business interest", "financial planning"],
    strengths: ["finance", "tax awareness", "analytical thinking"],
    relatedCourses: ["BS Financial Management", "BS Accountancy", "BS Business Administration"],
    careerPathways: ["Financial Analyst", "Tax Associate", "Business Manager"],
  },
  {
    name: "Contemporary Marketing",
    track: "Academic",
    group: "Business and Entrepreneurship",
    idealFor: ["communication interest", "creative interest", "business interest"],
    strengths: ["marketing strategy", "consumer insight", "persuasion"],
    relatedCourses: ["BS Marketing Management", "BS Entrepreneurship", "BA Communication"],
    careerPathways: ["Marketing Specialist", "Brand Strategist", "Digital Marketer"],
  },
  {
    name: "Entrepreneurship",
    track: "Academic",
    group: "Business and Entrepreneurship",
    idealFor: ["leadership interest", "business interest", "creative problem solving"],
    strengths: ["business planning", "initiative", "opportunity recognition"],
    relatedCourses: ["BS Entrepreneurship", "BS Business Administration", "BS Marketing Management"],
    careerPathways: ["Entrepreneur", "Business Owner", "Operations Manager"],
  },
  {
    name: "Introduction to Organization and Management",
    track: "Academic",
    group: "Business and Entrepreneurship",
    idealFor: ["leadership interest", "communication", "business interest"],
    strengths: ["team coordination", "planning", "management principles"],
    relatedCourses: ["BS Business Administration", "BS Management", "BS Human Resource Management"],
    careerPathways: ["Manager", "HR Officer", "Project Coordinator"],
  },
  {
    name: "Creative Writing",
    track: "Academic",
    group: "Arts, Social Sciences, and Humanities",
    idealFor: ["creative interest", "verbal ability", "communication interest"],
    strengths: ["storytelling", "writing", "expression"],
    relatedCourses: ["BA Creative Writing", "BA Communication", "BA Journalism"],
    careerPathways: ["Writer", "Content Creator", "Editor"],
  },
  {
    name: "Philippine Politics and Governance",
    track: "Academic",
    group: "Arts, Social Sciences, and Humanities",
    idealFor: ["social interest", "leadership interest", "communication", "civic awareness"],
    strengths: ["governance", "critical thinking", "public service"],
    relatedCourses: ["BA Political Science", "BS Public Administration", "BA Legal Management"],
    careerPathways: ["Public Servant", "Policy Analyst", "Legal Assistant"],
  },
  {
    name: "Disciplines and Ideas in the Social Sciences",
    track: "Academic",
    group: "Arts, Social Sciences, and Humanities",
    idealFor: ["social interest", "verbal ability", "academic interest"],
    strengths: ["social analysis", "human behavior", "critical inquiry"],
    relatedCourses: ["BA Sociology", "BS Psychology", "BS Social Work"],
    careerPathways: ["Social Researcher", "Guidance Associate", "Community Worker"],
  },
  {
    name: "Disciplines and Ideas in the Applied Social Sciences",
    track: "Academic",
    group: "Arts, Social Sciences, and Humanities",
    idealFor: ["social interest", "communication", "helping communities"],
    strengths: ["counseling awareness", "community work", "communication"],
    relatedCourses: ["BS Social Work", "BS Psychology", "BA Communication"],
    careerPathways: ["Social Worker", "Counselor", "Community Organizer"],
  },
  {
    name: "Introduction to World Religions and Belief Systems",
    track: "Academic",
    group: "Arts, Social Sciences, and Humanities",
    idealFor: ["academic interest", "social interest", "cultural awareness"],
    strengths: ["cultural literacy", "ethical reasoning", "respectful communication"],
    relatedCourses: ["BA Philosophy", "BA Religious Studies", "BA Education"],
    careerPathways: ["Teacher", "Cultural Researcher", "Community Worker"],
  },
  {
    name: "Trends, Networks, and Critical Thinking",
    track: "Academic",
    group: "Arts, Social Sciences, and Humanities",
    idealFor: ["logical reasoning", "communication", "social analysis"],
    strengths: ["critical thinking", "trend analysis", "systems awareness"],
    relatedCourses: ["BA Communication", "BS Psychology", "BS Information Systems"],
    careerPathways: ["Analyst", "Communications Specialist", "Research Assistant"],
  },
  {
    name: "Community Engagement",
    track: "Academic",
    group: "Arts, Social Sciences, and Humanities",
    idealFor: ["social interest", "leadership interest", "service orientation"],
    strengths: ["community work", "collaboration", "project planning"],
    relatedCourses: ["BS Social Work", "BS Public Administration", "BA Development Studies"],
    careerPathways: ["Community Organizer", "Public Servant", "Program Coordinator"],
  },
  {
    name: "Human Movement 1: Basic Anatomy in Sports and Exercise",
    track: "Academic",
    group: "Sports, Health, and Wellness",
    idealFor: ["physical interest", "science aptitude", "health interest"],
    strengths: ["anatomy", "movement analysis", "health awareness"],
    relatedCourses: ["BS Physical Education", "BS Sports Science", "BS Exercise Science"],
    careerPathways: ["Fitness Coach", "Sports Trainer", "PE Teacher"],
  },
  {
    name: "Human Movement 2: Motor Skills Development",
    track: "Academic",
    group: "Sports, Health, and Wellness",
    idealFor: ["physical interest", "coaching interest", "spatial aptitude"],
    strengths: ["motor skills", "movement training", "performance improvement"],
    relatedCourses: ["BS Physical Education", "BS Sports Science", "BS Rehabilitation Science"],
    careerPathways: ["Sports Coach", "Trainer", "Movement Specialist"],
  },
  {
    name: "Physical Education 1: Fitness and Recreation",
    track: "Academic",
    group: "Sports, Health, and Wellness",
    idealFor: ["physical interest", "social interest", "wellness"],
    strengths: ["fitness planning", "recreation", "well-being"],
    relatedCourses: ["BS Physical Education", "BS Sports Management", "BS Exercise Science"],
    careerPathways: ["Fitness Instructor", "PE Teacher", "Recreation Coordinator"],
  },
  {
    name: "Physical Education 2: Sports and Dance",
    track: "Academic",
    group: "Sports, Health, and Wellness",
    idealFor: ["physical interest", "creative interest", "performance"],
    strengths: ["coordination", "sports participation", "dance performance"],
    relatedCourses: ["BS Physical Education", "BA Dance", "BS Sports Science"],
    careerPathways: ["PE Teacher", "Dance Instructor", "Sports Trainer"],
  },
  {
    name: "Sports Activity Management",
    track: "Academic",
    group: "Sports, Health, and Wellness",
    idealFor: ["leadership interest", "physical interest", "event organization"],
    strengths: ["sports events", "management", "coordination"],
    relatedCourses: ["BS Sports Management", "BS Physical Education", "BS Tourism Management"],
    careerPathways: ["Sports Manager", "Event Coordinator", "Athletic Director"],
  },
  {
    name: "Sports Coaching",
    track: "Academic",
    group: "Sports, Health, and Wellness",
    idealFor: ["leadership interest", "physical interest", "mentoring"],
    strengths: ["coaching", "motivation", "training design"],
    relatedCourses: ["BS Physical Education", "BS Sports Science", "BS Sports Management"],
    careerPathways: ["Sports Coach", "Fitness Trainer", "Athletic Trainer"],
  },
  {
    name: "Sports Officiating",
    track: "Academic",
    group: "Sports, Health, and Wellness",
    idealFor: ["logical reasoning", "physical interest", "fair decision making"],
    strengths: ["rules interpretation", "judgment", "sports administration"],
    relatedCourses: ["BS Physical Education", "BS Sports Management", "BS Sports Science"],
    careerPathways: ["Sports Official", "Referee", "Sports Administrator"],
  },
  {
    name: "Agricultural Crops Production",
    track: "Technical-Professional",
    group: "Agri-Fishery Business and Food Innovation",
    idealFor: ["practical interest", "outdoor work", "agriculture", "science aptitude"],
    strengths: ["crop care", "farm operations", "food production"],
    relatedCourses: ["BS Agriculture", "BS Agribusiness", "BS Agricultural Technology"],
    careerPathways: ["Farm Technician", "Crop Specialist", "Agribusiness Assistant"],
  },
  {
    name: "Agro-Entrepreneurship",
    track: "Technical-Professional",
    group: "Agri-Fishery Business and Food Innovation",
    idealFor: ["business interest", "outdoor work", "leadership", "practical tasks"],
    strengths: ["farm business", "entrepreneurship", "market planning"],
    relatedCourses: ["BS Agribusiness", "BS Entrepreneurship", "BS Agriculture"],
    careerPathways: ["Agri-Entrepreneur", "Farm Manager", "Agribusiness Coordinator"],
  },
  {
    name: "Aquaculture",
    track: "Technical-Professional",
    group: "Agri-Fishery Business and Food Innovation",
    idealFor: ["science aptitude", "outdoor work", "fishery", "practical tasks"],
    strengths: ["fish farming", "water systems", "production monitoring"],
    relatedCourses: ["BS Fisheries", "BS Marine Biology", "BS Aquaculture"],
    careerPathways: ["Aquaculture Technician", "Fishery Worker", "Hatchery Assistant"],
  },
  {
    name: "Fish Capture",
    track: "Technical-Professional",
    group: "Agri-Fishery Business and Food Innovation",
    idealFor: ["outdoor work", "practical tasks", "marine interest"],
    strengths: ["fishing operations", "equipment handling", "safety awareness"],
    relatedCourses: ["BS Fisheries", "BS Marine Transportation", "BS Marine Biology"],
    careerPathways: ["Fishery Technician", "Marine Worker", "Fishing Operations Assistant"],
  },
  {
    name: "Food Processing",
    track: "Technical-Professional",
    group: "Agri-Fishery Business and Food Innovation",
    idealFor: ["practical tasks", "food interest", "science aptitude", "entrepreneurship"],
    strengths: ["food safety", "processing methods", "quality control"],
    relatedCourses: ["BS Food Technology", "BS Nutrition and Dietetics", "BS Hospitality Management"],
    careerPathways: ["Food Processing Technician", "Quality Control Assistant", "Food Entrepreneur"],
  },
  {
    name: "Organic Agriculture Production",
    track: "Technical-Professional",
    group: "Agri-Fishery Business and Food Innovation",
    idealFor: ["outdoor work", "environmental interest", "practical tasks"],
    strengths: ["sustainable farming", "organic production", "soil care"],
    relatedCourses: ["BS Agriculture", "BS Environmental Science", "BS Agribusiness"],
    careerPathways: ["Organic Farm Technician", "Farm Manager", "Sustainability Assistant"],
  },
  {
    name: "Poultry Production",
    track: "Technical-Professional",
    group: "Agri-Fishery Business and Food Innovation",
    idealFor: ["practical tasks", "animal care", "agriculture"],
    strengths: ["poultry care", "farm operations", "production monitoring"],
    relatedCourses: ["BS Agriculture", "BS Animal Science", "BS Agribusiness"],
    careerPathways: ["Poultry Technician", "Farm Assistant", "Livestock Production Worker"],
  },
  {
    name: "Ruminants Production",
    track: "Technical-Professional",
    group: "Agri-Fishery Business and Food Innovation",
    idealFor: ["animal care", "outdoor work", "practical tasks"],
    strengths: ["livestock care", "feeding systems", "farm management"],
    relatedCourses: ["BS Animal Science", "BS Agriculture", "Doctor of Veterinary Medicine"],
    careerPathways: ["Livestock Technician", "Farm Assistant", "Animal Care Worker"],
  },
  {
    name: "Swine Production",
    track: "Technical-Professional",
    group: "Agri-Fishery Business and Food Innovation",
    idealFor: ["animal care", "practical tasks", "farm operations"],
    strengths: ["swine care", "production management", "biosecurity"],
    relatedCourses: ["BS Animal Science", "BS Agriculture", "BS Agribusiness"],
    careerPathways: ["Swine Production Technician", "Farm Assistant", "Livestock Worker"],
  },
  {
    name: "Aesthetic Services / Beauty Care",
    track: "Technical-Professional",
    group: "Aesthetic, Wellness, and Human Care",
    idealFor: ["creative interest", "social interest", "hands-on service"],
    strengths: ["beauty care", "client service", "aesthetic judgment"],
    relatedCourses: ["BS Cosmetology", "BS Entrepreneurship", "BS Hospitality Management"],
    careerPathways: ["Beauty Care Specialist", "Salon Assistant", "Aesthetic Entrepreneur"],
  },
  {
    name: "Hairdressing",
    track: "Technical-Professional",
    group: "Aesthetic, Wellness, and Human Care",
    idealFor: ["creative interest", "hands-on service", "social interest"],
    strengths: ["hair styling", "client care", "design sense"],
    relatedCourses: ["BS Cosmetology", "BS Entrepreneurship", "BS Hospitality Management"],
    careerPathways: ["Hairdresser", "Salon Stylist", "Salon Owner"],
  },
  {
    name: "Caregiving (Adult Care)",
    track: "Technical-Professional",
    group: "Aesthetic, Wellness, and Human Care",
    idealFor: ["social interest", "helping others", "healthcare interest"],
    strengths: ["patient care", "empathy", "health support"],
    relatedCourses: ["BS Nursing", "BS Caregiving", "BS Social Work"],
    careerPathways: ["Caregiver", "Nursing Assistant", "Health Aide"],
  },
  {
    name: "Caregiving (Child Care)",
    track: "Technical-Professional",
    group: "Aesthetic, Wellness, and Human Care",
    idealFor: ["social interest", "helping children", "communication"],
    strengths: ["child care", "patience", "developmental support"],
    relatedCourses: ["BS Early Childhood Education", "BS Nursing", "BS Psychology"],
    careerPathways: ["Child Care Worker", "Teaching Assistant", "Caregiver"],
  },
  {
    name: "Broadband Installation",
    track: "Technical-Professional",
    group: "ICT Support and Computer Programming Technologies",
    idealFor: ["technical interest", "hands-on work", "logical reasoning"],
    strengths: ["network setup", "cabling", "technical troubleshooting"],
    relatedCourses: ["BS Information Technology", "BS Electronics Engineering", "BS Computer Engineering"],
    careerPathways: ["Network Technician", "Broadband Installer", "Technical Support Specialist"],
  },
  {
    name: "Computer Programming (.NET Technology)",
    track: "Technical-Professional",
    group: "ICT Support and Computer Programming Technologies",
    idealFor: ["technical interest", "logical reasoning", "mathematics", "coding"],
    strengths: ["programming", "software development", "analytical thinking"],
    relatedCourses: ["BS Information Technology", "BS Computer Science", "BS Computer Engineering"],
    careerPathways: ["Software Developer", ".NET Developer", "Systems Developer"],
  },
  {
    name: "Computer Programming (Java)",
    track: "Technical-Professional",
    group: "ICT Support and Computer Programming Technologies",
    idealFor: ["technical interest", "logical reasoning", "mathematics", "coding"],
    strengths: ["object-oriented programming", "software development", "problem solving"],
    relatedCourses: ["BS Information Technology", "BS Computer Science", "BS Software Engineering"],
    careerPathways: ["Java Developer", "Software Engineer", "Mobile App Developer"],
  },
  {
    name: "Computer Programming (Oracle Database)",
    track: "Technical-Professional",
    group: "ICT Support and Computer Programming Technologies",
    idealFor: ["technical interest", "logical reasoning", "data management", "mathematics"],
    strengths: ["database systems", "data organization", "query logic"],
    relatedCourses: ["BS Information Systems", "BS Information Technology", "BS Computer Science"],
    careerPathways: ["Database Administrator", "Data Analyst", "Backend Developer"],
  },
  {
    name: "Computer Systems Servicing",
    track: "Technical-Professional",
    group: "ICT Support and Computer Programming Technologies",
    idealFor: ["technical interest", "hands-on troubleshooting", "practical tasks"],
    strengths: ["hardware repair", "system maintenance", "technical support"],
    relatedCourses: ["BS Information Technology", "BS Computer Engineering", "BS Electronics Technology"],
    careerPathways: ["Computer Technician", "IT Support Specialist", "Systems Technician"],
  },
  {
    name: "Contact Center Services",
    track: "Technical-Professional",
    group: "ICT Support and Computer Programming Technologies",
    idealFor: ["communication interest", "social interest", "customer service"],
    strengths: ["client communication", "service support", "problem resolution"],
    relatedCourses: ["BA Communication", "BS Business Administration", "BS Information Technology"],
    careerPathways: ["Customer Service Representative", "Technical Support Agent", "Call Center Team Lead"],
  },
  {
    name: "Automotive Servicing - Electrical Repair",
    track: "Technical-Professional",
    group: "Automotive and Small Engine Technologies",
    idealFor: ["technical interest", "hands-on work", "logical reasoning", "mechanical systems"],
    strengths: ["vehicle electrical systems", "diagnostics", "repair"],
    relatedCourses: ["BS Automotive Technology", "BS Electrical Engineering", "BS Mechanical Engineering"],
    careerPathways: ["Automotive Electrician", "Auto Technician", "Service Technician"],
  },
  {
    name: "Automotive Servicing - Engine and Chassis Repairs",
    track: "Technical-Professional",
    group: "Automotive and Small Engine Technologies",
    idealFor: ["technical interest", "hands-on repair", "spatial aptitude"],
    strengths: ["engine repair", "chassis systems", "mechanical troubleshooting"],
    relatedCourses: ["BS Automotive Technology", "BS Mechanical Engineering", "BS Industrial Technology"],
    careerPathways: ["Automotive Mechanic", "Service Technician", "Mechanical Technician"],
  },
  {
    name: "Driving and Automotive Servicing",
    track: "Technical-Professional",
    group: "Automotive and Small Engine Technologies",
    idealFor: ["practical tasks", "vehicle operation", "technical interest"],
    strengths: ["safe driving", "basic maintenance", "vehicle handling"],
    relatedCourses: ["BS Automotive Technology", "BS Transportation Management", "BS Industrial Technology"],
    careerPathways: ["Driver", "Automotive Service Assistant", "Fleet Support Staff"],
  },
  {
    name: "Motorcycle and Small Engine Servicing",
    track: "Technical-Professional",
    group: "Automotive and Small Engine Technologies",
    idealFor: ["hands-on repair", "technical interest", "mechanical systems"],
    strengths: ["small engine repair", "diagnostics", "maintenance"],
    relatedCourses: ["BS Automotive Technology", "BS Mechanical Engineering", "BS Industrial Technology"],
    careerPathways: ["Motorcycle Mechanic", "Small Engine Technician", "Service Shop Assistant"],
  },
  {
    name: "Carpentry",
    track: "Technical-Professional",
    group: "Construction and Building Technology",
    idealFor: ["hands-on work", "spatial aptitude", "construction interest"],
    strengths: ["woodwork", "measurement", "building assembly"],
    relatedCourses: ["BS Industrial Technology", "BS Architecture", "BS Civil Engineering"],
    careerPathways: ["Carpenter", "Construction Worker", "Furniture Maker"],
  },
  {
    name: "Construction Operation",
    track: "Technical-Professional",
    group: "Construction and Building Technology",
    idealFor: ["hands-on work", "spatial aptitude", "project execution"],
    strengths: ["site operations", "safety", "construction planning"],
    relatedCourses: ["BS Civil Engineering", "BS Construction Management", "BS Architecture"],
    careerPathways: ["Construction Worker", "Site Assistant", "Project Assistant"],
  },
  {
    name: "Manual Metal Arc Welding",
    track: "Technical-Professional",
    group: "Construction and Building Technology",
    idealFor: ["hands-on work", "technical interest", "precision"],
    strengths: ["welding", "metal fabrication", "safety procedures"],
    relatedCourses: ["BS Industrial Technology", "BS Mechanical Engineering", "BS Welding Technology"],
    careerPathways: ["Welder", "Fabricator", "Industrial Technician"],
  },
  {
    name: "Technical Drafting",
    track: "Technical-Professional",
    group: "Construction and Building Technology",
    idealFor: ["spatial aptitude", "technical interest", "design accuracy"],
    strengths: ["technical drawing", "drafting", "visual planning"],
    relatedCourses: ["BS Architecture", "BS Civil Engineering", "BS Industrial Design"],
    careerPathways: ["Drafting Technician", "CAD Operator", "Architectural Assistant"],
  },
  {
    name: "Animation",
    track: "Technical-Professional",
    group: "Creative Arts and Design Technology",
    idealFor: ["creative interest", "visual design", "technical interest", "multimedia"],
    strengths: ["animation", "visual storytelling", "digital creativity"],
    relatedCourses: ["BS Entertainment and Multimedia Computing", "BA Multimedia Arts", "BS Animation"],
    careerPathways: ["Animator", "Motion Graphics Artist", "Multimedia Designer"],
  },
  {
    name: "Illustration",
    track: "Technical-Professional",
    group: "Creative Arts and Design Technology",
    idealFor: ["creative interest", "drawing", "visual communication"],
    strengths: ["illustration", "concept art", "visual expression"],
    relatedCourses: ["BA Fine Arts", "BA Multimedia Arts", "BS Entertainment and Multimedia Computing"],
    careerPathways: ["Illustrator", "Concept Artist", "Graphic Artist"],
  },
  {
    name: "Visual Graphic Design",
    track: "Technical-Professional",
    group: "Creative Arts and Design Technology",
    idealFor: ["creative interest", "visual design", "communication interest", "digital tools"],
    strengths: ["layout design", "branding", "digital graphics"],
    relatedCourses: ["BA Multimedia Arts", "BS Graphic Design", "BA Communication Design"],
    careerPathways: ["Graphic Designer", "Brand Designer", "UI Designer"],
  },
  {
    name: "Bakery Operations",
    track: "Technical-Professional",
    group: "Hospitality and Tourism",
    idealFor: ["practical tasks", "food interest", "entrepreneurship"],
    strengths: ["baking", "food preparation", "quality control"],
    relatedCourses: ["BS Hospitality Management", "BS Culinary Arts", "BS Entrepreneurship"],
    careerPathways: ["Baker", "Pastry Assistant", "Bakery Owner"],
  },
  {
    name: "Events Management Services",
    track: "Technical-Professional",
    group: "Hospitality and Tourism",
    idealFor: ["leadership interest", "communication", "organization", "social interest"],
    strengths: ["event planning", "coordination", "client service"],
    relatedCourses: ["BS Tourism Management", "BS Hospitality Management", "BS Event Management"],
    careerPathways: ["Event Coordinator", "Events Assistant", "Conference Planner"],
  },
  {
    name: "Food and Beverage Operations",
    track: "Technical-Professional",
    group: "Hospitality and Tourism",
    idealFor: ["social interest", "food service", "practical tasks"],
    strengths: ["service operations", "food handling", "customer care"],
    relatedCourses: ["BS Hospitality Management", "BS Culinary Arts", "BS Tourism Management"],
    careerPathways: ["Food and Beverage Attendant", "Restaurant Supervisor", "Service Crew Trainer"],
  },
  {
    name: "Hotel Operation - Front Office Services",
    track: "Technical-Professional",
    group: "Hospitality and Tourism",
    idealFor: ["communication interest", "social interest", "organization"],
    strengths: ["guest relations", "front desk operations", "service communication"],
    relatedCourses: ["BS Hospitality Management", "BS Tourism Management", "BS Business Administration"],
    careerPathways: ["Front Desk Agent", "Guest Relations Officer", "Hotel Supervisor"],
  },
  {
    name: "Hotel Operation - Housekeeping Services",
    track: "Technical-Professional",
    group: "Hospitality and Tourism",
    idealFor: ["practical tasks", "service orientation", "detail orientation"],
    strengths: ["housekeeping operations", "quality standards", "guest service"],
    relatedCourses: ["BS Hospitality Management", "BS Tourism Management", "BS Hotel and Restaurant Management"],
    careerPathways: ["Housekeeping Attendant", "Room Supervisor", "Hotel Operations Staff"],
  },
  {
    name: "Kitchen Operations",
    track: "Technical-Professional",
    group: "Hospitality and Tourism",
    idealFor: ["food interest", "hands-on work", "time management"],
    strengths: ["kitchen workflow", "food preparation", "safety"],
    relatedCourses: ["BS Culinary Arts", "BS Hospitality Management", "BS Food Technology"],
    careerPathways: ["Kitchen Staff", "Cook", "Culinary Assistant"],
  },
  {
    name: "Tourism Services",
    track: "Technical-Professional",
    group: "Hospitality and Tourism",
    idealFor: ["communication interest", "social interest", "travel interest"],
    strengths: ["tourism support", "customer service", "local knowledge"],
    relatedCourses: ["BS Tourism Management", "BS Hospitality Management", "BA Communication"],
    careerPathways: ["Tour Guide", "Travel Consultant", "Tourism Officer"],
  },
  {
    name: "Garments Artisanry",
    track: "Technical-Professional",
    group: "Artisanry and Creative Enterprise",
    idealFor: ["creative interest", "hands-on work", "fashion interest"],
    strengths: ["garment construction", "sewing", "design execution"],
    relatedCourses: ["BS Fashion Design", "BS Entrepreneurship", "BS Industrial Technology"],
    careerPathways: ["Dressmaker", "Fashion Assistant", "Garment Production Worker"],
  },
  {
    name: "Handicrafts and Weaving",
    track: "Technical-Professional",
    group: "Artisanry and Creative Enterprise",
    idealFor: ["creative interest", "hands-on work", "cultural crafts"],
    strengths: ["craft production", "weaving", "artisan design"],
    relatedCourses: ["BA Fine Arts", "BS Entrepreneurship", "BS Industrial Design"],
    careerPathways: ["Craft Artisan", "Weaver", "Creative Enterprise Owner"],
  },
  {
    name: "Commercial Air-Conditioning Installation and Servicing",
    track: "Technical-Professional",
    group: "Industrial Technologies",
    idealFor: ["technical interest", "hands-on work", "mechanical systems"],
    strengths: ["HVAC servicing", "installation", "diagnostics"],
    relatedCourses: ["BS Industrial Technology", "BS Mechanical Engineering", "BS Refrigeration and Air-Conditioning Technology"],
    careerPathways: ["HVAC Technician", "Air-Conditioning Installer", "Maintenance Technician"],
  },
  {
    name: "Domestic Refrigeration and Air-Conditioning Servicing",
    track: "Technical-Professional",
    group: "Industrial Technologies",
    idealFor: ["technical interest", "hands-on troubleshooting", "home appliance systems"],
    strengths: ["refrigeration repair", "AC servicing", "maintenance"],
    relatedCourses: ["BS Industrial Technology", "BS Mechanical Engineering", "BS Refrigeration and Air-Conditioning Technology"],
    careerPathways: ["Refrigeration Technician", "AC Service Technician", "Appliance Service Worker"],
  },
  {
    name: "Electrical Installation and Maintenance",
    track: "Technical-Professional",
    group: "Industrial Technologies",
    idealFor: ["technical interest", "logical reasoning", "hands-on electrical work"],
    strengths: ["wiring", "electrical safety", "maintenance"],
    relatedCourses: ["BS Electrical Engineering", "BS Industrial Technology", "BS Electronics Engineering"],
    careerPathways: ["Electrician", "Electrical Technician", "Maintenance Technician"],
  },
  {
    name: "Electronics Product and Assembly Servicing",
    track: "Technical-Professional",
    group: "Industrial Technologies",
    idealFor: ["technical interest", "logical reasoning", "precision", "electronics"],
    strengths: ["electronics assembly", "repair", "circuit troubleshooting"],
    relatedCourses: ["BS Electronics Engineering", "BS Computer Engineering", "BS Industrial Technology"],
    careerPathways: ["Electronics Technician", "Assembly Technician", "Repair Specialist"],
  },
];

export default async function handler(request, response) {
  if (request.method === "OPTIONS") {
    return sendJson(response, 200, { ok: true });
  }

  if (request.method !== "POST") {
    response.setHeader("Allow", "POST, OPTIONS");
    return sendJson(response, 405, { error: "Method not allowed" });
  }

  if (!process.env.GROQ_API_KEY) {
    return sendJson(response, 500, { error: "GROQ_API_KEY is not configured" });
  }

  try {
    const data = request.body || {};
    const prompt = `

You are an AI assessment recommendation system.

The student's track is already determined.

Your tasks:
1. Recommend ONLY the BEST 2 electives.
2. Explain why those electives fit the student.
3. Suggest possible college courses.
4. Match recommendations using:
   - aptitude scores
   - interest scores
   - strengths
   - compatibility
5. Ensure recommendations align with the student's determined track.

Track:
${data.track}

APTITUDE SCORES:
VA: ${data.VA}
MA: ${data.MA}
SA: ${data.SA}
LRA: ${data.LRA}

INTEREST SCORES:
Academic: ${data.academicInterest}
Communication: ${data.communicationInterest}
Creative: ${data.creativeInterest}
Leadership: ${data.leadershipInterest}
Technical: ${data.technicalInterest}
Social: ${data.socialInterest}

AVAILABLE ELECTIVES DATASET:
${JSON.stringify(electives)}

Choose electives based on:
- strongest aptitude scores
- strongest interest scores
- elective idealFor fields
- elective strengths
- elective track compatibility
- related college courses and career pathways

IMPORTANT:
Electives must strongly align with the student's dominant interests and aptitude scores.
Do not recommend broad or unrelated electives.
Prioritize electives with the highest compatibility.
Only recommend electives from the AVAILABLE ELECTIVES DATASET.
Ensure the chosen electives match the student's determined track.

Return ONLY VALID JSON using this exact format:

IMPORTANT:
Return ONLY raw JSON.
Do not use markdown.
Do not wrap in triple backticks.
Do not add explanations outside JSON.

{
  "recommendedTrack": "",

  "trackExplanation": "",

  "elective1": "",

  "elective1Explanation": "",

  "elective2": "",

  "elective2Explanation": "",

  "overallAnalysis": "",

  "suggestedCollegeCourses": [],

  "careerPathways": [
    {
      "course": "",
      "careers": []
    }
  ]
}

Requirements:
- trackExplanation must explain WHY the track fits the student based on aptitude and interests.
- elective1Explanation must explain WHY elective 1 matches the student's strengths and interests.
- elective2Explanation must explain WHY elective 2 matches the student's strengths and interests.
- overallAnalysis must provide a longer career/academic assessment summary.
- suggestedCollegeCourses must list college programs aligned with the track and electives.
- careerPathways must list possible career titles grouped by the most relevant college course or pathway.
- Make explanations detailed, professional, student-friendly, and guidance-oriented.
- Use the student's aptitude scores and interest scores in the reasoning.
- Ensure explanations are not generic.

`;
    const input = prompt.trim();

    if (!input) {
      return sendJson(response, 400, {
        error: "Assessment prompt or assessment data is required",
      });
    }

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content:
              "You are Electron Hub's AI assessment assistant. Return only valid JSON with no markdown formatting.",
          },
          {
            role: "user",
            content: input,
          },
        ],
        temperature: 0.2,
        response_format: { type: "json_object" },
      }),
    });

    const completion = await groqResponse.json();

    if (!groqResponse.ok) {
      console.error("Groq API error:", completion);
      return sendJson(response, groqResponse.status, {
        success: false,
        error: completion?.error?.message || "Groq API request failed",
      });
    }

    const reply = String(completion.choices?.[0]?.message?.content || "")
      .trim()
      .replace(/```json/g, "")
      .replace(/```/g, "");

    const parsedResult = parseAiJson(reply);

    return sendJson(response, 200, {
      success: true,
      result: parsedResult,
    });
  } catch (error) {
    console.error("Assessment AI error:", error);
    return sendJson(response, 500, {
      success: false,
      error: "Unable to generate assessment recommendation",
    });
  }
}
