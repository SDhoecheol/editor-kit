"use client";

import { useState } from "react";
import { upsertNotice, deleteNotice } from "./actions";

export default function NoticesAdminClient({ initialNotices }: { initialNotices: any[] }) {
  const [notices, setNotices] = useState(initialNotices);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  const handleAddNew = () => {
    setIsEditing("new");
    setFormData({
      title: "",
      message: "",
      target_role: "all",
      is_active: true,
    });
  };

  const handleEdit = (n: any) => {
    setIsEditing(n.id);
    setFormData(n);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.message) return alert("제목과 내용은 필수입니다.");
    setIsSaving(true);
    
    const dataToSave = { ...formData };
    if (isEditing === "new") delete dataToSave.id;

    const res = await upsertNotice(dataToSave);
    if (res.success) {
      alert("공지가 등록/수정되었습니다.");
      setIsEditing(null);
      window.location.reload();
    } else {
      alert("저장 실패: " + res.message);
    }
    setIsSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까? (이미 읽은 유저의 기록도 삭제됩니다)")) return;
    const res = await deleteNotice(id);
    if (res.success) {
      setNotices(prev => prev.filter(n => n.id !== id));
    } else {
      alert("삭제 실패: " + res.message);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-[#222222] dark:text-[#EAEAEA]">등록된 시스템 공지 ({notices.length})</h2>
        <button 
          onClick={handleAddNew}
          disabled={!!isEditing}
          className="bg-[#222222] dark:bg-[#EAEAEA] text-white dark:text-[#121212] px-4 py-2 font-bold shadow-[2px_2px_0px_#A0A0A0] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all disabled:opacity-50"
        >
          + 새 공지 발송
        </button>
      </div>

      {isEditing && (
        <div className="bg-[#F5F4F0] dark:bg-[#2A2A2A] border-2 border-[#222222] dark:border-[#555555] p-6 mb-8 shadow-[4px_4px_0px_#222222] dark:shadow-[4px_4px_0px_#111111]">
          <h3 className="text-lg font-black mb-4 text-[#222222] dark:text-[#EAEAEA]">
            {isEditing === "new" ? "새 시스템 공지 작성" : "시스템 공지 수정"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-[#666666] mb-1">제목 (Notification Title)</label>
              <input 
                type="text" 
                value={formData.title || ""} 
                onChange={e => setFormData({...formData, title: e.target.value})}
                className="w-full border-2 border-[#222222] bg-white dark:bg-[#1E1E1E] p-2 outline-none"
                placeholder="예: 긴급 서버 점검 안내"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-[#666666] mb-1">상세 내용 (메시지)</label>
              <textarea 
                value={formData.message || ""} 
                onChange={e => setFormData({...formData, message: e.target.value})}
                rows={3}
                className="w-full border-2 border-[#222222] bg-white dark:bg-[#1E1E1E] p-2 outline-none"
                placeholder="공지할 내용을 작성해 주세요..."
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#666666] mb-1">노출 타겟 (Target Role)</label>
              <select 
                value={formData.target_role || "all"} 
                onChange={e => setFormData({...formData, target_role: e.target.value})}
                className="w-full border-2 border-[#222222] bg-white dark:bg-[#1E1E1E] p-2 outline-none"
              >
                <option value="all">전체 사용자 (All)</option>
                <option value="user">일반 회원 (User)</option>
                <option value="manager">매니저 등급 (Manager)</option>
                <option value="admin">관리자 전용 (Admin)</option>
              </select>
            </div>
            <div className="flex items-center mt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formData.is_active ?? true} 
                  onChange={e => setFormData({...formData, is_active: e.target.checked})}
                  className="w-5 h-5 accent-[#222222]"
                />
                <span className="font-bold text-[#222222] dark:text-[#EAEAEA]">현재 활성화 (알림 배지 노출)</span>
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
              {isSaving ? "저장 중..." : "공지 발송"}
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {notices.map(n => (
          <div key={n.id} className="bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 text-[10px] font-black text-white ${n.target_role === 'all' ? 'bg-green-600' : 'bg-gray-600'}`}>
                  {n.target_role.toUpperCase()}
                </span>
                {!n.is_active && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 border border-red-200">비활성</span>}
                <span className="text-xs text-[#A0A0A0]">{new Date(n.created_at).toLocaleString()}</span>
              </div>
              <h3 className="font-bold text-[#222222] dark:text-[#EAEAEA] mb-1">{n.title}</h3>
              <p className="text-sm text-[#666666] dark:text-[#A0A0A0]">{n.message}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button 
                onClick={() => handleEdit(n)}
                className="px-3 py-1 bg-[#F5F4F0] border-2 border-[#222222] text-xs font-bold hover:bg-[#222222] hover:text-white transition-colors"
              >
                수정
              </button>
              <button 
                onClick={() => handleDelete(n.id)}
                className="px-3 py-1 bg-red-50 border-2 border-red-500 text-red-600 text-xs font-bold hover:bg-red-500 hover:text-white transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        ))}
        {notices.length === 0 && !isEditing && (
          <div className="text-center py-12 border-2 border-dashed border-[#A0A0A0] text-[#A0A0A0] font-bold">
            등록된 공지사항이 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
