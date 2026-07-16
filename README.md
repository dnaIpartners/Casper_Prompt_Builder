# Casper Prompt Builder

Adobe Firefly용 **상업용 3D / CGI 오브젝트 이미지 프롬프트**를 단계별로 만들어 주는 Next.js 웹 앱입니다.
기획 정보를 4단계 위저드로 입력하면, 규칙에 맞춘 영문 Firefly 프롬프트와 국문 해설을 자동으로 생성합니다.

## 주요 기능

- **4단계 프롬프트 빌더**
  1. **컨셉 정의** — 기획성 주제, 핵심 메시지, 분위기 및 감성
  2. **오브젝트 정의** — 메인 오브젝트, 연상 요소, 시각 강조 요소, 구성 방식, 앵글
  3. **시각 표현 정의** — 배경 유형/설명, 렌더링 방식, 사실감, 디테일 강도, 재질
  4. **결과** — 전략(strategy) · 방향(direction) · 영문 프롬프트 · 회피 요소 및 국문 번역
- **재질 × 렌더링 호환 매트릭스** — 렌더링 방식에 어울리지 않는 재질(예: Clay Style + Glass)을 자동으로 비활성화하고, Glossy/Soft Matte 동시 선택 등 모순 조합을 차단
- **두 가지 생성 모드**
  - **Sample 모드** — API 키 없이 입력값 기반의 예시 결과를 즉시 확인
  - **API 모드** — Anthropic Claude(`claude-sonnet-5`)로 실제 프롬프트 생성 (JSON Schema 구조화 출력)
- **프롬프트 규칙 내장** — hex 색상 코드 금지(자연어 색상만), 렌더링별 기본 `avoid` 항목 자동 추가, 재질 미지정 시 렌더링 기본 재질감 사용 등
- 결과 항목 원클릭 복사

## 기술 스택

- **Next.js 16** (App Router) · **React 19** · **TypeScript 5**
- **Tailwind CSS 4**
- **@anthropic-ai/sdk** (Claude API)

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

API 모드를 사용하려면 프로젝트 루트에 `.env.local` 파일을 만들고 Anthropic API 키를 넣습니다.

```bash
# .env.local
ANTHROPIC_API_KEY=sk-ant-...
```

> API 키가 없어도 **Sample 모드**로 앱을 실행하고 흐름을 확인할 수 있습니다.

### 3. 개발 서버 실행

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) 에 접속하면 자동으로 `/step-1` 로 이동합니다.

## 스크립트

| 명령            | 설명                       |
| --------------- | -------------------------- |
| `npm run dev`   | 개발 서버 실행             |
| `npm run build` | 프로덕션 빌드              |
| `npm run start` | 빌드 결과 실행             |
| `npm run lint`  | ESLint 검사                |

## 프로젝트 구조

```
src/app/
├─ page.tsx                     # 루트 → /step-1 리다이렉트
├─ (builder)/
│  ├─ layout.tsx                # 위저드 공통 레이아웃 · 진행 표시
│  ├─ builder-context.tsx       # 단계 간 입력 상태 공유 (Context)
│  ├─ builder-model.ts          # 타입 · 옵션 정의 · 재질/렌더링 매트릭스 · 샘플 생성 로직
│  ├─ ui.tsx                    # 공용 UI 컴포넌트
│  ├─ step-1/ … step-4/         # 각 단계 페이지
└─ api/
   └─ generate-prompt/route.ts  # Anthropic 호출 · 입력 검증 · 구조화 응답
```

## 프롬프트 생성 규칙 (API 모드)

`/api/generate-prompt` 는 입력값을 검증한 뒤 Claude에 전달하며, 다음 6개 키를 가진 JSON 하나만 반환합니다.

`strategy`, `direction`, `prompt`, `avoid`, `prompt_ko`, `avoid_ko`

영문 `prompt` 는 아래 순서를 지켜 하나의 자연스러운 문장으로 작성됩니다.

```
[렌더링 방식 + 재질] → [메인 오브젝트 + 강조 요소] → [연상 요소]
→ [배경 유형 + 배경 표현] → [사실감] → [디테일] → [분위기] → [화질]
```
