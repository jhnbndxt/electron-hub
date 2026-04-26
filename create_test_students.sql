-- ============================================================================
-- CREATE 100 TEST STUDENT ACCOUNTS WITH ENROLLED STATUS
-- ============================================================================
-- This script creates 100 test student accounts with realistic Filipino names,
-- enrolled status, and no section assigned.
-- ============================================================================

-- First, create the users
INSERT INTO users (
  email,
  password_hash,
  full_name,
  first_name,
  last_name,
  middle_name,
  sex,
  role,
  status,
  contact_number,
  created_at
) VALUES
-- Batch 1-20
('juan.dela.cruz001@test.com', '$2b$10$dummyhashfordev', 'Juan Dela Cruz', 'Juan', 'Dela Cruz', 'Garcia', 'Male', 'student', 'active', '09123456701', CURRENT_TIMESTAMP),
('maria.santos002@test.com', '$2b$10$dummyhashfordev', 'Maria Santos', 'Maria', 'Santos', 'Reyes', 'Female', 'student', 'active', '09123456702', CURRENT_TIMESTAMP),
('jose.reyes003@test.com', '$2b$10$dummyhashfordev', 'Jose Reyes', 'Jose', 'Reyes', 'Cruz', 'Male', 'student', 'active', '09123456703', CURRENT_TIMESTAMP),
('anna.garcia004@test.com', '$2b$10$dummyhashfordev', 'Anna Garcia', 'Anna', 'Garcia', 'Santos', 'Female', 'student', 'active', '09123456704', CURRENT_TIMESTAMP),
('pedro.martinez005@test.com', '$2b$10$dummyhashfordev', 'Pedro Martinez', 'Pedro', 'Martinez', 'Lopez', 'Male', 'student', 'active', '09123456705', CURRENT_TIMESTAMP),
('rosa.lopez006@test.com', '$2b$10$dummyhashfordev', 'Rosa Lopez', 'Rosa', 'Lopez', 'Torres', 'Female', 'student', 'active', '09123456706', CURRENT_TIMESTAMP),
('carlos.gonzalez007@test.com', '$2b$10$dummyhashfordev', 'Carlos Gonzalez', 'Carlos', 'Gonzalez', 'Hernandez', 'Male', 'student', 'active', '09123456707', CURRENT_TIMESTAMP),
('teresa.hernandez008@test.com', '$2b$10$dummyhashfordev', 'Teresa Hernandez', 'Teresa', 'Hernandez', 'Flores', 'Female', 'student', 'active', '09123456708', CURRENT_TIMESTAMP),
('antonio.rodriguez009@test.com', '$2b$10$dummyhashfordev', 'Antonio Rodriguez', 'Antonio', 'Rodriguez', 'Morales', 'Male', 'student', 'active', '09123456709', CURRENT_TIMESTAMP),
('carmen.morales010@test.com', '$2b$10$dummyhashfordev', 'Carmen Morales', 'Carmen', 'Morales', 'Ramirez', 'Female', 'student', 'active', '09123456710', CURRENT_TIMESTAMP),
('francisco.ramirez011@test.com', '$2b$10$dummyhashfordev', 'Francisco Ramirez', 'Francisco', 'Ramirez', 'Torres', 'Male', 'student', 'active', '09123456711', CURRENT_TIMESTAMP),
('isabel.torres012@test.com', '$2b$10$dummyhashfordev', 'Isabel Torres', 'Isabel', 'Torres', 'Flores', 'Female', 'student', 'active', '09123456712', CURRENT_TIMESTAMP),
('manuel.flores013@test.com', '$2b$10$dummyhashfordev', 'Manuel Flores', 'Manuel', 'Flores', 'Rivera', 'Male', 'student', 'active', '09123456713', CURRENT_TIMESTAMP),
('pilar.rivera014@test.com', '$2b$10$dummyhashfordev', 'Pilar Rivera', 'Pilar', 'Rivera', 'Gomez', 'Female', 'student', 'active', '09123456714', CURRENT_TIMESTAMP),
('jesus.gomez015@test.com', '$2b$10$dummyhashfordev', 'Jesus Gomez', 'Jesus', 'Gomez', 'Diaz', 'Male', 'student', 'active', '09123456715', CURRENT_TIMESTAMP),
('dolores.diaz016@test.com', '$2b$10$dummyhashfordev', 'Dolores Diaz', 'Dolores', 'Diaz', 'Morales', 'Female', 'student', 'active', '09123456716', CURRENT_TIMESTAMP),
('angel.sanchez017@test.com', '$2b$10$dummyhashfordev', 'Angel Sanchez', 'Angel', 'Sanchez', 'Romero', 'Male', 'student', 'active', '09123456717', CURRENT_TIMESTAMP),
('luisa.romero018@test.com', '$2b$10$dummyhashfordev', 'Luisa Romero', 'Luisa', 'Romero', 'Navarro', 'Female', 'student', 'active', '09123456718', CURRENT_TIMESTAMP),
('fernando.navarro019@test.com', '$2b$10$dummyhashfordev', 'Fernando Navarro', 'Fernando', 'Navarro', 'Jimenez', 'Male', 'student', 'active', '09123456719', CURRENT_TIMESTAMP),
('concepcion.jimenez020@test.com', '$2b$10$dummyhashfordev', 'Concepcion Jimenez', 'Concepcion', 'Jimenez', 'Ruiz', 'Female', 'student', 'active', '09123456720', CURRENT_TIMESTAMP),

