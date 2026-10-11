// Compatibility profiles for the current seven-offering elective structure.
const profile = (aptitude, riasec) => ({ aptitude, riasec });

export const ELECTIVE_WEIGHT_PROFILES = {
  "Business 1 – Basic Accounting": profile({ math: 0.45, logical: 0.35, verbal: 0.2 }, { Conventional: 0.55, Enterprising: 0.45 }),
  "Introduction to Organization and Management": profile({ verbal: 0.4, logical: 0.25, math: 0.1, science: 0.25 }, { Enterprising: 0.65, Social: 0.35 }),
  "Biology 1": profile({ science: 0.5, logical: 0.3, verbal: 0.2 }, { Investigative: 0.7, Social: 0.3 }),
  "Creative Writing": profile({ verbal: 0.65, logical: 0.15, science: 0.2 }, { Artistic: 0.75, Social: 0.25 }),
  "Chemistry 1": profile({ science: 0.45, math: 0.3, logical: 0.25 }, { Investigative: 0.8, Realistic: 0.2 }),
  "Computer Programming": profile({ logical: 0.45, math: 0.3, science: 0.25 }, { Investigative: 0.6, Realistic: 0.4 }),
};

function normalize(name = "") {
  return String(name).trim().toLowerCase();
}

export function getElectiveWeightProfile(electiveName) {
  return Object.entries(ELECTIVE_WEIGHT_PROFILES).find(([name]) => normalize(name) === normalize(electiveName))?.[1] || null;
}

export function validateElectiveWeightProfiles(expectedElectiveNames = []) {
  return expectedElectiveNames.filter((name) => !getElectiveWeightProfile(name)).map((name) => `Missing weight profile for "${name}".`);
}
