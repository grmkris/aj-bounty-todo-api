import { Hono } from 'hono'

export interface Todo {
  id: number
  title: string
  done: boolean
}

const MAX_TITLE = 200

/** A trimmed, valid title, or the error message to return with a 400. */
function parseTitle(value: unknown): { title: string } | { error: string } {
  if (typeof value !== 'string' || value.trim() === '') return { error: 'title is required' }
  const title = value.trim()
  if (title.length > MAX_TITLE) return { error: `title must be at most ${MAX_TITLE} characters` }
  return { title }
}

/** The JSON object body, or an empty object when it is missing or malformed. */
async function readBody(req: Request): Promise<Record<string, unknown>> {
  try {
    const body: unknown = await req.json()
    return body && typeof body === 'object' && !Array.isArray(body) ? (body as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

/** A fresh app with its own store (tests create one each). */
export function createApp() {
  const todos: Todo[] = []
  let nextId = 1
  const app = new Hono()

  const find = (id: string) => todos.findIndex((t) => String(t.id) === id)

  app.get('/todos', (c) => {
    const done = c.req.query('done')
    if (done === undefined) return c.json(todos)
    if (done !== 'true' && done !== 'false') return c.json({ error: 'done must be true or false' }, 400)
    return c.json(todos.filter((t) => t.done === (done === 'true')))
  })

  app.post('/todos', async (c) => {
    const body = await readBody(c.req.raw)
    const parsed = parseTitle(body.title)
    if ('error' in parsed) return c.json({ error: parsed.error }, 400)
    const todo: Todo = { id: nextId++, title: parsed.title, done: false }
    todos.push(todo)
    return c.json(todo, 201)
  })

  app.patch('/todos/:id', async (c) => {
    const index = find(c.req.param('id'))
    if (index === -1) return c.json({ error: 'not found' }, 404)
    const body = await readBody(c.req.raw)
    const todo = todos[index]!
    const next = { ...todo }
    if ('title' in body) {
      const parsed = parseTitle(body.title)
      if ('error' in parsed) return c.json({ error: parsed.error }, 400)
      next.title = parsed.title
    }
    if ('done' in body) {
      if (typeof body.done !== 'boolean') return c.json({ error: 'done must be a boolean' }, 400)
      next.done = body.done
    }
    todos[index] = next
    return c.json(next)
  })

  app.delete('/todos/:id', (c) => {
    const index = find(c.req.param('id'))
    if (index === -1) return c.json({ error: 'not found' }, 404)
    todos.splice(index, 1)
    return c.body(null, 204)
  })

  return app
}
