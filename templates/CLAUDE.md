# {{PROJECT_NAME}} - Global Agent Instructions
# @config PROJECT_NAME: ← [required] name of this project

---

## Project Identity

<!-- @annotation: 2-3 sentences. What the app does, core stack, why it's a monorepo. -->

---

## Repo Structure

<!-- @annotation: Update tree to match your layout. Default assumes client + backend. -->

```
{{PROJECT_ROOT}}/
├── .git
├── CLAUDE.md                 ← this file (global, always auto-loaded)
├── CONTRACTS.md              ← shared types and enums (single source of truth)
│
├── shared/
│   ├── types/
│   ├── enums/
│   └── agents/
│       └── SECURITY.md       # @agent - cross-cutting, invoke from any worktree
│
├── backend/                  # @project - remove or rename if not applicable
│   ├── CLAUDE.md             ← auto-loaded when in backend/ worktree
│   └── agents/
│       ├── API.md            # @agent
│       ├── LOGIC.md          # @agent
│       ├── AUTH.md           # @agent
│       ├── DB.md             # @agent
│       ├── EVENTS.md         # @agent
│       ├── JOBS.md           # @agent
│       └── TESTING.md        # @agent
│
├── client/                   # @project - remove or rename if not applicable
│   ├── CLAUDE.md             ← auto-loaded when in client/ worktree
│   └── agents/
│       ├── UI.md             # @agent
│       ├── LOGIC.md          # @agent
│       ├── FORMS.md          # @agent
│       ├── ROUTING.md        # @agent
│       ├── TESTING.md        # @agent
│       └── ACCESSIBILITY.md  # @agent
│
└── worktrees/                ← sibling worktree checkouts - never commit this folder
```

---

## Worktree & Agent Model

Each agent runs in its own Git Worktree on a dedicated branch.
Agents never share a working directory.

**Branch naming:**
```
agent/<project>/<scope>
```

**Creating a worktree:**
Run this from the repo root before starting any agent task:
```
git worktree add worktrees/<project>-<scope> -b agent/<project>/<scope>
```

Examples:
```
git worktree add worktrees/client-ui -b agent/client/ui
git worktree add worktrees/backend-api -b agent/backend/api
git worktree add worktrees/backend-auth -b agent/backend/auth
```

Then open Claude Code inside the created worktree folder.
The `worktrees/` folder is local only - listed in `.gitignore`, never committed.

**Context loads in this order:**
1. Root `CLAUDE.md` - always auto-loaded
2. `<project>/CLAUDE.md` - auto-loaded per worktree
3. `agents/<NAME>.md` - manually referenced per prompt

> Prompts stay thin. Agent files carry all behavioral detail.
> Example: `Use agents/UI.md. Task: build the activity table component.`

---

## CONTRACTS.md Protocol

Single source of truth for all types and enums shared across projects.
Never duplicated inside any project folder.

- Any agent may **read** `CONTRACTS.md` and `shared/` freely
- No agent may **write** to either unilaterally
- To propose a change, the agent must stop and surface:

```
## CONTRACTS CHANGE PROPOSAL
Agent     : <agent name>
File      : CONTRACTS.md or shared/<path>
Change    : <what is being added, modified, or removed>
Reason    : <why this change is needed>
Impact    : <which other agents or projects are affected>
```

Awaits explicit human approval before proceeding.

<!-- @annotation: Default ratification is human-only. Update if your workflow differs. -->

---

## Coordination Rules

1. **Domain isolation** - each agent writes only within its assigned project folder.
2. **Shared is read-only** - no writes to `shared/` without a ratified proposal.
3. **No cross-domain assumptions** - use `CONTRACTS.md` as the handshake between agents.
4. **One branch per agent** - branch = agent + task scope. Never reuse.
5. **worktrees/ is not committed** - add to `.gitignore`.

<!-- @annotation: Add project-specific coordination rules here if needed. -->

---

## Safety Rules

- **Never delete or overwrite** `CONTRACTS.md`, `shared/`, or another agent's files
- **Never commit directly** to `main` or any protected branch
- **Never skip the proposal step** when a contract change is required
- **Stop and flag** any task that requires touching another agent's domain

---

## Session Start

This section fires at the start of every new Claude Code session.
Regardless of what the user types first - even a single word or greeting -
the agent must:

1. Check if `TASK.md` exists in the current directory
2. If yes - read it immediately and begin executing the task defined inside it
3. If no - inform the user that no task is defined and ask them to run:
   `node .workflow/launch.js` from the repo root

Do not wait for explicit instructions to read `TASK.md`.
The presence of `TASK.md` in the worktree is the instruction.

## Autonomy Rules

When executing a task from `TASK.md`, operate in fully autonomous mode:

- **New files only** - proceed without asking for confirmation
- **Modifying existing files** - confirm before proceeding
- **Deleting files** - always confirm before proceeding
- **Do not stop** to ask for plan confirmation unless a destructive action is detected
- **Do not interrupt** the agentic flow with clarifying questions unless the task
  is genuinely ambiguous after reading all available context files