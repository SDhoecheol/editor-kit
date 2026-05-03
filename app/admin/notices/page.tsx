import { supabase } from "@/lib/supabase";
import { redirect } from "next/navigation";
import NoticesAdminClient from "./NoticesAdminClient";

export const metadata = {
  title: "Notices | Admin Dashboard",
};

export default async function NoticesAdminPage() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();
  if (profile?.role !== "admin") redirect("/admin/posts");

  const { data: notices, error } = await supabase
    .from("system_notices")
    .select("*")
    .order("created_at", { ascending: false });

  const safeNotices = error ? [] : notices;

  return (
    <div>
      <div className="flex justify-between items-end mb-6 border-b-4 border-[#222222] dark:border-[#444444] pb-4">
        <div>
          <h1 className="text-3xl font-black text-[#222222] dark:text-[#EAEAEA] uppercase tracking-tighter">System Notices</h1>
          <p className="text-[#A0A0A0] dark:text-[#666666] font-bold mt-1">글로벌 시스템 공지 & 알림 발송</p>
        </div>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-100 border-2 border-red-500 text-red-700 font-bold">
          DB 테이블이 없거나 권한 오류가 발생했습니다. 먼저 SQL을 실행해 system_notices 테이블을 생성해 주세요.
        </div>
      )}

      <NoticesAdminClient initialNotices={safeNotices} />
    </div>
  );
}
