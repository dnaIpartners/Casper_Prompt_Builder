# Casper Prompt Builder — PRD

> Adobe Firefly용 상업 3D/CGI 오브젝트 이미지 프롬프트를 4단계 위저드로 표준화 생성하는 내부 도구.
> 본 문서는 현재 구현(as-is)을 기준으로 한 제품 사양서이며, 다른 개발자/에이전트가 이어서 개발·확장·재구축할 수 있도록 작성되었다.

- 문서 버전: 1.0
- 기준 커밋: `main` (README/`.env.example` 정비 이후)
- 최종 갱신: 2026-07-16

---

## 1. 개요

### 1.1 배경 / 문제

기획전용 3D/CGI 오브젝트 이미지를 Adobe Firefly로 생성할 때, 담당자마다 프롬프트 품질·형식이 제각각이고 다음 문제가 반복된다.

- 프롬프트 구성 순서·요소가 표준화되지 않아 결과 편차가 큼
- Firefly에서 hex 색상 코드가 잘 반영되지 않는데도 그대로 입력함
- 렌더링 방식과 재질(예: Clay + Glass)의 비현실적 조합을 걸러낼 방법이 없음
- 국문 기획 의도를 영문 프롬프트로 옮기는 과정에서 정보 손실 발생

### 1.2 목표

- 기획 정보를 **4단계 구조화 입력**으로 받아 **규칙에 맞는 영문 Firefly 프롬프트 + 국문 번역**을 자동 생성한다.
- 렌더링/재질의 **비호환 조합을 UI에서 원천 차단**해 잘못된 입력을 방지한다.
- API 키 없이도 흐름을 확인할 수 있는 **샘플 모드**를 제공한다.

### 1.3 성공 기준 (제품 관점)

- 필수 항목만 채우면 누구나 동일한 형식의 프롬프트를 얻는다.
- 생성된 영문 프롬프트에 hex 코드가 포함되지 않는다.
- 렌더링과 충돌하는 재질을 선택할 수 없다.

### 1.4 범위 밖 (Non-goals)

- 사용자 계정/인증, 생성 이력 저장, 즐겨찾기
- Firefly API 직접 연동(이미지 생성) — 본 도구는 **프롬프트 텍스트 산출까지만** 담당
- 다국어(국문/영문 외) 지원
- 프롬프트 생성 결과의 서버 저장 (현재 전부 클라이언트 메모리 상태)

---

## 2. 사용자 및 시나리오

- **주 사용자**: 사내 기획/디자인 담당자 (비개발자)
- **핵심 시나리오**
  1. Step 1~3에서 기획 의도·오브젝트·시각 표현을 입력한다.
  2. Step 4에서 `결과 생성하기`를 눌러 AI 프롬프트를 받는다.
  3. 영문/국문 Prompt·Avoid를 복사해 Firefly에 붙여넣는다.
  4. 결과가 아쉬우면 이전 단계로 돌아가 수정 후 재생성한다.

---

## 3. 기술 스택 & 아키텍처

- **Framework**: Next.js 16 (App Router), React 19, TypeScript 5
- **Styling**: Tailwind CSS 4 (인라인 유틸리티 클래스, 별도 디자인 토큰 파일 없음)
- **AI**: `@anthropic-ai/sdk`, 모델 `claude-sonnet-5` (구조화 출력 JSON Schema)
- **배포**: Vercel

### 3.1 디렉터리 구조

```
src/app/
├─ page.tsx                     # "/" → "/step-1" 리다이렉트
├─ layout.tsx                   # 루트 레이아웃 (폰트/메타)
├─ globals.css                  # 전역 스타일
├─ (builder)/                   # 위저드 라우트 그룹
│  ├─ layout.tsx                # 공통 셸: 브랜드, 진행률, 스텝퍼, 하단 내비, stale 배너
│  ├─ builder-context.tsx       # 전역 상태/액션 (React Context) — 단일 소스 오브 트루스
│  ├─ builder-model.ts          # 타입·enum 옵션·호환 매트릭스·샘플 생성·검증 헬퍼
│  ├─ ui.tsx                    # 공용 컴포넌트 (Field/TextInput/Card/Chip/ResultBlock 등)
│  ├─ step-1/page.tsx           # 컨셉 정의
│  ├─ step-2/page.tsx           # 오브젝트 정의
│  ├─ step-3/page.tsx           # 시각 표현 정의
│  └─ step-4/page.tsx           # 결과
└─ api/
   └─ generate-prompt/route.ts  # POST: 입력 검증 + Anthropic 호출 + 구조화 응답
```

### 3.2 아키텍처 원칙

