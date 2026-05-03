import React from "react";
import { MarkOption } from "../_lib/PdfProcessor";
import { UploadedFile } from "../_hooks/useRollNester";

export interface ControlPanelProps {
  maxRollWidth: number;
  setMaxRollWidth: (val: number) => void;
  gutter: number;
  setGutter: (val: number) => void;
  files: UploadedFile[];
  markOption: MarkOption;
  setMarkOption: (val: MarkOption) => void;
  isExporting: boolean;
  isDragging: boolean;
  handleFileUpload: (files: FileList | File[]) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: () => void;
  handleDrop: (e: React.DragEvent) => void;
  updateFile: (id: string, updates: Partial<UploadedFile>) => void;
  removeFile: (id: string) => void;
  handleExport: () => void;
}

export default function ControlPanel({
  maxRollWidth,
  setMaxRollWidth,
  gutter,
  setGutter,
  files,
  markOption,
  setMarkOption,
  isExporting,
  isDragging,
  handleFileUpload,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  updateFile,
  removeFile,
  handleExport,
}: ControlPanelProps) {
  return (
    <aside className="w-full md:w-96 bg-white dark:bg-[#1E1E1E] border-r-4 border-[#222222] dark:border-[#444444] flex flex-col h-screen shrink-0 overflow-y-auto">
      <div className="p-6 border-b-2 border-[#E5E4E0] dark:border-[#333333]">
        <h1 className="text-2xl font-black uppercase text-[#222222] dark:text-[#EAEAEA] tracking-tighter">Roll Nester</h1>
        <p className="text-[#A0A0A0] text-sm font-bold mt-1">실사출력 자동조판기</p>
      </div>

      {/* 1. 용지 및 환경 설정 */}
      <div className="p-6 border-b-2 border-[#E5E4E0] dark:border-[#333333] space-y-4">
        <h2 className="text-sm font-black text-[#222222] dark:text-[#EAEAEA]">1. ENVIRONMENT SETUP</h2>
        <div>
          <label className="text-xs font-bold text-[#666666] dark:text-[#A0A0A0] block mb-2">최대 가로폭 (Max Roll Width)</label>
          <div className="flex items-center">
            <input 
              type="number" 
              value={maxRollWidth} 
              onChange={(e) => setMaxRollWidth(Number(e.target.value))}
              className="w-full border-2 border-[#222222] dark:border-[#444444] bg-transparent text-[#222222] dark:text-[#EAEAEA] p-2 font-mono text-lg outline-none focus:border-blue-500"
            />
            <span className="ml-2 font-bold text-[#A0A0A0]">mm</span>
          </div>
        </div>
        <div>
          <label className="text-xs font-bold text-[#666666] dark:text-[#A0A0A0] block mb-2">여백 간격 (Gutter)</label>
          <div className="flex items-center">
            <input 
              type="number" 
              value={gutter} 
              onChange={(e) => setGutter(Number(e.target.value))}
              className="w-full border-2 border-[#222222] dark:border-[#444444] bg-transparent text-[#222222] dark:text-[#EAEAEA] p-2 font-mono text-lg outline-none focus:border-blue-500"
            />
            <span className="ml-2 font-bold text-[#A0A0A0]">mm</span>
          </div>
        </div>
      </div>

      {/* 2. 항목 컨트롤러 */}
      <div className="p-6 flex-1 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-black text-[#222222] dark:text-[#EAEAEA]">2. ITEM CONTROLLER</h2>
          <label className="bg-[#222222] dark:bg-[#EAEAEA] text-white dark:text-[#121212] px-3 py-1 text-xs font-bold cursor-pointer hover:opacity-80">
            + PDF 추가
            <input type="file" multiple accept=".pdf" className="hidden" onChange={(e) => e.target.files && handleFileUpload(e.target.files)} />
          </label>
        </div>

        <div 
          className={`flex-1 overflow-y-auto border-2 border-dashed p-4 transition-colors ${
            isDragging ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20" : "border-[#A0A0A0] dark:border-[#444444]"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {files.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-[#A0A0A0]">
              <span className="material-symbols-outlined text-4xl mb-2">upload_file</span>
              <p className="text-sm font-bold text-center">PDF 파일을 이곳에<br/>드롭하세요</p>
            </div>
          ) : (
            <div className="space-y-3">
              {files.map(file => (
                <div key={file.id} className="bg-white dark:bg-[#121212] border-2 border-[#222222] dark:border-[#444444] p-3 flex flex-col shadow-[2px_2px_0px_#222222] dark:shadow-[2px_2px_0px_#111111]">
                  <div className="flex justify-between items-center border-b border-[#E5E4E0] dark:border-[#333333] pb-2 mb-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="material-symbols-outlined text-red-500">picture_as_pdf</span>
                      <p className="text-xs font-bold text-[#222222] dark:text-[#EAEAEA] truncate w-40" title={file.name}>{file.name}</p>
                    </div>
                    <button onClick={() => removeFile(file.id)} className="text-[#A0A0A0] hover:text-red-500 material-symbols-outlined text-sm">close</button>
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="flex gap-3 text-[10px]">
                      <div className="flex items-center">
                        <span className="text-[#A0A0A0] mr-1 font-bold">W:</span>
                        <input type="number" value={file.widthMm} onChange={(e) => updateFile(file.id, { widthMm: Number(e.target.value) })} className="w-12 border-b border-[#A0A0A0] bg-transparent outline-none text-[#222222] dark:text-[#EAEAEA] font-mono" />
                      </div>
                      <div className="flex items-center">
                        <span className="text-[#A0A0A0] mr-1 font-bold">H:</span>
                        <input type="number" value={file.heightMm} onChange={(e) => updateFile(file.id, { heightMm: Number(e.target.value) })} className="w-12 border-b border-[#A0A0A0] bg-transparent outline-none text-[#222222] dark:text-[#EAEAEA] font-mono" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-[#666666]">수량:</span>
                      <input type="number" min="1" value={file.quantity} onChange={(e) => updateFile(file.id, { quantity: parseInt(e.target.value) || 1 })} className="w-12 border-2 border-[#222222] dark:border-[#444444] bg-transparent text-center text-xs outline-none text-[#222222] dark:text-[#EAEAEA] font-bold"/>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. 출력 옵션 */}
      <div className="p-6 border-t-4 border-[#222222] dark:border-[#444444] bg-[#F5F4F0] dark:bg-[#1A1A1A]">
        <h2 className="text-sm font-black text-[#222222] dark:text-[#EAEAEA] mb-3">3. TRIM & EXPORT</h2>
        <select 
          value={markOption} 
          onChange={(e) => setMarkOption(e.target.value as MarkOption)}
          className="w-full border-2 border-[#222222] dark:border-[#444444] bg-white dark:bg-[#1E1E1E] text-[#222222] dark:text-[#EAEAEA] p-2 text-sm font-bold outline-none mb-4"
        >
          <option value="none">재단선 없음</option>
          <option value="corner">L자 코너 재단선 (Trim Marks)</option>
          <option value="crosshair">십자 돔보 마크 (Registration)</option>
        </select>

        <button 
          onClick={handleExport}
          disabled={isExporting || files.length === 0}
          className="w-full bg-[#222222] dark:bg-[#EAEAEA] text-white dark:text-[#121212] font-black py-4 uppercase tracking-widest shadow-[4px_4px_0px_#A0A0A0] dark:shadow-[4px_4px_0px_#111111] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? "GENERATING PDF..." : "EXPORT NESTED PDF"}
        </button>
      </div>
    </aside>
  );
}
