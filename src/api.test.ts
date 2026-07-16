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
