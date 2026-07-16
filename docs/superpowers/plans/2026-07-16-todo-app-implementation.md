# Todo 앱 (Mock Backend) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** GitHub Pages에 배포 가능한 React(Vite) Todo 앱을 만들되, 실제 서버 없이 MSW로 REST API를 흉내 내고 localStorage로 영속성을 준다.

**Architecture:** React 컴포넌트 → `fetch('/api/todos')` 호출 → MSW가 네트워크 레벨에서 가로챔 → MSW 핸들러가 `db.ts`(localStorage 래퍼)를 읽고 씀 → JSON 응답 반환 → 컴포넌트가 상태 갱신. 최초 실행 시 `public/mock-data/todos.json`을 seed 데이터로 한 번만 localStorage에 채운다.

**Tech Stack:** React 18, TypeScript, Vite, MSW v2, Vitest + jsdom + @testing-library/react, GitHub Actions(배포)

## Global Constraints

- GitHub Pages(정적 호스팅)에만 배포 — 실제 서버/DB 없음
- 실제 저장소는 localStorage — 서버 동기화 없음, 기기/브라우저별로 별도
- API 엔드포인트: `GET/POST /api/todos`, `PATCH/DELETE /api/todos/:id` (PRD와 동일)
- 데이터 모델: `{ id: string, title: string, completed: boolean, createdAt: string }`
- 상태관리 라이브러리·라우터·CSS 프레임워크 추가 금지 (YAGNI) — `useState`/fetch/순수 CSS만 사용
- Vite `base`는 저장소 이름에 맞춰 `/todo-list/`로 설정

---

### Task 1: 프로젝트 스캐폴드 (Vite + React + TypeScript)

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/App.css`
- Create: `src/index.css`
- Create: `.gitignore`

**Interfaces:**
- Produces: 빌드 가능한 빈 React 앱 (`npm run dev`, `npm run build`, `npm run test` 스크립트)

- [ ] **Step 1: package.json 작성**

```json
{
  "name": "todo-list",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "msw": "^2.4.9"
  },
  "devDependencies": {
    "@testing-library/react": "^16.0.1",
    "@types/react": "^18.3.11",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.2",
    "jsdom": "^25.0.1",
    "typescript": "^5.6.3",
    "vite": "^5.4.9",
    "vitest": "^2.1.3"
  }
}
```

- [ ] **Step 2: tsconfig.json 작성**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "types": ["vitest/globals"]
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 3: tsconfig.node.json 작성**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 4: vite.config.ts 작성 (base 경로 + vitest 설정 포함)**

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/todo-list/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
```

- [ ] **Step 5: index.html 작성**

```html
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Todo 앱</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 6: src/App.tsx, src/App.css, src/index.css, src/main.tsx 임시 작성 (뒤 태스크에서 교체)**

`src/index.css`:
```css
body {
  margin: 0;
  font-family: system-ui, sans-serif;
}
```

`src/App.css`:
```css
.app {
  max-width: 480px;
  margin: 40px auto;
  padding: 0 16px;
}
```

`src/App.tsx`:
```tsx
function App() {
  return <div className="app">Todo 앱</div>
}

export default App
```

`src/main.tsx`:
```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 7: .gitignore 작성**

```
node_modules
dist
dist-ssr
*.local
.DS_Store
```

- [ ] **Step 8: 설치 및 빌드 확인**

Run: `npm install`
Run: `npm run build`
Expected: `dist/` 생성, 에러 없이 종료

- [ ] **Step 9: Commit**

```bash
git add package.json tsconfig.json tsconfig.node.json vite.config.ts index.html src .gitignore
git commit -m "chore: Vite+React+TS 스캐폴드"
```

---

### Task 2: Todo 데이터 모델 + localStorage db 모듈 (TDD)

**Files:**
- Create: `src/types.ts`
- Create: `src/mocks/db.ts`
- Test: `src/mocks/db.test.ts`

**Interfaces:**
- Consumes: 없음 (최하위 레이어)
- Produces:
  - `Todo` 타입 `{ id: string; title: string; completed: boolean; createdAt: string }` (`src/types.ts`)
  - `seedIfEmpty(initial: Todo[]): void`
  - `getAll(): Todo[]`
  - `create(title: string): Todo`
  - `update(id: string, patch: Partial<Pick<Todo, 'title' | 'completed'>>): Todo | null`
  - `remove(id: string): boolean`
  (모두 `src/mocks/db.ts`에서 export, Task 3의 handlers.ts가 그대로 사용)

