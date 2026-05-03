import { supabase } from "@/lib/supabase";
import { redirect } from "next/navigation";
import SettingsAdminClient from "./SettingsAdminClient";

export const metadata = {
  title: "Settings | Admin Dashboard",
};

export default async function SettingsAdminPage() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", session.user.id).single();
  if (profile?.role !== "admin") redirect("/admin/posts");

  const { data: settings, error } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .single();

  const safeSettings = error ? {
    maintenance_mode: false,
    maintenance_message: "현재 시스템 점검 중입니다.",
    tool_rollnester_active: true,
    tool_mockup3d_active: true,
    tool_harikomi_active: true,
    tool_configs: { rollnester: { maxWidth: 600, gutter: 5 } }
  } : settings;

  return (
    <div>
      <div className="flex justify-between items-end mb-6 border-b-4 border-[#222222] dark:border-[#444444] pb-4">
        <div>
          <h1 className="text-3xl font-black text-[#222222] dark:text-[#EAEAEA] uppercase tracking-tighter">Site Settings</h1>
          <p className="text-[#A0A0A0] dark:text-[#666666] font-bold mt-1">글로벌 서비스 상태 & 기본값 제어</p>
        </div>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-red-100 border-2 border-red-500 text-red-700 font-bold">
          DB 테이블이 없거나 권한 오류가 발생했습니다. 먼저 SQL을 실행해 site_settings 테이블을 생성해 주세요.
        </div>
      )}

      <SettingsAdminClient initialSettings={safeSettings} />
    </div>
  );
}
