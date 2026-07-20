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

## 핵심 코드

### 타입 정의 (`src/types.ts`)

```ts
export interface Todo {
  id: string
  title: string
  completed: boolean
  createdAt: string
}

export type Filter = 'all' | 'active' | 'completed'
```

앱 전체에서 공유하는 데이터 모양. `Todo`는 API 응답과 localStorage 저장 형식을 겸하고, `Filter`는 화면에 보여줄 목록을 고르는 3가지 상태를 표현한다.

### 저장소 계층 (`src/mocks/db.ts`)

```ts
export function create(title: string): Todo {
  const todo: Todo = {
    id: crypto.randomUUID(),
    title,
    completed: false,
    createdAt: new Date().toISOString(),
  }
  const todos = readAll()
  todos.push(todo)
  writeAll(todos)
  return todo
}
```

`readAll`/`writeAll`로 localStorage를 JSON 배열째로 읽고 쓴다. `create`/`update`/`remove`는 모두 "전체를 읽어 배열을 조작하고 통째로 다시 쓰는" 동일한 패턴이며, 실제 DB였다면 각각 INSERT/UPDATE/DELETE 쿼리에 대응한다.

### API 라우트 (`src/mocks/handlers.ts`)

```ts
http.post('/api/todos', async ({ request }) => {
  const body = (await request.json()) as { title?: string }
  if (!body.title || !body.title.trim()) {
    return HttpResponse.json({ message: 'title is required' }, { status: 400 })
  }
  return HttpResponse.json(create(body.title.trim()), { status: 201 })
}),
```

MSW가 `fetch('/api/todos', { method: 'POST' })` 요청을 가로채 이 핸들러로 넘긴다. 빈 제목은 400으로 거부하고, 통과하면 `db.ts`의 `create`를 호출해 실제 저장을 위임한다. `PATCH`/`DELETE` 핸들러도 같은 구조로 `update`/`remove`에 위임하며 없는 id는 404를 반환한다.

### fetch 클라이언트 (`src/api.ts`)

```ts
export async function createTodo(title: string): Promise<Todo> {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  })
  if (!res.ok) throw new Error('failed to create todo')
  return res.json()
}
```

컴포넌트가 MSW의 존재를 몰라도 되도록 감싸는 얇은 래퍼. 응답이 실패(`!res.ok`)면 에러를 던져 호출부(`App.tsx`)가 처리하도록 한다.

### 화면 상태 관리 (`src/App.tsx`)

```tsx
async function handleAdd(title: string) {
  const todo = await createTodo(title)
  setTodos((prev) => [...prev, todo])
}

const visibleTodos = todos.filter((t) => {
  if (filter === 'active') return !t.completed
  if (filter === 'completed') return t.completed
  return true
})
```

`App`이 유일한 상태 보유자로, `useEffect`에서 최초 1회 `getTodos()`로 목록을 불러온 뒤 추가/수정/삭제할 때마다 서버(mock) 응답으로 로컬 상태를 갱신한다. `visibleTodos`는 별도 상태 없이 `filter` 값에 따라 매 렌더링마다 파생시키는 값이다.

## 로컬 개발

```bash
npm install
npm run dev      # 개발 서버
npm run test     # 테스트 실행
npm run build    # 프로덕션 빌드
```