- [ ] **Step 1: src/types.ts 작성**

```ts
export interface Todo {
  id: string
  title: string
  completed: boolean
  createdAt: string
}
```

- [ ] **Step 2: 실패하는 테스트 작성 (src/mocks/db.test.ts)**

```ts
import { beforeEach, describe, expect, it } from 'vitest'
import { seedIfEmpty, getAll, create, update, remove } from './db'

beforeEach(() => {
  localStorage.clear()
})

describe('seedIfEmpty', () => {
  it('localStorage가 비어있으면 초기 데이터를 채운다', () => {
    seedIfEmpty([{ id: '1', title: '시드', completed: false, createdAt: '2026-01-01T00:00:00.000Z' }])
    expect(getAll()).toHaveLength(1)
  })

  it('이미 데이터가 있으면 덮어쓰지 않는다', () => {
    seedIfEmpty([{ id: '1', title: '시드', completed: false, createdAt: '2026-01-01T00:00:00.000Z' }])
    seedIfEmpty([{ id: '2', title: '다른시드', completed: false, createdAt: '2026-01-01T00:00:00.000Z' }])
    expect(getAll()).toHaveLength(1)
    expect(getAll()[0].id).toBe('1')
  })
})

describe('create', () => {
  it('새 todo를 추가하고 반환한다', () => {
    const todo = create('할 일 1')
    expect(todo.title).toBe('할 일 1')
    expect(todo.completed).toBe(false)
    expect(getAll()).toHaveLength(1)
  })
})

describe('update', () => {
  it('존재하는 todo를 수정한다', () => {
    const todo = create('할 일 1')
    const updated = update(todo.id, { completed: true })
    expect(updated?.completed).toBe(true)
    expect(getAll()[0].completed).toBe(true)
  })

  it('존재하지 않는 id면 null을 반환한다', () => {
    expect(update('없는id', { completed: true })).toBeNull()
  })
})

describe('remove', () => {
  it('존재하는 todo를 삭제하고 true를 반환한다', () => {
    const todo = create('할 일 1')
    expect(remove(todo.id)).toBe(true)
    expect(getAll()).toHaveLength(0)
  })

  it('존재하지 않는 id면 false를 반환한다', () => {
    expect(remove('없는id')).toBe(false)
  })
})
```

- [ ] **Step 3: 테스트 실행하여 실패 확인**

Run: `npx vitest run src/mocks/db.test.ts`
Expected: FAIL — `Cannot find module './db'`

- [ ] **Step 4: src/mocks/db.ts 구현**

```ts
import type { Todo } from '../types'

const STORAGE_KEY = 'todos'

function readAll(): Todo[] {
  const raw = localStorage.getItem(STORAGE_KEY)
  return raw ? (JSON.parse(raw) as Todo[]) : []
}

function writeAll(todos: Todo[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
}

export function seedIfEmpty(initial: Todo[]): void {
  if (localStorage.getItem(STORAGE_KEY) === null) {
    writeAll(initial)
  }
}

export function getAll(): Todo[] {
  return readAll()
}

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

export function update(
  id: string,
  patch: Partial<Pick<Todo, 'title' | 'completed'>>,
): Todo | null {
  const todos = readAll()
  const idx = todos.findIndex((t) => t.id === id)
  if (idx === -1) return null
  todos[idx] = { ...todos[idx], ...patch }
  writeAll(todos)
  return todos[idx]
}

export function remove(id: string): boolean {
  const todos = readAll()
  const next = todos.filter((t) => t.id !== id)
  if (next.length === todos.length) return false
  writeAll(next)
  return true
}
```

- [ ] **Step 5: 테스트 실행하여 통과 확인**

Run: `npx vitest run src/mocks/db.test.ts`
Expected: PASS (8 tests)

- [ ] **Step 6: Commit**

```bash
git add src/types.ts src/mocks/db.ts src/mocks/db.test.ts
git commit -m "feat: localStorage 기반 todo db 모듈"
```

---

### Task 3: MSW 핸들러 + 브라우저 워커 연결

**Files:**
- Create: `src/mocks/handlers.ts`
- Create: `src/mocks/browser.ts`
- Test: `src/mocks/handlers.test.ts`
- Modify: `src/main.tsx`
- Create: `public/mock-data/todos.json`
- Create: `public/mockServiceWorker.js`

