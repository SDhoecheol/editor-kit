"use client";

import { useState } from "react";
import { changeUserRole } from "../actions";

export default function UsersAdminClient({ initialUsers }: { initialUsers: any[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!confirm(`이 유저의 등급을 '${newRole}'(으)로 변경하시겠습니까?`)) return;

    setIsUpdating(userId);
    const result = await changeUserRole(userId, newRole);
    
    if (result.success) {
      setUsers((prev) => 
        prev.map((u) => u.id === userId ? { ...u, role: newRole } : u)
      );
      alert("등급이 변경되었습니다.");
    } else {
      alert(`변경 실패: ${result.error}`);
    }
    setIsUpdating(null);
  };

  return (
    <div className="bg-white dark:bg-[#1E1E1E] border-4 border-[#222222] dark:border-[#444444] overflow-x-auto shadow-[8px_8px_0px_#222222] dark:shadow-[8px_8px_0px_#111111]">
      <table className="w-full text-left min-w-[600px]">
        <thead className="bg-[#222222] dark:bg-[#333333] text-[#F5F4F0] dark:text-[#EAEAEA] border-b-4 border-[#222222] dark:border-[#444444]">
          <tr>
            <th className="p-4 font-black">이메일</th>
            <th className="p-4 font-black">닉네임</th>
            <th className="p-4 font-black">보유 잉크</th>
            <th className="p-4 font-black text-center">현재 등급</th>
            <th className="p-4 font-black text-center">등급 관리</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr 
              key={user.id} 
              className="border-b-2 border-[#E5E4E0] dark:border-[#333333] hover:bg-[#F5F4F0] dark:hover:bg-[#2A2A2A] transition-colors"
            >
              <td className="p-4 text-sm font-bold text-[#222222] dark:text-[#EAEAEA]">
                {user.email}
              </td>
              <td className="p-4 font-black text-[#222222] dark:text-[#EAEAEA]">
                {user.nickname || "Unknown"}
              </td>
              <td className="p-4 text-sm font-bold text-blue-600 dark:text-blue-400">
                💧 {user.ink?.toLocaleString() || 0}
              </td>
              <td className="p-4 text-center">
                <span className={`inline-block px-2 py-1 text-xs font-black uppercase ${
                  user.role === 'admin' 
                    ? 'bg-red-500 text-white shadow-[2px_2px_0px_#222222]' 
                    : user.role === 'manager'
                      ? 'bg-blue-500 text-white shadow-[2px_2px_0px_#222222]'
                      : 'bg-[#E5E4E0] dark:bg-[#444444] text-[#222222] dark:text-[#EAEAEA]'
                }`}>
                  {user.role || 'user'}
                </span>
              </td>
              <td className="p-4 text-center">
                <div className="flex items-center justify-center gap-2">
                  {isUpdating === user.id ? (
                    <span className="material-symbols-outlined animate-spin text-[#A0A0A0]">sync</span>
                  ) : (
                    <select
                      value={user.role || "user"}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      disabled={isUpdating !== null}
                      className="border-2 border-[#222222] dark:border-[#555555] bg-white dark:bg-[#121212] text-[#222222] dark:text-[#EAEAEA] text-sm font-bold px-2 py-1 outline-none focus:shadow-[2px_2px_0px_#222222] transition-shadow disabled:opacity-50"
                    >
                      <option value="user">USER (일반)</option>
                      <option value="manager">MANAGER (매니저)</option>
                      <option value="admin">ADMIN (총괄)</option>
                    </select>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
