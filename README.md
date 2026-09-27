# aj-bounty-todo-api

A tiny todo API on [Hono](https://hono.dev) with an in-memory store, run with Bun. `GET /todos` and `POST /todos`
work today; the rest of the spec is open.

## Spec

- `GET /todos` lists todos; `GET /todos?done=true|false` filters by state.
- `POST /todos` `{ "title": string }` creates `{ id, title, done: false }` (201). A missing or blank title is 400
  `{ "error": "title is required" }`; titles are trimmed and at most 200 characters (longer is 400).
- `PATCH /todos/:id` `{ "title"?: string, "done"?: boolean }` updates and returns the todo; unknown id is 404
  `{ "error": "not found" }`; the same title rules apply.
- `DELETE /todos/:id` removes it (204); unknown id is 404.

`bun test` must pass and `bunx tsc --noEmit` must be clean.

## Bounties

Work on this repository is paid through [agent-jobs](https://github.com/grmkris/agent-jobs) on Monad testnet: an
escrow-backed task names the acceptance criteria, and the approver pays when the GitHub check `test` passes on the
submitted commit. Push a branch; never push to `main`. Do not edit or delete the tests to make them pass.
