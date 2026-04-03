import Link from "next/link";

export default function ToolsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-800 mb-6">유틸리티</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        <Link href="/tools/seneca" className="block bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer">
          <svg className="w-8 h-8 text-blue-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
          <h2 className="text-lg font-bold text-slate-800 mb-2">세네카 계산기</h2>
          <p className="text-slate-500 text-xs">페이지 수와 종이 두께를 입력해 정확한 책등 두께를 계산합니다.</p>
        </Link>
        
        <Link href="/tools/yieldcalc" className="block bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer">
          <svg className="w-8 h-8 text-blue-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
          <h2 className="text-lg font-bold text-slate-800 mb-2">16P / 낱장 계산기</h2>
          <p className="text-slate-500 text-xs">PDF를 업로드하여 16P 접지 및 낱장 반복 인쇄 조판을 계산합니다.</p>
        </Link>

        <Link href="/tools/harikomi" className="block bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer">
          <svg className="w-8 h-8 text-blue-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"></path></svg>
          <h2 className="text-lg font-bold text-slate-800 mb-2">명함 & 중철 조판기</h2>
          <p className="text-slate-500 text-xs">명함 다건 합판 배열 및 디지털 중철(가미 삽입) 조판을 생성합니다.</p>
        </Link>

        <Link href="/tools/qrcode" className="block bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer">
          <svg className="w-8 h-8 text-blue-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
          <h2 className="text-lg font-bold text-slate-800 mb-2">고화질 QR 제작기</h2>
          <p className="text-slate-500 text-xs">로고 삽입, 색상 변경이 지원되는 인쇄용 고화질(SVG/PDF) QR을 만듭니다.</p>
        </Link>

        {/* 1단계 플립북 */}
        <Link href="/tools/flipbook" className="block bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer">
          <svg className="w-8 h-8 text-blue-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
          <h2 className="text-lg font-bold text-slate-800 mb-2">2.5D 플립북 목업</h2>
          <p className="text-slate-500 text-xs">내지 중심의 양면 스프레드 디자인을 책 넘기는 효과로 검수합니다.</p>
        </Link>

        {/* 🔥 2단계 완전 3D 목업 */}
        <Link href="/tools/mockup3d" className="block bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl shadow-lg border border-slate-700 hover:border-blue-500 hover:shadow-xl transition-all cursor-pointer relative overflow-hidden group">
          <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg shadow-md z-10">PRO</div>
          <svg className="w-8 h-8 text-blue-400 mb-3 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
          <h2 className="text-lg font-bold text-white mb-2">3D 입체 패키징 목업</h2>
          <p className="text-slate-400 text-xs">페이지 수에 비례한 두께감이 적용된 완벽한 3D 책 모델을 빙글빙글 돌려보며 감상합니다.</p>
        </Link>

      </div>
    </div>
  );
}