-- Batch 21-40
('miguel.ruiz021@test.com', '$2b$10$dummyhashfordev', 'Miguel Ruiz', 'Miguel', 'Ruiz', 'Alvarez', 'Male', 'student', 'active', '09123456721', CURRENT_TIMESTAMP),
('mercedes.alvarez022@test.com', '$2b$10$dummyhashfordev', 'Mercedes Alvarez', 'Mercedes', 'Alvarez', 'Moreno', 'Female', 'student', 'active', '09123456722', CURRENT_TIMESTAMP),
('raul.moreno023@test.com', '$2b$10$dummyhashfordev', 'Raul Moreno', 'Raul', 'Moreno', 'Alonso', 'Male', 'student', 'active', '09123456723', CURRENT_TIMESTAMP),
('elena.alonso024@test.com', '$2b$10$dummyhashfordev', 'Elena Alonso', 'Elena', 'Alonso', 'Gutierrez', 'Female', 'student', 'active', '09123456724', CURRENT_TIMESTAMP),
('alberto.gutierrez025@test.com', '$2b$10$dummyhashfordev', 'Alberto Gutierrez', 'Alberto', 'Gutierrez', 'Fernandez', 'Male', 'student', 'active', '09123456725', CURRENT_TIMESTAMP),
('beatriz.fernandez026@test.com', '$2b$10$dummyhashfordev', 'Beatriz Fernandez', 'Beatriz', 'Fernandez', 'Dominguez', 'Female', 'student', 'active', '09123456726', CURRENT_TIMESTAMP),
('ramon.dominguez027@test.com', '$2b$10$dummyhashfordev', 'Ramon Dominguez', 'Ramon', 'Dominguez', 'Vazquez', 'Male', 'student', 'active', '09123456727', CURRENT_TIMESTAMP),
('consuelo.vazquez028@test.com', '$2b$10$dummyhashfordev', 'Consuelo Vazquez', 'Consuelo', 'Vazquez', 'Perez', 'Female', 'student', 'active', '09123456728', CURRENT_TIMESTAMP),
('enrique.perez029@test.com', '$2b$10$dummyhashfordev', 'Enrique Perez', 'Enrique', 'Perez', 'Sanz', 'Male', 'student', 'active', '09123456729', CURRENT_TIMESTAMP),
('gloria.sanz030@test.com', '$2b$10$dummyhashfordev', 'Gloria Sanz', 'Gloria', 'Sanz', 'Gil', 'Female', 'student', 'active', '09123456730', CURRENT_TIMESTAMP),
('victor.gil031@test.com', '$2b$10$dummyhashfordev', 'Victor Gil', 'Victor', 'Gil', 'Lopez', 'Male', 'student', 'active', '09123456731', CURRENT_TIMESTAMP),
('ines.lopez032@test.com', '$2b$10$dummyhashfordev', 'Ines Lopez', 'Ines', 'Lopez', 'Serrano', 'Female', 'student', 'active', '09123456732', CURRENT_TIMESTAMP),
('eduardo.serrano033@test.com', '$2b$10$dummyhashfordev', 'Eduardo Serrano', 'Eduardo', 'Serrano', 'Blanco', 'Male', 'student', 'active', '09123456733', CURRENT_TIMESTAMP),
('silvia.blanco034@test.com', '$2b$10$dummyhashfordev', 'Silvia Blanco', 'Silvia', 'Blanco', 'Castro', 'Female', 'student', 'active', '09123456734', CURRENT_TIMESTAMP),
('gonzalo.castro035@test.com', '$2b$10$dummyhashfordev', 'Gonzalo Castro', 'Gonzalo', 'Castro', 'Ortega', 'Male', 'student', 'active', '09123456735', CURRENT_TIMESTAMP),
('nuria.ortega036@test.com', '$2b$10$dummyhashfordev', 'Nuria Ortega', 'Nuria', 'Ortega', 'Delgado', 'Female', 'student', 'active', '09123456736', CURRENT_TIMESTAMP),
('felipe.delgado037@test.com', '$2b$10$dummyhashfordev', 'Felipe Delgado', 'Felipe', 'Delgado', 'Rubio', 'Male', 'student', 'active', '09123456737', CURRENT_TIMESTAMP),
('esperanza.rubio038@test.com', '$2b$10$dummyhashfordev', 'Esperanza Rubio', 'Esperanza', 'Rubio', 'Marin', 'Female', 'student', 'active', '09123456738', CURRENT_TIMESTAMP),
('javier.marin039@test.com', '$2b$10$dummyhashfordev', 'Javier Marin', 'Javier', 'Marin', 'Santiago', 'Male', 'student', 'active', '09123456739', CURRENT_TIMESTAMP),
('olga.santiago040@test.com', '$2b$10$dummyhashfordev', 'Olga Santiago', 'Olga', 'Santiago', 'Nunez', 'Female', 'student', 'active', '09123456740', CURRENT_TIMESTAMP),

