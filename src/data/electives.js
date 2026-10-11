/** The single source of truth for Electron College elective offerings. */
const electives = [
  { name: "Business 1 – Basic Accounting", track: "Academic Track", cluster: "Business and Entrepreneurship", group: "Business and Entrepreneurship", category: "Business and Entrepreneurship", description: "Introduces accounting fundamentals and financial record keeping.", strengths: ["financial records", "numerical reasoning", "accuracy"], relatedCourses: ["BS Accountancy", "BS Management Accounting", "BS Business Administration"], careerPathways: ["Accountant", "Bookkeeper", "Financial Analyst"] },
  { name: "Introduction to Organization and Management", track: "Academic Track", cluster: "Business and Entrepreneurship", group: "Business and Entrepreneurship", category: "Business and Entrepreneurship", description: "Covers organization, planning, and management principles.", strengths: ["planning", "team coordination", "leadership"], relatedCourses: ["BS Business Administration", "BS Management", "BS Human Resource Management"], careerPathways: ["Manager", "HR Officer", "Project Coordinator"] },
  { name: "Biology 1", track: "Academic Track", cluster: "Arts, Social Sciences, and Humanities", group: "Arts, Social Sciences, and Humanities", category: "Arts, Social Sciences, and Humanities", description: "Builds foundational understanding of life science and scientific inquiry.", strengths: ["life science", "observation", "scientific reasoning"], relatedCourses: ["BS Biology", "BS Nursing", "BS Medical Technology"], careerPathways: ["Biologist", "Nurse", "Medical Technologist"] },
  { name: "Creative Writing", track: "Academic Track", cluster: "Arts, Social Sciences, and Humanities", group: "Arts, Social Sciences, and Humanities", category: "Arts, Social Sciences, and Humanities", description: "Develops writing, storytelling, and creative expression.", strengths: ["writing", "storytelling", "expression"], relatedCourses: ["BA Creative Writing", "BA Communication", "BA Journalism"], careerPathways: ["Writer", "Content Creator", "Editor"] },
  { name: "Biology 1", track: "Academic Track", cluster: "Science, Technology, Engineering, and Mathematics (STEM)", group: "Science, Technology, Engineering, and Mathematics (STEM)", category: "Science, Technology, Engineering, and Mathematics (STEM)", description: "Builds foundational understanding of life science and scientific inquiry.", strengths: ["life science", "observation", "scientific reasoning"], relatedCourses: ["BS Biology", "BS Nursing", "BS Medical Technology"], careerPathways: ["Biologist", "Nurse", "Medical Technologist"] },
  { name: "Chemistry 1", track: "Academic Track", cluster: "Science, Technology, Engineering, and Mathematics (STEM)", group: "Science, Technology, Engineering, and Mathematics (STEM)", category: "Science, Technology, Engineering, and Mathematics (STEM)", description: "Introduces chemical concepts, laboratory work, and analysis.", strengths: ["chemical analysis", "precision", "problem solving"], relatedCourses: ["BS Chemistry", "BS Chemical Engineering", "BS Pharmacy"], careerPathways: ["Chemist", "Chemical Engineer", "Pharmacist"] },
  { name: "Computer Programming", track: "Technical-Professional Electives", cluster: "ICT Support and Computer Programming Technologies", group: "ICT Support and Computer Programming Technologies", category: "ICT Support and Computer Programming Technologies", description: "Introduces programming concepts, algorithms, and software development.", strengths: ["coding", "logical reasoning", "problem solving"], relatedCourses: ["BS Information Technology", "BS Computer Science", "BS Information Systems"], careerPathways: ["Programmer", "Software Developer", "IT Support Specialist"] },
];

export const ELECTIVE_STRUCTURE = [
  { track: "Academic Track", clusters: [
    { name: "Business and Entrepreneurship", electives: ["Business 1 – Basic Accounting", "Introduction to Organization and Management"] },
    { name: "Arts, Social Sciences, and Humanities", electives: ["Biology 1", "Creative Writing"] },
    { name: "Science, Technology, Engineering, and Mathematics (STEM)", electives: ["Biology 1", "Chemistry 1"] },
  ] },
  { track: "Technical-Professional Electives", clusters: [
    { name: "ICT Support and Computer Programming Technologies", electives: ["Computer Programming"] },
  ] },
];

export function getClustersForTrack(track) {
  return ELECTIVE_STRUCTURE.find((entry) => entry.track === track)?.clusters || [];
}

export function getElectivesForCluster(track, cluster) {
  return getClustersForTrack(track).find((entry) => entry.name === cluster)?.electives || [];
}

export default electives;
