
# Scientific Calculator

A full-stack scientific calculator built using React, Node.js, Express and PostgreSQL. The application supports mathematical and scientific operations, degree/radian modes, and persistent calculation history.

## Features

- Basic arithmetic operations: addition, subtraction, multiplication and division.
- Scientific functions: sine, cosine, tangent, logarithms and square roots.
- Powers and factorial calculations.
- Constants such as pi.
- Degree and radian modes.
- Previous answer (Ans) functionality.
- Keyboard input support.
- Calculation history.
- Delete individual calculations or clear all history.
- Input validation and error handling.
- Persistent storage using PostgreSQL.

## Tech Stack

**Frontend**
- React
- JavaScript
- CSS
- Vite

**Backend**
- Node.js
- Express.js
- Math.js
- node-postgres (pg)

**Database**
- PostgreSQL

**Development Tools**
- VS Code
- Git
- GitHub

## Architecture

The application follows a client-server architecture.

    React Frontend
         |
         | HTTP Requests
         v
    Node.js + Express Backend
         |
         | SQL Queries
         v
    PostgreSQL Database

The frontend handles user interactions and displays calculation results.

The backend validates incoming expressions, evaluates mathematical operations using Math.js, and communicates with PostgreSQL.

PostgreSQL stores calculation records so that history remains available after refreshing the application.

## Project Structure

    scientific-calculator/
    |
    |-- backend/
    |   |-- index.js
    |   |-- db.js
    |   |-- .env.example
    |   |-- package.json
    |   |-- package-lock.json
    |
    |-- frontend/
    |   |-- src/
    |   |   |-- components/
    |   |   |   |-- Calculator.jsx
    |   |   |   |-- History.jsx
    |   |   |
    |   |   |-- App.jsx
    |   |   |-- App.css
    |   |   |-- index.css
    |   |   |-- main.jsx
    |   |
    |   |-- package.json
    |
    |-- .gitignore
    |-- README.md

## Database Schema

Database name: `calculator_db`

Table: `calculations`

| Column | Data Type | Description |
|---|---|---|
| id | SERIAL | Primary key |
| expression | TEXT | Mathematical expression |
| result | TEXT | Calculated result |
| angle_mode | VARCHAR(3) | DEG or RAD |
| created_at | TIMESTAMPTZ | Calculation timestamp |

### Create the database

```sql
CREATE DATABASE calculator_db;
```

Connect to the database and create the table:

```sql
CREATE TABLE calculations (
    id SERIAL PRIMARY KEY,
    expression TEXT NOT NULL,
    result TEXT NOT NULL,
    angle_mode VARCHAR(3) NOT NULL DEFAULT 'deg',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## Installation and Setup

### Prerequisites

- Node.js and npm
- PostgreSQL
- Git

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd scientific-calculator
```

### 2. Set up the database

Create a PostgreSQL database named `calculator_db`.

Run the SQL table creation command provided above.

### 3. Set up the backend

```bash
cd backend
npm install
```

Create a `.env` file using `.env.example` as a template.

Configure your PostgreSQL credentials:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_NAME=calculator_db
```

Start the backend:

```bash
npm run dev
```

The backend runs at:

http://localhost:5000

### 4. Set up the frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at:

http://localhost:5173

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Check server status |
| GET | `/hello/:name` | Test dynamic routes |
| GET | `/api/db-test` | Test database connectivity |
| POST | `/api/calculate` | Calculate and save an expression |
| GET | `/api/history` | Retrieve calculation history |
| DELETE | `/api/history/:id` | Delete a specific calculation |
| DELETE | `/api/history` | Clear all calculation history |

### Example: Calculate an expression

Request:

```http
POST /api/calculate
Content-Type: application/json
```

Request body:

```json
{
    "expression": "2+3*4",
    "angleMode": "deg"
}
```

Expected result:

```json
{
    "id": 1,
    "expression": "2+3*4",
    "result": "14",
    "angle_mode": "deg",
    "created_at": "..."
}
```

## Security and Error Handling

- Environment variables are used to store database credentials.
- Sensitive `.env` files are excluded from Git.
- Parameterized SQL queries are used to reduce SQL injection risks.
- Backend validation checks incoming expressions and angle modes.
- Invalid mathematical expressions are rejected.
- Non-finite and non-numeric calculation results are rejected.

## Testing

The application has been manually tested for:

- Basic arithmetic operations.
- Scientific and trigonometric functions.
- Degree and radian calculations.
- Invalid expressions and division by zero.
- Calculation history persistence.
- Individual and bulk history deletion.
- Keyboard interactions.

## Future Improvements

- Automated backend and frontend tests.
- Deployment with a hosted PostgreSQL database.
- Improved scientific calculator functionality.
- Enhanced UI and accessibility.
- Pagination for calculation history.
