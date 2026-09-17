# Thought Process & Architecture

1. **Strict Conflict Resolution (No Double Booking):** 
   Instead of relying entirely on standard insertion constraints, I implemented a two-step AI Verification API. The front desk must query the `/api/check-slot` route which verifies if the exact time slot is occupied for that specific `doctor_id`. The booking button remains disabled until this passes.

2. **Fair Cancellation Policy:** 
   I defined "late cancellation" fairly: any notice under 24 hours. The API dynamically calculates `(appointment_time - current_time)`. If under 24 hours, the status switches to `cancelled_fee` and records a $50 penalty.

3. **ERP Attendance Tracker (Bonus Feature):**
   To prevent bookings for off-duty staff, I added an `is_present` boolean to the `doctors` table. The AI verification cross-checks this state, physically preventing front-desk staff from booking patients with absent doctors.

4. **Doctor's Day Filter:**
   Satisfying the prompt's request to "see a doctor's day", the `GET /api/appointments` API supports a `doctor_id` query parameter, linked to a dropdown on the master schedule, enabling instant filtering of a single doctor's itinerary.