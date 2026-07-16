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
