# Remagent V2 — Test Scripts

Base URL: `https://remagentemploymentprofessionals.com`

---

## 1. PLAYWRIGHT (Browser Automation) Scripts

These simulate real user interactions — clicking, typing, navigating, and verifying what's on screen.

### 1.1 Authentication & Registration

| # | Script Name | Steps | Expected Result |
|---|---|---|---|
| P-AUTH-01 | Login — valid business | Navigate to /login, enter valid business email/password, submit | Redirects to /dashboard, shows business name |
| P-AUTH-02 | Login — valid professional | Navigate to /login, enter valid professional email/password, submit | Redirects to /dashboard, shows profile completion % |
| P-AUTH-03 | Login — invalid credentials | Enter wrong password, submit | Shows error message, stays on /login |
| P-AUTH-04 | Login — empty fields | Submit with empty email and/or password | Shows validation error |
| P-AUTH-05 | Register — new business | Navigate to /register, fill in name/email/password, select Business role, submit | Account created, redirects to /dashboard or /company-profile |
| P-AUTH-06 | Register — new professional | Navigate to /register, fill in name/email/password, select Professional role, submit | Account created, redirects to /dashboard or /onboarding |
| P-AUTH-07 | Register — duplicate email | Register with an email that already exists | Shows error "email already exists" |
| P-AUTH-08 | Logout | Click logout from any authenticated page | Redirects to /login, cannot access app pages |

### 1.2 Business — Company Profile

| # | Script Name | Steps | Expected Result |
|---|---|---|---|
| P-BIZ-PROF-01 | Complete company profile | Login as business, go to /company-profile, fill all fields (name, industry, website, LinkedIn, address, phone, timezone), save | Profile saved, all fields persist on reload |
| P-BIZ-PROF-02 | Upload company logo | Upload a valid image file as logo | Logo preview shows, persists on reload |
| P-BIZ-PROF-03 | Timezone selection | Select each timezone option (Eastern, Central, Mountain, Pacific) | Selection saves and persists |
| P-BIZ-PROF-04 | Address autocomplete | Type partial address in address field | Google autocomplete suggestions appear, selecting one fills city/state/zip |

### 1.3 Business — Job Posting Creation (9-Step Wizard)

| # | Script Name | Steps | Expected Result |
|---|---|---|---|
| P-JP-01 | Step 1: Position details | Fill in title, description, number of hires | Saves and navigates to Step 2 |
| P-JP-02 | Step 2: Experience requirements | Select skills, channels, applications with experience levels | Saves and navigates to Step 3 |
| P-JP-03 | Step 3: Environment — Work Location | Click each Work Location radio button (office, home, mix, optional) | No crash, selection saves. If office/mix selected, address field appears |
| P-JP-04 | Step 3: Environment — Equipment | Click each Equipment radio (provided, BYOD). If BYOD, fill requirements textarea | Saves correctly |
| P-JP-05 | Step 4: Availability | Select days, set start/end times for each | Saves schedule correctly |
| P-JP-06 | Step 5: Rate | Enter hourly rate, select contract type | Saves correctly |
| P-JP-07 | Step 6: Dates | Set start and end dates | Saves correctly |
| P-JP-08 | Step 7: Attachments | Upload one or more documents | Files upload and appear in list |
| P-JP-09 | Step 8: Screening | Add screening questions (preset and custom) | Questions save correctly |
| P-JP-10 | Step 9: Post | Click Publish (or Save as Draft) | Position appears in /positions list with correct status |
| P-JP-11 | Save & Exit mid-wizard | Click Save & Exit on any step | Progress saved, can resume later from same step |
| P-JP-12 | Skip step | Click Skip on an optional step | Advances to next step without saving that step |
| P-JP-13 | Edit existing position | Go to /positions, click Edit on a draft/published position | Wizard loads with existing data in all steps |
| P-JP-14 | Copy position | Click Copy on an existing position | New draft created with same data |
| P-JP-15 | Delete closed position | Close a position, then click Delete | Position removed from list |

### 1.4 Business — Positions List

| # | Script Name | Steps | Expected Result |
|---|---|---|---|
| P-POS-01 | Tab filtering | Click each tab (Public, Private, Pending, Drafts, Closed) | Correct positions shown per tab with counts |
| P-POS-02 | Status change | Change a position from draft to pending_approval by publishing | Position moves to Pending tab |
| P-POS-03 | Visibility toggle | Toggle a published position between Public and Private | Position moves between tabs |
| P-POS-04 | Timezone label on schedule | View a position with availability set | Times show with timezone abbreviation (e.g., "9:00 AM–5:00 PM ET") |

