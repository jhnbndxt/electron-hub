import { useEffect } from "react";
import { supabase } from "../../supabase";
import { useAuth } from "../context/AuthContext";

const PRESENCE_CHANNEL = "electron-system-presence";
const VISITOR_ID_KEY = "electron_presence_visitor_id";

function getVisitorId() {
  try {
    const existingId = sessionStorage.getItem(VISITOR_ID_KEY);
    if (existingId) return existingId;

    const nextId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `visitor-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    sessionStorage.setItem(VISITOR_ID_KEY, nextId);
    return nextId;
  } catch {
    return `visitor-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

export function SystemPresenceTracker() {
  const { userData, userRole } = useAuth();

  useEffect(() => {
    const presenceKey = userData?.id || userData?.email || getVisitorId();
    const channel = supabase.channel(PRESENCE_CHANNEL, {
      config: {
        presence: {
          key: presenceKey,
        },
      },
    });

    const trackPresence = () => {
      void channel.track({
        userId: userData?.id || null,
        email: userData?.email || null,
        name: userData?.name || userData?.email || "Visitor",
        role: userRole || "visitor",
        path: window.location.pathname,
        onlineAt: new Date().toISOString(),
        visible: document.visibilityState === "visible",
      });
    };

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        trackPresence();
      }
    });

    const intervalId = window.setInterval(trackPresence, 30000);
    window.addEventListener("focus", trackPresence);
    document.addEventListener("visibilitychange", trackPresence);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", trackPresence);
      document.removeEventListener("visibilitychange", trackPresence);
      void channel.untrack();
      void supabase.removeChannel(channel);
    };
  }, [userData?.email, userData?.id, userData?.name, userRole]);

  return null;
}
