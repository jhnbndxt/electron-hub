// Philippine Address Data (PSGC-compliant)
// Simplified version with major regions, provinces, cities, and barangays

export interface Region {
  code: string;
  name: string;
}

export interface Province {
  code: string;
  name: string;
  regionCode: string;
}

export interface City {
  code: string;
  name: string;
  provinceCode: string;
}

export interface Barangay {
  code: string;
  name: string;
  cityCode: string;
}

export const regions: Region[] = [
  { code: "NCR", name: "National Capital Region (NCR)" },
  { code: "CAR", name: "Cordillera Administrative Region (CAR)" },
  { code: "I", name: "Region I (Ilocos Region)" },
  { code: "II", name: "Region II (Cagayan Valley)" },
  { code: "III", name: "Region III (Central Luzon)" },
  { code: "IV-A", name: "Region IV-A (CALABARZON)" },
  { code: "IV-B", name: "Region IV-B (MIMAROPA)" },
  { code: "V", name: "Region V (Bicol Region)" },
  { code: "VI", name: "Region VI (Western Visayas)" },
  { code: "VII", name: "Region VII (Central Visayas)" },
  { code: "VIII", name: "Region VIII (Eastern Visayas)" },
  { code: "IX", name: "Region IX (Zamboanga Peninsula)" },
  { code: "X", name: "Region X (Northern Mindanao)" },
  { code: "XI", name: "Region XI (Davao Region)" },
  { code: "XII", name: "Region XII (SOCCSKSARGEN)" },
  { code: "XIII", name: "Region XIII (Caraga)" },
  { code: "BARMM", name: "Bangsamoro Autonomous Region in Muslim Mindanao (BARMM)" },
];

export const provinces: Province[] = [
  // NCR has no provinces - cities are directly under NCR
  
  // Region III - Central Luzon
  { code: "P-0308", name: "Bataan", regionCode: "III" },
  { code: "P-0314", name: "Bulacan", regionCode: "III" },
  { code: "P-0349", name: "Nueva Ecija", regionCode: "III" },
  { code: "P-0354", name: "Pampanga", regionCode: "III" },
  { code: "P-0369", name: "Tarlac", regionCode: "III" },
  { code: "P-0371", name: "Zambales", regionCode: "III" },
  { code: "P-0377", name: "Aurora", regionCode: "III" },
  
  // Region IV-A - CALABARZON
  { code: "P-0410", name: "Batangas", regionCode: "IV-A" },
  { code: "P-0421", name: "Cavite", regionCode: "IV-A" },
  { code: "P-0434", name: "Laguna", regionCode: "IV-A" },
  { code: "P-0456", name: "Quezon", regionCode: "IV-A" },
  { code: "P-0458", name: "Rizal", regionCode: "IV-A" },
];

export const cities: City[] = [
  // NCR Cities (directly under NCR, no province)
  { code: "C-1374", name: "Manila", provinceCode: "NCR" },
  { code: "C-1376", name: "Quezon City", provinceCode: "NCR" },
  { code: "C-1376", name: "Caloocan", provinceCode: "NCR" },
  { code: "C-1339", name: "Las Piñas", provinceCode: "NCR" },
  { code: "C-1341", name: "Makati", provinceCode: "NCR" },
  { code: "C-1342", name: "Malabon", provinceCode: "NCR" },
  { code: "C-1343", name: "Mandaluyong", provinceCode: "NCR" },
  { code: "C-1345", name: "Marikina", provinceCode: "NCR" },
  { code: "C-1346", name: "Muntinlupa", provinceCode: "NCR" },
  { code: "C-1347", name: "Navotas", provinceCode: "NCR" },
  { code: "C-1348", name: "Parañaque", provinceCode: "NCR" },
  { code: "C-1349", name: "Pasay", provinceCode: "NCR" },
  { code: "C-1350", name: "Pasig", provinceCode: "NCR" },
  { code: "C-1351", name: "Pateros", provinceCode: "NCR" },
  { code: "C-1352", name: "San Juan", provinceCode: "NCR" },
  { code: "C-1353", name: "Taguig", provinceCode: "NCR" },
  { code: "C-1354", name: "Valenzuela", provinceCode: "NCR" },
  
  // Cavite
  { code: "C-0421-01", name: "Bacoor", provinceCode: "P-0421" },
  { code: "C-0421-02", name: "Cavite City", provinceCode: "P-0421" },
  { code: "C-0421-03", name: "Dasmariñas", provinceCode: "P-0421" },
  { code: "C-0421-04", name: "General Trias", provinceCode: "P-0421" },
  { code: "C-0421-05", name: "Imus", provinceCode: "P-0421" },
  { code: "C-0421-06", name: "Tagaytay", provinceCode: "P-0421" },
  { code: "C-0421-07", name: "Trece Martires", provinceCode: "P-0421" },
  
  // Laguna
  { code: "C-0434-01", name: "Biñan", provinceCode: "P-0434" },
  { code: "C-0434-02", name: "Cabuyao", provinceCode: "P-0434" },
  { code: "C-0434-03", name: "Calamba", provinceCode: "P-0434" },
  { code: "C-0434-04", name: "San Pablo", provinceCode: "P-0434" },
  { code: "C-0434-05", name: "San Pedro", provinceCode: "P-0434" },
  { code: "C-0434-06", name: "Santa Rosa", provinceCode: "P-0434" },
];

