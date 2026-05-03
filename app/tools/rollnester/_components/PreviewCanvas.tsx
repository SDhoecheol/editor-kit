import React from "react";

export interface PreviewCanvasProps {
  isGenerating: boolean;
  previewUrl: string | null;
}

export default function PreviewCanvas({ isGenerating, previewUrl }: PreviewCanvasProps) {
  return (
    <main className="flex-1 bg-white dark:bg-[#1E1E1E] border-2 border-[#222222] dark:border-[#444444] m-6 flex flex-col shadow-[6px_6px_0px_#222222] dark:shadow-[6px_6px_0px_#111111] overflow-hidden">
      <div className="bg-[#222222] dark:bg-[#111111] px-6 py-4 flex items-center justify-between border-b-2 border-[#222222] dark:border-[#444444] shrink-0">
        <span className="text-[#F5F4F0] font-black tracking-widest text-xs">PREVIEW</span>
      </div>

      <div className="flex-1 bg-[#2A2A2A] relative flex items-center justify-center overflow-hidden">
        {isGenerating && (
          <div className="absolute inset-0 bg-[#222222]/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
            <span className="material-symbols-outlined text-white text-5xl animate-spin mb-4">settings</span>
            <p className="text-white font-black tracking-widest text-lg drop-shadow-md">렌더링 중...</p>
          </div>
        )}
        
        {previewUrl ? (
          <div className="w-full h-full p-4 bg-[#121212]">
            <iframe src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`} className="w-full h-full border-2 border-[#444444] bg-white" title="Nested Preview" />
          </div>
        ) : (
          <div className="text-[#A0A0A0] dark:text-[#666666] text-center">
            <span className="material-symbols-outlined text-6xl mb-4 opacity-50">wallpaper</span>
            <p className="font-bold text-sm tracking-widest">PDF 원고를 업로드하면 자동 조판 결과가 나타납니다.</p>
          </div>
        )}
      </div>
      
      <div className="bg-[#F5F4F0] dark:bg-[#1E1E1E] border-t-2 border-[#222222] dark:border-[#444444] p-4 flex justify-center items-center shrink-0">
        <p className="text-[#666666] dark:text-[#A0A0A0] text-sm font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]">info</span>
          배열을 확인하신 후 좌측 패널의 'EXPORT NESTED PDF' 버튼을 눌러 저장하세요.
        </p>
      </div>
    </main>
  );
}
