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
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

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

function createMessageId(prefix: Sender) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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

function buildWelcomeMessage(): ChatMessage {
  return {
    id: createMessageId("bot"),
    sender: "bot",
    text: "Hello! Welcome to Electron Hub. How can I assist you today?",
    timestamp: new Date(),
    actions: [
      promptAction("Assessment help", "How does the assessment work?", GraduationCap),
      promptAction("Enrollment steps", "How do I enroll?", Compass),
      promptAction("Requirements", "What are the document requirements?", FileCheck2),
      promptAction("Payment options", "How do I pay?", CreditCard),
    ],
  };
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

  if (hasKeyword(normalizedInput, GREETING_KEYWORDS)) {
    return {
      text: "Hello! Welcome to Electron Hub. How can I assist you today?",
      actions: [
        promptAction("Assessment help", "How does the assessment work?", GraduationCap),
        promptAction("How do I enroll?", "How do I enroll?", Compass),
        promptAction("Payment options", "How do I pay?", CreditCard),
      ],
    };
  }

  if (hasKeyword(normalizedInput, IDENTITY_KEYWORDS)) {
    return {
      text: "I am the Electron Hub AI Assistant. I help you with assessment, enrollment, documents, payment, sectioning, and portal navigation.",
      actions: [
        promptAction("What can you do?", "What can you do?", Sparkles),
        promptAction("How do I enroll?", "How do I enroll?", Compass),
      ],
    };
  }

  if (hasKeyword(normalizedInput, RETAKE_KEYWORDS)) {
    return {
      text: "Assessment retakes are currently disabled after completion. Once you finish the assessment, you can review your recommendation and proceed to enrollment.",
      actions: [linkAction("View Results", context.routes.results, GraduationCap)],
    };
  }

  if (hasKeyword(normalizedInput, ASSESSMENT_DONE_KEYWORDS)) {
    return {
      text: "If you already finished the assessment, you can review your recommended track and electives, then proceed to enrollment.",
      actions: [
        linkAction("View Results", context.routes.results, GraduationCap),
        linkAction("Open Enrollment", context.routes.enrollment, Compass),
      ],
    };
  }

  if (hasKeyword(normalizedInput, ASSESSMENT_KEYWORDS)) {
    return {
      text: "You may take the AI Assessment to receive your recommended track and two suggested electives. After completion, your result is saved and used to guide your enrollment.",
      actions: [
        linkAction("Start Assessment", context.routes.assessment, GraduationCap),
        promptAction("What tracks are available?", "What tracks are available?", Sparkles),
      ],
    };
  }

  if (hasKeyword(normalizedInput, ENROLL_WITHOUT_ASSESSMENT_KEYWORDS)) {
    return {
      text: "Yes, you can enroll without the assessment, but it is recommended because it gives you a better track and elective suggestion before submission.",
      actions: [
        linkAction("Enrollment Guide", context.routes.enrollment, Compass),
        linkAction("Start Assessment", context.routes.assessment, GraduationCap),
      ],
    };
  }

  if (hasKeyword(normalizedInput, ENROLLMENT_KEYWORDS)) {
    return {
      text: "Complete the enrollment form, upload your documents, and submit your payment. If you are unsure about your track, take the AI Assessment first.",
      actions: [
        linkAction("Open Enrollment", context.routes.enrollment, Compass),
        linkAction("Start Assessment", context.routes.assessment, GraduationCap),
      ],
    };
  }

  if (hasKeyword(normalizedInput, DOCUMENT_REJECTED_KEYWORDS)) {
    return {
      text: "Please check the remarks provided for the rejected document, upload a clearer or corrected file, and resubmit it through your document or enrollment page.",
      actions: [
        linkAction("My Documents", context.routes.documents, FileCheck2),
        promptAction("What are the requirements?", "What are the document requirements?", FileCheck2),
      ],
    };
  }

  if (hasKeyword(normalizedInput, DOCUMENT_UPLOAD_KEYWORDS)) {
    return {
      text: "Upload your documents through the enrollment flow or My Documents page. Use clear PDF or JPG files and follow the upload size limit shown in the portal.",
      actions: [
        linkAction("Open Documents", context.routes.documents, FileCheck2),
        linkAction("Open Enrollment", context.routes.enrollment, Compass),
      ],
    };
  }

  if (hasKeyword(normalizedInput, DOCUMENT_KEYWORDS)) {
    return {
      text: `Common requirements include ${formatList(COMMON_REQUIREMENTS)}. Additional requirements may apply depending on your case.`,
      actions: [
        linkAction("Open Enrollment Guide", context.routes.enrollment, Compass),
        linkAction("My Documents", context.routes.documents, FileCheck2),
      ],
    };
  }

  if (hasKeyword(normalizedInput, RECEIPT_KEYWORDS)) {
    return {
      text: "Please upload your receipt and provide the reference number so the cashier can verify your payment.",
      actions: [linkAction("Open Payment", context.routes.payment, CreditCard)],
    };
  }

  if (hasKeyword(normalizedInput, CASH_PAYMENT_KEYWORDS)) {
    return {
      text: "For cash payment, Electron Hub can provide a queue number and schedule for cashier processing. Please follow the instructions shown on the payment page.",
      actions: [linkAction("Open Payment", context.routes.payment, CreditCard)],
    };
  }

  if (hasKeyword(normalizedInput, PAYMENT_REJECTED_KEYWORDS)) {
    return {
      text: "If your payment was rejected, please review the remarks, correct the details, and resubmit your payment information.",
      actions: [
        linkAction("Open Payment", context.routes.payment, CreditCard),
        linkAction("Payment History", context.routes.paymentHistory, LayoutDashboard),
      ],
    };
  }

  if (hasKeyword(normalizedInput, PAYMENT_KEYWORDS)) {
    return {
      text: "You may choose online payment or cash payment. After submission, the cashier verifies the payment before your enrollment is finalized.",
      actions: [
        linkAction("Open Payment", context.routes.payment, CreditCard),
        promptAction("Cash payment", "How does cash payment work?", CreditCard),
      ],
    };
  }

  if (hasKeyword(normalizedInput, ENROLLED_KEYWORDS)) {
    return buildEnrolledReply(context);
  }

  if (hasKeyword(normalizedInput, STATUS_KEYWORDS)) {
    return buildStatusReply(context);
  }

  if (hasKeyword(normalizedInput, SECTIONING_KEYWORDS)) {
    return {
      text: "Students are grouped into sections based on their track and elective combination, with capacity limits applied during sectioning.",
      actions: [
        promptAction("What track was recommended?", "What tracks are available?", GraduationCap),
        promptAction("What is my next step?", "What is my next step?", LayoutDashboard),
      ],
    };
  }

  if (hasKeyword(normalizedInput, NAVIGATION_KEYWORDS)) {
    return buildNextStepReply(context);
  }

  if (hasKeyword(normalizedInput, ACADEMIC_TRACK_KEYWORDS)) {
    return {
      text: `The Academic Track is commonly paired with electives such as ${formatList(ACADEMIC_ELECTIVES)}. The assessment helps identify which pair best matches your strengths and interests.`,
      actions: [
        linkAction("Start Assessment", context.routes.assessment, GraduationCap),
        linkAction("View Results", context.routes.results, GraduationCap),
      ],
    };
  }

  if (hasKeyword(normalizedInput, TECHNICAL_TRACK_KEYWORDS)) {
    return {
      text: `The Technical-Professional Track focuses on practical skills and may lead to electives such as ${formatList(TECHNICAL_ELECTIVES)}. The assessment helps determine the best match for you.`,
      actions: [
        linkAction("Start Assessment", context.routes.assessment, GraduationCap),
        linkAction("Open Enrollment", context.routes.enrollment, Compass),
      ],
    };
  }

  if (hasKeyword(normalizedInput, TRACK_KEYWORDS)) {
    return {
      text: "Electron Hub currently guides students through two main paths: Academic and Technical-Professional. The AI Assessment recommends one track plus two electives based on your answers.",
      actions: [
        promptAction("Academic track", "Tell me about the Academic Track", GraduationCap),
        promptAction("Technical track", "Tell me about the Technical-Professional Track", GraduationCap),
      ],
    };
  }

  if (hasKeyword(normalizedInput, ACCOUNT_KEYWORDS)) {
    return {
      text: "Create an account or log in to continue with assessment results, enrollment, document submission, payment, and dashboard tracking.",
      actions: [
        linkAction("Login", context.routes.login, LayoutDashboard),
        linkAction("Register", context.routes.register, LayoutDashboard),
      ],
    };
  }

  if (hasKeyword(normalizedInput, HELP_KEYWORDS)) {
    return {
      text: "I can guide you through the assessment, enrollment, document submission, payment, sectioning, and next-step navigation in Electron Hub.",
      actions: [
        promptAction("Assessment", "How does the assessment work?", GraduationCap),
        promptAction("Documents", "What are the document requirements?", FileCheck2),
        promptAction("Payment", "How do I pay?", CreditCard),
      ],
    };
  }

  return {
    text: "I'm sorry, I didn't fully understand your question. Could you please clarify? You can ask about assessment, enrollment, documents, payment, sectioning, or your next step.",
    actions: [
      promptAction("Assessment help", "How does the assessment work?", GraduationCap),
      promptAction("Enrollment steps", "How do I enroll?", Compass),
      promptAction("Payment options", "How do I pay?", CreditCard),
    ],
  };
}

