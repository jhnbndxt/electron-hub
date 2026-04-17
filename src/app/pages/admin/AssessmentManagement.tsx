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
  syncInterestChecklistQuestions,
} from "../../../services/assessmentService";

interface AssessmentQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer?: number;
  category: string;
}

const categories = [
  {
    name: "Verbal",
    icon: Brain,
    color: "#1E3A8A",
    description: "Reading comprehension, vocabulary, and written-language accuracy.",
    supportLabel: "Objective scoring",
  },
  {
    name: "Math",
    icon: Calculator,
    color: "#F59E0B",
    description: "Numeracy, algebra foundations, and quantitative problem-solving.",
    supportLabel: "Objective scoring",
  },
  {
    name: "Science",
    icon: Beaker,
    color: "#10B981",
    description: "Scientific concepts, processes, and evidence-based thinking.",
    supportLabel: "Objective scoring",
  },
  {
    name: "Logical",
    icon: Lightbulb,
    color: "#8B5CF6",
    description: "Pattern recognition, sequencing, and abstract reasoning tasks.",
    supportLabel: "Objective scoring",
  },
  {
    name: "Interests",
    icon: Heart,
    color: "#EF4444",
    description: "Checklist-based preference signals that guide track and elective matching.",
    supportLabel: "Multi-select checklist",
  },
];

const DEFAULT_OPTION_COUNT = 4;

const isInterestCategory = (categoryName: string) => categoryName === "Interests";

const createBlankOptions = (optionCount = DEFAULT_OPTION_COUNT) =>
  Array.from({ length: optionCount }, () => "");

const ensureOptionSlots = (options: string[] = []) => {
  const normalizedOptions = Array.isArray(options)
    ? options.map((option) => (typeof option === "string" ? option : ""))
    : [];
  const totalSlots = Math.max(DEFAULT_OPTION_COUNT, normalizedOptions.length);

  return Array.from({ length: totalSlots }, (_, index) => normalizedOptions[index] ?? "");
};

const createEmptyQuestionDraft = (categoryName?: string): Partial<AssessmentQuestion> => ({
  question: "",
  options: createBlankOptions(),
  correctAnswer: categoryName && isInterestCategory(categoryName) ? undefined : 0,
  category: categoryName,
});

const normalizeDraftOptions = (options: string[] = []) => {
  return ensureOptionSlots(options).map((option) => option.trim());
};

const formatAssessmentQuestion = (question: any): AssessmentQuestion => ({
  id: question.id,
  question: question.question,
  options: ensureOptionSlots(question.options || []),
  correctAnswer: isInterestCategory(question.category)
    ? undefined
    : typeof question.correctAnswer === "number"
      ? question.correctAnswer
      : question.correct_answer,
  category: question.category,
});

const validateQuestionDraft = (
  questionDraft: Partial<AssessmentQuestion>,
  categoryName: string
) => {
  if (!questionDraft.question?.trim()) {
    return "Question text is required.";
  }

  const normalizedOptions = normalizeDraftOptions(questionDraft.options || []);

  if (normalizedOptions.some((option) => !option)) {
    return "Fill in every option before saving the question.";
  }

  if (!isInterestCategory(categoryName)) {
    if (
      typeof questionDraft.correctAnswer !== "number" ||
      questionDraft.correctAnswer < 0 ||
      questionDraft.correctAnswer >= normalizedOptions.length
    ) {
      return "Select the correct answer before saving the question.";
    }
  }

  return "";
};

const buildQuestionPayload = (
  questionDraft: Partial<AssessmentQuestion>,
  categoryName: string
) => ({
  question: questionDraft.question?.trim() || "",
  options: normalizeDraftOptions(questionDraft.options || []),
  correctAnswer: isInterestCategory(categoryName) ? undefined : questionDraft.correctAnswer,
  category: categoryName,
});

