import { createApp } from './app.ts'

export default { port: Number(process.env.PORT ?? 3000), fetch: createApp().fetch }
