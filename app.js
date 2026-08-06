// ==========================================================
// Ledger — app.js
// ==========================================================
// 1. Fill in your Supabase project URL and anon key below.
//    Find them in Supabase Dashboard → Project Settings → API.
// ==========================================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'YOUR_SUPABASE_PROJECT_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---------- State ----------
let currentUser = null;
let tasks = [];
let statusFilter = 'all';      // all | active | completed
let priorityFilter = 'all';    // all | high | medium | low
let searchQuery = '';

// ---------- DOM refs ----------
const authScreen = document.getElementById('auth-screen');
const appShell = document.getElementById('app-shell');

const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const loginError = document.getElementById('login-error');
const signupError = document.getElementById('signup-error');
const signupNote = document.getElementById('signup-note');

const userEmailEl = document.getElementById('user-email');
const logoutBtn = document.getElementById('logout-btn');

const taskForm = document.getElementById('task-form');
const taskTitleInput = document.getElementById('task-title');
const taskPriorityInput = document.getElementById('task-priority');
const taskDueInput = document.getElementById('task-due');
const taskEditIdInput = document.getElementById('task-edit-id');

const taskListEl = document.getElementById('task-list');
const emptyState = document.getElementById('empty-state');
const searchInput = document.getElementById('search-input');

const listTitle = document.getElementById('list-title');
const listSub = document.getElementById('list-sub');

const countAll = document.getElementById('count-all');
const countActive = document.getElementById('count-active');
const countCompleted = document.getElementById('count-completed');
const priorityFilterList = document.getElementById('priority-filter-list');

const themeToggle = document.getElementById('theme-toggle');
const sunIcon = document.getElementById('theme-icon-sun');
const moonIcon = document.getElementById('theme-icon-moon');

const toastEl = document.getElementById('toast');

// ==========================================================
// Auth tabs (login / signup)
// ==========================================================
document.querySelectorAll('.auth-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    const target = tab.dataset.tab;
    loginForm.classList.toggle('hidden', target !== 'login');
    signupForm.classList.toggle('hidden', target !== 'signup');
    loginError.textContent = '';
    signupError.textContent = '';
    signupNote.textContent = '';
  });
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.textContent = '';
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) loginError.textContent = error.message;
});

signupForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  signupError.textContent = '';
  signupNote.textContent = '';
  const email = document.getElementById('signup-email').value.trim();
  const password = document.getElementById('signup-password').value;
  const { error } = await supabase.auth.signUp({ email, password });
  if (error) {
    signupError.textContent = error.message;
  } else {
    signupNote.textContent = 'Account created. Check your inbox to confirm your email, then log in.';
    signupForm.reset();
  }
});

logoutBtn.addEventListener('click', async () => {
  await supabase.auth.signOut();
});

// ==========================================================
// Session handling
// ==========================================================
supabase.auth.onAuthStateChange((_event, session) => {
  handleSession(session);
});

async function init() {
  const { data: { session } } = await supabase.auth.getSession();
  handleSession(session);
}

function handleSession(session) {
  if (session && session.user) {
    currentUser = session.user;
    authScreen.classList.add('hidden');
    appShell.classList.remove('hidden');
    userEmailEl.textContent = currentUser.email;
    loadTasks();
  } else {
    currentUser = null;
    tasks = [];
    appShell.classList.add('hidden');
    authScreen.classList.remove('hidden');
  }
}

// ==========================================================
// Task CRUD
// ==========================================================
async function loadTasks() {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('completed', { ascending: true })
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (error) {
    showToast('Could not load tasks: ' + error.message);
    return;
  }
  tasks = data || [];
  render();
}

taskForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = taskTitleInput.value.trim();
  if (!title) return;
  const priority = taskPriorityInput.value;
  const due_date = taskDueInput.value || null;
  const editId = taskEditIdInput.value;

  if (editId) {
    const { error } = await supabase
      .from('tasks')
      .update({ title, priority, due_date })
      .eq('id', editId);
    if (error) { showToast('Update failed: ' + error.message); return; }
    showToast('Entry updated');
    exitEditMode();
  } else {
    const { error } = await supabase
      .from('tasks')
      .insert({ title, priority, due_date, completed: false, user_id: currentUser.id });
    if (error) { showToast('Add failed: ' + error.message); return; }
    showToast('Entry added');
  }
  taskForm.reset();
  taskPriorityInput.value = 'medium';
  await loadTasks();
});

async function toggleComplete(task) {
  const { error } = await supabase
    .from('tasks')
    .update({ completed: !task.completed })
    .eq('id', task.id);
  if (error) { showToast('Could not update: ' + error.message); return; }
  await loadTasks();
}

async function deleteTask(task) {
  if (!confirm('Delete "' + task.title + '"? This cannot be undone.')) return;
  const { error } = await supabase.from('tasks').delete().eq('id', task.id);
  if (error) { showToast('Delete failed: ' + error.message); return; }
  showToast('Entry deleted');
  await loadTasks();
}

function enterEditMode(task) {
  taskTitleInput.value = task.title;
  taskPriorityInput.value = task.priority;
  taskDueInput.value = task.due_date || '';
  taskEditIdInput.value = task.id;
  taskTitleInput.focus();
  taskForm.querySelector('.btn-primary').textContent = 'Save';
  render();
}

