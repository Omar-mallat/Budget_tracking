# 💰 Budget Tracking Project

A full-stack web application for tracking income and expenses, providing users with a clean and responsive dashboard featuring summary cards, charts, and transaction lists.

---

## 📚 Table of Contents

- [✨ Features](#-features)  
- [🛠 Tech Stack](#-tech-stack)  
- [🚀 Installation and Setup](#-installation-and-setup)  
  - [🔧 Backend Setup](#-backend-setup)  
  - [🎨 Frontend Setup](#-frontend-setup)  
- [📱 Backend API](#-backend-api)  
- [💻 Frontend Overview](#-frontend-overview)  
- [📖 Usage](#-usage)  
- [🌱 Future Enhancements](#-future-enhancements)  
- [📝 License](#-license)

---

## ✨ Features

- 🔐 **User Authentication**: Secure registration, login, and logout using JWT.  
- 💸 **Income & Expense Management**: Add, view, update, and delete records.  
- 📊 **Dashboard Overview**: Real-time summary of income, expenses, and balance.  
- 📈 **Data Visualization**: Interactive charts for income vs. expenses.  
- 📱 **Responsive UI**: Mobile-first design using Tailwind CSS.  
- 🔞 **Error Handling & Logging**: Robust backend error logging and handling.

---

## 🛠 Tech Stack

**Frontend:**  
- React.js (Vite)  
- Tailwind CSS  
- Axios  
- React Router

**Backend:**  
- Node.js  
- Express.js  
- PostgreSQL

**Authentication & Security:**  
- JSON Web Tokens (JWT)  
- bcrypt for password hashing

**Visualization & Tools:**  
- Recharts or Chart.js  
- Postman for API testing  
- ESLint for code quality

---

## 🚀 Installation and Setup

### 🔧 Backend Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd budget-tracking-project/backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**

   Create a `.env` file in the `backend` directory:

   ```env
   PORT=5000
   DB_USER=your_db_user
   DB_HOST=localhost
   DB_NAME=budget_tracking
   DB_PASSWORD=your_db_password
   DB_PORT=5432
   JWT_SECRET=your_jwt_secret
   ```

4. **Set up the PostgreSQL database:**
   - Create a database named `budget_tracking`.
   - Run provided SQL or migrations to create the following tables:
     - `users`
     - `income`
     - `expenses`

5. **Start the backend server:**
   ```bash
   npm start
   ```

---

### 🎨 Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd ../frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Access the application:**
   Open your browser and visit [http://localhost:3000](http://localhost:3000)

---

## 📱 Backend API

### 🔐 Authentication

- `POST /auth/register` — Register a new user  
- `POST /auth/login` — Authenticate and receive a JWT

### 💸 Expenses

- `GET /expenses/:userId` — Fetch all expenses for a user  
- `GET /expenses/total/:userId` — Total expenses summary  
- `POST /expenses` — Add a new expense  
- `DELETE /expenses/:expenseId` — Delete an expense  

### 💰 Income

- `GET /incomes/:userId` — Fetch all incomes for a user  
- `GET /incomes/totalInc/:userId` — Total income summary  
- `POST /incomes` — Add a new income  
- `DELETE /incomes/:incomeId` — Delete an income  

---

## 💻 Frontend Overview

- **Dashboard:**  
  Displays summary cards, a balance chart, and recent transactions.

- **Expenses Page:**  
  Manage your expense records with add and delete options.

- **Income Page:**  
  Manage income entries with similar features.

> Frontend communicates with the backend using Axios. Tailwind CSS handles styling, and React Router manages routing.

---

## 📖 Usage

1. **Register/Login:**  
   Create an account and sign in.

2. **Dashboard:**  
   View financial summaries and charts.

3. **Add Transactions:**  
   Use the income/expenses pages to log your records.

4. **Monitor Finances:**  
   Track progress with interactive charts and lists.

---

## 🌱 Future Enhancements

- 🔍 Advanced filtering & sorting for transactions  
- 📱 Improved responsive design & collapsible sidebar  
- 🔄 Real-time updates using WebSockets or SSE  
- 👤 User profile and preference management  

---

## 📝 License

This project is open-source and available under the [MIT License](LICENSE).

