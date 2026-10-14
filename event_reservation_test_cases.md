# Test Case Document

**Project Name:** Duyanan Restaurant (OORS-SF)  
**Module:** Event & Table Reservation System  
**Version:** 1.0  
**Prepared By:** Juan Dela Cruz  
**Date:** July 14, 2026  

---

### Document Information

| Item | Details |
| :--- | :--- |
| **Project** | Duyanan Restaurant (OORS-SF) |
| **Module** | Event & Table Reservation System |
| **Prepared By** | Juan Dela Cruz |
| **Reviewed By** | QA Lead |
| **Version** | 1.0 |
| **Date** | July 14, 2026 |

---

### Test Environment

| Item | Value |
| :--- | :--- |
| **Browser** | Google Chrome v138 |
| **Operating System** | Windows 11 |
| **Target URL** | http://localhost:5173/ |
| **Database** | duyanan_db (MySQL) |
| **Tester** | Juan Dela Cruz |

---

## 1. Traceability Matrix

This traceability matrix maps the 5 modules and 15 distinct requirements (features) to their respective test case groups.

| Module | Requirement ID | Feature Description | Test Case Range |
| :--- | :--- | :--- | :--- |
| **Module 1: User Auth & Profile** | REQ-AUTH-001 | User Registration & Verification | `TC_AUTH_001` - `TC_AUTH_003` |
| | REQ-AUTH-002 | User Login & JWT Validation | `TC_AUTH_004` - `TC_AUTH_006` |
| | REQ-AUTH-003 | User Profile Information & Logout | `TC_AUTH_007` - `TC_AUTH_009` |
| **Module 2: Reservation Booking** | REQ-BOOK-001 | Reservation Booking Form Details | `TC_BOOK_001` - `TC_BOOK_003` |
| | REQ-BOOK-002 | Seating & Time Constraints Logic | `TC_BOOK_004` - `TC_BOOK_006` |
| | REQ-BOOK-003 | Unauthenticated Booking Guards | `TC_BOOK_007` - `TC_BOOK_009` |
| **Module 3: User Booking Control** | REQ-MGMT-001 | View Reservation History List | `TC_MGMT_001` - `TC_MGMT_003` |
| | REQ-MGMT-002 | Modify Pending Reservations | `TC_MGMT_004` - `TC_MGMT_006` |
| | REQ-MGMT-003 | Cancel Reservation & Access Control | `TC_MGMT_007` - `TC_MGMT_009` |
| **Module 4: Event Customization** | REQ-PKG-001 | Event Package Customization UI | `TC_PKG_001` - `TC_PKG_003` |
| | REQ-PKG-002 | Selection Validations & Cart adding | `TC_PKG_004` - `TC_PKG_006` |
| | REQ-PKG-003 | API Fallback & Localized Pricing | `TC_PKG_007` - `TC_PKG_009` |
| **Module 5: Admin Panel & Control** | REQ-ADM-001 | Admin Reservations List Overview | `TC_ADM_001` - `TC_ADM_003` |
| | REQ-ADM-002 | Admin Booking Status Updates | `TC_ADM_004` - `TC_ADM_006` |
| | REQ-ADM-003 | Admin Booking Cancellations & Reasons | `TC_ADM_007` - `TC_ADM_009` |

---

## 2. Test Cases

---

### Module 1: User Authentication & Profile Management

#### Preconditions:
- Users table in the database is created.
- JWT security utility configuration is operational.

#### Test Cases:

