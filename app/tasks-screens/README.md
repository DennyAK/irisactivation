# Task screens connections and create policy

This document explains how the parent task in `tasks` links to its child documents across screens, and the current minimal-create policy used at step 2.

## Parent → child links

- Task Attendance
  - Collection: `task_attendance`
  - Parent fields: `task_attendance` (Yes/No), `taskAttendanceId`
  - Route: `task-attendance` with param `attendanceId`

- Early Assessment
  - Collection: `task_early_assessment`
  - Parent fields: `task_assesment` (Yes/No), `task_assesmentId`
  - Route: `task-early-assessment` with param `assessmentId`

- Quick Quiz
  - Collection: `task_quick_quiz`
  - Parent fields: `task_quick_quiz` (Yes/No), `task_quick_quizId`
  - Route: `task-quick-quiz` with param `quizId`

- Quick Sales Report (QR)
  - Collection: `sales_report_quick`
  - Parent fields: `task_quick_sales_report` (Yes/No), `task_quick_sales_reportId`
  - Route: `quick-sales-report` with param `reportId`

- Sales Report Detail (SRD)
  - Collection: `sales_report_detail`
  - Parent fields: `task_sales_report_detail` (Yes/No), `task_sales_report_detailId`
  - Route: `sales-report-detail` with param `detailId`

## Minimal create (draft) policy

When a new task is created and step 2 toggles are saved, the app attempts to create child docs:

- Always sets `createdAt`, `createdBy`, `assignedToBA`, `assignedToTL`, `tasksId`, and when applicable `outletId`.
- For QR: sets `taskSalesReportQuickStatus: 'draft'`.
- For SRD: sets `salesReportDetailStatus: 'draft'`.

If the Firestore rules still require full text shape on create, the app falls back to a safe default payload that satisfies validators (empty strings for long text fields) and then updates the parent with the created IDs.

This keeps initial writes small when possible, while preserving compatibility with stricter rules.

## Submit/Update

- Validators (length/content) should ideally be enforced on submit (status transitions) rather than on initial draft create.
- Screens populate and update their own data independently after creation.

## Notes

- Parent update and child creates are attempted atomically via write batch first. If the batch fails, the app attempts per-collection creates to identify which collection failed and reports a readable summary.
- Only roles with task management permissions (admin/superadmin/area manager) can add and link child documents from the task screen.
