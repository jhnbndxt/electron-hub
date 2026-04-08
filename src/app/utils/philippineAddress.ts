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
  
  // CAR - Cordillera Administrative Region
  { code: "P-0229", name: "Abra", regionCode: "CAR" },
  { code: "P-0255", name: "Apayao", regionCode: "CAR" },
  { code: "P-0256", name: "Benguet", regionCode: "CAR" },
  { code: "P-0275", name: "Ifugao", regionCode: "CAR" },
  { code: "P-0284", name: "Kalinga", regionCode: "CAR" },
  { code: "P-0356", name: "Mountain Province", regionCode: "CAR" },
  
  // Region I - Ilocos Region
  { code: "P-0131", name: "Ilocos Norte", regionCode: "I" },
  { code: "P-0132", name: "Ilocos Sur", regionCode: "I" },
  { code: "P-0155", name: "La Union", regionCode: "I" },
  { code: "P-0251", name: "Pangasinan", regionCode: "I" },
  
  // Region II - Cagayan Valley
  { code: "P-0235", name: "Batanes", regionCode: "II" },
  { code: "P-0236", name: "Cagayan", regionCode: "II" },
  { code: "P-0324", name: "Isabela", regionCode: "II" },
  { code: "P-0339", name: "Nueva Vizcaya", regionCode: "II" },
  { code: "P-0373", name: "Quirino", regionCode: "II" },
  
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
  
  // Region IV-B - MIMAROPA
  { code: "P-0318", name: "Marinduque", regionCode: "IV-B" },
  { code: "P-0356-B", name: "Occidental Mindoro", regionCode: "IV-B" },
  { code: "P-0357", name: "Oriental Mindoro", regionCode: "IV-B" },
  { code: "P-0379", name: "Palawan", regionCode: "IV-B" },
  { code: "P-0387", name: "Romblon", regionCode: "IV-B" },
  
  // Region V - Bicol Region
  { code: "P-0214", name: "Albay", regionCode: "V" },
  { code: "P-0215", name: "Camarines Norte", regionCode: "V" },
  { code: "P-0216", name: "Camarines Sur", regionCode: "V" },
  { code: "P-0219", name: "Catanduanes", regionCode: "V" },
  { code: "P-0262", name: "Masbate", regionCode: "V" },
  { code: "P-0381", name: "Sorsogon", regionCode: "V" },
  
  // Region VI - Western Visayas
  { code: "P-0606", name: "Aklan", regionCode: "VI" },
  { code: "P-0620", name: "Antique", regionCode: "VI" },
  { code: "P-0636", name: "Capiz", regionCode: "VI" },
  { code: "P-0580", name: "Guimaras", regionCode: "VI" },
  { code: "P-0638", name: "Iloilo", regionCode: "VI" },
  { code: "P-0665", name: "Negros Occidental", regionCode: "VI" },
  
  // Region VII - Central Visayas
  { code: "P-0708", name: "Bohol", regionCode: "VII" },
  { code: "P-0715", name: "Cebu", regionCode: "VII" },
  { code: "P-0766", name: "Negros Oriental", regionCode: "VII" },
  { code: "P-0777", name: "Siquijor", regionCode: "VII" },
  
  // Region VIII - Eastern Visayas
  { code: "P-0815", name: "Biliran", regionCode: "VIII" },
  { code: "P-0832", name: "Eastern Samar", regionCode: "VIII" },
  { code: "P-0844", name: "Leyte", regionCode: "VIII" },
  { code: "P-0852", name: "Northern Samar", regionCode: "VIII" },
  { code: "P-0863", name: "Samar", regionCode: "VIII" },
  { code: "P-0870", name: "Southern Leyte", regionCode: "VIII" },
  
  // Region IX - Zamboanga Peninsula
  { code: "P-0909", name: "Misamis Oriental", regionCode: "VIII" },
  { code: "P-0918", name: "Zamboanga del Norte", regionCode: "IX" },
  { code: "P-0920", name: "Zamboanga del Sur", regionCode: "IX" },
  { code: "P-0925", name: "Zamboanga Sibugay", regionCode: "IX" },
  
  // Region X - Northern Mindanao
  { code: "P-1006", name: "Bukidnon", regionCode: "X" },
  { code: "P-1009", name: "Camiguin", regionCode: "X" },
  { code: "P-1013", name: "Misamis Oriental", regionCode: "X" },
  
  // Region XI - Davao Region
  { code: "P-1101", name: "Compostela Valley", regionCode: "XI" },
  { code: "P-1102", name: "Davao del Norte", regionCode: "XI" },
  { code: "P-1103", name: "Davao del Sur", regionCode: "XI" },
  { code: "P-1104", name: "Davao Oriental", regionCode: "XI" },
  
  // Region XII - SOCCSKSARGEN
  { code: "P-1210", name: "South Cotabato", regionCode: "XII" },
  { code: "P-1218", name: "Cotabato", regionCode: "XII" },
  { code: "P-1233", name: "Sarangani", regionCode: "XII" },
  { code: "P-1237", name: "Sultan Kudarat", regionCode: "XII" },
  
  // Region XIII - Caraga
  { code: "P-1301", name: "Agusan del Norte", regionCode: "XIII" },
  { code: "P-1302", name: "Agusan del Sur", regionCode: "XIII" },
  { code: "P-1303", name: "Dinagat Islands", regionCode: "XIII" },
  { code: "P-1304", name: "Surigao del Norte", regionCode: "XIII" },
  { code: "P-1305", name: "Surigao del Sur", regionCode: "XIII" },
  
  // BARMM - Bangsamoro Autonomous Region
  { code: "P-1401", name: "Basilan", regionCode: "BARMM" },
  { code: "P-1402", name: "Lanao del Norte", regionCode: "BARMM" },
  { code: "P-1403", name: "Lanao del Sur", regionCode: "BARMM" },
  { code: "P-1404", name: "Maguindanao", regionCode: "BARMM" },
  { code: "P-1405", name: "Sulu", regionCode: "BARMM" },
  { code: "P-1406", name: "Tawi-Tawi", regionCode: "BARMM" },
];