| Test Case ID | Requirement ID | Test Scenario | Test Steps | Test Data | Expected Result | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC_AUTH_001** | REQ-AUTH-001 | Successful User Registration (Happy Path) | 1. Navigate to `/register`.<br>2. Fill first name, last name, unique email, and password.<br>3. Click "Register". | First Name: `John`<br>Last Name: `Doe`<br>Email: `johndoe@test.com`<br>Password: `Password123` | • User account is successfully created in DB.<br>• Success message shows, user is redirected to login page. | High |
| **TC_AUTH_002** | REQ-AUTH-001 | Registration with existing email | 1. Navigate to `/register`.<br>2. Enter email that is already registered.<br>3. Fill other fields and click "Register". | Email: `johndoe@test.com` (Existing) | • Error alert shows: *"Email is already taken!"* (or similar).<br>• Backend returns `400 Bad Request`. | High |
| **TC_AUTH_003** | REQ-AUTH-001 | Registration with invalid email format | 1. Navigate to `/register`.<br>2. Input an invalid email format.<br>3. Click "Register". | Email: `johndoetest.com` (No @ symbol) | • Browser/UI prevents form submission.<br>• If bypassed, backend returns validation error. | Medium |
| **TC_AUTH_004** | REQ-AUTH-002 | Successful User Login (Happy Path) | 1. Navigate to `/login`.<br>2. Fill valid email and password.<br>3. Click "Login". | Email: `johndoe@test.com`<br>Password: `Password123` | • User session starts.<br>• JWT is stored in `localStorage` under `duyanan_user`. | High |
| **TC_AUTH_005** | REQ-AUTH-002 | Login with incorrect password | 1. Navigate to `/login`.<br>2. Enter registered email with wrong password.<br>3. Click "Login". | Email: `johndoe@test.com`<br>Password: `WrongPass1` | • Error message displays: *"Invalid email or password"*.<br>• API returns `401 Unauthorized`. | High |
| **TC_AUTH_006** | REQ-AUTH-002 | Requesting protected API without token | 1. Send manual HTTP GET request to `/api/reservations/my-reservations` using Postman without header. | No Auth Header | • API returns `401 Unauthorized` or `403 Forbidden` response. | High |
| **TC_AUTH_007** | REQ-AUTH-003 | View Profile Details | 1. Log in successfully.<br>2. Navigate to `/profile`. | Logged-in user context | • Profile page displays user's full name, email, and roles correctly. | High |
| **TC_AUTH_008** | REQ-AUTH-003 | User Session Logout | 1. Click "Logout" in Navigation bar. | Active User session | • User token is removed from `localStorage`.<br>• User context is set to null.<br>• Redirected to homepage. | High |
| **TC_AUTH_009** | REQ-AUTH-003 | Secure User Profile Access | 1. Log in as User A.<br>2. Attempt to call backend endpoint `/api/users/profile/UserB_Id`. | Auth Header: User A JWT | • Server responds with `403 Forbidden`. | High |

---

### Module 2: Table & Event Reservation Booking

#### Preconditions:
- User is logged in (unless testing guest restrictions).
- Database table `reservations` is accessible.

#### Test Cases:

| Test Case ID | Requirement ID | Test Scenario | Test Steps | Test Data | Expected Result | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC_BOOK_001** | REQ-BOOK-001 | Successful Booking with valid details | 1. Navigate to `/book-reservation`.<br>2. Choose Event, Seating type, future Date & Time, Guests.<br>3. Click "Confirm Reservation". | Event: `Casual Dining`<br>Seating: `indoor`<br>Date: Tomorrow's date<br>Time: `19:00`<br>Guests: `4` | • Success alert shows.<br>• User is redirected to homepage.<br>• Reservation saved as `PENDING` in DB. | High |
| **TC_BOOK_002** | REQ-BOOK-001 | Attempt booking for past date | 1. Open booking form.<br>2. Choose yesterday's date.<br>3. Click "Confirm Reservation". | Date: Yesterday's date | • Alert appears: *"Reservation date and time cannot be in the past!"*<br>• Form submission blocked. | High |
| **TC_BOOK_003** | REQ-BOOK-001 | Attempt booking today with past time | 1. Open booking form.<br>2. Choose Today's date.<br>3. Set time to 2 hours ago (Manila Time).<br>4. Click "Confirm Reservation". | Date: Today's date<br>Time: 2 hours in the past | • Error alert shows: *"Reservation time cannot be in the past!"*<br>• Backend returns `400 Bad Request`. | High |
| **TC_BOOK_004** | REQ-BOOK-002 | Attempt duplicate booking for same time | 1. Create booking for John at Aug 20, 19:00.<br>2. Create a second booking for John at Aug 20, 19:00. | Date: `2026-08-20`<br>Time: `19:00`<br>Name: `John Doe` | • Backend blocks transaction.<br>• Toast displays duplicate reservation error. | Medium |
| **TC_BOOK_005** | REQ-BOOK-002 | Duplicate booking check with CANCELLED reservation | 1. Cancel booking at Aug 20, 19:00.<br>2. Place new booking at Aug 20, 19:00. | Date: `2026-08-20`<br>Time: `19:00`<br>Name: `John Doe` | • Reservation is successfully booked (cancelled booking is ignored in duplicate check). | Medium |
| **TC_BOOK_006** | REQ-BOOK-002 | Invalid Guest Count Validation | 1. Input Guest Count as `0` or negative number.<br>2. Attempt submission. | Guests: `-2` | • HTML5 input validation `min="1"` blocks submission.<br>• API returns `400 Bad Request` if bypassed. | High |
| **TC_BOOK_007** | REQ-BOOK-003 | View booking page as guest | 1. Access `/book-reservation` while logged out. | Guest context | • Top warning alert: *"You're viewing as a guest..."* is visible. | High |
| **TC_BOOK_008** | REQ-BOOK-003 | Guest click reservation submit | 1. Navigate to `/book-reservation` as guest.<br>2. Click on "Login to Reserve". | Guest context | • UI blocks booking, shows SweetAlert notification, and redirects user to `/login`. | High |
| **TC_BOOK_009** | REQ-BOOK-003 | Secure Reservation Post API | 1. Send POST request to `/api/reservations` without Auth token. | No Auth Header | • API returns `401 Unauthorized` / `403 Forbidden`. | High |

