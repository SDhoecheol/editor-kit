'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase'; 

// 🎲 랜덤 닉네임 사전 (100+100)
const adjectives = [
  "밤새는", "피곤한", "카페인수혈하는", "눈침침한", "손목시큰한", 
  "영혼털린", "퇴근마려운", "주말출근한", "다크서클짙은", "거북목인", 
  "수면부족", "당떨어진", "멍때리는", "집에가고싶은", "연차마려운", 
  "핫식스마시는", "좀비가된", "마감에쫓기는", "하품하는", "커피쏟은",
  "누끼따는", "시안고치는", "폰트찾는", "픽셀맞추는", "레이어꼬인", 
  "패스따는", "단축키누르는", "파일날린", "저장안한", "백업까먹은", 
  "색상고민하는", "렌더링기다리는", "로딩중인", "용량초과된", "버벅거리는", 
  "강제종료된", "해상도깨진", "벡터그리는", "스포이드찍는", "텍스트깨는",
  "감리보는", "출력거는", "잉크마른", "핀트나간", "오타발견한", 
  "별색맞추는", "하리꼬미하는", "재단밀린", "오시터진", "떡제본하는", 
  "중철박는", "제본넘기는", "코팅우는", "박찍는", "형압누르는", 
  "색감죽은", "먹100떡진", "K100인", "CMYK변환하는", "해상도올리는",
  "컨펌기다리는", "수정요청받는", "반려당한", "최종의최종인", "진짜최종만드는", 
  "파이널저장하는", "전화받는", "메일쓰는", "견적내는", "결제독촉하는", 
  "시안까인", "화참는", "보노보노지우는", "로고키우는", "여백채우는", 
  "느낌찾는", "화려하지만심플한", "알아서해달라는", "심심한사과하는", "어제보낸",
  "꼼꼼한", "대충살고싶은", "손이빠른", "칼퇴하는", "딴짓하는", 
  "월급루팡", "영감떠오른", "마우스던진", "샷건치는", "모니터노려보는", 
  "안구건조증", "타블렛쓰는", "맥북쓰는", "아이맥쓰는", "단축키장인", 
  "폰트콜렉터", "색감천재", "레이어정리하는", "점심메뉴고르는", "장비탓하는"
];

const nouns = [
  "스포이드", "베지어곡선", "레이어", "아트보드", "클리핑마스크", 
  "가이드라인", "픽셀", "벡터", "누끼패스", "그라데이션", 
  "마스터페이지", "그리드", "레이아웃", "여백", "자간", 
  "행간", "자평", "장평", "썸네일", "목업",
  "팬톤컬러", "CMYK", "RGB", "별색", "아웃라인", 
  "폰트", "고딕", "명조", "웹폰트", "헥스코드", 
  "스와치", "명도", "채도", "해상도", "DPI", 
  "망점", "오버프린트", "녹아웃", "투명도", "블렌딩모드",
  "세네카", "하리꼬미", "도무송", "오시", "미싱선", 
  "형압", "에폭시", "금박", "은박", "무광코팅", 
  "유광코팅", "떡제본", "중철제본", "양장제본", "무선제본", 
  "평량", "스노우지", "아트지", "랑데뷰", "모조지",
  "인디자인", "일러스트", "포토샵", "아크로뱃", "PDF", 
  "JPG", "PNG", "SVG", "AI", "PSD", 
  "INDD", "패키지파일", "압축파일", "스크래치디스크", "외장하드", 
  "캐시데이터", "누락된링크", "단축키", "플러그인", "액션",
  "최종시안", "진짜최종", "마지막최종", "피드백", "마감일", 
  "견적서", "발주서", "클라이언트", "수정요청", "야근수당", 
  "아이스아메리카노", "믹스커피", "보노보노", "마우스", "기계식키보드", 
  "타블렛", "듀얼모니터", "맥북", "아이맥", "연차휴가"
];

const PRESET_TAGS = {
  design: ["편집디자이너", "웹디자이너", "패키지디자이너", "UI/UX", "그래픽디자이너", "일러스트레이터"],
  print: ["인쇄소", "출력실", "후가공장인", "제본소", "인쇄기획", "지류유통"],
  other: ["학생", "취준생", "마케터", "클라이언트", "프리랜서", "기획자"]
};

