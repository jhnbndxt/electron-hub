import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import {
  Compass,
  CreditCard,
  FileCheck2,
  GraduationCap,
  LayoutDashboard,
  LucideIcon,
  MessageCircle,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { findDirectFaq, retrieveChatbotKnowledge } from "../../data/chatbotKnowledge.js";

export interface ChatAssistantShellProps {
  isVisible?: boolean;
  externalIsOpen?: boolean;
  onToggle?: (isOpen: boolean) => void;
}

type Sender = "user" | "bot";

interface AssistantAction {
  kind: "prompt" | "link";
  label: string;
  value?: string;
  to?: string;
  icon?: LucideIcon;
}

interface ChatMessage {
  id: string;
  sender: Sender;
  text: string;
  timestamp: Date;
  actions?: AssistantAction[];
  source?: "faq" | "ai" | "retrieval" | "guardrail" | "local";
}

interface AssistantRoutes {
  assessment: string;
  enrollment: string;
  documents: string;
  payment: string;
  paymentHistory: string;
  results: string;
  dashboard: string;
  login: string;
  register: string;
  contact: string;
}

interface AssistantContext {
  userRole: "student" | "registrar" | "branchcoordinator" | "cashier" | null;
  userName: string | null;
  enrollmentProgress: Array<{ name: string; status: "completed" | "current" | "pending" }>;
  routes: AssistantRoutes;
}

const GREETING_KEYWORDS = ["hi", "hello", "hey", "good morning", "good afternoon", "good evening"];
const IDENTITY_KEYWORDS = ["who are you", "what are you", "chatbot", "system"];
const HELP_KEYWORDS = ["what can you do", "help", "assist", "support"];
const ASSESSMENT_KEYWORDS = ["assessment", "test", "exam", "ai test", "start assessment"];
const ASSESSMENT_DONE_KEYWORDS = ["done assessment", "finished test", "already answered", "completed assessment"];
const RETAKE_KEYWORDS = ["retake assessment", "restart assessment", "take again", "redo assessment"];
const ENROLLMENT_KEYWORDS = ["enroll", "enrollment", "how to enroll", "registration"];
const ENROLL_WITHOUT_ASSESSMENT_KEYWORDS = ["can i enroll without assessment", "enroll without assessment"];
const DOCUMENT_KEYWORDS = ["documents", "requirements", "needed files", "document requirements", "requirements list"];
const DOCUMENT_UPLOAD_KEYWORDS = ["upload documents", "file size", "pdf", "jpg", "where do i upload"];
const DOCUMENT_REJECTED_KEYWORDS = ["rejected document", "not approved", "failed document", "document rejected"];
const PAYMENT_KEYWORDS = ["payment", "pay", "how to pay", "tuition"];
const RECEIPT_KEYWORDS = ["receipt", "reference number", "upload payment", "payment receipt"];
const CASH_PAYMENT_KEYWORDS = ["cash payment", "queue number", "cashier"];
const PAYMENT_REJECTED_KEYWORDS = ["payment rejected", "not verified", "payment failed"];
const STATUS_KEYWORDS = ["status", "progress", "enrollment status", "tracking"];
const ENROLLED_KEYWORDS = ["enrolled", "am i enrolled", "fully enrolled"];
const SECTIONING_KEYWORDS = ["section", "sectioning", "class section"];
const NAVIGATION_KEYWORDS = ["where to go", "next step", "what next", "where do i go", "next"];
const TRACK_KEYWORDS = ["track", "tracks", "strand", "elective", "programs", "available tracks"];
const ACADEMIC_TRACK_KEYWORDS = ["academic track", "academic"];
const TECHNICAL_TRACK_KEYWORDS = ["technical", "technical-professional", "technical professional", "tvl"];
const ACCOUNT_KEYWORDS = ["login", "register", "create account", "sign up", "account"];

const QUICK_PROMPTS = [
  { label: "How do I enroll?", value: "How do I enroll?", icon: Compass },
  { label: "What documents are required?", value: "What documents are required?", icon: FileCheck2 },
  { label: "How do I re-upload documents?", value: "How do I re-upload documents?", icon: FileCheck2 },
  { label: "How do I pay tuition?", value: "How do I pay tuition?", icon: CreditCard },
  { label: "What track fits me?", value: "What track fits me?", icon: GraduationCap },
];

const ACADEMIC_ELECTIVES = [
  "Biology and Physics",
  "Entrepreneurship and Marketing",
  "Psychology and Creative Writing",
  "Media Arts and Visual Arts",
  "Coaching and Fitness",
];

const TECHNICAL_ELECTIVES = [
  "ICT and Programming",
  "Cookery and Bread & Pastry",
  "Automotive and Electrical",
  "Agriculture and Fishery",
  "Fitness Training and Coaching",
];

const COMMON_REQUIREMENTS = [
  "Completed Assessment Form in Electron Hub",
  "Form 138 (Report Card)",
  "PSA Birth Certificate",
  "2x2 ID Picture",
  "Good Moral Certificate",
  "Certificate of Completion or Grade 10 Diploma",
  "Form 137 or ESC Certificate if applicable",
];
const CHAT_STORAGE_KEY = "electronHubChatConversation";

interface StoredChatMessage extends Omit<ChatMessage, "timestamp" | "actions"> {
  timestamp: string;
  actions?: Array<Omit<AssistantAction, "icon"> & { iconName?: string }>;
}

function createMessageId(prefix: Sender) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function serializeMessage(message: ChatMessage): StoredChatMessage {
  return {
    ...message,
    timestamp: message.timestamp.toISOString(),
    actions: message.actions?.map((action) => ({
      kind: action.kind,
      label: action.label,
      value: action.value,
      to: action.to,
    })),
  };
}

function deserializeMessage(message: StoredChatMessage): ChatMessage {
  return {
    ...message,
    timestamp: new Date(message.timestamp),
    actions: message.actions?.map((action) => ({
      kind: action.kind,
      label: action.label,
      value: action.value,
      to: action.to,
    })),
  };
}

function loadStoredMessages() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = localStorage.getItem(CHAT_STORAGE_KEY);
    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);
    const storedMessages = Array.isArray(parsed?.messages) ? parsed.messages : [];
    const messages = storedMessages
      .map((message: StoredChatMessage) => deserializeMessage(message))
      .filter((message: ChatMessage) => message.id && message.sender && message.text);

    return messages;
  } catch (error) {
    console.error("Failed to restore chatbot conversation:", error);
    return [];
  }
}