export function ChatAssistantShell({
  isVisible = true,
  externalIsOpen,
  onToggle,
}: ChatAssistantShellProps) {
  const { userRole, userData, enrollmentProgress, refreshEnrollmentProgress } = useAuth();
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([buildWelcomeMessage()]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (externalIsOpen !== undefined) {
      setInternalIsOpen(externalIsOpen);
    }
  }, [externalIsOpen]);

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

  const openStateChange = (nextOpenState: boolean) => {
    if (externalIsOpen === undefined) {
      setInternalIsOpen(nextOpenState);
    } else {
      setInternalIsOpen(nextOpenState);
    }

    onToggle?.(nextOpenState);
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

    const reply = buildAssistantReply(nextText, assistantContext);

    setMessages((currentMessages) => [...currentMessages, userMessage]);
    setInput("");
    setIsTyping(true);

    const responseDelay = Math.min(900, Math.max(420, reply.text.length * 10));

    window.setTimeout(() => {
      const botMessage: ChatMessage = {
        id: createMessageId("bot"),
        sender: "bot",
        text: reply.text,
        timestamp: new Date(),
        actions: reply.actions,
      };

      setMessages((currentMessages) => [...currentMessages, botMessage]);
      setIsTyping(false);
    }, responseDelay);
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
                          Electron Hub Assistant
                        </h2>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <span className="inline-flex rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700 sm:px-2.5">
                        Online
                      </span>

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
                  className="relative min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 pb-4 pt-4 sm:px-5"
                  style={{ WebkitOverflowScrolling: "touch" }}
                >
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
                                <p>{message.text}</p>
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
          </>
        )}
      </AnimatePresence>
    </>,
    portalContainer
  );
}