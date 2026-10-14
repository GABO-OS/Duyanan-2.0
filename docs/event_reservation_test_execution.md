# Test Execution Document

**Project Name:** Duyanan Restaurant (OORS-SF)  
**Module:** Event & Table Reservation System  
**Version:** 1.0  
**Executed By:** Juan Dela Cruz  
**Execution Date:** July 14, 2026  

---

### Document Information

| Item | Details |
| :--- | :--- |
| **Project** | Duyanan Restaurant (OORS-SF) |
| **Module** | Event & Table Reservation System |
| **Executed By** | Juan Dela Cruz |
| **Reviewed By** | QA Lead |
| **Version** | 1.0 |
| **Date** | July 14, 2026 |

---

### Execution Environment

| Item | Value |
| :--- | :--- |
| **Browser** | Google Chrome v138 |
| **Operating System** | Windows 11 |
| **Target URL** | http://localhost:5173/ |
| **Database** | duyanan_db (MySQL) |
| **Tester** | Juan Dela Cruz |

---

### Test Execution Summary

| Metric | Count | Percentage |
| :--- | :--- | :--- |
| **Total Test Cases** | 45 | 100% |
| **Passed** | 45 | 100% |
| **Failed** | 0 | 0% |
| **Blocked** | 0 | 0% |
| **Pass Rate** | **45 / 45** | **100%** |

---

## 1. Summary of Execution by Module

| Module | Test Cases | Executed | Passed | Failed | Blocked | Pass Rate | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Module 1: User Auth & Profile** | `TC_AUTH_001` - `TC_AUTH_009` | 9 | 9 | 0 | 0 | 100% | **PASSED** |
| **Module 2: Reservation Booking** | `TC_BOOK_001` - `TC_BOOK_009` | 9 | 9 | 0 | 0 | 100% | **PASSED** |
| **Module 3: User Booking Control** | `TC_MGMT_001` - `TC_MGMT_009` | 9 | 9 | 0 | 0 | 100% | **PASSED** |
| **Module 4: Event Customization** | `TC_PKG_001` - `TC_PKG_009` | 9 | 9 | 0 | 0 | 100% | **PASSED** |
| **Module 5: Admin Panel & Control** | `TC_ADM_001` - `TC_ADM_009` | 9 | 9 | 0 | 0 | 100% | **PASSED** |

---

## 2. Detailed Test Execution Log

Below is the detailed log of the execution results for all 45 test cases, including direct links to each test case's execution screenshot.

### Module 1: User Authentication & Profile Management

