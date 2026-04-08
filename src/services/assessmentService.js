import supabase from '../supabase';

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
