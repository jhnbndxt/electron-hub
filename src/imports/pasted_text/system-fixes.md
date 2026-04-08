SYSTEM FIX: DASHBOARD PROGRESS + ENROLLMENT UI + REAL ADDRESS IMPLEMENTATION + VALIDATIONS

OBJECTIVE:
Fix and enhance the system to ensure:
1. Dashboard Enrollment Journey updates dynamically after assessment
2. Enrollment Form progress bar UI is fixed (no cropped icons)
3. Address section uses REAL Philippine address hierarchy (PSGC standard)
4. Proper validation for inputs (phone number, birthday, etc.)
5. Remove informal elements (no emojis in parent/guardian section)
6. Show advisory if AI Assessment is not yet taken (DO NOT block enrollment)
7. Ensure correct system flow from Assessment → Result → Dashboard → Enrollment

----------------------------------------

🔹 ISSUE 1: DASHBOARD PROGRESS BAR NOT UPDATING

PROBLEM:
User already completed assessment but dashboard still shows "Account Created"

----------------------------------------

FIX:

Make the "Enrollment Journey" progress bar DYNAMIC.

----------------------------------------

STEPS (KEEP SAME UI):

1. Account Created  
2. AI Assessment Completed  
3. Documents Submitted  
4. Documents Verified  
5. Payment Submitted  
6. Payment Verified  
7. Enrolled  

----------------------------------------

LOGIC:

IF account_created = true  
→ Step 1 = Completed  

IF assessment_completed = true  
→ Step 2 = Completed  

IF enrollment_submitted = true  
→ Step 3 = Completed  

IF documents_verified = true  
→ Step 4 = Completed  

IF payment_submitted = true  
→ Step 5 = Completed  

IF payment_verified = true  
→ Step 6 = Completed  

IF enrolled = true  
→ Step 7 = Completed  

----------------------------------------

IMPORTANT:

- assessment_completed MUST be TRUE only AFTER:
  • User finishes assessment
  • Result page (Track + Electives) is generated

- Progress bar must update immediately after assessment completion

----------------------------------------

UI BEHAVIOR:

Completed Step:
- Highlighted

Current Step:
- Active circle

Upcoming Step:
- Gray/inactive

----------------------------------------

STATUS MESSAGE UPDATE:

IF Assessment Completed:
"Assessment completed. You may now proceed to the enrollment process."

----------------------------------------

----------------------------------------

🔹 ISSUE 2: ENROLLMENT FORM PROGRESS BAR (CROPPED ICON)

PROBLEM:
Active icon is cut or cropped

----------------------------------------

FIX:

- Increase container height  
- Add padding to icons  
- Remove clipping  

----------------------------------------

CSS FIX:

Container:
- height: auto or increased height  
- overflow: visible  

Icons:
- proper sizing  
- spacing between steps  

----------------------------------------

EXPECTED RESULT:

✔ Icons fully visible  
✔ No cropping  
✔ Proper alignment  

----------------------------------------

----------------------------------------

🔹 ISSUE 3: ADDRESS SECTION (REAL PH ADDRESS – PSGC STANDARD)

PROBLEM:
Address dropdown is static / inaccurate

----------------------------------------

FIX:

Implement Philippine address hierarchy:

Region → Province → City/Municipality → Barangay  

----------------------------------------

DYNAMIC BEHAVIOR:

STEP 1:
Select REGION

STEP 2:
Load PROVINCES

STEP 3:
Select PROVINCE

STEP 4:
Load CITIES

STEP 5:
Select CITY

STEP 6:
Load BARANGAYS

----------------------------------------

SPECIAL CASE:

IF Region = NCR:
- Skip Province
- Directly show Cities

----------------------------------------

EXAMPLE:

Region: NCR  
City: Valenzuela  

Barangay dropdown must show:
- Arkong Bato  
- Balangkas  
- Bignay  
- Dalandanan  
- Karuhatan  
- Malinta  
- Marulas  
- Maysan  
- Paso de Blas  
- Ugong  

----------------------------------------

IMPORTANT LOGIC:

- Changing Region resets all dependent fields  
- Changing Province resets City and Barangay  
- Changing City resets Barangay  

----------------------------------------

VALIDATION:

✔ All required  
✔ Dropdown only  
✔ Correct hierarchy  

----------------------------------------

----------------------------------------

🔹 ISSUE 4: INPUT VALIDATIONS

PHONE NUMBER:

- Must start with 09  
- Must be 11 digits  
- Numeric only  

ERROR:
"Please enter a valid Philippine mobile number (09XXXXXXXXX)."

----------------------------------------

BIRTHDAY:

- No future dates allowed  
- Max date = current date  

ERROR:
"Please enter a valid birthdate. Future dates are not allowed."

----------------------------------------

----------------------------------------

🔹 ISSUE 5: REMOVE UNPROFESSIONAL ELEMENTS

Replace:
"👨 Father" → "Father"  
"👩 Mother" → "Mother"  

----------------------------------------

----------------------------------------

🔹 ISSUE 6: AI ASSESSMENT ADVISORY (NOT REQUIRED)

PROBLEM:
Student can proceed without taking assessment

----------------------------------------

FIX:

IF assessment_completed = false:

Show advisory message in Enrollment Section:

"It is recommended to complete the AI Assessment to receive personalized track and elective recommendations before finalizing your enrollment."

----------------------------------------

NOTE:

- DO NOT block enrollment  
- DO NOT disable submission  
- Advisory only  

----------------------------------------

----------------------------------------

🔹 SYSTEM FLOW

Assessment →
Result →
Dashboard →
Enrollment

----------------------------------------

RULES:

✔ No recomputation of AI result  
✔ Use existing result data  
✔ Maintain consistency  

----------------------------------------

----------------------------------------

🔹 FINAL EXPECTED BEHAVIOR

✔ Dashboard updates after assessment  
✔ Progress bar reflects actual status  
✔ Enrollment UI fixed  
✔ Address system is real and dynamic  
✔ Input validations enforced  
✔ Clean professional UI  
✔ Advisory shown if no assessment (but still allowed)  

----------------------------------------
