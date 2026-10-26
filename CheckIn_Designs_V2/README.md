# CheckIn UI Redesign — Research-led v2

This pack contains two standalone HTML prototypes for the `Rubil-Mogere-94/checkin` repository.

## Files

- `employee-portal.html` — employee workspace with a prominent personal QR pass, recent arrival history, account profile, help content and a ChatterMax preview panel.
- `admin-dashboard.html` — operations console with attendance summaries, arrival trend, branch activity, searchable check-in log, employee management, branch management, a proposed access/roles page and deployment/security checklist.
- `demo-qr.svg` — a sample QR pass image. It encodes a reserved `.invalid` demonstration URL and does not identify a real person.

## Open locally

Download the files and open the HTML files directly in Brave, Chrome, Firefox or another modern browser. CSS and JavaScript are embedded; no package installation, web font, chart library or network connection is required.

## What the repository currently does

The repository README describes a React 18 + Material UI frontend backed by FastAPI, SQLAlchemy and SQLite. Its model concepts are `User`, `Location` and `CheckInLog`. Employees see a generated QR code and personal arrival history. Administrators manage employees and branch locations and review check-in logs. The QR payload is described as containing an employee email, latitude, longitude and timestamp. The project also includes ChatterMax, an Ollama/LangChain assistant.

Source: https://github.com/Rubil-Mogere-94/checkin/blob/master/README.md

## Research notes and design decisions

This was a pattern review, not an attempt to clone another product's UI.

- **Jibble — attendance tracker and features:** https://www.jibble.io/attendance-tracker and https://www.jibble.io/features. The useful patterns are making the primary clock-in/check-in action obvious, showing who's in or out, connecting attendance events with location verification, and considering kiosk / QR use cases.
- **Clockify — dashboard and reports:** https://clockify.me/help/reports/dashboard and https://clockify.me/help/getting-started/get-started-with-team-reports. The useful patterns are separating personal and team views, providing high-utility search/filter controls, and treating reporting scope as permission-dependent.
- **Connecteam — Time Clock guide:** https://help.connecteam.com/en/articles/3310664-starting-guide-to-the-time-clock and **Kiosk guide:** https://help.connecteam.com/en/articles/6135619-the-kiosk-app. The useful patterns are a distinct current-day operations view, a separate timesheet/review workflow, and a clear shared-device check-in experience.
- **Deputy — attendance and timesheets:** https://www.deputy.com/features/time-and-attendance. The useful pattern is surfacing mismatches and exceptions as review tasks, rather than burying them in a long table.

These insights were adapted to the current CheckIn feature set: QR pass, timestamped arrival logs, GPS coordinates, employee accounts, branch locations and the existing assistant. Payroll, leave requests, shift scheduling, hours-worked totals and facial recognition were intentionally not presented as working features because they are not in the repository README's current scope.

## Prototype data and interactions

These are visual prototypes, not a production app. Names, coordinates, branch totals, attendance counts and history values are invented sample data. Navigation, filtering, local form submissions, simulated check-ins, toast messages, QR download and CSV exports work locally in the HTML page. No action writes to SQLite or calls the FastAPI backend. The admin QR scanning modal clearly states that a camera decoder and server verification are not wired into the static prototype.

## Proposed permission model

The admin interface shows a **proposed** four-level model for product planning:

- **Super Admin:** system configuration, security policy and administrator access.
- **Administrator:** employee accounts, branch records and organisation attendance logs.
- **Branch Manager:** only the branches explicitly assigned to that manager.
- **Employee:** personal QR pass and own attendance history.

The repository README only documents `admin` and `employee` roles. The additional levels must not be made available by frontend-only changes; add and test server-side role/scope enforcement first.

## Recommended implementation order

1. Convert the page layouts and reusable visual components into the existing React / Material UI application instead of embedding the standalone HTML in production.
2. Connect employee pass and history to the authenticated user's API response; connect admin logs and directory / locations to the corresponding endpoints. Include loading, empty, permission-denied, API-error and no-GPS states.
3. Make the production QR URL environment-configurable and stop exposing personal details in the QR payload. Prefer an opaque, signed, expiring token validated on the server, with replay protection and a clear success/failure response.
4. Lock administrator account creation behind an authorised workflow and enforce permissions on protected backend endpoints. The UI is not a security boundary.
5. Only after backend support exists, add branch-scoped roles, audit trails and permission-based filtering. Align each new field in the forms with the real API schema.
6. Replace sample counts and charts with data returned by the API. Keep chart totals consistent with the selected date range and label any calculated indicators clearly.

## Accessibility and responsive design

The pages include responsive breakpoints, visible focus states on key form controls, labelled navigation/actions, keyboard-dismissible modals, reduced-motion support, semantic headings and table markup. For production, add automated keyboard / screen-reader review and visual regression testing at mobile, tablet and desktop widths.