- **상태는 `BuilderProvider` 한 곳에만 존재**한다. 각 스텝 페이지는 `useBuilder()`로 읽고 쓴다.
- 상태는 **클라이언트 메모리(useState)** 에만 있으며 새로고침 시 초기화된다. (localStorage 미사용)
- `builder-model.ts`의 옵션 상수(enum 배열)는 **UI와 API 검증이 공유**한다. 옵션을 추가/변경하면 양쪽에 자동 반영되도록 이 파일을 단일 출처로 유지한다.

---

## 4. 데이터 모델

### 4.1 입력 상태 `BuilderState` (`builder-model.ts`)

| 필드 | 타입 | 필수 | 스텝 | 라벨(UI) |
| --- | --- | :---: | :---: | --- |
| `theme` | string | ✅ | 1 | 기획전 주제 |
| `message` | string | ✅ | 1 | 핵심 메시지 |
| `mood` | string | ✅ | 1 | 분위기 및 감성 설명 |
| `object` | string | ✅ | 2 | 메인 오브젝트 |
| `assoc` | string | ✅ | 2 | 연상 요소 |
| `highlight` | string | ✅ | 2 | 시각 강조 요소 |
| `composition` | `Composition \| null` | ✅ | 2 | 구성 방식 |
| `angle` | `Angle \| null` | ✅ | 2 | 오브젝트 앵글 |
| `bgType` | `BgType \| null` | ✅ | 3 | 배경 유형 |
| `background` | string | ✅ | 3 | 배경 표현 설명 |
| `rendering` | `Rendering \| null` | ✅ | 3 | 렌더링 방식 |
| `realism` | `Realism` | ➖ | 3 | 사실감 정도 (기본값 `mid`) |
| `detail` | `Detail` | ➖ | 3 | 디테일 강도 (기본값 `mid`) |
| `material` | `Material[]` | ➖ | 3 | 재질 스타일 (다중 선택) |

> 필수(`REQUIRED_FIELDS`)는 위 표의 ✅ 11개. `realism`/`detail`/`material`은 선택이며 기본값을 가진다.

### 4.2 enum 옵션 정의

- `Composition`: `single_hero`(Single Hero Object) · `hero_supporting`(Hero + Supporting)
- `Angle`: `front`(정면) · `angle45`(45도) · `side`(측면) · `top`(탑뷰) · `isometric`(아이소메트릭) · `closeup`(클로즈업)
- `BgType`: `gradient`(그라디언트) · `solid`(단색) · `other`(기타)
- `Rendering`: `commercial_3d` · `photorealistic` · `semi_realistic` · `stylized_3d` · `clay_style` · `illustrative_3d`
- `Realism`: `stylized_strong` · `stylized` · `mid`(기본) · `realistic` · `realistic_strong`
- `Detail`: `low` · `mid`(기본) · `high`
- `Material`: `glossy` · `soft_matte` · `glass` · `metallic` · `translucent`

### 4.3 출력 결과 `PromptResult`

| 키 | 언어 | 설명 |
| --- | --- | --- |
| `strategy` | 국문 | 시각 전략 (번호 리스트 3~4항목) |
| `direction` | 국문 | 표현 방향 (번호 리스트 3~4항목) |
| `prompt` | 영문 | Firefly 직접 입력용 프롬프트 |
| `avoid` | 영문 | 회피 요소 |
| `prompt_ko` | 국문 | `prompt`의 자연스러운 번역 (전문용어는 영문 유지) |
| `avoid_ko` | 국문 | `avoid`의 번역 |

---

## 5. 재질 × 렌더링 호환 매트릭스 (핵심 비즈니스 규칙)

`MATERIAL_RENDERING_MATRIX[rendering][material]` 는 3가지 값을 가진다.

- `allow`: 정상 선택 가능
- `subtle`: 선택 가능하나 "완화 적용"으로 은은하게만 반영 (UI에 배지 표시)
- `block`: 선택 불가 (UI에서 비활성화, API에서 400 반환)

| Rendering \ Material | glossy | soft_matte | glass | metallic | translucent |
| --- | --- | --- | --- | --- | --- |
| commercial_3d | allow | allow | allow | allow | allow |
| photorealistic | allow | allow | allow | allow | allow |
| semi_realistic | allow | allow | allow | allow | allow |
| stylized_3d | allow | allow | subtle | subtle | allow |
| clay_style | **block** | allow | **block** | **block** | subtle |
| illustrative_3d | subtle | allow | **block** | **block** | subtle |

### 5.1 추가 상호 배제 규칙

- `glossy`(광택)와 `soft_matte`(무광)는 **동시 선택 불가**. 하나가 선택되면 다른 쪽은 비활성화된다.
- 렌더링을 변경하면(`selectRendering`), 새 렌더링에서 `block`인 재질은 자동으로 선택 해제된다.

