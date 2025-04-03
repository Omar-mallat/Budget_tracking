# Budget Tracking Project

A full-stack web application for tracking income and expenses, providing users with an overview of their financial status. The project includes a responsive dashboard with summary cards, charts, and transaction lists, built to impress potential employers and showcase your skills.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation and Setup](#installation-and-setup)
- [Backend API](#backend-api)
- [Frontend](#frontend)
- [Usage](#usage)
- [Future Enhancements](#future-enhancements)
- [License](#license)

## Features

- **User Authentication:** Secure registration, login, and sign-out using JWT.
- **Income & Expense Tracking:** Add, view, update, and delete income and expense records.
- **Dashboard Overview:** Real-time summary cards showing total income, total expenses, and net balance.
- **Data Visualization:** Interactive charts comparing income vs. expenses.
- **Responsive UI:** Designed with mobile-first principles using Tailwind CSS.
- **Error Handling & Logging:** Centralized error handling on the backend and robust logging for debugging.

## Tech Stack

- **Frontend:** React.js (with Vite), Tailwind CSS, Axios, React Router
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL
- **Authentication:** JSON Web Tokens (JWT), bcrypt for password hashing
- **Charting:** Recharts (or Chart.js, as preferred)
- **Additional Tools:** Postman (for API testing), ESLint for code quality

## Installation and Setup

### Prerequisites

- Node.js (v14+ recommended)
- PostgreSQL
- npm or yarn

### Backend Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd budget-tracking-project/backend
Install dependencies:

bash
Copy
Edit
npm install
Configure Environment Variables:

Create a .env file in the backend directory with the following (update values as needed):

env
Copy
Edit
PORT=5000
DB_USER=your_db_user
DB_HOST=localhost
DB_NAME=budget_tracking
DB_PASSWORD=your_db_password
DB_PORT=5432
JWT_SECRET=your_jwt_secret
Set up the database:

Create a PostgreSQL database named budget_tracking.

Run the provided SQL scripts (or migrations) to create the necessary tables:

users

expenses

income

Start the backend server:

bash
Copy
Edit
npm start
Frontend Setup
Navigate to the frontend directory:

bash
Copy
Edit
cd ../frontend
Install dependencies:

bash
Copy
Edit
npm install
Start the development server:

bash
Copy
Edit
npm run dev
Open the application in your browser:

Typically, it runs on http://localhost:3000 or as specified by Vite.

Backend API
Example Endpoints:
User Authentication:

POST /auth/register — Register a new user.

POST /auth/login — Login and receive a JWT token.

Expenses:

GET /expenses/:userId — Get all expenses for a user.

GET /expenses/total/:userId — Get total expenses for a user.

POST /expenses — Add a new expense.

DELETE /expenses/:expenseId — Delete an expense.

Income:

GET /incomes/:userId — Get all incomes for a user.

GET /incomes/totalInc/:userId — Get total income for a user.

POST /incomes — Add a new income.

DELETE /incomes/:incomeId — Delete an income.

Frontend
Dashboard:
Displays summary cards (total income, expenses, balance), a chart for income vs. expenses, and lists recent transactions.

Expenses Page:
Allows adding, viewing, and deleting expenses.

Income Page:
Similar functionality for incomes.

The frontend uses Axios to communicate with the backend API and Tailwind CSS for styling. Routing is handled by React Router.

Usage
Register and Login:
Start by registering a new account and logging in.

Dashboard:
View an overview of your finances on the dashboard.

Add Transactions:
Use the Income and Expenses pages to add financial records.

View Details:
Check the lists and charts to see detailed financial insights.

Future Enhancements
Advanced Filtering & Sorting:
Add functionality to filter and sort transactions.

Collapsible Sidebar & Responsive Design Improvements:
Enhance UI/UX for mobile devices.

Real-Time Updates:
Implement WebSocket or Server-Sent Events for live updates.

User Profile & Settings:
Allow users to update their profile and preferences.








