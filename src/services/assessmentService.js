import { supabase } from '../supabase';

/**
 * Assessment Service
 * Handles all assessment question management with Supabase
 */

// Get all assessment questions
export const getAssessmentQuestions = async () => {
  try {
    const { data, error } = await supabase
      .from('assessment_questions')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('Get questions error:', error);
      return { error: error.message, data: null };
    }

    return { error: null, data: data || [] };
  } catch (error) {
    console.error('Get questions error:', error);
    return { error: error.message, data: null };
  }
};

// Get questions by category
export const getQuestionsByCategory = async (category) => {
  try {
    const { data, error } = await supabase
      .from('assessment_questions')
      .select('*')
      .eq('category', category)
      .order('id', { ascending: true });

    if (error) {
      console.error('Get category questions error:', error);
      return { error: error.message, data: null };
    }

    return { error: null, data: data || [] };
  } catch (error) {
    console.error('Get category questions error:', error);
    return { error: error.message, data: null };
  }
};

// Get single question
export const getQuestion = async (questionId) => {
  try {
    const { data, error } = await supabase
      .from('assessment_questions')
      .select('*')
      .eq('id', questionId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Get question error:', error);
      return { error: error.message, data: null };
    }

    return { error: null, data: data || null };
  } catch (error) {
    console.error('Get question error:', error);
    return { error: error.message, data: null };
  }
};

// Create new question
export const createQuestion = async (questionData) => {
  try {
    const { data, error } = await supabase
      .from('assessment_questions')
      .insert({
        question: questionData.question,
        options: questionData.options || [],
        correct_answer: questionData.correctAnswer !== undefined ? questionData.correctAnswer : null,
        category: questionData.category,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Create question error:', error);
      return { error: error.message, data: null };
    }

    return { error: null, data };
  } catch (error) {
    console.error('Create question error:', error);
    return { error: error.message, data: null };
  }
};

// Update question
export const updateQuestion = async (questionId, questionData) => {
  try {
    const { data, error } = await supabase
      .from('assessment_questions')
      .update({
        question: questionData.question,
        options: questionData.options || [],
        correct_answer: questionData.correctAnswer !== undefined ? questionData.correctAnswer : null,
        category: questionData.category,
        updated_at: new Date().toISOString(),
      })
      .eq('id', questionId)
      .select()
      .single();

    if (error) {
      console.error('Update question error:', error);
      return { error: error.message, data: null };
    }

    // Log the change
    await createQuestionLog(questionId, 'UPDATED', questionData);

    return { error: null, data };
  } catch (error) {
    console.error('Update question error:', error);
    return { error: error.message, data: null };
  }
};

// Delete question
export const deleteQuestion = async (questionId) => {
  try {
    const { error } = await supabase
      .from('assessment_questions')
      .delete()
      .eq('id', questionId);

    if (error) {
      console.error('Delete question error:', error);
      return { error: error.message };
    }

    // Log the deletion
    await createQuestionLog(questionId, 'DELETED', {});

    return { error: null };
  } catch (error) {
    console.error('Delete question error:', error);
    return { error: error.message };
  }
};

// Bulk create questions (initialize)
export const initializeQuestions = async (questions) => {
  try {
    const formattedQuestions = questions.map((q) => ({
      question: q.question,
      options: q.options || [],
      correct_answer: q.correctAnswer !== undefined ? q.correctAnswer : null,
      category: q.category,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from('assessment_questions')
      .insert(formattedQuestions)
      .select();

    if (error) {
      console.error('Initialize questions error:', error);
      return { error: error.message, data: null };
    }

    return { error: null, data };
  } catch (error) {
    console.error('Initialize questions error:', error);
    return { error: error.message, data: null };
  }
};

// Create question log (audit trail)
export const createQuestionLog = async (questionId, action, data) => {
  try {
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: 'admin',
        action: `QUESTION_${action}`,
        details: `Assessment question ${action.toLowerCase()}: ID ${questionId}`,
        status: 'info',
        timestamp: new Date().toISOString(),
      });

    if (error) {
      console.error('Log error:', error);
    }
  } catch (error) {
    console.error('Log error:', error);
  }
};

// Get question logs
export const getQuestionLogs = async (limit = 50) => {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .like('action', '%QUESTION%')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Get logs error:', error);
      return { error: error.message, data: null };
    }

    return { error: null, data: data || [] };
  } catch (error) {
    console.error('Get logs error:', error);
    return { error: error.message, data: null };
  }
};

