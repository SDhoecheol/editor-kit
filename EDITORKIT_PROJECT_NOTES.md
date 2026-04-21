# 에디터킷(EditorKit) 프로젝트 종합 노트

> 최종 업데이트: 2026-04-21

---

## 1. 프로젝트 개요

**에디터킷**은 인쇄 및 디자인 실무자를 위한 커뮤니티 + 유틸리티 플랫폼입니다.

- **URL**: `http://localhost:3000` (개발) / Vercel 배포 예정
- **디자인 테마**: 네오 브루탈리즘 (Neo-Brutalism) — 굵은 테두리, 날카로운 그림자, 흑백 기반 고대비 팔레트
- **다크모드**: 지원 (`next-themes` 사용)

---

## 2. 기술 스택

| 항목 | 버전/라이브러리 |
|---|---|
| 프레임워크 | Next.js 16.2.1 (App Router) |
| 런타임 | React 19.2.4 |
| 언어 | TypeScript 5 |
| 스타일링 | Tailwind CSS 4 |
| DB/인증 | Supabase (`@supabase/ssr` 0.10.2) |
| 에디터 | TOAST UI Editor 3.2.2 (`@toast-ui/react-editor`) |
| 3D 렌더링 | Three.js + React Three Fiber + Drei |
| PDF 처리 | `pdf-lib`, `pdfjs-dist`, `jspdf` |
| QR 코드 | `qrcode` |
| 페이지 플립 | `react-pageflip` |
| 테마 관리 | `next-themes` |

---

## 3. 프로젝트 폴더 구조

```
editor-kit/
├── app/
│   ├── auth/
│   │   └── logout/route.ts          # 서버 측 로그아웃 API
│   ├── community/
│   │   ├── [id]/
│   │   │   ├── page.tsx             # 게시글 상세 (SSR, 서버 컴포넌트)
│   │   │   └── PostClientComponents.tsx  # 뷰 트래커, 좋아요, 댓글, 대댓글
│   │   ├── edit/[id]/
│   │   │   ├── page.tsx             # 수정 페이지 (SSR)
│   │   │   └── EditClientForm.tsx   # 수정 폼 (클라이언트)
│   │   ├── write/page.tsx           # 글쓰기 페이지
│   │   ├── page.tsx                 # 커뮤니티 목록 (SSR)
│   │   └── actions.ts               # 모든 커뮤니티 서버 액션
│   ├── design/                      # 디자인 관련 페이지
│   ├── login/                       # 로그인 페이지 (Google OAuth)
│   ├── mypage/
│   │   ├── page.tsx                 # 마이페이지 (SSR, 서버 컴포넌트)
│   │   └── MyPageClient.tsx         # 마이페이지 UI (클라이언트 컴포넌트)
│   ├── tools/                       # 유틸리티 툴 모음
│   │   ├── flipbook/                # 플립북
│   │   ├── harikomi/                # 하리꼬미 조판 계산기
│   │   ├── mockup3d/                # 3D 패키징 목업
│   │   ├── qrcode/                  # QR 코드 생성기
│   │   ├── seneca/                  # 세네카 계산기
│   │   └── yieldcalc/              # 수율 계산기
│   ├── welcome/page.tsx             # 신규 회원 프로필 설정 페이지
│   ├── HomeClientComponents.tsx     # 홈 화면 클라이언트 컴포넌트 (ProfileWidget 등)
│   ├── layout.tsx                   # 루트 레이아웃 (SSR, Navbar 포함)
│   └── page.tsx                     # 메인 홈 화면
├── components/
│   ├── Navbar.tsx                   # 전역 네비게이션 바
│   ├── LoginButton.tsx              # Google 로그인 버튼
│   ├── ThemeProvider.tsx            # 다크모드 프로바이더
│   ├── TuiEditorWrapper.tsx         # TOAST UI 에디터 래퍼
│   └── TuiViewerWrapper.tsx         # TOAST UI 뷰어 래퍼
├── lib/
│   ├── supabase.ts                  # 클라이언트 측 Supabase 인스턴스
│   ├── database.types.ts            # (생성 필요) Supabase 자동 생성 타입
│   └── supabase/
│       └── middleware.ts            # 미들웨어 전용 Supabase 클라이언트
├── middleware.ts                    # Next.js 미들웨어 (인증/라우팅 보호)
├── .npmrc                           # legacy-peer-deps=true (TOAST UI 호환)
└── .env.local                       # 환경 변수
```

---

## 4. 데이터베이스 스키마 (Supabase)

### Supabase 프로젝트 ID: `ogfkckjfealewnbefmon`

### 테이블 구조

#### `public.profiles`
| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid (PK) | `auth.users.id`와 동일 |
| `email` | text | 이메일 |
| `nickname` | text (NOT NULL) | 닉네임 |
| `tags` | text[] | 직무 태그 배열 |
| `bio` | text | 한 줄 소개 |
| `role_tag` | text | 대표 직무 (예: 디자이너) — **ALTER로 추가됨** |
| `ink` | integer | 잉크 잔액 — **ALTER로 추가됨** |
| `created_at` | timestamptz | 생성일 |

