export const chatbotKnowledge = {
  school: {
    title: "School Information",
    schoolName: "Electron College of Technical Education - Malanday",
    description:
      "Electron College of Technical Education - Malanday is a private educational institution offering technical-vocational, senior high school, and college programs focused on practical and industry-based learning.",
    address: "596 McArthur Highway, Malanday, Valenzuela City, Philippines",
    contacts: ["0923-088-9162", "0917-114-1632"],
    officeHours: "Monday to Saturday, 8:00 AM - 5:00 PM",
    socialMedia: "https://www.facebook.com/profile.php?id=61550800050935",
    branches: [
      "Novaliches Main Campus - Quezon City",
      "Malanday Campus - Valenzuela City",
      "Caloocan Campus - Caloocan City",
      "Munoz Campus - Quezon City",
      "Manila Campus - Manila",
      "Pasay Campus - Pasay City",
      "Paranaque Campus - Paranaque City",
      "Marilao Campus - Bulacan",
      "Taguig Campus - Taguig City",
      "Quezon City Campus - E. Rodriguez, Quezon City",
    ],
    notes: ["No verified official public email address is currently available for the Malanday Campus."],
  },
  enrollment: {
    title: "Enrollment Process",
    flow: [
      "Create Account",
      "AI Assessment",
      "Enrollment Form and Document Submission",
      "Review by Registrar",
      "Payment Process",
      "Review by Cashier",
      "Enrollment Confirmation",
    ],
    explanation:
      "Students create an account, complete the AI Assessment, fill out the enrollment form, upload documents, wait for registrar review, complete payment when unlocked, then wait for cashier verification and enrollment confirmation.",
    statuses: {
      "Account Created": "The account is active. The next recommended step is the AI Assessment.",
      "AI Assessment Completed": "The student can review results and proceed to the enrollment form.",
      "Documents Submitted": "The registrar reviews the submitted form and documents.",
      "Documents Verified": "Registrar approval is in progress or complete; payment access depends on voucher/payment rules.",
      "Payment Submitted": "Payment proof or cash payment request has been submitted.",
      "Payment Verified": "The cashier has verified payment and final enrollment processing is underway.",
      Enrolled: "The student has completed the enrollment workflow.",
    },
  },
  documents: {
    title: "Documents",
    required: ["Form 138 (Report Card)", "PSA Birth Certificate", "2x2 ID Pictures", "Grade 10 Diploma"],
    optional: ["Certificate of Good Moral", "ESC Certificate", "Form 137"],
    guidelines:
      "Students must upload clear and readable copies. Blurry, cropped, incomplete, incorrect, or unreadable files may be rejected.",
    rejectionReasons: ["blurry document", "incomplete document", "wrong document uploaded", "cropped document", "unreadable document"],
    reupload:
      "If a document is rejected, open Profile, go to My Documents, upload the corrected file, and wait for registrar review.",
    notifications:
      "Rejected documents include a notification that names the document and explains the rejection reason.",
  },
  payments: {
    title: "Payments",
    methods: ["GCash", "Cash Payment", "Bank Transfer"],
    unlockRule:
      "The payment section unlocks only after the enrollment form and documents are approved by the registrar, unless voucher logic keeps payment locked.",
    online:
      "For GCash or bank transfer, payment account details are shown in the portal. Students enter the reference number and upload a screenshot or image of the payment receipt.",
    cash:
      "For cash payment, a queue number is automatically generated and the student receives a payment schedule showing when and where to pay.",
    cashierWorkflow:
      "The cashier reviews and verifies uploaded payment proof or cash payment completion before enrollment is finalized.",
  },
  voucher: {
    title: "DepEd SHS Voucher Program",
    definition:
      "The DepEd Senior High School Voucher Program provides tuition subsidy assistance to qualified Grade 10 completers.",
    eligibleStudents: [
      "Grade 10 completers from DepEd public schools",
      "Grade 10 completers from State Universities and Colleges or Local Universities and Colleges",
      "Grade 10 completers from private schools who are current ESC grantees",
    ],
    rule:
      "If the student is eligible for the voucher program, the payment section remains locked because tuition is covered by the voucher. If not eligible, payment becomes accessible after registrar approval.",
  },
  assessment: {
    title: "AI Assessment",
    purpose:
      "The AI Assessment helps students identify suitable academic tracks and electives based on aptitude scores and interest scores.",
    topics: ["aptitude scores", "interest scores", "recommended electives", "recommended tracks", "AI-generated recommendations"],
    guidance:
      "Students who are unsure which strand or track fits them should complete the AI Assessment and review the results before enrollment.",
  },
  tracks: {
    title: "Tracks and Electives",
    tracks: ["Academic", "Technical-Professional"],
    academicElectives: [
      "Biology and Physics",
      "Entrepreneurship and Marketing",
      "Psychology and Creative Writing",
      "Media Arts and Visual Arts",
      "Coaching and Fitness",
    ],
    technicalElectives: [
      "ICT and Programming",
      "Cookery and Bread & Pastry",
      "Automotive and Electrical",
      "Agriculture and Fishery",
      "Fitness Training and Coaching",
    ],
  },
  navigation: {
    title: "System Navigation",
    routes: {
      dashboard: "Open Dashboard to view enrollment progress and next steps.",
      assessment: "Open AI Assessment from the dashboard to take the assessment.",
      results: "Open Results to review recommended tracks and electives.",
      enrollment: "Open Enrollment to complete the form and submit requirements.",
      documents: "Open Profile, then My Documents, to upload or re-upload files.",
      payment: "Open Payment after registrar approval to select a payment method.",
      paymentHistory: "Open Payment History to review previous payment submissions.",
      profile: "Open Profile to check or update student information.",
    },
  },
  workflows: {
    title: "Registrar and Cashier Workflow",
    registrar:
      "The registrar reviews enrollment forms, validates submitted documents, checks voucher eligibility, and decides whether the student can proceed to payment.",
    cashier:
      "The cashier reviews payment proof, confirms cash payment completion, verifies payment status, and supports final enrollment confirmation.",
  },
  restrictions: {
    title: "Assistant Restrictions",
    rules: [
      "Do not reveal confidential student information.",
      "Do not answer admin-only operational questions.",
      "Do not manipulate payment records.",
      "Do not generate fake eligibility decisions.",
      "Do not override registrar or cashier decisions.",
      "Politely redirect unrelated or unsupported questions.",
    ],
  },
};

