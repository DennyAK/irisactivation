# Iris Activation App

This repository contains the Iris Activation mobile app built with Expo Router + React Native.

## Production Readiness Todo List

Keep this list updated as we harden the app for production.

### Product & UX
- [ ] About / Info screen
  - [ ] Show app name, version/build, environment, commit hash
  - [ ] Links: Privacy Policy, Terms, Support, Rate app, Update app (store) + OTA check
  - [ ] Changelog modal and “What’s new” after update
- [ ] Navigation & UX polish
  - [ ] Consistent headers/titles; validate back behavior
  - [ ] Empty states, skeleton loaders, pull-to-refresh on long lists
  - [ ] Pagination/infinite scroll for outlets, projects, team
  - [ ] Global toasts/snackbars for success/failure; retry actions
- [ ] Accessibility
  - [ ] Screen reader labels, focus order, larger hit targets
  - [ ] Dynamic type/scalable fonts; color contrast audit; haptics
- [ ] Internationalization
  - [ ] i18n (en/id) for labels, dates, numbers

### Security & Privacy
- [ ] Firestore Security Rules
  - [ ] Least privilege; authorize team-history reads by role and user
  - [ ] Enforce role immutability from client; elevation only via admin tools
  - [ ] Add tests for AM/TL/BA access patterns
- [ ] Firebase App Check
  - [ ] Enable and integrate Play Integrity/DeviceCheck
- [ ] Secret Management
  - [ ] EAS secrets for env vars; remove any secrets from client bundle
  - [ ] Ensure firebase-admin used only in Cloud Functions
- [ ] Data Privacy
  - [ ] Hosted Privacy Policy & Terms; in-app consent + account deletion flow
  - [ ] Data retention policy; age gate if needed

### Data & Performance
- [ ] Firestore queries
  - [ ] Composite indexes as needed; add limits + startAfter pagination
  - [ ] Use server timestamps consistently
- [ ] Caching & Offline
  - [ ] Cache key lists; optimistic updates with retry/backoff
  - [ ] Offline queue for mutations (attendance/QR/SRD)
- [ ] Media & Assets
  - [ ] Compress images; lazy-load charts/modals
  - [ ] Preload fonts/icons; Hermes + minify enabled

### Reliability & Observability
- [ ] Crash/error monitoring
  - [ ] Sentry (recommended with Expo) or Crashlytics
  - [ ] Error boundary with friendly fallback
- [ ] Analytics
  - [ ] Screen tracking + key events (Task complete, SRD submit, QR scan, Attendance)
  - [ ] Funnels, retention, role breakdowns
- [ ] Performance monitoring
  - [ ] Trace load times, slow queries, heavy renders

### Testing
- [ ] Unit tests
  - [ ] Utils for dates/sorting/grouping/aggregations
  - [ ] Components with logic (FilterHeader, chart mappers)
- [ ] Integration tests
  - [ ] Team-history filters/tabs/aggregations by userId
  - [ ] Firestore reads per role; blocked negatives
- [ ] E2E tests
  - [ ] Login → tabs → create → history; Detox/Expo E2E
- [ ] Firestore Rules tests
  - [ ] Expand jest rules for new collections/queries
- [ ] CI test matrix
  - [ ] Lint, typecheck, unit/integration, rules tests on PR

### Code Quality & Process
- [ ] Tooling
  - [ ] ESLint + Prettier, TS strict mode
  - [ ] Husky + lint-staged (typecheck/format on commit)
- [ ] Reviews & Docs
  - [ ] PR templates, codeowners
  - [ ] README setup, environments, release steps

### Delivery & Updates
- [ ] CI/CD
  - [ ] EAS Build (internal/beta/prod) + EAS Submit
  - [ ] Versioning policy; changelog automation
- [ ] OTA updates
  - [ ] Expo Updates channels (dev/beta/prod) + in-app prompt
- [ ] Store readiness
  - [ ] Listings, privacy answers, permission descriptions
  - [ ] App Signing, Integrity, iOS privacy manifest

### App Features Polish
- [ ] Team Management
  - [ ] Province/role filters; TL/BA hierarchy; profile drill-down; CSV export (admin)
- [ ] Team History
  - [ ] Compare metrics; toggle sum vs avg; raw entry drill-down; chart export/share
- [ ] Clicker
  - [ ] Export; optional daily reset; haptics; confirmations
- [ ] Tasks
  - [ ] Notifications; deep links; overdue badges; calendar view

### Backend & Operations
- [ ] Cloud Functions
  - [ ] Rate limiting, idempotency, scheduled backups, restore runbook
- [ ] Monitoring
  - [ ] Log filters by userId/role; alerting on spikes
- [ ] Cost Guardrails
  - [ ] Deny abusive patterns via rules; cache hot paths

### Legal & Compliance
- [ ] Alcohol/age compliance, geo restrictions
- [ ] Analytics consent; data export/deletion flow

### Support & Feedback
- [ ] In-app feedback with device/app info
- [ ] FAQ/Help center link; diagnostics screen

---

## Dev Quick Start
- Install deps: `npm i`
- Start app: `npm run start`
- Typecheck: `npm run typecheck`

