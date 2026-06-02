#!/usr/bin/env node

/**
 * Multi-Agent Monorepo Template - Task Launcher
 * Run with: npm run launch
 *
 * Creates a Git Worktree, generates coordination files,
 * and opens your IDE automatically at the correct path.
 */

const readline     = require('readline');
const fs           = require('fs');
const path         = require('path');
const { execSync } = require('child_process');

// ── Colors ────────────────────────────────────────────────────────────────────

const c = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
  green:  '\x1b[32m',
  blue:   '\x1b[34m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
  red:    '\x1b[31m',
};

const bold   = (s) => `${c.bold}${s}${c.reset}`;
const green  = (s) => `${c.green}${s}${c.reset}`;
const yellow = (s) => `${c.yellow}${s}${c.reset}`;
const dim    = (s) => `${c.dim}${s}${c.reset}`;
const cyan   = (s) => `${c.cyan}${s}${c.reset}`;
const red    = (s) => `${c.red}${s}${c.reset}`;

// ── Paths ─────────────────────────────────────────────────────────────────────

const ROOT        = path.join(__dirname, '..');
const CONFIG_PATH = path.join(ROOT, '.scaffold', '.config.json');
const LOCK_PATH   = path.join(ROOT, '.scaffold', '.initialized');

// ── Guards ────────────────────────────────────────────────────────────────────

if (!fs.existsSync(LOCK_PATH)) {
  console.log(`\n${red('  Project not initialized.')}`);
  console.log(dim('  Run npm run init first.\n'));
  process.exit(1);
}

if (!fs.existsSync(CONFIG_PATH)) {
  console.log(`\n${red('  Missing .scaffold/.config.json.')}`);
  console.log(dim('  Run npm run init to regenerate.\n'));
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));

// ── Location guard ────────────────────────────────────────────────────────────

const normalizedCwd  = path.resolve(process.cwd());
const normalizedRoot = path.resolve(ROOT);

if (normalizedCwd !== normalizedRoot) {
  console.log(`\n${red('  Wrong location detected.')}`);
  console.log(dim(`  You are here : ${normalizedCwd}`));
  console.log(dim(`  Should be    : ${normalizedRoot}\n`));
  console.log(bold('  Run this to fix it and launch:'));
  console.log(cyan(`\n  cd "${normalizedRoot}" && npm run launch\n`));
  process.exit(1);
}

// ── IDE gate ──────────────────────────────────────────────────────────────────

if (!config.ide) {
  console.log(`\n${red('  IDE not configured.')}`);
  console.log(dim('  Run npm run init to configure your IDE preference.\n'));
  process.exit(1);
}

// ── Open IDE ──────────────────────────────────────────────────────────────────

const openIDE = (worktreePath) => {
  const { name, strategy, cmd, app, winPaths, linuxPaths } = config.ide;

  if (strategy === 'manual' || !strategy) return null;

  try {
    if (strategy === 'mac-app') {
      // Mac — open .app bundle directly, no CLI required
      execSync(`open -a "${app}" --args --new-window "${worktreePath}"`, { stdio: 'pipe' });

    } else if (strategy === 'win-exe') {
      // Windows — launch via resolved exe path
      const exe = (winPaths || []).find(p => fs.existsSync(p));
      if (!exe) return null;
      execSync(`start "" "${exe}" "${worktreePath}"`, { stdio: 'pipe' });

    } else if (strategy === 'linux-path') {
      // Linux — launch via resolved install path
      const bin = (linuxPaths || []).find(p => fs.existsSync(p));
      if (!bin) return null;
      execSync(`"${bin}" --new-window "${worktreePath}"`, { stdio: 'pipe' });

    } else {
      // cli strategy — CLI on PATH, platform-specific invocation
      const platform = process.platform;
      if (platform === 'win32') {
        execSync(`start "" "${cmd}" "${worktreePath}"`, { stdio: 'pipe' });
      } else {
        execSync(`"${cmd}" --new-window "${worktreePath}"`, { stdio: 'pipe' });
      }
    }

    return name;
  } catch {
    return null;
  }
};

// ── Agent map ─────────────────────────────────────────────────────────────────

