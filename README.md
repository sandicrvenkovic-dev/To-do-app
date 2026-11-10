# Daybook

A responsive todo app built with browser ES modules, HTML, and CSS. No build or dependency installation required.

Run `npm start` and open http://localhost:5173. Run `npm test` for data-model checks.

- Create projects; new tasks default to Inbox.
- Create, inspect, edit, move, complete, and delete tasks.
- Tasks include title, description, due date, priority, and notes.
- Search, filter by completion, and sort by due date or priority.
- Projects and tasks persist in localStorage on every change. Class methods are restored on reload, and unavailable or corrupted storage is handled without crashing.
- `dist/model.js` owns the objects, data operations, and persistence; `dist/app.js` owns rendering and events.

Data stays in this browser and does not sync between devices. Google Fonts are optional; system fonts are used offline.
