import { supabase } from "@/lib/supabase";
import RollNesterClient from "./RollNesterClient";

export const metadata = {
  title: "Roll Nester | EditorKit",
  description: "실사출력용 롤 용지 다중 페이지/다수량 자동 조판 도구",
};

export default async function RollNesterPage() {
  const { data: settings } = await supabase.from('site_settings').select('tool_rollnester_active, tool_configs').eq('id', 1).single();
  
  if (settings && settings.tool_rollnester_active === false) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
        <span className="material-symbols-outlined text-6xl text-[#A0A0A0] mb-4">construction</span>
        <h1 className="text-2xl font-black text-[#222222] dark:text-[#EAEAEA] mb-2">현재 서비스 준비 중입니다</h1>
        <p className="text-[#666666] font-bold">더 나은 기능 제공을 위해 Roll Nester 도구를 점검하고 있습니다.</p>
      </div>
    );
  }

  const initialMaxWidth = settings?.tool_configs?.rollnester?.maxWidth || 600;
  const initialGutter = settings?.tool_configs?.rollnester?.gutter || 5;

  return (
    <RollNesterClient 
      initialMaxWidth={initialMaxWidth}
      initialGutter={initialGutter}
    />
  );
}