// Check if questions exist in database
export const questionsExistInDatabase = async () => {
  try {
    const { count, error } = await supabase
      .from('assessment_questions')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Check error:', error);
      return false;
    }

    return count > 0;
  } catch (error) {
    console.error('Check error:', error);
    return false;
  }
};

// Get default 75 assessment questions (initialization template)
export const getDefaultAssessmentQuestions = () => {
  return [
    // VERBAL (15 questions)
    { question: 'rapid = ?', options: ['slow', 'fast', 'weak', 'late'], correctAnswer: 1, category: 'Verbal' },
    { question: 'assist = ?', options: ['help', 'ignore', 'stop', 'delay'], correctAnswer: 0, category: 'Verbal' },
    { question: 'She _ to school', options: ['go', 'goes', 'going', 'gone'], correctAnswer: 1, category: 'Verbal' },
    { question: 'Correct sentence', options: ["He don't like math", "He doesn't likes math", "He doesn't like math", "He not like math"], correctAnswer: 2, category: 'Verbal' },
    { question: '"Technology helps students learn faster" - Main idea?', options: ['dislike', 'improves learning', 'difficult', 'lazy'], correctAnswer: 1, category: 'Verbal' },
    { question: 'Teacher : School :: Doctor : _', options: ['medicine', 'hospital', 'patient', 'clinic'], correctAnswer: 1, category: 'Verbal' },
    { question: 'Opposite of increase', options: ['reduce', 'expand', 'grow', 'rise'], correctAnswer: 0, category: 'Verbal' },
    { question: 'They _ dinner', options: ['eat', 'eats', 'ate', 'eating'], correctAnswer: 2, category: 'Verbal' },
    { question: 'Incorrect sentence', options: ['She sings well', 'They plays outside', 'We study', 'I read'], correctAnswer: 1, category: 'Verbal' },
    { question: 'manageable = ?', options: ['impossible', 'easy', 'controllable', 'useless'], correctAnswer: 2, category: 'Verbal' },
    { question: 'Which word is spelled correctly?', options: ['accomodate', 'accommodate', 'acommodate', 'acomodate'], correctAnswer: 1, category: 'Verbal' },
    { question: 'What does "ambiguous" mean?', options: ['clear', 'unclear', 'definite', 'obvious'], correctAnswer: 1, category: 'Verbal' },
    { question: 'Find the synonym of "fortunate"', options: ['lucky', 'unlucky', 'smart', 'rich'], correctAnswer: 0, category: 'Verbal' },
    { question: 'Complete: "The cake taste__"', options: ['good', 'goods', 'goodly', 'goodness'], correctAnswer: 0, category: 'Verbal' },
    { question: 'Which is a complete sentence?', options: ['Running fast', 'The dog runs', 'Because of rain', 'Such a beautiful'], correctAnswer: 1, category: 'Verbal' },

    // MATH (15 questions)
    { question: '2 + 2 = ?', options: ['3', '4', '5', '6'], correctAnswer: 1, category: 'Math' },
    { question: '5 × 6 = ?', options: ['25', '30', '35', '40'], correctAnswer: 1, category: 'Math' },
    { question: '100 ÷ 5 = ?', options: ['15', '20', '25', '30'], correctAnswer: 1, category: 'Math' },
    { question: 'What is 15% of 80?', options: ['10', '12', '15', '20'], correctAnswer: 1, category: 'Math' },
    { question: 'If x + 3 = 10, then x = ?', options: ['5', '7', '10', '13'], correctAnswer: 1, category: 'Math' },
    { question: 'What is the square of 7?', options: ['42', '49', '56', '63'], correctAnswer: 1, category: 'Math' },
    { question: '3² + 4² = ?', options: ['12', '19', '25', '34'], correctAnswer: 2, category: 'Math' },
    { question: 'What is 25% of 200?', options: ['25', '50', '75', '100'], correctAnswer: 1, category: 'Math' },
    { question: 'If 2x = 16, then x = ?', options: ['6', '8', '10', '12'], correctAnswer: 1, category: 'Math' },
    { question: 'What is the mean of 2, 4, 6, 8?', options: ['4', '5', '6', '7'], correctAnswer: 1, category: 'Math' },
    { question: '12 × 11 = ?', options: ['120', '121', '132', '144'], correctAnswer: 2, category: 'Math' },
    { question: 'What is 10% of 500?', options: ['25', '50', '100', '250'], correctAnswer: 2, category: 'Math' },
    { question: 'If 3x - 2 = 7, then x = ?', options: ['2', '3', '4', '5'], correctAnswer: 2, category: 'Math' },
    { question: 'What is 1/2 + 1/4?', options: ['1/6', '3/4', '1/3', '2/3'], correctAnswer: 1, category: 'Math' },
    { question: '99 + 1 = ?', options: ['98', '99', '100', '101'], correctAnswer: 2, category: 'Math' },

    // SCIENCE (15 questions)
    { question: 'What is H2O?', options: ['Hydrogen', 'Water', 'Salt', 'Sugar'], correctAnswer: 1, category: 'Science' },
    { question: 'How many bones in human body?', options: ['186', '206', '226', '246'], correctAnswer: 1, category: 'Science' },
    { question: 'What is photosynthesis?', options: ['Plant respiration', 'Light energy to food', 'Water absorption', 'Root growth'], correctAnswer: 1, category: 'Science' },
    { question: 'What is the powerhouse of the cell?', options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Chloroplast'], correctAnswer: 1, category: 'Science' },
    { question: 'Which planet is closest to the sun?', options: ['Venus', 'Mercury', 'Earth', 'Mars'], correctAnswer: 1, category: 'Science' },
    { question: 'What is the speed of light?', options: ['100,000 km/s', '300,000 km/s', '500,000 km/s', '1,000,000 km/s'], correctAnswer: 1, category: 'Science' },
    { question: 'What is gravity?', options: ['Light force', 'Attractive force', 'Repulsive force', 'Magnetic force'], correctAnswer: 1, category: 'Science' },
    { question: 'How many chambers in heart?', options: ['2', '3', '4', '5'], correctAnswer: 2, category: 'Science' },
    { question: 'What does DNA stand for?', options: ['Dynamic Nucleic Acid', 'Deoxyribonucleic Acid', 'Distributed Network Area', 'Direct Nuclear Acids'], correctAnswer: 1, category: 'Science' },
    { question: 'What is the largest organ?', options: ['Brain', 'Heart', 'Liver', 'Skin'], correctAnswer: 3, category: 'Science' },
    { question: 'Which is a renewable resource?', options: ['Coal', 'Oil', 'Solar energy', 'Natural gas'], correctAnswer: 2, category: 'Science' },
    { question: 'What is temperature measured in?', options: ['Watts', 'Celsius', 'Joules', 'Volts'], correctAnswer: 1, category: 'Science' },
    { question: 'What gas do plants absorb?', options: ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Helium'], correctAnswer: 2, category: 'Science' },
    { question: 'What is an atom?', options: ['Smallest particle of element', 'Water droplet', 'Light particle', 'Energy unit'], correctAnswer: 0, category: 'Science' },
    { question: 'What do lungs do?', options: ['digest food', 'help breathing', 'pump blood', 'filter toxins'], correctAnswer: 1, category: 'Science' },

    // LOGICAL (15 questions)
    { question: 'If A > B and B > C, then?', options: ['A > C', 'A < C', 'A = C', 'Cannot determine'], correctAnswer: 0, category: 'Logical' },
    { question: 'Pattern: 2, 4, 6, 8, ?', options: ['9', '10', '11', '12'], correctAnswer: 1, category: 'Logical' },
    { question: 'What comes next: A, B, C, D, ?', options: ['E', 'F', 'G', 'H'], correctAnswer: 0, category: 'Logical' },
    { question: 'Pattern: 1, 1, 2, 3, 5, 8, ?', options: ['11', '12', '13', '14'], correctAnswer: 2, category: 'Logical' },
    { question: 'If all dogs are animals, and Fido is a dog, then?', options: ['Fido is an animal', 'Fido is not an animal', 'Some animals are dogs', 'Cannot determine'], correctAnswer: 0, category: 'Logical' },
    { question: 'Which number is odd?', options: ['2', '4', '6', '7'], correctAnswer: 3, category: 'Logical' },
    { question: 'What is the next prime number after 7?', options: ['8', '9', '10', '11'], correctAnswer: 3, category: 'Logical' },
    { question: 'If X = 5 and Y = 3, what is X + Y?', options: ['6', '8', '10', '12'], correctAnswer: 1, category: 'Logical' },
    { question: 'Which shape has 4 equal sides?', options: ['Triangle', 'Circle', 'Square', 'Pentagon'], correctAnswer: 2, category: 'Logical' },
    { question: 'What is logical reasoning used for?', options: ['Solving problems', 'Entertainment', 'Exercise', 'All of above'], correctAnswer: 0, category: 'Logical' },
    { question: 'Pattern: Z, Y, X, W, ?', options: ['V', 'U', 'T', 'S'], correctAnswer: 0, category: 'Logical' },
    { question: 'If 3 cats catch 3 mice in 3 days, how many mice do 9 cats catch in 9 days?', options: ['3', '9', '27', '81'], correctAnswer: 2, category: 'Logical' },
    { question: 'Which number comes next: 5, 10, 20, 40, ?', options: ['60', '70', '80', '90'], correctAnswer: 2, category: 'Logical' },
    { question: 'If today is Monday, what day is it in 10 days?', options: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'], correctAnswer: 3, category: 'Logical' },
    { question: 'What is 2^5?', options: ['16', '32', '64', '128'], correctAnswer: 1, category: 'Logical' },

    // INTERESTS (15 questions)
    { question: 'Which subject would you like to study in depth?', options: ['Physics', 'Computer Science', 'Biology', 'Literature'], correctAnswer: 1, category: 'Interests' },
    { question: 'What motivates you most?', options: ['Understanding theories', 'Creating solutions', 'Expressing ideas', 'Helping communities'], correctAnswer: 1, category: 'Interests' },
    { question: 'Which environment do you prefer?', options: ['Laboratory', 'Workshop', 'Library', 'Office'], correctAnswer: 1, category: 'Interests' },
    { question: 'What type of projects interest you?', options: ['Research projects', 'Building prototypes', 'Writing essays', 'Organizing events'], correctAnswer: 1, category: 'Interests' },
    { question: 'Select your interest', options: ['STEM', 'Humanities', 'Business', 'Arts'], correctAnswer: 0, category: 'Interests' },
    { question: 'What interests you most?', options: ['Science discovery', 'Technology innovation', 'Social services', 'Creative expression'], correctAnswer: 0, category: 'Interests' },
    { question: 'Career goal?', options: ['Researcher', 'Engineer', 'Doctor', 'Entrepreneur'], correctAnswer: 0, category: 'Interests' },
    { question: 'Which skill do you want to improve?', options: ['Technical', 'Leadership', 'Communication', 'Problem-solving'], correctAnswer: 0, category: 'Interests' },
    { question: 'What is your learning style?', options: ['Visual', 'Auditory', 'Kinesthetic', 'Reading/writing'], correctAnswer: 0, category: 'Interests' },
    { question: 'Which activity excites you?', options: ['Coding', 'Designing', 'Teaching', 'Managing'], correctAnswer: 0, category: 'Interests' },
    { question: 'What drives your passion?', options: ['Innovation', 'Impact', 'Excellence', 'Security'], correctAnswer: 0, category: 'Interests' },
    { question: 'Preferred work environment?', options: ['Team', 'Independent', 'Flexible', 'Structured'], correctAnswer: 0, category: 'Interests' },
    { question: 'What kind of problems do you enjoy?', options: ['Mathematical', 'Creative', 'Practical', 'Ethical'], correctAnswer: 0, category: 'Interests' },
    { question: 'Which industry interests you?', options: ['Technology', 'Healthcare', 'Education', 'Finance'], correctAnswer: 0, category: 'Interests' },
    { question: 'Your ideal role?', options: ['Specialist', 'Generalist', 'Leader', 'Innovator'], correctAnswer: 0, category: 'Interests' }
  ];
};
