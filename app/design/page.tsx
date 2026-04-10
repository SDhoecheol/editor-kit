"use client";

import { useState, useEffect } from "react";

export default function DesignSystemReference() {
  const [isDark, setIsDark] = useState(false);

  // 다크모드 토글 로직
  const toggleDarkMode = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }
  };

  // 컴포넌트 마운트 시 현재 HTML의 다크모드 상태 확인
  useEffect(() => {
    if (document.documentElement.classList.contains('dark')) {
      setIsDark(true);
    }
  }, []);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#121212] text-[#EAEAEA]' : 'bg-[#F5F4F0] text-[#222222]'}`}>
      <div className="max-w-5xl mx-auto p-8 md:p-16 space-y-16">
        
        {/* Header */}
        <header className={`border-b-4 pb-6 mb-12 flex justify-between items-end transition-colors ${isDark ? 'border-[#444444]' : 'border-[#222222]'}`}>
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase">EditorKit Design System</h1>
            <p className={`mt-2 font-mono text-sm ${isDark ? 'text-[#A0A0A0]' : 'text-[#666666]'}`}>
              Theme: Paper & Ink (Soft Neo-Brutalism) - Full Reference
            </p>
          </div>
          <span className={`px-3 py-1 text-xs font-bold uppercase tracking-widest transition-colors ${isDark ? 'bg-[#333333] text-[#EAEAEA]' : 'bg-[#222222] text-[#F5F4F0]'}`}>
            v2.2
          </span>
        </header>

        {/* 1. Buttons */}
        <section>
          <h2 className={`text-xl font-bold mb-6 border-b-2 pb-2 transition-colors ${isDark ? 'border-[#333333]' : 'border-[#E5E4E0]'}`}>
            1. Buttons (버튼)
          </h2>
          <div className="flex flex-wrap gap-6 items-center">
            <button className={`border-2 px-6 py-2.5 font-bold transition-all flex items-center gap-2 ${isDark ? 'bg-[#EAEAEA] text-[#121212] border-[#EAEAEA] shadow-[4px_4px_0px_#444444] hover:shadow-[2px_2px_0px_#444444]' : 'bg-[#222222] text-[#F5F4F0] border-[#222222] shadow-[4px_4px_0px_#222222] hover:shadow-[2px_2px_0px_#222222]'} hover:translate-x-[2px] hover:translate-y-[2px]`}>
              시작하기 <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
            <button className={`border-2 px-6 py-2.5 font-bold transition-all ${isDark ? 'bg-[#1E1E1E] text-[#EAEAEA] border-[#444444] shadow-[4px_4px_0px_#111111] hover:bg-[#2A2A2A] hover:border-[#666666] hover:shadow-[2px_2px_0px_#111111]' : 'bg-white text-[#222222] border-[#222222] shadow-[4px_4px_0px_#222222] hover:bg-[#222222] hover:text-[#F5F4F0] hover:shadow-[2px_2px_0px_#222222]'} hover:translate-x-[2px] hover:translate-y-[2px]`}>
              취소
            </button>
            <button onClick={toggleDarkMode} className={`w-12 h-12 border-2 flex items-center justify-center transition-all ${isDark ? 'bg-[#1E1E1E] text-[#EAEAEA] border-[#444444] shadow-[4px_4px_0px_#111111] hover:shadow-[2px_2px_0px_#111111] hover:bg-[#2A2A2A]' : 'bg-[#F5F4F0] text-[#222222] border-[#222222] shadow-[4px_4px_0px_#222222] hover:shadow-[2px_2px_0px_#222222] hover:bg-white'} hover:translate-x-[2px] hover:translate-y-[2px]`}>
              <span className="material-symbols-outlined">{isDark ? 'light_mode' : 'dark_mode'}</span>
            </button>
          </div>
        </section>

        {/* 2. Form Elements */}
        <section>
          <h2 className={`text-xl font-bold mb-6 border-b-2 pb-2 transition-colors ${isDark ? 'border-[#333333]' : 'border-[#E5E4E0]'}`}>
            2. Form Elements (입력 요소)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col gap-2">
              <label className={`font-bold text-sm ${isDark ? 'text-[#A0A0A0]' : 'text-[#222222]'}`}>닉네임</label>
              <input type="text" placeholder="최대 15자 입력" className={`border-2 px-4 py-3 outline-none focus:-translate-y-1 transition-all ${isDark ? 'bg-[#121212] border-[#444444] text-[#EAEAEA] focus:shadow-[4px_4px_0px_#333333] focus:border-[#666666] placeholder:text-[#555555]' : 'bg-white border-[#222222] focus:shadow-[4px_4px_0px_#222222] placeholder:text-[#A0A0A0]'}`} />
            </div>
            <div className="flex flex-col gap-2">
              <label className={`font-bold text-sm ${isDark ? 'text-[#A0A0A0]' : 'text-[#222222]'}`}>지류 선택 (세네카 계산기)</label>
              <div className="relative">
                <select className={`w-full border-2 px-4 py-3 appearance-none outline-none focus:-translate-y-1 transition-all cursor-pointer font-bold ${isDark ? 'bg-[#121212] border-[#444444] text-[#EAEAEA] focus:shadow-[4px_4px_0px_#333333] focus:border-[#666666]' : 'bg-white border-[#222222] focus:shadow-[4px_4px_0px_#222222]'}`}>
                  <option>스노우지</option>
                  <option>아트지</option>
                  <option>모조지 (백색)</option>
                </select>
                <span className={`material-symbols-outlined absolute right-4 top-3 pointer-events-none ${isDark ? 'text-[#A0A0A0]' : ''}`}>expand_more</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="relative flex items-center cursor-pointer">
                <input type="checkbox" className="peer sr-only" defaultChecked />
                <div className={`w-6 h-6 border-2 transition-colors flex items-center justify-center ${isDark ? 'bg-[#121212] border-[#444444] peer-checked:bg-[#EAEAEA]' : 'bg-white border-[#222222] peer-checked:bg-[#222222]'}`}>
                  <span className={`material-symbols-outlined text-[18px] opacity-0 peer-checked:opacity-100 ${isDark ? 'text-[#121212]' : 'text-white'}`}>check</span>
                </div>
                <span className={`ml-3 font-bold text-sm ${isDark ? 'text-[#A0A0A0]' : 'text-[#222222]'}`}>재단선(Crop Marks) 추가</span>
              </label>
            </div>
          </div>
        </section>

        {/* 3. Badges & Tags */}
        <section>
          <h2 className={`text-xl font-bold mb-6 border-b-2 pb-2 transition-colors ${isDark ? 'border-[#333333]' : 'border-[#E5E4E0]'}`}>
            3. Badges & Tags (뱃지 및 태그)
          </h2>
          <div className="flex flex-wrap gap-4 items-center">
            <span className={`border px-3 py-1 text-sm font-bold rounded-full transition-colors cursor-pointer ${isDark ? 'bg-[#1E1E1E] border-[#444444] hover:bg-[#EAEAEA] hover:text-[#121212]' : 'bg-white border-[#222222] hover:bg-[#222222] hover:text-white'}`}>
              #편집디자이너
            </span>
            <span className={`border px-3 py-1 text-sm font-bold rounded-full transition-colors cursor-pointer ${isDark ? 'bg-[#EAEAEA] text-[#121212] border-[#EAEAEA] hover:bg-[#1E1E1E] hover:text-[#EAEAEA]' : 'bg-[#222222] text-white border-[#222222] hover:bg-white hover:text-[#222222]'}`}>
              #인쇄기장
            </span>
            <div className={`w-px h-6 mx-2 ${isDark ? 'bg-[#333333]' : 'bg-[#E5E4E0]'}`}></div>
            <span className={`border-2 px-2 py-0.5 text-xs font-black uppercase tracking-wider ${isDark ? 'bg-blue-500 text-white border-blue-500' : 'bg-blue-600 text-white border-blue-600'}`}>
              PRO
            </span>
            <span className={`border px-2 py-0.5 text-[10px] font-black uppercase tracking-widest border-dashed ${isDark ? 'bg-[#1E1E1E] text-[#EAEAEA] border-[#444444]' : 'bg-white text-[#222222] border-[#222222]'}`}>
              Beta
            </span>
            <span className={`border px-2 py-0.5 text-xs font-bold ${isDark ? 'bg-[#2A1010] text-red-400 border-red-400' : 'bg-[#F5F4F0] text-red-600 border-red-600'}`}>
              [해결됨]
            </span>
          </div>
        </section>

        {/* 4. Callouts */}
        <section>
          <h2 className={`text-xl font-bold mb-6 border-b-2 pb-2 transition-colors ${isDark ? 'border-[#333333]' : 'border-[#E5E4E0]'}`}>
            4. Callouts (알림/정보 박스)
          </h2>
          <div className="flex flex-col gap-4">
            <div className={`border-2 border-l-8 p-4 flex gap-4 items-start ${isDark ? 'bg-[#1E1E1E] border-[#444444] shadow-[4px_4px_0px_#111111]' : 'bg-white border-[#222222] shadow-[4px_4px_0px_#E5E4E0]'}`}>
              <span className={`material-symbols-outlined ${isDark ? 'text-[#EAEAEA]' : 'text-[#222222]'}`}>info</span>
              <div>
                <h4 className="font-bold">업로드 안내</h4>
                <p className={`text-sm mt-1 ${isDark ? 'text-[#A0A0A0]' : 'text-[#666666]'}`}>PDF 파일은 최대 50MB, 200페이지까지만 업로드 가능합니다.</p>
              </div>
            </div>
            <div className={`border-2 border-l-8 p-4 flex gap-4 items-start ${isDark ? 'bg-[#332A00] border-[#444444] border-l-yellow-500 shadow-[4px_4px_0px_#111111]' : 'bg-yellow-50 border-[#222222] border-l-yellow-400 shadow-[4px_4px_0px_#E5E4E0]'}`}>
              <span className={`material-symbols-outlined ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>warning</span>
              <div>
                <h4 className="font-bold">해상도 경고</h4>
                <p className={`text-sm mt-1 ${isDark ? 'text-[#A0A0A0]' : 'text-[#666666]'}`}>이미지 해상도가 300DPI 미만입니다. 인쇄 시 깨질 위험이 있습니다.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Community Tools */}
        <section>
          <h2 className={`text-xl font-bold mb-6 border-b-2 pb-2 transition-colors ${isDark ? 'border-[#333333]' : 'border-[#E5E4E0]'}`}>
            5. Community Tools (커뮤니티 전용 요소)
          </h2>
          <div className="mb-8">
            <h3 className="text-sm font-bold text-[#A0A0A0] mb-3 uppercase tracking-wider">사용자 표시</h3>
            <div className={`inline-flex items-center gap-3 border px-4 py-2 transition-colors cursor-pointer ${isDark ? 'bg-[#1E1E1E] border-[#444444] hover:border-[#888888]' : 'bg-white border-[#E5E4E0] hover:border-[#222222]'}`}>
              <div className={`w-8 h-8 flex items-center justify-center font-bold text-sm ${isDark ? 'bg-[#EAEAEA] text-[#121212]' : 'bg-[#222222] text-[#F5F4F0]'}`}>E</div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="font-bold text-sm">마감에쫓기는 스포이드</span>
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="온라인"></span>
                </div>
                <div className={`text-xs flex gap-1 mt-0.5 ${isDark ? 'text-[#666666]' : 'text-[#A0A0A0]'}`}>
                  <span>Ps</span> <span>Ai</span>
                </div>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#A0A0A0] mb-3 uppercase tracking-wider">페이징 (Pagination)</h3>
            <div className="flex items-center gap-1">
              <button className={`px-3 py-1 border transition-colors font-mono text-sm ${isDark ? 'bg-[#1E1E1E] border-[#444444] text-[#A0A0A0] hover:border-[#888888] hover:text-[#EAEAEA]' : 'bg-white border-[#E5E4E0] text-[#A0A0A0] hover:border-[#222222] hover:text-[#222222]'}`}>&lt;</button>
              <button className={`px-3 py-1 border-2 font-mono text-sm font-bold ${isDark ? 'bg-[#EAEAEA] text-[#121212] border-[#EAEAEA]' : 'bg-[#222222] text-white border-[#222222]'}`}>1</button>
              <button className={`px-3 py-1 border transition-colors font-mono text-sm ${isDark ? 'bg-[#1E1E1E] border-[#444444] hover:border-[#888888]' : 'bg-white border-[#E5E4E0] hover:border-[#222222]'}`}>2</button>
              <button className={`px-3 py-1 border transition-colors font-mono text-sm ${isDark ? 'bg-[#1E1E1E] border-[#444444] hover:border-[#888888]' : 'bg-white border-[#E5E4E0] hover:border-[#222222]'}`}>3</button>
              <button className={`px-3 py-1 border transition-colors font-mono text-sm ${isDark ? 'bg-[#1E1E1E] border-[#444444] hover:border-[#888888]' : 'bg-white border-[#E5E4E0] hover:border-[#222222]'}`}>4</button>
              <button className={`px-3 py-1 border transition-colors font-mono text-sm ${isDark ? 'bg-[#1E1E1E] border-[#444444] hover:border-[#888888]' : 'bg-white border-[#E5E4E0] hover:border-[#222222]'}`}>5</button>
              <button className={`px-3 py-1 border transition-colors font-mono text-sm ${isDark ? 'bg-[#1E1E1E] border-[#444444] text-[#A0A0A0] hover:border-[#888888] hover:text-[#EAEAEA]' : 'bg-white border-[#E5E4E0] text-[#A0A0A0] hover:border-[#222222] hover:text-[#222222]'}`}>&gt;</button>
            </div>
          </div>
        </section>

        {/* 6. Tabs & Navigation */}
        <section>
          <h2 className={`text-xl font-bold mb-6 border-b-2 pb-2 transition-colors ${isDark ? 'border-[#333333]' : 'border-[#E5E4E0]'}`}>
            6. Tabs & Navigation (상단 카테고리 탭)
          </h2>
          <div className={`flex items-end border-b-2 mt-4 transition-colors ${isDark ? 'border-[#444444]' : 'border-[#222222]'}`}>
            <button className={`px-6 py-3 font-black border-2 -mb-[2px] transition-all ${isDark ? 'text-[#EAEAEA] border-[#444444] border-b-[#1E1E1E] bg-[#1E1E1E]' : 'text-[#222222] border-[#222222] border-b-white bg-white'}`}>
              자유게시판
            </button>
            <button className={`px-6 py-3 font-bold border-2 border-transparent transition-all ${isDark ? 'text-[#A0A0A0] hover:text-[#EAEAEA]' : 'text-[#666666] hover:text-[#222222]'}`}>
              Q&A
            </button>
            <button className={`px-6 py-3 font-bold border-2 border-transparent flex items-center gap-1 transition-all ${isDark ? 'text-[#A0A0A0] hover:text-[#EAEAEA]' : 'text-[#666666] hover:text-[#222222]'}`}>
              포트폴리오 <span className={`material-symbols-outlined text-[16px] ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>image</span>
            </button>
          </div>
        </section>

        {/* 7. Board List */}
        <section>
          <h2 className={`text-xl font-bold mb-6 border-b-2 pb-2 transition-colors ${isDark ? 'border-[#333333]' : 'border-[#E5E4E0]'}`}>
            7. Board List (고밀도 게시판 리스트)
          </h2>
          <div className={`border-2 transition-colors ${isDark ? 'bg-[#1E1E1E] border-[#444444]' : 'bg-white border-[#222222]'}`}>
            <div className={`flex items-center justify-between px-4 py-2 border-b-2 text-xs font-bold ${isDark ? 'bg-[#2A2A2A] border-[#444444] text-[#A0A0A0]' : 'bg-[#F5F4F0] border-[#222222] text-[#666666]'}`}>
              <div className="flex w-2/3 items-center gap-4">
                <span className="w-8 text-center font-mono">NO</span>
                <span>제목</span>
              </div>
              <div className="flex w-1/3 items-center justify-end gap-6 text-right">
                <span className="w-24">글쓴이</span>
                <span className="w-16 font-mono">날짜</span>
                <span className="w-10 font-mono">조회</span>
              </div>
            </div>

            <div className={`flex items-center justify-between px-4 py-2.5 border-b cursor-pointer group transition-colors ${isDark ? 'border-[#333333] hover:bg-[#262626]' : 'border-[#E5E4E0] hover:bg-gray-50'}`}>
              <div className="flex w-2/3 items-center gap-4">
                <span className={`w-8 text-center font-mono text-sm ${isDark ? 'text-[#666666]' : 'text-[#A0A0A0]'}`}>142</span>
                <span className={`text-xs font-bold ${isDark ? 'text-[#666666]' : 'text-[#A0A0A0]'}`}>[일반]</span>
                <span className={`font-bold group-hover:underline truncate ${isDark ? 'text-[#EAEAEA]' : 'text-[#222222]'}`}>오늘 출력소 빌런 썰 푼다 ㅋㅋㅋ</span>
                <span className={`text-xs font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>[12]</span>
                <span className={`material-symbols-outlined text-[14px] ${isDark ? 'text-red-400' : 'text-red-500'}`}>new_releases</span>
              </div>
              <div className={`flex w-1/3 items-center justify-end gap-6 text-sm ${isDark ? 'text-[#888888]' : 'text-[#666666]'}`}>
                <span className={`w-24 truncate font-bold flex items-center justify-end gap-1 ${isDark ? 'text-[#A0A0A0]' : 'text-[#222222]'}`}>김기장 <span className={`text-[10px] px-1 rounded ${isDark ? 'bg-[#333333]' : 'bg-[#E5E4E0]'}`}>Id</span></span>
                <span className="w-16 font-mono text-xs">10:42</span>
                <span className="w-10 font-mono text-xs text-right">340</span>
              </div>
            </div>

            <div className={`flex items-center justify-between px-4 py-2.5 border-b cursor-pointer transition-colors ${isDark ? 'bg-[#222222] border-[#333333] hover:bg-[#2A2A2A]' : 'bg-gray-100 border-[#E5E4E0] hover:bg-gray-200'}`}>
              <div className="flex w-2/3 items-center gap-4">
                <span className={`w-8 text-center text-xs font-black py-0.5 ${isDark ? 'bg-[#EAEAEA] text-[#121212]' : 'bg-[#222222] text-white'}`}>공지</span>
                <span className={`font-bold ${isDark ? 'text-[#EAEAEA]' : 'text-[#222222]'}`}>에디터킷 커뮤니티 이용 규칙 안내</span>
              </div>
              <div className={`flex w-1/3 items-center justify-end gap-6 text-sm ${isDark ? 'text-[#888888]' : 'text-[#666666]'}`}>
                <span className={`w-24 truncate font-bold ${isDark ? 'text-[#EAEAEA]' : 'text-[#222222]'}`}>운영자</span>
                <span className="w-16 font-mono text-xs">04.09</span>
                <span className="w-10 font-mono text-xs text-right">-</span>
              </div>
            </div>
          </div>
        </section>

        {/* 8. Upload Dropzone */}
        <section>
          <h2 className={`text-xl font-bold mb-6 border-b-2 pb-2 transition-colors ${isDark ? 'border-[#333333]' : 'border-[#E5E4E0]'}`}>
            8. Upload Dropzone (파일 업로드)
          </h2>
          <div className={`border-2 border-dashed p-12 flex flex-col items-center justify-center text-center cursor-pointer group transition-colors ${isDark ? 'border-[#666666] bg-[#1E1E1E] hover:border-[#A0A0A0] hover:bg-[#2A2A2A]' : 'border-[#A0A0A0] bg-white hover:border-[#222222] hover:bg-[#F5F4F0]'}`}>
            <div className={`w-16 h-16 border-2 flex items-center justify-center mb-4 transition-colors ${isDark ? 'bg-[#2A2A2A] border-[#444444] group-hover:bg-[#EAEAEA] group-hover:border-[#EAEAEA]' : 'bg-[#F5F4F0] border-[#222222] group-hover:bg-[#222222]'}`}>
              <span className={`material-symbols-outlined text-3xl ${isDark ? 'text-[#EAEAEA] group-hover:text-[#121212]' : 'text-[#222222] group-hover:text-white'}`}>upload_file</span>
            </div>
            <h3 className={`text-lg font-black mb-1 ${isDark ? 'text-[#EAEAEA]' : 'text-[#222222]'}`}>여기로 PDF 파일을 드래그 하세요</h3>
            <p className={`text-sm ${isDark ? 'text-[#888888]' : 'text-[#666666]'}`}>또는 클릭해서 파일 선택 (최대 50MB)</p>
          </div>
        </section>

        {/* 9. Modal Box */}
        <section>
          <h2 className={`text-xl font-bold mb-6 border-b-2 pb-2 transition-colors ${isDark ? 'border-[#333333]' : 'border-[#E5E4E0]'}`}>
            9. Modal Box (모달/팝업창)
          </h2>
          <div className={`border-2 max-w-sm p-6 relative transition-colors ${isDark ? 'bg-[#1E1E1E] border-[#444444] shadow-[8px_8px_0px_#111111]' : 'bg-white border-[#222222] shadow-[8px_8px_0px_#222222]'}`}>
            <button className={`absolute top-4 right-4 transition-colors ${isDark ? 'text-[#666666] hover:text-[#EAEAEA]' : 'text-[#A0A0A0] hover:text-[#222222]'}`}>
              <span className="material-symbols-outlined">close</span>
            </button>
            <div className="flex items-center gap-3 mb-4">
              <span className={`material-symbols-outlined text-3xl ${isDark ? 'text-red-400' : 'text-red-600'}`}>delete_forever</span>
              <h3 className={`text-xl font-black ${isDark ? 'text-[#EAEAEA]' : ''}`}>정말 삭제할까요?</h3>
            </div>
            <p className={`text-sm leading-relaxed mb-6 ${isDark ? 'text-[#A0A0A0]' : 'text-[#666666]'}`}>
              이 게시글을 삭제하면 복구할 수 없으며, 획득한 <strong className={`${isDark ? 'text-[#EAEAEA]' : 'text-[#222222]'}`}>30 잉크(Ink)</strong>가 차감됩니다.
            </p>
            <div className="flex gap-3 justify-end">
              <button className={`px-4 py-2 font-bold border-2 text-sm transition-colors ${isDark ? 'border-[#444444] text-[#A0A0A0] hover:bg-[#2A2A2A] hover:text-[#EAEAEA]' : 'border-[#222222] hover:bg-[#F5F4F0]'}`}>취소</button>
              <button className={`px-4 py-2 font-bold border-2 text-white text-sm transition-colors ${isDark ? 'border-transparent bg-red-700 hover:bg-red-600 shadow-[2px_2px_0px_#111111]' : 'border-[#222222] bg-red-600 hover:bg-red-700 shadow-[2px_2px_0px_#222222]'}`}>삭제하기</button>
            </div>
          </div>
        </section>

        {/* 10. Post Detail Header */}
        <section>
          <h2 className={`text-xl font-bold mb-6 border-b-2 pb-2 transition-colors ${isDark ? 'border-[#333333]' : 'border-[#E5E4E0]'}`}>
            10. Post Detail Header (게시글 헤더)
          </h2>
          <div className={`border-2 p-8 transition-colors ${isDark ? 'bg-[#1E1E1E] border-[#444444]' : 'bg-white border-[#222222]'}`}>
            <div className="flex items-center gap-2 mb-4">
              <span className={`text-xs font-bold border px-2 py-0.5 ${isDark ? 'text-[#A0A0A0] border-[#444444]' : 'text-[#666666] border-[#E5E4E0]'}`}>자유게시판</span>
              <span className={`text-xs font-bold border px-2 py-0.5 ${isDark ? 'text-blue-400 border-blue-900/50 bg-blue-900/20' : 'text-blue-600 border-blue-200 bg-blue-50'}`}>[정보/팁]</span>
            </div>
            <h1 className={`text-2xl font-black mb-6 leading-tight ${isDark ? 'text-[#EAEAEA]' : ''}`}>인디자인 버그 걸렸을 때 해결하는 야매 팁 공유함</h1>
            <div className={`flex items-center justify-between border-t pt-4 ${isDark ? 'border-[#333333]' : 'border-[#E5E4E0]'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 flex items-center justify-center font-bold text-sm ${isDark ? 'bg-[#333333] text-[#EAEAEA]' : 'bg-[#222222] text-white'}`}>P</div>
                <div>
                  <div className={`font-bold text-sm ${isDark ? 'text-[#EAEAEA]' : ''}`}>편집노예 <span className={`text-[10px] px-1 rounded ml-1 ${isDark ? 'bg-[#333333] text-[#A0A0A0]' : 'bg-[#E5E4E0] text-[#666666]'}`}>Id</span></div>
                  <div className={`text-xs font-mono mt-0.5 ${isDark ? 'text-[#666666]' : 'text-[#A0A0A0]'}`}>2026.04.09 14:30</div>
                </div>
              </div>
              <div className={`flex items-center gap-4 text-sm font-mono ${isDark ? 'text-[#888888]' : 'text-[#666666]'}`}>
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">visibility</span> 1,204</span>
                <span className={`flex items-center gap-1 ${isDark ? 'text-red-400' : 'text-red-600'}`}><span className="material-symbols-outlined text-[16px] text-current">favorite</span> 34</span>
                <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">chat_bubble</span> 8</span>
              </div>
            </div>
          </div>
        </section>

        {/* 11. Comments */}
        <section>
          <h2 className={`text-xl font-bold mb-6 border-b-2 pb-2 transition-colors ${isDark ? 'border-[#333333]' : 'border-[#E5E4E0]'}`}>
            11. Comments (댓글)
          </h2>
          <div className={`border-2 p-6 transition-colors ${isDark ? 'bg-[#1E1E1E] border-[#444444]' : 'bg-white border-[#222222]'}`}>
            <h3 className={`font-black text-lg mb-4 flex items-center gap-2 ${isDark ? 'text-[#EAEAEA]' : ''}`}>
              댓글 <span className={`${isDark ? 'text-blue-400' : 'text-blue-600'}`}>3</span>
            </h3>
            <div className="space-y-4 mb-8">
              <div className={`border-b pb-4 ${isDark ? 'border-[#333333]' : 'border-[#E5E4E0]'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-sm ${isDark ? 'text-[#EAEAEA]' : ''}`}>마젠타100</span>
                    <span className={`text-[10px] px-1 rounded ${isDark ? 'bg-[#333333] text-[#A0A0A0]' : 'bg-[#E5E4E0]'}`}>Ai</span>
                    <span className={`text-xs font-mono ml-2 ${isDark ? 'text-[#666666]' : 'text-[#A0A0A0]'}`}>14:35</span>
                  </div>
                </div>
                <p className={`text-sm ${isDark ? 'text-[#A0A0A0]' : 'text-[#222222]'}`}>오 이거 진짜 꿀팁이네요. 어제 이것 때문에 2시간 날렸는데 ㅠㅠ 감사합니다!</p>
              </div>
              <div className={`border-b pb-4 -mx-6 px-6 pt-4 transition-colors ${isDark ? 'border-[#333333] bg-[#262626]' : 'border-[#E5E4E0] bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-sm ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>편집노예</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${isDark ? 'bg-[#EAEAEA] text-[#121212]' : 'bg-[#222222] text-white'}`}>작성자</span>
                    <span className={`text-[10px] px-1 rounded ${isDark ? 'bg-[#333333] text-[#A0A0A0]' : 'bg-[#E5E4E0]'}`}>Id</span>
                    <span className={`text-xs font-mono ml-2 ${isDark ? 'text-[#666666]' : 'text-[#A0A0A0]'}`}>14:38</span>
                  </div>
                </div>
                <p className={`text-sm ${isDark ? 'text-[#A0A0A0]' : 'text-[#222222]'}`}>그쵸 ㅋㅋ 저도 처음에 엄청 헤맸어요. 도움되셨다니 다행입니다.</p>
              </div>
            </div>
            <div className="flex flex-col gap-2 relative">
              <textarea placeholder="댓글을 입력하세요..." className={`w-full border-2 p-3 text-sm outline-none resize-none h-24 transition-colors ${isDark ? 'bg-[#121212] border-[#444444] text-[#EAEAEA] focus:bg-[#1E1E1E] focus:border-[#666666]' : 'bg-[#F5F4F0] border-[#222222] focus:bg-white'}`}></textarea>
              <div className="absolute bottom-3 right-3">
                 <button className={`px-4 py-1.5 text-xs font-bold transition-colors ${isDark ? 'bg-[#EAEAEA] text-[#121212] hover:bg-white' : 'bg-[#222222] text-white hover:bg-black'}`}>등록</button>
              </div>
            </div>
          </div>
        </section>

        {/* 12. Editor Toolbar */}
        <section>
          <h2 className={`text-xl font-bold mb-6 border-b-2 pb-2 transition-colors ${isDark ? 'border-[#333333]' : 'border-[#E5E4E0]'}`}>
            12. Editor Toolbar (글쓰기 툴바)
          </h2>
          <div className={`border-2 transition-colors ${isDark ? 'bg-[#1E1E1E] border-[#444444]' : 'bg-white border-[#222222]'}`}>
            <div className={`flex items-center gap-1 border-b-2 p-2 transition-colors ${isDark ? 'border-[#444444] bg-[#262626]' : 'border-[#222222] bg-[#F5F4F0]'}`}>
              <button className={`w-8 h-8 flex items-center justify-center transition-colors rounded ${isDark ? 'text-[#A0A0A0] hover:bg-[#333333] hover:text-[#EAEAEA]' : 'hover:bg-[#E5E4E0]'}`}><span className="material-symbols-outlined text-[20px] font-bold">format_bold</span></button>
              <button className={`w-8 h-8 flex items-center justify-center transition-colors rounded ${isDark ? 'text-[#A0A0A0] hover:bg-[#333333] hover:text-[#EAEAEA]' : 'hover:bg-[#E5E4E0]'}`}><span className="material-symbols-outlined text-[20px] italic">format_italic</span></button>
              <button className={`w-8 h-8 flex items-center justify-center transition-colors rounded ${isDark ? 'text-[#A0A0A0] hover:bg-[#333333] hover:text-[#EAEAEA]' : 'hover:bg-[#E5E4E0]'}`}><span className="material-symbols-outlined text-[20px]">strikethrough_s</span></button>
              <div className={`w-px h-5 mx-1 ${isDark ? 'bg-[#444444]' : 'bg-[#A0A0A0]'}`}></div>
              <button className={`w-8 h-8 flex items-center justify-center transition-colors rounded ${isDark ? 'text-[#A0A0A0] hover:bg-[#333333] hover:text-[#EAEAEA]' : 'hover:bg-[#E5E4E0]'}`}><span className="material-symbols-outlined text-[20px]">format_list_bulleted</span></button>
              <button className={`w-8 h-8 flex items-center justify-center transition-colors rounded ${isDark ? 'text-[#A0A0A0] hover:bg-[#333333] hover:text-[#EAEAEA]' : 'hover:bg-[#E5E4E0]'}`}><span className="material-symbols-outlined text-[20px]">format_list_numbered</span></button>
              <div className={`w-px h-5 mx-1 ${isDark ? 'bg-[#444444]' : 'bg-[#A0A0A0]'}`}></div>
              <button className={`w-8 h-8 flex items-center justify-center transition-colors rounded ${isDark ? 'text-blue-400 hover:bg-[#333333]' : 'text-blue-600 hover:bg-[#E5E4E0]'}`}><span className="material-symbols-outlined text-[20px]">link</span></button>
              <button className={`w-8 h-8 flex items-center justify-center transition-colors rounded ${isDark ? 'text-green-400 hover:bg-[#333333]' : 'text-green-600 hover:bg-[#E5E4E0]'}`}><span className="material-symbols-outlined text-[20px]">image</span></button>
            </div>
            <div className={`p-4 h-40 text-sm ${isDark ? 'text-[#666666]' : 'text-[#A0A0A0]'}`}>
              본문 내용을 입력하세요...
            </div>
          </div>
        </section>

        {/* 13. Tooltip & Popover */}
        <section>
          <h2 className={`text-xl font-bold mb-6 border-b-2 pb-2 transition-colors ${isDark ? 'border-[#333333]' : 'border-[#E5E4E0]'}`}>
            13. Tooltip & Small Popover (툴팁)
          </h2>
          <div className="flex gap-8 items-center h-32">
            <div className={`relative group cursor-pointer flex items-center justify-center w-10 h-10 border-2 rounded-full transition-colors ${isDark ? 'border-[#444444] bg-[#1E1E1E] text-[#A0A0A0]' : 'border-[#222222] bg-white'}`}>
              <span className="material-symbols-outlined text-[20px]">help</span>
              <div className={`absolute bottom-full mb-2 hidden group-hover:block w-48 text-xs p-2 ${isDark ? 'bg-[#333333] text-[#EAEAEA] shadow-[4px_4px_0px_#111111]' : 'bg-[#222222] text-white shadow-[4px_4px_0px_#E5E4E0]'}`}>
                세네카 계산 시 제본 오차를 방지하기 위해 0.5mm 단위로 올림 보정됩니다.
                <div className={`absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent ${isDark ? 'border-t-[#333333]' : 'border-t-[#222222]'}`}></div>
              </div>
            </div>
            <div className={`relative group cursor-pointer inline-flex items-center gap-1 font-bold text-sm border px-3 py-1 transition-colors ${isDark ? 'bg-[#1E1E1E] text-[#EAEAEA] border-[#444444]' : 'bg-white border-[#222222]'}`}>
              정렬: 최신순 <span className="material-symbols-outlined text-[16px]">expand_more</span>
              <div className={`absolute top-full left-0 mt-1 hidden group-hover:block w-32 border-2 z-10 flex-col ${isDark ? 'bg-[#1E1E1E] border-[#444444] shadow-[4px_4px_0px_#111111]' : 'bg-white border-[#222222] shadow-[4px_4px_0px_#222222]'}`}>
                <div className={`px-4 py-2 text-sm font-bold ${isDark ? 'hover:bg-[#2A2A2A] text-[#EAEAEA]' : 'hover:bg-[#F5F4F0]'}`}>최신순</div>
                <div className={`px-4 py-2 text-sm ${isDark ? 'hover:bg-[#2A2A2A] text-[#A0A0A0]' : 'hover:bg-[#F5F4F0] text-[#666666]'}`}>추천순</div>
                <div className={`px-4 py-2 text-sm ${isDark ? 'hover:bg-[#2A2A2A] text-[#A0A0A0]' : 'hover:bg-[#F5F4F0] text-[#666666]'}`}>조회순</div>
              </div>
            </div>
          </div>
        </section>

        {/* 14. Toast Notification */}
        <section>
          <h2 className={`text-xl font-bold mb-6 border-b-2 pb-2 transition-colors ${isDark ? 'border-[#333333]' : 'border-[#E5E4E0]'}`}>
            14. Toast Notification (토스트 알림)
          </h2>
          <div className="flex flex-col gap-4">
            <div className={`border-2 p-4 flex items-center justify-between max-w-sm transition-colors ${isDark ? 'bg-[#1E1E1E] border-[#444444] shadow-[4px_4px_0px_#111111]' : 'bg-white border-[#222222] shadow-[4px_4px_0px_#222222]'}`}>
              <div className="flex items-center gap-3">
                 <div className={`w-6 h-6 flex items-center justify-center rounded-full ${isDark ? 'bg-[#EAEAEA] text-[#121212]' : 'bg-[#222222] text-white'}`}>
                    <span className="material-symbols-outlined text-[16px]">check</span>
                 </div>
                 <p className={`font-bold text-sm ${isDark ? 'text-[#EAEAEA]' : ''}`}>링크가 클립보드에 복사되었습니다.</p>
              </div>
              <button className={`transition-colors ${isDark ? 'text-[#666666] hover:text-[#EAEAEA]' : 'text-[#A0A0A0] hover:text-[#222222]'}`}><span className="material-symbols-outlined text-[18px]">close</span></button>
            </div>
            <div className={`border-2 p-4 flex items-center gap-3 max-w-sm animate-bounce transition-colors ${isDark ? 'bg-[#2A2A2A] border-[#444444] text-[#EAEAEA] shadow-[4px_4px_0px_#111111]' : 'bg-[#222222] border-[#222222] text-white shadow-[4px_4px_0px_#E5E4E0]'}`}>
               <span className="text-xl">💧</span>
               <div>
                 <p className={`font-black text-sm ${isDark ? 'text-blue-400' : 'text-blue-400'}`}>+30 Ink 적립!</p>
                 <p className={`text-xs ${isDark ? 'text-[#A0A0A0]' : 'text-gray-300'}`}>게시글 작성이 완료되었습니다.</p>
               </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}