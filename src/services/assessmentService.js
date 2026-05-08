import { supabase } from '../supabase';
import { createAuditLog } from './adminService';

/**
 * Assessment Service
 * Handles all assessment question management with Supabase
 */

const INTERESTS_CATEGORY = 'Interests';

const LIKERT_OPTIONS = [
  '5 - Strongly Agree',
  '4 - Agree',
  '3 - Neutral',
  '2 - Disagree',
  '1 - Strongly Disagree',
];

const INTEREST_LIKERT_QUESTIONS = [
  'I enjoy solving math problems.',
  'I like science experiments.',
  'I enjoy public speaking.',
  'I like drawing or designing.',
  'I enjoy helping people.',
  'I like business activities.',
  'I enjoy coding or computers.',
  'I like fixing things.',
  'I enjoy writing essays.',
  'I like organizing records.',
  'I enjoy leading groups.',
  'I like nature or science topics.',
  'I enjoy teaching others.',
  'I like creating videos or music.',
  'I enjoy building projects.',
];

const isInterestCategory = (category = '') => String(category || '').trim() === INTERESTS_CATEGORY;

const normalizeQuestionText = (question = '') => String(question || '').trim();

const normalizeQuestionOptions = (options = []) => {
  const sourceOptions = Array.isArray(options) ? options : [];

  return sourceOptions
    .map((option) => String(option || '').trim())
    .filter((option) => option.length > 0);
};

