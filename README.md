# auriga-clinic-booking
This is official repository for the problem statement solution for making real time based project.
A complete front-desk management solution integrating AI conflict prevention and ERP attendance tracking.

## Setup and Run Instructions
1. Open terminal and run `npm install`
2. Start server: `node server.js`
3. Access Landing page: `http://localhost:3000`
4. Access Dashboard: `http://localhost:3000/app.html`

## REST API Endpoints List
- `POST /api/register` - Staff Account Creation
- `POST /api/login` - Bearer Token Auth
- `GET /api/doctors` - Retrieve medical staff
- `POST /api/doctors/:id/attendance` - ERP toggle (Present/Absent)
- `POST /api/check-slot` - AI verification for conflicts and absences
- `POST /api/appointments` - Book appointment (strictly blocked if conflict exists)
- `POST /api/appointments/:id/cancel` - Cancel (auto-assigns late fee if < 24 hrs)
- `GET /api/appointments` - Paginated master schedule (supports search and doctor filtering)