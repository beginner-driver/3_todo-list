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