export const chatbotKeywordCategories = {
  school: ["school", "campus", "branch", "address", "location", "contact", "phone", "office hours", "facebook"],
  enrollment: ["enroll", "enrollment", "register", "registration", "application", "process", "next step", "status", "progress"],
  documents: ["document", "requirements", "requirement", "form 138", "form 137", "psa", "birth certificate", "diploma", "good moral", "id picture", "upload", "reupload", "re-upload", "rejected"],
  payments: ["payment", "pay", "gcash", "bank", "cash", "receipt", "reference number", "queue", "cashier", "tuition"],
  voucher: ["voucher", "deped", "free tuition", "eligible", "eligibility", "esc", "subsidy", "public school", "suc", "luc"],
  assessment: ["assessment", "ai assessment", "test", "aptitude", "interest", "recommendation", "recommended", "strand", "track", "elective"],
  navigation: ["where", "how do i go", "open", "page", "tab", "dashboard", "profile", "my documents", "payment history", "results"],
  workflows: ["registrar", "review", "approval", "approved", "verify", "verified", "cashier", "pending"],
};

export const chatbotFaqs = [
  {
    id: "enrollment-process",
    category: "enrollment",
    question: "How do I enroll?",
    keywords: ["how do i enroll", "how enroll", "how to enroll", "enrollment process", "start enrollment", "apply"],
    answer:
      "To enroll, follow this flow: Create Account -> AI Assessment -> Enrollment Form and Documents -> Registrar Review -> Payment if required -> Cashier Review -> Enrollment Confirmation.",
  },
  {
    id: "required-documents",
    category: "documents",
    question: "What are the required documents?",
    keywords: ["required documents", "requirements", "what documents", "form 138", "psa", "birth certificate"],
    answer:
      "Required documents include Form 138, PSA Birth Certificate, 2x2 ID Pictures, and Grade 10 Diploma. Good Moral, ESC Certificate, and Form 137 may be to-follow or optional depending on your case.",
  },
  {
    id: "reupload-documents",
    category: "documents",
    question: "How do I re-upload documents?",
    keywords: ["reupload", "re-upload", "upload again", "rejected document", "document rejected", "replace document"],
    answer:
      "If a document was rejected, open Profile, go to My Documents, upload a clearer or corrected file, then wait for the registrar to review it again.",
  },
  {
    id: "payment-methods",
    category: "payments",
    question: "How do I pay?",
    keywords: ["how do i pay", "how pay", "payment methods", "gcash", "bank transfer", "cash payment", "tuition"],
    answer:
      "Available payment methods are GCash, bank transfer, and cash payment. Payment opens only after registrar approval, unless you are covered by the SHS voucher program.",
  },
  {
    id: "voucher-eligibility",
    category: "voucher",
    question: "Am I eligible for voucher?",
    keywords: ["voucher", "eligible", "eligibility", "free tuition", "deped", "esc"],
    answer:
      "Voucher-eligible students include Grade 10 completers from DepEd public schools, SUCs/LUCs, and private school Grade 10 completers who are current ESC grantees. The registrar verifies eligibility.",
  },
  {
    id: "assessment-purpose",
    category: "assessment",
    question: "What is the AI Assessment?",
    keywords: ["assessment", "ai assessment", "strand fits", "what strand", "electives", "aptitude"],
    answer:
      "The AI Assessment reviews your aptitude and interest scores to recommend a suitable track and electives. It is designed to guide your enrollment choice.",
  },
  {
    id: "payment-locked",
    category: "payments",
    question: "Why is payment locked?",
    keywords: ["payment locked", "cannot pay", "payment unavailable", "payment disabled"],
    answer:
      "Payment stays locked until the registrar approves your enrollment form and documents. It may also remain locked if you are confirmed eligible for the DepEd SHS Voucher Program.",
  },
];

