import { supabase } from "@/lib/supabase";

export const metadata = {
  title: "점검 중 | EditorKit",
};

export default async function MaintenancePage() {
  const { data: settings } = await supabase.from('site_settings').select('maintenance_message').eq('id', 1).single();
  const message = settings?.maintenance_message || "현재 시스템 점검 중입니다. 잠시 후 다시 시도해 주세요.";

  return (
    <div className="min-h-screen bg-[#F5F4F0] dark:bg-[#121212] flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-[#1E1E1E] border-4 border-[#222222] dark:border-[#444444] p-8 shadow-[8px_8px_0px_#222222] dark:shadow-[8px_8px_0px_#111111] text-center">
        <span className="material-symbols-outlined text-6xl text-red-500 mb-4 block animate-bounce">engineering</span>
        <h1 className="text-3xl font-black text-[#222222] dark:text-[#EAEAEA] uppercase tracking-tighter mb-2">
          Under Maintenance
        </h1>
        <div className="w-16 h-1 bg-[#222222] dark:bg-[#444444] mx-auto mb-6"></div>
        <p className="text-[#666666] dark:text-[#A0A0A0] font-bold whitespace-pre-wrap">
          {message}
        </p>
      </div>
    </div>
  );
}