### 1.5 Business — Search Professionals

| # | Script Name | Steps | Expected Result |
|---|---|---|---|
| P-SEARCH-01 | Basic search | Login as business, go to /search, let it load | Shows list of professionals with profile info |
| P-SEARCH-02 | Keyword search | Enter a keyword (e.g., skill name or title) | Results filtered to matching professionals |
| P-SEARCH-03 | Filter by skills | Select one or more skills in AND/OR mode | Results match selected skills |
| P-SEARCH-04 | Filter by state | Select a state from dropdown | Only professionals in that state shown |
| P-SEARCH-05 | Filter by zip + radius | Enter zip code, select radius, wait for map | Map appears with circle, only nearby professionals shown |
| P-SEARCH-06 | Filter by availability day | Select Monday and set 9:00 AM - 5:00 PM | Only professionals available on Monday during that window |
| P-SEARCH-07 | Filter by rate range | Set min/max rate | Only professionals within range shown |
| P-SEARCH-08 | Filter by last login | Select "Last 7 days" | Only recently active professionals shown |
| P-SEARCH-09 | Clear all filters | Click Clear Filters | All filters reset, full list returns |
| P-SEARCH-10 | Timezone display on results | Hover over availability dots on a professional card | Tooltip shows times converted to business's timezone with label (e.g., "Mon: 6:00 AM - 2:00 PM PT") |
| P-SEARCH-11 | View professional profile | Click on a professional card | Navigates to /search/[id], shows full profile with converted availability times + timezone label |
| P-SEARCH-12 | Invite from search | Click Invite on a professional, select a position, send message | Invite modal works, sends invite |

### 1.6 Business — Invites & Inbox

| # | Script Name | Steps | Expected Result |
|---|---|---|---|
| P-BIZ-INV-01 | View sent invites | Go to /invites | Lists all sent invites with status tabs |
| P-BIZ-INV-02 | Filter by position | Select a position from the filter dropdown | Only invites for that position shown |
| P-BIZ-INV-03 | Withdraw invite | Click Withdraw on a pending invite, confirm | Invite status changes to Withdrawn |
| P-BIZ-INV-04 | Send message in invite | Expand an invite, type a message, send | Message appears in thread |
| P-BIZ-INV-05 | Inbox conversations | Go to /inbox, select a conversation | Shows message thread with job details panel |
| P-BIZ-INV-06 | Timezone in inbox | View job details panel in inbox | Schedule times shown in business's timezone with label |

### 1.7 Business — Hires

| # | Script Name | Steps | Expected Result |
|---|---|---|---|
| P-HIRE-01 | View hires | Go to /hires | Lists active/completed/terminated hires |
| P-HIRE-02 | Tab filtering | Click Active, Completed, Terminated tabs | Correct hires per tab |
| P-HIRE-03 | Complete a hire | Click Complete on an active hire, confirm | Hire moves to Completed tab |
| P-HIRE-04 | Terminate a hire | Click Terminate on an active hire, confirm | Hire moves to Terminated tab |

### 1.8 Professional — Onboarding (13-Step Wizard)

| # | Script Name | Steps | Expected Result |
|---|---|---|---|
| P-ONB-01 | Step 1: Getting Started | Fill title, summary, links | Saves, advances to Step 2 |
| P-ONB-02 | Step 2: Skills | Add skills with experience levels | Saves correctly |
| P-ONB-03 | Step 3: Channels | Add channels with experience levels | Saves correctly |
| P-ONB-04 | Step 4: Education | Add degree, institution, dates | Saves correctly |
| P-ONB-05 | Step 5: Employment | Add company, title, dates, location | Saves correctly |
| P-ONB-06 | Step 6: Languages | Add languages with proficiency level | Saves correctly |
| P-ONB-07 | Step 7: Availability | Set weekly schedule with day/time selections | Saves correctly, times display in 12hr format |
| P-ONB-08 | Step 8: Environment | Set work preferences, computer details | Saves correctly |
| P-ONB-09 | Step 9: Hourly Rate | Enter regular/after-hours/holiday rates | Saves correctly |
| P-ONB-10 | Step 10: Photo & Video | Upload photo, enter video URL | Photo uploads, video URL saves |
| P-ONB-11 | Step 11: Location | Enter home and work addresses | Addresses save with geocoding |
| P-ONB-12 | Step 12: Contact | Enter phone, select timezone | Saves correctly |
| P-ONB-13 | Step 13: Agreement | Complete DocuSign signing | Profile marked complete |
| P-ONB-14 | Resume/re-enter onboarding | Leave onboarding mid-flow, come back | Resumes at correct step with saved data |

