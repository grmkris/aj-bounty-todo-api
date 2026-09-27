import { describe, expect, it } from 'bun:test'
import { createApp } from '../src/app.ts'

const send = (method: string, body: unknown) => ({ method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })

async function seeded() {
  const app = createApp()
  await app.request('/todos', send('POST', { title: 'write spec' }))
  await app.request('/todos', send('POST', { title: 'ship it' }))
  return app
}

describe('todos', () => {
  it('creates and lists', async () => {
    const app = await seeded()
    const res = await app.request('/todos')
    expect(await res.json()).toEqual([
      { id: 1, title: 'write spec', done: false },
      { id: 2, title: 'ship it', done: false },
    ])
  })

  it('trims titles and refuses blank or overlong ones', async () => {
    const app = createApp()
    const ok = await app.request('/todos', send('POST', { title: '  tidy  ' }))
    expect(ok.status).toBe(201)
    expect((await ok.json()).title).toBe('tidy')
    for (const bad of [{}, { title: '   ' }, { title: 'x'.repeat(201) }]) {
      const res = await app.request('/todos', send('POST', bad))
      expect(res.status).toBe(400)
    }
    const missing = await app.request('/todos', send('POST', {}))
    expect(await missing.json()).toEqual({ error: 'title is required' })
  })

  it('patches a todo', async () => {
    const app = await seeded()
    const res = await app.request('/todos/2', send('PATCH', { done: true }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ id: 2, title: 'ship it', done: true })
    const renamed = await app.request('/todos/1', send('PATCH', { title: ' spec v2 ' }))
    expect((await renamed.json()).title).toBe('spec v2')
    expect((await app.request('/todos/1', send('PATCH', { title: '' }))).status).toBe(400)
  })

  it('filters by done', async () => {
    const app = await seeded()
    await app.request('/todos/1', send('PATCH', { done: true }))
    expect((await (await app.request('/todos?done=true')).json()).map((t: { id: number }) => t.id)).toEqual([1])
    expect((await (await app.request('/todos?done=false')).json()).map((t: { id: number }) => t.id)).toEqual([2])
  })

  it('deletes a todo and 404s unknown ids', async () => {
    const app = await seeded()
    expect((await app.request('/todos/1', { method: 'DELETE' })).status).toBe(204)
    expect((await (await app.request('/todos')).json()).length).toBe(1)
    const gone = await app.request('/todos/1', { method: 'DELETE' })
    expect(gone.status).toBe(404)
    expect(await gone.json()).toEqual({ error: 'not found' })
    expect((await app.request('/todos/99', send('PATCH', {}))).status).toBe(404)
  })
})
