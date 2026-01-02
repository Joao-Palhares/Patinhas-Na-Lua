# 🧪 Manual Testing Guide - Patinhas na Lua

Since we just reset the database to add new features, your local data has been wiped. This is why you are being asked to do **Onboarding** again (your account exists in the Login system, but your profile in the Database was cleared). This is normal during development!

Follow this script to test all new features thoroughly.

## 🛠️ Setup: Admin & User Access
1.  **Login as Admin**: Use your main account. Complete the Onboarding if asked.
2.  **Open a Second Browser** (or Incognito Window): This will be your "Test Client".

---

## 🟢 Test 1: The Referral System (Member-Get-Member)
**Goal**: Verify that a user can invite a friend, the friend gets a discount, and the user gets points.

1.  **As Admin (Main Browser):**
    *   Go to **Dashboard**.
    *   Find the Purple Card **"Convida amigos"**.
    *   Click "Criar Código". Copy the code (e.g., `JON1234`).
2.  **As Test Client (Incognito):**
    *   Login with a different account (or create a temp one).
    *   Go to **Agendar Nova Visita**.
    *   Select a Pet and Service.
    *   In the Date/Time step, enter `JON1234` in the **Coupon/Code** field and click "Aplicar".
    *   **Verify**: Does it say "Reference Code applied"? Does the price drop by 5%?
    *   Complete the booking.
3.  **As Admin (Main Browser):**
    *   Go to **/admin/appointments**.
    *   Find the new appointment. Mark it as **"Completed"** (or Register Payment).
    *   Go to **Dashboard**. Check your **Loyalty Points**. Did they increase by +10?

---

## 🟢 Test 2: Reviews System
**Goal**: Verify that users can review completed appointments.

1.  **As Test Client (Incognito):**
    *   After the Admin marked your appointment as "Completed" (in Test 1), refresh your **Dashboard**.
    *   **Verify**: Do you see a Golden Card **"Como correu a visita?"** at the top?
    *   Click stars (e.g., 5 stars) and write a comment. Click Submit.
    *   **Verify**: The card should disappear.
2.  **As Admin (Main Browser):**
    *   (Optional) Check the database using `npx prisma studio` to see the new Review recorded in the `Review` table.

---

## 🟢 Test 3: Recurring Appointments
**Goal**: Verify looking ahead 6 months.

1.  **As Test Client (Incognito):**
    *   Start a new Booking.
    *   Select a Service.
    *   At the **Time Selection** step, scroll down.
    *   Check the box **"Repetir a cada 4 semanas?"**.
    *   Confirm the booking.
2.  **As Admin (Main Browser):**
    *   Go to **/admin/appointments**.
    *   **Verify**: Do you see 6 appointments scheduled for this client? (One for each upcoming month).

---

## 🐛 Troubleshooting
If something feels wrong, you can look directly inside the database:
1.  Open your terminal in VS Code.
2.  Run: `npx prisma studio`
3.  A browser window will open showing all tables (User, Apppointment, etc.). You can inspect exactly what data was saved.