export const getDefaultAssessmentQuestions = () => [
  { question: 'Synonym of assist', options: ['Help', 'Stop', 'Hide', 'Delay'], correctAnswer: 0, category: 'Verbal' },
  { question: 'Opposite of ancient', options: ['Old', 'Modern', 'Broken', 'Weak'], correctAnswer: 1, category: 'Verbal' },
  { question: 'Book : Read = Spoon : ___', options: ['Write', 'Eat', 'Cut', 'Draw'], correctAnswer: 1, category: 'Verbal' },
  { question: 'Correct spelling', options: ['Definately', 'Definitely', 'Defnatly', 'Defenitly'], correctAnswer: 1, category: 'Verbal' },
  { question: 'Which does not belong?', options: ['Apple', 'Banana', 'Carrot', 'Mango'], correctAnswer: 2, category: 'Verbal' },
  { question: 'Teacher works in a ___', options: ['Hospital', 'School', 'Bank', 'Farm'], correctAnswer: 1, category: 'Verbal' },
  { question: 'Opposite of increase', options: ['Add', 'Decrease', 'Raise', 'Grow'], correctAnswer: 1, category: 'Verbal' },
  { question: 'Correct sentence', options: ['She go home', 'She goes home', 'She going home', 'She gone home'], correctAnswer: 1, category: 'Verbal' },
  { question: 'Brave means', options: ['Fearful', 'Courageous', 'Weak', 'Silent'], correctAnswer: 1, category: 'Verbal' },
  { question: 'Pen : Write = Knife : ___', options: ['Cut', 'Drink', 'Read', 'Fold'], correctAnswer: 0, category: 'Verbal' },
  { question: 'Select noun', options: ['Quickly', 'Happiness', 'Blue', 'Run'], correctAnswer: 1, category: 'Verbal' },
  { question: 'Observe means', options: ['Watch', 'Forget', 'Destroy', 'Sleep'], correctAnswer: 0, category: 'Verbal' },
  { question: 'Correct spelling', options: ['Recieve', 'Receive', 'Receeve', 'Receve'], correctAnswer: 1, category: 'Verbal' },
  { question: 'Which does not belong?', options: ['Dog', 'Cat', 'Bird', 'Table'], correctAnswer: 3, category: 'Verbal' },
  { question: 'Flowers need water. Roses are flowers. Roses need ___', options: ['Fire', 'Water', 'Wind', 'Sand'], correctAnswer: 1, category: 'Verbal' },
  { question: '12 + 8 = ?', options: ['18', '20', '22', '24'], correctAnswer: 1, category: 'Math' },
  { question: '15 x 3 = ?', options: ['30', '35', '45', '60'], correctAnswer: 2, category: 'Math' },
  { question: '81 / 9 = ?', options: ['7', '8', '9', '10'], correctAnswer: 2, category: 'Math' },
  { question: '25% of 200 = ?', options: ['25', '50', '75', '100'], correctAnswer: 1, category: 'Math' },
  { question: 'Solve: 2x = 10', options: ['3', '4', '5', '6'], correctAnswer: 2, category: 'Math' },
  { question: '2, 4, 6, 8, __', options: ['9', '10', '11', '12'], correctAnswer: 1, category: 'Math' },
  { question: '7 squared = ?', options: ['14', '21', '42', '49'], correctAnswer: 3, category: 'Math' },
  { question: '100 - 37 = ?', options: ['53', '63', '67', '73'], correctAnswer: 1, category: 'Math' },
  { question: '3/4 of 20 = ?', options: ['10', '12', '15', '18'], correctAnswer: 2, category: 'Math' },
  { question: '0.5 + 0.5 = ?', options: ['0.5', '1.0', '1.5', '2.0'], correctAnswer: 1, category: 'Math' },
  { question: 'Area of rectangle 4 x 6 = ?', options: ['10', '20', '24', '28'], correctAnswer: 2, category: 'Math' },
  { question: '9 + 6 / 3 = ?', options: ['5', '9', '11', '15'], correctAnswer: 2, category: 'Math' },
  { question: '5 pens cost PHP 50. One pen costs ___', options: ['PHP 5', 'PHP 10', 'PHP 25', 'PHP 50'], correctAnswer: 1, category: 'Math' },
  { question: '5, 10, 15, 20, __', options: ['21', '22', '25', '30'], correctAnswer: 2, category: 'Math' },
  { question: 'Perimeter of square with side 5 = ?', options: ['10', '15', '20', '25'], correctAnswer: 2, category: 'Math' },
  { question: 'Planet we live on', options: ['Mars', 'Earth', 'Venus', 'Jupiter'], correctAnswer: 1, category: 'Science' },
  { question: 'Plants make food by', options: ['Respiration', 'Photosynthesis', 'Evaporation', 'Digestion'], correctAnswer: 1, category: 'Science' },
  { question: 'H2O is', options: ['Oxygen', 'Hydrogen', 'Water', 'Salt'], correctAnswer: 2, category: 'Science' },
  { question: 'Force that pulls objects down', options: ['Gravity', 'Friction', 'Magnetism', 'Light'], correctAnswer: 0, category: 'Science' },
  { question: 'Center of solar system', options: ['Earth', 'Moon', 'Sun', 'Mars'], correctAnswer: 2, category: 'Science' },
  { question: 'Organ used for breathing', options: ['Heart', 'Lungs', 'Stomach', 'Kidney'], correctAnswer: 1, category: 'Science' },
  { question: 'Gas plants need', options: ['Oxygen', 'Nitrogen', 'Carbon Dioxide', 'Helium'], correctAnswer: 2, category: 'Science' },
  { question: 'Boiling point of water', options: ['50 C', '75 C', '100 C', '150 C'], correctAnswer: 2, category: 'Science' },
  { question: 'Largest human organ', options: ['Heart', 'Liver', 'Skin', 'Brain'], correctAnswer: 2, category: 'Science' },
  { question: 'Example of mammal', options: ['Fish', 'Dog', 'Bird', 'Lizard'], correctAnswer: 1, category: 'Science' },
  { question: 'Energy from sun', options: ['Solar', 'Wind', 'Thermal', 'Chemical'], correctAnswer: 0, category: 'Science' },
  { question: 'Solid to liquid is called', options: ['Freezing', 'Melting', 'Boiling', 'Condensation'], correctAnswer: 1, category: 'Science' },
  { question: 'Renewable resource', options: ['Coal', 'Oil', 'Wind', 'Gasoline'], correctAnswer: 2, category: 'Science' },
  { question: 'Skeleton gives', options: ['Support', 'Color', 'Taste', 'Sound'], correctAnswer: 0, category: 'Science' },
  { question: 'Nearest star to Earth', options: ['Moon', 'Sun', 'Mars', 'Venus'], correctAnswer: 1, category: 'Science' },
  { question: '2, 4, 8, 16, __', options: ['24', '30', '32', '36'], correctAnswer: 2, category: 'Logical' },
  { question: 'Circle, Square, Triangle, Banana. Which does not belong?', options: ['Circle', 'Square', 'Triangle', 'Banana'], correctAnswer: 3, category: 'Logical' },
  { question: 'All cats are animals. Cats ___', options: ['Fly', 'Breathe', 'Swim only', 'Are plants'], correctAnswer: 1, category: 'Logical' },
  { question: 'A, C, E, G, __', options: ['H', 'I', 'J', 'K'], correctAnswer: 1, category: 'Logical' },
  { question: 'If today is Monday, after 3 days is', options: ['Tuesday', 'Wednesday', 'Thursday', 'Friday'], correctAnswer: 2, category: 'Logical' },
  { question: '1, 1, 2, 3, 5, __', options: ['6', '7', '8', '9'], correctAnswer: 2, category: 'Logical' },
  { question: 'Red, Blue, Green, Dog. Which does not belong?', options: ['Red', 'Blue', 'Green', 'Dog'], correctAnswer: 3, category: 'Logical' },
  { question: 'Mirror pair of LEFT', options: ['UP', 'DOWN', 'RIGHT', 'BACK'], correctAnswer: 2, category: 'Logical' },
  { question: 'If 5 > 3 and 3 > 1, then 5 > 1', options: ['Yes', 'No', 'Maybe', 'Cannot tell'], correctAnswer: 0, category: 'Logical' },
  { question: '10, 9, 8, 7, __', options: ['5', '6', '7', '8'], correctAnswer: 1, category: 'Logical' },
  { question: 'Eagle is a bird. Eagle has', options: ['Wings', 'Wheels', 'Roots', 'Fins'], correctAnswer: 0, category: 'Logical' },
  { question: 'Shape with 4 equal sides', options: ['Circle', 'Triangle', 'Square', 'Rectangle'], correctAnswer: 2, category: 'Logical' },
  { question: 'Alphabetically first', options: ['Apple', 'Banana', 'Carrot', 'Date'], correctAnswer: 0, category: 'Logical' },
  { question: 'Sun : Day = Moon :', options: ['Morning', 'Night', 'Noon', 'Summer'], correctAnswer: 1, category: 'Logical' },
  { question: '3, 6, 9, 12, __', options: ['13', '14', '15', '16'], correctAnswer: 2, category: 'Logical' },
  ...INTEREST_LIKERT_QUESTIONS.map((question) => ({ question, options: LIKERT_OPTIONS, category: 'Interests' })),
];

