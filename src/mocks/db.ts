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