function persistMessages(messages: ChatMessage[]) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(
    CHAT_STORAGE_KEY,
    JSON.stringify({
      version: 1,
      updatedAt: new Date().toISOString(),
      messages: messages.map(serializeMessage),
    })
  );
}

function normalizeInput(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s&-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasKeyword(input: string, keywords: string[]) {
  return keywords.some((keyword) => input.includes(keyword));
}

function formatList(items: string[]) {
  return items.join(", ");
}

function promptAction(label: string, value: string, icon?: LucideIcon): AssistantAction {
  return { kind: "prompt", label, value, icon };
}

function linkAction(label: string, to: string, icon?: LucideIcon): AssistantAction {
  return { kind: "link", label, to, icon };
}

function getCategoryActions(category: string | undefined, context: AssistantContext): AssistantAction[] {
  switch (category) {
    case "documents":
      return [
        linkAction("My Documents", context.routes.documents, FileCheck2),
        linkAction("Enrollment", context.routes.enrollment, Compass),
      ];
    case "payments":
      return [
        linkAction("Payment", context.routes.payment, CreditCard),
        linkAction("Payment History", context.routes.paymentHistory, LayoutDashboard),
      ];
    case "assessment":
      return [
        linkAction("AI Assessment", context.routes.assessment, GraduationCap),
        linkAction("Results", context.routes.results, GraduationCap),
      ];
    case "voucher":
      return [
        promptAction("Payment locked?", "Why is payment locked?", CreditCard),
        linkAction("Enrollment", context.routes.enrollment, Compass),
      ];
    case "navigation":
      return [
        linkAction("Dashboard", context.routes.dashboard, LayoutDashboard),
        promptAction("Next step", "What is my next step?", Compass),
      ];
    case "enrollment":
    default:
      return [
        linkAction("Enrollment", context.routes.enrollment, Compass),
        linkAction("Dashboard", context.routes.dashboard, LayoutDashboard),
      ];
  }
}

function buildFaqReply(input: string, context: AssistantContext) {
  const faq = findDirectFaq(input);
  if (!faq) return null;

  return {
    text: faq.answer,
    actions: getCategoryActions(faq.category, context),
    source: "faq" as const,
  };
}

function buildRetrievalFallbackReply(input: string, context: AssistantContext) {
  const knowledge = retrieveChatbotKnowledge(input, 1);
  const category = knowledge[0]?.category;

  return {
    text:
      category === "documents"
        ? "For documents, upload clear and readable files in the My Documents page. If one was rejected, replace it there and wait for registrar review."
        : category === "payments"
        ? "Payment becomes available after registrar approval unless voucher eligibility keeps it locked. Use the Payment page for GCash, bank transfer, or cash payment instructions."
        : category === "voucher"
        ? "Voucher eligibility is checked by the registrar. Public school Grade 10 completers, SUC/LUC completers, and current ESC grantees may qualify."
        : "I can help with enrollment, assessment, documents, payment, voucher, and portal navigation. Please check the related dashboard page for the next action.",
    actions: getCategoryActions(category, context),
    source: "retrieval" as const,
  };
}

function formatMessageTime(timestamp: Date) {
  return timestamp.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function getAssistantRoutes(userRole: AssistantContext["userRole"]): AssistantRoutes {
  if (userRole === "student") {
    return {
      assessment: "/dashboard/assessment",
      enrollment: "/dashboard/enrollment",
      documents: "/dashboard/my-documents",
      payment: "/dashboard/payment",
      paymentHistory: "/dashboard/payment-history",
      results: "/dashboard/results",
      dashboard: "/dashboard",
      login: "/dashboard",
      register: "/dashboard",
      contact: "/contact",
    };
  }

  return {
    assessment: "/assessment",
    enrollment: "/enrollment",
    documents: "/enrollment",
    payment: "/login",
    paymentHistory: "/login",
    results: "/assessment",
    dashboard: "/login",
    login: "/login",
    register: "/register",
    contact: "/contact",
  };
}

function getCurrentProgressStep(progress: AssistantContext["enrollmentProgress"]) {
  const currentStep = progress.find((step) => step.status === "current");
  if (currentStep) {
    return currentStep.name;
  }

  if (progress.every((step) => step.status === "completed")) {
    return "Enrolled";
  }

  const lastCompletedStep = [...progress].reverse().find((step) => step.status === "completed");
  return lastCompletedStep?.name || "Account Created";
}

function buildStatusReply(context: AssistantContext) {
  if (context.userRole !== "student") {
    return {
      text: "You can check your dashboard to view your current enrollment status and next step.",
      actions: [
        linkAction("Login", context.routes.login, LayoutDashboard),
        promptAction("How do I enroll?", "How do I enroll?", Compass),
      ],
    };
  }

  const currentStep = getCurrentProgressStep(context.enrollmentProgress);

  switch (currentStep) {
    case "Account Created":
      return {
        text: "Your account is ready. The next step is to complete the AI Assessment so Electron Hub can recommend your track and electives.",
        actions: [linkAction("Open Assessment", context.routes.assessment, GraduationCap)],
      };
    case "AI Assessment Completed":
    case "Documents Submitted":
      return {
        text: "Your next step is to complete the enrollment form and upload the required documents.",
        actions: [
          linkAction("Open Enrollment", context.routes.enrollment, Compass),
          linkAction("My Documents", context.routes.documents, FileCheck2),
        ],
      };
    case "Documents Verified":
      return {
        text: "Your documents are already in the review stage. Please monitor your dashboard for approval updates or remarks.",
        actions: [linkAction("Open Dashboard", context.routes.dashboard, LayoutDashboard)],
      };
    case "Payment Submitted":
      return {
        text: "You are already at the payment stage. Please submit your payment details or follow the cashier instructions shown on the payment page.",
        actions: [linkAction("Open Payment", context.routes.payment, CreditCard)],
      };
    case "Payment Verified":
      return {
        text: "Your payment is in the verification stage. Please keep checking the payment page and dashboard for updates.",
        actions: [
          linkAction("Open Payment", context.routes.payment, CreditCard),
          linkAction("Payment History", context.routes.paymentHistory, LayoutDashboard),
        ],
      };
    case "Enrolled":
      return {
        text: "Your status is already enrolled. You can continue monitoring your dashboard for sectioning and other post-enrollment updates.",
        actions: [
          linkAction("Open Dashboard", context.routes.dashboard, LayoutDashboard),
          linkAction("View Results", context.routes.results, GraduationCap),
        ],
      };
    default:
      return {
        text: "You can check your dashboard to view your current status.",
        actions: [linkAction("Open Dashboard", context.routes.dashboard, LayoutDashboard)],
      };
  }
}

function buildEnrolledReply(context: AssistantContext) {
  if (context.userRole === "student") {
    const isEnrolled = context.enrollmentProgress.some(
      (step) => step.name === "Enrolled" && step.status === "completed"
    );

    if (isEnrolled) {
      return {
        text: "Yes. Your status is already enrolled.",
        actions: [linkAction("Open Dashboard", context.routes.dashboard, LayoutDashboard)],
      };
    }

    return {
      text: "Your account is not yet marked as enrolled. Once your payment is approved, your status will be updated to enrolled.",
      actions: [
        linkAction("Check Payment", context.routes.payment, CreditCard),
        linkAction("View Dashboard", context.routes.dashboard, LayoutDashboard),
      ],
    };
  }

  return {
    text: "Once your payment is approved, your status will be updated to enrolled.",
    actions: [
      promptAction("How do I pay?", "How do I pay?", CreditCard),
      linkAction("Login", context.routes.login, LayoutDashboard),
    ],
  };
}

function buildNextStepReply(context: AssistantContext) {
  if (context.userRole === "student") {
    return buildStatusReply(context);
  }

  return {
    text: "If you are just getting started, begin with the AI Assessment. After that, continue with enrollment, document submission, and payment.",
    actions: [
      linkAction("Start Assessment", context.routes.assessment, GraduationCap),
      linkAction("Enrollment Guide", context.routes.enrollment, Compass),
    ],
  };
}

function buildAssistantReply(input: string, context: AssistantContext) {
  const normalizedInput = normalizeInput(input);
  const faqReply = buildFaqReply(input, context);

  if (faqReply) {
    return faqReply;
  }

  if (hasKeyword(normalizedInput, GREETING_KEYWORDS)) {
    return {
      text: "Hello! I can help with enrollment, assessment, documents, payment, voucher questions, and finding the right page in Electron Hub.",
      source: "local" as const,
      actions: [
        promptAction("Assessment help", "How does the assessment work?", GraduationCap),
        promptAction("How do I enroll?", "How do I enroll?", Compass),
        promptAction("Payment options", "How do I pay?", CreditCard),
      ],
    };
  }

  if (hasKeyword(normalizedInput, IDENTITY_KEYWORDS)) {
    return {
      text: "I am the Electron Hub AI Enrollment Assistant. I combine quick FAQ answers, enrollment knowledge, and AI support to guide students through the portal.",
      source: "local" as const,
      actions: [
        promptAction("What can you do?", "What can you do?", Sparkles),
        promptAction("How do I enroll?", "How do I enroll?", Compass),
      ],
    };
  }

  if (hasKeyword(normalizedInput, RETAKE_KEYWORDS)) {
    return {
      text: "Assessment retakes are currently disabled after completion. Once you finish the assessment, you can review your recommendation and proceed to enrollment.",
      source: "local" as const,
      actions: [linkAction("View Results", context.routes.results, GraduationCap)],
    };
  }

  if (hasKeyword(normalizedInput, ENROLLED_KEYWORDS)) {
    return { ...buildEnrolledReply(context), source: "local" as const };
  }

  if (hasKeyword(normalizedInput, STATUS_KEYWORDS)) {
    return { ...buildStatusReply(context), source: "local" as const };
  }

  if (hasKeyword(normalizedInput, NAVIGATION_KEYWORDS)) {
    return { ...buildNextStepReply(context), source: "local" as const };
  }

  if (hasKeyword(normalizedInput, ACCOUNT_KEYWORDS)) {
    return {
      text: "Create an account or log in to continue with assessment results, enrollment, document submission, payment, and dashboard tracking.",
      source: "local" as const,
      actions: [
        linkAction("Login", context.routes.login, LayoutDashboard),
        linkAction("Register", context.routes.register, LayoutDashboard),
      ],
    };
  }

  if (hasKeyword(normalizedInput, HELP_KEYWORDS)) {
    return {
      text: "I can guide you through the assessment, enrollment, document submission, payment, sectioning, and next-step navigation in Electron Hub.",
      source: "local" as const,
      actions: [
        promptAction("Assessment", "How does the assessment work?", GraduationCap),
        promptAction("Documents", "What are the document requirements?", FileCheck2),
        promptAction("Payment", "How do I pay?", CreditCard),
      ],
    };
  }

  return null;
}

export function ChatAssistantShell({
  isVisible = true,
  externalIsOpen,
  onToggle,
}: ChatAssistantShellProps) {
  const { userRole, userData, enrollmentProgress, refreshEnrollmentProgress } = useAuth();
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadStoredMessages());
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const skipNextPersistRef = useRef(false);

  useEffect(() => {
    if (externalIsOpen !== undefined) {
      setInternalIsOpen(externalIsOpen);
    }
  }, [externalIsOpen]);

  useEffect(() => {
    if (skipNextPersistRef.current) {
      skipNextPersistRef.current = false;
      return;
    }

    persistMessages(messages);
  }, [messages]);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key !== CHAT_STORAGE_KEY) {
        return;
      }

      setMessages(loadStoredMessages());
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    let container = document.getElementById("chat-assistant-portal") as HTMLElement | null;

    if (!container) {
      container = document.createElement("div");
      container.id = "chat-assistant-portal";
      document.body?.appendChild(container);
    }

    setPortalContainer(container);
  }, []);

  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    inputRef.current?.focus();

    if (userRole === "student") {
      void refreshEnrollmentProgress();
    }
  }, [isOpen, refreshEnrollmentProgress, userRole]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (externalIsOpen === undefined) {
          setInternalIsOpen(false);
        }
        onToggle?.(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [externalIsOpen, isOpen, onToggle]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [isTyping, messages]);

  const routes = useMemo(() => getAssistantRoutes(userRole), [userRole]);

  const assistantContext = useMemo<AssistantContext>(
    () => ({
      userRole,
      userName: userData?.name || null,
      enrollmentProgress,
      routes,
    }),
    [enrollmentProgress, routes, userData?.name, userRole]
  );
  const isConversationEmpty = messages.length === 0;
  const shouldShowQuickPrompts = isConversationEmpty;

  const openStateChange = (nextOpenState: boolean) => {
    if (externalIsOpen === undefined) {
      setInternalIsOpen(nextOpenState);
    } else {
      setInternalIsOpen(nextOpenState);
    }

    onToggle?.(nextOpenState);
  };

  const clearConversation = () => {
    skipNextPersistRef.current = true;
    localStorage.removeItem(CHAT_STORAGE_KEY);
    setMessages([]);
    setInput("");
    setIsTyping(false);
    setShowClearConfirmation(false);
  };

  const requestAiReply = async (message: string, currentMessages: ChatMessage[]) => {
    const recentMessages = currentMessages.slice(-4).map((item) => ({
      role: item.sender === "bot" ? "assistant" : "user",
      content: item.text,
    }));

    const requestBody = JSON.stringify({
      message,
      context: {
        userRole: assistantContext.userRole,
        currentStep: getCurrentProgressStep(assistantContext.enrollmentProgress),
        enrollmentProgress: assistantContext.enrollmentProgress,
      },
      recentMessages,
    });

    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: requestBody,
    };

    let response = await fetch("/api/chatbot", requestOptions);

    if (!response.ok && window.location.hostname === "localhost") {
      response = await fetch("http://localhost:3001/api/chatbot", requestOptions);
    }

    if (!response.ok) {
      throw new Error("Chatbot API request failed");
    }

    return response.json();
  };

  const handleSend = (overrideText?: string) => {
    const nextText = (overrideText ?? input).trim();

    if (!nextText || isTyping) {
      return;
    }

    const userMessage: ChatMessage = {
      id: createMessageId("user"),
      sender: "user",
      text: nextText,
      timestamp: new Date(),
    };

    const localReply = buildAssistantReply(nextText, assistantContext);

    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput("");
    setIsTyping(true);

    if (localReply) {
      const responseDelay = Math.min(650, Math.max(260, localReply.text.length * 6));

      window.setTimeout(() => {
        const botMessage: ChatMessage = {
          id: createMessageId("bot"),
          sender: "bot",
          text: localReply.text,
          timestamp: new Date(),
          actions: localReply.actions,
          source: localReply.source,
        };

        setMessages((currentMessages) => [...currentMessages, botMessage]);
        setIsTyping(false);
      }, responseDelay);
      return;
    }

    requestAiReply(nextText, nextMessages)
      .then((result) => {
        const category = result?.category;
        const botMessage: ChatMessage = {
          id: createMessageId("bot"),
          sender: "bot",
          text:
            result?.reply ||
            "I can help with enrollment, assessment, documents, payment, voucher, and portal navigation. Could you ask that another way?",
          timestamp: new Date(),
          actions: getCategoryActions(category, assistantContext),
          source: result?.source || "ai",
        };

        setMessages((currentMessages) => [...currentMessages, botMessage]);
      })
      .catch(() => {
        const fallback = buildRetrievalFallbackReply(nextText, assistantContext);
        const botMessage: ChatMessage = {
          id: createMessageId("bot"),
          sender: "bot",
          text: fallback.text,
          timestamp: new Date(),
          actions: fallback.actions,
          source: fallback.source,
        };

        setMessages((currentMessages) => [...currentMessages, botMessage]);
      })
      .finally(() => setIsTyping(false));
  };

  if (!isVisible || !portalContainer) {
    return null;
  }

  return createPortal(
    <>
      <motion.div
        className="fixed bottom-4 right-4 z-[80] sm:bottom-6 sm:right-6 lg:bottom-8 lg:right-8"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <motion.button
          type="button"
          onClick={() => openStateChange(!isOpen)}
          aria-label={isOpen ? "Close chat assistant" : "Open chat assistant"}
          className="relative flex h-16 w-16 items-center justify-center rounded-full border border-white/25 text-white shadow-[0_24px_50px_-24px_rgba(15,23,42,0.7)]"
          style={{
            background:
              "linear-gradient(135deg, var(--electron-blue) 0%, #2d5cc9 55%, var(--electron-red) 100%)",
          }}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.96 }}
        >
          <motion.span
            className="absolute inset-0 rounded-full"
            style={{ background: "rgba(37, 99, 235, 0.22)" }}
            animate={{ scale: [1, 1.16, 1], opacity: [0.35, 0.08, 0.35] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
          />
          <span className="absolute inset-[6px] rounded-full bg-white/12 backdrop-blur" />
          {isOpen ? (
            <X className="relative h-6 w-6" />
          ) : (
            <>
              <MessageCircle className="relative h-7 w-7" />
              <span className="absolute right-3 top-3 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-white/16 ring-1 ring-white/35">
                <Sparkles className="h-2.5 w-2.5 text-amber-200" />
              </span>
            </>
          )}
        </motion.button>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close chat assistant overlay"
              className="fixed inset-0 z-[79] bg-slate-950/20 backdrop-blur-[1px] sm:bg-transparent sm:backdrop-blur-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => openStateChange(false)}
            />

            <motion.section
              role="dialog"
              aria-label="Electron Hub AI Assistant"
              className="fixed inset-x-3 bottom-3 z-[80] flex h-[min(82vh,760px)] min-h-0 flex-col overflow-hidden rounded-[2rem] border border-white/55 bg-white/80 shadow-[0_42px_120px_-50px_rgba(15,23,42,0.75)] backdrop-blur-xl sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[430px] sm:max-w-[calc(100vw-3rem)] lg:bottom-8 lg:right-8"
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 220, damping: 24 }}
            >
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(246, 250, 255, 0.96) 0%, rgba(255, 255, 255, 0.92) 45%, rgba(243, 247, 255, 0.98) 100%)",
                }}
              />
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-48"
                style={{
                  background:
                    "radial-gradient(circle at top right, rgba(37, 99, 235, 0.18), transparent 58%), radial-gradient(circle at top left, rgba(185, 28, 28, 0.16), transparent 52%)",
                }}
              />

              <div className="relative flex min-h-0 flex-1 flex-col">
                <header
                  className="shrink-0 border-b border-slate-200/80 px-5 py-4 backdrop-blur"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(241, 246, 255, 0.96) 0%, rgba(255, 255, 255, 0.92) 100%)",
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <motion.div
                        className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-[0_14px_28px_-18px_rgba(15,23,42,0.6)]"
                        style={{
                          background:
                            "linear-gradient(135deg, var(--electron-blue) 0%, #2f63d2 65%, var(--electron-red) 100%)",
                        }}
                        animate={{ rotate: [0, -2, 2, 0] }}
                        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <MessageCircle className="h-5 w-5" />
                        <Sparkles className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 text-amber-200" />
                      </motion.div>

                      <div className="min-w-0">
                        <h2 className="text-base font-semibold leading-tight text-slate-900 sm:text-lg">
                          AI Enrollment Assistant
                        </h2>
                        <p className="mt-0.5 truncate text-xs text-slate-500">
                          Persistent enrollment support across Electron Hub
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <span className="inline-flex rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700 sm:px-2.5">
                        Online
                      </span>

                      <button
                        type="button"
                        onClick={() => setShowClearConfirmation(true)}
                        disabled={isConversationEmpty}
                        className="rounded-2xl border border-slate-200/80 bg-white/80 p-1.5 text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-40 sm:p-2"
                        aria-label="Clear chat conversation"
                        title="Clear conversation"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => openStateChange(false)}
                        className="rounded-2xl border border-slate-200/80 bg-white/80 p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 sm:p-2"
                        aria-label="Close chat assistant"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </header>

                <div
                  ref={scrollContainerRef}
                  className={`relative min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 pb-4 pt-4 sm:px-5 ${
                    isConversationEmpty ? "flex items-center" : ""
                  }`}
                  style={{ WebkitOverflowScrolling: "touch" }}
                >
                  <AnimatePresence initial={false}>
                    {shouldShowQuickPrompts && (
                      <motion.div
                        className="mx-auto w-full max-w-sm py-8 text-center"
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8, scale: 0.98 }}
                      >
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                          <Sparkles className="h-7 w-7" />
                        </div>
                        <h3 className="mt-4 text-xl font-bold tracking-tight text-slate-950">
                          How can I help you today?
                        </h3>
                        <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-500">
                          Ask about enrollment, documents, voucher eligibility, payments, or your track options.
                        </p>
                        <div className="mt-6 grid gap-2">
                          {QUICK_PROMPTS.map((prompt) => {
                            const PromptIcon = prompt.icon;
                            return (
                              <button
                                key={prompt.label}
                                type="button"
                                onClick={() => handleSend(prompt.value)}
                                disabled={isTyping}
                                className="group inline-flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white/85 px-4 py-3 text-left text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-900 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-blue-700 transition group-hover:bg-white">
                                  <PromptIcon className="h-4.5 w-4.5" />
                                </span>
                                <span>{prompt.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="space-y-4">
                    <AnimatePresence initial={false}>
                      {messages.map((message) => {
                        const isBot = message.sender === "bot";

                        return (
                          <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 10, scale: 0.985 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8 }}
                            transition={{ duration: 0.22 }}
                            className={`flex items-end gap-2 ${isBot ? "justify-start" : "justify-end"}`}
                          >
                            {isBot && (
                              <div className="mb-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[var(--electron-blue)]">
                                <Sparkles className="h-4 w-4" />
                              </div>
                            )}

                            <div className={`max-w-[84%] ${isBot ? "pr-8" : "pl-8"}`}>
                              <div
                                className={`rounded-[1.5rem] px-4 py-3 text-sm leading-6 shadow-[0_18px_45px_-34px_rgba(15,23,42,0.35)] ${
                                  isBot
                                    ? "border border-white/80 bg-white/92 text-slate-700 backdrop-blur"
                                    : "text-white"
                                }`}
                                style={
                                  isBot
                                    ? undefined
                                    : {
                                        background:
                                          "linear-gradient(135deg, var(--electron-blue) 0%, #1f4bb4 62%, var(--electron-red) 100%)",
                                      }
                                }
                              >
                                <p className="whitespace-pre-line">{message.text}</p>
                              </div>
                              {message.actions && message.actions.length > 0 && (
                                <div className={`mt-2 flex flex-wrap gap-2 ${isBot ? "justify-start" : "justify-end"}`}>
                                  {message.actions.map((action) => {
                                    const ActionIcon = action.icon;
                                    const content = (
                                      <>
                                        {ActionIcon && <ActionIcon className="h-3.5 w-3.5" />}
                                        {action.label}
                                      </>
                                    );

                                    if (action.kind === "link" && action.to) {
                                      return (
                                        <a
                                          key={`${message.id}-${action.label}`}
                                          href={action.to}
                                          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-900"
                                        >
                                          {content}
                                        </a>
                                      );
                                    }

                                    return (
                                      <button
                                        key={`${message.id}-${action.label}`}
                                        type="button"
                                        onClick={() => handleSend(action.value || action.label)}
                                        disabled={isTyping}
                                        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-900 disabled:cursor-not-allowed disabled:opacity-50"
                                      >
                                        {content}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                              <div className={`mt-1 px-1 text-[10px] text-slate-400 ${isBot ? "text-left" : "text-right"}`}>
                                {message.source === "ai" ? "AI assisted · " : message.source === "faq" ? "FAQ · " : ""}
                                {formatMessageTime(message.timestamp)}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>

                    <AnimatePresence>
                      {isTyping && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 6 }}
                          className="flex justify-start"
                        >
                          <div className="rounded-[1.5rem] border border-white/80 bg-white/92 px-4 py-3 shadow-[0_18px_45px_-34px_rgba(15,23,42,0.35)] backdrop-blur">
                            <div className="flex items-center gap-1.5">
                              {[0, 1, 2].map((dot) => (
                                <motion.span
                                  key={dot}
                                  className="h-2.5 w-2.5 rounded-full bg-slate-400"
                                  animate={{ y: [0, -5, 0], opacity: [0.35, 1, 0.35] }}
                                  transition={{ duration: 0.8, repeat: Infinity, delay: dot * 0.15 }}
                                />
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div ref={messagesEndRef} />
                  </div>
                </div>

                <div className="shrink-0 border-t border-slate-200/70 bg-white/80 px-4 pb-4 pt-3 backdrop-blur sm:px-5">
                  <div className="rounded-[1.6rem] border border-slate-200 bg-white/92 p-2 shadow-[0_18px_45px_-34px_rgba(15,23,42,0.35)]">
                    <div className="flex items-end gap-2">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1.2rem] bg-slate-100 text-[var(--electron-blue)]">
                        <MessageCircle className="h-5 w-5" />
                      </div>

                      <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(event) => setInput(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" && !event.shiftKey) {
                            event.preventDefault();
                            handleSend();
                          }
                        }}
                        placeholder="Ask about assessment, enrollment, documents, or payment"
                        className="min-h-[44px] flex-1 bg-transparent px-2 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                      />

                      <motion.button
                        type="button"
                        onClick={() => handleSend()}
                        disabled={!input.trim() || isTyping}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1.2rem] text-white disabled:cursor-not-allowed disabled:opacity-40"
                        style={{
                          background:
                            "linear-gradient(135deg, var(--electron-red) 0%, #d43e3e 100%)",
                        }}
                        whileHover={{ scale: input.trim() && !isTyping ? 1.03 : 1 }}
                        whileTap={{ scale: input.trim() && !isTyping ? 0.97 : 1 }}
                      >
                        <Send className="h-4.5 w-4.5" />
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>

            <AnimatePresence>
              {showClearConfirmation && (
                <motion.div
                  className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    role="alertdialog"
                    aria-modal="true"
                    aria-label="Clear chat conversation"
                    className="w-full max-w-sm overflow-hidden rounded-3xl border border-white/70 bg-white shadow-[0_35px_90px_-45px_rgba(15,23,42,0.8)]"
                    initial={{ opacity: 0, y: 16, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 12, scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 260, damping: 24 }}
                  >
                    <div className="border-b border-rose-100 bg-rose-50 px-6 py-5 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
                        <Trash2 className="h-6 w-6" />
                      </div>
                      <h3 className="mt-4 text-lg font-bold text-slate-950">Clear conversation?</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        This removes the saved chat history on this device and starts a fresh assistant session.
                      </p>
                    </div>
                    <div className="grid gap-2 p-5 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => setShowClearConfirmation(false)}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Keep Chat
                      </button>
                      <button
                        type="button"
                        onClick={clearConversation}
                        className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-700"
                      >
                        Clear Chat
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </AnimatePresence>
    </>,
    portalContainer
  );
}