**Interfaces:**
- Consumes: `src/mocks/db.ts`의 `getAll`, `create`, `update`, `remove` (Task 2)
- Produces: `handlers`(MSW `RequestHandler[]`, `src/mocks/handlers.ts`), `worker`(`src/mocks/browser.ts`) — Task 4의 `api.ts`가 실제로 호출하는 엔드포인트 4개(`GET/POST /api/todos`, `PATCH/DELETE /api/todos/:id`)

- [ ] **Step 1: 실패하는 테스트 작성 (src/mocks/handlers.test.ts)**

```ts
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

const server = setupServer(...handlers)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

beforeEach(() => {
  localStorage.clear()
})

describe('GET /api/todos', () => {
  it('빈 목록을 반환한다', async () => {
    const res = await fetch('/api/todos')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([])
  })
})

describe('POST /api/todos', () => {
  it('title이 있으면 201과 생성된 todo를 반환한다', async () => {
    const res = await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '할 일 1' }),
    })
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.title).toBe('할 일 1')
  })

  it('title이 비어있으면 400을 반환한다', async () => {
    const res = await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '' }),
    })
    expect(res.status).toBe(400)
  })
})

describe('PATCH /api/todos/:id', () => {
  it('존재하지 않는 id면 404를 반환한다', async () => {
    const res = await fetch('/api/todos/없는id', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: true }),
    })
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/todos/:id', () => {
  it('존재하지 않는 id면 404를 반환한다', async () => {
    const res = await fetch('/api/todos/없는id', { method: 'DELETE' })
    expect(res.status).toBe(404)
  })
})
```

- [ ] **Step 2: 테스트 실행하여 실패 확인**

Run: `npx vitest run src/mocks/handlers.test.ts`
Expected: FAIL — `Cannot find module './handlers'`

- [ ] **Step 3: src/mocks/handlers.ts 구현**

```ts
import { http, HttpResponse } from 'msw'
import { getAll, create, update, remove } from './db'

export const handlers = [
  http.get('/api/todos', () => {
    return HttpResponse.json(getAll())
  }),

  http.post('/api/todos', async ({ request }) => {
    const body = (await request.json()) as { title?: string }
    if (!body.title || !body.title.trim()) {
      return HttpResponse.json({ message: 'title is required' }, { status: 400 })
    }
    return HttpResponse.json(create(body.title), { status: 201 })
  }),

  http.patch('/api/todos/:id', async ({ params, request }) => {
    const body = (await request.json()) as { title?: string; completed?: boolean }
    const updated = update(params.id as string, body)
    if (!updated) {
      return HttpResponse.json({ message: 'not found' }, { status: 404 })
    }
    return HttpResponse.json(updated)
  }),

  http.delete('/api/todos/:id', ({ params }) => {
    const ok = remove(params.id as string)
    if (!ok) {
      return HttpResponse.json({ message: 'not found' }, { status: 404 })
    }
    return new HttpResponse(null, { status: 204 })
  }),
]
```

- [ ] **Step 4: 테스트 실행하여 통과 확인**

Run: `npx vitest run src/mocks/handlers.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: src/mocks/browser.ts 작성**

```ts
import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)
```

- [ ] **Step 6: MSW 브라우저 워커 스크립트 생성**

Run: `npx msw init public/ --save`
Expected: `public/mockServiceWorker.js` 생성

- [ ] **Step 7: 초기 목업 데이터 작성 (public/mock-data/todos.json)**

```json
[
  { "id": "seed-1", "title": "Todo 앱 PRD 읽어보기", "completed": true, "createdAt": "2026-07-16T00:00:00.000Z" },
  { "id": "seed-2", "title": "React 컴포넌트 구조 잡기", "completed": false, "createdAt": "2026-07-16T00:00:00.000Z" },
  { "id": "seed-3", "title": "MSW로 mock API 연결하기", "completed": false, "createdAt": "2026-07-16T00:00:00.000Z" }
]
```

- [ ] **Step 8: src/main.tsx 수정 — seed + MSW 워커 시작 후 렌더**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { seedIfEmpty } from './mocks/db'

async function seedInitialData() {
  const res = await fetch(`${import.meta.env.BASE_URL}mock-data/todos.json`)
  const initial = await res.json()
  seedIfEmpty(initial)
}

async function enableMocking() {
  const { worker } = await import('./mocks/browser')
  return worker.start({ onUnhandledRequest: 'bypass' })
}

async function bootstrap() {
  await seedInitialData()
  await enableMocking()
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

bootstrap()
```