function exitEditMode() {
  taskEditIdInput.value = '';
  taskForm.querySelector('.btn-primary').textContent = 'Add';
}

// ==========================================================
// Filters / search
// ==========================================================
document.querySelectorAll('[data-filter-status]').forEach(btn => {
  btn.addEventListener('click', () => {
    statusFilter = btn.dataset.filterStatus;
    document.querySelectorAll('[data-filter-status]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    render();
  });
});

searchInput.addEventListener('input', () => {
  searchQuery = searchInput.value.trim().toLowerCase();
  render();
});

function buildPriorityFilters() {
  const levels = [
    { key: 'all', label: 'Every priority' },
    { key: 'high', label: 'High' },
    { key: 'medium', label: 'Medium' },
    { key: 'low', label: 'Low' },
  ];
  priorityFilterList.innerHTML = '';
  levels.forEach(level => {
    const btn = document.createElement('button');
    btn.className = 'filter-item' + (priorityFilter === level.key ? ' active' : '');
    if (level.key !== 'all') {
      const dot = document.createElement('span');
      dot.className = 'dot ' + level.key;
      btn.appendChild(dot);
    }
    const label = document.createElement('span');
    label.textContent = level.label;
    btn.appendChild(label);
    btn.addEventListener('click', () => {
      priorityFilter = level.key;
      render();
    });
    priorityFilterList.appendChild(btn);
  });
}

// ==========================================================
// Rendering
// ==========================================================
function getFilteredTasks() {
  return tasks.filter(t => {
    if (statusFilter === 'active' && t.completed) return false;
    if (statusFilter === 'completed' && !t.completed) return false;
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery)) return false;
    return true;
  });
}

function formatDue(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function isOverdue(task) {
  if (!task.due_date || task.completed) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(task.due_date + 'T00:00:00') < today;
}

function render() {
  buildPriorityFilters();

  countAll.textContent = tasks.length;
  countActive.textContent = tasks.filter(t => !t.completed).length;
  countCompleted.textContent = tasks.filter(t => t.completed).length;

  const filtered = getFilteredTasks();

  const titles = { all: 'All tasks', active: 'Active', completed: 'Completed' };
  listTitle.textContent = titles[statusFilter];
  listSub.textContent = filtered.length + (filtered.length === 1 ? ' entry' : ' entries');

  taskListEl.innerHTML = '';
  emptyState.classList.toggle('hidden', filtered.length !== 0);

  filtered.forEach(task => {
    const li = document.createElement('li');
    li.className = 'task-row' + (task.completed ? ' completed' : '') + (taskEditIdInput.value === task.id ? ' editing' : '');
    li.dataset.priority = task.priority;

    const stamp = document.createElement('button');
    stamp.className = 'stamp';
    stamp.setAttribute('aria-label', 'Toggle complete');
    stamp.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 12 9 17 20 6"/></svg>';
    stamp.addEventListener('click', () => toggleComplete(task));

    const body = document.createElement('div');
    body.className = 'task-body';

    const titleLine = document.createElement('div');
    titleLine.className = 'task-title-line';
    const titleText = document.createElement('span');
    titleText.className = 'task-title-text';
    titleText.textContent = task.title;
    const tag = document.createElement('span');
    tag.className = 'priority-tag ' + task.priority;
    tag.textContent = task.priority;
    titleLine.appendChild(titleText);
    titleLine.appendChild(tag);

    const meta = document.createElement('div');
    meta.className = 'task-meta' + (isOverdue(task) ? ' overdue' : '');
    const dueLabel = formatDue(task.due_date);
    meta.textContent = dueLabel ? (isOverdue(task) ? 'Overdue · ' + dueLabel : 'Due ' + dueLabel) : 'No due date';

    body.appendChild(titleLine);
    body.appendChild(meta);

    const actions = document.createElement('div');
    actions.className = 'task-actions';

    const editBtn = document.createElement('button');
    editBtn.setAttribute('aria-label', 'Edit');
    editBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';
    editBtn.addEventListener('click', () => enterEditMode(task));

    const delBtn = document.createElement('button');
    delBtn.setAttribute('aria-label', 'Delete');
    delBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>';
    delBtn.addEventListener('click', () => deleteTask(task));

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    li.appendChild(stamp);
    li.appendChild(body);
    li.appendChild(actions);
    taskListEl.appendChild(li);
  });
}

// ==========================================================
// Dark mode
// ==========================================================
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  sunIcon.classList.toggle('hidden', theme === 'dark');
  moonIcon.classList.toggle('hidden', theme !== 'dark');
  localStorage.setItem('ledger-theme', theme);
}

themeToggle.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  applyTheme(current === 'dark' ? 'light' : 'dark');
});

(function initTheme() {
  const saved = localStorage.getItem('ledger-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(saved || (prefersDark ? 'dark' : 'light'));
})();

// ==========================================================
// Toast
// ==========================================================
let toastTimer = null;
function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.add('hidden'), 2600);
}

// ==========================================================
// Go
// ==========================================================
init();
