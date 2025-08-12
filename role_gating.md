# Role Gating Matrix

This document summarizes the current role-based access for routes, menu items, and in-screen actions.

Roles
- guest (default on signup)
- Iris - BA
- Iris - TL
- Dima (mirrors BA visibility; no BA-only action buttons)
- Diageo (mirrors TL visibility; no TL-only action buttons)
- area manager
- admin
- superadmin

- Bottom Tabs
- guest: Profile, Clicker, About
- authenticated (non-guest): Profile, Clicker, About, Tasks, Outlets, Projects
- user-manager tab: visible (menu-only detailed entries are gated inside)
- audit-logs tab: admin/superadmin only

- Menu (top-right)
- Always: Profile, Clicker, About, Tasks, Attendance, Assessment, Quick Quiz, Sales Report, Sales Detail, Outlets, Provinces, Cities, Projects, Activation, Projects List
- Admin and Area Manager: User Manager, Admin Requests
- User Management (CRUD): admin/superadmin only (screen-level guard)
- Guest: Profile and About

Screens gated
- user-screens/user-management.tsx: admin/superadmin only (hard-guarded)

Task data visibility
- Early Assessment / Quick Sales Report / Sales Report Detail listings are filtered as follows:
  - BA-ish (Iris - BA, Dima): only items assignedToBA == current uid
  - TL-ish (Iris - TL, Diageo): only items assignedToTL == current uid
  - Others: see all

Action buttons within tasks
- BA-only actions hidden from Dima:
  - Early Assessment: "Assess BA"
  - Quick Sales: "QR by BA"
  - Sales Report Detail: "SRD by BA"
- TL-only actions hidden from Diageo:
  - Early Assessment: "Assess TL"
  - Quick Sales: "QR by TL"
  - Sales Report Detail: "SRD by TL"
- Area Manager/Admin/Superadmin behavior unchanged

Signup Defaults
- New users are created with role: "guest" in `users/{uid}`.
- Security note: role elevation must be done by admins in the app; ensure Firestore Security Rules disallow users from updating their own role.

Notes
- Helpers added: `isDima`, `isDiageo`, `isBAish`, `isTLish`.
- These mirror BA/TL for data filtering while preventing BA/TL-only action buttons by leaving button checks strict to Iris BA/TL.

Unknown/unassigned roles
- Any role not in the known set (guest, admin, superadmin, area manager, Iris - BA, Iris - TL, Dima, Diageo) is treated as unassigned and will be redirected to Login/Signup (no tab access).
