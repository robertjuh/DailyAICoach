# Daily Routine App

**Product Specification — Mission, Vision, Use Cases & User Stories**

Date: March 16, 2026 | Version 1.0 | Status: Draft

---

## 1. Mission & Vision

### Mission

*Helping people find calm, structure and consistency in their daily lives — through personal AI support that understands how you work.*

### Vision

*"A web app that helps users build daily routines through AI support." The most personal, accessible AI coach for daily structure — where technology acts as your coach, not just another to-do list.*

---

## 2. Project Goals (SMART)

**Productivity & Wellbeing**
- After 30 days of active use: >70% of users report improved daily structure (survey, 1–10 scale, score ≥7)
- Average routine consistency rises from <40% (week 1) to >70% (week 6)
- Weekly retention after month 1: >55% of new users still active

**Distinctive AI Functionality**
- AI generates recommendations rated as 'relevant' by the user in >65% of cases
- Personalisation level improves measurably after every 7 interactions (via internal relevance score)
- App scores higher on personalisation experience than top 3 competitors (benchmark study post-launch)
- App maintains an "internal memory" that helps with longer conversations where LLMs typically struggle

**Reducing Mental Noise — Creating Order**
- Check-in flow takes on average <3 minutes (measured via session duration in analytics)
- Net Promoter Score (NPS) after 30 days of use: ≥40
- Users report less 'mental noise' (survey after 4 weeks): average score drops by ≥1.5 points on a 10-point scale

---

## 3. Target Audience

**Primary target groups**
- Busy professionals (25–45 years): many responsibilities, struggle with consistency
- Students: want structure, low self-regulation
- People with a wellness & productivity focus: actively looking for healthier habits

---

## 4. Core Problems (Problem Space)

The app addresses the following proven pain points:

- Users struggle to build and maintain routines without external support
- Standard productivity apps are not personal enough — no adaptive behaviour
- Routines are hard to maintain independently, especially during setbacks or stressful periods
- Users need guidance and encouragement during routines, not only after
- 'Mental noise' — too many loose tasks and thoughts without a clear overview

---

## 5. AI Use Cases with Success Criteria

The use cases below form the core of the AI functionality. Each case has a measurable success criterion.

| Use Case | Description | Success Criterion (measurable) |
|---|---|---|
| **Morning Routine Assistant** | AI proposes a personalised daily plan every morning based on goals, energy and history. | User receives daily plan within 60 sec. of opening the app; >80% of users complete their morning routine in the first 2 weeks. |
| **Personalised Planning** | System learns from user behaviour and dynamically adjusts routine blocks based on patterns and preferences. | After 7 days of use: recommendations match >70% of the user's actual activities. |
| **Smart Recommendations** | AI suggests routine adjustments based on progress, mood and historical data. | Recommendations accepted by user in >60% of cases; user sees improvement in consistency after 14 days. |
| **Daily Check-in** | Short daily check-in where the user logs progress, energy and focus (text or voice). | Check-in takes <3 minutes; >75% of active users complete a check-in at least 5 out of 7 days. |
| **Motivation Coach** | AI provides personal feedback, encouragement and coaching based on the user's behaviour and goals. | Users report a higher motivation score (NPS-style scale 1–10) after 4 weeks of use vs. week 1. |
| **Progress Summary** | Weekly and monthly overviews show achieved goals, consistency and trends in routine behaviour. | Overview shows at least 5 measurable data points; opened by >60% of active users per week. |
| **Behaviour-based Routine Adjustment** | System automatically adjusts the difficulty and structure of routines based on sustained behaviour. | After 30 days: routines are on average >20% more consistently maintained than in week 1 without adjustment. |

---

## 6. User Stories

Each user story follows the format: As a [role] I want [action] so that [value]. Each story has concrete tasks and a Definition of Done.

---

### US01: Create account & log in

*As a new user I want to create an account and log in securely so that I have access to my personal routines and data*

| # | Task | Definition of Done |
|---|---|---|
| 1 | Build registration screen with email + password and Google/Apple OAuth | User can register; email verification works; OAuth flow works without errors |
| 2 | Build login screen with password recovery | User can log in; recovery email sent within 30 sec. |
| 3 | Implement JWT session management | Session stays active for 30 days; logout clears token correctly |
| 4 | Build 3-step onboarding flow after first login | User completes onboarding; goals and preferences are saved. These goals are stored in a database and serve as context or instructions for AI API requests. |

---

### US02: Set up morning routine

*As a user I want to compose a personal morning routine so that I have a clear structure every morning that suits me*

| # | Task | Definition of Done |
|---|---|---|
| 1 | Ask user to provide 3 morning routine items if not yet known. | User can enter 3 items and they are remembered for next time. The user can change the routine items in consultation with the AI coach. |
| 2 | Time settings for the given morning routine items. | Times save correctly; the app knows for example that a task takes X minutes. This happens in consultation with the AI coach. |
| 3 | Integrate AI suggestions for routine | AI shows at least 3 relevant suggestions when creating; user can add or dismiss directly |
| 4 | Save and activate routine as default morning routine | Active routine loads when app opens; changes take effect immediately |

---

### US03: Receive AI advice about routine

*As a user I want to receive personal AI advice about my routine so that I can improve my habits and maintain them more consistently*

| # | Task | Definition of Done |
|---|---|---|
| 1 | Build AI coach integration (conversation interface) | User can ask questions; AI responds context-aware based on routine data |
| 2 | Build routine analysis pipeline (pattern detection) | System detects >3 patterns after 7 days of use; shows insights in dashboard |
| 3 | Implement proactive advice push (daily or weekly) | User receives at least 1 relevant piece of advice per week; can adjust frequency |

---

### US04: Receive reminders and recommendations