export const barangays: Barangay[] = [
  // Manila
  { code: "B-1374-001", name: "Binondo", cityCode: "C-1374" },
  { code: "B-1374-002", name: "Ermita", cityCode: "C-1374" },
  { code: "B-1374-003", name: "Intramuros", cityCode: "C-1374" },
  { code: "B-1374-004", name: "Malate", cityCode: "C-1374" },
  { code: "B-1374-005", name: "Paco", cityCode: "C-1374" },
  { code: "B-1374-006", name: "Pandacan", cityCode: "C-1374" },
  { code: "B-1374-007", name: "Sampaloc", cityCode: "C-1374" },
  { code: "B-1374-008", name: "San Miguel", cityCode: "C-1374" },
  { code: "B-1374-009", name: "Santa Cruz", cityCode: "C-1374" },
  { code: "B-1374-010", name: "Tondo", cityCode: "C-1374" },
  
  // Quezon City
  { code: "B-1376-001", name: "Bagumbayan", cityCode: "C-1376" },
  { code: "B-1376-002", name: "Balingasa", cityCode: "C-1376" },
  { code: "B-1376-003", name: "Batasan Hills", cityCode: "C-1376" },
  { code: "B-1376-004", name: "Commonwealth", cityCode: "C-1376" },
  { code: "B-1376-005", name: "Fairview", cityCode: "C-1376" },
  { code: "B-1376-006", name: "Kamuning", cityCode: "C-1376" },
  { code: "B-1376-007", name: "North Fairview", cityCode: "C-1376" },
  { code: "B-1376-008", name: "Novaliches", cityCode: "C-1376" },
  { code: "B-1376-009", name: "Project 4", cityCode: "C-1376" },
  { code: "B-1376-010", name: "Santa Cruz", cityCode: "C-1376" },
  
  // Valenzuela
  { code: "B-1354-001", name: "Arkong Bato", cityCode: "C-1354" },
  { code: "B-1354-002", name: "Balangkas", cityCode: "C-1354" },
  { code: "B-1354-003", name: "Bignay", cityCode: "C-1354" },
  { code: "B-1354-004", name: "Dalandanan", cityCode: "C-1354" },
  { code: "B-1354-005", name: "Karuhatan", cityCode: "C-1354" },
  { code: "B-1354-006", name: "Malinta", cityCode: "C-1354" },
  { code: "B-1354-007", name: "Marulas", cityCode: "C-1354" },
  { code: "B-1354-008", name: "Maysan", cityCode: "C-1354" },
  { code: "B-1354-009", name: "Paso de Blas", cityCode: "C-1354" },
  { code: "B-1354-010", name: "Ugong", cityCode: "C-1354" },
  
  // Calamba (Laguna)
  { code: "B-0434-03-001", name: "Barandal", cityCode: "C-0434-03" },
  { code: "B-0434-03-002", name: "Batino", cityCode: "C-0434-03" },
  { code: "B-0434-03-003", name: "Kay-Anlog", cityCode: "C-0434-03" },
  { code: "B-0434-03-004", name: "Lawa", cityCode: "C-0434-03" },
  { code: "B-0434-03-005", name: "Milagrosa", cityCode: "C-0434-03" },
  { code: "B-0434-03-006", name: "Paciano Rizal", cityCode: "C-0434-03" },
  { code: "B-0434-03-007", name: "Punta", cityCode: "C-0434-03" },
  { code: "B-0434-03-008", name: "Real", cityCode: "C-0434-03" },
  { code: "B-0434-03-009", name: "San Cristobal", cityCode: "C-0434-03" },
  { code: "B-0434-03-010", name: "Turbina", cityCode: "C-0434-03" },
];

// Helper functions
export function getProvincesByRegion(regionCode: string): Province[] {
  if (regionCode === "NCR") {
    return []; // NCR has no provinces
  }
  return provinces.filter((p) => p.regionCode === regionCode);
}

export function getCitiesByProvince(provinceCode: string): City[] {
  return cities.filter((c) => c.provinceCode === provinceCode);
}

export function getCitiesByRegion(regionCode: string): City[] {
  if (regionCode === "NCR") {
    return cities.filter((c) => c.provinceCode === "NCR");
  }
  return [];
}

export function getBarangaysByCity(cityCode: string): Barangay[] {
  return barangays.filter((b) => b.cityCode === cityCode);
}
