import { ChatAssistantShell, type ChatAssistantShellProps } from "./chat-assistant-shell";

export interface ChatAssistantProps extends ChatAssistantShellProps {}

export function ChatAssistant(props: ChatAssistantProps) {
  return <ChatAssistantShell {...props} />;
}