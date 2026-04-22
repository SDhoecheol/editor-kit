"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { useRef, useState } from 'react';

interface TiptapEditorProps {
  value: string;
  onChange: (value: string) => void;
  onImageUpload: (file: File) => Promise<string>;
}

export default function TiptapEditor({ value, onChange, onImageUpload }: TiptapEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const editor = useEditor({
    immediatelyRender: false, // SSR 하이드레이션 오류 방지
    extensions: [
      StarterKit,
      Image.configure({
        HTMLAttributes: {
          class: 'rounded-lg border-2 border-[#222222] shadow-[4px_4px_0px_#222222] dark:border-[#444444] dark:shadow-[4px_4px_0px_#111111] my-4 max-w-full h-auto',
        },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-none focus:outline-none min-h-[400px] p-6 text-lg text-[#222222] dark:text-[#EAEAEA] leading-relaxed',
      },
    },
  });

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    setIsUploading(true);
    try {
      const url = await onImageUpload(file);
      editor.chain().focus().setImage({ src: url }).run();
    } catch (error) {
      console.error('Image upload error:', error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!editor) {
    return <div className="h-64 flex items-center justify-center font-bold text-[#A0A0A0]">에디터 로딩중...</div>;
  }

  return (
    <div className="bg-white dark:bg-[#1E1E1E] flex flex-col border-4 border-[#222222] dark:border-[#444444]">
      
      {/* 툴바 */}
      <div className="flex items-center gap-2 p-3 bg-[#F5F4F0] dark:bg-[#2A2A2A] border-b-4 border-[#222222] dark:border-[#444444]">
        
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`w-10 h-10 flex items-center justify-center font-black transition-colors rounded-sm border-2 ${
            editor.isActive('bold') 
              ? 'bg-[#222222] text-white border-[#222222]' 
              : 'bg-white text-[#222222] border-transparent hover:border-[#222222] dark:bg-[#1E1E1E] dark:text-[#EAEAEA] dark:hover:border-[#EAEAEA]'
          }`}
          title="굵게 (Ctrl+B)"
        >
          B
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`w-10 h-10 flex items-center justify-center font-black italic transition-colors rounded-sm border-2 ${
            editor.isActive('italic') 
              ? 'bg-[#222222] text-white border-[#222222]' 
              : 'bg-white text-[#222222] border-transparent hover:border-[#222222] dark:bg-[#1E1E1E] dark:text-[#EAEAEA] dark:hover:border-[#EAEAEA]'
          }`}
          title="기울임꼴 (Ctrl+I)"
        >
          I
        </button>

        <div className="w-px h-6 bg-[#A0A0A0] mx-1"></div>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`w-10 h-10 flex items-center justify-center font-black transition-colors rounded-sm border-2 ${
            editor.isActive('heading', { level: 2 }) 
              ? 'bg-[#222222] text-white border-[#222222]' 
              : 'bg-white text-[#222222] border-transparent hover:border-[#222222] dark:bg-[#1E1E1E] dark:text-[#EAEAEA] dark:hover:border-[#EAEAEA]'
          }`}
          title="소제목"
        >
          H
        </button>

        <div className="w-px h-6 bg-[#A0A0A0] mx-1"></div>

        <input 
          type="file" 
          accept="image/*" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
        />
        <button
          type="button"
          onClick={handleImageClick}
          disabled={isUploading}
          className="w-10 h-10 flex items-center justify-center bg-white text-[#222222] border-2 border-transparent hover:border-[#222222] dark:bg-[#1E1E1E] dark:text-[#EAEAEA] dark:hover:border-[#EAEAEA] transition-colors rounded-sm disabled:opacity-50"
          title="이미지 첨부"
        >
          {isUploading 
            ? <span className="animate-spin material-symbols-outlined text-[20px]">sync</span> 
            : <span className="material-symbols-outlined text-[20px]">image</span>
          }
        </button>
      </div>

      {/* 에디터 본문 */}
      <EditorContent editor={editor} />
    </div>
  );
}
