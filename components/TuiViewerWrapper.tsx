"use client";

import dynamic from 'next/dynamic';

// 1. Toast UI Viewer를 다이나믹 임포트합니다. (SSR 제외)
const Viewer = dynamic(
  () => import('@toast-ui/react-editor').then((m) => m.Viewer),
  { ssr: false }
);

// 2. CSS 파일을 임포트합니다. (글로벌하게 적용)
import '@toast-ui/editor/dist/toastui-editor.css';

interface TuiViewerWrapperProps {
  initialValue: string;
}

const TuiViewerWrapper = ({ initialValue }: TuiViewerWrapperProps) => {
  return (
    <div className="tui-viewer-wrapper tui-editor-contents bg-white dark:bg-[#1E1E1E]">
      <Viewer 
        initialValue={initialValue || ''} 
      />
      
      {/* ⭐️ 디자이너들을 위한 팁: 뷰어 내부의 텍스트 및 레이아웃을 네오 브루탈리즘/다크모드 톤에 맞게 보정합니다. */}
      <style jsx global>{`
        .tui-viewer-wrapper .toastui-editor-contents {
          font-size: 16px;
          font-family: inherit;
        }
        .dark .tui-viewer-wrapper .toastui-editor-contents p,
        .dark .tui-viewer-wrapper .toastui-editor-contents h1,
        .dark .tui-viewer-wrapper .toastui-editor-contents h2,
        .dark .tui-viewer-wrapper .toastui-editor-contents h3,
        .dark .tui-viewer-wrapper .toastui-editor-contents h4,
        .dark .tui-viewer-wrapper .toastui-editor-contents h5,
        .dark .tui-viewer-wrapper .toastui-editor-contents h6,
        .dark .tui-viewer-wrapper .toastui-editor-contents li,
        .dark .tui-viewer-wrapper .toastui-editor-contents table {
          color: #EAEAEA !important;
        }
        .dark .tui-viewer-wrapper .toastui-editor-contents img {
          border: 2px solid #444444;
          box-shadow: 4px 4px 0px #111111;
        }
        .tui-viewer-wrapper .toastui-editor-contents img {
          border: 2px solid #222222;
          box-shadow: 4px 4px 0px #222222;
          border-radius: 0;
          max-width: 100%;
        }
      `}</style>
    </div>
  );
};

export default TuiViewerWrapper;