> ⚠️ 주의: 코드 곳곳에 `ink_balance`라는 잘못된 컬럼명이 남아있을 수 있음. 실제 컬럼명은 `ink`.

#### `public.posts`
| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid (PK) | |
| `title` | text (NOT NULL) | 제목 |
| `content` | text (NOT NULL) | 내용 (TOAST UI Markdown) |
| `author_id` | uuid | `profiles.id` 참조 |
| `author_email` | text | 작성자 이메일 |
| `board_type` | text | 게시판 종류 (`free`, `QnA` 등) |
| `view_count` | integer | 조회수 |
| `prefix` | text | 말머리 — **ALTER로 추가됨** |
| `is_anonymous` | boolean | 익명 여부 — **ALTER로 추가됨** |
| `is_resolved` | boolean | Q&A 채택 여부 — **ALTER로 추가됨** |
| `created_at` | timestamptz | 생성일 |

#### `public.comments`
| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid (PK) | |
| `post_id` | uuid | `posts.id` 참조 |
| `author_id` | uuid | `profiles.id` 참조 |
| `content` | text (NOT NULL) | 댓글 내용 |
| `parent_id` | uuid | 대댓글 부모 ID — **ALTER로 추가됨** |
| `created_at` | timestamptz | 생성일 |

#### `public.likes`
| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | uuid (PK) | |
| `post_id` | uuid | `posts.id` 참조 |
| `user_id` | uuid | `profiles.id` 참조 |
| `created_at` | timestamptz | 생성일 |

### DB 함수 (RPC)
- `increment_view_count(p_id uuid)` — 게시글 조회수 +1
- `adjust_ink(p_user_id uuid, p_amount integer)` — 잉크 안전 증감

---

## 5. 인증 및 라우팅 구조

### 인증 방식
- **Google OAuth** (`Supabase Auth`)
- 로그인 후 세션은 **쿠키 기반** (`@supabase/ssr`)으로 관리
- 클라이언트 세션 조회는 절대 금지, **항상 서버 측 `getUser()`** 사용

### 미들웨어 보호 로직 (`middleware.ts`)
1. 로그인한 유저가 `profiles` 테이블에 데이터가 없으면 → `/welcome` 강제 이동
2. 프로필이 있는 유저가 `/welcome` 접근 시 → `/` 홈으로 리다이렉트
3. 비로그인 유저가 `/mypage`, `/community/write` 접근 시 → `/login` 리다이렉트
4. 로그인 유저가 `/login` 접근 시 → `/` 홈으로 리다이렉트

### 로그아웃 흐름
- `Navbar.tsx` → `POST /auth/logout` + `supabase.auth.signOut()` 병렬 실행
- 0.8초 타임아웃 적용 (무한 대기 방지)
- 완료 후 `window.location.href = "/"` 로 물리적 새로고침 & 홈 이동

---

## 6. 잉크(Ink) 시스템

| 행동 | 잉크 변동 |
|---|---|
| 게시글 작성 | +30 💧 |
| 게시글 삭제 | -30 💧 |
| 댓글 작성 | +5 💧 |
| 댓글 삭제 | -5 💧 |
| Q&A 채택 (질문자) | +100 💧 |
| Q&A 채택 (답변자) | +100 💧 |

잉크 처리 로직은 `actions.ts`의 `adjustInk()` 내부 유틸 함수를 통해 처리하며, RPC 실패 시 JS 쿼리로 fallback.

---

## 7. 서버 액션 목록 (`app/community/actions.ts`)

| 함수명 | 설명 |
|---|---|
| `createPost()` | 게시글 생성 (+30 잉크) |
| `updatePost()` | 게시글 수정 |
| `deletePost()` | 게시글 삭제 (-30 잉크) |
| `createComment()` | 댓글/대댓글 생성 (+5 잉크) |
| `deleteComment()` | 댓글 삭제 (-5 잉크) |
| `resolvePost()` | Q&A 채택 (+100 잉크 × 2) |
| `updateProfile()` | 프로필(닉네임, role_tag) 수정 |

---

## 8. 지금까지 완료한 작업 목록

### 인증 & 세션
- [x] `createServerClient` 기반 SSR 인증 패턴 도입
- [x] 로그아웃 시 `window.location.href = "/"` 물리적 새로고침으로 Navbar/ProfileWidget 동기화 해결
- [x] 로그아웃 API (`/auth/logout/route.ts`) `cookieStore.delete()`로 완전 쿠키 파기
- [x] 0.8초 타임아웃으로 무한 대기 방지
- [x] 미들웨어에서 프로필 없는 신규 유저를 `/welcome`으로 자동 리다이렉트 복구
- [x] `lib/supabase/middleware.ts`에서 `supabase` 클라이언트 반환하도록 수정 (ReferenceError 해결)

