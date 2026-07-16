# PRD: Todo 앱 (GitHub Pages)

## 1. 배경 및 목적
웹페이지로, 실제 서버 없이 GitHub Pages(정적 호스팅)만으로 배포 가능해야 하며, "백엔드"는 프론트 코드 내에서 REST API처럼 흉내 낸 mock 계층으로 시뮬레이션한다.

## 2. 도메인
할 일 관리(Todo/Task) 앱.

## 3. 범위 (Scope)
### 포함하는 기능
- **조회**: 초기 목업 데이터(`mock-data/todos.json`)를 최초 1회 로드하여 localStorage로 이관 후, 이후 모든 조회는 localStorage 기준
- **추가**: 새 할 일 생성 (제목 입력)
- **수정**: 기존 할 일 내용 수정
- **삭제**: 할 일 삭제
- **완료 체크**: 체크박스로 완료/미완료 토글, 완료 항목은 취소선 등으로 시각적 구분
- **필터**: 전체 / 완료 / 미완료 보기
- **영속성**: localStorage 기반 — 새로고침해도 데이터 유지. 브라우저/기기별로 별도 저장이며 서버 동기화는 없음

### 포함하지 않는 기능 (Out of scope)
- 사용자 인증/로그인
- 여러 기기 간 데이터 동기화
- 실제 서버로의 영구 저장 (JSON 파일에 쓰기, DB 연동 등)
- 협업/공유 기능

## 4. 기술 스택
| 영역 | 선택 | 이유 |
|---|---|---|
| 프론트엔드 | React (Vite) | 컴포넌트·상태관리 개념 연습에 적합, Vite로 정적 빌드 후 배포 용이 |
| Mock 백엔드 | MSW (Mock Service Worker) | 실제 `fetch` 요청을 네트워크 레벨에서 가로채 REST API 흐름(요청/응답/상태코드)을 그대로 연습 가능 |
| 초기 데이터 | `mock-data/todos.json` | 최초 로드용 목업 데이터 |
| 실제 저장소 | localStorage | MSW 핸들러 내부에서 localStorage를 읽고 써서 영속성 제공 |
| 배포 | GitHub Pages (`gh-pages` 또는 GitHub Actions) | 정적 호스팅, 무료 |

## 5. 아키텍처 / 데이터 흐름
```
[React 컴포넌트]
   ↓ fetch('/api/todos') 등 REST 스타일 호출
[MSW 핸들러] ── 요청을 가로챔
   ↓
localStorage 읽기/쓰기
   ↓
[MSW 핸들러] → 응답(JSON) 반환
   ↓
[React 컴포넌트] 상태 업데이트, 화면 리렌더
```

- 앱 최초 실행 시: localStorage에 데이터가 없으면 `mock-data/todos.json`을 불러와 localStorage에 저장(seed) → 이후 모든 CRUD는 localStorage 기준으로 동작
- 빌드 시 MSW는 프로덕션에도 포함되어 GitHub Pages 배포본에서 동일하게 동작 (실제 서버가 없어도 "백엔드 통신"처럼 보임)

## 6. API 명세 (Mock)
| Method | Endpoint | 설명 |
|---|---|---|
| GET | `/api/todos` | 전체 할 일 목록 조회 |
| POST | `/api/todos` | 할 일 추가 (`{ title: string }`) |
| PATCH | `/api/todos/:id` | 할 일 수정 (`{ title?: string, completed?: boolean }`) |
| DELETE | `/api/todos/:id` | 할 일 삭제 |

### 데이터 모델
```json
{
  "id": "string (uuid)",
  "title": "string",
  "completed": "boolean",
  "createdAt": "ISO date string"
}
```

## 7. 에러 처리
- 존재하지 않는 id로 PATCH/DELETE 요청 시 404 응답 시뮬레이션
- 빈 제목으로 추가/수정 시 400 응답 시뮬레이션 (프론트에서도 입력 검증)

## 8. 테스트 관점
- Todo 생성 → 목록에 반영되는지
- 완료 체크 토글 → 필터(완료/미완료)에 따라 정상 노출되는지
- 삭제 → 목록에서 제거되고 새로고침 후에도 사라진 상태 유지되는지
- 새로고침 후 localStorage에 저장된 데이터가 유지되는지 (최초 1회 seed 이후 JSON 재로드 안 함)

## 9. 배포
- GitHub 저장소 생성 → Vite 빌드(`npm run build`) → `gh-pages` 브랜치 또는 GitHub Actions 워크플로우로 `dist/` 배포
- Vite `base` 설정을 리포지토리명에 맞게 지정 (`/repo-name/`)
