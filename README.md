# Enterprise Application Portal & Dashboard (IMA360 Task 1)

A modern, responsive, and secure Enterprise Application Portal built with **React 19**, **Vite**, and **Material UI (MUI)**. The application features client-side authentication with session management, role-based user profiles, categorized enterprise app catalogs with live search, a custom Light/Dark theme system, and an interactive Excel-grade spreadsheet powered by **Handsontable**.

---

## 🚀 Key Features

### 1. 🔐 Authentication & Session Security
- **Robust Form Validation**: Powered by **React Hook Form** and **Yup** schema validation with real-time error feedback and field-level validation rules.
- **Interactive Notifications**: Instant toast messages using **React-Toastify** for login feedback, warnings, and alerts.
- **Show / Hide Password**: Intuitive toggle adorned with visibility icons for improved user input accuracy.
- **Persistent Sessions ("Remember Me")**:
  - **Checked**: Saves credentials session in `localStorage` to survive browser restarts.
  - **Unchecked**: Saves session in `sessionStorage`, automatically terminating the session when the browser tab closes.
- **Route Guards**:
  - `ProtectedRoute`: Guards `/home`, preventing unauthenticated guests from accessing the dashboard and redirecting them to `/login`.
  - `PublicRoute`: Prevents authenticated users from seeing `/login`, redirecting them directly to the dashboard.
- **Auth Context (`AuthContext`)**: Centralized React Context providing authentication state (`currentUser`), simulated network latency for realistic feel, sanitized user objects (passwords excluded), and one-click logout.

### 2. 📊 Enterprise Dashboard
- **Sticky Navigation Bar (`Navbar`)**:
  - Clean brand identity with custom SVG logo (`AppLogo`).
  - One-click Light / Dark theme toggle button.
  - User avatar dropdown menu (`UserMenu`) showing active user's details, role badge, login timestamp, and logout trigger.
- **Personalized Welcome Banner (`WelcomeBanner`)**:
  - Greets the logged-in user dynamically by name and displays their corporate role.
  - Live session indicator badge.
- **Real-Time Live Search (`SearchBar`)**:
  - Instant client-side filtering by application title or description across all categories.
  - Automatically hides categories that have no matching applications.
- **Modular App Catalog (`AppCard`)**:
  - Categorized grid populated dynamically from `apps.json`:
    - **Productivity & Collaboration**: Workspace Docs, Team Chat, Project Boards, Calendar Pro.
    - **Analytics & Intelligence**: BI Analytics, Customer Insights, Revenue Tracker.
    - **Developer & Cloud Ops**: Cloud Infrastructure, API Gateway, Security & IAM, CI/CD Pipelines.
    - **Administrative & HR**: Employee Directory, Time & Attendance.
  - Smooth hover elevation animations, glowing borders, dynamic category icons, and launch toasts.

### 3. 📑 Interactive Spreadsheet Modal (Handsontable)
- **Embedded Revenue Tracker (`RevenueTrackerModal`)**:
  - Clicking the **"Revenue Tracker"** app card launches an interactive, enterprise-grade Excel spreadsheet.
  - Powered by **Handsontable** (`@handsontable/react` & `handsontable`).
  - **Spreadsheet Capabilities**:
    - Cell editing, range selection, copy/paste keyboard shortcuts.
    - Full Context Menu (insert row/col, remove row/col, undo/redo).
    - Currency formatted numeric columns (MRR, Expansion, Churn, Net Revenue, Target).
    - Dropdown cell validation for quarterly targets (`Exceeded`, `On Track`, `Behind`).
    - Save action with toast confirmation and Reset action to restore default ledger values.
    - Themed modal container supporting both Light and Dark mode styling.

### 4. 🎨 Design System & Theming
- **Material UI v9 Custom Theme (`theme.js`)**:
  - Cohesive design system supporting seamless switching between **Light** and **Dark** modes.
  - Modern typography pairing: **JetBrains Mono** for technical headers/accents and **Inter** for crisp body text.
  - Curated brand color palette (Primary Blues, Slate Navy, dark cards, polished border strokes).
  - Theme preference automatically persisted in `localStorage`.

---

## 🛠️ Technology Stack

