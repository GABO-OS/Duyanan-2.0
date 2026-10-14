const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOTS_DIR = 'c:/Users/D15 i5/OneDrive/Desktop/Documents/OORS-SF/screenshots';

if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
    console.log('Launching Chrome from:', CHROME_PATH);
    const browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: true,
        defaultViewport: { width: 1536, height: 730 }
    });

    const page = await browser.newPage();
    console.log('Browser tab created.');

    const snap = async (filename) => {
        await delay(1200); // Allow modals/alerts/transitions to fully render
        const filepath = path.join(SCREENSHOTS_DIR, filename);
        await page.screenshot({ path: filepath });
        console.log(`Saved screenshot: ${filename} to ${filepath}`);
    };

    const goToReservationsTab = async () => {
        await page.goto('http://localhost:5173/profile');
        await page.waitForSelector('.profile-sidebar-btn', { timeout: 5000 });
        await page.evaluate(() => {
            const sidebarBtns = Array.from(document.querySelectorAll('.profile-sidebar-btn'));
            const resBtn = sidebarBtns.find(b => b.textContent.includes('Reservations'));
            if (resBtn) resBtn.click();
        });
        await page.waitForSelector('.reservation-card, .text-center', { timeout: 5000 });
        await delay(500);
    };

    const gotoWithIdle = async (url) => {
        await page.goto(url, { waitUntil: 'networkidle0' });
        await delay(600);
    };

    const typeText = async (selector, text) => {
        await page.waitForSelector(selector);
        await page.evaluate((sel, val) => {
            const input = document.querySelector(sel);
            if (input) {
                const isTextArea = input.tagName.toLowerCase() === 'textarea';
                const prototype = isTextArea ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
                if (nativeInputValueSetter) {
                    nativeInputValueSetter.call(input, val);
                } else {
                    input.value = val;
                }
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }, selector, text);
        await delay(150);
    };

    const logout = async () => {
        await gotoWithIdle('http://localhost:5173/');
        await page.evaluate(() => localStorage.clear());
    };

    const loginAs = async (email, password) => {
        await logout();
        await gotoWithIdle('http://localhost:5173/login');
        await typeText('input[placeholder="Email Address"]', email);
        await typeText('input[placeholder="Password"]', password);
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'debug_login.png') });
        await page.click('button[type="submit"]');
        await page.waitForFunction(() => localStorage.getItem('duyanan_user') !== null, { timeout: 5000 });
        await delay(800);
    };

    try {
        // Clear cookies/localStorage to start fresh
        await logout();

        // ==========================================
        // MODULE 1: AUTH & PROFILE
        // ==========================================

        // TC_AUTH_001: Successful User Registration (Happy Path)
        console.log('TC_AUTH_001...');
        await gotoWithIdle('http://localhost:5173/register');
        await typeText('input[placeholder="First Name"]', 'John');
        await typeText('input[placeholder="Last Name"]', 'Doe');
        await typeText('input[placeholder="Email Address"]', 'johndoe@test.com');
        await typeText('input[placeholder="Password"]', 'Password123');
        await typeText('input[placeholder="Confirm Password"]', 'Password123');
        await page.click('button[type="submit"]');
        await snap('tc_auth_001.png');

        // Dismiss SweetAlert
        const okButton = await page.$('.swal2-confirm');
        if (okButton) await okButton.click();

        // TC_AUTH_002: Registration with existing email
        console.log('TC_AUTH_002...');
        await gotoWithIdle('http://localhost:5173/register');
        await typeText('input[placeholder="First Name"]', 'John');
        await typeText('input[placeholder="Last Name"]', 'Doe');
        await typeText('input[placeholder="Email Address"]', 'johndoe@test.com');
        await typeText('input[placeholder="Password"]', 'Password123');
        await typeText('input[placeholder="Confirm Password"]', 'Password123');
        await page.click('button[type="submit"]');
        await snap('tc_auth_002.png');

        // Dismiss SweetAlert
        const errOkButton = await page.$('.swal2-confirm');
        if (errOkButton) await errOkButton.click();

        // TC_AUTH_003: Registration with invalid email format
        console.log('TC_AUTH_003...');
        await gotoWithIdle('http://localhost:5173/register');
        await typeText('input[placeholder="First Name"]', 'John');
        await typeText('input[placeholder="Last Name"]', 'Doe');
        await typeText('input[placeholder="Email Address"]', 'johndoetest.com'); // Invalid email
        await typeText('input[placeholder="Password"]', 'Password123');
        await typeText('input[placeholder="Confirm Password"]', 'Password123');
        await page.click('button[type="submit"]');
        await snap('tc_auth_003.png');

        // TC_AUTH_004: Successful User Login (Happy Path)
        console.log('TC_AUTH_004...');
        await loginAs('johndoe@test.com', 'Password123');
        await snap('tc_auth_004.png');

        // TC_AUTH_005: Login with incorrect password
        console.log('TC_AUTH_005...');
        // Log out first
        await logout();
        await gotoWithIdle('http://localhost:5173/login');
        await typeText('input[placeholder="Email Address"]', 'johndoe@test.com');
        await typeText('input[placeholder="Password"]', 'WrongPass1');
        await page.click('button[type="submit"]');
        await snap('tc_auth_005.png');

        // TC_AUTH_006: Requesting protected API without token
        console.log('TC_AUTH_006...');
        await page.goto('http://localhost:8080/api/reservations/my-reservations');
        await snap('tc_auth_006.png');

        // TC_AUTH_007: View Profile Details
        console.log('TC_AUTH_007...');
        await loginAs('johndoe@test.com', 'Password123');
        await page.goto('http://localhost:5173/profile');
        await snap('tc_auth_007.png');

        // TC_AUTH_008: User Session Logout
        console.log('TC_AUTH_008...');
        const logoutBtn = await page.$('a[href="/"], button, .nav-link'); // Look for logout
        await page.evaluate(() => {
            // Find logout button in UI or just call logout function/click it
            const links = Array.from(document.querySelectorAll('a, button, span'));
            const logoutLink = links.find(el => el.textContent.toLowerCase().includes('logout'));
            if (logoutLink) logoutLink.click();
            else {
                localStorage.clear();
                window.location.href = '/';
            }
        });
        await page.waitForNavigation().catch(() => {});
        await snap('tc_auth_008.png');

        // TC_AUTH_009: Secure User Profile Access
        console.log('TC_AUTH_009...');
        await page.goto('http://localhost:8080/api/users/profile/some_other_id');
        await snap('tc_auth_009.png');


        // ==========================================
        // MODULE 2: RESERVATION BOOKING
        // ==========================================

        // Log back in as customer for reservation tests
        await loginAs('johndoe@test.com', 'Password123');

        // TC_BOOK_001: Successful Booking with valid details
        console.log('TC_BOOK_001...');
        await gotoWithIdle('http://localhost:5173/book-reservation');
        await page.select('select[name="eventType"]', 'Casual Dining 🍽️');
        await page.select('select[name="seatingType"]', 'indoor');
        await typeText('input[name="date"]', '2026-08-20');
        await typeText('input[name="time"]', '19:00');
        await typeText('input[name="guests"]', '4');
        await typeText('textarea[name="request"]', 'Window seat please');
        await page.click('button[type="submit"]');
        await snap('tc_book_001.png');

        // Dismiss SweetAlert
        const bookConfirmBtn = await page.$('.swal2-confirm');
        if (bookConfirmBtn) await bookConfirmBtn.click();

        // TC_BOOK_002: Attempt booking for past date
        console.log('TC_BOOK_002...');
        await gotoWithIdle('http://localhost:5173/book-reservation');
        await page.select('select[name="eventType"]', 'Casual Dining 🍽️');
        await page.select('select[name="seatingType"]', 'indoor');
        // Force inject past date in date input
        await page.evaluate(() => {
            const dateInput = document.querySelector('input[name="date"]');
            dateInput.removeAttribute('min');
            dateInput.value = '2025-01-01';
        });
        await typeText('input[name="time"]', '12:00');
        await typeText('input[name="guests"]', '4');
        await page.click('button[type="submit"]');
        await snap('tc_book_002.png');

        const bookErrBtn1 = await page.$('.swal2-confirm');
        if (bookErrBtn1) await bookErrBtn1.click();

        // TC_BOOK_003: Attempt booking today with past time
        console.log('TC_BOOK_003...');
        await gotoWithIdle('http://localhost:5173/book-reservation');
        await page.select('select[name="eventType"]', 'Casual Dining 🍽️');
        await page.select('select[name="seatingType"]', 'indoor');
        
        const todayStr = new Date().toISOString().split('T')[0];
        await typeText('input[name="date"]', todayStr);
        await typeText('input[name="time"]', '01:00'); // 1 AM is past for local time
        await typeText('input[name="guests"]', '4');
        await page.click('button[type="submit"]');
        await snap('tc_book_003.png');

        const bookErrBtn2 = await page.$('.swal2-confirm');
        if (bookErrBtn2) await bookErrBtn2.click();

        // TC_BOOK_004: Attempt duplicate booking for same time
        console.log('TC_BOOK_004...');
        await gotoWithIdle('http://localhost:5173/book-reservation');
        await page.select('select[name="eventType"]', 'Casual Dining 🍽️');
        await page.select('select[name="seatingType"]', 'indoor');
        await typeText('input[name="date"]', '2026-08-20');
        await typeText('input[name="time"]', '19:00');
        await typeText('input[name="guests"]', '4');
        await page.click('button[type="submit"]');
        await snap('tc_book_004.png');

        const bookErrBtn3 = await page.$('.swal2-confirm');
        if (bookErrBtn3) await bookErrBtn3.click();

        // TC_BOOK_005: Duplicate booking check with CANCELLED reservation
        console.log('TC_BOOK_005...');
        // Direct cancel via mock database endpoint to reset the booking conflict
        await page.goto('http://localhost:8080/api/reservations/2/cancel'); // Mark booking ID 2 (duplicate) as cancelled
        await gotoWithIdle('http://localhost:5173/book-reservation');
        await page.select('select[name="eventType"]', 'Casual Dining 🍽️');
        await page.select('select[name="seatingType"]', 'indoor');
        await typeText('input[name="date"]', '2026-08-20');
        await typeText('input[name="time"]', '19:00');
        await typeText('input[name="guests"]', '4');
        await page.click('button[type="submit"]');
        await snap('tc_book_005.png');

        const bookConfirmBtn2 = await page.$('.swal2-confirm');
        if (bookConfirmBtn2) await bookConfirmBtn2.click();

        // TC_BOOK_006: Invalid Guest Count Validation
        console.log('TC_BOOK_006...');
        await gotoWithIdle('http://localhost:5173/book-reservation');
        await page.select('select[name="eventType"]', 'Casual Dining 🍽️');
        await page.select('select[name="seatingType"]', 'indoor');
        await typeText('input[name="date"]', '2026-08-20');
        await typeText('input[name="time"]', '19:00');
        await typeText('input[name="guests"]', '0'); // Invalid count
        await page.click('button[type="submit"]');
        await snap('tc_book_006.png');

        // TC_BOOK_007: View booking page as guest
        console.log('TC_BOOK_007...');
        await logout();
        await page.goto('http://localhost:5173/book-reservation', { waitUntil: 'networkidle0' });
        await snap('tc_book_007.png');

        // TC_BOOK_008: Guest click reservation submit
        console.log('TC_BOOK_008...');
        await page.click('button[type="submit"]');
        await snap('tc_book_008.png');

        const loginRedirectBtn = await page.$('.swal2-confirm');
        if (loginRedirectBtn) await loginRedirectBtn.click();

        // TC_BOOK_009: Secure Reservation Post API
        console.log('TC_BOOK_009...');
        await page.goto('http://localhost:8080/api/reservations');
        await snap('tc_book_009.png');


        // ==========================================
        // MODULE 3: USER RESERVATION MANAGEMENT
        // ==========================================

        // Log back in
        await loginAs('johndoe@test.com', 'Password123');

        // TC_MGMT_001: View own reservations on Profile page
        console.log('TC_MGMT_001...');
        await goToReservationsTab();
        await snap('tc_mgmt_001.png');

        // TC_MGMT_002: Empty reservation list display
        console.log('TC_MGMT_002...');
        // Register and login a new user with no bookings
        await logout();
        await gotoWithIdle('http://localhost:5173/register');
        await typeText('input[placeholder="First Name"]', 'Empty');
        await typeText('input[placeholder="Last Name"]', 'User');
        await typeText('input[placeholder="Email Address"]', 'empty@test.com');
        await typeText('input[placeholder="Password"]', 'Password123');
        await typeText('input[placeholder="Confirm Password"]', 'Password123');
        await page.click('button[type="submit"]');
        await delay(1000);
        const emptyOk = await page.$('.swal2-confirm');
        if (emptyOk) await emptyOk.click();

        await loginAs('empty@test.com', 'Password123');
        await goToReservationsTab();
        await snap('tc_mgmt_002.png');

        // TC_MGMT_003: Fetch specific booking details by ID
        console.log('TC_MGMT_003...');
        await page.goto('http://localhost:8080/api/reservations/1');
        await snap('tc_mgmt_003.png');

        // Log back in as John Doe
        await loginAs('johndoe@test.com', 'Password123');

        // TC_MGMT_004: Edit a PENDING reservation
        console.log('TC_MGMT_004...');
        await goToReservationsTab();
        // Click the first "Edit Details" button
        await page.click('.btn-edit-reservation');
        await delay(800);
        // Change Seating type to Outdoor in modal
        await page.select('select[name="seatingType"]', 'outdoor');
        await page.click('button[type="submit"]'); // Save change
        await snap('tc_mgmt_004.png');

        const editConfirmBtn = await page.$('.swal2-confirm');
        if (editConfirmBtn) await editConfirmBtn.click();

        // TC_MGMT_005: Prevent editing non-PENDING reservation
        console.log('TC_MGMT_005...');
        // Change reservation status to CONFIRMED on port 8080 via script, then inspect UI
        await page.goto('http://localhost:8080/api/admin/reservations/1/status');
        await page.evaluate(async () => {
            // Set status to CONFIRMED directly in backend memory
            await fetch('http://localhost:8080/api/admin/reservations/1/status', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer admin@duyanan.com' },
                body: JSON.stringify({ status: 'CONFIRMED' })
            });
        });
        await goToReservationsTab();
        await snap('tc_mgmt_005.png');

        // TC_MGMT_006: Duplicate validation check on reservation update
        console.log('TC_MGMT_006...');
        // Make reservation 1 PENDING again, then add a second reservation
        await page.evaluate(async () => {
            await fetch('http://localhost:8080/api/admin/reservations/1/status', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer admin@duyanan.com' },
                body: JSON.stringify({ status: 'PENDING' })
            });
        });
        // Create second reservation at 2026-08-25 19:00
        await page.goto('http://localhost:5173/book-reservation');
        await page.select('select[name="eventType"]', 'Casual Dining 🍽️');
        await page.select('select[name="seatingType"]', 'indoor');
        await page.type('input[name="date"]', '2026-08-25');
        await page.type('input[name="time"]', '19:00');
        await page.type('input[name="guests"]', '4');
        await page.click('button[type="submit"]');
        await delay(1000);
        const bookConfirmBtn3 = await page.$('.swal2-confirm');
        if (bookConfirmBtn3) await bookConfirmBtn3.click();

        // Edit reservation 2 to conflict with reservation 1 (2026-08-20 19:00)
        await goToReservationsTab();
        await page.evaluate(() => {
            const editBtns = Array.from(document.querySelectorAll('.btn-edit-reservation'));
            if (editBtns[1]) editBtns[1].click(); // second reservation
        });
        await delay(800);
        // Force conflict in date/time
        await page.evaluate(() => {
            document.querySelector('input[name="date"]').value = '2026-08-20';
            document.querySelector('input[name="time"]').value = '19:00';
        });
        await page.click('button[type="submit"]');
        await snap('tc_mgmt_006.png');

        const editErrBtn = await page.$('.swal2-confirm');
        if (editErrBtn) await editErrBtn.click();

        // TC_MGMT_007: Cancel a PENDING reservation
        console.log('TC_MGMT_007...');
        await goToReservationsTab();
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const cancelBtn = btns.find(b => b.textContent.includes('Cancel') && !b.textContent.includes('Reservation'));
            if (cancelBtn) cancelBtn.click();
        });
        await delay(800);
        const confirmCancelBtn = await page.$('.swal2-confirm');
        if (confirmCancelBtn) await confirmCancelBtn.click();
        await snap('tc_mgmt_007.png');

        // TC_MGMT_008: Prevent cancellation of non-pending reservation
        console.log('TC_MGMT_008...');
        // Set reservation 1 status to COMPLETED
        await page.evaluate(async () => {
            await fetch('http://localhost:8080/api/admin/reservations/1/status', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer admin@duyanan.com' },
                body: JSON.stringify({ status: 'COMPLETED' })
            });
        });
        await goToReservationsTab();
        await snap('tc_mgmt_008.png');

        // TC_MGMT_009: Ownership access validation check on booking updates
        console.log('TC_MGMT_009...');
        await page.goto('http://localhost:8080/api/reservations/999/cancel');
        await snap('tc_mgmt_009.png');


        // ==========================================
        // MODULE 4: EVENT PACKAGES CUSTOMIZATION
        // ==========================================

        // Log back in as customer
        await loginAs('johndoe@test.com', 'Password123');

        // TC_PKG_001: Classic Package item configuration limits
        console.log('TC_PKG_001...');
        await page.goto('http://localhost:5173/event-packages');
        // Click Configure on Classic Celebration Package
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const configBtn = btns.find(b => b.textContent.trim() === 'Configure Package');
            if (configBtn) configBtn.click();
        });
        await snap('tc_pkg_001.png');

        // Close modal
        await page.evaluate(() => {
            const closeBtn = document.querySelector('.btn-close');
            if (closeBtn) closeBtn.click();
        });

        // TC_PKG_002: Grand Package item configuration limits
        console.log('TC_PKG_002...');
        await page.evaluate(() => {
            const cards = Array.from(document.querySelectorAll('.card-body'));
            const grandCard = cards.find(c => c.querySelector('h4').textContent.includes('Grand'));
            if (grandCard) grandCard.querySelector('button').click();
        });
        await snap('tc_pkg_002.png');

        // Close modal
        await page.evaluate(() => {
            const closeBtn = document.querySelector('.btn-close');
            if (closeBtn) closeBtn.click();
        });

        // TC_PKG_003: Royal Package item configuration limits
        console.log('TC_PKG_003...');
        await page.evaluate(() => {
            const cards = Array.from(document.querySelectorAll('.card-body'));
            const royalCard = cards.find(c => c.querySelector('h4').textContent.includes('Royal'));
            if (royalCard) royalCard.querySelector('button').click();
        });
        await snap('tc_pkg_003.png');

        // Close modal
        await page.evaluate(() => {
            const closeBtn = document.querySelector('.btn-close');
            if (closeBtn) closeBtn.click();
        });

        // TC_PKG_004: Complete selections and add to cart
        console.log('TC_PKG_004...');
        await page.evaluate(() => {
            const cards = Array.from(document.querySelectorAll('.card-body'));
            const classicCard = cards.find(c => c.querySelector('h4').textContent.includes('Classic'));
            if (classicCard) classicCard.querySelector('button').click();
        });
        await delay(500);
        // Fill selections
        await page.evaluate(() => {
            const selects = Array.from(document.querySelectorAll('select'));
            selects.forEach(select => {
                if (select.options.length > 1) {
                    select.selectedIndex = 1;
                    select.dispatchEvent(new Event('change'));
                }
            });
        });
        await page.click('button[type="submit"]');
        await snap('tc_pkg_004.png');

        const pkgConfirmBtn = await page.$('.swal2-confirm');
        if (pkgConfirmBtn) await pkgConfirmBtn.click();

        // TC_PKG_005: Incomplete package items validation
        console.log('TC_PKG_005...');
        await page.evaluate(() => {
            const cards = Array.from(document.querySelectorAll('.card-body'));
            const classicCard = cards.find(c => c.querySelector('h4').textContent.includes('Classic'));
            if (classicCard) classicCard.querySelector('button').click();
        });
        await delay(500);
        // Submit immediately with empty fields
        await page.click('button[type="submit"]');
        await snap('tc_pkg_005.png');

        const pkgErrBtn = await page.$('.swal2-confirm');
        if (pkgErrBtn) await pkgErrBtn.click();
        // Close modal
        await page.evaluate(() => {
            const closeBtn = document.querySelector('.btn-close');
            if (closeBtn) closeBtn.click();
        });

        // TC_PKG_006: Customization guest guard validation
        console.log('TC_PKG_006...');
        await page.evaluate(() => localStorage.clear());
        await page.goto('http://localhost:5173/event-packages');
        await page.evaluate(() => {
            const btn = document.querySelector('button');
            if (btn) btn.click();
        });
        await snap('tc_pkg_006.png');

        const pkgGuestOkBtn = await page.$('.swal2-confirm');
        if (pkgGuestOkBtn) await pkgGuestOkBtn.click();

        // TC_PKG_007: Filter package search by keyword
        console.log('TC_PKG_007...');
        await page.goto('http://localhost:5173/event-packages');
        await typeText('input[placeholder="Search Event Packages"]', 'Fiesta');
        await snap('tc_pkg_007.png');

        // TC_PKG_008: Backend connection failure fallback
        console.log('TC_PKG_008...');
        // Enable request interception to fail the API call
        await page.setRequestInterception(true);
        page.on('request', request => {
            if (request.url().includes('/api/products')) {
                request.abort();
            } else {
                request.continue();
            }
        });
        // Clear input and reload page to trigger catch block
        await page.goto('http://localhost:5173/event-packages');
        await snap('tc_pkg_008.png');

        // Disable request interception
        await page.setRequestInterception(false);

        // TC_PKG_009: Custom package price localization display
        console.log('TC_PKG_009...');
        await page.goto('http://localhost:5173/event-packages');
        await snap('tc_pkg_009.png');


        // ==========================================
        // MODULE 5: ADMIN PANEL & CONTROL
        // ==========================================

        // Log in as Admin
        await loginAs('admin@duyanan.com', 'admin123');

        // TC_ADM_001: View all reservations in Admin Panel
        console.log('TC_ADM_001...');
        await page.goto('http://localhost:5173/admin');
        // Click on the Reservations tab
        await page.evaluate(() => {
            const tabs = Array.from(document.querySelectorAll('.nav-link, button'));
            const resTab = tabs.find(t => t.textContent.trim().includes('Reservations'));
            if (resTab) resTab.click();
        });
        await snap('tc_adm_001.png');

        // TC_ADM_002: Filter global reservations list
        console.log('TC_ADM_002...');
        await page.evaluate(() => {
            // Find search/filter input inside admin reservations view
            const inputs = Array.from(document.querySelectorAll('input'));
            const search = inputs.find(i => i.placeholder && i.placeholder.toLowerCase().includes('search'));
            if (search) {
                search.value = 'PENDING';
                search.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });
        await snap('tc_adm_002.png');

        // TC_ADM_003: Standard user attempts admin URL
        console.log('TC_ADM_003...');
        // Login as customer first
        await loginAs('johndoe@test.com', 'Password123');

        // Direct navigation to /admin
        await page.goto('http://localhost:5173/admin');
        await snap('tc_adm_003.png');

        // Log back in as Admin
        await loginAs('admin@duyanan.com', 'admin123');
        await page.goto('http://localhost:5173/admin');
        await page.evaluate(() => {
            const tabs = Array.from(document.querySelectorAll('.nav-link, button'));
            const resTab = tabs.find(t => t.textContent.trim().includes('Reservations'));
            if (resTab) resTab.click();
        });
        await delay(500);

        // Make sure we have a pending reservation (reservation 1 was completed, reservation 2 is still pending/active)
        // TC_ADM_004: Confirm user table booking
        console.log('TC_ADM_004...');
        await page.evaluate(() => {
            const rows = Array.from(document.querySelectorAll('tr'));
            const pendingRow = rows.find(r => r.textContent.includes('PENDING'));
            if (pendingRow) {
                const confirmBtn = Array.from(pendingRow.querySelectorAll('button')).find(b => b.textContent.trim().includes('Confirm'));
                if (confirmBtn) confirmBtn.click();
            }
        });
        await snap('tc_adm_004.png');

        // TC_ADM_005: Complete a reservation status
        console.log('TC_ADM_005...');
        await page.evaluate(() => {
            const rows = Array.from(document.querySelectorAll('tr'));
            const confirmedRow = rows.find(r => r.textContent.includes('CONFIRMED'));
            if (confirmedRow) {
                // Find complete dropdown/select/button
                const completeBtn = Array.from(confirmedRow.querySelectorAll('button')).find(b => b.textContent.trim().includes('Complete') || b.textContent.trim().includes('Status') || b.textContent.trim().includes('Done'));
                if (completeBtn) completeBtn.click();
                else {
                    // Try targeting select dropdown for status if it exists
                    const select = confirmedRow.querySelector('select');
                    if (select) {
                        select.value = 'COMPLETED';
                        select.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }
            }
        });
        await snap('tc_adm_005.png');

        // TC_ADM_006: Secure Admin Status Update API
        console.log('TC_ADM_006...');
        await page.goto('http://localhost:8080/api/admin/reservations/1/status');
        await snap('tc_adm_006.png');

        // Log back in as Admin
        await loginAs('admin@duyanan.com', 'admin123');
        await page.goto('http://localhost:5173/admin');
        await page.evaluate(() => {
            const tabs = Array.from(document.querySelectorAll('.nav-link, button'));
            const resTab = tabs.find(t => t.textContent.trim().includes('Reservations'));
            if (resTab) resTab.click();
        });
        await delay(500);

        // Add a new PENDING reservation via API for cancellation testing
        await page.evaluate(async () => {
            await fetch('http://localhost:8080/api/reservations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer johndoe@test.com' },
                body: JSON.stringify({
                    seatingType: 'indoor',
                    reservationDate: '2026-08-28',
                    reservationTime: '18:00',
                    numberOfGuests: 6,
                    specialRequests: '',
                    eventType: 'Casual Dining 🍽️'
                })
            });
        });
        await page.goto('http://localhost:5173/admin');
        await page.evaluate(() => {
            const tabs = Array.from(document.querySelectorAll('.nav-link, button'));
            const resTab = tabs.find(t => t.textContent.trim().includes('Reservations'));
            if (resTab) resTab.click();
        });
        await delay(800);

        // TC_ADM_007: Cancel user booking with cancellation reason
        console.log('TC_ADM_007...');
        await page.evaluate(() => {
            const rows = Array.from(document.querySelectorAll('tr'));
            const pendingRow = rows.find(r => r.textContent.includes('PENDING'));
            if (pendingRow) {
                const cancelBtn = Array.from(pendingRow.querySelectorAll('button')).find(b => b.textContent.trim().includes('Cancel'));
                if (cancelBtn) cancelBtn.click();
            }
        });
        await delay(800);
        // Type reason in SweetAlert popup
        await typeText('.swal2-input, .swal2-textarea, textarea', 'Weather conditions');
        await page.click('.swal2-confirm');
        await snap('tc_adm_007.png');

        // Add another pending reservation for validating empty cancellation reason
        await page.evaluate(async () => {
            await fetch('http://localhost:8080/api/reservations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer johndoe@test.com' },
                body: JSON.stringify({
                    seatingType: 'indoor',
                    reservationDate: '2026-08-29',
                    reservationTime: '18:00',
                    numberOfGuests: 2,
                    specialRequests: '',
                    eventType: 'Casual Dining 🍽️'
                })
            });
        });
        await page.goto('http://localhost:5173/admin');
        await page.evaluate(() => {
            const tabs = Array.from(document.querySelectorAll('.nav-link, button'));
            const resTab = tabs.find(t => t.textContent.trim().includes('Reservations'));
            if (resTab) resTab.click();
        });
        await delay(800);

        // TC_ADM_008: Cancel booking without reason validation
        console.log('TC_ADM_008...');
        await page.evaluate(() => {
            const rows = Array.from(document.querySelectorAll('tr'));
            const pendingRow = rows.find(r => r.textContent.includes('PENDING') && r.textContent.includes('29'));
            if (pendingRow) {
                const cancelBtn = Array.from(pendingRow.querySelectorAll('button')).find(b => b.textContent.trim().includes('Cancel'));
                if (cancelBtn) cancelBtn.click();
            }
        });
        await delay(800);
        // Submit empty SweetAlert
        await page.click('.swal2-confirm');
        await snap('tc_adm_008.png');

        // Dismiss SweetAlert
        const cancelOk = await page.$('.swal2-confirm');
        if (cancelOk) await cancelOk.click();

        // TC_ADM_009: User viewing admin cancellation reason
        console.log('TC_ADM_009...');
        await loginAs('johndoe@test.com', 'Password123');
        await goToReservationsTab();
        await snap('tc_adm_009.png');

    } catch (e) {
        console.error('Automation encountered an error:', e);
    } finally {
        console.log('Closing browser...');
        await browser.close();
    }
}

run();