-- Batch 41-60
('adrian.nunez041@test.com', '$2b$10$dummyhashfordev', 'Adrian Nunez', 'Adrian', 'Nunez', 'Herrera', 'Male', 'student', 'active', '09123456741', CURRENT_TIMESTAMP),
('sonia.herrera042@test.com', '$2b$10$dummyhashfordev', 'Sonia Herrera', 'Sonia', 'Herrera', 'Medina', 'Female', 'student', 'active', '09123456742', CURRENT_TIMESTAMP),
('sergio.medina043@test.com', '$2b$10$dummyhashfordev', 'Sergio Medina', 'Sergio', 'Medina', 'Cortes', 'Male', 'student', 'active', '09123456743', CURRENT_TIMESTAMP),
('lourdes.cortes044@test.com', '$2b$10$dummyhashfordev', 'Lourdes Cortes', 'Lourdes', 'Cortes', 'Castillo', 'Female', 'student', 'active', '09123456744', CURRENT_TIMESTAMP),
('marcos.castillo045@test.com', '$2b$10$dummyhashfordev', 'Marcos Castillo', 'Marcos', 'Castillo', 'Guerrero', 'Male', 'student', 'active', '09123456745', CURRENT_TIMESTAMP),
('matilde.guerrero046@test.com', '$2b$10$dummyhashfordev', 'Matilde Guerrero', 'Matilde', 'Guerrero', 'Arias', 'Female', 'student', 'active', '09123456746', CURRENT_TIMESTAMP),
('julio.arias047@test.com', '$2b$10$dummyhashfordev', 'Julio Arias', 'Julio', 'Arias', 'Vega', 'Male', 'student', 'active', '09123456747', CURRENT_TIMESTAMP),
('encarnacion.vega048@test.com', '$2b$10$dummyhashfordev', 'Encarnacion Vega', 'Encarnacion', 'Vega', 'Campos', 'Female', 'student', 'active', '09123456748', CURRENT_TIMESTAMP),
('roberto.campos049@test.com', '$2b$10$dummyhashfordev', 'Roberto Campos', 'Roberto', 'Campos', 'Santos', 'Male', 'student', 'active', '09123456749', CURRENT_TIMESTAMP),
('angelica.santos050@test.com', '$2b$10$dummyhashfordev', 'Angelica Santos', 'Angelica', 'Santos', 'Ramos', 'Female', 'student', 'active', '09123456750', CURRENT_TIMESTAMP),
('daniel.ramos051@test.com', '$2b$10$dummyhashfordev', 'Daniel Ramos', 'Daniel', 'Ramos', 'Mendez', 'Male', 'student', 'active', '09123456751', CURRENT_TIMESTAMP),
('paula.mendez052@test.com', '$2b$10$dummyhashfordev', 'Paula Mendez', 'Paula', 'Mendez', 'Cabrera', 'Female', 'student', 'active', '09123456752', CURRENT_TIMESTAMP),
('hector.cabrera053@test.com', '$2b$10$dummyhashfordev', 'Hector Cabrera', 'Hector', 'Cabrera', 'Leon', 'Male', 'student', 'active', '09123456753', CURRENT_TIMESTAMP),
('margarita.leon054@test.com', '$2b$10$dummyhashfordev', 'Margarita Leon', 'Margarita', 'Leon', 'Ortiz', 'Female', 'student', 'active', '09123456754', CURRENT_TIMESTAMP),
('ricardo.ortiz055@test.com', '$2b$10$dummyhashfordev', 'Ricardo Ortiz', 'Ricardo', 'Ortiz', 'Rojas', 'Male', 'student', 'active', '09123456755', CURRENT_TIMESTAMP),
('susana.rojas056@test.com', '$2b$10$dummyhashfordev', 'Susana Rojas', 'Susana', 'Rojas', 'Luna', 'Female', 'student', 'active', '09123456756', CURRENT_TIMESTAMP),
('gabriel.luna057@test.com', '$2b$10$dummyhashfordev', 'Gabriel Luna', 'Gabriel', 'Luna', 'Molina', 'Male', 'student', 'active', '09123456757', CURRENT_TIMESTAMP),
('cecilia.molina058@test.com', '$2b$10$dummyhashfordev', 'Cecilia Molina', 'Cecilia', 'Molina', 'Delgado', 'Female', 'student', 'active', '09123456758', CURRENT_TIMESTAMP),
('martin.delgado059@test.com', '$2b$10$dummyhashfordev', 'Martin Delgado', 'Martin', 'Delgado', 'Silva', 'Male', 'student', 'active', '09123456759', CURRENT_TIMESTAMP),
('raquel.silva060@test.com', '$2b$10$dummyhashfordev', 'Raquel Silva', 'Raquel', 'Silva', 'Morales', 'Female', 'student', 'active', '09123456760', CURRENT_TIMESTAMP),