---

## 6. 화면별 요구사항

### 6.0 공통 셸 (`(builder)/layout.tsx`)

- 상단: 브랜드(“Adobe Firefly · Internal Tool” / “Firefly Prompt Builder”), 부제.
- **전체 입력 진행률 바**: 필수 11개 중 채워진 비율 % (`overallProgress`).
- **스텝퍼(1~4)**: 각 스텝 완료 여부(`isStepComplete`)에 따라 체크 표시. 클릭 시 해당 스텝으로 이동(자유 이동 허용).
- **stale 배너**: 결과 생성 후 입력을 바꾸면 “입력값이 결과 생성 이후 변경되었습니다” 경고 노출. Step 4에서는 이전 결과임을 알리고, 그 외 스텝에서는 Step 4로 이동 유도.
- **하단 고정 내비**: Step 1~3은 [이전]/[다음]. Step 4는 [이전]/[처음부터 다시 생성](확인창 후 전체 초기화).
- 디자인: 라이트 테마 고정. 포인트 컬러 `#4090f1`, 배경 `#f4f5f7`.

### 6.1 Step 1 — 컨셉 정의

- 기획전 주제 (텍스트, 필수) — “무엇을 위한 기획전인가.”
- 핵심 메시지 (텍스트, 필수) — “무엇을 전달할 것인가.”
- 분위기 및 감성 설명 (긴 텍스트영역, 필수) — 단어보다 문장, 장문 권장.

### 6.2 Step 2 — 오브젝트 정의

- 메인 오브젝트 (긴 텍스트영역, 필수) + **참고 예시 아코디언**(열람 전용, 클릭해도 입력값 안 채워짐).
- 연상 요소 (텍스트영역, 필수)
- 시각 강조 요소 (텍스트영역, 필수)
- 구성 방식 (카드 단일 선택, 필수)
- 오브젝트 앵글 (칩 단일 선택, 필수)

### 6.3 Step 3 — 시각 표현 정의

- 배경 유형 (칩 단일 선택, 필수)
- 배경 표현 설명 (긴 텍스트영역, 필수) — “색상은 hex보다 자연어가 정확” 힌트 노출.
- 렌더링 방식 (카드 단일 선택, 필수)
  - 렌더링 선택 시 **아코디언**으로 사실감 정도(ToggleButton, 기본 Balanced) / 디테일 강도(기본 중간) 노출.
- 재질 스타일 (칩 다중 선택, **선택**) — §5 매트릭스에 따라 비활성/완화 배지/툴팁 표시.

### 6.4 Step 4 — 결과

- 미입력 필수 항목이 있으면 경고 + 각 항목 클릭 시 해당 스텝으로 이동.
- 버튼 2개:
  - **샘플 출력 보기**: API 없이 `generateSampleResult`로 즉시 예시 결과. “샘플 출력(실제 AI 아님)” 배지.
  - **결과 생성하기 / 결과 다시 생성**: 필수 미충족 또는 로딩 중이면 비활성화. `/api/generate-prompt` 호출.
- 결과 표시: `01 시각 전략` / `02 표현 방향` / `03 Firefly Prompt (English)` / `04 Firefly Prompt (국문)`.
  - 03/04에는 Prompt·Avoid **복사 버튼**(복사 완료 피드백 1.6초).

---

## 7. API 명세 — `POST /api/generate-prompt`

### 7.1 요청 본문 (JSON)

`buildRequestBody`가 만드는 `BuilderState` 전체 14개 필드. 예:

```json
{
  "theme": "여름맞이 프로모션 기획전",
  "message": "더위를 식혀주는 상쾌한 순간",
  "mood": "이른 아침 물방울이 맺힌 유리병이...",
  "object": "반투명한 유리 향수병이 젖은 대리석 위에 놓여 있다",
  "assoc": "흩날리는 물방울",
  "highlight": "표면에 맺힌 물방울 하이라이트",
  "composition": "single_hero",
  "angle": "angle45",
  "bgType": "gradient",
  "background": "연한 코랄핑크에서 아이보리로 이어지는 그라디언트",
  "rendering": "commercial_3d",
  "realism": "mid",
  "detail": "mid",
  "material": ["glossy", "glass"]
}
```

### 7.2 서버 검증 규칙 (순서대로)

1. `ANTHROPIC_API_KEY` 미설정 → **500** “서버에 ANTHROPIC_API_KEY가 설정되어 있지 않습니다.”
2. JSON 파싱 실패 → **400**
3. 필수 텍스트 7개(`theme, message, mood, object, assoc, highlight, background`) 공백/누락 → **400** `필수 항목이 누락되었습니다: {key}`
4. `composition/angle/bgType/rendering` 이 enum 값이 아님 → **400**
5. `material` 원소가 enum 값이 아님 → **400**
6. `glossy` + `soft_matte` 동시 → **400**
7. 매트릭스상 `block` 재질 포함 → **400** `{material}은(는) 현재 렌더링 방식과 어울리지 않는 조합입니다.`