### 1.9 Professional — Invitations & Inbox

| # | Script Name | Steps | Expected Result |
|---|---|---|---|
| P-PRO-INV-01 | View invitations | Login as professional, go to /invitations | Shows list of invitations from businesses |
| P-PRO-INV-02 | Expand invitation details | Click on an invitation card | Expands to show position details, schedule, description |
| P-PRO-INV-03 | Timezone conversion on invite | View an invitation from a business in a different timezone | Schedule times converted to professional's timezone with label (e.g., "6:00 AM - 2:00 PM PT") |
| P-PRO-INV-04 | Accept invitation | Click Accept on a pending invitation | Status changes to Accepted |
| P-PRO-INV-05 | Decline invitation | Click Decline on a pending invitation | Status changes to Declined |
| P-PRO-INV-06 | Inbox messages | Go to /inbox, view conversation thread | Messages display correctly, can send reply |
| P-PRO-INV-07 | Timezone in inbox | View job details in inbox message thread | Schedule times converted to professional's timezone with label |

### 1.10 Professional — Profile

| # | Script Name | Steps | Expected Result |
|---|---|---|---|
| P-PRO-PROF-01 | View own profile | Go to /profile | Shows all onboarding data in read-only view |
| P-PRO-PROF-02 | Timezone label on availability | View availability section on profile | Times display with own timezone label (e.g., "9:00 AM – 5:00 PM PT") |
| P-PRO-PROF-03 | Edit link to onboarding | Click edit icon next to a section | Redirects to correct onboarding step |

### 1.11 Admin

| # | Script Name | Steps | Expected Result |
|---|---|---|---|
| P-ADMIN-01 | View businesses list | Login as admin, go to /admin/businesses | Lists all businesses with details |
| P-ADMIN-02 | Filter businesses | Filter by last active, sort by various options | List updates accordingly |
| P-ADMIN-03 | Toggle auto-approve | Toggle auto-approve for a business | Setting persists |
| P-ADMIN-04 | Archive/unarchive business | Toggle archive on a business | Business appears/disappears from default view |
| P-ADMIN-05 | View pending postings | Go to /admin/review-postings | Lists postings awaiting approval |
| P-ADMIN-06 | Approve a posting | Click Approve on a pending posting | Status changes to published, removed from pending list |
| P-ADMIN-07 | Send back for revision | Add admin notes, click Send Back | Posting returned to business with notes, moves to "sent back" section |
| P-ADMIN-08 | Review posting detail | Click into a pending posting | Shows all 9 wizard steps with data, timezone label on schedule |

### 1.12 Cross-Timezone (Critical)

| # | Script Name | Steps | Expected Result |
|---|---|---|---|
| P-TZ-01 | Business (PT) views Professional (ET) availability | Business in Pacific views an Eastern professional's profile | Pro's 9AM-5PM ET shows as 6:00 AM - 2:00 PM PT |
| P-TZ-02 | Professional (PT) views Business (ET) job posting schedule | Professional in Pacific views invitation from Eastern business | JP's 9AM-5PM ET shows as 6:00 AM - 2:00 PM PT |
| P-TZ-03 | Same timezone — no conversion | Business in ET views professional in ET | Times unchanged, shows "ET" label |
| P-TZ-04 | Timezone in search tooltips | Business in PT hovers over Eastern pro's availability dots | Tooltip shows times converted to PT with label |
| P-TZ-05 | Timezone in inbox job details | Professional in PT opens inbox with ET business conversation | Schedule shows in PT |
| P-TZ-06 | Timezone in invitations | Professional in MT views invitation from CT business | Schedule shows converted to MT with label |
| P-TZ-07 | Availability filter respects timezone | Business in PT filters for 9AM-5PM. Professional in ET available 9AM-5PM ET (= 6AM-2PM PT) | Professional appears in overlap mode, excluded in full coverage mode |

---

## 2. API-Level Test Scripts