export const cities: City[] = [
  // NCR Cities (17 cities)
  { code: "C-1374", name: "Manila", provinceCode: "NCR" },
  { code: "C-1376", name: "Quezon City", provinceCode: "NCR" },
  { code: "C-1377", name: "Caloocan", provinceCode: "NCR" },
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
  
  // Cavite (9 cities + 2 municipalities)
  { code: "C-0421-01", name: "Bacoor", provinceCode: "P-0421" },
  { code: "C-0421-02", name: "Cavite City", provinceCode: "P-0421" },
  { code: "C-0421-03", name: "Dasmariñas", provinceCode: "P-0421" },
  { code: "C-0421-04", name: "General Trias", provinceCode: "P-0421" },
  { code: "C-0421-05", name: "Imus", provinceCode: "P-0421" },
  { code: "C-0421-06", name: "Tagaytay", provinceCode: "P-0421" },
  { code: "C-0421-07", name: "Trece Martires", provinceCode: "P-0421" },
  { code: "C-0421-08", name: "Silang", provinceCode: "P-0421" },
  { code: "C-0421-09", name: "Kawit", provinceCode: "P-0421" },
  { code: "C-0421-10", name: "Noveleta", provinceCode: "P-0421" },
  
  // Laguna (6 cities + 3 municipalities)
  { code: "C-0434-01", name: "Biñan", provinceCode: "P-0434" },
  { code: "C-0434-02", name: "Cabuyao", provinceCode: "P-0434" },
  { code: "C-0434-03", name: "Calamba", provinceCode: "P-0434" },
  { code: "C-0434-04", name: "San Pablo", provinceCode: "P-0434" },
  { code: "C-0434-05", name: "San Pedro", provinceCode: "P-0434" },
  { code: "C-0434-06", name: "Santa Rosa", provinceCode: "P-0434" },
  { code: "C-0434-07", name: "Laguna", provinceCode: "P-0434" },
  { code: "C-0434-08", name: "Los Baños", provinceCode: "P-0434" },
  { code: "C-0434-09", name: "Pagsanjan", provinceCode: "P-0434" },
  
  // Batangas (6 cities + municipalities)
  { code: "C-0410-01", name: "Batangas City", provinceCode: "P-0410" },
  { code: "C-0410-02", name: "Lipa", provinceCode: "P-0410" },
  { code: "C-0410-03", name: "Nasugbu", provinceCode: "P-0410" },
  { code: "C-0410-04", name: "Tanauan", provinceCode: "P-0410" },
  { code: "C-0410-05", name: "San Juan de Dios", provinceCode: "P-0410" },
  
  // Quezon
  { code: "C-0456-01", name: "Lucena", provinceCode: "P-0456" },
  { code: "C-0456-02", name: "Quezon City", provinceCode: "P-0456" },
  
  // Rizal
  { code: "C-0458-01", name: "Antipolo", provinceCode: "P-0458" },
  { code: "C-0458-02", name: "Tanay", provinceCode: "P-0458" },
  { code: "C-0458-03", name: "Cainta", provinceCode: "P-0458" },
  
  // Pampanga
  { code: "C-0354-01", name: "Angeles City", provinceCode: "P-0354" },
  { code: "C-0354-02", name: "San Fernando", provinceCode: "P-0354" },
  
  // Bulacan
  { code: "C-0314-01", name: "Malolos", provinceCode: "P-0314" },
  { code: "C-0314-02", name: "Meycauayan", provinceCode: "P-0314" },
  { code: "C-0314-03", name: "San Jose del Monte", provinceCode: "P-0314" },
  { code: "C-0314-04", name: "Valenzuela", provinceCode: "P-0314" },
  
  // Nueva Ecija
  { code: "C-0349-01", name: "Cabanatuan City", provinceCode: "P-0349" },
  { code: "C-0349-02", name: "Santa Cruz", provinceCode: "P-0349" },
  { code: "C-0349-03", name: "San Fernando", provinceCode: "P-0349" },
  
  // Tarlac
  { code: "C-0369-01", name: "Tarlac City", provinceCode: "P-0369" },
  
  // Zambales
  { code: "C-0371-01", name: "Olongapo", provinceCode: "P-0371" },
  { code: "C-0371-02", name: "Subic", provinceCode: "P-0371" },
  
  // Aurora
  { code: "C-0377-01", name: "Bongabon", provinceCode: "P-0377" },
  
  // Bataan
  { code: "C-0308-01", name: "Balanga", provinceCode: "P-0308" },
  
  // Benguet
  { code: "C-0256-01", name: "Baguio", provinceCode: "P-0256" },
  
  // Pangasinan
  { code: "C-0251-01", name: "Dagupan", provinceCode: "P-0251" },
  { code: "C-0251-02", name: "Lingayen", provinceCode: "P-0251" },
  { code: "C-0251-03", name: "San Carlos", provinceCode: "P-0251" },
  { code: "C-0251-04", name: "Urdaneta", provinceCode: "P-0251" },
  
  // Ilocos Norte
  { code: "C-0131-01", name: "Laoag", provinceCode: "P-0131" },
  { code: "C-0131-02", name: "Batac", provinceCode: "P-0131" },
  
  // Ilocos Sur
  { code: "C-0132-01", name: "Vigan", provinceCode: "P-0132" },
  { code: "C-0132-02", name: "San Fernando", provinceCode: "P-0132" },
  
  // La Union
  { code: "C-0155-01", name: "San Fernando", provinceCode: "P-0155" },
  { code: "C-0155-02", name: "Dagupan", provinceCode: "P-0155" },
  
  // Cagayan
  { code: "C-0236-01", name: "Tuguegarao", provinceCode: "P-0236" },
  
  // Isabela
  { code: "C-0324-01", name: "Ilagan", provinceCode: "P-0324" },
  { code: "C-0324-02", name: "Santiago", provinceCode: "P-0324" },
  
  // Nueva Vizcaya
  { code: "C-0339-01", name: "Bayombong", provinceCode: "P-0339" },
  
  // Albay
  { code: "C-0214-01", name: "Legazpi", provinceCode: "P-0214" },
  { code: "C-0214-02", name: "Naga", provinceCode: "P-0214" },
  
  // Camarines Sur
  { code: "C-0216-01", name: "Naga", provinceCode: "P-0216" },
  { code: "C-0216-02", name: "Iriga", provinceCode: "P-0216" },
  
  // Sorsogon
  { code: "C-0381-01", name: "Sorsogon City", provinceCode: "P-0381" },
  
  // Iloilo
  { code: "C-0638-01", name: "Iloilo City", provinceCode: "P-0638" },
  
  // Negros Occidental
  { code: "C-0665-01", name: "Bacolod", provinceCode: "P-0665" },
  { code: "C-0665-02", name: "Silay", provinceCode: "P-0665" },
  { code: "C-0665-03", name: "Victorias", provinceCode: "P-0665" },
  
  // Cebu
  { code: "C-0715-01", name: "Cebu City", provinceCode: "P-0715" },
  { code: "C-0715-02", name: "Lapu-Lapu", provinceCode: "P-0715" },
  { code: "C-0715-03", name: "Mandaue", provinceCode: "P-0715" },
  
  // Bohol
  { code: "C-0708-01", name: "Tagbilaran", provinceCode: "P-0708" },
  
  // Leyte
  { code: "C-0844-01", name: "Tacloban", provinceCode: "P-0844" },
  
  // Davao del Sur
  { code: "C-1103-01", name: "Davao City", provinceCode: "P-1103" },
  
  // Zamboanga del Sur
  { code: "C-0920-01", name: "Zamboanga City", provinceCode: "P-0920" },
];