---

### Module 3: User Reservation Management

#### Preconditions:
- User is logged in and has existing reservations in the database.

#### Test Cases:

| Test Case ID | Requirement ID | Test Scenario | Test Steps | Test Data | Expected Result | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC_MGMT_001** | REQ-MGMT-001 | View own reservations on Profile page | 1. Navigate to `/profile`.<br>2. Review booking list in "My Reservations". | Authenticated User token | • Own reservations are rendered chronologically (newest first). | High |
| **TC_MGMT_002** | REQ-MGMT-001 | Empty reservation list display | 1. Login with a new account.<br>2. Navigate to `/profile`. | User with no bookings | • Screen displays placeholder message indicating no reservations. | Medium |
| **TC_MGMT_003** | REQ-MGMT-001 | Fetch specific booking details by ID | 1. Send GET request to `/api/reservations/{id}`. | Target reservation ID | • Detailed booking JSON is successfully returned to the client. | Medium |
| **TC_MGMT_004** | REQ-MGMT-002 | Edit a PENDING reservation | 1. On Profile page, click "Edit" on a pending booking.<br>2. Modify seating type.<br>3. Click "Update". | Original Seating: `Indoor`<br>New Seating: `Outdoor` | • SweetAlert indicates success.<br>• DB records are updated. | High |
| **TC_MGMT_005** | REQ-MGMT-002 | Prevent editing non-PENDING reservation | 1. Try to edit a reservation with status `CONFIRMED`. | Target reservation ID | • UI hides Edit button.<br>• Direct API update calls return error: *"Only pending reservations can be modified."* | High |
| **TC_MGMT_006** | REQ-MGMT-002 | Duplicate validation check on reservation update | 1. Edit a booking to matching date/time of another active booking. | Date: `2026-08-20`<br>Time: `19:00` | • Update is rejected.<br>• Alert displays duplicate reservation warning. | Medium |
| **TC_MGMT_007** | REQ-MGMT-003 | Cancel a PENDING reservation | 1. Click "Cancel Reservation" on a pending booking.<br>2. Confirm the action. | Target reservation ID | • Reservation status in DB is updated to `CANCELLED`.<br>• UI displays updated state. | High |
| **TC_MGMT_008** | REQ-MGMT-003 | Prevent cancellation of non-pending reservation | 1. Attempt to cancel booking with status `COMPLETED`. | Target reservation ID | • UI hides Cancel button.<br>• Direct cancel API call returns `400 Bad Request`. | High |
| **TC_MGMT_009** | REQ-MGMT-003 | Ownership access validation check on booking updates | 1. Login as User A.<br>2. Attempt to cancel User B's reservation using API PUT `/api/reservations/UserB_BookingId/cancel`. | Auth Header: User A JWT | • Request rejected.<br>• API returns `403 Forbidden` with: *"Unauthorized access."* | High |

---

### Module 4: Event Packages Customization

#### Preconditions:
- Event package items are configured in the database under "Event Packages" category.

#### Test Cases:

| Test Case ID | Requirement ID | Test Scenario | Test Steps | Test Data | Expected Result | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC_PKG_001** | REQ-PKG-001 | Classic Package item configuration limits | 1. Navigate to `/event-packages`.<br>2. Click "Configure Package" on Classic Celebration Package. | Package: Classic Celebration | • Modal opens with dropdowns for **2 Mains, 1 Side, and 1 Drink**. | Medium |
| **TC_PKG_002** | REQ-PKG-001 | Grand Package item configuration limits | 1. Click "Configure Package" on Grand Fiesta Package. | Package: Grand Fiesta | • Modal opens with dropdowns for **3 Mains, 2 Sides, and 2 Drinks**. | Medium |
| **TC_PKG_003** | REQ-PKG-001 | Royal Package item configuration limits | 1. Click "Configure Package" on Royal Banquet Package. | Package: Royal Banquet | • Modal opens with dropdowns for **4 Mains, 4 Sides, and 3 Drinks**. | Medium |
| **TC_PKG_004** | REQ-PKG-002 | Complete selections and add to cart | 1. Fill all required items dropdowns.<br>2. Click "Add to Cart". | Complete selections | • Package is added to shopping cart.<br>• Variant string compiles: `Mains: [M1], [M2] \| Sides: [S1] \| Drinks: [D1]`. | Medium |
| **TC_PKG_005** | REQ-PKG-002 | Incomplete package items validation | 1. Select only 1 Main Dish (Classic Celebration requires 2).<br>2. Click "Add to Cart". | Classic Package (1/2 Mains) | • Error popup displays: *"Incomplete Selections. Please select all items..."*<br>• Cart addition blocked. | Medium |
| **TC_PKG_006** | REQ-PKG-002 | Customization guest guard validation | 1. Log out.<br>2. Click "Configure Package" on any package. | Guest context | • Customization modal is blocked.<br>• Success toast warning shows redirect instructions. | High |
| **TC_PKG_007** | REQ-PKG-003 | Filter package search by keyword | 1. Input "Fiesta" in Search bar. | Search Query: `"Fiesta"` | • Page filters package listings; only "Grand Fiesta Package" is shown. | Low |
| **TC_PKG_008** | REQ-PKG-003 | Backend connection failure fallback | 1. Simulate API failure / Server offline.<br>2. Load `/event-packages`. | Network disconnected | • Client falls back to hardcoded mock packages details.<br>• Web page renders successfully. | High |
| **TC_PKG_009** | REQ-PKG-003 | Custom package price localization display | 1. Review packages pricing on screen. | Package price data | • Price formats with Philippine Peso symbol and commas (e.g. `₱12,500.00`). | Low |

