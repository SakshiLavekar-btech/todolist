// ==========================================================
// Ledger — app.js
// Direct Access Version
// No Login / No Signup / No Logout
// ==========================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';


// ==========================================================
// Supabase
// ==========================================================

const SUPABASE_URL =
  'https://wumktcntbmktevoizxxo.supabase.co';

const SUPABASE_ANON_KEY =
  'sb_publishable_-Pb9cApuUuky_Elc-MOZAQ_inEnch7B';

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);


// ==========================================================
// State
// ==========================================================

let tasks = [];

let statusFilter = 'all';
// all | active | completed

let priorityFilter = 'all';
// all | high | medium | low

let searchQuery = '';


// ==========================================================
// DOM references
// ==========================================================

const appShell = document.getElementById('app-shell');

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

const priorityFilterList =
  document.getElementById('priority-filter-list');

const themeToggle =
  document.getElementById('theme-toggle');

const sunIcon =
  document.getElementById('theme-icon-sun');

const moonIcon =
  document.getElementById('theme-icon-moon');

const toastEl =
  document.getElementById('toast');


// ==========================================================
// Make sure app is visible
// ==========================================================

if (appShell) {
  appShell.classList.remove('hidden');
}


// ==========================================================
// Load tasks
// ==========================================================

async function loadTasks() {

  try {

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('completed', {
        ascending: true
      })
      .order('due_date', {
        ascending: true,
        nullsFirst: false
      })
      .order('created_at', {
        ascending: false
      });


    if (error) {

      console.error('Load tasks error:', error);

      showToast(
        'Could not load tasks: ' + error.message
      );

      return;
    }


    tasks = data || [];

    render();

  } catch (error) {

    console.error('Fetch error:', error);

    showToast(
      'Failed to fetch. Check Supabase URL/key and database settings.'
    );
  }
}


// ==========================================================
// Add / Edit task
// ==========================================================

taskForm.addEventListener(
  'submit',
  async (e) => {

    e.preventDefault();


    const title =
      taskTitleInput.value.trim();


    if (!title) {
      return;
    }


    const priority =
      taskPriorityInput.value;


    const due_date =
      taskDueInput.value || null;


    const editId =
      taskEditIdInput.value;


    // ======================================================
    // EDIT
    // ======================================================

    if (editId) {

      const { error } = await supabase
        .from('tasks')
        .update({
          title: title,
          priority: priority,
          due_date: due_date
        })
        .eq('id', editId);


      if (error) {

        console.error('Update error:', error);

        showToast(
          'Update failed: ' + error.message
        );

        return;
      }


      showToast('Entry updated');

      exitEditMode();

    }


    // ======================================================
    // ADD
    // ======================================================

    else {

      // IMPORTANT:
      // No user_id here.
      // Authentication has been removed.

      const { error } = await supabase
        .from('tasks')
        .insert({
          title: title,
          priority: priority,
          due_date: due_date,
          completed: false
        });


      if (error) {

        console.error('Insert error:', error);

        showToast(
          'Add failed: ' + error.message
        );

        return;
      }


      showToast('Entry added');
    }


    taskForm.reset();

    taskPriorityInput.value = 'medium';

    taskEditIdInput.value = '';

    taskForm.querySelector(
      '.btn-primary'
    ).textContent = 'Add';


    await loadTasks();

  }
);


// ==========================================================
// Complete / Uncomplete
// ==========================================================

async function toggleComplete(task) {

  const { error } = await supabase
    .from('tasks')
    .update({
      completed: !task.completed
    })
    .eq('id', task.id);


  if (error) {

    console.error('Complete error:', error);

    showToast(
      'Could not update: ' + error.message
    );

    return;
  }


  await loadTasks();
}


// ==========================================================
// Delete task
// ==========================================================

async function deleteTask(task) {

  if (
    !confirm(
      'Delete "' +
      task.title +
      '"? This cannot be undone.'
    )
  ) {
    return;
  }


  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', task.id);


  if (error) {

    console.error('Delete error:', error);

    showToast(
      'Delete failed: ' + error.message
    );

    return;
  }


  showToast('Entry deleted');

  await loadTasks();
}


// ==========================================================
// Edit mode
// ==========================================================

