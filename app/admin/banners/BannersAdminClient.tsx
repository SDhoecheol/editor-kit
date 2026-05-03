"use client";

import { useState } from "react";
import { upsertBanner, deleteBanner } from "./actions";

export default function BannersAdminClient({ initialBanners }: { initialBanners: any[] }) {
  const [banners, setBanners] = useState(initialBanners);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  const handleAddNew = () => {
    setIsEditing("new");
    setFormData({
      title: "",
      image_url: "",
      link_url: "",
      type: "banner",
      is_active: true,
      priority: 0,
    });
  };

  const handleEdit = (b: any) => {
    setIsEditing(b.id);
    setFormData(b);
  };

  const handleSave = async () => {
    if (!formData.title) return alert("제목은 필수입니다.");
    setIsSaving(true);
    
    // DB의 UUID 생성을 위해 new인 경우 id 제거
    const dataToSave = { ...formData };
    if (isEditing === "new") delete dataToSave.id;

    const res = await upsertBanner(dataToSave);
    if (res.success) {
      alert("저장되었습니다.");
      setIsEditing(null);
      // 단순화를 위해 페이지를 리로드하거나 상태를 재요청할 수 있지만 여기선 새로고침
      window.location.reload();
    } else {
      alert("저장 실패: " + res.message);
    }
    setIsSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    const res = await deleteBanner(id);
    if (res.success) {
      setBanners(prev => prev.filter(b => b.id !== id));
    } else {
      alert("삭제 실패: " + res.message);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-[#222222] dark:text-[#EAEAEA]">등록된 배너 ({banners.length})</h2>
        <button 
          onClick={handleAddNew}
          disabled={!!isEditing}
          className="bg-[#222222] dark:bg-[#EAEAEA] text-white dark:text-[#121212] px-4 py-2 font-bold shadow-[2px_2px_0px_#A0A0A0] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all disabled:opacity-50"
        >
          + 새 배너 등록
        </button>
      </div>

      {isEditing && (
        <div className="bg-[#F5F4F0] dark:bg-[#2A2A2A] border-2 border-[#222222] dark:border-[#555555] p-6 mb-8 shadow-[4px_4px_0px_#222222] dark:shadow-[4px_4px_0px_#111111]">
          <h3 className="text-lg font-black mb-4 text-[#222222] dark:text-[#EAEAEA]">
            {isEditing === "new" ? "새 배너 등록" : "배너 수정"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-bold text-[#666666] mb-1">제목 (내부 관리용/모달 텍스트)</label>
              <input 
                type="text" 
                value={formData.title || ""} 
                onChange={e => setFormData({...formData, title: e.target.value})}
                className="w-full border-2 border-[#222222] bg-white dark:bg-[#1E1E1E] p-2 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#666666] mb-1">유형</label>
              <select 
                value={formData.type || "banner"} 
                onChange={e => setFormData({...formData, type: e.target.value})}
                className="w-full border-2 border-[#222222] bg-white dark:bg-[#1E1E1E] p-2 outline-none"
              >
                <option value="banner">상단 띠 배너</option>
                <option value="modal">중앙 팝업 모달</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-[#666666] mb-1">이미지 URL</label>
              <input 
                type="text" 
                value={formData.image_url || ""} 
                onChange={e => setFormData({...formData, image_url: e.target.value})}
                className="w-full border-2 border-[#222222] bg-white dark:bg-[#1E1E1E] p-2 outline-none"
                placeholder="https://..."
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-[#666666] mb-1">클릭 연결 링크 URL</label>
              <input 
                type="text" 
                value={formData.link_url || ""} 
                onChange={e => setFormData({...formData, link_url: e.target.value})}
                className="w-full border-2 border-[#222222] bg-white dark:bg-[#1E1E1E] p-2 outline-none"
                placeholder="/tools/rollnester"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#666666] mb-1">우선순위 (높을수록 먼저 노출)</label>
              <input 
                type="number" 
                value={formData.priority || 0} 
                onChange={e => setFormData({...formData, priority: parseInt(e.target.value) || 0})}
                className="w-full border-2 border-[#222222] bg-white dark:bg-[#1E1E1E] p-2 outline-none"
              />
            </div>
            <div className="flex items-center mt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formData.is_active ?? true} 
                  onChange={e => setFormData({...formData, is_active: e.target.checked})}
                  className="w-5 h-5 accent-[#222222]"
                />
                <span className="font-bold text-[#222222] dark:text-[#EAEAEA]">현재 활성화 (클라이언트에 노출)</span>
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button 
              onClick={() => setIsEditing(null)}
              className="px-4 py-2 font-bold text-[#666666] hover:text-[#222222]"
            >
              취소
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className="bg-[#222222] text-white px-6 py-2 font-bold border-2 border-[#222222] shadow-[2px_2px_0px_#A0A0A0] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
            >
              {isSaving ? "저장 중..." : "저장"}
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {banners.map(b => (
          <div key={b.id} className="bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div className={`px-2 py-1 text-xs font-black text-white ${b.type === 'modal' ? 'bg-purple-600' : 'bg-blue-600'}`}>
                {b.type.toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-[#222222] dark:text-[#EAEAEA] flex items-center gap-2">
                  {b.title}
                  {!b.is_active && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 border border-red-200 rounded-full">비활성</span>}
                </h3>
                <p className="text-sm text-[#666666] truncate max-w-md">{b.link_url || '링크 없음'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-end">
              <span className="text-xs font-bold text-[#A0A0A0] mr-2">Prio: {b.priority}</span>
              <button 
                onClick={() => handleEdit(b)}
                className="px-3 py-1 bg-[#F5F4F0] border-2 border-[#222222] text-xs font-bold hover:bg-[#222222] hover:text-white transition-colors"
              >
                수정
              </button>
              <button 
                onClick={() => handleDelete(b.id)}
                className="px-3 py-1 bg-red-50 border-2 border-red-500 text-red-600 text-xs font-bold hover:bg-red-500 hover:text-white transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        ))}
        {banners.length === 0 && !isEditing && (
          <div className="text-center py-12 border-2 border-dashed border-[#A0A0A0] text-[#A0A0A0] font-bold">
            등록된 배너가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