export function AssessmentManagement() {
  const [questions, setQuestions] = useState<AssessmentQuestion[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editedQuestion, setEditedQuestion] = useState<AssessmentQuestion | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(
    categories.map((c) => c.name)
  );
  const [addingCategory, setAddingCategory] = useState<string | null>(null);
  const [newQuestion, setNewQuestion] = useState<Partial<AssessmentQuestion>>(createEmptyQuestionDraft());
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
        const formatted = defaultQuestions.map((question, index) =>
          formatAssessmentQuestion({ id: index + 1, ...question })
        );
        setQuestions(formatted);
        return;
      }
      
      // Reload from database
      const { data, error: loadError } = await getAssessmentQuestions();
      if (!loadError && data) {
        const formattedQuestions = data.map((question: any) => formatAssessmentQuestion(question));
        setQuestions(formattedQuestions);
      }
    } else {
      const { error: syncError } = await syncInterestChecklistQuestions();

      if (syncError) {
        console.error('Error syncing interest checklist questions:', syncError);
      }

      // Load from database
      const { data, error } = await getAssessmentQuestions();
      
      if (error) {
        console.error('Error loading questions:', error);
        // Fallback to default questions
        const defaultQuestions = getDefaultAssessmentQuestions();
        const formatted = defaultQuestions.map((question, index) =>
          formatAssessmentQuestion({ id: index + 1, ...question })
        );
        setQuestions(formatted);
        return;
      }
      
      if (data && data.length > 0) {
        const formattedQuestions = data.map((question: any) => formatAssessmentQuestion(question));
        setQuestions(formattedQuestions);
      } else {
        // Fallback: initialize with default questions
        const defaultQuestions = getDefaultAssessmentQuestions();
        const formatted = defaultQuestions.map((question, index) =>
          formatAssessmentQuestion({ id: index + 1, ...question })
        );
        setQuestions(formatted);
      }
    }
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
    setEditedQuestion({ ...question, options: ensureOptionSlots(question.options) });
  };

  const handleSave = async (id: number) => {
    if (editedQuestion) {
      const validationError = validateQuestionDraft(editedQuestion, editedQuestion.category);

      if (validationError) {
        alert(validationError);
        return;
      }

      const payload = buildQuestionPayload(editedQuestion, editedQuestion.category);

      // Update in Supabase
      const { error, data } = await updateQuestion(id, payload);

      if (error) {
        alert(`Error saving question: ${error}`);
        return;
      }

      // Update local state
      const updatedQuestions = questions.map((q) =>
        q.id === id ? formatAssessmentQuestion(data || { id, ...payload }) : q
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
    const validationError = validateQuestionDraft(newQuestion, category);

    if (validationError) {
      alert(validationError);
      return;
    }

    const newQ = buildQuestionPayload(newQuestion, category);

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
      const formattedQuestion = formatAssessmentQuestion(data);
      setQuestions([...questions, formattedQuestion]);
    }

    setAddingCategory(null);
    setNewQuestion(createEmptyQuestionDraft());

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const getQuestionsByCategory = (categoryName: string) => {
    return questions.filter((q) => q.category === categoryName);
  };

  const totalQuestions = questions.length;
  const checklistQuestionsCount = questions.filter((question) =>
    isInterestCategory(question.category)
  ).length;
  const objectiveQuestionsCount = totalQuestions - checklistQuestionsCount;

  const managementStats = [
    {
      label: "Total Questions",
      value: totalQuestions,
      detail: "Questions currently active across all assessments",
      icon: FileText,
      color: "#1E3A8A",
    },
    {
      label: "Objective Questions",
      value: objectiveQuestionsCount,
      detail: "Verbal, Math, Science, and Logical sections",
      icon: CheckCircle,
      color: "#0F766E",
    },
    {
      label: "Checklist Questions",
      value: checklistQuestionsCount,
      detail: "Interest prompts saved without a single correct answer",
      icon: Heart,
      color: "#B91C1C",
    },
  ];

  return (
    <div className="portal-dashboard-page mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Assessment Question Bank
        </h1>
        <p className="text-gray-600 max-w-3xl">
          Manage and customize assessment questions across all categories. Interest questions stay checklist-based and do not use a single correct answer.
        </p>
      </div>

      <AnimatePresence>
        {saveSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-800"
          >
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Changes saved successfully.</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-6">
        {managementStats.map((stat) => {
          const StatIcon = stat.icon;

          return (
            <div key={stat.label} className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${stat.color}18` }}
                >
                  <StatIcon className="h-5 w-5" style={{ color: stat.color }} />
                </div>
              </div>
              <p className="mt-3 text-sm text-gray-600">{stat.detail}</p>
            </div>
          );
        })}
      </div>

      <div className="space-y-4">
        {categories.map((category) => {
          const Icon = category.icon;
          const categoryQuestions = getQuestionsByCategory(category.name);
          const isExpanded = expandedCategories.includes(category.name);
          const isAdding = addingCategory === category.name;
          const checklistCategory = isInterestCategory(category.name);

          return (
            <motion.section
              key={category.name}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
            >
              <div className="p-5 sm:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-4">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${category.color}18` }}
                    >
                      <Icon className="h-6 w-6" style={{ color: category.color }} />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-semibold text-gray-900">{category.name}</h2>
                        <span
                          className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]"
                          style={{ backgroundColor: `${category.color}14`, color: category.color }}
                        >
                          {category.supportLabel}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-gray-600 max-w-3xl">{category.description}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                          {categoryQuestions.length} question{categoryQuestions.length === 1 ? "" : "s"}
                        </span>
                        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                          {checklistCategory ? "Checklist-based" : "Single correct answer"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <button
                      type="button"
                      onClick={() => {
                        setNewQuestion(createEmptyQuestionDraft(category.name));
                        setAddingCategory(category.name);
                        if (!isExpanded) {
                          toggleCategory(category.name);
                        }
                      }}
                      className="flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-white font-medium transition-colors hover:opacity-90"
                      style={{ backgroundColor: category.color }}
                    >
                      <Plus className="h-4 w-4" />
                      Add Question
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleCategory(category.name)}
                      className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      {isExpanded ? "Hide Questions" : "Show Questions"}
                    </button>
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-gray-200 bg-gray-50"
                  >
                    <div className="space-y-4 p-5 sm:p-6">
                      <AnimatePresence>
                        {isAdding && (
                          <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            className="bg-white rounded-lg border border-gray-200 p-5"
                          >
                            <div className="flex items-start justify-between gap-4 mb-4">
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                  Add New {category.name} Question
                                </h3>
                                <p className="mt-1 text-sm text-gray-600">
                                  Fill in the question and every option before saving.
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setAddingCategory(null);
                                  setNewQuestion(createEmptyQuestionDraft());
                                }}
                                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                              >
                                <X className="h-5 w-5" />
                              </button>
                            </div>

                            <div className="space-y-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Question Text
                                </label>
                                <input
                                  type="text"
                                  value={newQuestion.question}
                                  onChange={(e) =>
                                    setNewQuestion({ ...newQuestion, question: e.target.value })
                                  }
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Enter the full assessment prompt"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  {checklistCategory ? "Checklist Items" : "Answer Options"}
                                </label>
                                <div className="space-y-2">
                                  {newQuestion.options?.map((option, index) => (
                                    <div
                                      key={index}
                                      className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-3"
                                    >
                                      {checklistCategory ? (
                                        <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-xs font-bold text-blue-700">
                                          ✓
                                        </span>
                                      ) : (
                                        <input
                                          type="radio"
                                          name="correctAnswer"
                                          checked={newQuestion.correctAnswer === index}
                                          onChange={() =>
                                            setNewQuestion({ ...newQuestion, correctAnswer: index })
                                          }
                                          className="h-5 w-5"
                                          style={{ accentColor: category.color }}
                                        />
                                      )}
                                      <input
                                        type="text"
                                        value={option}
                                        onChange={(e) => {
                                          const updatedOptions = [...(newQuestion.options || [])];
                                          updatedOptions[index] = e.target.value;
                                          setNewQuestion({ ...newQuestion, options: updatedOptions });
                                        }}
                                        className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
                                        placeholder={
                                          checklistCategory
                                            ? `Checklist item ${index + 1}`
                                            : `Option ${String.fromCharCode(65 + index)}`
                                        }
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {checklistCategory && (
                                <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                                  Interest questions render as checklists in the assessment. Students can select multiple items, and no single correct answer is stored for this category.
                                </div>
                              )}

                              <button
                                type="button"
                                onClick={() => handleAddQuestion(category.name)}
                                className="w-full flex items-center justify-center gap-2 rounded-lg py-3 text-white font-semibold transition-colors hover:opacity-90"
                                style={{ backgroundColor: category.color }}
                              >
                                <Plus className="h-5 w-5" />
                                Add Question to {category.name}
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {categoryQuestions.length === 0 ? (
                        <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 px-6 py-12 text-center">
                          <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                          <h3 className="text-lg font-semibold text-gray-900">
                            No {category.name.toLowerCase()} questions yet
                          </h3>
                          <p className="mt-1 text-sm text-gray-600">
                            Start this section by adding the first question to the live bank.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {categoryQuestions.map((question, qIndex) => (
                            <motion.article
                              key={question.id}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-white rounded-lg border border-gray-200 p-4"
                            >
                              {editingId === question.id ? (
                                <div>
                                  <div className="mb-4 flex items-start justify-between gap-4">
                                    <div>
                                      <h3 className="text-lg font-semibold text-gray-900">
                                        Edit {category.name} Question
                                      </h3>
                                      <p className="mt-1 text-sm text-gray-600">
                                        Update the question text and its options before saving.
                                      </p>
                                    </div>
                                    {checklistCategory && (
                                      <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-red-700">
                                        Checklist
                                      </span>
                                    )}
                                  </div>

                                  <div className="space-y-4">
                                    <div>
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
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {checklistCategory ? "Checklist Items" : "Answer Options"}
                                      </label>
                                      <div className="space-y-2">
                                        {editedQuestion?.options.map((option, index) => (
                                          <div
                                            key={index}
                                            className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-3"
                                          >
                                            {checklistCategory ? (
                                              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-xs font-bold text-blue-700">
                                                ✓
                                              </span>
                                            ) : (
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
                                                className="h-5 w-5"
                                                style={{ accentColor: category.color }}
                                              />
                                            )}
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
                                              className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
                                              placeholder={
                                                checklistCategory
                                                  ? `Checklist item ${index + 1}`
                                                  : `Option ${String.fromCharCode(65 + index)}`
                                              }
                                            />
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    {checklistCategory && (
                                      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                                        Students can select multiple checklist items for Interest questions. No single correct answer is stored for this category.
                                      </div>
                                    )}

                                    <div className="flex flex-col gap-3 sm:flex-row">
                                      <button
                                        type="button"
                                        onClick={() => handleSave(question.id)}
                                        className="flex-1 py-3 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                                      >
                                        <Save className="h-4 w-4" />
                                        Save Changes
                                      </button>
                                      <button
                                        type="button"
                                        onClick={handleCancel}
                                        className="flex-1 py-3 rounded-lg bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
                                      >
                                        <X className="h-4 w-4" />
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex flex-wrap items-center gap-2 mb-2">
                                        <span
                                          className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]"
                                          style={{ backgroundColor: `${category.color}14`, color: category.color }}
                                        >
                                          {category.name} #{qIndex + 1}
                                        </span>
                                        {checklistCategory && (
                                          <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-red-700">
                                            Checklist
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-base font-medium text-gray-900">{question.question}</p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => handleEdit(question)}
                                        className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
                                      >
                                        <Edit2 className="h-4 w-4" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDelete(question.id)}
                                        className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </div>

                                  {question.options.length > 0 && (
                                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                                      {question.options.map((option, index) => (
                                        <div
                                          key={index}
                                          className={`rounded-lg border px-3 py-2 text-sm ${
                                            checklistCategory
                                              ? "border-blue-200 bg-blue-50 text-blue-900"
                                              : question.correctAnswer === index
                                                ? "border-green-300 bg-green-50 text-green-800 font-medium"
                                                : "border-gray-200 bg-gray-50 text-gray-700"
                                          }`}
                                        >
                                          <span className="mr-2 font-semibold">
                                            {checklistCategory ? "□" : `${String.fromCharCode(65 + index)}.`}
                                          </span>
                                          {option}
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {checklistCategory && (
                                    <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                                      These items appear to students as a checklist and contribute to their interest-cluster score when selected.
                                    </div>
                                  )}
                                </div>
                              )}
                            </motion.article>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>
          );
        })}
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