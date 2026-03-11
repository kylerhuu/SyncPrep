# SyncPrep — Folder Structure

```
SyncPrep/
├── docs/
│   ├── MVP_SPEC.md
│   ├── MVP_PLAN.md
│   └── FOLDER_STRUCTURE.md
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout, metadata, global styles
│   │   ├── page.tsx            # Landing page
│   │   ├── globals.css
│   │   ├── schedule/
│   │   │   └── page.tsx        # Scheduler page (form + results)
│   │   ├── prep/
│   │   │   └── page.tsx        # Prep results page
│   │   └── api/
│   │       └── prep/
│   │           └── route.ts    # POST /api/prep — AI prep generation
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Card.tsx
│   │   │   ├── Button.tsx
│   │   │   └── Input.tsx
│   │   ├── scheduler/
│   │   │   ├── TimezoneFields.tsx
│   │   │   ├── AvailabilityWindows.tsx
│   │   │   ├── OverlapResults.tsx
│   │   │   └── CalendarLink.tsx
│   │   └── prep/
│   │       ├── MeetingContextForm.tsx
│   │       └── PrepNotesPanel.tsx
│   ├── lib/
│   │   ├── timezone.ts         # Overlap calculation, suggestions
│   │   └── calendar.ts         # Google Calendar URL builder
│   └── types/
│       └── index.ts
├── .env.local.example
├── .gitignore
├── next.config.js
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

**Notes:**
- Overlap calculation is client-only (`lib/timezone.ts`). No scheduling API route.
- Use `@/` for imports (e.g. `@/components/ui/Card`).
