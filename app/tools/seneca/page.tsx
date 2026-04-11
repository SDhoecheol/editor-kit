"use client";

import { useState } from "react";

// 소나무디자인 실측 데이터 (유지)
const paperData: Record<string, Record<string, number>> = {
  snow: { "100": 0.089, "120": 0.109, "150": 0.140, "180": 0.172, "200": 0.195, "250": 0.253, "300": 0.313 },
  arte: { "105": 0.150, "130": 0.180, "160": 0.230, "190": 0.270, "210": 0.300, "230": 0.320 },
  art: { "100": 0.080, "120": 0.096, "150": 0.120, "180": 0.149, "200": 0.180, "250": 0.231, "300": 0.288 },
  mojoji: { "70": 0.087, "80": 0.093, "90": 0.103, "100": 0.113, "120": 0.134, "150": 0.167, "180": 0.201, "220": 0.244, "260": 0.287 },
  rendezvous: { "90": 0.120, "105": 0.140, "130": 0.170, "160": 0.210, "190": 0.260, "210": 0.300, "240": 0.330 },
  montblanc: { "90": 0.130, "100": 0.150, "130": 0.180, "160": 0.230, "190": 0.270, "210": 0.300, "240": 0.330 }
};

export default function SenecaCalcPage() {
  const [type, setType] = useState("");
  const [weight, setWeight] = useState<number | "">("");
  const [pages, setPages] = useState<number | "">("");
  const [result, setResult] = useState("0");

  const calculate = () => {
    if (!type || !weight || !pages) {
      alert("지류 종류, 평량, 총 페이지 수를 모두 입력해 주세요.");
      return;
    }
    const seneca = (Number(weight) * 0.5 * Number(pages));
    const decimalPart = seneca - Math.floor(seneca);
    let finalResult;
    
    if (decimalPart === 0) finalResult = seneca;
    else if (decimalPart <= 0.5) finalResult = Math.floor(seneca) + 0.5;
    else finalResult = Math.floor(seneca) + 1.0;
    
    setResult(finalResult.toFixed(1));
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 md:py-20 space-y-12">
      
      {/* 헤더 영역 (버튼 제거하고 깔끔하게 텍스트만!) */}
      <header className="border-b-4 border-[#222222] dark:border-[#444444] pb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="bg-[#222222] text-[#F5F4F0] dark:bg-[#333333] dark:text-[#EAEAEA] px-2 py-0.5 text-[10px] font-black tracking-widest">
            유틸리티 / 01
          </span>
          <span className="text-xs font-bold text-[#666666] dark:text-[#A0A0A0] tracking-widest">
            책등 두께 계산기
          </span>
        </div>
        <h1 className="text-4xl font-black text-[#222222] dark:text-[#EAEAEA] tracking-tight">
          세네카 계산기
        </h1>
      </header>
      
      <div className="space-y-8">
        
        {/* 안내 문구 박스 */}
        <div className="border-2 border-[#222222] dark:border-[#444444] border-l-8 bg-white dark:bg-[#1E1E1E] shadow-[4px_4px_0px_#E5E4E0] dark:shadow-[4px_4px_0px_#111111] p-6 flex gap-4 items-start transition-colors">
          <span className="material-symbols-outlined text-[#222222] dark:text-[#EAEAEA]">info</span>
          <div>
            <h4 className="font-bold text-[#222222] dark:text-[#EAEAEA]">실측 기반 계산기</h4>
            <p className="text-sm text-[#666666] dark:text-[#A0A0A0] mt-1 leading-relaxed">
              본 계산기는 실제 용지 두께 <strong className="text-[#222222] dark:text-[#EAEAEA]">실측값</strong>을 기반으로 제작되었습니다.
              결과값은 제본 여유가 포함되지 않은 순수 두께이므로, 작업 시 <strong className="text-[#222222] dark:text-[#EAEAEA]">0.5~1.0mm 정도의 제본 여유</strong>를 더하여 작업하시길 권장합니다.
            </p>
          </div>
        </div>

        {/* ⭐️ 메인 계산 영역 (버튼이 드디어 제자리를 찾았습니다!) */}
        <div className="flex flex-col lg:flex-row gap-8 items-stretch">
          
          {/* 입력 폼 박스 (왼쪽) */}
          <div className="flex-grow w-full lg:w-auto bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] shadow-[8px_8px_0px_#222222] dark:shadow-[8px_8px_0px_#111111] p-8 transition-colors flex flex-col justify-between">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* 1. 지류 선택 */}
              <div className="flex flex-col gap-2">
                <label className="font-bold text-sm text-[#222222] dark:text-[#A0A0A0]">지류 종류</label>
                <div className="relative">
                  <select 
                    value={type} 
                    onChange={(e) => { setType(e.target.value); setWeight(""); }} 
                    className="w-full bg-white dark:bg-[#121212] border-2 border-[#222222] dark:border-[#444444] dark:text-[#EAEAEA] px-4 py-3 appearance-none outline-none focus:shadow-[4px_4px_0px_#222222] dark:focus:shadow-[4px_4px_0px_#111111] focus:-translate-y-1 transition-all cursor-pointer font-bold"
                  >
                    <option value="">종이 선택</option>
                    <option value="snow">스노우지</option>
                    <option value="art">아트지</option>
                    <option value="mojoji">모조지(백/미색)</option>
                    <option value="rendezvous">랑데뷰</option>
                    <option value="montblanc">몽블랑</option>
                    <option value="arte">아르떼</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-3 pointer-events-none text-[#222222] dark:text-[#A0A0A0]">expand_more</span>
                </div>
              </div>
              
              {/* 2. 평량 선택 */}
              <div className="flex flex-col gap-2">
                <label className="font-bold text-sm text-[#222222] dark:text-[#A0A0A0]">평량 (g)</label>
                <div className="relative">
                  <select 
                    value={weight} 
                    onChange={(e) => setWeight(Number(e.target.value))} 
                    className="w-full bg-white dark:bg-[#121212] border-2 border-[#222222] dark:border-[#444444] text-blue-600 dark:text-blue-400 px-4 py-3 appearance-none outline-none focus:shadow-[4px_4px_0px_#222222] dark:focus:shadow-[4px_4px_0px_#111111] focus:-translate-y-1 transition-all cursor-pointer font-bold"
                  >
                    <option value="">평량 선택</option>
                    {type && paperData[type] && Object.entries(paperData[type]).map(([w, val]) => (
                      <option key={w} value={val}>{w}g</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-3 pointer-events-none text-[#222222] dark:text-[#A0A0A0]">expand_more</span>
                </div>
              </div>
              
              {/* 3. 총 페이지 수 */}
              <div className="flex flex-col gap-2">
                <label className="font-bold text-sm text-[#222222] dark:text-[#A0A0A0]">총 페이지 수 (p)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={pages} 
                    onChange={(e) => setPages(Number(e.target.value))} 
                    placeholder="0" 
                    className="w-full bg-white dark:bg-[#121212] border-2 border-[#222222] dark:border-[#444444] dark:text-[#EAEAEA] px-4 py-3 outline-none focus:shadow-[4px_4px_0px_#222222] dark:focus:shadow-[4px_4px_0px_#111111] focus:-translate-y-1 transition-all font-bold placeholder:text-[#A0A0A0] dark:placeholder:text-[#666666]" 
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-[#A0A0A0] dark:text-[#666666]">페이지</span>
                </div>
              </div>
            </div>

            {/* ⭐️ 제자리를 찾은 계산하기 버튼! */}
            <button 
              onClick={calculate} 
              className="w-full bg-[#222222] text-[#F5F4F0] dark:bg-[#EAEAEA] dark:text-[#121212] border-2 border-[#222222] dark:border-[#EAEAEA] py-4 font-black text-lg shadow-[4px_4px_0px_#E5E4E0] dark:shadow-[4px_4px_0px_#111111] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_#E5E4E0] dark:hover:shadow-[2px_2px_0px_#111111] transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[24px]">calculate</span> 결과 확인하기
            </button>
            
          </div>

          {/* 결과 출력 박스 (우측) */}
          <div className="shrink-0 w-full lg:w-80 bg-[#F5F4F0] dark:bg-[#2A2A2A] border-2 border-[#222222] dark:border-[#444444] p-8 flex flex-col items-center justify-center transition-colors shadow-[4px_4px_0px_#E5E4E0] dark:shadow-[4px_4px_0px_#111111] min-h-[200px] lg:min-h-auto">
            <span className="text-xs text-[#A0A0A0] dark:text-[#888888] font-black tracking-widest mb-2">예상 책등 두께</span>
            <div className="flex items-baseline gap-1">
              <span className="text-7xl font-black text-[#222222] dark:text-[#EAEAEA] tracking-tighter">{result}</span>
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 ml-1">mm</span>
            </div>
          </div>
          
        </div>

      </div>
    </div>
  );
}