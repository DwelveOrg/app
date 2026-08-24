# Dwelve Product Application

## Purpose and users

Dwelve is a digital academic testing and performance-management product for schools and private
learning centers, initially shaped for Uzbekistan and the wider CIS region. Administrators organize
schools, members, and classes; teachers author and publish tests and review performance; students
join learning contexts and take assigned tests. The interface supports English, Russian, and Uzbek
Latin.

The application aims to reduce manual assessment work and give educators trustworthy class and
student performance information.

## Implemented product areas

- Email/password and Google authentication, password recovery, sessions, and profiles
- Post-signup school creation, invite acceptance, school/class join requests, and membership context
- School, member, class, teacher, and student management surfaces
- Test authoring, PDF-assisted import, publication, assignments, exam attempts, grading, and results
- Dashboards, notifications, support reports, localization, themes, and responsive product shells

Detailed behavior and known gaps live in [`docs/features/`](./docs/features/) and the route map in
[`docs/architecture/SYSTEM_DESIGN.md`](./docs/architecture/SYSTEM_DESIGN.md).

## Roles and business rules

- Accounts are global identities; roles exist only on a membership in a school or learning center.
- Signup does not let a user choose a role.
- A school creator receives an administrator membership for that school.
- Teacher access is granted through an administrator-controlled invite or approved request.
- Student access is granted through an invite, join credential, or approved request.
- One account can have multiple memberships; the selected school determines application context.
- Backend authorization is authoritative even when the UI hides unavailable actions.

## Product boundaries

- This repository is the authenticated, non-indexable application at `app.dwelve.uz`.
- The sibling `frontend` repository owns public marketing and search-indexable pages.
- Platform-operator workflows live in the separate `admin` console.
- The sibling `backend_nestJS` repository owns records, authorization, storage, and API behavior.

## Interface direction

The product follows a restrained academic SaaS system: ink is the action color, violet is brand
identity, and chart colors are reserved for data. Shared tokens and components—not one-off Tailwind
values—define typography, color, elevation, motion, and states. The canonical UI rules live in
[`docs/design/`](./docs/design/).

## Known product limitations

The repository has no automated UI or integration tests. Some roadmap and gap notes under
`docs/planning/` describe incomplete or unverified behavior; those notes are not a substitute for
checking current code and backend contracts.
