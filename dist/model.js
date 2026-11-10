export const STORAGE_KEY = 'daybook.v1';
export class Todo {
  constructor({id = crypto.randomUUID(), title, description = '', dueDate = '', priority = 'medium', notes = '', completed = false}) {
    if (typeof title !== 'string' || !title.trim()) throw new Error('Give your task a title.');
    if (!['low','medium','high'].includes(priority)) throw new Error('Choose a valid priority.');
    if (dueDate && (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate) || Number.isNaN(Date.parse(dueDate)))) throw new Error('Choose a valid date.');
    Object.assign(this, {id, title:title.trim(), description, dueDate, priority, notes, completed:Boolean(completed)});
  }
  toggle() { this.completed = !this.completed; }
}
export class Project {
  constructor(name, id = crypto.randomUUID(), todos = []) {
    if (!name.trim()) throw new Error('Give your project a name.');
    Object.assign(this, {name:name.trim(), id, todos:todos.map(t => new Todo(t))});
  }
}
export class TodoStore {
  constructor(storage) {
    this.storage = storage; this.warning = '';
    try {
      const saved = JSON.parse(storage.getItem(STORAGE_KEY) || 'null');
      this.projects = saved ? saved.projects.map(p => new Project(p.name, p.id, p.todos)) : [];
      if (saved && !this.projects.some(p => p.id === 'inbox')) this.projects.unshift(new Project('Inbox', 'inbox'));
    } catch { this.projects = []; this.warning = 'Saved data could not be read. A fresh Inbox is ready.'; }
    if (!this.projects.length) this.projects = [new Project('Inbox', 'inbox')];
  }
  save() {
    try { this.storage.setItem(STORAGE_KEY, JSON.stringify({projects:this.projects})); this.warning = ''; }
    catch { this.warning = 'Storage is unavailable. Changes will last for this session only.'; }
  }
  addProject(name) { const p = new Project(name); this.projects.push(p); this.save(); return p; }
  addTodo(projectId, data) { const t = new Todo(data); this.project(projectId).todos.push(t); this.save(); return t; }
  project(id) { const p = this.projects.find(p => p.id === id); if (!p) throw new Error('Project not found.'); return p; }
  updateTodo(projectId, id, targetId, data) {
    const p = this.project(projectId), target = this.project(targetId), index = p.todos.findIndex(t => t.id === id);
    if (index < 0) throw new Error('Task not found.');
    const t = new Todo({...p.todos[index], ...data, id});
    p.todos.splice(index, 1); target.todos.push(t); this.save();
  }
  toggle(projectId,id) { this.project(projectId).todos.find(t => t.id === id).toggle(); this.save(); }
  deleteTodo(projectId,id) { const p = this.project(projectId); p.todos = p.todos.filter(t => t.id !== id); this.save(); }
}
