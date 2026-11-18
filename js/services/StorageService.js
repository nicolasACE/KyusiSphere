// Centralized browser storage keeps demo data in one predictable place.
const KEYS = {
  users: "kyusisphere_users",                 // Registered accounts and demo accounts.
  places: "kyusisphere_places",               // Discoverable business and community listings.
  reservations: "kyusisphere_reservations",   // Reservation requests sent by users.
  suggestions: "kyusisphere_suggestions",     // Places suggested by the community.
  stats: "kyusisphere_login_stats",           // Demo login counters grouped by role.
  session: "kyusisphere_session"              // The account currently signed in on this browser.
};

export class StorageService {
  // Read one stored value and return a safe default if storage is empty or invalid.
  static get(key) {
    try {
      const rawValue = localStorage.getItem(KEYS[key]); // Get the raw JSON text from the browser.
      if (rawValue === null) return key === "session" ? null : key === "stats" ? {} : []; // Return the right empty data type.
      return JSON.parse(rawValue); // Convert the saved JSON text back into JavaScript data.
    } catch (error) {
      console.error(`Could not read ${key} from localStorage:`, error); // Help developers diagnose storage issues.
      return key === "session" ? null : key === "stats" ? {} : []; // Keep the app from crashing on invalid data.
    }
  }

  // Save one value as JSON so objects and arrays survive page reloads.
  static set(key, value) {
    if (!KEYS[key]) throw new Error(`Unknown storage key: ${key}`); // Prevent accidental writes to undefined keys.
    localStorage.setItem(KEYS[key], JSON.stringify(value)); // Store the value under its matching app key.
  }

  // Create demo accounts and sample places the first time the app runs.
  static seed() {
    const starterUsers = [
      { id: "super-admin", name: "KyusiSphere Super Admin", email: "superadmin@kyusisphere.demo", age: 30, password: "superadmin123", role: "admin", isSuperAdmin: true },
      { id: "demo-owner", name: "Demo Owner", email: "owner@kyusisphere.demo", age: 30, password: "owner123", role: "owner" }
    ];

    const starterPlaces = [
      { id: "demo-place-1", name: "PixelPoint Computer Shop", description: "A neighborhood computer shop with hourly computer use and printing services.", location: "Quezon City, Metro Manila", ownerId: "demo-owner", category: "Computer Shop", reservationAvailable: true, walkInAvailable: true, contact: "0912 000 0001", price: "₱25 per hour", latitude: 14.6760, longitude: 121.0437 },
      { id: "demo-place-2", name: "The Study Nook", description: "A quiet place for individual study sessions and small group work.", location: "Quezon City, Metro Manila", ownerId: "demo-owner", category: "Study Area", reservationAvailable: true, walkInAvailable: true, contact: "thestudynook@example.com", price: "₱50 per session", latitude: 14.6507, longitude: 121.0494 },
      { id: "demo-place-3", name: "SoundSpace Rehearsal Room", description: "A simple practice room for musicians and small bands.", location: "Marikina City, Metro Manila", ownerId: null, category: "Practice Space", reservationAvailable: false, walkInAvailable: true, contact: "soundspace@example.com", price: "₱200 per hour", latitude: 14.6507, longitude: 121.1029 }
    ];

    if (localStorage.getItem(KEYS.users) === null) this.set("users", starterUsers); // Seed accounts only on a fresh browser profile.
    if (localStorage.getItem(KEYS.places) === null) this.set("places", starterPlaces); // Seed sample places only when no listings exist.
    if (localStorage.getItem(KEYS.reservations) === null) this.set("reservations", []); // Start with no reservation requests.
    if (localStorage.getItem(KEYS.suggestions) === null) this.set("suggestions", []); // Start with no community suggestions.
    if (localStorage.getItem(KEYS.stats) === null) this.set("stats", { student: 0, owner: 0, admin: 0 }); // Initialize login counters.
    if (localStorage.getItem(KEYS.session) === null) this.set("session", null); // Initialize the signed-in session.

    const users = this.get("users"); // Load accounts already saved by an earlier version of the project.
    const superAdmin = users.find(user => user.email === "superadmin@kyusisphere.demo"); // Locate the protected built-in administrator.
    if (!superAdmin) users.push(starterUsers[0]); // Restore the super admin if old demo data does not contain it.
    else { superAdmin.role = "admin"; superAdmin.isSuperAdmin = true; } // Keep its admin role and protection flag intact.
    this.set("users", users); // Save the normalized account list.

    const stats = this.get("stats"); // Normalize login statistics from older project versions.
    this.set("stats", { student: 0, owner: 0, admin: 0, ...stats }); // Ensure each role always has a numeric counter.
  }
}
