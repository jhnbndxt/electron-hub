UPDATE ENROLLMENT FORM (FINAL VERSION – NEW SHS CURRICULUM WITH AI RESULT LINKING AND DOCUMENT SUBMISSION)

OBJECTIVE:
- ALL fields are REQUIRED unless explicitly stated OPTIONAL
- Replace STRAND with TRACK (Academic / Technical-Professional)
- AI Assessment Result MUST be retrieved from RESULT PAGE (not recomputed)
- Student can follow or override AI recommendation
- Include document upload section
- Include professional notice for physical submission

----------------------------------------

🔹 GLOBAL RULES

- All fields = REQUIRED
- Show validation: "This field is required"
- Conditional fields only appear when triggered
- Prevent invalid or duplicate inputs

----------------------------------------

🔹 PAGE 1: BASIC INFORMATION

Admission Type (REQUIRED)
• Dropdown:
  - New Regular
  - Transferee
  - Returnee

----------------------------------------

Previous Student ID Number (REQUIRED if Returnee)
• Text box
• Visible ONLY if Admission Type = Returnee

----------------------------------------

LRN (REQUIRED)
• Numeric input
• Max: 12 digits

----------------------------------------

Are you a working student? (REQUIRED)
• Checkbox (Yes/No)

----------------------------------------

Full Name (ALL REQUIRED)
• Last Name — text
• First Name — text
• Middle Name — text
• Suffix — dropdown:
  - None, Jr., Sr., II, III, IV

----------------------------------------

Sex (REQUIRED)
• Dropdown: Male / Female

----------------------------------------

Civil Status (REQUIRED)
• Dropdown:
  - Single
  - Married
  - Widowed
  - Separated

----------------------------------------

Religion (REQUIRED)
• Text box

----------------------------------------

Nationality (REQUIRED)
• Dropdown (default: Filipino)

----------------------------------------

Disability (REQUIRED)
• Dropdown:
  - Not Applicable
  - Visual Impairment
  - Hearing Impairment
  - Speech Impairment
  - Mobility Impairment
  - Cognitive Impairment
  - Psychosocial Disability
  - Chronic Illness
  - Multiple Disabilities
  - Others → show text box (REQUIRED if selected)

----------------------------------------

Indigenous People Group (REQUIRED)
• Dropdown:
  - Not Applicable
  - Aeta
  - Badjao
  - Igorot
  - Lumad
  - Mangyan
  - Manobo
  - Tausug
  - T’boli
  - Yakan
  - Others → show text box (REQUIRED if selected)

----------------------------------------

Birthday (REQUIRED)
• Date picker

----------------------------------------

Contact Information (ALL REQUIRED)
• Email Address — email input (validate format)
• Contact Number — text
• Facebook / Messenger Name — text

----------------------------------------

🔹 PAGE 2: ADDRESS (ALL REQUIRED)

Region — dropdown  
Province — dropdown (dependent)  
Municipality / City — dropdown (dependent)  
Barangay — dropdown (dependent)  
Home / Street — text  

----------------------------------------

🔹 PAGE 3: PARENT / GUARDIAN INFORMATION

👨 Father (ALL REQUIRED)
• Last Name
• First Name
• Middle Name
• Occupation
• Contact Number

----------------------------------------

👩 Mother (ALL REQUIRED)
• Maiden Name
• Last Name
• First Name
• Middle Name
• Occupation
• Contact Number

----------------------------------------

🧍 Parent / Guardian Source (REQUIRED)
• Checkbox:
  - Same as Father’s Information
  - Same as Mother’s Information

----------------------------------------

🧾 Guardian Details (REQUIRED if not same as parents)
• Last Name
• First Name
• Middle Name
• Occupation
• Contact Number

----------------------------------------

4Ps Member? (REQUIRED)
• Checkbox (Yes/No)

----------------------------------------

🔹 PAGE 4: ENROLLMENT INFORMATION

----------------------------------------