const AGENTS = {
  client:  ['UI', 'LOGIC', 'FORMS', 'ROUTING', 'TESTING', 'ACCESSIBILITY'],
  backend: ['API', 'LOGIC', 'AUTH', 'DB', 'TESTING', 'EVENTS', 'JOBS'],
  shared:  ['SECURITY'],
};

const DOD_ITEMS = {
  UI:            ['All planned components exist and render correctly', 'No business logic inside components', 'All values derive from design tokens', 'Shared types consumed from CONTRACTS.md'],
  LOGIC:         ['All planned logic units exist and function correctly', 'No API calls outside the service layer', 'All response types from CONTRACTS.md', 'State and data fetching concerns separated'],
  FORMS:         ['All fields exist with correct validation rules', 'Error messages are clear and user-facing', 'Submission payload matches CONTRACTS.md', 'Double submission is prevented'],
  ROUTING:       ['All routes resolve to correct components', 'Every protected route declares its guard', 'All routes are lazy loaded unless justified', 'Route paths are centralized'],
  TESTING:       ['All planned test cases exist and pass', 'Happy path, edge cases, and failure states covered', 'Test data shapes from CONTRACTS.md', 'No implementation changes made'],
  ACCESSIBILITY: ['All audit findings resolved', 'Every interactive element keyboard reachable', 'Focus managed after dynamic content changes', 'Color contrast meets WCAG 2.1 AA'],
  API:           ['All endpoints exist with correct HTTP methods', 'DTOs own all input validation', 'All types in CONTRACTS.md', 'Every endpoint declares access control'],
  AUTH:          ['All strategies and guards function correctly', 'No secrets in code', 'All tokens have expiry set', 'Auth failures return consistent responses'],
  DB:            ['All entities and relationships defined', 'Migration generated and surfaced', 'Repository methods own all queries', 'No ORM auto-sync used'],
  EVENTS:        ['All emitters and handlers exist', 'Receivers acknowledge immediately', 'All handlers are idempotent', 'Failure handling defined'],
  JOBS:          ['All jobs exist with correct triggers', 'Schedule expressions from config', 'All jobs are idempotent', 'Failure strategy defined for every job'],
  SECURITY:      ['All findings documented with severity', 'Every finding has a remediation proposal', 'OWASP Top 10 coverage confirmed', 'No fixes implemented directly'],
};

// ── Readline ──────────────────────────────────────────────────────────────────

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ask = (question) =>
  new Promise((resolve) => rl.question(question, (a) => resolve(a.trim())));

const showList = (items) => {
  items.forEach((item, i) => {
    console.log(`  ${dim(`${i + 1}.`)} ${item}`);
  });
};

const selectRequired = async (prompt, items) => {
  while (true) {
    console.log(`\n${bold(prompt)}`);
    showList(items);
    const input = await ask(`\n  ${bold('Select')} ${dim(`(1-${items.length})`)}: `);
    const index = parseInt(input) - 1;
    if (!isNaN(index) && index >= 0 && index < items.length) return items[index];
    console.log(yellow(`  Please enter a number between 1 and ${items.length}.`));
  }
};

const separator = () => console.log(`\n${dim('─'.repeat(60))}`);

// ── File generators ───────────────────────────────────────────────────────────

const generateClaudeScope = ({ project, agent, branchName, worktreePath }) => {
  return `# .claude-scope
# Auto-generated by .workflow/launch.js
# This file identifies the scope of this worktree.
# Read this file at session start and verify scope before proceeding.

project      : ${project}
agent        : ${agent}
branch       : ${branchName}
worktree     : ${worktreePath}

## Scope Verification Rule
Before doing anything else, verify:
1. The loaded CLAUDE.md matches the project scope above
2. If opened at repo root instead of this worktree - hard stop:

   WRONG CONTEXT - CANNOT PROCEED
   This worktree is scoped to: ${project}/${agent}
   Close and reopen at: ${worktreePath}

3. Read TASK.md for the current task prompt
4. Reference the correct agent file: agents/${agent}.md
`;
};

