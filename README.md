# Todo 앱

프론트엔드·백엔드 개념을 연습하기 위한 Todo(할 일 관리) 앱. 실제 서버 없이 GitHub Pages(정적 호스팅)에만 배포하고, "백엔드"는 프론트엔드 코드 안에서 REST API처럼 동작하도록 시뮬레이션했다.

**배포 링크:** https://beginner-driver.github.io/todo-list/

## 기능

- 할 일 추가
- 할 일 내용 수정 (더블클릭으로 편집)
- 할 일 삭제
- 완료 체크 (체크박스 토글, 완료 항목은 취소선으로 구분)
- 필터: 전체 / 미완료 / 완료
- 새로고침해도 데이터 유지 (같은 브라우저 기준)

## 기술 스택

| 영역 | 사용 기술 |
|---|---|
| 프론트엔드 | React 18, TypeScript, Vite |
| Mock 백엔드 | MSW (Mock Service Worker) |
| 데이터 저장소 | localStorage |
| 테스트 | Vitest, @testing-library/react |
| 배포 | GitHub Pages (GitHub Actions) |

## 프론트엔드/백엔드 구성

실제 서버가 없는 대신, 브라우저 안에서 다음과 같은 계층으로 "백엔드처럼" 동작한다.

```
[React 컴포넌트]
      ↕ fetch('/api/todos')
[MSW 핸들러]  ← REST API 역할 (src/mocks/handlers.ts)
      ↕
[localStorage]  ← 실제 데이터 저장소 (src/mocks/db.ts)
```

- **`src/mocks/db.ts`** — localStorage를 직접 읽고 쓰는 가장 아래 계층. 실제 백엔드였다면 DB 쿼리에 해당하는 부분.
- **`src/mocks/handlers.ts`** — `GET/POST /api/todos`, `PATCH/DELETE /api/todos/:id` 라우트를 정의하고 `db.ts`에 위임. MSW가 브라우저의 네트워크 요청을 가로채 이 핸들러로 연결하므로, 프론트 입장에서는 진짜 서버에 요청하는 것과 동일하게 동작한다.
- **`src/api.ts`** — 프론트 컴포넌트가 호출하는 fetch 클라이언트(`getTodos`, `createTodo`, `updateTodo`, `deleteTodo`). MSW의 존재를 몰라도 되도록 감싸는 얇은 계층.
- **`src/App.tsx` + `src/components/`** — `api.ts`를 호출해 상태를 관리하고 화면을 그리는 프론트엔드 UI.

최초 접속 시에만 `public/mock-data/todos.json`의 초기 데이터를 localStorage로 한 번 복사(seed)하고, 이후 모든 조회/추가/수정/삭제는 localStorage 기준으로 동작한다. 서버 동기화가 없으므로 데이터는 브라우저/기기별로 독립적이다.

## API 명세 (Mock)

| Method | Endpoint | 설명 |
|---|---|---|
| GET | `/api/todos` | 전체 할 일 목록 조회 |
| POST | `/api/todos` | 할 일 추가 (`{ title: string }`) |
| PATCH | `/api/todos/:id` | 할 일 수정 (`{ title?: string, completed?: boolean }`) |
| DELETE | `/api/todos/:id` | 할 일 삭제 |

빈 제목으로 추가/수정하면 400, 존재하지 않는 id를 수정/삭제하면 404를 반환한다.

## 로컬 개발

```bash
npm install
npm run dev      # 개발 서버
npm run test     # 테스트 실행
npm run build    # 프로덕션 빌드
```