### 커뮤니티
- [x] 커뮤니티 상세 페이지 SSR 전환 (`app/community/[id]/page.tsx`)
- [x] 댓글 섹션(`CommentSection`)에 서버 측 user 데이터 주입 → 댓글 작성 정상화
- [x] 대댓글(답글) 기능 구현 (`parent_id` 컬럼 추가)
- [x] 게시글 추천(좋아요) 버튼에 서버 유저 데이터 주입 → 추천 기능 정상화
- [x] 게시글 수정 폼 `updatePost` 인자 6개로 맞춤 (타입 에러 수정)

### DB 스키마
- [x] `profiles` 테이블에 `ink`, `role_tag` 컬럼 추가
- [x] `posts` 테이블에 `prefix`, `is_anonymous`, `is_resolved` 컬럼 추가
- [x] `comments` 테이블에 `parent_id` 컬럼 추가
- [x] `increment_view_count`, `adjust_ink` RPC 함수 생성

### 마이페이지
- [x] 마이페이지 서버 컴포넌트(SSR) 전환 (깜빡임 제거)
- [x] `MyPageClient.tsx` 분리 생성
- [x] '나의 활동' 탭에 실제 내가 쓴 글 목록 연동
- [x] 프로필 즉석 수정 기능 (닉네임, 직무 태그)
- [x] 잉크 잔액 표시 오타 수정 (`ink_balance` → `ink`)

### 기타
- [x] `.npmrc`에 `legacy-peer-deps=true` 추가 (TOAST UI + React 19 호환)
- [x] `HomeClientComponents.tsx`의 잉크 표시 오타 수정

---

## 9. 앞으로 해야 할 작업 (TODO)

### 🔴 높은 우선순위
- [ ] **게시글 이미지 업로드**: TOAST UI Editor에 Supabase Storage 연동하여 이미지 삽입 가능하게
- [ ] **게시글 이미지 미표시 버그 수정**: 기존 게시글의 이미지가 상세 페이지에서 안 보이는 현상 조사
- [ ] **실시간 라운지(홈 화면)**: 메인 홈의 "실시간 라운지" 섹션에 자유게시판 최신글이 실제로 표시되도록 연동

### 🟡 중간 우선순위
- [ ] **스크랩(저장한 글) 기능**: `bookmarks` 테이블 신설 + 마이페이지 "저장한 글" 탭 연동
- [ ] **잉크 내역 히스토리**: `ink_history` 테이블 신설 + 마이페이지 "최근 잉크 내역" 연동
- [ ] **댓글 삭제 기능**: 현재 댓글 작성만 가능, 본인 댓글 삭제 버튼 추가 필요
- [ ] **Q&A 채택 UI 고도화**: 채택된 답변에 뱃지/배경색 강조 표시
- [ ] **게시글 검색 기능**: 제목, 내용, 태그 기반 검색
- [ ] **알림 시스템**: 댓글/채택 시 알림 (Supabase Realtime 활용 가능)

### 🟢 낮은 우선순위
- [ ] **마이페이지 최근 사용 툴**: 실제 사용 기록 추적 (localStorage 또는 DB)
- [ ] **환경설정 페이지**: 마이페이지의 "환경설정" 버튼 기능 구현
- [ ] **프로필 아바타 이미지**: 현재 닉네임 첫 글자만 표시 → Supabase Storage로 이미지 업로드
- [ ] **게시판 페이지네이션**: 게시글이 많아졌을 때 무한 스크롤 또는 페이지 분리
- [ ] **디자인 폴리싱**: 일부 컴포넌트에 네오 브루탈리즘 스타일 일관성 확인
- [ ] **SEO 최적화**: 각 페이지별 `metadata` 동적 생성 (게시글 제목, OG 이미지 등)

---

## 10. 알려진 버그 / 주의사항

| 버그/주의사항 | 상태 | 비고 |
|---|---|---|
| 게시글 이미지 미표시 | 🔴 미해결 | TOAST UI viewer 설정 또는 이미지 URL 깨짐 의심 |
| `ink_balance` 오타 | ✅ 대부분 수정됨 | 혹시 코드베이스에 잔재 있을 수 있으니 전체 grep 필요 |
| 미들웨어에서 모든 요청마다 DB 쿼리 | ⚠️ 성능 주의 | 프로필 유무 확인을 위해 매 요청마다 `profiles` 테이블 조회 중 — 트래픽 증가 시 Redis 캐시 고려 |
| TOAST UI + React 19 peer dep 경고 | ✅ `.npmrc`로 임시 해결 | 장기적으로 다른 에디터로 마이그레이션 고려 |

---

## 11. 환경 변수 (`.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=https://ogfkckjfealewnbefmon.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
```

---

## 12. 개발 서버 실행

```bash
npm run dev
```

빌드 및 배포:
```bash
npm run build
npm run start
```