| Test Case ID | Requirement ID | Test Scenario | Status | Actual Result / Remarks | Screenshot Reference | Date Executed |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC_AUTH_001** | REQ-AUTH-001 | Successful User Registration (Happy Path) | **PASS** | User account successfully created in MySQL database with password hashed. Frontend displays a SweetAlert success modal and redirects the user to `/login`. | [tc_auth_001.png](file:///C:/Users/D15%20i5/OneDrive/Desktop/Documents/OORS-SF/screenshots/tc_auth_001.png) | July 14, 2026 |
| **TC_AUTH_002** | REQ-AUTH-001 | Registration with existing email | **PASS** | Registration fails. SweetAlert popup displays *"Email is already taken!"* and the backend API responds with `400 Bad Request`. | [tc_auth_002.png](file:///C:/Users/D15%20i5/OneDrive/Desktop/Documents/OORS-SF/screenshots/tc_auth_002.png) | July 14, 2026 |
| **TC_AUTH_003** | REQ-AUTH-001 | Registration with invalid email format | **PASS** | Native HTML5 browser validation intercepts and prevents form submission with tooltip warning. Backend validation acts as fallback. | [tc_auth_003.png](file:///C:/Users/D15%20i5/OneDrive/Desktop/Documents/OORS-SF/screenshots/tc_auth_003.png) | July 14, 2026 |
| **TC_AUTH_004** | REQ-AUTH-002 | Successful User Login (Happy Path) | **PASS** | Login succeeds. JWT token is successfully stored in `localStorage` under `duyanan_user` key, and user session context starts. | [tc_auth_004.png](file:///C:/Users/D15%20i5/OneDrive/Desktop/Documents/OORS-SF/screenshots/tc_auth_004.png) | July 14, 2026 |
| **TC_AUTH_005** | REQ-AUTH-002 | Login with incorrect password | **PASS** | Access denied. Frontend renders *"Invalid email or password"* error message, and backend API returns `401 Unauthorized`. | [tc_auth_005.png](file:///C:/Users/D15%20i5/OneDrive/Desktop/Documents/OORS-SF/screenshots/tc_auth_005.png) | July 14, 2026 |
| **TC_AUTH_006** | REQ-AUTH-002 | Requesting protected API without token | **PASS** | Backend security filter intercepts manual Postman request to `/api/reservations/my-reservations` and returns `401 Unauthorized`. | [tc_auth_006.png](file:///C:/Users/D15%20i5/OneDrive/Desktop/Documents/OORS-SF/screenshots/tc_auth_006.png) | July 14, 2026 |
| **TC_AUTH_007** | REQ-AUTH-003 | View Profile Details | **PASS** | Profile page successfully fetches user data and displays full name, email, and roles ("CUSTOMER") accurately. | [tc_auth_007.png](file:///C:/Users/D15%20i5/OneDrive/Desktop/Documents/OORS-SF/screenshots/tc_auth_007.png) | July 14, 2026 |
| **TC_AUTH_008** | REQ-AUTH-003 | User Session Logout | **PASS** | Token is cleared from `localStorage`, React auth context is set to null, and client is redirected to homepage immediately. | [tc_auth_008.png](file:///C:/Users/D15%20i5/OneDrive/Desktop/Documents/OORS-SF/screenshots/tc_auth_008.png) | July 14, 2026 |
| **TC_AUTH_009** | REQ-AUTH-003 | Secure User Profile Access | **PASS** | Request by User A to fetch profile of User B using endpoint `/api/users/profile/UserB_Id` is blocked by backend with `403 Forbidden`. | [tc_auth_009.png](file:///C:/Users/D15%20i5/OneDrive/Desktop/Documents/OORS-SF/screenshots/tc_auth_009.png) | July 14, 2026 |

---

### Module 2: Table & Event Reservation Booking

| Test Case ID | Requirement ID | Test Scenario | Status | Actual Result / Remarks | Screenshot Reference | Date Executed |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC_BOOK_001** | REQ-BOOK-001 | Successful Booking with valid details | **PASS** | Reservation created as `PENDING` in MySQL DB. SweetAlert displays success notification and redirects user to profile/home. | [tc_book_001.png](file:///C:/Users/D15%20i5/OneDrive/Desktop/Documents/OORS-SF/screenshots/tc_book_001.png) | July 14, 2026 |
| **TC_BOOK_002** | REQ-BOOK-001 | Attempt booking for past date | **PASS** | Datepicker disables past dates on calendar UI. Form submission blocked. Warning alert *"Reservation date and time cannot be in the past!"* shown. | [tc_book_002.png](file:///C:/Users/D15%20i5/OneDrive/Desktop/Documents/OORS-SF/screenshots/tc_book_002.png) | July 14, 2026 |
| **TC_BOOK_003** | REQ-BOOK-001 | Attempt booking today with past time | **PASS** | Frontend validation blocks submission. Backend returns `400 Bad Request` with error details *"Reservation time cannot be in the past!"*. | [tc_book_003.png](file:///C:/Users/D15%20i5/OneDrive/Desktop/Documents/OORS-SF/screenshots/tc_book_003.png) | July 14, 2026 |
| **TC_BOOK_004** | REQ-BOOK-002 | Attempt duplicate booking for same time | **PASS** | Double-booking check in backend throws exception; transaction is rolled back. Frontend displays SweetAlert warning toast. | [tc_book_004.png](file:///C:/Users/D15%20i5/OneDrive/Desktop/Documents/OORS-SF/screenshots/tc_book_004.png) | July 14, 2026 |
| **TC_BOOK_005** | REQ-BOOK-002 | Duplicate booking check with CANCELLED reservation | **PASS** | Booking successfully created because database query ignores reservations with status `CANCELLED` during duplicate validation checks. | [tc_book_005.png](file:///C:/Users/D15%20i5/OneDrive/Desktop/Documents/OORS-SF/screenshots/tc_book_005.png) | July 14, 2026 |
| **TC_BOOK_006** | REQ-BOOK-002 | Invalid Guest Count Validation | **PASS** | HTML5 native `min="1"` validation blocks form submission. Server-side JSR 380 `@Min(1)` validation returns `400 Bad Request` as fallback. | [tc_book_006.png](file:///C:/Users/D15%20i5/OneDrive/Desktop/Documents/OORS-SF/screenshots/tc_book_006.png) | July 14, 2026 |
| **TC_BOOK_007** | REQ-BOOK-003 | View booking page as guest | **PASS** | Warning alert banner *"You're viewing as a guest..."* is clearly visible at the top of `/book-reservation` to unauthenticated visitors. | [tc_book_007.png](file:///C:/Users/D15%20i5/OneDrive/Desktop/Documents/OORS-SF/screenshots/tc_book_007.png) | July 14, 2026 |
| **TC_BOOK_008** | REQ-BOOK-003 | Guest click reservation submit | **PASS** | Submission is blocked. SweetAlert informs user that authentication is required and redirects them directly to the `/login` page. | [tc_book_008.png](file:///C:/Users/D15%20i5/OneDrive/Desktop/Documents/OORS-SF/screenshots/tc_book_008.png) | July 14, 2026 |
| **TC_BOOK_009** | REQ-BOOK-003 | Secure Reservation Post API | **PASS** | Manual HTTP POST to `/api/reservations` without authorization header is intercepted by Spring Security and returns `401 Unauthorized`. | [tc_book_009.png](file:///C:/Users/D15%20i5/OneDrive/Desktop/Documents/OORS-SF/screenshots/tc_book_009.png) | July 14, 2026 |

---

### Module 3: User Reservation Management

| Test Case ID | Requirement ID | Test Scenario | Status | Actual Result / Remarks | Screenshot Reference | Date Executed |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC_MGMT_001** | REQ-MGMT-001 | View own reservations on Profile page | **PASS** | Profile fetches user's list of reservations successfully and renders them chronologically, with the newest reservations on top. | [tc_mgmt_001.png](file:///C:/Users/D15%20i5/OneDrive/Desktop/Documents/OORS-SF/screenshots/tc_mgmt_001.png) | July 14, 2026 |
| **TC_MGMT_002** | REQ-MGMT-001 | Empty reservation list display | **PASS** | For accounts with no reservations, profile page displays a clean, user-friendly placeholder: *"You have no reservations booked yet."* | [tc_mgmt_002.png](file:///C:/Users/D15%20i5/OneDrive/Desktop/Documents/OORS-SF/screenshots/tc_mgmt_002.png) | July 14, 2026 |
| **TC_MGMT_003** | REQ-MGMT-001 | Fetch specific booking details by ID | **PASS** | Endpoint `/api/reservations/{id}` returns the complete reservation details as a JSON object, mapped to the response model. | [tc_mgmt_003.png](file:///C:/Users/D15%20i5/OneDrive/Desktop/Documents/OORS-SF/screenshots/tc_mgmt_003.png) | July 14, 2026 |
| **TC_MGMT_004** | REQ-MGMT-002 | Edit a PENDING reservation | **PASS** | Changes (e.g. updating seating type to `Outdoor`) are saved in the DB. SweetAlert displays success message. | [tc_mgmt_004.png](file:///C:/Users/D15%20i5/OneDrive/Desktop/Documents/OORS-SF/screenshots/tc_mgmt_004.png) | July 14, 2026 |
| **TC_MGMT_005** | REQ-MGMT-002 | Prevent editing non-PENDING reservation | **PASS** | The "Edit" button is dynamically hidden in UI for `CONFIRMED` and `COMPLETED` bookings. API rejects edits with `400 Bad Request`. | [tc_mgmt_005.png](file:///C:/Users/D15%20i5/OneDrive/Desktop/Documents/OORS-SF/screenshots/tc_mgmt_005.png) | July 14, 2026 |
| **TC_MGMT_006** | REQ-MGMT-002 | Duplicate validation check on reservation update | **PASS** | Attempting to update a reservation to a time slot that conflicts with another of the user's bookings returns error message and is rejected. | [tc_mgmt_006.png](file:///C:/Users/D15%20i5/OneDrive/Desktop/Documents/OORS-SF/screenshots/tc_mgmt_006.png) | July 14, 2026 |
| **TC_MGMT_007** | REQ-MGMT-003 | Cancel a PENDING reservation | **PASS** | User clicks "Cancel" and confirms. Reservation status is updated to `CANCELLED` in DB, and profile UI updates in real-time. | [tc_mgmt_007.png](file:///C:/Users/D15%20i5/OneDrive/Desktop/Documents/OORS-SF/screenshots/tc_mgmt_007.png) | July 14, 2026 |
| **TC_MGMT_008** | REQ-MGMT-003 | Prevent cancellation of non-pending reservation | **PASS** | Cancel buttons are omitted from UI for `COMPLETED` bookings. Direct endpoint PUT requests to `/api/reservations/{id}/cancel` return `400`. | [tc_mgmt_008.png](file:///C:/Users/D15%20i5/OneDrive/Desktop/Documents/OORS-SF/screenshots/tc_mgmt_008.png) | July 14, 2026 |
| **TC_MGMT_009** | REQ-MGMT-003 | Ownership access validation check on booking updates | **PASS** | Backend verifies user ID from JWT against the reservation owner. Request by User A to cancel User B's reservation yields `403 Forbidden`. | [tc_mgmt_009.png](file:///C:/Users/D15%20i5/OneDrive/Desktop/Documents/OORS-SF/screenshots/tc_mgmt_009.png) | July 14, 2026 |

---

### Module 4: Event Packages Customization

| Test Case ID | Requirement ID | Test Scenario | Status | Actual Result / Remarks | Screenshot Reference | Date Executed |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC_PKG_001** | REQ-PKG-001 | Classic Package item configuration limits | **PASS** | Customization modal restrict selections dynamically. Displays dropdown elements for exactly 2 Mains, 1 Side, and 1 Drink. | [tc_pkg_001.png](file:///C:/Users/D15%20i5/OneDrive/Desktop/Documents/OORS-SF/screenshots/tc_pkg_001.png) | July 14, 2026 |
| **TC_PKG_002** | REQ-PKG-001 | Grand Package item configuration limits | **PASS** | Customization modal restrict selections dynamically. Displays dropdown elements for exactly 3 Mains, 2 Sides, and 2 Drinks. | [tc_pkg_002.png](file:///C:/Users/D15%20i5/OneDrive/Desktop/Documents/OORS-SF/screenshots/tc_pkg_002.png) | July 14, 2026 |
| **TC_PKG_003** | REQ-PKG-001 | Royal Package item configuration limits | **PASS** | Customization modal restrict selections dynamically. Displays dropdown elements for exactly 4 Mains, 4 Sides, and 3 Drinks. | [tc_pkg_003.png](file:///C:/Users/D15%20i5/OneDrive/Desktop/Documents/OORS-SF/screenshots/tc_pkg_003.png) | July 14, 2026 |
| **TC_PKG_004** | REQ-PKG-002 | Complete selections and add to cart | **PASS** | Item added to shopping cart with generated details string. String matches: `Mains: [M1], [M2] \| Sides: [S1] \| Drinks: [D1]`. | [tc_pkg_004.png](file:///C:/Users/D15%20i5/OneDrive/Desktop/Documents/OORS-SF/screenshots/tc_pkg_004.png) | July 14, 2026 |
| **TC_PKG_005** | REQ-PKG-002 | Incomplete package items validation | **PASS** | Selection with empty fields triggers SweetAlert warning *"Incomplete Selections. Please select all items..."* and prevents cart addition. | [tc_pkg_005.png](file:///C:/Users/D15%20i5/OneDrive/Desktop/Documents/OORS-SF/screenshots/tc_pkg_005.png) | July 14, 2026 |
| **TC_PKG_006** | REQ-PKG-002 | Customization guest guard validation | **PASS** | Guest customization click is intercepted. Form does not open, alert toast warns user to login first, and page redirects. | [tc_pkg_006.png](file:///C:/Users/D15%20i5/OneDrive/Desktop/Documents/OORS-SF/screenshots/tc_pkg_006.png) | July 14, 2026 |
| **TC_PKG_007** | REQ-PKG-003 | Filter package search by keyword | **PASS** | Searching for keyword *"Fiesta"* instantly filters grid to render only the "Grand Fiesta Package" on screen. | [tc_pkg_007.png](file:///C:/Users/D15%20i5/OneDrive/Desktop/Documents/OORS-SF/screenshots/tc_pkg_007.png) | July 14, 2026 |
| **TC_PKG_008** | REQ-PKG-003 | Backend connection failure fallback | **PASS** | Simulated backend offline state triggers local hardcoded mock data fallback. Client interface renders mock event packages seamlessly. | [tc_pkg_008.png](file:///C:/Users/D15%20i5/OneDrive/Desktop/Documents/OORS-SF/screenshots/tc_pkg_008.png) | July 14, 2026 |
| **TC_PKG_009** | REQ-PKG-003 | Custom package price localization display | **PASS** | Package pricing details render with standard currency format including comma separation and peso sign (e.g. `₱12,500.00`). | [tc_pkg_009.png](file:///C:/Users/D15%20i5/OneDrive/Desktop/Documents/OORS-SF/screenshots/tc_pkg_009.png) | July 14, 2026 |

---

### Module 5: Admin Panel & Reservations Control

| Test Case ID | Requirement ID | Test Scenario | Status | Actual Result / Remarks | Screenshot Reference | Date Executed |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC_ADM_001** | REQ-ADM-001 | View all reservations in Admin Panel | **PASS** | Admin Dashboard renders a central table populated with reservations made by all users registered in the database. | [tc_adm_001.png](file:///C:/Users/D15%20i5/OneDrive/Desktop/Documents/OORS-SF/screenshots/tc_adm_001.png) | July 14, 2026 |
| **TC_ADM_002** | REQ-ADM-001 | Filter global reservations list | **PASS** | Status filter for *"CONFIRMED"* hides other statuses immediately and lists only the matching active confirmed reservations. | [tc_adm_002.png](file:///C:/Users/D15%20i5/OneDrive/Desktop/Documents/OORS-SF/screenshots/tc_adm_002.png) | July 14, 2026 |
| **TC_ADM_003** | REQ-ADM-001 | Standard user attempts admin URL | **PASS** | React route guards detect lack of ADMIN role, intercept direct routing to `/admin`, and redirect standard users back to `/`. | [tc_adm_003.png](file:///C:/Users/D15%20i5/OneDrive/Desktop/Documents/OORS-SF/screenshots/tc_adm_003.png) | July 14, 2026 |
| **TC_ADM_004** | REQ-ADM-002 | Confirm user table booking | **PASS** | Admin clicks "Confirm" button. Status updates to `CONFIRMED` in the database and updates status badge in admin view. | [tc_adm_004.png](file:///C:/Users/D15%20i5/OneDrive/Desktop/Documents/OORS-SF/screenshots/tc_adm_004.png) | July 14, 2026 |
| **TC_ADM_005** | REQ-ADM-002 | Complete a reservation status | **PASS** | Booking status successfully set to `COMPLETED` in database. Row displays completed styling, locking it from further changes. | [tc_adm_005.png](file:///C:/Users/D15%20i5/OneDrive/Desktop/Documents/OORS-SF/screenshots/tc_adm_005.png) | July 14, 2026 |
| **TC_ADM_006** | REQ-ADM-002 | Secure Admin Status Update API | **PASS** | API endpoint `/api/admin/reservations/{id}/status` blocks PUT requests from standard customer credentials with `403 Forbidden`. | [tc_adm_006.png](file:///C:/Users/D15%20i5/OneDrive/Desktop/Documents/OORS-SF/screenshots/tc_adm_006.png) | July 14, 2026 |
| **TC_ADM_007** | REQ-ADM-003 | Cancel user booking with cancellation reason | **PASS** | Reservation canceled. Status changes to `CANCELLED` in DB, and the specified reason *"Weather conditions"* is saved in table row. | [tc_adm_007.png](file:///C:/Users/D15%20i5/OneDrive/Desktop/Documents/OORS-SF/screenshots/tc_adm_007.png) | July 14, 2026 |
| **TC_ADM_008** | REQ-ADM-003 | Cancel booking without reason validation | **PASS** | Submitting empty string in cancellation reason text box is blocked by front-end validation. API returns `400 Bad Request`. | [tc_adm_008.png](file:///C:/Users/D15%20i5/OneDrive/Desktop/Documents/OORS-SF/screenshots/tc_adm_008.png) | July 14, 2026 |
| **TC_ADM_009** | REQ-ADM-003 | User viewing admin cancellation reason | **PASS** | Registered user views their booking card on profile page and sees the administrator's cancellation reason rendered clearly. | [tc_adm_009.png](file:///C:/Users/D15%20i5/OneDrive/Desktop/Documents/OORS-SF/screenshots/tc_adm_009.png) | July 14, 2026 |

---

### Exit Criteria Evaluation

Testing for the Event & Table Reservation System is considered complete and ready for deployment based on the following verified criteria:

- [x] **All 45 test cases across 5 modules have been executed.**
- [x] **100% Pass Rate** has been achieved (45/45 test cases passed).
- [x] **Zero active defects** (Critical, High, Medium, or Low severity) remain unresolved.
- [x] **All security boundaries** (unauthenticated access, guest restrictions, RBAC authorization, token verification) function correctly.
- [x] **Test Execution Report / Document** has been finalized and logged.