const normalizeCorrectAnswer = (correctAnswer, options, category) => {
  if (isInterestCategory(category)) {
    return null;
  }

  if (!Number.isInteger(correctAnswer)) {
    return null;
  }

  return correctAnswer >= 0 && correctAnswer < options.length ? correctAnswer : null;
};

const buildQuestionPayload = (questionData = {}) => {
  const category = String(questionData.category || '').trim();
  const options = normalizeQuestionOptions(questionData.options);

  return {
    question: normalizeQuestionText(questionData.question),
    options,
    correct_answer: normalizeCorrectAnswer(questionData.correctAnswer, options, category),
    category,
    updated_at: new Date().toISOString(),
  };
};

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
    const payload = buildQuestionPayload(questionData);
    payload.created_at = payload.updated_at;

    const { data, error } = await supabase
      .from('assessment_questions')
      .insert(payload)
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
    const payload = buildQuestionPayload(questionData);

    const { data, error } = await supabase
      .from('assessment_questions')
      .update(payload)
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
    const timestamp = new Date().toISOString();
    const formattedQuestions = questions.map((question) => {
      const payload = buildQuestionPayload(question);

      return {
        ...payload,
        created_at: timestamp,
        updated_at: timestamp,
      };
    });

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

export const syncInterestChecklistQuestions = async () => {
  try {
    const { data, error } = await supabase
      .from('assessment_questions')
      .select('id, question, options, correct_answer, category')
      .eq('category', INTERESTS_CATEGORY)
      .order('id', { ascending: true });

    if (error) {
      console.error('Sync interest Likert error:', error);
      return { error: error.message, data: null, updatedCount: 0 };
    }

    if (!data || data.length === 0) {
      return { error: null, data: [], updatedCount: 0 };
    }

    const questionsToUpdate = data
      .slice(0, INTEREST_LIKERT_QUESTIONS.length)
      .map((question, index) => {
        const currentQuestionText = normalizeQuestionText(question.question);
        const nextQuestionText = INTEREST_LIKERT_QUESTIONS[index];
        const currentOptions = normalizeQuestionOptions(question.options);
        const shouldRewriteQuestion = nextQuestionText !== currentQuestionText;
        const shouldRewriteOptions = JSON.stringify(currentOptions) !== JSON.stringify(LIKERT_OPTIONS);
        const shouldClearCorrectAnswer = question.correct_answer !== null && question.correct_answer !== undefined;

        if (!shouldRewriteQuestion && !shouldRewriteOptions && !shouldClearCorrectAnswer) {
          return null;
        }

        return {
          id: question.id,
          question: nextQuestionText,
          options: LIKERT_OPTIONS,
          updated_at: new Date().toISOString(),
        };
      })
      .filter(Boolean);

    if (questionsToUpdate.length === 0) {
      return { error: null, data, updatedCount: 0 };
    }

    const updatedQuestions = [];

    for (const question of questionsToUpdate) {
      const { data: updatedQuestion, error: updateError } = await supabase
        .from('assessment_questions')
        .update({
          question: question.question,
          options: question.options,
          correct_answer: null,
          updated_at: question.updated_at,
        })
        .eq('id', question.id)
        .select()
        .single();

      if (updateError) {
        console.error('Sync interest Likert error:', updateError);
        return { error: updateError.message, data: null, updatedCount: 0 };
      }

      updatedQuestions.push(updatedQuestion);
    }

    await createAuditLog(
      'system',
      'QUESTION_SYNCED_LIKERT',
      `Synchronized ${updatedQuestions.length} interest questions to Likert format.`,
      'info',
      {
        resourceType: 'assessment_question',
        changes: {
          category: INTERESTS_CATEGORY,
          updated_count: updatedQuestions.length,
        },
      }
    );

    return { error: null, data: updatedQuestions, updatedCount: updatedQuestions.length };
  } catch (error) {
    console.error('Sync interest Likert error:', error);
    return { error: error.message, data: null, updatedCount: 0 };
  }
};

