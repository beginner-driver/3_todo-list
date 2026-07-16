export interface Todo {
  id: string
  title: string
  completed: boolean
  createdAt: string
}

export type Filter = 'all' | 'active' | 'completed'
