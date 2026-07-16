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
