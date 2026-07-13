"use client";

import { useState, useEffect, useMemo } from "react";

const paperSizes: Record<string, { name: string; w: number; h: number }> = {
  guk: { name: '국전지', w: 939, h: 636 },
  '4x6': { name: '4x6전지', w: 1091, h: 788 },
  guk_half: { name: '국반전지 (국2절)', w: 636, h: 469 },
  '4x6_half': { name: '4x6반전지 (2절)', w: 788, h: 545 },
  guk_4: { name: '국4절지', w: 469, h: 318 },
  '4x6_4': { name: '4x6 4절지', w: 545, h: 394 },
  guk_8: { name: '국8절지', w: 318, h: 234 },
  '4x6_8': { name: '4x6 8절지', w: 394, h: 272 }
};

export default function CutSimulatorPage() {
  const [width, setWidth] = useState<number | "">("");
  const [height, setHeight] = useState<number | "">("");
  const [bleed, setBleed] = useState<number>(3);
  const [paperPref, setPaperPref] = useState<string>("auto");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    if (!width || !height) {
      setResult(null);
      return;
    }

    const jobW = Number(width) + (bleed * 2);
    const jobH = Number(height) + (bleed * 2);
    let bestPaperKey: string | null = null;
    let bestSetup = { yield: -1, efficiency: -1, cols: 0, rows: 0, rotated: false, w: 0, h: 0, name: "" };

    const papersToTest = paperPref === 'auto' ? Object.keys(paperSizes) : [paperPref];

    papersToTest.forEach(key => {
      const paper = paperSizes[key];
      const cols1 = Math.floor(paper.w / jobW); const rows1 = Math.floor(paper.h / jobH); const yield1 = cols1 * rows1;
      const cols2 = Math.floor(paper.w / jobH); const rows2 = Math.floor(paper.h / jobW); const yield2 = cols2 * rows2;

      let currentSetup;
      if (yield1 >= yield2) {
        currentSetup = { yield: yield1, cols: cols1, rows: rows1, rotated: false, w: paper.w, h: paper.h, name: paper.name, efficiency: yield1 > 0 ? ((yield1 * jobW * jobH) / (paper.w * paper.h)) * 100 : 0 };
      } else {
        currentSetup = { yield: yield2, cols: cols2, rows: rows2, rotated: true, w: paper.w, h: paper.h, name: paper.name, efficiency: yield2 > 0 ? ((yield2 * jobW * jobH) / (paper.w * paper.h)) * 100 : 0 };
      }

      if (currentSetup.yield > 0 && (!bestPaperKey || currentSetup.yield > bestSetup.yield || (currentSetup.yield === bestSetup.yield && currentSetup.efficiency > bestSetup.efficiency))) {
        bestPaperKey = key; bestSetup = currentSetup;
      }
    });

    if (!bestPaperKey) {
      setResult(null);
      return;
    }

    setResult({ ...bestSetup, jobW, jobH });
  }, [width, height, bleed, paperPref]);

  const resetForm = () => {
    setWidth("");
    setHeight("");
    setResult(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 md:py-20 space-y-12">
      
      {/* 헤더 영역 */}
      <header className="border-b-4 border-[#222222] dark:border-[#444444] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-[#222222] text-[#F5F4F0] dark:bg-[#333333] dark:text-[#EAEAEA] px-2 py-0.5 text-[10px] font-black tracking-widest">
              유틸리티 / 04
            </span>
            <span className="text-xs font-bold text-[#666666] dark:text-[#A0A0A0] tracking-widest">
              인쇄 및 터잡기 (조판)
            </span>
          </div>
          <h1 className="text-4xl font-black text-[#222222] dark:text-[#EAEAEA] tracking-tight">
            종이 재단 시뮬레이터
          </h1>
          <p className="mt-2 text-sm font-bold text-[#666666] dark:text-[#A0A0A0]">
            PDF 원고 없이 작업 사이즈만 입력하여 최적의 종이 규격과 재단 배치를 시각적으로 확인합니다.
          </p>
        </div>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* 왼쪽 설정 패널 */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] shadow-[4px_4px_0px_#222222] dark:shadow-[4px_4px_0px_#111111]">
            <div className="p-4 bg-[#F5F4F0] dark:bg-[#2A2A2A] border-b-2 border-[#222222] dark:border-[#444444] font-black text-[#222222] dark:text-[#EAEAEA] flex items-center justify-between text-sm tracking-widest">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">straighten</span> 작업 사이즈 입력
              </div>
              <button onClick={resetForm} className="text-xs text-[#A0A0A0] hover:text-[#222222] transition-colors flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">refresh</span> 초기화
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#A0A0A0] dark:text-[#666666] mb-1">가로 (mm)</label>
                  <input type="number" value={width} onChange={(e) => setWidth(Number(e.target.value))} className="w-full px-4 py-3 border-2 border-[#222222] dark:border-[#444444] bg-white dark:bg-[#121212] text-[#222222] dark:text-[#EAEAEA] text-lg font-black outline-none focus:shadow-[4px_4px_0px_#222222] dark:focus:shadow-[4px_4px_0px_#111111] focus:-translate-y-1 transition-all" placeholder="예: 210" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#A0A0A0] dark:text-[#666666] mb-1">세로 (mm)</label>
                  <input type="number" value={height} onChange={(e) => setHeight(Number(e.target.value))} className="w-full px-4 py-3 border-2 border-[#222222] dark:border-[#444444] bg-white dark:bg-[#121212] text-[#222222] dark:text-[#EAEAEA] text-lg font-black outline-none focus:shadow-[4px_4px_0px_#222222] dark:focus:shadow-[4px_4px_0px_#111111] focus:-translate-y-1 transition-all" placeholder="예: 630" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#A0A0A0] dark:text-[#666666] mb-1">도련 (사방 여백 / mm)</label>
                  <input type="number" value={bleed} onChange={(e) => setBleed(Number(e.target.value))} className="w-full px-4 py-2 border-2 border-[#222222] dark:border-[#444444] bg-white dark:bg-[#121212] text-[#222222] dark:text-[#EAEAEA] text-sm font-bold outline-none focus:shadow-[4px_4px_0px_#222222] dark:focus:shadow-[4px_4px_0px_#111111] focus:-translate-y-1 transition-all" />
                  <p className="text-[10px] text-[#A0A0A0] mt-1">기본 인쇄용 도련은 사방 3mm입니다.</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#A0A0A0] dark:text-[#666666] mb-1">시뮬레이션용 전지 선택</label>
                  <select value={paperPref} onChange={(e) => setPaperPref(e.target.value)} className="w-full px-4 py-2 border-2 border-[#222222] dark:border-[#444444] bg-white dark:bg-[#121212] text-[#222222] dark:text-[#EAEAEA] text-sm font-bold outline-none cursor-pointer">
                    <option value="auto">자동 추천 (가장 효율적인 전지 찾기)</option>
                    <option value="4x6">4x6전지 (1091x788)</option>
                    <option value="4x6_half">4x6반전지/2절 (788x545)</option>
                    <option value="4x6_4">4x6 4절지 (545x394)</option>
                    <option value="4x6_8">4x6 8절지 (394x272)</option>
                    <option value="guk">국전지 (939x636)</option>
                    <option value="guk_half">국반전지/국2절 (636x469)</option>
                    <option value="guk_4">국4절지 (469x318)</option>
                    <option value="guk_8">국8절지 (318x234)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          
          {result && (
            <div className="bg-[#222222] dark:bg-[#111111] border-2 border-[#222222] dark:border-[#444444] p-6 flex flex-col justify-center shadow-[4px_4px_0px_#E5E4E0] dark:shadow-[4px_4px_0px_#111111]">
              <span className="text-[#A0A0A0] text-[10px] font-bold tracking-widest block mb-1">최적 종이 규격</span>
              <h4 className="text-[#F5F4F0] font-black text-2xl mb-3">{result.name}</h4>
              <div className="bg-[#333333] border border-[#444444] p-3 text-sm text-[#EAEAEA] font-bold">
                전지 1장 당 <strong className="text-blue-400 text-lg mx-1">{result.yield}</strong> 개 안착 가능
              </div>
              <p className="text-[#A0A0A0] text-xs mt-3 font-mono">가로 {result.cols}열 × 세로 {result.rows}행 배치</p>
            </div>
          )}
        </div>

        {/* 오른쪽 뷰어 패널 */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] shadow-[8px_8px_0px_#222222] dark:shadow-[8px_8px_0px_#111111] flex flex-col h-[650px] relative overflow-hidden transition-colors">
            
            <div className="bg-[#222222] dark:bg-[#111111] px-6 py-4 flex justify-between items-center border-b-2 border-[#222222] dark:border-[#444444] shrink-0">
              <span className="text-xs font-black tracking-widest text-[#F5F4F0] flex items-center gap-2 uppercase">
                <span className="material-symbols-outlined text-[16px]">visibility</span> 도면 뷰어
              </span>
            </div>
            
            <div className="flex-1 bg-[#2A2A2A] relative flex items-center justify-center">
              {result && width && height ? (
                <div className="w-full h-full p-4 md:p-8 flex items-center justify-center bg-[#121212] overflow-hidden relative">
                  <div className="relative w-full h-full flex items-center justify-center">
                    <svg viewBox={`0 0 ${result.w} ${result.h}`} className="max-w-full max-h-full drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)] border-4 border-[#333333]" style={{ backgroundColor: '#F5F4F0' }}>
                      {/* 종이 외곽 사이즈 표시 */}
                      <text x={result.w / 2} y={30} fontSize={Math.max(20, result.w * 0.03)} fill="#A0A0A0" textAnchor="middle" fontWeight="black" opacity="0.5">
                        {result.w}mm
                      </text>
                      <text x={30} y={result.h / 2} fontSize={Math.max(20, result.w * 0.03)} fill="#A0A0A0" textAnchor="middle" fontWeight="black" opacity="0.5" transform={`rotate(270, 30, ${result.h / 2})`}>
                        {result.h}mm
                      </text>

                      {/* 배치된 조각 그리기 */}
                      {Array.from({ length: result.rows }).map((_, r) => (
                        Array.from({ length: result.cols }).map((_, c) => {
                          const itemW = result.rotated ? result.jobH : result.jobW;
                          const itemH = result.rotated ? result.jobW : result.jobH;
                          
                          const offsetX = (result.w - (result.cols * itemW)) / 2;
                          const offsetY = (result.h - (result.rows * itemH)) / 2;
                          
                          const x = offsetX + (c * itemW);
                          const y = offsetY + (r * itemH);
                          
                          return (
                            <g key={`${r}-${c}`}>
                              {/* 외곽 박스 (도련 포함) */}
                              <rect x={x} y={y} width={itemW} height={itemH} fill="#3b82f6" fillOpacity="0.2" stroke="#1d4ed8" strokeWidth={result.w > 800 ? "4" : "2"} />
                              {/* 실제 사용 영역 박스 */}
                              <rect x={x + bleed} y={y + bleed} width={itemW - bleed*2} height={itemH - bleed*2} fill="white" stroke="#3b82f6" strokeWidth={result.w > 800 ? "2" : "1"} />
                              <text x={x + itemW/2} y={y + itemH/2} fontSize={Math.max(14, result.w * 0.02)} fill="#1e3a8a" textAnchor="middle" dominantBaseline="middle" fontWeight="black">
                                {result.rotated ? `${result.jobH}x${result.jobW}` : `${result.jobW}x${result.jobH}`}
                              </text>
                            </g>
                          )
                        })
                      ))}
                      
                      {/* 여백 치수 표시 (가로 여백이 10mm 이상일 때만 표시) */}
                      {(result.w - (result.cols * (result.rotated ? result.jobH : result.jobW))) > 10 && (
                        <text x={result.w - ((result.w - (result.cols * (result.rotated ? result.jobH : result.jobW))) / 4)} y={result.h / 2} fontSize={Math.max(16, result.w * 0.025)} fill="#ef4444" textAnchor="middle" dominantBaseline="middle" fontWeight="black" transform={`rotate(90, ${result.w - ((result.w - (result.cols * (result.rotated ? result.jobH : result.jobW))) / 4)}, ${result.h / 2})`}>
                          남는 여백: {Math.floor((result.w - (result.cols * (result.rotated ? result.jobH : result.jobW))))}mm
                        </text>
                      )}
                      {/* 여백 치수 표시 (세로 여백이 10mm 이상일 때만 표시) */}
                      {(result.h - (result.rows * (result.rotated ? result.jobW : result.jobH))) > 10 && (
                        <text x={result.w / 2} y={result.h - ((result.h - (result.rows * (result.rotated ? result.jobW : result.jobH))) / 4)} fontSize={Math.max(16, result.w * 0.025)} fill="#ef4444" textAnchor="middle" dominantBaseline="middle" fontWeight="black">
                          남는 여백: {Math.floor((result.h - (result.rows * (result.rotated ? result.jobW : result.jobH))))}mm
                        </text>
                      )}
                    </svg>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-[#A0A0A0] dark:text-[#666666]">
                  <span className="material-symbols-outlined text-6xl mb-3 opacity-50">design_services</span>
                  <p className="text-sm font-bold tracking-widest text-center mt-2">
                    작업 사이즈(가로/세로)를 입력하면<br/>종이 재단 도면이 이곳에 표시됩니다.
                  </p>
                </div>
              )}
            </div>

            <div className="bg-[#F5F4F0] dark:bg-[#1E1E1E] border-t-2 border-[#222222] dark:border-[#444444] p-4 flex justify-between items-center shrink-0">
              <div className="text-xs font-bold text-[#666666] dark:text-[#A0A0A0]">
                * 짙은 파란색 영역이 인쇄용 도련(여유분)이며, 흰색 사각형이 최종 재단선입니다.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
