"use client";

import { useRollNester } from "./_hooks/useRollNester";
import ControlPanel from "./_components/ControlPanel";
import PreviewCanvas from "./_components/PreviewCanvas";

export default function RollNesterPage() {
  const {
    maxRollWidth, setMaxRollWidth,
    gutter, setGutter,
    files,
    placedItems,
    markOption, setMarkOption,
    isExporting,
    isDragging,
    previewUrl,
    isGenerating,
    handleFileUpload,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    updateFile,
    removeFile,
    handleExport
  } = useRollNester();

  return (
    <div className="min-h-screen bg-[#F5F4F0] dark:bg-[#121212] flex flex-col md:flex-row transition-colors">
      
      {/* 왼쪽: 컨트롤 패널 */}
      <ControlPanel 
        maxRollWidth={maxRollWidth}
        setMaxRollWidth={setMaxRollWidth}
        gutter={gutter}
        setGutter={setGutter}
        files={files}
        markOption={markOption}
        setMarkOption={setMarkOption}
        isExporting={isExporting}
        isDragging={isDragging}
        handleFileUpload={handleFileUpload}
        handleDragOver={handleDragOver}
        handleDragLeave={handleDragLeave}
        handleDrop={handleDrop}
        updateFile={updateFile}
        removeFile={removeFile}
        handleExport={handleExport}
      />

      {/* 오른쪽: 메인 캔버스 미리보기 */}
      <PreviewCanvas 
        isGenerating={isGenerating}
        previewUrl={previewUrl}
      />

    </div>
  );
}