### 7.3 Anthropic 호출

- 모델 `claude-sonnet-5`, `max_tokens: 1500`
- `output_config.effort: "medium"`, `format: json_schema` (§4.3 6키 스키마, `additionalProperties:false`)
- `stop_reason` 처리: `refusal` → **422**, `max_tokens` → **502**
- 텍스트 블록 없음/JSON 파싱 실패 → **502**
- 성공 → 파싱된 `PromptResult` JSON 반환

### 7.4 에러 응답 형식

```json
{ "error": { "message": "...", "status": 4xx } }
```

클라이언트는 `data.error.message`를 배너에 표시한다.

---

## 8. 프롬프트 생성 규칙 (System Prompt 사양)

AI는 반드시 §4.3의 6개 키를 가진 **JSON 하나만** 출력한다. 영문 `prompt`는 아래 순서를 지킨다.

```
[렌더링 방식 + 재질 스타일] → [메인 오브젝트 + 시각 강조 요소] → [연상 요소]
→ [배경 유형 + 배경 표현(자연어 색상만)] → [사실감 정도] → [디테일 강도] → [분위기/감성] → [화질]
```

**절대 규칙**

- `prompt`와 배경 표현에 **hex 코드(#...) 금지**. 입력에 hex가 있어도 가장 가까운 자연어 색상으로 변환.
- `material` 배열이 비면 재질을 별도 언급하지 말고 렌더링 기본 재질감으로 표현.
- `avoid` 기본값: `no text, no watermark, no logo, no cropping, no harsh drop shadows, no human figures`
  - `bgType === "other"` → `no background elements` 추가
  - `rendering === "clay_style" | "illustrative_3d"` → `no photorealistic texture` 추가
- `prompt_ko`: `prompt`의 자연스러운 국문 번역. 단, `3D render`, `CGI`, `Splash` 등 디자인 전문용어는 영문 유지.

---

## 9. 상태/검증 로직 (`builder-context.tsx`)

- `set(key, value)` / `selectRendering` / `toggleMaterial` 호출 시, 이미 결과가 있으면 `resultStale = true`.
- `overallProgress`: 필수 11개 중 채워진 비율.
- `isStepComplete(step)`:
  - Step 1~3: 해당 스텝 필수 항목이 모두 채워짐.
  - **Step 4: `resultData` 존재 && `lastMode === "api"`** (샘플 출력은 완료로 인정하지 않음).
- `generateViaApi`: 필수 미충족이면 실행 안 함. 로딩/에러 상태 관리.
- `resetAll`: 확인창 후 전체 초기화 + Step 1로 이동.

---

## 10. 비기능 요구사항

- **환경 변수**: `ANTHROPIC_API_KEY` (서버 전용). 로컬은 `.env.local`, 배포는 Vercel 환경 변수(Production/Preview/Development)에 등록 후 재배포.
- **보안**: API 키는 서버 라우트에서만 사용, 클라이언트 노출 금지. `.env*`는 gitignore(단 `.env.example`은 추적).
- **접근성/반응형**: 최대 폭 `max-w-3xl` 중앙 정렬. 아이콘 `aria-hidden`.
- **스크립트**: `npm run dev | build | start | lint`.

---

## 11. 향후 개선 후보 (참고)

- 입력값 localStorage 영속화(새로고침 보존)
- 생성 이력 저장·비교
- 프롬프트 프리셋/템플릿
- 스트리밍 응답으로 생성 중 UX 개선
- 결과 품질 평가/재생성 옵션(톤 조절)
- 다크 테마

---

## 12. 다른 에이전트를 위한 작업 지침

- `AGENTS.md` 규칙 준수: 이 저장소의 Next.js는 학습 데이터와 다를 수 있으므로, 코드 작성 전 `node_modules/next/dist/docs/`의 관련 가이드를 확인할 것.
- 옵션/enum을 추가할 때는 **반드시 `builder-model.ts`를 단일 출처로** 수정하면 UI·API 검증에 함께 반영된다.
- 재질/렌더링 규칙 변경은 `MATERIAL_RENDERING_MATRIX` 한 곳만 고치면 UI 비활성화·API 검증·자동 해제 로직이 모두 따라온다.
- 결과 형식(6키)을 바꾸면 `RESPONSE_SCHEMA`, `SYSTEM_PROMPT`, `PromptResult`, Step 4 렌더링, `generateSampleResult`를 함께 수정해야 한다.
