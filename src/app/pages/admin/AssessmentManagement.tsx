import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Brain,
  Calculator,
  Beaker,
  Lightbulb,
  Heart,
  Edit2,
  Trash2,
  Save,
  X,
  Plus,
  ChevronDown,
  ChevronUp,
  FileText,
  CheckCircle,
} from "lucide-react";
import { ConfirmationModal } from "../../components/ConfirmationModal";
import {
  getAssessmentQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  questionsExistInDatabase,
  initializeQuestions,
  getDefaultAssessmentQuestions,
} from "../../../services/assessmentService";

interface AssessmentQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer?: number;
  category: string;
}

const categories = [
  { name: "Verbal", icon: Brain, color: "#1E3A8A" },
  { name: "Math", icon: Calculator, color: "#F59E0B" },
  { name: "Science", icon: Beaker, color: "#10B981" },
  { name: "Logical", icon: Lightbulb, color: "#8B5CF6" },
  { name: "Interests", icon: Heart, color: "#EF4444" },
];

export function AssessmentManagement() {
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editedQuestion, setEditedQuestion] = useState<AssessmentQuestion | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(
    categories.map((c) => c.name)
  );
  const [addingCategory, setAddingCategory] = useState<string | null>(null);
  const [newQuestion, setNewQuestion] = useState<Partial<AssessmentQuestion>>({
    question: "",
    options: ["", "", "", ""],
    correctAnswer: 0,
  });
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; id: number | null }>({
    show: false,
    id: null,
  });

  useEffect(() => {
    loadQuestions();
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const loadQuestions = async () => {
    // First check if questions exist in database
    const exists = await questionsExistInDatabase();
    
    if (!exists) {
      // Load default 75 questions and initialize database
      const defaultQuestions = getDefaultAssessmentQuestions();
      const { error } = await initializeQuestions(defaultQuestions);
      
      if (error) {
        console.error('Error initializing questions:', error);
        // Still set them locally as fallback
        const formatted = defaultQuestions.map((q, index) => ({
          id: index + 1,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          category: q.category,
        }));
        setQuestions(formatted);
        return;
      }
      
      // Reload from database
      const { data, error: loadError } = await getAssessmentQuestions();
      if (!loadError && data) {
        const formattedQuestions = data.map((q: any) => ({
          id: q.id,
          question: q.question,
          options: q.options || [],
          correctAnswer: q.correct_answer,
          category: q.category,
        }));
        setQuestions(formattedQuestions);
      }
    } else {
      // Load from database
      const { data, error } = await getAssessmentQuestions();
      
      if (error) {
        console.error('Error loading questions:', error);
        // Fallback to default questions
        const defaultQuestions = getDefaultAssessmentQuestions();
        const formatted = defaultQuestions.map((q, index) => ({
          id: index + 1,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          category: q.category,
        }));
        setQuestions(formatted);
        return;
      }
      
      if (data && data.length > 0) {
        const formattedQuestions = data.map((q: any) => ({
          id: q.id,
          question: q.question,
          options: q.options || [],
          correctAnswer: q.correct_answer,
          category: q.category,
        }));
        setQuestions(formattedQuestions);
      } else {
        // Fallback: initialize with default questions
        const defaultQuestions = getDefaultAssessmentQuestions();
        const formatted = defaultQuestions.map((q, index) => ({
          id: index + 1,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          category: q.category,
        }));
        setQuestions(formatted);
      }
    }
  };

  const getCategoryForQuestion = (id: number): string => {
    if (id <= 10) return "Verbal";
    if (id <= 20) return "Math";
    if (id <= 30) return "Science";
    if (id <= 40) return "Logical";
    return "Interests";
  };


  const toggleCategory = (categoryName: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryName)
        ? prev.filter((c) => c !== categoryName)
        : [...prev, categoryName]
    );
  };

  const handleEdit = (question: AssessmentQuestion) => {
    setEditingId(question.id);
    setEditedQuestion({ ...question });
  };

  const handleSave = async (id: number) => {
    if (editedQuestion) {
      // Update in Supabase
      const { error } = await updateQuestion(id, {
        question: editedQuestion.question,
        options: editedQuestion.options,
        correctAnswer: editedQuestion.correctAnswer,
        category: editedQuestion.category,
      });

      if (error) {
        alert(`Error saving question: ${error}`);
        return;
      }

      // Update local state
      const updatedQuestions = questions.map((q) =>
        q.id === id ? editedQuestion : q
      );
      setQuestions(updatedQuestions);
      setEditingId(null);
      setEditedQuestion(null);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditedQuestion(null);
  };

  const handleDelete = (id: number) => {
    setDeleteConfirm({ show: true, id });
  };

  const handleConfirmDelete = async (id: number) => {
    // Delete from Supabase
    const { error } = await deleteQuestion(id);

    if (error) {
      alert(`Error deleting question: ${error}`);
      return;
    }

    // Update local state
    const updatedQuestions = questions.filter((q) => q.id !== id);
    setQuestions(updatedQuestions);
    setDeleteConfirm({ show: false, id: null });
  };

  const handleAddQuestion = async (category: string) => {
    const maxId = Math.max(...questions.map((q) => q.id), 0);
    const newQ: Partial<AssessmentQuestion> = {
      id: maxId + 1,
      question: newQuestion.question || "",
      options: category === "Interests" ? [] : (newQuestion.options || ["", "", "", ""]),
      correctAnswer: category === "Interests" ? undefined : (newQuestion.correctAnswer || 0),
      category,
    };

    // Create in Supabase
    const { error, data } = await createQuestion({
      question: newQ.question,
      options: newQ.options,
      correctAnswer: newQ.correctAnswer,
      category: newQ.category,
    });

    if (error) {
      alert(`Error adding question: ${error}`);
      return;
    }

    // Update local state with database response
    if (data) {
      const formattedQuestion: AssessmentQuestion = {
        id: data.id,
        question: data.question,
        options: data.options || [],
        correctAnswer: data.correct_answer,
        category: data.category,
      };
      setQuestions([...questions, formattedQuestion]);
    }

    setAddingCategory(null);
    setNewQuestion({
      question: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const getQuestionsByCategory = (categoryName: string) => {
    return questions.filter((q) => q.category === categoryName);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Assessment Question Bank
              </h1>
              <p className="text-gray-600">
                Manage and customize assessment questions across all categories
              </p>
            </div>
            <div className="flex items-center gap-3 bg-blue-50 px-4 py-2 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
              <div className="text-sm">
                <p className="font-semibold text-blue-900">{questions.length}</p>
                <p className="text-blue-600">Total Questions</p>
              </div>
            </div>
          </div>

          {/* Success Message */}
          <AnimatePresence>
            {saveSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Changes saved successfully!</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Category Stats */}
        <div className="px-6 pb-4">
          <div className="grid grid-cols-5 gap-3">
            {categories.map((category) => {
              const Icon = category.icon;
              const count = getQuestionsByCategory(category.name).length;
              return (
                <div
                  key={category.name}
                  className="bg-white border border-gray-200 rounded-lg p-3 text-center"
                >
                  <div
                    className="w-10 h-10 rounded-lg mx-auto mb-2 flex items-center justify-center"
                    style={{ backgroundColor: `${category.color}20` }}
                  >
                    <Icon className="w-5 h-5" style={{ color: category.color }} />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                  <p className="text-xs text-gray-600">{category.name}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-4">
          {categories.map((category) => {
            const Icon = category.icon;
            const categoryQuestions = getQuestionsByCategory(category.name);
            const isExpanded = expandedCategories.includes(category.name);
            const isAdding = addingCategory === category.name;

            return (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
              >
                {/* Category Header */}
                <div
                  className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 transition-colors border-l-4"
                  onClick={() => toggleCategory(category.name)}
                  style={{ borderLeftColor: category.color }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      <Icon className="w-6 h-6" style={{ color: category.color }} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        {category.name}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {categoryQuestions.length} question{categoryQuestions.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setAddingCategory(category.name);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Question
                    </button>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Category Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-gray-200"
                    >
                      <div className="p-5 space-y-3 bg-gray-50">
                        {/* Add New Question Form */}
                        <AnimatePresence>
                          {isAdding && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className="bg-white border-2 border-blue-200 rounded-lg p-5 mb-4"
                            >
                              <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  Add New {category.name} Question
                                </h3>
                                <button
                                  onClick={() => setAddingCategory(null)}
                                  className="text-gray-400 hover:text-gray-600"
                                >
                                  <X className="w-5 h-5" />
                                </button>
                              </div>

                              {/* Question Input */}
                              <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Question Text
                                </label>
                                <input
                                  type="text"
                                  value={newQuestion.question}
                                  onChange={(e) =>
                                    setNewQuestion({ ...newQuestion, question: e.target.value })
                                  }
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="Enter your question here..."
                                />
                              </div>

                              {/* Options (only for non-Interest questions) */}
                              {category.name !== "Interests" && (
                                <div className="mb-4">
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Answer Options (select correct answer)
                                  </label>
                                  <div className="space-y-2">
                                    {newQuestion.options?.map((option, index) => (
                                      <div key={index} className="flex items-center gap-3">
                                        <input
                                          type="radio"
                                          name="correctAnswer"
                                          checked={newQuestion.correctAnswer === index}
                                          onChange={() =>
                                            setNewQuestion({ ...newQuestion, correctAnswer: index })
                                          }
                                          className="w-5 h-5"
                                          style={{ accentColor: category.color }}
                                        />
                                        <input
                                          type="text"
                                          value={option}
                                          onChange={(e) => {
                                            const updatedOptions = [...(newQuestion.options || [])];
                                            updatedOptions[index] = e.target.value;
                                            setNewQuestion({ ...newQuestion, options: updatedOptions });
                                          }}
                                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                          placeholder={`Option ${String.fromCharCode(65 + index)}`}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {category.name === "Interests" && (
                                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                  <p className="text-sm text-blue-800">
                                    <strong>Note:</strong> Interest questions use a 5-point Likert scale
                                    (1=Strongly Disagree to 5=Strongly Agree)
                                  </p>
                                </div>
                              )}

                              {/* Save Button */}
                              <button
                                onClick={() => handleAddQuestion(category.name)}
                                className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                              >
                                <Plus className="w-5 h-5" />
                                Add Question to {category.name}
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Question List */}
                        {categoryQuestions.length === 0 ? (
                          <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
                            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-600 font-medium">No questions in this category yet</p>
                            <p className="text-sm text-gray-500 mt-1">Click "Add Question" to create one</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {categoryQuestions.map((question, qIndex) => (
                              <motion.div
                                key={question.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-all p-4"
                              >
                                {editingId === question.id ? (
                                  // Edit Mode
                                  <div>
                                    <div className="mb-4">
                                      <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Question Text
                                      </label>
                                      <input
                                        type="text"
                                        value={editedQuestion?.question}
                                        onChange={(e) =>
                                          setEditedQuestion({
                                            ...editedQuestion!,
                                            question: e.target.value,
                                          })
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      />
                                    </div>

                                    {category.name !== "Interests" && (
                                      <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                          Options (select correct answer)
                                        </label>
                                        <div className="space-y-2">
                                          {editedQuestion?.options.map((option, index) => (
                                            <div key={index} className="flex items-center gap-3">
                                              <input
                                                type="radio"
                                                name={`correctAnswer-${question.id}`}
                                                checked={editedQuestion.correctAnswer === index}
                                                onChange={() =>
                                                  setEditedQuestion({
                                                    ...editedQuestion,
                                                    correctAnswer: index,
                                                  })
                                                }
                                                className="w-5 h-5"
                                                style={{ accentColor: category.color }}
                                              />
                                              <input
                                                type="text"
                                                value={option}
                                                onChange={(e) => {
                                                  const updatedOptions = [...editedQuestion.options];
                                                  updatedOptions[index] = e.target.value;
                                                  setEditedQuestion({
                                                    ...editedQuestion,
                                                    options: updatedOptions,
                                                  });
                                                }}
                                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                              />
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    <div className="flex gap-3">
                                      <button
                                        onClick={() => handleSave(question.id)}
                                        className="flex-1 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                                      >
                                        <Save className="w-4 h-4" />
                                        Save Changes
                                      </button>
                                      <button
                                        onClick={handleCancel}
                                        className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
                                      >
                                        <X className="w-4 h-4" />
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  // View Mode
                                  <div>
                                    <div className="flex items-start justify-between mb-3">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                          <span
                                            className="text-xs font-bold px-2 py-1 rounded"
                                            style={{
                                              backgroundColor: `${category.color}20`,
                                              color: category.color,
                                            }}
                                          >
                                            {category.name} #{qIndex + 1}
                                          </span>
                                        </div>
                                        <p className="text-base font-medium text-gray-900">
                                          {question.question}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-2 ml-4">
                                        <button
                                          onClick={() => handleEdit(question)}
                                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        >
                                          <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => handleDelete(question.id)}
                                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>

                                    {category.name !== "Interests" && question.options.length > 0 && (
                                      <div className="grid grid-cols-2 gap-2 mt-3">
                                        {question.options.map((option, index) => (
                                          <div
                                            key={index}
                                            className={`px-3 py-2 rounded-lg text-sm ${
                                              question.correctAnswer === index
                                                ? "bg-green-50 text-green-800 font-semibold border-2 border-green-300"
                                                : "bg-gray-50 text-gray-700 border border-gray-200"
                                            }`}
                                          >
                                            <span className="font-bold mr-2">
                                              {String.fromCharCode(65 + index)}.
                                            </span>
                                            {option}
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {category.name === "Interests" && (
                                      <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                        <p className="text-xs text-gray-600 mb-2 font-medium">
                                          Likert Scale Response:
                                        </p>
                                        <div className="grid grid-cols-5 gap-2">
                                          {["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"].map((label, index) => (
                                            <div
                                              key={index}
                                              className="px-2 py-1 rounded bg-white text-gray-700 border border-gray-200 text-center text-xs"
                                              title={label}
                                            >
                                              {index + 1}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirm.show}
        title="Delete Question"
        message="Are you sure you want to delete this question? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        onConfirm={() => deleteConfirm.id && handleConfirmDelete(deleteConfirm.id)}
        onClose={() => setDeleteConfirm({ show: false, id: null })}
      />
    </div>
  );
}