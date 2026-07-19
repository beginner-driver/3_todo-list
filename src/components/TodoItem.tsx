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
