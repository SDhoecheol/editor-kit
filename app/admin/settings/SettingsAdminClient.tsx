"use client";

import { useState } from "react";
import { updateSiteSettings } from "./actions";

export default function SettingsAdminClient({ initialSettings }: { initialSettings: any }) {
  const [formData, setFormData] = useState(initialSettings);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    const res = await updateSiteSettings(formData);
    if (res.success) {
      alert("전역 설정이 저장되었습니다.");
    } else {
      alert("저장 실패: " + res.message);
    }
    setIsSaving(false);
  };

  const handleConfigChange = (tool: string, key: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      tool_configs: {
        ...prev.tool_configs,
        [tool]: {
          ...(prev.tool_configs?.[tool] || {}),
          [key]: value
        }
      }
    }));
  };

  return (
    <div className="space-y-8">
      {/* 1. 글로벌 점검 모드 */}
      <section className="bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] p-6 shadow-[4px_4px_0px_#222222] dark:shadow-[4px_4px_0px_#111111]">
        <h2 className="text-xl font-black mb-4 flex items-center gap-2 text-[#222222] dark:text-[#EAEAEA]">
          <span className="material-symbols-outlined text-red-500">warning</span>
          글로벌 점검 모드 (Maintenance)
        </h2>
        
        <div className="flex items-center mb-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input 
                type="checkbox" 
                checked={formData.maintenance_mode} 
                onChange={(e) => setFormData({...formData, maintenance_mode: e.target.checked})}
                className="sr-only peer" 
              />
              <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 dark:peer-focus:ring-red-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-red-600"></div>
            </div>
            <span className="font-bold text-[#222222] dark:text-[#EAEAEA]">점검 모드 활성화 (일반 유저 접근 차단)</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-bold text-[#666666] dark:text-[#A0A0A0] mb-2">점검 안내 메시지</label>
          <textarea 
            value={formData.maintenance_message}
            onChange={(e) => setFormData({...formData, maintenance_message: e.target.value})}
            rows={3}
            className="w-full border-2 border-[#222222] dark:border-[#444444] bg-[#F5F4F0] dark:bg-[#121212] text-[#222222] dark:text-[#EAEAEA] p-3 outline-none"
            placeholder="시스템 점검 중입니다..."
          />
        </div>
      </section>

      {/* 2. 도구별 기능 활성화 제어 */}
      <section className="bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] p-6 shadow-[4px_4px_0px_#222222] dark:shadow-[4px_4px_0px_#111111]">
        <h2 className="text-xl font-black mb-4 flex items-center gap-2 text-[#222222] dark:text-[#EAEAEA]">
          <span className="material-symbols-outlined text-blue-500">toggle_on</span>
          도구(Tool) 개별 활성화 제어
        </h2>
        
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer p-3 border border-[#E5E4E0] dark:border-[#333333] hover:bg-[#F5F4F0] dark:hover:bg-[#2A2A2A] transition-colors">
            <input type="checkbox" checked={formData.tool_rollnester_active} onChange={(e) => setFormData({...formData, tool_rollnester_active: e.target.checked})} className="w-5 h-5 accent-[#222222]" />
            <span className="font-bold text-[#222222] dark:text-[#EAEAEA]">Roll Nester (실사출력 조판)</span>
          </label>
          
          <label className="flex items-center gap-3 cursor-pointer p-3 border border-[#E5E4E0] dark:border-[#333333] hover:bg-[#F5F4F0] dark:hover:bg-[#2A2A2A] transition-colors">
            <input type="checkbox" checked={formData.tool_harikomi_active} onChange={(e) => setFormData({...formData, tool_harikomi_active: e.target.checked})} className="w-5 h-5 accent-[#222222]" />
            <span className="font-bold text-[#222222] dark:text-[#EAEAEA]">Harikomi (책자 터잡기)</span>
          </label>
          
          <label className="flex items-center gap-3 cursor-pointer p-3 border border-[#E5E4E0] dark:border-[#333333] hover:bg-[#F5F4F0] dark:hover:bg-[#2A2A2A] transition-colors">
            <input type="checkbox" checked={formData.tool_mockup3d_active} onChange={(e) => setFormData({...formData, tool_mockup3d_active: e.target.checked})} className="w-5 h-5 accent-[#222222]" />
            <span className="font-bold text-[#222222] dark:text-[#EAEAEA]">3D Mockup Generator</span>
          </label>
        </div>
      </section>

      {/* 3. 툴 기본 설정값 (Configs) */}
      <section className="bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] p-6 shadow-[4px_4px_0px_#222222] dark:shadow-[4px_4px_0px_#111111]">
        <h2 className="text-xl font-black mb-4 flex items-center gap-2 text-[#222222] dark:text-[#EAEAEA]">
          <span className="material-symbols-outlined text-green-500">tune</span>
          도구별 초기 기본값 (Default Configs)
        </h2>
        
        <div className="space-y-6">
          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="font-bold text-[#222222] dark:text-[#EAEAEA] mb-2">Roll Nester 기본 설정</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#666666] mb-1">기본 용지폭 (maxWidth mm)</label>
                <input 
                  type="number" 
                  value={formData.tool_configs?.rollnester?.maxWidth || 600}
                  onChange={(e) => handleConfigChange('rollnester', 'maxWidth', Number(e.target.value))}
                  className="w-full border-2 border-[#222222] dark:border-[#444444] bg-transparent p-2 outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#666666] mb-1">기본 여백 (gutter mm)</label>
                <input 
                  type="number" 
                  value={formData.tool_configs?.rollnester?.gutter || 5}
                  onChange={(e) => handleConfigChange('rollnester', 'gutter', Number(e.target.value))}
                  className="w-full border-2 border-[#222222] dark:border-[#444444] bg-transparent p-2 outline-none font-mono"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="flex justify-end sticky bottom-6">
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-[#222222] dark:bg-[#EAEAEA] text-white dark:text-[#121212] px-10 py-4 font-black tracking-widest uppercase border-2 border-[#222222] shadow-[6px_6px_0px_#A0A0A0] dark:shadow-[6px_6px_0px_#333333] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_#A0A0A0] transition-all"
        >
          {isSaving ? "SAVING..." : "SAVE SETTINGS"}
        </button>
      </div>
    </div>
  );
}