const generateTaskMd = ({ project, agent, task, branchName }) => {
  const dod    = (DOD_ITEMS[agent] || []).map(item => `- [ ] ${item}`).join('\n');
  const prompt = project === 'shared'
    ? `Use shared/agents/${agent}.md. Task: ${task}`
    : `Use agents/${agent}.md. Task: ${task}`;

  return `# TASK - ${config.projectName}

## Scope
Project : ${project}
Agent   : ${agent}
Branch  : ${branchName}

## Execution Mode
AUTONOMOUS - Execute all subtasks without stopping for confirmation.
Only stop if a genuinely destructive action is detected (modifying or deleting existing files).
New file creation does not require confirmation.

## Task
${prompt}

## How to start
Open a NEW Claude Code chat window and type:

> Read TASK.md and execute the task.

Do NOT reuse a previous chat session for this task.

---

## When Complete
1. Commit your work to this branch:
   git add . && git commit -m "feat: <brief description of what was built>"

2. Mark status as COMPLETED above

3. Run complete.js (from anywhere — worktree terminal is fine):

\`\`\`
npm run complete
\`\`\`

This merges your work into main and updates BUILD_STATE.md.

---

## Definition of Done
${dod || '- [ ] Task completed as described above'}

---

## Status
- [ ] NOT STARTED
- [ ] IN PROGRESS
- [ ] COMPLETED

## Notes
<!-- Agent writes completion notes, decisions, and open questions here -->
`;
};

// ── Main ──────────────────────────────────────────────────────────────────────

