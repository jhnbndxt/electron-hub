UPDATE EXISTING SYSTEM: ASSESSMENT PAGE + RESULT PAGE (WITH FULL QUESTIONS & LOGIC)

OBJECTIVE:
Redesign ONLY the Assessment Page and Result Page based on:
- NCAE-based assessment
- 2 Tracks: Academic / Technical-Professional
- 2 Electives recommendation

----------------------------------------

🔹 ASSESSMENT PAGE (FULL CONTENT)

HEADER:
Title: Track Recommendation Assessment Powered by AI
Subtitle: Answer the following to determine your recommended track and electives  

Progress Bar Steps:
1. Verbal
2. Math
3. Science
4. Logical
5. Interests

----------------------------------------

SECTION 1: VERBAL (1–10)

1. rapid = ?
a slow b fast c weak d late  (ANS: b)

2. assist = ?
a help b ignore c stop d delay  (ANS: a)

3. She _ to school
a go b goes c going d gone  (ANS: b)

4. Correct sentence
a He don’t like math  
b He doesn’t likes math  
c He doesn’t like math  
d He not like math  (ANS: c)

5. "Technology helps students learn faster"
Main idea?
a dislike  
b improves learning  
c difficult  
d lazy  (ANS: b)

6. Teacher : School :: Doctor : _
a medicine b hospital c patient d clinic  (ANS: b)

7. Opposite of increase
a reduce b expand c grow d rise  (ANS: a)

8. They _ dinner
a eat b eats c ate d eating  (ANS: c)

9. Incorrect sentence
a She sings well  
b They plays outside  
c We study  
d I read  (ANS: b)

10. manageable = ?
a impossible b easy c controllable d useless  (ANS: c)

----------------------------------------

SECTION 2: MATHEMATICS (11–20)

11. 7(5+3)=?
a48 b56 c64 d40  (ANS: b)

12. 2x+4=10
a2 b3 c4 d5  (ANS: b)

13. 45% of 200
a80 b85 c90 d95  (ANS: c)

14. 18/24
a2/3 b3/4 c1/2 d4/5  (ANS: b)

15. Triangle area (10,5)
a25 b50 c30 d15  (ANS: a)

16. 2,4,8,16
a20 b24 c32 d30  (ANS: c)

17. 4x+3=15
a2 b3 c4 d5  (ANS: b)

18. Prime number
a15 b21 c29 d35  (ANS: c)

19. Speed 60km/1hr
a60 b30 c120 d90  (ANS: a)

20. Triangle angle sum
a90 b180 c270 d360  (ANS: b)

----------------------------------------

SECTION 3: SCIENCE (21–30)

21. lungs → breathing (b)  
22. day/night → earth rotation (b)  
23. renewable → solar (c)  
24. gravity → pulling force (b)  
25. heart pumps blood (c)  
26. ice heated → melts (b)  
27. NOT matter → energy (d)  
28. plants → photosynthesis (c)  
29. force → newton (b)  
30. conductor → metal (c)  

----------------------------------------

SECTION 4: LOGICAL (31–40)

31. 3,6,9,12 → 15 (b)  
32. odd → car (d)  
33. knife → cut (a)  
34. A,C,E,G → I (b)  
35. cats → some animals (b)  
36. 1,1,2,3,5 → 8 (c)  
37. odd → banana (d)  
38. RIGHT → THGIR (a)  
39. 10:100 :: 5:25 (b)  
40. 2,5,10,17 → 26 (c)  

----------------------------------------

SECTION 5: INTEREST (41–55)

Scale:
1 Strongly Disagree
2 Disagree
3 Neutral
4 Agree
5 Strongly Agree

41. I enjoy solving math problems  
42. I like reading/writing  
43. I enjoy science experiments  
44. I like hands-on work  
45. I like business  
46. I like computers/tech  
47. I like helping people  
48. I enjoy cooking  
49. I like arts/design  
50. I like outdoor work  
51. I prefer practical work  
52. I enjoy analyzing problems  
53. I like teamwork  
54. I like machines  
55. I like physical activity  

----------------------------------------

🔹 RESULT PAGE

HEADER:
Your Track Recommendation

----------------------------------------

SECTION 1: TRACK RESULT

Display BIG CARD:

Recommended Track:
[ Academic Track ] OR [ Technical-Professional Track ]

----------------------------------------

SECTION 2: ELECTIVES

Display 2 CARDS:

Example:
Biology  
Physics  

----------------------------------------

SECTION 3: SCORE BARS

Verbal  
Math  
Science  
Logical  

----------------------------------------

SECTION 4: AI EXPLANATION

Dynamic text:
"You were recommended [Track] because of your strengths in [top domains] and interests in [top clusters]."

----------------------------------------

🔹 BACKEND LOGIC CONNECTION

SCORING:

VA = correct/10 * 100  
MA = correct/10 * 100  
SA = correct/10 * 100  
LRA = correct/10 * 100  

----------------------------------------

INTEREST CLUSTERS:

Academic = avg(41,42,43,52)20  
Tech = avg(44,46,54)20  
Business = 4520  
Helping = avg(47,53)20  
Home = 4820  
Creative = 4920  
Outdoor = 5020  
Physical = 5520  
Practical = 5120  

----------------------------------------

TRACK DECISION:

Academic Score =
(VA0.25)+(MA0.25)+(SA0.25)+(LRA0.15)+(Academic0.10)

TechPro Score =
(Tech0.30)+(Practical0.20)+(Home0.15)+(Physical0.10)+(Outdoor0.10)+(LRA0.10)+(MA0.05)

IF Academic Score ≥ TechPro Score → Academic  
ELSE → TechPro  

----------------------------------------

ELECTIVES LOGIC:

IF Academic:

STEM = (MA0.4)+(SA0.4)+(LRA0.2)  
BUSINESS = (MA0.4)+(Business0.4)+(VA0.2)  
HUMANITIES = (VA0.5)+(Helping0.3)+(LRA0.2)  
CREATIVE = (Creative0.6)+(VA0.2)+(LRA0.2)  
SPORTS = (Physical0.6)+(SA0.2)+(LRA0.2)  

TOP 2 → assign electives:
STEM → Biology, Physics  
BUSINESS → Entrepreneurship, Marketing  
HUMANITIES → Psychology, Creative Writing  
CREATIVE → Media Arts, Visual Arts  
SPORTS → Coaching, Fitness  

----------------------------------------

IF TechPro:

ICT = (Tech0.5)+(LRA0.3)+(MA0.2)  
HOME = (Home0.6)+(Practical0.4)  
INDUSTRIAL = (Tech0.4)+(Practical0.4)+(MA0.2)  
AGRI = (Outdoor0.6)+(Practical0.4)  
PHYSICAL = (Physical0.7)+(Practical0.3)  

TOP 2 → assign electives:
ICT → ICT, Programming  
HOME → Cookery, Bread & Pastry  
INDUSTRIAL → Automotive, Electrical  
AGRI → Agriculture, Fishery  
PHYSICAL → Fitness Training, Coaching  

----------------------------------------

FINAL DISPLAY:

Recommended Track: ____

Suggested Electives:
1. ____
2. ____

----------------------------------------

END OF FIGMA PROMPT