🔹 AI ASSESSMENT RESULT (READ-ONLY / LINKED)

SOURCE:
This section MUST retrieve data from the RESULT PAGE generated after the assessment.

IMPORTANT:
- DO NOT recompute values
- Use stored result from assessment

DISPLAY:

Recommended Track:
• Academic Track OR Technical-Professional Track

Recommended Electives:
• Elective 1 — (from result page)
• Elective 2 — (from result page)

----------------------------------------

🔹 STUDENT CHOICE (EDITABLE)

Preferred Track (REQUIRED)
• Dropdown:
  - Academic Track
  - Technical-Professional Track

(Default = AI Recommended Track)

----------------------------------------

Elective Selection (REQUIRED)

Elective 1 — dropdown  
Elective 2 — dropdown  

----------------------------------------

ELECTIVE OPTIONS:

IF Preferred Track = Academic:
- Biology
- Physics
- Psychology
- Creative Writing
- Entrepreneurship
- Media Arts
- Sports

IF Preferred Track = Technical-Professional:
- ICT
- Programming
- Cookery
- Bread & Pastry
- Automotive
- Electrical
- Agriculture
- Fishery

----------------------------------------

VALIDATION RULES:
• Elective 1 ≠ Elective 2
• Filter electives based on selected Track
• Default electives = AI Recommended Electives

----------------------------------------

Year Level (REQUIRED)

IF Admission Type = New Regular:
• Fixed: Grade 11

IF Transferee / Returnee:
• Dropdown:
  - Grade 11
  - Grade 12

----------------------------------------

🔹 PAGE 5: EDUCATIONAL BACKGROUND

Primary (REQUIRED)
• School Name
• Year Graduated

----------------------------------------

Secondary (REQUIRED)
• School Name
• Year Graduated

----------------------------------------

Grade 10 Adviser (REQUIRED if New Regular)
• Text box

----------------------------------------

🔹 PAGE 6: DOCUMENT UPLOAD

TITLE:
Required Documents

SUBTEXT:
Please upload clear and readable copies of the following documents:

----------------------------------------

UPLOAD FIELDS:

• Form 138 (Report Card) — REQUIRED  
• Form 137 — REQUIRED  
• Certificate of Good Moral — REQUIRED  
• PSA Authenticated Birth Certificate (2 copies) — REQUIRED  
• 2"x2" ID Picture (White Background, 2 copies) — REQUIRED  
• Photocopy of Grade 10 Diploma — REQUIRED  
• ESC Certificate — OPTIONAL (only if from private JHS)

----------------------------------------

FILE RULES:
- Format: PDF, JPG, PNG
- Must be clear and readable
- Max file size: (set by system)

----------------------------------------

NOTICE:

All uploaded documents must also be submitted as physical hard copies to the Registrar’s Office upon acceptance or confirmation of enrollment.

----------------------------------------

🔹 PAGE 7: SUMMARY

• Display ALL entered data (read-only)
• Display uploaded documents

----------------------------------------

CONFIRMATION (REQUIRED)
☑ I confirm that all information and uploaded documents are true and correct

----------------------------------------

SUBMIT BUTTON
• Disabled until all required fields are completed
• On click → validate all inputs

----------------------------------------

🔹 SYSTEM FLOW

Assessment Page →
Result Page (AI generates Track + Electives) →
Enrollment Form retrieves result →
Student completes form →
Uploads documents →
Submits →
Registrar (physical submission)

----------------------------------------

🔹 IMPORTANT CHANGES

REMOVE:
• All STRAND references (STEM, ABM, HUMSS, etc.)

REPLACE WITH:
• Track (Academic / Technical-Professional)
• Electives

----------------------------------------

FINAL BEHAVIOR:

✔ AI result is generated ONCE (assessment)  
✔ Enrollment form ONLY retrieves result  
✔ No recomputation  
✔ Student can override selection  
✔ Documents submitted online + physically  

----------------------------------------