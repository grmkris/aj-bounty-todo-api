import { Hono } from 'hono'

export interface Todo {
  id: number
  title: string
  done: boolean
}

/** A fresh app with its own store (tests create one each). */
export function createApp() {
  const todos: Todo[] = []
  let nextId = 1
  const app = new Hono()

  app.get('/todos', (c) => c.json(todos))

  app.post('/todos', async (c) => {
    const body = await c.req.json<{ title?: string }>()
    const todo: Todo = { id: nextId++, title: String(body.title), done: false }
    todos.push(todo)
    return c.json(todo, 201)
  })

  return app
}
