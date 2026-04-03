"use client";

import { useState } from "react";

// 기존 소나무디자인의 정확한 실측 종이 데이터
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
    if (!weight || !pages) {
      alert("용지와 페이지 수를 정확히 입력해 주세요.");
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
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-800 mb-8">세네카(책등) 계산기</h1>
      
      <div className="space-y-8">
        <div className="bg-slate-900 rounded-[2.5rem] p-10 shadow-xl border-l-8 border-blue-500">
          <div className="flex items-start gap-6">
            <span className="material-symbols-outlined text-blue-400 text-4xl shrink-0">info</span>
            <p className="text-white text-lg font-medium leading-relaxed">
              본 계산기는 실제 용지 두께 <span className="text-blue-400 font-black">실측값</span>을 기반으로 제작되었습니다. <br />
              결과물의 두께에 따라 계산된 값에 <span className="text-blue-400 font-black">0.5~1.0mm 정도의 여유</span>를 더하여 작업하시길 권장합니다.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-[3rem] shadow-lg p-8 border border-slate-200 flex flex-col lg:flex-row items-center gap-8">
          <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-4">Paper Type</label>
              <select 
                value={type} 
                onChange={(e) => { setType(e.target.value); setWeight(""); }} 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold"
              >
                <option value="">종이 종류</option>
                <option value="snow">스노우지</option>
                <option value="art">아트지</option>
                <option value="mojoji">모조지(백/미색)</option>
                <option value="rendezvous">랑데뷰</option>
                <option value="montblanc">몽블랑</option>
                <option value="arte">아르떼</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-4">Weight (g)</label>
              <select 
                value={weight} 
                onChange={(e) => setWeight(Number(e.target.value))} 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-blue-600"
              >
                <option value="">평량 선택</option>
                {type && paperData[type] && Object.entries(paperData[type]).map(([w, val]) => (
                  <option key={w} value={val}>{w}g</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-4">Total Pages</label>
              <div className="relative">
                <input 
                  type="number" 
                  value={pages} 
                  onChange={(e) => setPages(Number(e.target.value))} 
                  placeholder="0" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-slate-900" 
                />
                <span className="absolute right-6 top-1/2 -translate-y-1/2 font-bold text-slate-300">p</span>
              </div>
            </div>
          </div>
          
          <div className="shrink-0 w-full lg:w-auto">
            <button onClick={calculate} className="w-full lg:w-48 bg-blue-600 hover:bg-slate-800 text-white py-6 rounded-2xl font-black text-lg transition-all shadow-xl hover:-translate-y-1">
              계산하기
            </button>
          </div>
          
          <div className="shrink-0 w-full lg:w-64 bg-slate-50 rounded-[2rem] p-6 border border-slate-100 flex flex-col items-center justify-center shadow-inner">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Estimated Spine</span>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-black text-slate-900">{result}</span>
              <span className="text-xl font-bold text-blue-500">mm</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}