export default function WelcomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  
  const [nickname, setNickname] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [bio, setBio] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) router.push('/'); 
      else setUser(user);
    };
    fetchUser();
  }, [router]);

  const handleRandom = () => {
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    setNickname(`${adj} ${noun}`);
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      if (selectedTags.length >= 5) return alert("태그는 최대 5개까지만 선택 가능합니다.");
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleCustomTagAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault(); 
      const newTag = customTagInput.trim().replace(/^#/, ''); 
      if (!newTag) return;
      if (selectedTags.includes(newTag)) {
        setCustomTagInput('');
        return;
      }
      if (selectedTags.length >= 5) {
        alert("태그는 최대 5개까지만 선택 가능합니다.");
        return;
      }
      setSelectedTags([...selectedTags, newTag]);
      setCustomTagInput('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return alert('닉네임을 입력해주세요!');
    
    setIsSubmitting(true);
    
    const { error } = await supabase.from('profiles').insert([
      { 
        id: user.id, 
        email: user.email, 
        nickname: nickname.trim(),
        tags: selectedTags,
        bio: bio.trim()
      }
    ]);

    if (error) {
      alert('저장 중 오류가 발생했습니다. (닉네임 중복 등)');
      setIsSubmitting(false);
    } else {
      window.location.href = '/'; 
    }
  };

  return (
    <div className="min-h-screen py-16 px-4 md:px-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24">
        
        {/* 왼쪽: 폼 영역 (한국형 에디토리얼 스타일) */}
        <div className="lg:col-span-7">
          <div className="mb-12 border-b-2 border-[#222222] dark:border-[#F5F4F0] pb-6">
            <h1 className="text-3xl md:text-4xl font-black text-[#222222] dark:text-[#F5F4F0] tracking-tight mb-2">
              프로필 설정
            </h1>
            <p className="text-[#666666] dark:text-[#A0A0A0] text-sm">
              에디터킷에서 사용할 커뮤니티 명함을 완성해 주세요.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-12">
            
            {/* 01. 닉네임 */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <span className="text-xs font-black tracking-widest text-[#222222] dark:text-[#F5F4F0] border border-[#222222] dark:border-[#F5F4F0] px-2 py-1">01</span>
                <h2 className="text-sm font-bold text-[#222222] dark:text-[#F5F4F0] tracking-wide">NICKNAME (필수)</h2>
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="사용할 닉네임을 입력하세요"
                  maxLength={15}
                  className="flex-1 bg-transparent border-b border-[#E5E4E0] dark:border-[#333333] pb-3 text-lg font-bold text-[#222222] dark:text-[#F5F4F0] focus:border-[#222222] dark:focus:border-[#F5F4F0] outline-none transition-colors placeholder:text-[#A0A0A0] dark:placeholder:text-[#666666]"
                />
                <button type="button" onClick={handleRandom} className="px-4 py-2 border border-[#E5E4E0] dark:border-[#333333] hover:border-[#222222] dark:hover:border-[#F5F4F0] text-sm font-bold text-[#666666] dark:text-[#A0A0A0] hover:text-[#222222] dark:hover:text-[#F5F4F0] transition-colors whitespace-nowrap">
                  랜덤 생성
                </button>
              </div>
            </section>

            {/* 02. 태그 */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <span className="text-xs font-black tracking-widest text-[#222222] dark:text-[#F5F4F0] border border-[#222222] dark:border-[#F5F4F0] px-2 py-1">02</span>
                <h2 className="text-sm font-bold text-[#222222] dark:text-[#F5F4F0] tracking-wide">TAGS (최대 5개)</h2>
              </div>
              <div className="space-y-6 bg-white dark:bg-[#1A1A1A] border border-[#E5E4E0] dark:border-[#333333] p-6">
                {Object.entries(PRESET_TAGS).map(([category, tags]) => (
                  <div key={category}>
                    <p className="text-xs font-bold text-[#666666] dark:text-[#A0A0A0] mb-3 uppercase tracking-widest">
                      {category === 'design' ? '디자인' : category === 'print' ? '인쇄/제작' : '기타'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {tags.map(tag => {
                        const isSelected = selectedTags.includes(tag);
                        return (
                          <button 
                            key={tag} 
                            type="button" 
                            onClick={() => toggleTag(tag)} 
                            className={`px-3 py-1.5 text-sm font-medium border transition-colors ${
                              isSelected 
                                ? 'bg-[#222222] border-[#222222] text-[#F5F4F0] dark:bg-[#F5F4F0] dark:border-[#F5F4F0] dark:text-[#222222]' 
                                : 'bg-transparent border-[#E5E4E0] dark:border-[#333333] text-[#666666] dark:text-[#A0A0A0] hover:border-[#222222] dark:hover:border-[#F5F4F0]'
                            }`}
                          >
                            {tag}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
                
                <div className="pt-4 border-t border-[#E5E4E0] dark:border-[#333333]">
                  <input 
                    type="text" 
                    value={customTagInput}
                    onChange={(e) => setCustomTagInput(e.target.value)}
                    onKeyDown={handleCustomTagAdd}
                    placeholder="+ 직접 입력 후 Enter"
                    className="w-full bg-transparent border-b border-[#E5E4E0] dark:border-[#333333] pb-2 text-sm text-[#222222] dark:text-[#F5F4F0] focus:border-[#222222] dark:focus:border-[#F5F4F0] outline-none placeholder:text-[#A0A0A0] dark:placeholder:text-[#666666]"
                  />
                </div>
              </div>
            </section>

            {/* 03. 한 줄 소개 */}
            <section>
              <div className="flex items-center gap-3 mb-6">
                <span className="text-xs font-black tracking-widest text-[#222222] dark:text-[#F5F4F0] border border-[#222222] dark:border-[#F5F4F0] px-2 py-1">03</span>
                <h2 className="text-sm font-bold text-[#222222] dark:text-[#F5F4F0] tracking-wide">BIO (선택)</h2>
              </div>
              <textarea 
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="주요 작업 분야나 관심사를 자유롭게 적어주세요."
                rows={3}
                className="w-full bg-transparent border border-[#E5E4E0] dark:border-[#333333] p-4 text-sm text-[#222222] dark:text-[#F5F4F0] focus:border-[#222222] dark:focus:border-[#F5F4F0] outline-none resize-none placeholder:text-[#A0A0A0] dark:placeholder:text-[#666666]"
              />
            </section>

            <div className="pt-8">
              <button 
                type="submit" 
                disabled={isSubmitting || !nickname.trim()} 
                className="w-full py-4 bg-[#222222] dark:bg-[#F5F4F0] text-[#F5F4F0] dark:text-[#222222] font-black text-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                {isSubmitting ? '저장 중...' : '에디터킷 시작하기'}
              </button>
            </div>
          </form>
        </div>

        {/* 오른쪽: 플랫/에디토리얼 명함 프리뷰 */}
        <div className="lg:col-span-5 relative">
          <div className="lg:sticky lg:top-32">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-[#666666] dark:text-[#A0A0A0] tracking-widest uppercase">Preview</span>
              <span className="text-xs text-[#A0A0A0] dark:text-[#666666]">Business Card</span>
            </div>
            
            {/* 명함 디자인: 종이와 먹 잉크의 질감을 살린 플랫 디자인 */}
            <div className="aspect-[1.6/1] w-full bg-white dark:bg-[#1A1A1A] border border-[#222222] dark:border-[#F5F4F0] p-8 flex flex-col justify-between relative group">
              
              {/* 명함 상단 (장식선 및 상태) */}
              <div className="flex justify-between items-start border-b border-[#E5E4E0] dark:border-[#333333] pb-4">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black tracking-widest text-[#222222] dark:text-[#F5F4F0]">EDITORKIT</span>
                  <span className="text-[10px] text-[#A0A0A0] dark:text-[#666666] tracking-widest mt-1">MEMBER PROFILE</span>
                </div>
                <span className="w-2 h-2 bg-[#222222] dark:bg-[#F5F4F0]"></span>
              </div>

              {/* 명함 중앙 (닉네임 & 태그) */}
              <div className="py-6">
                <h2 className="text-2xl md:text-3xl font-black text-[#222222] dark:text-[#F5F4F0] mb-4 truncate">
                  {nickname || 'NICKNAME'}
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {selectedTags.length > 0 ? (
                    selectedTags.map(tag => (
                      <span key={tag} className="px-2 py-0.5 border border-[#222222] dark:border-[#F5F4F0] text-[11px] font-bold text-[#222222] dark:text-[#F5F4F0]">
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className="px-2 py-0.5 border border-[#E5E4E0] dark:border-[#333333] text-[11px] font-medium text-[#A0A0A0] dark:text-[#666666]">
                      TAGS
                    </span>
                  )}
                </div>
              </div>

              {/* 명함 하단 (소개) */}
              <div className="mt-auto">
                <p className="text-xs text-[#666666] dark:text-[#A0A0A0] leading-relaxed line-clamp-2 min-h-[32px]">
                  {bio || '자기소개가 여기에 표시됩니다.'}
                </p>
              </div>
            </div>
            
            <p className="text-center text-xs text-[#A0A0A0] dark:text-[#666666] mt-6">
              프로필은 가입 후 언제든 수정할 수 있습니다.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}