---

### Module 5: Admin Panel & Reservations Control

#### Preconditions:
- User is logged in as an administrator.

#### Test Cases:

| Test Case ID | Requirement ID | Test Scenario | Test Steps | Test Data | Expected Result | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC_ADM_001** | REQ-ADM-001 | View all reservations in Admin Panel | 1. Navigate to `/admin`.<br>2. Select the "Reservations" tab. | Admin Token | • UI lists reservations from all users fetched from database. | High |
| **TC_ADM_002** | REQ-ADM-001 | Filter global reservations list | 1. In Reservations table, input user name or select status filter. | Filter: `"CONFIRMED"` | • Table is filtered to match the search query. | Medium |
| **TC_ADM_003** | REQ-ADM-001 | Standard user attempts admin URL | 1. Log in as standard user.<br>2. Attempt to navigate directly to `/admin`. | Standard user context | • Route guard blocks standard user and redirects to homepage. | High |
| **TC_ADM_004** | REQ-ADM-002 | Confirm user table booking | 1. Locate PENDING reservation.<br>2. Click "Confirm". | Target reservation ID | • Status changes to `CONFIRMED` in UI and database. | High |
| **TC_ADM_005** | REQ-ADM-002 | Complete a reservation status | 1. Select a CONFIRMED reservation.<br>2. Click "Complete" (or select status COMPLETED). | Target reservation ID | • Status saves as `COMPLETED` in database. | Medium |
| **TC_ADM_006** | REQ-ADM-002 | Secure Admin Status Update API | 1. Send PUT request to `/api/admin/reservations/{id}/status` using standard user token. | Standard user JWT | • Server returns `403 Forbidden` response. | High |
| **TC_ADM_007** | REQ-ADM-003 | Cancel user booking with cancellation reason | 1. Click "Cancel" on a booking.<br>2. Input cancellation reason in input dialog.<br>3. Confirm. | Reason: `"Weather conditions"` | • Status in database updates to `CANCELLED`.<br>• Cancellation reason is saved in database. | High |
| **TC_ADM_008** | REQ-ADM-003 | Cancel booking without reason validation | 1. Select "Cancel" on a booking.<br>2. Leave reason input field blank.<br>3. Submit. | Reason: `""` (Empty string) | • Backend returns `400 Bad Request` validation error.<br>• Status is not changed. | High |
| **TC_ADM_009** | REQ-ADM-003 | User viewing admin cancellation reason | 1. Log in as User A.<br>2. Navigate to profile page.<br>3. View cancelled booking. | Cancelled reservation | • User can read the cancellation reason provided by the administrator. | Medium |

---

## 3. Test Data

This table contains sample test data details used to simulate test scenarios.

| Description | Value |
| :--- | :--- |
| **Valid Registration Data** | `firstName: "John", lastName: "Doe", email: "johndoe@test.com", password: "Password123"` |
| **Invalid Registration Email** | `"johndoetest.com"` |
| **Duplicate Login Credentials** | `email: "johndoe@test.com", password: "Password123"` |
| **Invalid Login Password** | `email: "johndoe@test.com", password: "WrongPass1"` |
| **Valid Future Date** | Tomorrow's date (relative to test execution date) |
| **Past Booking Date** | Yesterday's date (relative to test execution date) |
| **Invalid Guests Count** | `0` or `-5` |
| **Classic Celebration Package limits** | `mains: 2`, `sides: 1`, `drinks: 1` |
| **Grand Fiesta Package limits** | `mains: 3`, `sides: 2`, `drinks: 2` |
| **Royal Banquet Package limits** | `mains: 4`, `sides: 4`, `drinks: 3` |
| **Admin Cancellation Reason** | `"Venue maintenance or weather warning"` |