function enterEditMode(task) {

  taskTitleInput.value =
    task.title;

  taskPriorityInput.value =
    task.priority;

  taskDueInput.value =
    task.due_date || '';

  taskEditIdInput.value =
    task.id;

  taskForm.querySelector(
    '.btn-primary'
  ).textContent = 'Save';

  taskTitleInput.focus();

  render();
}


function exitEditMode() {

  taskEditIdInput.value = '';

  taskForm.querySelector(
    '.btn-primary'
  ).textContent = 'Add';
}


// ==========================================================
// Status filters
// ==========================================================

document
  .querySelectorAll('[data-filter-status]')
  .forEach(btn => {

    btn.addEventListener(
      'click',
      () => {

        statusFilter =
          btn.dataset.filterStatus;


        document
          .querySelectorAll(
            '[data-filter-status]'
          )
          .forEach(b => {

            b.classList.remove('active');

          });


        btn.classList.add('active');

        render();
      }
    );

  });


// ==========================================================
// Search
// ==========================================================

searchInput.addEventListener(
  'input',
  () => {

    searchQuery =
      searchInput.value
        .trim()
        .toLowerCase();

    render();

  }
);


// ==========================================================
// Priority filters
// ==========================================================

function buildPriorityFilters() {

  const levels = [

    {
      key: 'all',
      label: 'Every priority'
    },

    {
      key: 'high',
      label: 'High'
    },

    {
      key: 'medium',
      label: 'Medium'
    },

    {
      key: 'low',
      label: 'Low'
    }

  ];


  priorityFilterList.innerHTML = '';


  levels.forEach(level => {

    const btn =
      document.createElement('button');


    btn.className =
      'filter-item' +
      (
        priorityFilter === level.key
          ? ' active'
          : ''
      );


    if (level.key !== 'all') {

      const dot =
        document.createElement('span');

      dot.className =
        'dot ' + level.key;

      btn.appendChild(dot);
    }


    const label =
      document.createElement('span');

    label.textContent =
      level.label;

    btn.appendChild(label);


    btn.addEventListener(
      'click',
      () => {

        priorityFilter =
          level.key;

        render();

      }
    );


    priorityFilterList.appendChild(btn);

  });
}


// ==========================================================
// Filter tasks
// ==========================================================

function getFilteredTasks() {

  return tasks.filter(task => {

    if (
      statusFilter === 'active' &&
      task.completed
    ) {
      return false;
    }


    if (
      statusFilter === 'completed' &&
      !task.completed
    ) {
      return false;
    }


    if (
      priorityFilter !== 'all' &&
      task.priority !== priorityFilter
    ) {
      return false;
    }


    if (
      searchQuery &&
      !task.title
        .toLowerCase()
        .includes(searchQuery)
    ) {
      return false;
    }


    return true;

  });
}


// ==========================================================
// Date formatting
// ==========================================================

function formatDue(dateStr) {

  if (!dateStr) {
    return null;
  }


  const d =
    new Date(
      dateStr + 'T00:00:00'
    );


  return d.toLocaleDateString(
    undefined,
    {
      month: 'short',
      day: 'numeric'
    }
  );
}


// ==========================================================
// Overdue
// ==========================================================

function isOverdue(task) {

  if (
    !task.due_date ||
    task.completed
  ) {
    return false;
  }


  const today =
    new Date();

  today.setHours(
    0,
    0,
    0,
    0
  );


  return (
    new Date(
      task.due_date + 'T00:00:00'
    ) < today
  );
}


// ==========================================================
// Render
// ==========================================================