| Layer | Technology / Library | Description |
| :--- | :--- | :--- |
| **Core Framework** | [React 19](https://react.dev/) | Modern UI library with concurrent rendering |
| **Build Tool** | [Vite 8](https://vitejs.dev/) | Fast development server & production bundler |
| **UI Components** | [Material UI (MUI v9)](https://mui.com/) | Enterprise component design system |
| **Icons** | [@mui/icons-material](https://mui.com/material-ui/material-icons/) | Vector iconography |
| **Data Grid / Spreadsheet**| [Handsontable](https://handsontable.com/) | High-performance interactive data grid |
| **Routing** | [React Router DOM v7](https://reactrouter.com/) | Client-side routing with route protection |
| **Forms & Validation** | [React Hook Form](https://react-hook-form.com/) + [Yup](https://github.com/jquense/yup) | Performant, schema-based form management |
| **Notifications** | [React-Toastify](https://fkhadra.github.io/react-toastify/) | Customizable toast notifications |
| **Linting** | [Oxlint](https://oxc.rs/) | High-performance JavaScript/React linter |

---

## 👥 Demo User Accounts

The application uses local mock authentication (`src/data/users.json`). You can sign in using any of the following demo credentials:

| Username | Password | Full Name | Role |
| :--- | :--- | :--- | :--- |
| `alex.morgan` | `Password123!` | Alex Morgan | Product Lead |
| `john.doe` | `Password123!` | John Doe | Senior Engineer |
| `sarah.connor` | `Demo123!` | Sarah Connor | Operations Manager |

---

## 📂 Project Structure

```text
IMA360(Task1)/
├── public/                     # Static public assets (favicons, etc.)
├── src/
│   ├── assets/                 # Images, SVGs, and graphics
│   ├── components/
│   │   ├── common/
│   │   │   ├── AppLogo.jsx     # Enterprise portal brand SVG logo
│   │   │   └── ThemeToggle.jsx # Light/Dark mode switcher
│   │   ├── dashboard/
│   │   │   ├── AppCard.jsx     # Individual application launch card
│   │   │   ├── Navbar.jsx      # Sticky top navigation bar
│   │   │   ├── RevenueTrackerModal.jsx # Handsontable interactive spreadsheet
│   │   │   ├── SearchBar.jsx   # Live search and filter input
│   │   │   ├── UserMenu.jsx    # User profile dropdown with logout
│   │   │   └── WelcomeBanner.jsx # Personalized user greeting banner
│   │   ├── routes/
│   │   │   ├── ProtectedRoute.jsx # Route guard for authenticated paths (/home)
│   │   │   └── PublicRoute.jsx    # Route guard for unauthenticated paths (/login)
│   │   └── AppIcon.jsx         # Dynamic icon resolver for app cards
│   ├── context/
│   │   └── AuthContext.jsx     # Global authentication store & session management
│   ├── data/
│   │   ├── apps.json           # Application catalog organized by category
│   │   └── users.json          # Mock user credentials and profiles
│   ├── pages/
│   │   ├── DashboardPage.jsx   # Main authenticated dashboard page
│   │   └── LoginPage.jsx       # Public login page with form validation
│   ├── App.css                 # Application-level styling
│   ├── App.jsx                 # Route definitions and global providers
│   ├── index.css               # Global base resets and custom scrollbars
│   ├── main.jsx                # Application root entry point
│   └── theme.js                # Custom MUI theme config (light & dark palettes)
├── index.html                  # HTML entry point with Google Fonts
├── package.json                # Project dependencies and npm scripts
├── vite.config.js              # Vite configuration
└── README.md                   # Project documentation
```

---

## 💻 Getting Started

### Prerequisites
- **Node.js** (version 18 or higher recommended)
- **npm** or **yarn**

### Installation
1. Clone the repository and navigate to the project root:
   ```bash
   git clone <repository-url>
   cd IMA360(Task1)
   ```

2. Install project dependencies:
   ```bash
   npm install
   ```

### Running Locally
Start the development server with Hot Module Replacement (HMR):
```bash
npm run dev
```
Open your browser and navigate to the local URL (usually `http://localhost:5173`).

### Building for Production
Create an optimized production bundle:
```bash
npm run build
```
Preview the production build locally:
```bash
npm run preview
```

### Code Quality / Linting
Run Oxlint to check for code issues:
```bash
npm run lint
```