-- Batch 61-80
('pablo.morales061@test.com', '$2b$10$dummyhashfordev', 'Pablo Morales', 'Pablo', 'Morales', 'Vargas', 'Male', 'student', 'active', '09123456761', CURRENT_TIMESTAMP),
('virginia.vargas062@test.com', '$2b$10$dummyhashfordev', 'Virginia Vargas', 'Virginia', 'Vargas', 'Rios', 'Female', 'student', 'active', '09123456762', CURRENT_TIMESTAMP),
('salvador.rios063@test.com', '$2b$10$dummyhashfordev', 'Salvador Rios', 'Salvador', 'Rios', 'Carrasco', 'Male', 'student', 'active', '09123456763', CURRENT_TIMESTAMP),
('amparo.carrasco064@test.com', '$2b$10$dummyhashfordev', 'Amparo Carrasco', 'Amparo', 'Carrasco', 'Herrera', 'Female', 'student', 'active', '09123456764', CURRENT_TIMESTAMP),
('tomas.herrera065@test.com', '$2b$10$dummyhashfordev', 'Tomas Herrera', 'Tomas', 'Herrera', 'Montoya', 'Male', 'student', 'active', '09123456765', CURRENT_TIMESTAMP),
('guadalupe.montoya066@test.com', '$2b$10$dummyhashfordev', 'Guadalupe Montoya', 'Guadalupe', 'Montoya', 'Salazar', 'Female', 'student', 'active', '09123456766', CURRENT_TIMESTAMP),
('raul.salazar067@test.com', '$2b$10$dummyhashfordev', 'Raul Salazar', 'Raul', 'Salazar', 'Contreras', 'Male', 'student', 'active', '09123456767', CURRENT_TIMESTAMP),
('remedios.contreras068@test.com', '$2b$10$dummyhashfordev', 'Remedios Contreras', 'Remedios', 'Contreras', 'Aguilar', 'Female', 'student', 'active', '09123456768', CURRENT_TIMESTAMP),
('emilio.aguilar069@test.com', '$2b$10$dummyhashfordev', 'Emilio Aguilar', 'Emilio', 'Aguilar', 'Velasco', 'Male', 'student', 'active', '09123456769', CURRENT_TIMESTAMP),
('trinidad.velasco070@test.com', '$2b$10$dummyhashfordev', 'Trinidad Velasco', 'Trinidad', 'Velasco', 'Mendoza', 'Female', 'student', 'active', '09123456770', CURRENT_TIMESTAMP),
('federico.mendoza071@test.com', '$2b$10$dummyhashfordev', 'Federico Mendoza', 'Federico', 'Mendoza', 'Soto', 'Male', 'student', 'active', '09123456771', CURRENT_TIMESTAMP),
('asuncion.soto072@test.com', '$2b$10$dummyhashfordev', 'Asuncion Soto', 'Asuncion', 'Soto', 'Del Valle', 'Female', 'student', 'active', '09123456772', CURRENT_TIMESTAMP),
('esteban.delvalle073@test.com', '$2b$10$dummyhashfordev', 'Esteban Del Valle', 'Esteban', 'Del Valle', 'Pena', 'Male', 'student', 'active', '09123456773', CURRENT_TIMESTAMP),
('felisa.pena074@test.com', '$2b$10$dummyhashfordev', 'Felisa Pena', 'Felisa', 'Pena', 'Cervantes', 'Female', 'student', 'active', '09123456774', CURRENT_TIMESTAMP),
('alvaro.cervantes075@test.com', '$2b$10$dummyhashfordev', 'Alvaro Cervantes', 'Alvaro', 'Cervantes', 'Gallegos', 'Male', 'student', 'active', '09123456775', CURRENT_TIMESTAMP),
('nieves.gallegos076@test.com', '$2b$10$dummyhashfordev', 'Nieves Gallegos', 'Nieves', 'Gallegos', 'Juarez', 'Female', 'student', 'active', '09123456776', CURRENT_TIMESTAMP),
('benito.juarez077@test.com', '$2b$10$dummyhashfordev', 'Benito Juarez', 'Benito', 'Juarez', 'Rivas', 'Male', 'student', 'active', '09123456777', CURRENT_TIMESTAMP),
('visitacion.rivas078@test.com', '$2b$10$dummyhashfordev', 'Visitacion Rivas', 'Visitacion', 'Rivas', 'Zamora', 'Female', 'student', 'active', '09123456778', CURRENT_TIMESTAMP),
('gerardo.zamora079@test.com', '$2b$10$dummyhashfordev', 'Gerardo Zamora', 'Gerardo', 'Zamora', 'Solis', 'Male', 'student', 'active', '09123456779', CURRENT_TIMESTAMP),
('anastasia.solis080@test.com', '$2b$10$dummyhashfordev', 'Anastasia Solis', 'Anastasia', 'Solis', 'Mora', 'Female', 'student', 'active', '09123456780', CURRENT_TIMESTAMP),

