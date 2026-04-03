import LoginButton from '../components/LoginButton';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
      <h1 className="text-5xl font-extrabold text-blue-600 mb-4">
        에디터킷 (EditorKit)
      </h1>
      <p className="text-xl text-gray-600 font-medium">
        인쇄/디자인 실무자를 위한 커뮤니티 및 유틸리티
      </p>
      <div className="mt-8 px-6 py-3 bg-white shadow-md rounded-lg border border-gray-200 flex flex-col items-center gap-4">
        <p className="text-gray-500">🚀 현재 개발 진행 중입니다...</p>
        
        {/* 방금 만든 로그인 버튼이 여기에 들어갑니다! */}
        <LoginButton />
        
      </div>
    </main>
  );
}