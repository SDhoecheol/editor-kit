"use client";

import { useState } from "react";
import Link from "next/link";

export default function MyPage() {
  const [activeTab, setActiveCat] = useState("나의 활동");

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 md:py-20 space-y-12">
      
      {/* 1. 상단 프로필 헤더 */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-4 border-[#222222] dark:border-[#444444] pb-8">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 md:w-24 md:h-24 bg-[#222222] dark:bg-[#EAEAEA] text-[#F5F4F0] dark:text-[#121212] flex items-center justify-center text-4xl font-black border-4 border-[#222222] dark:border-[#EAEAEA] shadow-[4px_4px_0px_#A0A0A0] dark:shadow-[4px_4px_0px_#111111]">
            필
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-blue-600 text-white px-2 py-0.5 text-[10px] font-black tracking-widest uppercase">
                프로 등급
              </span>
              <span className="bg-[#222222] dark:bg-[#EAEAEA] text-[#F5F4F0] dark:text-[#121212] px-2 py-0.5 text-[10px] font-black tracking-widest uppercase">
                디자이너
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-[#222222] dark:text-[#EAEAEA] tracking-tight">
              필터링천재
            </h1>
            <p className="text-sm font-bold text-[#A0A0A0] dark:text-[#666666] mt-1">
              hello@editorkit.com
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button className="px-5 py-2.5 border-2 border-[#222222] dark:border-[#444444] bg-white dark:bg-[#1E1E1E] text-[#222222] dark:text-[#EAEAEA] font-bold text-sm hover:bg-[#F5F4F0] dark:hover:bg-[#2A2A2A] transition-colors">
            프로필 수정
          </button>
          <button className="px-5 py-2.5 border-2 border-[#222222] dark:border-[#EAEAEA] bg-[#222222] text-[#F5F4F0] dark:bg-[#EAEAEA] dark:text-[#121212] font-black text-sm shadow-[2px_2px_0px_#A0A0A0] dark:shadow-[2px_2px_0px_#111111] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all">
            환경설정
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* 좌측: 잉크(Ink) 지갑 패널 */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] shadow-[4px_4px_0px_#222222] dark:shadow-[4px_4px_0px_#111111] transition-colors overflow-hidden">
            
            <div className="bg-blue-600 dark:bg-blue-500 p-6 text-white">
              <h2 className="text-xs font-black tracking-widest mb-1 opacity-80 uppercase">
                My Ink Balance
              </h2>
              <div className="flex items-end gap-2">
                <span className="material-symbols-outlined text-3xl">water_drop</span>
                <span className="text-5xl font-black tracking-tighter">1,240</span>
              </div>
            </div>

            <div className="p-6">
              <h3 className="text-sm font-black text-[#222222] dark:text-[#EAEAEA] border-b-2 border-[#E5E4E0] dark:border-[#333333] pb-2 mb-4">
                최근 잉크 내역
              </h3>
              <ul className="space-y-3">
                <li className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-[#222222] dark:text-[#EAEAEA]">Q&A 답변 채택 보상</p>
                    <p className="text-[10px] font-bold text-[#A0A0A0] dark:text-[#666666] mt-0.5">2026.04.11 14:20</p>
                  </div>
                  <span className="text-xs font-black text-blue-600 dark:text-blue-400">+100 💧</span>
                </li>
                <li className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-[#222222] dark:text-[#EAEAEA]">자유게시판 게시글 작성</p>
                    <p className="text-[10px] font-bold text-[#A0A0A0] dark:text-[#666666] mt-0.5">2026.04.10 09:15</p>
                  </div>
                  <span className="text-xs font-black text-blue-600 dark:text-blue-400">+30 💧</span>
                </li>
                <li className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-[#222222] dark:text-[#EAEAEA]">게시글 삭제 차감 (어뷰징 방지)</p>
                    <p className="text-[10px] font-bold text-[#A0A0A0] dark:text-[#666666] mt-0.5">2026.04.09 18:05</p>
                  </div>
                  <span className="text-xs font-black text-red-600 dark:text-red-400">-30 💧</span>
                </li>
                <li className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-[#222222] dark:text-[#EAEAEA]">댓글 작성</p>
                    <p className="text-[10px] font-bold text-[#A0A0A0] dark:text-[#666666] mt-0.5">2026.04.08 22:11</p>
                  </div>
                  <span className="text-xs font-black text-blue-600 dark:text-blue-400">+5 💧</span>
                </li>
              </ul>
              
              <button className="w-full mt-6 py-3 border-2 border-[#E5E4E0] dark:border-[#444444] text-[#A0A0A0] dark:text-[#666666] text-xs font-bold hover:border-[#222222] dark:hover:border-[#EAEAEA] hover:text-[#222222] dark:hover:text-[#EAEAEA] transition-colors">
                전체 내역 보기
              </button>
            </div>
            
          </div>
        </div>

        {/* 우측: 나의 활동 패널 */}
        <div className="lg:col-span-8 bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] shadow-[8px_8px_0px_#222222] dark:shadow-[8px_8px_0px_#111111] transition-colors overflow-hidden">
          
          <nav className="flex border-b-2 border-[#222222] dark:border-[#444444] bg-[#F5F4F0] dark:bg-[#2A2A2A]">
            {["나의 활동", "저장한 글", "최근 사용 툴"].map((tab) => (
              <button 
                key={tab}
                onClick={() => setActiveCat(tab)}
                className={`flex-1 py-4 text-sm font-black transition-colors border-r-2 border-[#222222] dark:border-[#444444] last:border-0 ${
                  activeTab === tab 
                    ? 'bg-white dark:bg-[#1E1E1E] text-[#222222] dark:text-[#EAEAEA]' 
                    : 'text-[#A0A0A0] hover:text-[#222222] dark:hover:text-[#EAEAEA]'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>

          <div className="p-0">
            {activeTab === "나의 활동" && (
              <table className="w-full text-left border-collapse whitespace-nowrap min-w-full">
                <thead>
                  <tr className="bg-[#FAFAFA] dark:bg-[#1A1A1A] border-b-2 border-[#E5E4E0] dark:border-[#333333] text-xs font-black text-[#666666] dark:text-[#A0A0A0] tracking-widest text-center">
                    <th className="py-3 w-20">분류</th>
                    <th className="py-3 px-4 text-left">내가 쓴 글 제목</th>
                    <th className="py-3 w-24">작성일</th>
                    <th className="py-3 w-16">조회</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5].map((num) => (
                    <tr key={num} className="border-b border-[#E5E4E0] dark:border-[#333333] cursor-pointer hover:bg-[#F5F4F0] dark:hover:bg-[#2A2A2A] transition-colors group text-center">
                      <td className="py-4">
                        <span className="text-[11px] font-bold px-1.5 py-0.5 border border-[#E5E4E0] dark:border-[#444444] text-[#666666] dark:text-[#A0A0A0]">
                          자유
                        </span>
                      </td>
                      <td className="py-4 px-4 text-left">
                        <h3 className="text-sm font-bold text-[#222222] dark:text-[#EAEAEA] group-hover:text-blue-600 transition-colors truncate max-w-[200px] sm:max-w-[300px]">
                          오늘 거래처 진상 때문에 진짜 퇴사 마렵네요...
                        </h3>
                      </td>
                      <td className="py-4 text-xs font-mono text-[#A0A0A0] dark:text-[#666666]">04.11</td>
                      <td className="py-4 text-xs font-mono text-[#A0A0A0] dark:text-[#666666]">234</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === "최근 사용 툴" && (
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link href="/tools/harikomi" className="group border-2 border-[#E5E4E0] dark:border-[#333333] p-4 hover:border-[#222222] dark:hover:border-[#EAEAEA] transition-colors flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#F5F4F0] dark:bg-[#2A2A2A] border-2 border-[#222222] dark:border-[#444444] flex items-center justify-center group-hover:bg-[#222222] group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined">grid_on</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#222222] dark:text-[#EAEAEA]">하리꼬미 조판 계산기</h4>
                    <p className="text-xs font-bold text-[#A0A0A0] dark:text-[#666666] mt-1">오늘 14:20 사용</p>
                  </div>
                </Link>
                <Link href="/tools/mockup3d" className="group border-2 border-[#E5E4E0] dark:border-[#333333] p-4 hover:border-[#222222] dark:hover:border-[#EAEAEA] transition-colors flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#F5F4F0] dark:bg-[#2A2A2A] border-2 border-[#222222] dark:border-[#444444] flex items-center justify-center group-hover:bg-[#222222] group-hover:text-white transition-colors">
                    <span className="material-symbols-outlined">view_in_ar</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[#222222] dark:text-[#EAEAEA]">3D 패키징 목업</h4>
                    <p className="text-xs font-bold text-[#A0A0A0] dark:text-[#666666] mt-1">어제 09:15 사용</p>
                  </div>
                </Link>
              </div>
            )}
            
            {activeTab === "저장한 글" && (
              <div className="p-12 text-center">
                <span className="material-symbols-outlined text-5xl text-[#E5E4E0] dark:text-[#333333] mb-4">bookmark</span>
                <p className="text-sm font-bold text-[#A0A0A0] dark:text-[#666666]">아직 스크랩하여 저장한 글이 없습니다.</p>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}