export const barangays: Barangay[] = [
  // MANILA - 17 barangays
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
  { code: "B-1374-011", name: "Quiapo", cityCode: "C-1374" },
  { code: "B-1374-012", name: "Santa Ana", cityCode: "C-1374" },
  { code: "B-1374-013", name: "Lawton", cityCode: "C-1374" },
  { code: "B-1374-014", name: "Singalong", cityCode: "C-1374" },
  { code: "B-1374-015", name: "San Andres", cityCode: "C-1374" },
  { code: "B-1374-016", name: "Malamig", cityCode: "C-1374" },
  { code: "B-1374-017", name: "Tanauan", cityCode: "C-1374" },
  
  // QUEZON CITY - 25 barangays
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
  { code: "B-1376-011", name: "Talipapa", cityCode: "C-1376" },
  { code: "B-1376-012", name: "Talimahan", cityCode: "C-1376" },
  { code: "B-1376-013", name: "Tatalon", cityCode: "C-1376" },
  { code: "B-1376-014", name: "Timog", cityCode: "C-1376" },
  { code: "B-1376-015", name: "Trinidad", cityCode: "C-1376" },
  { code: "B-1376-016", name: "Balangkas", cityCode: "C-1376" },
  { code: "B-1376-017", name: "Caniogan", cityCode: "C-1376" },
  { code: "B-1376-018", name: "Central", cityCode: "C-1376" },
  { code: "B-1376-019", name: "Cubao", cityCode: "C-1376" },
  { code: "B-1376-020", name: "Diliman", cityCode: "C-1376" },
  { code: "B-1376-021", name: "Dona Isabel", cityCode: "C-1376" },
  { code: "B-1376-022", name: "East Rembo", cityCode: "C-1376" },
  { code: "B-1376-023", name: "Ermita", cityCode: "C-1376" },
  { code: "B-1376-024", name: "Galas", cityCode: "C-1376" },
  { code: "B-1376-025", name: "Hal-hal", cityCode: "C-1376" },
  
  // CALOOCAN - 12 barangays
  { code: "B-1377-001", name: "Barangka", cityCode: "C-1377" },
  { code: "B-1377-002", name: "Calabang", cityCode: "C-1377" },
  { code: "B-1377-003", name: "Camarin", cityCode: "C-1377" },
  { code: "B-1377-004", name: "Kaypian", cityCode: "C-1377" },
  { code: "B-1377-005", name: "Maunlad", cityCode: "C-1377" },
  { code: "B-1377-006", name: "Maypajo", cityCode: "C-1377" },
  { code: "B-1377-007", name: "Monumento", cityCode: "C-1377" },
  { code: "B-1377-008", name: "New Longos", cityCode: "C-1377" },
  { code: "B-1377-009", name: "Parang", cityCode: "C-1377" },
  { code: "B-1377-010", name: "Unang Sigaw", cityCode: "C-1377" },
  { code: "B-1377-011", name: "4th Avenue", cityCode: "C-1377" },
  { code: "B-1377-012", name: "Bagong Barrio", cityCode: "C-1377" },
  
  // MAKATI - 28 barangays
  { code: "B-1341-001", name: "Bangkal", cityCode: "C-1341" },
  { code: "B-1341-002", name: "Bel-Air", cityCode: "C-1341" },
  { code: "B-1341-003", name: "Cembo", cityCode: "C-1341" },
  { code: "B-1341-004", name: "Comembo", cityCode: "C-1341" },
  { code: "B-1341-005", name: "Dasmariñas", cityCode: "C-1341" },
  { code: "B-1341-006", name: "East Rembo", cityCode: "C-1341" },
  { code: "B-1341-007", name: "Guadalupe Viejo", cityCode: "C-1341" },
  { code: "B-1341-008", name: "Karangahan", cityCode: "C-1341" },
  { code: "B-1341-009", name: "Kaunlaran", cityCode: "C-1341" },
  { code: "B-1341-010", name: "Magallanes", cityCode: "C-1341" },
  { code: "B-1341-011", name: "Manggahan", cityCode: "C-1341" },
  { code: "B-1341-012", name: "Olympia", cityCode: "C-1341" },
  { code: "B-1341-013", name: "Palanan", cityCode: "C-1341" },
  { code: "B-1341-014", name: "Pinagbuhatan", cityCode: "C-1341" },
  { code: "B-1341-015", name: "Poblacion", cityCode: "C-1341" },
  { code: "B-1341-016", name: "Rembo", cityCode: "C-1341" },
  { code: "B-1341-017", name: "San Antonio", cityCode: "C-1341" },
  { code: "B-1341-018", name: "San Isidro", cityCode: "C-1341" },
  { code: "B-1341-019", name: "San Lorenzo", cityCode: "C-1341" },
  { code: "B-1341-020", name: "Sentrosa", cityCode: "C-1341" },
  { code: "B-1341-021", name: "South Rembo", cityCode: "C-1341" },
  { code: "B-1341-022", name: "Tejada", cityCode: "C-1341" },
  { code: "B-1341-023", name: "Urdaneta", cityCode: "C-1341" },
  { code: "B-1341-024", name: "Veterans", cityCode: "C-1341" },
  { code: "B-1341-025", name: "West Rembo", cityCode: "C-1341" },
  { code: "B-1341-026", name: "Carmona", cityCode: "C-1341" },
  { code: "B-1341-027", name: "Jazmin", cityCode: "C-1341" },
  { code: "B-1341-028", name: "Sustancia", cityCode: "C-1341" },
  
  // PASIG - 16 barangays
  { code: "B-1350-001", name: "Aguho", cityCode: "C-1350" },
  { code: "B-1350-002", name: "Caruncho", cityCode: "C-1350" },
  { code: "B-1350-003", name: "Caugasan", cityCode: "C-1350" },
  { code: "B-1350-004", name: "Eugenio Lopez", cityCode: "C-1350" },
  { code: "B-1350-005", name: "Kapasigan", cityCode: "C-1350" },
  { code: "B-1350-006", name: "Malinao", cityCode: "C-1350" },
  { code: "B-1350-007", name: "Okada", cityCode: "C-1350" },
  { code: "B-1350-008", name: "Pateros", cityCode: "C-1350" },
  { code: "B-1350-009", name: "Pineda", cityCode: "C-1350" },
  { code: "B-1350-010", name: "Santa Cruz", cityCode: "C-1350" },
  { code: "B-1350-011", name: "Sapang Palay", cityCode: "C-1350" },
  { code: "B-1350-012", name: "Ugong", cityCode: "C-1350" },
  { code: "B-1350-013", name: "Buntis", cityCode: "C-1350" },
  { code: "B-1350-014", name: "Rosario", cityCode: "C-1350" },
  { code: "B-1350-015", name: "Sumilang", cityCode: "C-1350" },
  { code: "B-1350-016", name: "Manggung", cityCode: "C-1350" },
  
  // TAGUIG - 30 barangays
  { code: "B-1353-001", name: "Barangka", cityCode: "C-1353" },
  { code: "B-1353-002", name: "Bagumbayan", cityCode: "C-1353" },
  { code: "B-1353-003", name: "Bambang", cityCode: "C-1353" },
  { code: "B-1353-004", name: "Banilad", cityCode: "C-1353" },
  { code: "B-1353-005", name: "Barcadero", cityCode: "C-1353" },
  { code: "B-1353-006", name: "Callingahan", cityCode: "C-1353" },
  { code: "B-1353-007", name: "Cembo", cityCode: "C-1353" },
  { code: "B-1353-008", name: "Central Bicutan", cityCode: "C-1353" },
  { code: "B-1353-009", name: "Comembo", cityCode: "C-1353" },
  { code: "B-1353-010", name: "Cupang", cityCode: "C-1353" },
  { code: "B-1353-011", name: "Fort Bonifacio", cityCode: "C-1353" },
  { code: "B-1353-012", name: "Hulo", cityCode: "C-1353" },
  { code: "B-1353-013", name: "Katuparan", cityCode: "C-1353" },
  { code: "B-1353-014", name: "Mahallah", cityCode: "C-1353" },
  { code: "B-1353-015", name: "Nagtala", cityCode: "C-1353" },
  { code: "B-1353-016", name: "North Dalanghita", cityCode: "C-1353" },
  { code: "B-1353-017", name: "Napindan", cityCode: "C-1353" },
  { code: "B-1353-018", name: "North Signal Village", cityCode: "C-1353" },
  { code: "B-1353-019", name: "Pinagsama", cityCode: "C-1353" },
  { code: "B-1353-020", name: "Post Proper Taguig", cityCode: "C-1353" },
  { code: "B-1353-021", name: "Rizal", cityCode: "C-1353" },
  { code: "B-1353-022", name: "Sarajang", cityCode: "C-1353" },
  { code: "B-1353-023", name: "South Dalanghita", cityCode: "C-1353" },
  { code: "B-1353-024", name: "South Signal Village", cityCode: "C-1353" },
  { code: "B-1353-025", name: "Ususan", cityCode: "C-1353" },
  { code: "B-1353-026", name: "Wawa", cityCode: "C-1353" },
  { code: "B-1353-027", name: "Western Bicutan", cityCode: "C-1353" },
  { code: "B-1353-028", name: "Niog", cityCode: "C-1353" },
  { code: "B-1353-029", name: "Pateros", cityCode: "C-1353" },
  { code: "B-1353-030", name: "Ligid-Tipas", cityCode: "C-1353" },
  
  // VALENZUELA - 10 barangays
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
  
  // PARAÑAQUE - 16 barangays
  { code: "B-1348-001", name: "Baclaran", cityCode: "C-1348" },
  { code: "B-1348-002", name: "BF15", cityCode: "C-1348" },
  { code: "B-1348-003", name: "BF16", cityCode: "C-1348" },
  { code: "B-1348-004", name: "Bian", cityCode: "C-1348" },
  { code: "B-1348-005", name: "Caltabellota", cityCode: "C-1348" },
  { code: "B-1348-006", name: "Kawit", cityCode: "C-1348" },
  { code: "B-1348-007", name: "La Huerta", cityCode: "C-1348" },
  { code: "B-1348-008", name: "Malanday", cityCode: "C-1348" },
  { code: "B-1348-009", name: "Maricaban", cityCode: "C-1348" },
  { code: "B-1348-010", name: "Merville", cityCode: "C-1348" },
  { code: "B-1348-011", name: "Oas", cityCode: "C-1348" },
  { code: "B-1348-012", name: "Palabungan", cityCode: "C-1348" },
  { code: "B-1348-013", name: "Palatiw", cityCode: "C-1348" },
  { code: "B-1348-014", name: "Santo Domingo", cityCode: "C-1348" },
  { code: "B-1348-015", name: "Tambo", cityCode: "C-1348" },
  { code: "B-1348-016", name: "Wawa", cityCode: "C-1348" },
  
  // CAVITE - Bacoor
  { code: "B-0421-01-001", name: "Banago", cityCode: "C-0421-01" },
  { code: "B-0421-01-002", name: "Bayan", cityCode: "C-0421-01" },
  { code: "B-0421-01-003", name: "Habagat", cityCode: "C-0421-01" },
  { code: "B-0421-01-004", name: "Ilustre", cityCode: "C-0421-01" },
  { code: "B-0421-01-005", name: "Kanluran", cityCode: "C-0421-01" },
  { code: "B-0421-01-006", name: "Kasintahan", cityCode: "C-0421-01" },
  { code: "B-0421-01-007", name: "Luntian", cityCode: "C-0421-01" },
  { code: "B-0421-01-008", name: "Magdalo", cityCode: "C-0421-01" },
  { code: "B-0421-01-009", name: "Molino", cityCode: "C-0421-01" },
  { code: "B-0421-01-010", name: "Perpetual", cityCode: "C-0421-01" },
  
  // CAVITE - Dasmariñas
  { code: "B-0421-03-001", name: "Burol", cityCode: "C-0421-03" },
  { code: "B-0421-03-002", name: "Catalunan Grande", cityCode: "C-0421-03" },
  { code: "B-0421-03-003", name: "Catalunan Pequeño", cityCode: "C-0421-03" },
  { code: "B-0421-03-004", name: "Dasmariñas", cityCode: "C-0421-03" },
  { code: "B-0421-03-005", name: "Kayotanan", cityCode: "C-0421-03" },
  { code: "B-0421-03-006", name: "Longos", cityCode: "C-0421-03" },
  { code: "B-0421-03-007", name: "Paguyngayan", cityCode: "C-0421-03" },
  { code: "B-0421-03-008", name: "Paliparan", cityCode: "C-0421-03" },
  
  // LAGUNA - Calamba
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
  { code: "B-0434-03-011", name: "Halang", cityCode: "C-0434-03" },
  { code: "B-0434-03-012", name: "Kanakanayang", cityCode: "C-0434-03" },
  
  // LAGUNA - Santa Rosa
  { code: "B-0434-06-001", name: "Alon-Alon", cityCode: "C-0434-06" },
  { code: "B-0434-06-002", name: "Aplaya", cityCode: "C-0434-06" },
  { code: "B-0434-06-003", name: "Banlic", cityCode: "C-0434-06" },
  { code: "B-0434-06-004", name: "Burgos", cityCode: "C-0434-06" },
  { code: "B-0434-06-005", name: "Caingin", cityCode: "C-0434-06" },
  { code: "B-0434-06-006", name: "Camanggahan", cityCode: "C-0434-06" },
  { code: "B-0434-06-007", name: "Dalig", cityCode: "C-0434-06" },
  { code: "B-0434-06-008", name: "Daungan", cityCode: "C-0434-06" },
  { code: "B-0434-06-009", name: "Dongan", cityCode: "C-0434-06" },
  { code: "B-0434-06-010", name: "Kanluran", cityCode: "C-0434-06" },
  
  // CEBU CITY - 15 barangays
  { code: "B-0715-01-001", name: "Apas", cityCode: "C-0715-01" },
  { code: "B-0715-01-002", name: "Banilad", cityCode: "C-0715-01" },
  { code: "B-0715-01-003", name: "Basak San Juanico", cityCode: "C-0715-01" },
  { code: "B-0715-01-004", name: "Busay", cityCode: "C-0715-01" },
  { code: "B-0715-01-005", name: "Carreta", cityCode: "C-0715-01" },
  { code: "B-0715-01-006", name: "Colon", cityCode: "C-0715-01" },
  { code: "B-0715-01-007", name: "Congreso", cityCode: "C-0715-01" },
  { code: "B-0715-01-008", name: "Ermita", cityCode: "C-0715-01" },
  { code: "B-0715-01-009", name: "Fort San Pedro", cityCode: "C-0715-01" },
  { code: "B-0715-01-010", name: "Kalubihan", cityCode: "C-0715-01" },
  { code: "B-0715-01-011", name: "Kasbag", cityCode: "C-0715-01" },
  { code: "B-0715-01-012", name: "Lungsod at Pung-ol", cityCode: "C-0715-01" },
  { code: "B-0715-01-013", name: "Mabini", cityCode: "C-0715-01" },
  { code: "B-0715-01-014", name: "Paknaan", cityCode: "C-0715-01" },
  { code: "B-0715-01-015", name: "San Antonio de Padua", cityCode: "C-0715-01" },
  
  // DAVAO CITY - 20 barangays
  { code: "B-1103-01-001", name: "Agdao", cityCode: "C-1103-01" },
  { code: "B-1103-01-002", name: "Agdao", cityCode: "C-1103-01" },
  { code: "B-1103-01-003", name: "Buhangin", cityCode: "C-1103-01" },
  { code: "B-1103-01-004", name: "Bunawan", cityCode: "C-1103-01" },
  { code: "B-1103-01-005", name: "Calinan", cityCode: "C-1103-01" },
  { code: "B-1103-01-006", name: "Catigan", cityCode: "C-1103-01" },
  { code: "B-1103-01-007", name: "Guada", cityCode: "C-1103-01" },
  { code: "B-1103-01-008", name: "Ilang", cityCode: "C-1103-01" },
  { code: "B-1103-01-009", name: "Kakasaguran", cityCode: "C-1103-01" },
  { code: "B-1103-01-010", name: "Malabog", cityCode: "C-1103-01" },
  { code: "B-1103-01-011", name: "Pag-asa", cityCode: "C-1103-01" },
  { code: "B-1103-01-012", name: "Palermo", cityCode: "C-1103-01" },
  { code: "B-1103-01-013", name: "Pampanga", cityCode: "C-1103-01" },
  { code: "B-1103-01-014", name: "Pergola", cityCode: "C-1103-01" },
  { code: "B-1103-01-015", name: "Piapi", cityCode: "C-1103-01" },
  { code: "B-1103-01-016", name: "Poblacion", cityCode: "C-1103-01" },
  { code: "B-1103-01-017", name: "San Antonio", cityCode: "C-1103-01" },
  { code: "B-1103-01-018", name: "Sta. Ana", cityCode: "C-1103-01" },
  { code: "B-1103-01-019", name: "Tagupo", cityCode: "C-1103-01" },
  { code: "B-1103-01-020", name: "Talomo", cityCode: "C-1103-01" },
  
  // ILOILO CITY - 10 barangays
  { code: "B-0638-01-001", name: "Abello", cityCode: "C-0638-01" },
  { code: "B-0638-01-002", name: "Bolilao", cityCode: "C-0638-01" },
  { code: "B-0638-01-003", name: "Buenavista", cityCode: "C-0638-01" },
  { code: "B-0638-01-004", name: "Calugas", cityCode: "C-0638-01" },
  { code: "B-0638-01-005", name: "Capt. Tomas Chaunter Padilla", cityCode: "C-0638-01" },
  { code: "B-0638-01-006", name: "Casing", cityCode: "C-0638-01" },
  { code: "B-0638-01-007", name: "Castilla", cityCode: "C-0638-01" },
  { code: "B-0638-01-008", name: "Colon", cityCode: "C-0638-01" },
  { code: "B-0638-01-009", name: "Dungon Bagong", cityCode: "C-0638-01" },
  { code: "B-0638-01-010", name: "Duran", cityCode: "C-0638-01" },
  
  // BACOLOD CITY - 10 barangays
  { code: "B-0665-01-001", name: "Arenales", cityCode: "C-0665-01" },
  { code: "B-0665-01-002", name: "Bata", cityCode: "C-0665-01" },
  { code: "B-0665-01-003", name: "Cabanalan", cityCode: "C-0665-01" },
  { code: "B-0665-01-004", name: "Cabatangan", cityCode: "C-0665-01" },
  { code: "B-0665-01-005", name: "Dacanlao", cityCode: "C-0665-01" },
  { code: "B-0665-01-006", name: "Estefania", cityCode: "C-0665-01" },
  { code: "B-0665-01-007", name: "Granada", cityCode: "C-0665-01" },
  { code: "B-0665-01-008", name: "Kamuning", cityCode: "C-0665-01" },
  { code: "B-0665-01-009", name: "Mansilingan", cityCode: "C-0665-01" },
  { code: "B-0665-01-010", name: "Medellin", cityCode: "C-0665-01" },
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