These hit endpoints directly with HTTP requests (curl/Postman) to verify data correctness.

### 2.1 Authentication

| # | Script Name | Method | Endpoint | Test |
|---|---|---|---|---|
| A-AUTH-01 | Login — valid | POST | /api/auth/callback/credentials | Returns session with user id, role, timezone |
| A-AUTH-02 | Login — invalid | POST | /api/auth/callback/credentials | Returns error, no session created |
| A-AUTH-03 | Register — new user | POST | /api/auth/register | Creates user, returns success |
| A-AUTH-04 | Register — duplicate | POST | /api/auth/register | Returns error for existing email |
| A-AUTH-05 | Session includes timezone | GET | /api/auth/session | Response includes `user.timezone` field |

### 2.2 Business Profile

| # | Script Name | Method | Endpoint | Test |
|---|---|---|---|---|
| A-BIZ-01 | Get profile | GET | /api/business/profile | Returns profile, user (with timezone), allIndustries |
| A-BIZ-02 | Update profile | PUT | /api/business/profile | Saves all fields, returns success |
| A-BIZ-03 | Update timezone | PUT | /api/business/profile | Set timezone to "Americas/Pacific", verify persists on GET |
| A-BIZ-04 | Upload logo | POST | /api/business/upload | File uploads, returns URL |

### 2.3 Positions

| # | Script Name | Method | Endpoint | Test |
|---|---|---|---|---|
| A-POS-01 | Create position | POST | /api/positions | Returns new position with ID and draft status |
| A-POS-02 | List positions | GET | /api/positions | Returns positions array with counts per status |
| A-POS-03 | Get position detail | GET | /api/positions/[id] | Returns all position data including timezone |
| A-POS-04 | Update position step | PUT | /api/positions/[id]/step | Saves step data (e.g., environment, availability) |
| A-POS-05 | Change status | PUT | /api/positions/[id]/status | Changes from draft to pending_approval |
| A-POS-06 | Copy position | POST | /api/positions/[id]/copy | Creates duplicate with draft status |
| A-POS-07 | Delete position | DELETE | /api/positions/[id] | Position removed (only if closed) |
| A-POS-08 | Toggle visibility | PUT | /api/positions/[id]/visibility | Toggles public/private |
| A-POS-09 | Lookup data | GET | /api/positions/lookup | Returns allSkills, allChannels, allApplications, allIndustries |
| A-POS-10 | Upload attachment | POST | /api/positions/upload | File uploads, returns URL |

### 2.4 Search Professionals

| # | Script Name | Method | Endpoint | Test |
|---|---|---|---|---|
| A-SRCH-01 | Basic search | GET | /api/search/professionals | Returns paginated professionals with profiles |
| A-SRCH-02 | Keyword filter | GET | /api/search/professionals?keyword=sales | Returns only matching professionals |
| A-SRCH-03 | Skill filter (AND) | GET | /api/search/professionals?skill=X&skill=Y&skillMode=and | Returns pros with ALL selected skills |
| A-SRCH-04 | Skill filter (OR) | GET | /api/search/professionals?skill=X&skill=Y&skillMode=or | Returns pros with ANY selected skill |
| A-SRCH-05 | State filter | GET | /api/search/professionals?state=CO | Returns only CO professionals |
| A-SRCH-06 | Radius filter | GET | /api/search/professionals?zip=80202&radius=50&lat=X&lng=Y | Returns professionals within 50 miles, sorted by distance |
| A-SRCH-07 | Rate filter | GET | /api/search/professionals?minRate=25&maxRate=75 | Returns pros within rate range |
| A-SRCH-08 | Availability + timezone (overlap) | GET | /api/search/professionals?day=monday&dayStart=monday:09:00&dayEnd=monday:17:00&searchTz=Americas/Pacific&availMode=overlap | Returns pros with overlapping availability when converted to UTC |
| A-SRCH-09 | Availability + timezone (full) | GET | /api/search/professionals?day=monday&dayStart=monday:09:00&dayEnd=monday:17:00&searchTz=Americas/Pacific&availMode=full | Returns only pros who fully cover the window |
| A-SRCH-10 | Get professional detail | GET | /api/search/professionals/[id] | Returns full professional profile with timezone field |
| A-SRCH-11 | Pagination | GET | /api/search/professionals?page=2 | Returns page 2 of results with correct total/totalPages |
| A-SRCH-12 | Unauthorized access | GET | /api/search/professionals (no session) | Returns 401 |

