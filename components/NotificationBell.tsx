"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface Notification {
  id: string;
  type: "comment" | "reply";
  post_id: string;
  post_title: string;
  triggered_by_nickname: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationBell({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 알림 목록 불러오기
  const fetchNotifications = useCallback(async () => {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30);

    if (!error && data) {
      setNotifications(data);
      setUnreadCount(data.filter((n: Notification) => !n.is_read).length);
    }
  }, [userId]);

  useEffect(() => {
    fetchNotifications();

    // 30초마다 폴링으로 새 알림 체크
    const interval = setInterval(fetchNotifications, 30000);

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 개별 알림 읽음 처리
  const markAsRead = async (notificationId: string) => {
    const target = notifications.find(n => n.id === notificationId);
    if (!target || target.is_read) return;

    // 낙관적 업데이트
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);
  };

  // 전체 읽음 처리
  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);
  };

  // 시간 포맷
  const timeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return "방금 전";
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}일 전`;
    return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 🔔 종 모양 아이콘 버튼 */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications(); // 열 때마다 새로고침
        }}
        className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center border-2 border-[#222222] dark:border-[#444444] bg-white dark:bg-[#1E1E1E] shadow-[2px_2px_0px_#222222] dark:shadow-[2px_2px_0px_#111111] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all relative"
      >
        <span className="material-symbols-outlined text-[#222222] dark:text-[#EAEAEA] text-[16px] md:text-[20px]">
          notifications
        </span>
        {/* 읽지 않은 알림 뱃지 */}
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-black flex items-center justify-center px-1 border-2 border-white dark:border-[#1E1E1E] animate-bounce">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* 드롭다운 패널 */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[340px] sm:w-[380px] max-h-[440px] bg-white dark:bg-[#1E1E1E] border-4 border-[#222222] dark:border-[#444444] shadow-[8px_8px_0px_#222222] dark:shadow-[8px_8px_0px_#111111] z-[100] flex flex-col overflow-hidden">
          {/* 헤더 */}
          <div className="flex items-center justify-between px-4 py-3 border-b-2 border-[#222222] dark:border-[#444444] bg-[#F5F4F0] dark:bg-[#2A2A2A]">
            <h3 className="font-black text-sm text-[#222222] dark:text-[#EAEAEA] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-[18px]">notifications_active</span>
              알림
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 ml-1">
                  {unreadCount}
                </span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline underline-offset-2"
              >
                모두 읽음
              </button>
            )}
          </div>

          {/* 알림 리스트 */}
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-[#A0A0A0]">
                <span className="material-symbols-outlined text-4xl mb-2">notifications_off</span>
                <p className="text-sm font-bold">새로운 알림이 없습니다.</p>
              </div>
            ) : (
              notifications.map((noti) => (
                <Link
                  key={noti.id}
                  href={`/community/${noti.post_id}`}
                  onClick={() => {
                    markAsRead(noti.id);
                    setIsOpen(false);
                  }}
                  className={`block px-4 py-3 border-b border-[#E5E4E0] dark:border-[#333333] transition-colors ${
                    noti.is_read
                      ? "bg-white dark:bg-[#1E1E1E]"
                      : "bg-blue-50 dark:bg-[#1A233A] hover:bg-blue-100 dark:hover:bg-[#223050]"
                  } hover:bg-[#F5F4F0] dark:hover:bg-[#2A2A2A]`}
                >
                  <div className="flex items-start gap-2.5">
                    {/* 아이콘 */}
                    <div className={`mt-0.5 w-7 h-7 flex items-center justify-center border-2 shrink-0 ${
                      noti.is_read
                        ? "border-[#D0D0D0] dark:border-[#444444] bg-[#F0F0F0] dark:bg-[#2A2A2A]"
                        : "border-blue-600 dark:border-blue-400 bg-blue-100 dark:bg-[#1A233A]"
                    }`}>
                      <span className={`material-symbols-outlined text-[14px] ${
                        noti.is_read
                          ? "text-[#A0A0A0] dark:text-[#666666]"
                          : "text-blue-600 dark:text-blue-400"
                      }`}>
                        {noti.type === "comment" ? "chat_bubble" : "reply"}
                      </span>
                    </div>

                    {/* 내용 */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] font-bold leading-snug ${
                        noti.is_read
                          ? "text-[#A0A0A0] dark:text-[#666666]"
                          : "text-[#222222] dark:text-[#EAEAEA]"
                      }`}>
                        <span className={`${
                          noti.is_read
                            ? "text-[#A0A0A0] dark:text-[#666666]"
                            : "text-blue-600 dark:text-blue-400"
                        }`}>
                          {noti.triggered_by_nickname}
                        </span>
                        님이{" "}
                        {noti.type === "comment"
                          ? "회원님의 게시글에 댓글을 남겼습니다."
                          : "회원님의 댓글에 답글을 남겼습니다."}
                      </p>
                      <p className={`text-[12px] mt-1 truncate ${
                        noti.is_read
                          ? "text-[#C0C0C0] dark:text-[#555555]"
                          : "text-[#666666] dark:text-[#A0A0A0]"
                      }`}>
                        "{noti.message}"
                      </p>
                      <p className={`text-[10px] mt-1 font-mono ${
                        noti.is_read
                          ? "text-[#D0D0D0] dark:text-[#444444]"
                          : "text-[#A0A0A0] dark:text-[#666666]"
                      }`}>
                        {noti.post_title && (
                          <span className="mr-2">{noti.post_title.length > 20 ? noti.post_title.substring(0, 20) + "…" : noti.post_title}</span>
                        )}
                        {timeAgo(noti.created_at)}
                      </p>
                    </div>

                    {/* 읽지 않음 표시 점 */}
                    {!noti.is_read && (
                      <div className="mt-2 w-2 h-2 bg-blue-600 dark:bg-blue-400 shrink-0" />
                    )}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
