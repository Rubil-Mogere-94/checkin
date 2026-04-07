# Check-In with QR Code Application

## Author
- [@Rubil-Mogere-94](https://github.com/Rubil-Mogere-94)

## Description
This application empowers employees to generate personalized QR codes linked to their identification or email, capturing their geolocation seamlessly upon account access. Administrators gain comprehensive management capabilities, enabling them to onboard new employees, define operating locations, and establish correlations through a junction table. By simply scanning the QR code, administrators can effortlessly verify an employee's unique email against the database and cross-reference their obtained geolocation with assigned office branches, ensuring stringent access control.

## Recent Upgrades (v2)
- **Premium User Interface:** Integrating advanced web design techniques, the UI now features a dynamic liquid gradient background complemented immersively by glassmorphism layouts. Interactive components leverage primary purple-pink interactive gradients (`.primary-gradient-btn`).
- **Routing Overhaul:** Adheres strictly to **React Router v6** architectural paradigms. Eliminates legacy overlapping renders by utilizing definitive container `Layout` route components and precise `<Outlet />` wrappers.
- **State Optimizations:** Removed infinite rendering anomalies caused by direct `Context` mutations and unconstrained `useEffect` redirects. App components adhere safely to native unidirectional UI updates.

## Implemented Technologies
- **Node.js** & **React 18**
- **Material UI** (Customized with Deep Glassmorphism)
- **React Router DOM v6**
- **React Context API** (Persistent Client Caching)
- **Custom Hooks**: `useLocalStorage`

## Core Workflows
1. **Landing Environment**: Employees and Administrators interact seamlessly via the dynamic sidebar layout injected across the global container scope.
2. **Employee Operations**: Upon authenticating their assigned profile, the employee generates a static URI token matching the parameterized URL structures explicitly. A `QRCodeSVG` validates their active instance matching local endpoints tightly (`/Pages/AdminAccount/:emailLink`).
3. **Administrator Dashboard**:
    - Manage active **Employees** visually.
    - Dictate global **Office Branches** & identification strings.
    - Synchronize employees efficiently to locations with rigorous autocomplete checks via the intuitive Junction Control list.

## Setup & Deployment

First, [fork this repository](https://docs.github.com/en/get-started/quickstart/fork-a-repo).

```bash
# Clone the codebase
git clone https://github.com/<your-username>/check-in-with-qr.git 

# Install dependencies strictly enforcing legacy modules resolving React mismatching
npm install --legacy-peer-deps
```

### Running Locally
To test the environment actively:
```bash
npm start
```
The application spins up targeting development endpoints automatically on [http://localhost:3000](http://localhost:3000).

To push into an optimized build bundle:
```bash
npm run build
```