### 2.5 Invitations / Invites

| # | Script Name | Method | Endpoint | Test |
|---|---|---|---|---|
| A-INV-01 | Send invite (business) | POST | /api/invites | Creates invite with pending status |
| A-INV-02 | List sent invites | GET | /api/invites | Returns invites with position data (including timezone) |
| A-INV-03 | Check invite exists | GET | /api/invites/check?professionalId=X&positionId=Y | Returns whether invite already sent |
| A-INV-04 | List received invitations (pro) | GET | /api/invitations | Returns invitations with position data (including timezone) and counts |
| A-INV-05 | Accept invitation | PUT | /api/invitations | Body: { id, action: "accept" } — status changes to accepted |
| A-INV-06 | Decline invitation | PUT | /api/invitations | Body: { id, action: "decline" } — status changes to declined |
| A-INV-07 | Withdraw invite (business) | PUT | /api/invites | Body: { id, action: "withdraw" } — status changes to withdrawn |
| A-INV-08 | Send message | POST | /api/invitations/messages | Message created, appears in thread |
| A-INV-09 | Get messages | GET | /api/invitations/messages?offerId=X | Returns messages sorted by date |
| A-INV-10 | Position timezone in response | GET | /api/invitations | Each invitation.position includes timezone field |

### 2.6 Hires

| # | Script Name | Method | Endpoint | Test |
|---|---|---|---|---|
| A-HIRE-01 | List hires | GET | /api/hires | Returns hires with position and professional data |
| A-HIRE-02 | Complete hire | PUT | /api/hires | Body: { id, status: "completed" } — status updated |
| A-HIRE-03 | Terminate hire | PUT | /api/hires | Body: { id, status: "terminated" } — status updated |

### 2.7 Onboarding

| # | Script Name | Method | Endpoint | Test |
|---|---|---|---|---|
| A-ONB-01 | Load onboarding data | GET | /api/onboarding/load | Returns user, profile, all related data |
| A-ONB-02 | Save step 1 | PUT | /api/onboarding | Body: { step: 1, title, summary } — saves correctly |
| A-ONB-03 | Save step 7 (availability) | PUT | /api/onboarding | Body: { step: 7, availability: [...] } — schedule saves |
| A-ONB-04 | Save step 12 (contact/tz) | PUT | /api/onboarding | Body: { step: 12, phone, timezone } — timezone persists |
| A-ONB-05 | Upload photo | POST | /api/onboarding/upload | File uploads, returns URL |

### 2.8 Admin

| # | Script Name | Method | Endpoint | Test |
|---|---|---|---|---|
| A-ADM-01 | List businesses | GET | /api/admin/businesses | Returns all businesses (admin only) |
| A-ADM-02 | Toggle auto-approve | PUT | /api/admin/businesses | Updates business auto-approve flag |
| A-ADM-03 | List pending positions | GET | /api/admin/positions | Returns pending_approval positions |
| A-ADM-04 | Approve position | PUT | /api/admin/positions/[id] | Body: { action: "approve" } — status changes to published |
| A-ADM-05 | Send back position | PUT | /api/admin/positions/[id] | Body: { action: "revise", adminNotes: "..." } — sent back to business |
| A-ADM-06 | Non-admin access denied | GET | /api/admin/businesses (as non-admin) | Returns 403 |

### 2.9 SOW

| # | Script Name | Method | Endpoint | Test |
|---|---|---|---|---|
| A-SOW-01 | Create SOW | POST | /api/sow | Creates SOW for accepted invite |
| A-SOW-02 | Load SOW | GET | /api/sow/[offerId] | Returns SOW data |
| A-SOW-03 | Update SOW | POST | /api/sow | Updates existing SOW fields |

---

## 3. COMBINED (End-to-End) Test Scripts

These test complete user journeys across multiple pages and API calls.

### 3.1 Full Job Posting Lifecycle

| # | Script Name | Flow | Verification |
|---|---|---|---|
| E2E-01 | Create and publish a job posting | Business logs in → creates position through all 9 steps → submits for approval | Position appears in Pending tab on /positions, and in admin /admin/review-postings |
| E2E-02 | Admin approves posting | Admin logs in → goes to /admin/review-postings → approves the position | Position status changes to published, appears in business's Public tab |
| E2E-03 | Admin sends back for revision | Admin adds notes, clicks Send Back → business logs in, sees alert on dashboard | Business sees admin notes, can edit and resubmit |

