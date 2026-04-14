"use client";

import dynamic from 'next/dynamic';
import { forwardRef } from 'react';
import { EditorProps } from '@toast-ui/react-editor';

// 1. Toast UI Editor를 다이나믹 임포트합니다. (SSR 제외)
const Editor = dynamic(
  () => import('@toast-ui/react-editor').then((m) => m.Editor),
  { ssr: false }
);

// 2. CSS 파일을 임포트합니다. (글로벌하게 적용)
import '@toast-ui/editor/dist/toastui-editor.css';

// 3. 부모 컴포넌트에서 에디터의 인스턴스에 접근할 수 있도록 forwardRef를 사용합니다.
const TuiEditorWrapper = forwardRef<any, EditorProps>((props, ref) => {
  return (
    <div className="tui-editor-wrapper bg-white dark:bg-[#1E1E1E]">
      <Editor 
        {...props} 
        ref={ref} 
        language="ko-KR" // 한국어 설정
      />
      
      {/* ⭐️ 디자이너들을 위한 팁: 에디터 내부의 텍스트 색상을 다크모드에서도 잘 보이게 강제 조정하는 스타일입니다. */}
      <style jsx global>{`
        .toastui-editor-contents {
          font-size: 16px;
          font-family: inherit;
        }
        .dark .toastui-editor-defaultUI {
          border-color: #444444 !important;
          background-color: #1E1E1E !important;
        }
        .dark .toastui-editor-toolbar {
          background-color: #2A2A2A !important;
          border-bottom: 1px solid #444444 !important;
        }
        .dark .toastui-editor-main .toastui-editor-md-container,
        .dark .toastui-editor-main .toastui-editor-ww-container {
          background-color: #1E1E1E !important;
        }
      `}</style>
    </div>
  );
});

TuiEditorWrapper.displayName = 'TuiEditorWrapper';

export default TuiEditorWrapper;