export function normalizeChatbotText(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s&-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function findDirectFaq(message = "") {
  const normalized = normalizeChatbotText(message);
  if (!normalized) return null;

  let bestMatch = null;
  let bestScore = 0;

  chatbotFaqs.forEach((faq) => {
    const keywordHits = faq.keywords.filter((keyword) => normalized.includes(normalizeChatbotText(keyword))).length;
    const categoryHits = (chatbotKeywordCategories[faq.category] || []).filter((keyword) =>
      normalized.includes(normalizeChatbotText(keyword))
    ).length;
    const score = keywordHits * 3 + categoryHits;

    if (score > bestScore) {
      bestMatch = faq;
      bestScore = score;
    }
  });

  return bestScore >= 3 ? { ...bestMatch, confidence: bestScore } : null;
}

function stringifyKnowledgeSection(section) {
  if (!section) return "";
  return Object.entries(section)
    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join("; ") : typeof value === "object" ? JSON.stringify(value) : value}`)
    .join("\n");
}

export function retrieveChatbotKnowledge(message = "", limit = 3) {
  const normalized = normalizeChatbotText(message);
  const scoredCategories = Object.entries(chatbotKeywordCategories)
    .map(([category, keywords]) => {
      const score = keywords.reduce((total, keyword) => {
        return normalized.includes(normalizeChatbotText(keyword)) ? total + 1 : total;
      }, 0);
      return { category, score };
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);

  const selected = scoredCategories.length
    ? scoredCategories
    : [
        { category: "enrollment", score: 1 },
        { category: "navigation", score: 1 },
      ];

  return selected.map(({ category }) => ({
    category,
    title: chatbotKnowledge[category]?.title || category,
    content: stringifyKnowledgeSection(chatbotKnowledge[category]),
  }));
}

export function isEnrollmentRelated(message = "") {
  const normalized = normalizeChatbotText(message);
  return Object.values(chatbotKeywordCategories).some((keywords) =>
    keywords.some((keyword) => normalized.includes(normalizeChatbotText(keyword)))
  );
}
