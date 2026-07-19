import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
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