const main = async () => {
  console.log('\n');
  console.log(bold(cyan('  Multi-Agent Monorepo Template')));
  console.log(dim(`  Task Launcher - ${config.projectName}\n`));
  separator();

  // ── Select scope ─────────────────────────────────────────────────────────────

  const scopeOptions = Object.keys(AGENTS);
  const project      = await selectRequired('* Project scope:', scopeOptions);

  // ── Select agent ─────────────────────────────────────────────────────────────

  const agentOptions = AGENTS[project];
  const agent        = await selectRequired(`* Agent (${project}):`, agentOptions);

  // ── Task description ──────────────────────────────────────────────────────────

  let task = '';
  while (!task) {
    task = await ask(`\n${bold('* Task description')}: `);
    if (!task) console.log(yellow('  Task description is required.'));
  }

  separator();

  // ── Confirm ───────────────────────────────────────────────────────────────────

  const timestamp    = Date.now();
  const sanitizedName = config.projectName.toLowerCase().replace(/\s+/g, '-');
  const worktreeName = `${project}-${sanitizedName}-${agent.toLowerCase()}-${timestamp}`;
  const branchName   = `agent/${project}/${agent.toLowerCase()}/${timestamp}`;
  const worktreePath = path.join(ROOT, 'worktrees', worktreeName);

  console.log(`\n${bold('Review:')}\n`);
  console.log(`  ${dim('Project')}  : ${green(project)}`);
  console.log(`  ${dim('Agent')}    : ${green(agent)}`);
  console.log(`  ${dim('Branch')}   : ${green(branchName)}`);
  console.log(`  ${dim('Worktree')} : ${green(`worktrees/${worktreeName}`)}`);
  console.log(`  ${dim('Task')}     : ${green(task)}`);
  console.log('');

  const confirm = await ask(`${bold('Confirm?')} ${dim('(y/n)')}: `);
  if (confirm.toLowerCase() !== 'y') {
    console.log(yellow('\n  Aborted.\n'));
    rl.close();
    return;
  }

  separator();
  console.log(`\n${bold('Setting up workspace...')}\n`);

  // ── Create worktree ───────────────────────────────────────────────────────────

  try {
    execSync(`git worktree add "${worktreePath}" -b ${branchName}`, {
      cwd: ROOT,
      stdio: 'pipe',
    });
    console.log(`  ${green('✓')} Worktree created: worktrees/${worktreeName}`);
  } catch (err) {
    console.log(`  ${yellow('!')} Worktree may already exist - continuing.`);
  }

  // ── Write .claude-scope ───────────────────────────────────────────────────────

  fs.writeFileSync(
    path.join(worktreePath, '.claude-scope'),
    generateClaudeScope({ project, agent, branchName, worktreePath }),
    'utf8'
  );
  console.log(`  ${green('✓')} .claude-scope written`);

  // ── Generate IDE settings ─────────────────────────────────────────────────────

  // Determine which folders to hide based on scope
  const excludedFolders = {
    'client':  ['backend/', 'worktrees/', '.scaffold/', '.workflow/'],
    'backend': ['client/', 'worktrees/', '.scaffold/', '.workflow/'],
    'shared':  ['client/', 'backend/', 'worktrees/', '.scaffold/', '.workflow/'],
  };
  const foldersToHide = excludedFolders[project] || [];

  // VS Code / Cursor — .vscode/settings.json
  const vscodeDir = path.join(worktreePath, '.vscode');
  fs.mkdirSync(vscodeDir, { recursive: true });
  const vscodeSettings = {
    'files.exclude': Object.fromEntries(foldersToHide.map(f => [f, true])),
    'explorer.excludeGitIgnore': true,
  };
  fs.writeFileSync(
    path.join(vscodeDir, 'settings.json'),
    JSON.stringify(vscodeSettings, null, 2),
    'utf8'
  );
  console.log(`  ${green('✓')} .vscode/settings.json generated (VS Code / Cursor)`);

  // WebStorm / IntelliJ — print manual instructions
  console.log(`  ${dim('!')} WebStorm/IntelliJ users — exclude these folders manually:`);
  foldersToHide.forEach(f => console.log(`     ${dim(`File → Settings → Directories → Excluded: ${f}`)}`));

  // ── Write TASK.md ─────────────────────────────────────────────────────────────

  fs.writeFileSync(
    path.join(worktreePath, 'TASK.md'),
    generateTaskMd({ project, agent, task, branchName }),
    'utf8'
  );
  console.log(`  ${green('✓')} TASK.md written`);

  // ── Update BUILD_STATE.md ─────────────────────────────────────────────────────

  const buildStatePath = path.join(ROOT, 'BUILD_STATE.md');
  if (fs.existsSync(buildStatePath)) {
    const date = new Date().toISOString().split('T')[0];
    const logEntry = `| ${date} | ${agent} | ${project} | ${task} | IN PROGRESS | ${branchName} |\n`;
    fs.appendFileSync(buildStatePath, logEntry, 'utf8');
    console.log(`  ${green('✓')} BUILD_STATE.md updated`);

    // Commit BUILD_STATE.md update to main so all worktrees can read it
    try {
      execSync('git add BUILD_STATE.md', { cwd: ROOT, stdio: 'pipe' });
      execSync(`git commit -m "build: ${agent} task started on ${project} [${branchName}]"`, { cwd: ROOT, stdio: 'pipe' });
      console.log(`  ${green('✓')} BUILD_STATE.md committed to main`);
    } catch (err) {
      console.log(`  ${yellow('!')} Could not commit BUILD_STATE.md — commit manually if needed`);
    }
  }

  // ── Open IDE ──────────────────────────────────────────────────────────────────

  const openedIDE = openIDE(worktreePath);
  if (openedIDE) {
    console.log(`  ${green('✓')} ${openedIDE} opened at worktrees/${worktreeName}`);
  } else {
    console.log(`  ${yellow('!')} Could not open IDE automatically.`);
    console.log(dim(`     Open manually at: ${worktreePath}`));
  }

  // ── Next steps ────────────────────────────────────────────────────────────────

  separator();
  console.log(`\n${bold(green('  Workspace ready!'))}\n`);
  console.log(`  ${bold('What to do next:')}\n`);
  console.log(`  ${bold('1.')} Your IDE should be open at: ${cyan(`worktrees/${worktreeName}`)}`);
  console.log(dim('     If not, open it manually at the path above.\n'));
  console.log(`  ${bold('2.')} Open a ${bold('NEW')} Claude Code chat window.`);
  console.log(dim('     Do NOT reuse a previous session.\n'));
  console.log(`  ${bold('3.')} In the chat, type:`);
  console.log(`     ${cyan('Read TASK.md and execute the task.')}\n`);
  console.log(`  ${bold('4.')} When the agent completes the task:`);
  console.log(dim('     Check off the Definition of Done items in TASK.md.'));
  console.log(dim('     Mark status as COMPLETED before starting the next task.\n'));
  separator();
  console.log('');

  rl.close();
};

main().catch((err) => {
  console.error('\n  Error:', err.message);
  process.exit(1);
});