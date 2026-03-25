# Scheduler — Angular App

A team scheduling application built with Angular 17 and Angular Material.

## Screens
- **Timeline** — 24h Gantt chart with Day/Night/Remote/Virtual/PTO/Holiday shifts and overtime indicators
- **Users** — searchable/filterable table of 120 users with sortable columns and contact popups
- **User Detail** — add new users or edit existing ones

## Tech stack
- Angular 17 (standalone components, signals, control flow `@if/@for`)
- Angular Material (sidenav, table, paginator, form fields, snackbar)
- Angular CDK (BreakpointObserver)
- RxJS, TypeScript 5.2

## Getting started

```bash
# Install dependencies
npm install

# Start dev server
ng serve

# Open browser
http://localhost:4200
```

## Project structure

```
src/app/
├── app.component.ts          # Root with Material toolbar + router-outlet
├── app.config.ts             # Bootstrap config (router, animations)
├── app.routes.ts             # Lazy-loaded routes
├── core/
│   ├── models/
│   │   └── scheduler.models.ts   # All interfaces, constants, shift defs
│   └── services/
│       └── schedule.service.ts   # Shift logic, user generation, signals
├── features/
│   ├── timeline/
│   │   ├── timeline.component.ts
│   │   ├── timeline.component.html
│   │   └── timeline.component.scss
│   └── users/
│       ├── users.component.ts
│       ├── users.component.html
│       ├── users.component.scss
│       └── components/
│           └── user-detail/
│               ├── user-detail.component.ts
│               ├── user-detail.component.html
│               └── user-detail.component.scss
└── shared/
    └── components/
        └── contact-card/
            └── contact-card.component.ts
```
