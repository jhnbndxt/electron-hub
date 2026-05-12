import { useEffect } from "react";
import { supabase } from "../../supabase";
import { useAuth } from "../context/AuthContext";

const PRESENCE_CHANNEL = "electron-system-presence";
const VISITOR_ID_KEY = "electron_presence_visitor_id";
const PRESENCE_EVENT = "electron-system-presence-change";

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
    const currentRole = userRole || "visitor";
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
        role: currentRole,
        path: window.location.pathname,
        onlineAt: new Date().toISOString(),
        visible: document.visibilityState === "visible",
      });
    };

    const emitPresenceState = () => {
      const presenceState = channel.presenceState();
      const roleCounts: Record<string, number> = {};
      const activeKeys = Object.keys(presenceState);

      activeKeys.forEach((presenceKey) => {
        const metas = presenceState[presenceKey] as Array<{ role?: string }>;
        const latestMeta = metas?.[metas.length - 1] || {};
        const role = latestMeta.role || "visitor";
        roleCounts[role] = (roleCounts[role] || 0) + 1;
      });

      const payload =
        activeKeys.length === 0
          ? { activeUsers: 1, activeUserRoles: { [currentRole]: 1 } }
          : { activeUsers: activeKeys.length, activeUserRoles: roleCounts };

      (window as any).__electronSystemPresence = payload;
      window.dispatchEvent(new CustomEvent(PRESENCE_EVENT, { detail: payload }));
    };

    channel
      .on("presence", { event: "sync" }, emitPresenceState)
      .on("presence", { event: "join" }, emitPresenceState)
      .on("presence", { event: "leave" }, emitPresenceState)
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          trackPresence();
          emitPresenceState();
        }
      });

    const intervalId = window.setInterval(trackPresence, 30000);
    const fallbackTimeoutId = window.setTimeout(emitPresenceState, 1800);
    window.addEventListener("focus", trackPresence);
    document.addEventListener("visibilitychange", trackPresence);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(fallbackTimeoutId);
      window.removeEventListener("focus", trackPresence);
      document.removeEventListener("visibilitychange", trackPresence);
      void channel.untrack();
      void supabase.removeChannel(channel);
    };
  }, [userData?.email, userData?.id, userData?.name, userRole]);

  return null;
}
