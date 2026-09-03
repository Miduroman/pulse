# Pulse — Product Specification

## 1. Product Overview

Pulse is an AI-powered personal finance intelligence platform.

Instead of only recording expenses, Pulse helps users understand their
financial behavior, monitor budgets, identify spending patterns, and
receive actionable insights.

### Product Goal

Turn raw financial transactions into clear, useful, and personalized
financial insights.

---

## 2. Problem

Most personal finance applications focus on recording transactions.

Users can see:

- how much they spent
- where they spent it
- how much money remains

But they often still have to answer:

- Why did I spend more this month?
- Which category is causing the problem?
- Am I on track with my budget?
- How much am I likely to spend by the end of the month?
- What should I change?

Pulse aims to answer these questions automatically.

---

## 3. Target User

### Primary User

Young professionals and students who want to understand and improve
their personal spending habits.

### User Characteristics

- Uses digital payments frequently
- Has recurring monthly expenses
- Wants to control spending
- Is comfortable with a modern web application
- Wants insights without manually analyzing spreadsheets

---

## 4. Core Value Proposition

Pulse does not simply tell users:

> "You spent Rp820,000 on food."

Pulse tells users:

> "Your food spending is 18% higher than your usual monthly average.
> At your current rate, you may exceed your food budget by Rp240,000."

The product converts financial data into decisions.

---

## 5. MVP Features

### Authentication

Users can:

- Register
- Login
- Logout
- Access only their own financial data

---

### Dashboard

The dashboard displays:

- Total spending
- Total income
- Current balance
- Monthly budget
- Budget remaining
- Savings rate
- Spending trend
- Recent transactions
- Financial health score
- AI-generated insights

---

### Transactions

Users can:

- Add transactions
- Edit transactions
- Delete transactions
- Categorize transactions
- Search transactions
- Filter transactions
- View transaction history

Transaction types:

- Income
- Expense

---

### Categories

Initial expense categories:

- Food
- Transportation
- Shopping
- Entertainment
- Bills
- Health
- Education
- Travel
- Other

---

### Budgets

Users can:

- Create a monthly budget
- Set category budgets
- View budget progress
- See remaining budget
- Receive warnings when spending approaches the limit

---

### Analytics

Pulse calculates:

- Spending by category
- Spending over time
- Monthly comparison
- Category trends
- Average daily spending
- Savings rate
- Budget utilization

---

### Financial Health Score

Pulse generates a score from 0–100 based on factors such as:

- Budget consistency
- Spending behavior
- Savings rate
- Recurring expenses

The score should be explainable.

Users should understand why their score changed.

---

### AI Insights

Pulse generates contextual insights from the user's financial data.

Examples:

- Spending anomaly
- Category overspending
- Budget warning
- Spending trend
- End-of-month projection
- Personalized suggestion

AI should use actual application data rather than generating generic
financial advice.

---

## 6. MVP User Flow

### New User

Register
→ Login
→ Empty Dashboard
→ Add First Transaction
→ Add Budget
→ Dashboard Updates
→ Insights Become Available

### Returning User

Login
→ Dashboard
→ Review Financial Health
→ Review Spending
→ Read Insights
→ Take Action

---

## 7. Core Data Entities

### User

- id
- name
- email
- passwordHash
- createdAt
- updatedAt

### Transaction

- id
- userId
- amount
- type
- category
- description
- date
- createdAt
- updatedAt

### Budget

- id
- userId
- category
- amount
- month
- createdAt
- updatedAt

### FinancialInsight

- id
- userId
- type
- title
- description
- severity
- createdAt

---

## 8. Product Principles

### 1. Data First

Insights must be based on real user data.

### 2. Explainable

Important calculations and recommendations should be understandable.

### 3. Simple

Users should understand their financial situation within seconds.

### 4. Actionable

Every important insight should help the user decide what to do next.

### 5. Privacy First

Financial information is sensitive and must never be exposed between users.

---

## 9. Definition of Success

Pulse MVP is successful when a user can:

1. Create an account
2. Add financial transactions
3. Set a monthly budget
4. Understand their spending through visualizations
5. Receive meaningful financial insights
6. Understand why those insights were generated

---

## 10. Future Features

Potential future features:

- CSV transaction import
- Automatic transaction categorization
- Recurring transactions
- Subscription detection
- Spending forecasting
- Multi-currency support
- Export financial reports
- AI financial assistant
- Personalized financial goals
- Mobile application

---

## 11. Non-Goals for MVP

Pulse MVP will NOT initially include:

- Bank account integration
- Real money transfers
- Investment management
- Cryptocurrency trading
- Financial product recommendations
- Real financial transactions

The MVP focuses on financial tracking, analytics, and intelligence.