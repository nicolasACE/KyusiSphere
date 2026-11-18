# KyusiSphere

A small, single-page place-discovery website built with **HTML, CSS, and vanilla JavaScript**. It is designed as a Grade 12 project prototype and can be hosted as a static website on GitHub Pages.

## 1. Features

- Minimal public landing page with **KYUSISPHERE**, Log in, and Register.
- Registration for Student / User and Business Owner accounts.
- Login and logout, with a demo session remembered in the same browser.
- Discover Places page with keyword search and category filters.
- Optional nearby sorting using browser geolocation and listing coordinates.
- Reservation requests for places that accept bookings.
- Business Owner dashboard for adding, editing, and deleting owned listings.
- Owner controls for accepting or declining reservation requests.
- Admin dashboard for reviewing all listings and community suggestions.
- Super Admin account with protected status.
- Admin-only Manage Roles page for changing regular accounts between Student / User, Business Owner, and Admin.
- Browser `localStorage` demo data; no Node.js, npm, database, or API is needed for this prototype.

## 2. Demo accounts

| Role | Email | Password |
|---|---|---|
| Super Admin | `superadmin@kyusisphere.demo` | `superadmin123` |
| Business Owner | `owner@kyusisphere.demo` | `owner123` |
| Student / User | Register a new account | Choose a password |

Do not use real passwords or sensitive information. These credentials are intentionally public demo credentials.

## 3. Run locally with VS Code

1. Download and extract the project ZIP.
2. Open the extracted `KYUSISPHERE` folder in Visual Studio Code.
3. Install the **Live Server** extension if it is not installed.
4. Open `index.html` in VS Code.
5. Right-click the editor and select **Open with Live Server**.
6. The site should open at an address similar to `http://127.0.0.1:5500`.

**Important:** Do not double-click `index.html` to open it as a `file://` URL. The app uses JavaScript ES modules, and browsers can block module imports from local files. Use Live Server or a hosted HTTPS site.

## 4. Publish using GitHub Pages

1. Create a GitHub repository for the project.
2. Upload the contents of this folder to the repository's root. Make sure `index.html`, `css/`, and `js/` are at the same level.
3. Open the repository's **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select the `main` branch and `/ (root)` folder, then save.
6. Wait for GitHub Pages to publish the site, then open the provided Pages URL.

The project uses relative paths such as `./js/Main.js` and `css/style.css`, so it can run from a GitHub Pages repository URL without assuming the site is hosted at the domain root.

## 5. Folder and file guide

```text
KYUSISPHERE/
├── index.html
├── README.md
├── css/
│   └── style.css
├── tests/
│   └── smoke-test.mjs
└── js/
    ├── Main.js
    ├── models/
    │   ├── UserAccount.js
    │   ├── Place.js
    │   └── Reservation.js
    └── services/
        ├── StorageService.js
        ├── AuthService.js
        ├── PlaceService.js
        ├── ReservationService.js
        └── SuggestionService.js
```

### What each file does

- `index.html` — Defines the landing page, app views, forms, dialogs, and JavaScript entry point.
- `css/style.css` — Controls colors, spacing, typography, cards, tables, and responsive layout.
- `js/Main.js` — Main controller; connects buttons, forms, navigation, and page rendering.
- `js/models/UserAccount.js` — Defines the structure of a user account.
- `js/models/Place.js` — Defines the structure of a place listing.
- `js/models/Reservation.js` — Defines the structure of a reservation request.
- `js/services/StorageService.js` — Reads and writes demo records in browser localStorage and seeds starter data.
- `js/services/AuthService.js` — Validates registration, checks login credentials, and updates roles.
- `js/services/PlaceService.js` — Searches, sorts, adds, edits, and deletes place listings.
- `js/services/ReservationService.js` — Creates reservation requests and updates their status.
- `js/services/SuggestionService.js` — Saves and removes community suggestions.
- `tests/smoke-test.mjs` — Optional Node.js smoke tests for the core services.

JavaScript files include comments explaining their purpose and the main operations so they are easier to follow and present.

## 6. Reset demo data

The app saves demo data in the browser's localStorage. To reset the project to its original demo accounts and places, open the site, press **F12**, choose **Application** (Chrome/Edge), open **Local Storage**, select the site URL, and delete the keys beginning with `kyusisphere_`. Refresh the page afterward.

## 7. Optional code smoke test

If Node.js is installed, run `node --experimental-default-type=module tests/smoke-test.mjs` from the project folder. This checks registration, login, role permissions, place search, reservations, and suggestions. Node.js is not required to run the website itself.

## 8. Important limitations before real deployment

This is a **front-end school prototype**, not a secure production system. Accounts, passwords, role values, listings, and reservations are stored in the visitor's browser. Browser-side role checks can be bypassed by someone who knows how to edit localStorage. The demo passwords are plain text. Data does not synchronize between different users or devices.

A real multi-user release needs a backend API, database, server-side authentication and authorization, securely hashed passwords, owner verification, input validation, and shared data storage. GitHub Pages can host this static prototype, but it cannot by itself provide those backend features.