-- Batch 81-100
('leonardo.mora081@test.com', '$2b$10$dummyhashfordev', 'Leonardo Mora', 'Leonardo', 'Mora', 'Vargas', 'Male', 'student', 'active', '09123456781', CURRENT_TIMESTAMP),
('eugenia.vargas082@test.com', '$2b$10$dummyhashfordev', 'Eugenia Vargas', 'Eugenia', 'Vargas', 'Espinosa', 'Female', 'student', 'active', '09123456782', CURRENT_TIMESTAMP),
('cesar.espinosa083@test.com', '$2b$10$dummyhashfordev', 'Cesar Espinosa', 'Cesar', 'Espinosa', 'Lara', 'Male', 'student', 'active', '09123456783', CURRENT_TIMESTAMP),
('genoveva.lara084@test.com', '$2b$10$dummyhashfordev', 'Genoveva Lara', 'Genoveva', 'Lara', 'Avila', 'Female', 'student', 'active', '09123456784', CURRENT_TIMESTAMP),
('horacio.avila085@test.com', '$2b$10$dummyhashfordev', 'Horacio Avila', 'Horacio', 'Avila', 'Rangel', 'Male', 'student', 'active', '09123456785', CURRENT_TIMESTAMP),
('lilia.rangel086@test.com', '$2b$10$dummyhashfordev', 'Lilia Rangel', 'Lilia', 'Rangel', 'Corona', 'Female', 'student', 'active', '09123456786', CURRENT_TIMESTAMP),
('octavio.corona087@test.com', '$2b$10$dummyhashfordev', 'Octavio Corona', 'Octavio', 'Corona', 'Valdez', 'Male', 'student', 'active', '09123456787', CURRENT_TIMESTAMP),
('teodora.valdez088@test.com', '$2b$10$dummyhashfordev', 'Teodora Valdez', 'Teodora', 'Valdez', 'Maldonado', 'Female', 'student', 'active', '09123456788', CURRENT_TIMESTAMP),
('leopoldo.maldonado089@test.com', '$2b$10$dummyhashfordev', 'Leopoldo Maldonado', 'Leopoldo', 'Maldonado', 'Quintero', 'Male', 'student', 'active', '09123456789', CURRENT_TIMESTAMP),
('basilia.quintero090@test.com', '$2b$10$dummyhashfordev', 'Basilia Quintero', 'Basilia', 'Quintero', 'Esquivel', 'Female', 'student', 'active', '09123456790', CURRENT_TIMESTAMP),
('eusebio.esquivel091@test.com', '$2b$10$dummyhashfordev', 'Eusebio Esquivel', 'Eusebio', 'Esquivel', 'Salinas', 'Male', 'student', 'active', '09123456791', CURRENT_TIMESTAMP),
('clarisa.salinas092@test.com', '$2b$10$dummyhashfordev', 'Clarisa Salinas', 'Clarisa', 'Salinas', 'Lugo', 'Female', 'student', 'active', '09123456792', CURRENT_TIMESTAMP),
('bonifacio.lugo093@test.com', '$2b$10$dummyhashfordev', 'Bonifacio Lugo', 'Bonifacio', 'Lugo', 'Mendez', 'Male', 'student', 'active', '09123456793', CURRENT_TIMESTAMP),
('maximina.mendez094@test.com', '$2b$10$dummyhashfordev', 'Maximina Mendez', 'Maximina', 'Mendez', 'Villanueva', 'Female', 'student', 'active', '09123456794', CURRENT_TIMESTAMP),
('porfirio.villanueva095@test.com', '$2b$10$dummyhashfordev', 'Porfirio Villanueva', 'Porfirio', 'Villanueva', 'Zuniga', 'Male', 'student', 'active', '09123456795', CURRENT_TIMESTAMP),
('gertrudis.zuniga096@test.com', '$2b$10$dummyhashfordev', 'Gertrudis Zuniga', 'Gertrudis', 'Zuniga', 'Tapia', 'Female', 'student', 'active', '09123456796', CURRENT_TIMESTAMP),
('narciso.tapia097@test.com', '$2b$10$dummyhashfordev', 'Narciso Tapia', 'Narciso', 'Tapia', 'Escobar', 'Male', 'student', 'active', '09123456797', CURRENT_TIMESTAMP),
('berta.escobar098@test.com', '$2b$10$dummyhashfordev', 'Berta Escobar', 'Berta', 'Escobar', 'Pineda', 'Female', 'student', 'active', '09123456798', CURRENT_TIMESTAMP),
('apolinar.pineda099@test.com', '$2b$10$dummyhashfordev', 'Apolinar Pineda', 'Apolinar', 'Pineda', 'Gallardo', 'Male', 'student', 'active', '09123456799', CURRENT_TIMESTAMP),
('casimira.gallardo100@test.com', '$2b$10$dummyhashfordev', 'Casimira Gallardo', 'Casimira', 'Gallardo', 'Robles', 'Female', 'student', 'active', '09123456800', CURRENT_TIMESTAMP);

