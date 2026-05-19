# Phase 1 Plan - Foundation

## Objective
Thiết lập nền tảng kỹ thuật và UX tối thiểu để một phụ huynh có thể đăng ký, tạo hồ sơ trẻ, và mở được session shell của Mia.

## Inputs / Prerequisites
- Canonical docs completed
- Environment variable contract defined
- Supabase project available

## Build Items
- Initialize Next.js App Router project under `src/frontend/`
- Configure Tailwind, shadcn/ui baseline, and Nunito
- Create env placeholders and provider integration contracts
- Implement Supabase auth wiring and middleware protection
- Create parent registration and login pages
- Create child profile CRUD flow
- Create session shell UI with consent, Mia avatar state placeholders, mic button, and camera preview
- Create media hook spikes for mic and camera permissions

## Acceptance Checks
- App boots locally and shows branded landing page
- Parent can register and sign in
- Parent can create and view child profiles
- Parent can open a child session shell
- Mic and camera permission flow works on supported desktop browser

## Risk Watchouts
- Supabase auth/profile synchronization
- Browser media permissions
- iOS Safari permission quirks discovered early