*As a user I want to receive timely reminders and smart recommendations so that I don't forget my routine and am supported throughout the day*

| # | Task | Definition of Done |
|---|---|---|
| 1 | Build push notification system (iOS + Android + web) | Notifications work on all platforms; user can set times and type |
| 2 | Build smart reminder logic (based on behaviour pattern) | Reminders are adjusted based on historical usage; not always at a fixed time |
| 3 | Implement in-app recommendation cards | At least 1 recommendation card visible per day for active user. |

---

### US05: Use progress and memory from previous week

*As a user I want the app to remember what I did last week so that the AI coach can give better and more personal recommendations*

| # | Task | Definition of Done |
|---|---|---|
| 1 | Save conversation history and daily logs | Activities, check-ins and relevant progress are saved per day |
| 2 | Generate summary of the past 7 days | System automatically creates a usable weekly summary of completed activities and patterns |
| 3 | Connect memory layer to AI coach | AI can include previous progress, missed goals and recurring patterns in new advice |
| 4 | Store relevant preferences and long-term goals | User goals such as learning piano, coding and side business remain persistently available for future sessions |

---

### US06: View progress

*As a user I want to be able to clearly view my routine progress so that I stay motivated and can see my growth*

| # | Task | Definition of Done |
|---|---|---|
| 1 | Build progress dashboard with streaks, completions and trends | Dashboard shows at least 7 days back; streak counter matches actual usage |
| 2 | Generate weekly and monthly overview report | Report shows consistency score, top 3 habits and 1 AI insight; exportable as PDF |
| 3 | Show goal comparison (planned vs. actual) | Chart shows difference per routine element; data matches log |

---

### US07: Admin: manage content and routines

*As an admin or owner I want to manage content, prompts and routine templates so that I can monitor and improve the quality of the app content*

| # | Task | Definition of Done |
|---|---|---|
| 1 | Build admin dashboard with user overview and statistics | Admin sees active users, average usage and churn; data real-time (<5 min delay) |
| 2 | Build content management system for routine templates | Admin can create, edit, publish and archive templates; changes live within 1 hour |
| 3 | Implement prompt management for AI instructions | Admin can adjust AI prompts; changes active at next user session; rollback possible |

---

### US08: First Watch — morning check-in

*As a user I want to receive a structured morning briefing (First Watch) every day so that I start my day with clarity, gratitude and a prioritised plan*

| # | Task | Definition of Done |
|---|---|---|
| 1 | Build First Watch page with structured template sections (Gratitude, Wake Inheritance, Mission Focus, Top Priorities, Drift Watch, Movement, Open DIMs, Operating Posture, Closing Bearing) | Page renders all template sections; user can view and interact with each section |
| 2 | Implement AI draft generation that pre-fills the First Watch based on user context, prior Night Watch data and goals | AI generates a complete draft within 30 seconds; draft includes personalised content from user history and last Night Watch |
| 3 | Implement Wake Inheritance: carry forward energy state, constraints, open loops and emotional residue from the most recent Night Watch | If a prior Night Watch exists, Wake Inheritance section is auto-populated (Mode A); if no prior Night Watch exists, AI uses a cold-start approach (Mode B) |
| 4 | Allow user to edit, confirm or dismiss each section of the generated First Watch before finalising | User can modify any field; confirmed First Watch is saved and becomes the active plan for the day |
| 5 | Build DIM (Decisions, Ideas, Micro-tasks) management: surface open DIMs from previous sessions and allow triage (Do, Defer, Delegate, Delete) | Open DIMs from prior watches appear automatically; user can act on each; completed DIMs move to history |
| 6 | Schedule/trigger First Watch at user-configured morning time via notification or prompt on app open | User can set preferred First Watch time; app prompts the watch at or near that time; nav highlights pending watch |

---

### US09: Night Watch — evening reflection

*As a user I want to complete a structured evening reflection (Night Watch) every day so that I close the day with awareness, capture what matters, and set up tomorrow*

| # | Task | Definition of Done |
|---|---|---|
| 1 | Build Night Watch page with structured template sections (Bearings from the Day, Focused Hours, What Advanced, Friction & Drift, Emotional Weather, Movement, Completed DIMs, Open DIMs, Wake Effect) | Page renders all template sections; user can view and interact with each section |
| 2 | Implement AI draft generation that pre-fills the Night Watch based on today's First Watch, daily logs, check-ins and chat history | AI generates a complete draft within 30 seconds; draft references actual activities and priorities from the day |
| 3 | Build Focused Hours tracker: user logs time blocks with activity and duration; system calculates total vs target | Table input works; totals are calculated automatically; data is persisted for progress tracking |
| 4 | Build Friction & Drift analysis: AI identifies where attention wandered and time leaked based on the day's data and user input | AI highlights drift patterns; user can confirm, edit or dismiss observations |
| 5 | Implement Wake Effect: generate carry-forward items (tasks, energy state, constraints, open loops) that feed into the next First Watch | Wake Effect section is saved; data is available for the next morning's Wake Inheritance auto-population |
| 6 | Allow user to edit, confirm or dismiss each section of the generated Night Watch before finalising | User can modify any field; confirmed Night Watch is saved and linked to the day's First Watch |
| 7 | Schedule/trigger Night Watch at user-configured evening time via notification or prompt on app open | User can set preferred Night Watch time; app prompts the watch at or near that time; nav highlights pending watch |

---

## 7. Open Questions

The following questions require further exploration:

- Which data privacy regulations (GDPR) apply to storing routine behaviour?
- How do you measure 'wellbeing' reliably in-app without high friction?
- What is the minimum dataset needed for meaningful personalisation?
- How do we onboard users who have little AI experience?

---

*Daily Routine App · Product Specification v1.0 · Confidential internal document*
