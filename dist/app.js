import { TodoStore } from './model.js';
let storage;
try { storage = window.localStorage; } catch { storage = {getItem(){return null;},setItem(){throw new Error('Unavailable');}}; }
const store = new TodoStore(storage);
const $ = s => document.querySelector(s);
const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let selected = 'all', filter = 'all', editing = null, noticeTimer;
const dateFormat = new Intl.DateTimeFormat(undefined, {month:'short', day:'numeric'});
const dateLabel = value => value ? dateFormat.format(new Date(value + 'T12:00:00')) : 'No date';
const todayKey = () => {const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
function notify(message) { clearTimeout(noticeTimer); $('#notice').textContent = message; $('#notice').classList.add('visible'); noticeTimer = setTimeout(() => $('#notice').classList.remove('visible'), 5000); }
function render() {
  const all = store.projects.flatMap(p => p.todos.map(t => ({...t, project:p})));
  const scoped = all.filter(t => selected === 'all' || t.project.id === selected);
  const done = scoped.filter(t => t.completed).length, percent = scoped.length ? Math.round(done/scoped.length*100) : 0;
  $('#all-count').textContent = all.filter(t => !t.completed).length;
  $('#all-tasks').classList.toggle('active', selected === 'all');
  $('#projects').innerHTML = store.projects.map((p,i) => `<button class="nav ${selected === p.id ? 'active' : ''}" data-project="${escape(p.id)}"><span class="project-dot dot-${i%4}"></span><span>${escape(p.name)}</span><b>${p.todos.filter(t => !t.completed).length}</b></button>`).join('');
  $('#page-title').innerHTML = `${escape(selected === 'all' ? 'All tasks' : store.project(selected).name)}<span>.</span>`;
  $('#subtitle').textContent = selected === 'all' ? 'A clear mind starts with a little clarity.' : 'A little space to move this project forward.';
  $('#total').textContent = scoped.length; $('#done').textContent = done; $('#remaining').textContent = scoped.length-done; $('#percent').textContent = `${percent}%`; $('#progress').value = percent;
  let visible = scoped.filter(t => (filter === 'all' || (filter === 'completed' ? t.completed : !t.completed)) && `${t.title} ${t.description} ${t.notes}`.toLowerCase().includes($('#search').value.toLowerCase()));
  if ($('#sort').value === 'date') visible.sort((a,b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999'));
  else if ($('#sort').value === 'priority') {const order = {high:0,medium:1,low:2}; visible.sort((a,b)=>order[a.priority]-order[b.priority]);}
  else visible.reverse();
  $('#tasks').innerHTML = visible.length ? visible.map(t => `<article class="task ${t.completed ? 'is-complete' : ''}"><input class="task-check" type="checkbox" ${t.completed ? 'checked' : ''} aria-label="Mark ${escape(t.title)} ${t.completed ? 'incomplete' : 'complete'}" data-toggle="${escape(t.id)}" data-parent="${escape(t.project.id)}"><button class="task-name" data-edit="${escape(t.id)}" data-parent="${escape(t.project.id)}"><strong>${escape(t.title)}</strong><small><span class="project-dot"></span>${escape(t.project.name)}${t.description ? ' <span class="separator">/</span> '+escape(t.description.slice(0,65)) : ''}</small></button><span class="task-date ${!t.completed && t.dueDate && t.dueDate < todayKey() ? 'overdue' : ''}">${t.dueDate === todayKey() ? 'Today' : dateLabel(t.dueDate)}</span><span class="priority ${t.priority}"><i></i>${t.priority}</span><button class="more" aria-label="Edit ${escape(t.title)}" data-edit="${escape(t.id)}" data-parent="${escape(t.project.id)}">⋯</button></article>`).join('') : `<div class="empty"><div class="empty-icon">${filter === 'completed' ? '✓' : '✧'}</div><h2>${$('#search').value ? 'No matching tasks' : filter === 'completed' ? 'Good things take small steps' : filter === 'active' && scoped.length ? 'A little breathing room' : 'Make room for what matters'}</h2><p>${$('#search').value ? 'Try a different search or filter.' : filter === 'completed' ? 'Your completed tasks will appear here.' : 'Add a task, clear your mind, and take it one step at a time.'}</p></div>`;
  document.querySelectorAll('[data-filter]').forEach(b => b.classList.toggle('selected', b.dataset.filter === filter));
  if (store.warning) notify(store.warning);
  $('.local-status').textContent = store.warning ? '◌ Session only · storage unavailable' : '◉ Saved on this device';
}
function openTask(projectId, id) {
  editing = id ? {projectId,id} : null;
  const form = $('#task-form'); form.reset();
  $('#task-project').innerHTML = store.projects.map(p => `<option value="${escape(p.id)}">${escape(p.name)}</option>`).join('');
  form.elements.projectId.value = projectId || (selected === 'all' ? 'inbox' : selected);
  if (editing) {const task = store.project(projectId).todos.find(t => t.id === id); for(const key of ['title','description','dueDate','priority','notes']) form.elements[key].value = task[key];}
  $('#dialog-title').textContent = editing ? 'Task details' : 'New task';
  $('#delete-task').hidden = !editing;
  $('#task-dialog').showModal(); form.elements.title.focus();
}
$('#today').textContent = new Intl.DateTimeFormat(undefined,{weekday:'long',month:'long',day:'numeric'}).format(new Date());
$('#all-tasks').onclick = () => {selected = 'all'; render();};
$('#projects').onclick = event => {const button = event.target.closest('[data-project]'); if(button) { selected = button.dataset.project; render(); }};
$('#add-project').onclick = () => {$('#project-form').reset(); $('#project-dialog').showModal(); $('#project-form').elements.name.focus();};
$('#project-form').onsubmit = event => { event.preventDefault(); try {const p = store.addProject($('#project-form').elements.name.value); selected = p.id; filter = 'all'; $('#search').value = ''; $('#project-dialog').close(); render();} catch(e){notify(e.message);} };
$('#new-task').onclick = $('#quick-add').onclick = () => openTask();
$('#tasks').onclick = event => {const toggle = event.target.closest('[data-toggle]'), edit = event.target.closest('[data-edit]'); if(toggle) {store.toggle(toggle.dataset.parent,toggle.dataset.toggle); render();} else if(edit) openTask(edit.dataset.parent,edit.dataset.edit);};
$('#task-form').onsubmit = event => { event.preventDefault(); const data = Object.fromEntries(new FormData(event.target)); const target = data.projectId; delete data.projectId; try {if(editing) store.updateTodo(editing.projectId,editing.id,target,data); else store.addTodo(target,data); $('#task-dialog').close(); render();} catch(e){notify(e.message);} };
$('#delete-task').onclick = () => {if(editing) {store.deleteTodo(editing.projectId,editing.id); $('#task-dialog').close(); render(); notify('Task deleted.');}};
for(const button of document.querySelectorAll('[data-close]')) button.onclick = () => button.closest('dialog').close();
for(const button of document.querySelectorAll('[data-filter]')) button.onclick = () => {filter = button.dataset.filter; render();};
$('#search').oninput = render; $('#sort').onchange = render;
window.addEventListener('storage', event => {if(event.key === 'daybook.v1') notify('Tasks changed in another tab. Refresh to load the latest changes.');});
render();