function render() {

  buildPriorityFilters();


  // Counts

  countAll.textContent =
    tasks.length;


  countActive.textContent =
    tasks.filter(
      task => !task.completed
    ).length;


  countCompleted.textContent =
    tasks.filter(
      task => task.completed
    ).length;


  const filtered =
    getFilteredTasks();


  // Title

  const titles = {

    all: 'All tasks',

    active: 'Active',

    completed: 'Completed'

  };


  listTitle.textContent =
    titles[statusFilter];


  listSub.textContent =
    filtered.length +
    (
      filtered.length === 1
        ? ' entry'
        : ' entries'
    );


  // Clear list

  taskListEl.innerHTML = '';


  emptyState.classList.toggle(
    'hidden',
    filtered.length !== 0
  );


  // Create rows

  filtered.forEach(task => {

    const li =
      document.createElement('li');


    li.className =
      'task-row' +
      (
        task.completed
          ? ' completed'
          : ''
      ) +
      (
        taskEditIdInput.value === task.id
          ? ' editing'
          : ''
      );


    li.dataset.priority =
      task.priority;


    // ======================================================
    // Complete button
    // ======================================================

    const stamp =
      document.createElement('button');


    stamp.className =
      'stamp';


    stamp.setAttribute(
      'aria-label',
      'Toggle complete'
    );


    stamp.innerHTML = `
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polyline points="4 12 9 17 20 6"/>
      </svg>
    `;


    stamp.addEventListener(
      'click',
      () => toggleComplete(task)
    );


    // ======================================================
    // Body
    // ======================================================

    const body =
      document.createElement('div');


    body.className =
      'task-body';


    const titleLine =
      document.createElement('div');


    titleLine.className =
      'task-title-line';


    const titleText =
      document.createElement('span');


    titleText.className =
      'task-title-text';


    titleText.textContent =
      task.title;


    const tag =
      document.createElement('span');


    tag.className =
      'priority-tag ' +
      task.priority;


    tag.textContent =
      task.priority;


    titleLine.appendChild(
      titleText
    );


    titleLine.appendChild(
      tag
    );


    const meta =
      document.createElement('div');


    meta.className =
      'task-meta' +
      (
        isOverdue(task)
          ? ' overdue'
          : ''
      );


    const dueLabel =
      formatDue(
        task.due_date
      );


    meta.textContent =
      dueLabel
        ? (
            isOverdue(task)
              ? 'Overdue · ' + dueLabel
              : 'Due ' + dueLabel
          )
        : 'No due date';


    body.appendChild(
      titleLine
    );


    body.appendChild(
      meta
    );


    // ======================================================
    // Actions
    // ======================================================

    const actions =
      document.createElement('div');


    actions.className =
      'task-actions';


    // Edit

    const editBtn =
      document.createElement('button');


    editBtn.setAttribute(
      'aria-label',
      'Edit'
    );


    editBtn.innerHTML = `
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
      >
        <path d="M12 20h9"/>
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>
      </svg>
    `;


    editBtn.addEventListener(
      'click',
      () => enterEditMode(task)
    );


    // Delete

    const delBtn =
      document.createElement('button');


    delBtn.setAttribute(
      'aria-label',
      'Delete'
    );


    delBtn.innerHTML = `
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
      >
        <path d="M3 6h18"/>
        <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      </svg>
    `;


    delBtn.addEventListener(
      'click',
      () => deleteTask(task)
    );


    actions.appendChild(
      editBtn
    );


    actions.appendChild(
      delBtn
    );


    // ======================================================
    // Assemble
    // ======================================================

    li.appendChild(
      stamp
    );


    li.appendChild(
      body
    );


    li.appendChild(
      actions
    );


    taskListEl.appendChild(
      li
    );

  });

}


// ==========================================================
// Dark mode
// ==========================================================

function applyTheme(theme) {

  document.documentElement
    .setAttribute(
      'data-theme',
      theme
    );


  sunIcon.classList.toggle(
    'hidden',
    theme === 'dark'
  );


  moonIcon.classList.toggle(
    'hidden',
    theme !== 'dark'
  );


  localStorage.setItem(
    'ledger-theme',
    theme
  );
}


themeToggle.addEventListener(
  'click',
  () => {

    const current =
      document.documentElement
        .getAttribute('data-theme') ||
      'light';


    applyTheme(
      current === 'dark'
        ? 'light'
        : 'dark'
    );

  }
);


// Initial theme

(function initTheme() {

  const saved =
    localStorage.getItem(
      'ledger-theme'
    );


  const prefersDark =
    window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches;


  applyTheme(
    saved ||
    (
      prefersDark
        ? 'dark'
        : 'light'
    )
  );

})();


// ==========================================================
// Toast
// ==========================================================

let toastTimer = null;


function showToast(message) {

  toastEl.textContent =
    message;


  toastEl.classList.remove(
    'hidden'
  );


  clearTimeout(
    toastTimer
  );


  toastTimer =
    setTimeout(
      () => {
        toastEl.classList.add(
          'hidden'
        );
      },
      2600
    );
}


// ==========================================================
// Start application
// ==========================================================

loadTasks();
