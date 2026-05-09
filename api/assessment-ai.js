import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

export default async function handler(request, response) {
  if (request.method === "OPTIONS") {
    return sendJson(response, 200, { ok: true });
  }

  if (request.method !== "POST") {
    response.setHeader("Allow", "POST, OPTIONS");
    return sendJson(response, 405, { error: "Method not allowed" });
  }

  if (!process.env.OPENAI_API_KEY) {
    return sendJson(response, 500, { error: "OPENAI_API_KEY is not configured" });
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

ACADEMIC ELECTIVES:

STEM:
- Biology 1
- Biology 2
- Chemistry 1
- Chemistry 2
- Physics 1
- Physics 2
- Earth and Space Science 1
- Earth and Space Science 2
- Pre-Calculus 1
- Pre-Calculus 2
- Trigonometry 1
- Trigonometry 2
- Finite Mathematics 1
- Finite Mathematics 2
- Research Methods
- Design and Innovation
- Empowerment Technologies

BUSINESS AND ENTREPRENEURSHIP:
- Basic Accounting
- Business Economics
- Business Finance and Taxation
- Contemporary Marketing
- Entrepreneurship
- Introduction to Organization and Management

ARTS, SOCIAL SCIENCES, AND HUMANITIES:
- Creative Writing
- Philippine Politics and Governance
- Disciplines and Ideas in the Social Sciences
- Disciplines and Ideas in the Applied Social Sciences
- Introduction to World Religions and Belief Systems
- Trends, Networks, and Critical Thinking
- Community Engagement

SPORTS, HEALTH, AND WELLNESS:
- Human Movement 1: Basic Anatomy in Sports and Exercise
- Human Movement 2: Motor Skills Development
- Physical Education 1: Fitness and Recreation
- Physical Education 2: Sports and Dance
- Sports Activity Management
- Sports Coaching
- Sports Officiating

TECHPRO ELECTIVES:

AGRI-FISHERY BUSINESS AND FOOD INNOVATION:
- Agricultural Crops Production
- Agro-Entrepreneurship
- Aquaculture
- Fish Capture
- Food Processing
- Organic Agriculture Production
- Poultry Production
- Ruminants Production
- Swine Production

AESTHETIC, WELLNESS, AND HUMAN CARE:
- Aesthetic Services / Beauty Care
- Hairdressing
- Caregiving (Adult Care)
- Caregiving (Child Care)

ICT SUPPORT AND COMPUTER PROGRAMMING TECHNOLOGIES:
- Broadband Installation
- Computer Programming (.NET Technology)
- Computer Programming (Java)
- Computer Programming (Oracle Database)
- Computer Systems Servicing
- Contact Center Services

AUTOMOTIVE AND SMALL ENGINE TECHNOLOGIES:
- Automotive Servicing – Electrical Repair
- Automotive Servicing – Engine and Chassis Repairs
- Driving and Automotive Servicing
- Motorcycle and Small Engine Servicing

CONSTRUCTION AND BUILDING TECHNOLOGY:
- Carpentry
- Construction Operation
- Manual Metal Arc Welding
- Technical Drafting

CREATIVE ARTS AND DESIGN TECHNOLOGY:
- Animation
- Illustration
- Visual Graphic Design

HOSPITALITY AND TOURISM:
- Bakery Operations
- Events Management Services
- Food and Beverage Operations
- Hotel Operation – Front Office Services
- Hotel Operation – Housekeeping Services
- Kitchen Operations
- Tourism Services

ARTISANRY AND CREATIVE ENTERPRISE:
- Garments Artisanry
- Handicrafts and Weaving

INDUSTRIAL TECHNOLOGIES:
- Commercial Air-Conditioning Installation and Servicing
- Domestic Refrigeration and Air-Conditioning Servicing
- Electrical Installation and Maintenance
- Electronics Product and Assembly Servicing

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

  "suggestedCollegeCourses": []
}

Requirements:
- trackExplanation must explain WHY the track fits the student based on aptitude and interests.
- elective1Explanation must explain WHY elective 1 matches the student's strengths and interests.
- elective2Explanation must explain WHY elective 2 matches the student's strengths and interests.
- overallAnalysis must provide a longer career/academic assessment summary.
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

    const result = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      instructions:
        "You are Electron Hub's AI assessment assistant. Return only valid JSON with no markdown formatting.",
      input,
    });

    const reply = String(result.output_text || "")
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
