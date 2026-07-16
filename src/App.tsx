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
