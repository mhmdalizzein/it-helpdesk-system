import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type NotificationItem,
} from "../services/ticketService";

type NotificationBellProps = {
  variant?: "dark" | "surface";
};

function BellIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M15 17H9m10-1.5c-1.2-1-1.8-2.4-1.8-4.1V9a5.2 5.2 0 0 0-10.4 0v2.4c0 1.7-.6 3.1-1.8 4.1h14Zm-5.4 3.2a2 2 0 0 1-3.2 0"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function formatNotificationTime(value: string) {
  const createdAt = new Date(value);
  const diffMs = Date.now() - createdAt.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} min ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;

  return createdAt.toLocaleDateString();
}

export default function NotificationBell({ variant = "dark" }: NotificationBellProps) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 360 });

  const positionDropdown = useCallback(() => {
    const anchor = containerRef.current;
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    const width = Math.min(360, window.innerWidth - 32);
    const left = Math.min(
      Math.max(16, rect.right - width),
      Math.max(16, window.innerWidth - width - 16)
    );

    setDropdownPosition({
      top: rect.bottom + 10,
      left,
      width,
    });
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getNotifications();
      setNotifications(data);
    } catch {
      setError("Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useLayoutEffect(() => {
    if (!open) return;

    positionDropdown();

    window.addEventListener("resize", positionDropdown);
    window.addEventListener("scroll", positionDropdown, true);

    return () => {
      window.removeEventListener("resize", positionDropdown);
      window.removeEventListener("scroll", positionDropdown, true);
    };
  }, [open, positionDropdown]);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        !containerRef.current?.contains(target) &&
        !dropdownRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;
  const buttonClass =
    variant === "surface"
      ? "bg-white/90 text-[#143a34] border border-[rgba(19,35,30,0.1)] hover:bg-white"
      : "bg-white/10 text-white border border-white/10 hover:bg-white/15";

  async function handleNotificationClick(notification: NotificationItem) {
    try {
      if (!notification.isRead) {
        const updated = await markNotificationAsRead(notification.notificationId);
        setNotifications((items) =>
          items.map((item) =>
            item.notificationId === notification.notificationId ? updated : item
          )
        );
      }
    } catch {
      setError("Failed to update notification.");
    } finally {
      setOpen(false);
      navigate(`/tickets/${notification.ticketId}`);
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllNotificationsAsRead();
      setNotifications((items) =>
        items.map((item) => ({
          ...item,
          isRead: true,
          readAt: item.readAt || new Date().toISOString(),
        }))
      );
    } catch {
      setError("Failed to update notifications.");
    }
  }

  function handleToggleDropdown() {
    const nextOpen = !open;
    setOpen(nextOpen);

    if (nextOpen) {
      void loadNotifications();
    }
  }

  const dropdown = open
    ? createPortal(
        <div
          ref={dropdownRef}
          className="fixed z-[9999] rounded-lg border border-[rgba(19,35,30,0.1)] bg-white shadow-[0_22px_52px_rgba(50,36,22,0.18)] overflow-hidden text-[#17211d]"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            width: dropdownPosition.width,
          }}
        >
          <div className="px-4 py-3 border-b border-[rgba(22,35,31,0.09)] flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-[#52625d] m-0">Notifications</p>
              <p className="text-[#8a9690] text-xs mt-0.5 mb-0">
                {unreadCount} unread alert{unreadCount === 1 ? "" : "s"}
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="px-2.5 py-1.5 rounded-md text-xs font-bold bg-[#faf9f5] text-[#26322e] border border-[#ddded8] hover:bg-white transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {error && (
            <div className="mx-4 mt-3 px-3 py-2 rounded-lg bg-[#fdeef2] text-[#b83d5e] border border-[#f5ccd8] text-xs font-medium">
              {error}
            </div>
          )}

          <div className="max-h-[360px] overflow-y-auto">
            {loading ? (
              <p className="px-4 py-6 text-center text-[#8a9690] text-sm m-0">Loading notifications...</p>
            ) : notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-[#8a9690] text-sm m-0">No notifications yet.</p>
            ) : (
              <ul className="m-0 p-0 list-none divide-y divide-[rgba(22,35,31,0.06)]">
                {notifications.map((notification) => (
                  <li key={notification.notificationId}>
                    <button
                      type="button"
                      onClick={() => handleNotificationClick(notification)}
                      className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-[#faf9f5] transition-colors ${
                        notification.isRead ? "bg-white" : "bg-[#faf9f5]"
                      }`}
                    >
                      <span
                        className={`shrink-0 w-2 h-2 rounded-full mt-1.5 ${
                          notification.isRead ? "bg-[#c5ccc8]" : "bg-[#f75d89]"
                        }`}
                      />
                      <span className="min-w-0">
                        <span
                          className={`block text-sm leading-snug ${
                            notification.isRead
                              ? "font-medium text-[#586760]"
                              : "font-bold text-[#26322e]"
                          }`}
                        >
                          {notification.title}
                        </span>
                        <span className="block text-sm text-[#586760] mt-1 leading-snug">
                          {notification.message}
                        </span>
                        <span className="block text-xs text-[#8a9690] mt-1">
                          {notification.ticketReference} - {formatNotificationTime(notification.createdAt)}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        title="Notifications"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={open}
        onClick={handleToggleDropdown}
        className={`relative w-9 h-9 grid place-items-center rounded-lg transition-colors shadow-[0_4px_12px_rgba(20,58,52,0.12)] ${buttonClass}`}
      >
        <BellIcon className="w-[18px] h-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-[#f75d89] text-white text-[10px] font-extrabold border border-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {dropdown}
    </div>
  );
}