export const syncDefaultAssessmentQuestions = async () => {
  try {
    const defaultQuestions = getDefaultAssessmentQuestions();
    const { data, error } = await supabase
      .from('assessment_questions')
      .select('id, question, options, correct_answer, category')
      .order('id', { ascending: true });

    if (error) {
      console.error('Sync assessment questions error:', error);
      return { error: error.message, data: null, updatedCount: 0 };
    }

    if (!data || data.length === 0) {
      return { error: null, data: [], updatedCount: 0 };
    }

    const timestamp = new Date().toISOString();
    const updatedQuestions = [];

    for (let index = 0; index < Math.min(data.length, defaultQuestions.length); index += 1) {
      const currentQuestion = data[index];
      const nextQuestion = defaultQuestions[index];
      const nextPayload = buildQuestionPayload(nextQuestion);
      const currentOptions = normalizeQuestionOptions(currentQuestion.options);
      const shouldUpdate =
        normalizeQuestionText(currentQuestion.question) !== nextPayload.question ||
        currentQuestion.category !== nextPayload.category ||
        JSON.stringify(currentOptions) !== JSON.stringify(nextPayload.options) ||
        currentQuestion.correct_answer !== nextPayload.correct_answer;

      if (!shouldUpdate) {
        continue;
      }

      const { data: updatedQuestion, error: updateError } = await supabase
        .from('assessment_questions')
        .update({
          ...nextPayload,
          updated_at: timestamp,
        })
        .eq('id', currentQuestion.id)
        .select()
        .single();

      if (updateError) {
        console.error('Sync assessment questions error:', updateError);
        return { error: updateError.message, data: null, updatedCount: updatedQuestions.length };
      }

      updatedQuestions.push(updatedQuestion);
    }

    if (updatedQuestions.length > 0) {
      await createAuditLog(
        'system',
        'QUESTION_BANK_SYNCED',
        `Synchronized ${updatedQuestions.length} assessment questions to the current question bank.`,
        'info',
        {
          resourceType: 'assessment_question',
          changes: {
            updated_count: updatedQuestions.length,
          },
        }
      );
    }

    return { error: null, data: updatedQuestions, updatedCount: updatedQuestions.length };
  } catch (error) {
    console.error('Sync assessment questions error:', error);
    return { error: error.message, data: null, updatedCount: 0 };
  }
};

// Create question log (audit trail)
export const createQuestionLog = async (questionId, action, data) => {
  try {
    const { error } = await createAuditLog(
      'system',
      `QUESTION_${action}`,
      `Assessment question ${action.toLowerCase()}: ID ${questionId}`,
      'info',
      {
        resourceType: 'assessment_question',
        changes: {
          question_id: questionId,
          question_data: data || {},
        },
      }
    );

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
      .select('id, user_id, action, status, error_message, changes, created_at')
      .like('action', 'QUESTION_%')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Get logs error:', error);
      return { error: error.message, data: null };
    }

    const logs = (data || []).map((log) => {
      const changes = log?.changes && typeof log.changes === 'object' && !Array.isArray(log.changes)
        ? log.changes
        : {};

      return {
        ...log,
        timestamp: log.created_at,
        details: changes.details || log.error_message || log.action,
        status: changes.severity || (log.status === 'failure' ? 'failed' : 'success'),
      };
    });

    return { error: null, data: logs };
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