-- Now create enrollments for these students with 'enrolled' status
-- Note: This assumes the users were inserted successfully above
INSERT INTO enrollments (
  student_id,
  status,
  admission_type,
  last_name,
  first_name,
  middle_name,
  sex,
  email,
  contact_number,
  birth_date,
  region,
  province,
  city,
  barangay,
  home_address,
  father_last_name,
  father_first_name,
  mother_last_name,
  mother_first_name,
  preferred_track,
  year_level,
  submitted_at,
  approved_at,
  created_at
) 
SELECT 
  u.id,
  'enrolled',
  'New Student',
  u.last_name,
  u.first_name,
  u.middle_name,
  u.sex,
  u.email,
  u.contact_number,
  (CURRENT_DATE - INTERVAL '18 years' + (random() * INTERVAL '2 years'))::date,
  'NCR',
  'Metro Manila',
  'Quezon City',
  'Various',
  '123 Test Street, Barangay Test, Quezon City',
  'TestFather',
  'Father' || RIGHT(u.email, 3),
  'TestMother',
  'Mother' || RIGHT(u.email, 3),
  CASE WHEN random() < 0.5 THEN 'STEM' ELSE 'HUMSS' END,
  'Grade 11',
  CURRENT_TIMESTAMP - INTERVAL '1 day',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM users u 
WHERE u.email LIKE '%@test.com' 
AND u.role = 'student'
AND u.created_at >= CURRENT_TIMESTAMP - INTERVAL '1 minute';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Count total test students created
-- SELECT COUNT(*) FROM users WHERE email LIKE '%@test.com';

-- Count enrolled students
-- SELECT COUNT(*) FROM enrollments WHERE status = 'enrolled' AND student_id IN (SELECT id FROM users WHERE email LIKE '%@test.com');

-- Check for section assignments (should be 0)
-- SELECT COUNT(*) FROM section_assignments WHERE enrollment_id IN (SELECT id FROM enrollments WHERE status = 'enrolled' AND student_id IN (SELECT id FROM users WHERE email LIKE '%@test.com'));</content>
<parameter name="filePath">c:\Users\USER\Downloads\electron-hub-main (2)\electron-hub-main\create_test_students.sql