### 3.2 Full Invite-to-Hire Lifecycle

| # | Script Name | Flow | Verification |
|---|---|---|---|
| E2E-04 | Search and invite | Business searches professionals → finds one → sends invite with message | Invite appears in business's /invites (pending) and professional's /invitations (pending) |
| E2E-05 | Professional accepts invite | Professional logs in → views invitation → clicks Accept | Status changes to Accepted on both sides. Messages flow in /inbox |
| E2E-06 | Message exchange | Business sends message → professional replies → business replies | Messages appear in correct order on both sides in /inbox |
| E2E-07 | Create hire from accepted invite | Business creates a hire record for the accepted professional | Hire appears in /hires for both parties with Active status |
| E2E-08 | Complete the hire | Business marks hire as Completed | Hire moves to Completed tab |

### 3.3 Cross-Timezone End-to-End

| # | Script Name | Flow | Verification |
|---|---|---|---|
| E2E-TZ-01 | Full timezone journey | 1. Professional (ET) sets availability: Mon-Fri 9AM-5PM during onboarding, timezone=Americas/Eastern. 2. Business (PT) sets timezone=Americas/Pacific in company profile. 3. Business searches → views professional. 4. Business sends invite for position with Mon-Fri 8AM-4PM PT schedule. 5. Professional views invitation. | **Step 3:** Business sees pro's availability as 6:00 AM - 2:00 PM PT on profile. **Step 5:** Professional sees position schedule as 11:00 AM - 7:00 PM ET. Both show timezone labels. |
| E2E-TZ-02 | Timezone in search filtering | 1. Professional in ET available Mon 9AM-5PM ET. 2. Business in PT searches for Mon 9AM-5PM PT (= 12PM-8PM ET). Overlap mode. | Professional appears (overlap: 12PM-5PM ET). Tooltip shows converted times. |
| E2E-TZ-03 | Timezone in inbox | 1. Business (CT) invites Professional (MT). 2. Both open /inbox. | Both see schedule times converted to their own timezone with correct label |

### 3.4 Professional Onboarding to Searchable

| # | Script Name | Flow | Verification |
|---|---|---|---|
| E2E-09 | Complete onboarding | Register as professional → complete all 13 steps → sign agreement | Profile marked complete. Professional appears in business search results. |
| E2E-10 | Incomplete profile not searchable | Register as professional → complete only steps 1-5 | Professional does NOT appear in search results (profileComplete = false) |

### 3.5 Edge Cases & Error Handling

| # | Script Name | Flow | Verification |
|---|---|---|---|
| E2E-11 | Duplicate invite prevention | Business tries to invite same professional to same position twice | Second invite blocked (check via /api/invites/check) |
| E2E-12 | Can't delete published position | Business tries to delete a published position | Delete button not shown or action rejected |
| E2E-13 | MSA gate on search | Business without signed MSA tries to view professional profile | MSA modal appears, blocks access |
| E2E-14 | Session expiry | Let session expire, try to navigate | Redirects to /login |
| E2E-15 | Rate boundary | Professional sets rate of $0 or negative | Validation prevents saving |

---

## Test Data Requirements

To run these tests, the tester will need:

| Account Type | Timezone | Purpose |
|---|---|---|
| Business #1 | Americas/Eastern | Primary business tester |
| Business #2 | Americas/Pacific | Cross-timezone testing |
| Professional #1 | Americas/Eastern | Full profile, onboarded |
| Professional #2 | Americas/Pacific | Cross-timezone testing |
| Professional #3 | (new) | Fresh registration & onboarding flow |
| Admin #1 | any | Admin approval flows |

## Priority Order

**P0 — Test immediately (recent changes):**
- P-TZ-01 through P-TZ-07 (timezone conversion)
- P-PRO-INV-01 through P-PRO-INV-07 (professional invitation crash fix)
- P-JP-03 (Environment step Work Location crash fix)
- E2E-TZ-01 through E2E-TZ-03 (cross-timezone end-to-end)

**P1 — Core business flows:**
- E2E-01 through E2E-08 (posting → invite → hire lifecycle)
- P-SEARCH-01 through P-SEARCH-12 (search functionality)

**P2 — Everything else:**
- Onboarding, admin, edge cases, API-level validation