- [ ] **Step 9: 빌드 확인**

Run: `npm run build`
Expected: 에러 없이 `dist/` 생성

- [ ] **Step 10: Commit**

```bash
git add src/mocks/handlers.ts src/mocks/handlers.test.ts src/mocks/browser.ts src/main.tsx public/mock-data/todos.json public/mockServiceWorker.js
git commit -m "feat: MSW mock API 핸들러 및 워커 연결"
```

---

### Task 4: API 클라이언트 (src/api.ts)

**Files:**
- Create: `src/api.ts`
- Test: `src/api.test.ts`

**Interfaces:**
- Consumes: `src/mocks/handlers.ts`의 `handlers` (테스트에서 `setupServer`로 사용), 실제 실행 시엔 `src/mocks/browser.ts`의 `worker`가 가로챈 동일 엔드포인트
- Produces:
  - `getTodos(): Promise<Todo[]>`
  - `createTodo(title: string): Promise<Todo>`
  - `updateTodo(id: string, patch: Partial<Pick<Todo, 'title' | 'completed'>>): Promise<Todo>`
  - `deleteTodo(id: string): Promise<void>`
  (Task 5의 컴포넌트들이 그대로 호출)

- [ ] **Step 1: 실패하는 테스트 작성 (src/api.test.ts)**

```ts
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { setupServer } from 'msw/node'
import { handlers } from './mocks/handlers'
import { getTodos, createTodo, updateTodo, deleteTodo } from './api'

const server = setupServer(...handlers)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

beforeEach(() => {
  localStorage.clear()
})

describe('api client', () => {
  it('createTodo -> getTodos로 조회된다', async () => {
    await createTodo('장보기')
    const todos = await getTodos()
    expect(todos).toHaveLength(1)
    expect(todos[0].title).toBe('장보기')
  })

  it('updateTodo로 완료 처리한다', async () => {
    const todo = await createTodo('장보기')
    const updated = await updateTodo(todo.id, { completed: true })
    expect(updated.completed).toBe(true)
  })

  it('deleteTodo로 삭제한다', async () => {
    const todo = await createTodo('장보기')
    await deleteTodo(todo.id)
    expect(await getTodos()).toHaveLength(0)
  })
})
```

- [ ] **Step 2: 테스트 실행하여 실패 확인**

Run: `npx vitest run src/api.test.ts`
Expected: FAIL — `Cannot find module './api'`

- [ ] **Step 3: src/api.ts 구현**

```ts
import type { Todo } from './types'

const BASE = '/api/todos'

export async function getTodos(): Promise<Todo[]> {
  const res = await fetch(BASE)
  return res.json()
}

export async function createTodo(title: string): Promise<Todo> {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  })
  if (!res.ok) throw new Error('failed to create todo')
  return res.json()
}

export async function updateTodo(
  id: string,
  patch: Partial<Pick<Todo, 'title' | 'completed'>>,
): Promise<Todo> {
  const res = await fetch(`${BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })
  if (!res.ok) throw new Error('failed to update todo')
  return res.json()
}

export async function deleteTodo(id: string): Promise<void> {
  const res = await fetch(`${BASE}/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('failed to delete todo')
}
```

- [ ] **Step 4: 테스트 실행하여 통과 확인**

Run: `npx vitest run src/api.test.ts`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/api.ts src/api.test.ts
git commit -m "feat: todo API 클라이언트"
```

---

### Task 5: UI 컴포넌트 (추가/수정/삭제/완료 체크/필터)

**Files:**
- Create: `src/components/TodoForm.tsx`
- Create: `src/components/TodoItem.tsx`
- Create: `src/components/TodoList.tsx`
- Create: `src/components/FilterBar.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.css`
- Test: `src/App.test.tsx`

**Interfaces:**
- Consumes: `src/api.ts`의 `getTodos`, `createTodo`, `updateTodo`, `deleteTodo` (Task 4)
- Produces: 렌더링된 Todo 앱 UI (하위 태스크 없음, 최종 UI 레이어)

- [ ] **Step 1: 실패하는 테스트 작성 — 필터 분기 로직만 검증 (src/App.test.tsx)**

```tsx
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { setupServer } from 'msw/node'
import { handlers } from './mocks/handlers'
import { seedIfEmpty } from './mocks/db'
import App from './App'

const server = setupServer(...handlers)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

beforeEach(() => {
  localStorage.clear()
  seedIfEmpty([
    { id: '1', title: '완료된 일', completed: true, createdAt: '2026-01-01T00:00:00.000Z' },
    { id: '2', title: '미완료 일', completed: false, createdAt: '2026-01-01T00:00:00.000Z' },
  ])
})

describe('필터', () => {
  it('완료 필터를 누르면 완료된 항목만 보인다', async () => {
    render(<App />)
    await waitFor(() => screen.getByText('완료된 일'))

    fireEvent.click(screen.getByText('완료'))

    expect(screen.getByText('완료된 일')).toBeInTheDocument()
    expect(screen.queryByText('미완료 일')).not.toBeInTheDocument()
  })

  it('미완료 필터를 누르면 미완료 항목만 보인다', async () => {
    render(<App />)
    await waitFor(() => screen.getByText('완료된 일'))

    fireEvent.click(screen.getByText('미완료'))

    expect(screen.queryByText('완료된 일')).not.toBeInTheDocument()
    expect(screen.getByText('미완료 일')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 테스트 실행하여 실패 확인**

Run: `npx vitest run src/App.test.tsx`
Expected: FAIL — 필터 버튼(`완료`, `미완료`)이 아직 존재하지 않음

- [ ] **Step 3: src/types.ts에 Filter 타입 추가 (Modify)**

```ts
export interface Todo {
  id: string
  title: string
  completed: boolean
  createdAt: string
}

export type Filter = 'all' | 'active' | 'completed'
```

- [ ] **Step 4: src/components/FilterBar.tsx 작성**

```tsx
import type { Filter } from '../types'

interface Props {
  value: Filter
  onChange: (filter: Filter) => void
}

const OPTIONS: { value: Filter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'active', label: '미완료' },
  { value: 'completed', label: '완료' },
]

function FilterBar({ value, onChange }: Props) {
  return (
    <div className="filter-bar">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          className={opt.value === value ? 'active' : ''}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export default FilterBar
```

- [ ] **Step 5: src/components/TodoForm.tsx 작성**

```tsx
import { useState } from 'react'
import type { FormEvent } from 'react'

interface Props {
  onAdd: (title: string) => void
}

function TodoForm({ onAdd }: Props) {
  const [title, setTitle] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    onAdd(title.trim())
    setTitle('')
  }

  return (
    <form onSubmit={handleSubmit} className="todo-form">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="할 일을 입력하세요"
      />
      <button type="submit">추가</button>
    </form>
  )
}

export default TodoForm
```

- [ ] **Step 6: src/components/TodoItem.tsx 작성**

```tsx
import { useState } from 'react'
import type { Todo } from '../types'

interface Props {
  todo: Todo
  onToggle: (id: string, completed: boolean) => void
  onEdit: (id: string, title: string) => void
  onDelete: (id: string) => void
}

function TodoItem({ todo, onToggle, onEdit, onDelete }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(todo.title)

  function handleEditSubmit() {
    if (draft.trim()) onEdit(todo.id, draft.trim())
    setEditing(false)
  }

  return (
    <li className="todo-item">
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={(e) => onToggle(todo.id, e.target.checked)}
      />
      {editing ? (
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleEditSubmit}
          onKeyDown={(e) => e.key === 'Enter' && handleEditSubmit()}
          autoFocus
        />
      ) : (
        <span
          className={todo.completed ? 'completed' : ''}
          onDoubleClick={() => setEditing(true)}
        >
          {todo.title}
        </span>
      )}
      <button onClick={() => onDelete(todo.id)}>삭제</button>
    </li>
  )
}

export default TodoItem
```

- [ ] **Step 7: src/components/TodoList.tsx 작성**

```tsx
import type { Todo } from '../types'
import TodoItem from './TodoItem'

interface Props {
  todos: Todo[]
  onToggle: (id: string, completed: boolean) => void
  onEdit: (id: string, title: string) => void
  onDelete: (id: string) => void
}

function TodoList({ todos, onToggle, onEdit, onDelete }: Props) {
  return (
    <ul className="todo-list">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </ul>
  )
}

export default TodoList
```

- [ ] **Step 8: src/App.tsx 구현 (전체 조립)**

```tsx
import { useEffect, useState } from 'react'
import type { Filter, Todo } from './types'
import { getTodos, createTodo, updateTodo, deleteTodo } from './api'
import TodoForm from './components/TodoForm'
import TodoList from './components/TodoList'
import FilterBar from './components/FilterBar'
import './App.css'

function App() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [filter, setFilter] = useState<Filter>('all')

  useEffect(() => {
    getTodos().then(setTodos)
  }, [])

  async function handleAdd(title: string) {
    const todo = await createTodo(title)
    setTodos((prev) => [...prev, todo])
  }

  async function handleToggle(id: string, completed: boolean) {
    const updated = await updateTodo(id, { completed })
    setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)))
  }

  async function handleEdit(id: string, title: string) {
    const updated = await updateTodo(id, { title })
    setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)))
  }

  async function handleDelete(id: string) {
    await deleteTodo(id)
    setTodos((prev) => prev.filter((t) => t.id !== id))
  }

  const visibleTodos = todos.filter((t) => {
    if (filter === 'active') return !t.completed
    if (filter === 'completed') return t.completed
    return true
  })

  return (
    <div className="app">
      <h1>Todo</h1>
      <TodoForm onAdd={handleAdd} />
      <FilterBar value={filter} onChange={setFilter} />
      <TodoList
        todos={visibleTodos}
        onToggle={handleToggle}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  )
}

export default App
```

- [ ] **Step 9: src/App.css 스타일 추가 (Modify)**

```css
.app {
  max-width: 480px;
  margin: 40px auto;
  padding: 0 16px;
}

.todo-form {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.todo-form input {
  flex: 1;
}

.filter-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.filter-bar button.active {
  font-weight: bold;
  text-decoration: underline;
}

.todo-list {
  list-style: none;
  padding: 0;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}

.todo-item .completed {
  text-decoration: line-through;
  color: #888;
}
```

- [ ] **Step 10: 테스트 실행하여 통과 확인**

Run: `npx vitest run src/App.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 11: 전체 테스트 스위트 실행**

Run: `npm run test`
Expected: 모든 테스트 PASS (db.test.ts, handlers.test.ts, api.test.ts, App.test.tsx)

- [ ] **Step 12: devDependencies 최종 확인 (package.json에 @testing-library/react 반영됐는지)**

Run: `npm ls @testing-library/react`
Expected: 버전 출력됨 (Task 1에서 이미 devDependencies에 포함)

- [ ] **Step 13: Commit**

```bash
git add src/components src/App.tsx src/App.css src/App.test.tsx src/types.ts
git commit -m "feat: Todo CRUD UI 컴포넌트 (추가/수정/삭제/완료체크/필터)"
```

---

### Task 6: GitHub Pages 배포 (GitHub Actions)

**Files:**
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- Consumes: Task 1의 `npm run build` 산출물(`dist/`)
- Produces: `main` 브랜치 push 시 자동으로 GitHub Pages에 배포되는 워크플로우

- [ ] **Step 1: .github/workflows/deploy.yml 작성**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 2: 로컬 빌드로 base 경로 확인**

Run: `npm run build && grep todo-list dist/index.html`
Expected: `/todo-list/assets/...` 형태의 경로가 출력됨

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "ci: GitHub Pages 자동 배포 워크플로우"
```

- [ ] **Step 4: push 후 GitHub 저장소 설정 확인 (수동)**

Push 후 `github.com/beginner-driver/todo-list` → Settings → Pages → Source를 **GitHub Actions**로 설정 (최초 1회만 수동 설정 필요). 이후 `main` push마다 자동 배포됨.

---

## Self-Review 요약

- **스펙 커버리지**: PRD의 조회/추가/수정/삭제/완료체크/필터/영속성(Task 2,3,4,5), Mock API 엔드포인트 4종(Task 3), 에러 처리 404/400(Task 3), 배포(Task 6) 모두 태스크로 매핑됨
- **타입 일관성**: `Todo`, `Filter` 타입과 `getAll/create/update/remove`, `getTodos/createTodo/updateTodo/deleteTodo` 함수 시그니처가 태스크 전체에서 동일하게 사용됨
- **플레이스홀더 없음**: 모든 스텝에 실제 코드/명령어 포함
