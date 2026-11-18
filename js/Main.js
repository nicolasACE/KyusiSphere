// Main controller for KyusiSphere: connects the interface, models, and services.
import { StorageService } from "./services/StorageService.js"; // Supplies browser-based demo storage.
import { AuthService } from "./services/AuthService.js"; // Supplies registration, login, and role updates.
import { PlaceService } from "./services/PlaceService.js"; // Supplies place discovery and listing management.
import { ReservationService } from "./services/ReservationService.js"; // Supplies booking request management.
import { SuggestionService } from "./services/SuggestionService.js"; // Supplies community place suggestions.

// The app class owns the current signed-in user and controls which screen is visible.
class KyusiSphereApp {
  // Prepare services, restore a saved session, attach events, and display the first screen.
  constructor() {
    StorageService.seed(); // Make sure demo records and required storage keys exist.
    this.auth = new AuthService(); // Create the account service used by forms and admin tools.
    this.places = new PlaceService(); // Create the place service used by discovery and dashboards.
    this.reservations = new ReservationService(); // Create the reservation service used by bookings.
    this.suggestions = new SuggestionService(); // Create the suggestion service used by the community form.
    this.currentUser = this.restoreSession(); // Restore the last signed-in account on this browser, if any.
    this.currentView = "landing"; // Start with the public landing page unless a session is restored.
    this.category = "All"; // Start discovery with every place category selected.
    this.query = ""; // Start with an empty search phrase.
    this.userLocation = null; // Ask for location only when the user requests nearby sorting.
    this.authMode = "register"; // Default the auth panel to registration mode.
    this.bindEvents(); // Connect buttons and forms to their JavaScript handlers.
    this.render(); // Draw the correct first screen.
  }

  // Restore the account ID saved at login and load its latest role from the user list.
  restoreSession() {
    const savedSession = StorageService.get("session"); // Read the last session marker from localStorage.
    if (!savedSession?.userId) return null; // No session marker means the visitor is signed out.
    const user = StorageService.get("users").find(account => account.id === savedSession.userId); // Find the current account record.
    if (!user) StorageService.set("session", null); // Clear a session whose account no longer exists.
    return user || null; // Return the current account or keep the visitor signed out.
  }

  // Attach delegated click handling and direct form/search listeners once at startup.
  bindEvents() {
    document.addEventListener("click", event => { // Listen once for buttons, including buttons created later.
      const viewButton = event.target.closest("[data-view]"); // Find a clicked navigation control, if present.
      const actionButton = event.target.closest("[data-action]"); // Find a clicked action control, if present.
      const categoryButton = event.target.closest("[data-category]"); // Find a clicked category filter, if present.
      if (viewButton) { event.preventDefault(); this.showView(viewButton.dataset.view); } // Navigate to the requested screen.
      if (actionButton) { event.preventDefault(); this.handleAction(actionButton.dataset.action, actionButton.dataset.id); } // Run the requested action.
      if (categoryButton) { // Update the discovery filter when a category chip is clicked.
        this.category = categoryButton.dataset.category; // Save the selected category.
        document.querySelectorAll(".filter-chip").forEach(button => button.classList.toggle("active", button === categoryButton)); // Highlight the selected chip.
        this.renderPlaces(); // Refresh the place cards using the new filter.
      }
    });

    document.getElementById("search-button").addEventListener("click", () => this.search()); // Search when the Search button is clicked.
    document.getElementById("search-input").addEventListener("keydown", event => { if (event.key === "Enter") this.search(); }); // Also search when Enter is pressed.
    document.getElementById("nearest-button").addEventListener("click", () => this.findNearest()); // Ask for location when nearest sorting is requested.
    document.getElementById("auth-form").addEventListener("submit", event => this.handleAuth(event)); // Handle both registration and login submissions.
    document.getElementById("suggestion-form").addEventListener("submit", event => this.handleSuggestion(event)); // Handle community suggestions.
    document.getElementById("place-form").addEventListener("submit", event => this.handlePlaceSave(event)); // Handle adding and editing listings.
    document.getElementById("reservation-form").addEventListener("submit", event => this.handleReservation(event)); // Handle reservation requests.
  }

  // Show a screen only when the current account has permission to access it.
  showView(view) {
    const allowedViews = ["landing", "auth", "discover", "suggest", "owner", "admin", "roles"]; // List every screen included in the HTML.
    if (!allowedViews.includes(view)) return this.notify("That page does not exist.", true); // Reject unknown navigation targets.
    if (!["landing", "auth"].includes(view) && !this.currentUser) return this.showAuth("login"); // Require login for app features.
    if (view === "owner" && this.currentUser?.role !== "owner") return this.notify("Owner access only.", true); // Restrict the owner dashboard.
    if (["admin", "roles"].includes(view) && this.currentUser?.role !== "admin") return this.notify("Admin access only.", true); // Restrict administrator screens.

    this.currentView = view; // Remember the active screen.
    document.querySelector(".topbar").classList.toggle("hidden", view === "landing"); // Hide the navigation on the minimal landing page.
    document.querySelector(".footer").classList.toggle("hidden", view === "landing"); // Hide the footer on the minimal landing page.
    document.querySelectorAll(".view").forEach(section => section.classList.add("hidden")); // Hide all screens before showing one.
    document.getElementById(`view-${view}`).classList.remove("hidden"); // Reveal the selected screen.
    document.querySelectorAll(".nav-link").forEach(button => button.classList.toggle("active", button.dataset.view === view)); // Highlight the active navigation tab.

    if (view === "owner") this.renderOwner(); // Refresh owner data whenever its dashboard opens.
    if (view === "admin") this.renderAdmin(); // Refresh admin data whenever its dashboard opens.
    if (view === "roles") this.renderRoles(); // Refresh role controls whenever settings opens.
    if (view === "discover") this.renderPlaces(); // Refresh place cards whenever discovery opens.
    window.scrollTo({ top: 0, behavior: "smooth" }); // Start each screen at its top.
  }

  // Switch between login and registration while disabling inactive form fields.
  showAuth(mode) {
    this.authMode = mode; // Remember which form action should run on submit.
    this.currentView = "auth"; // Mark the authentication screen as active.
    document.querySelector(".topbar").classList.remove("hidden"); // Keep navigation visible while the visitor signs in.
    document.querySelector(".footer").classList.remove("hidden"); // Keep the footer visible on the auth screen.
    document.querySelectorAll(".view").forEach(section => section.classList.add("hidden")); // Hide all other screens.
    document.getElementById("view-auth").classList.remove("hidden"); // Show the login/registration screen.

    const isRegistering = mode === "register"; // Decide which set of fields should be active.
    const registerFields = document.getElementById("register-fields"); // Get the registration field group.
    const loginFields = document.getElementById("login-fields"); // Get the login field group.
    registerFields.classList.toggle("hidden", !isRegistering); // Hide registration inputs during login.
    loginFields.classList.toggle("hidden", isRegistering); // Hide login inputs during registration.
    registerFields.querySelectorAll("input, select").forEach(input => { input.disabled = !isRegistering; }); // Disabled hidden inputs cannot block login validation.
    loginFields.querySelectorAll("input, select").forEach(input => { input.disabled = isRegistering; }); // Disabled login inputs are excluded from registration data.
    loginFields.querySelectorAll("input").forEach(input => { input.required = !isRegistering; }); // Require email and password only during login.

    document.getElementById("auth-heading").textContent = isRegistering ? "Create your account." : "Welcome back."; // Update the form heading.
    document.getElementById("auth-submit").textContent = isRegistering ? "Create account" : "Log in"; // Update the submit button label.
    document.getElementById("auth-switch").innerHTML = isRegistering // Build the link to switch to the other form mode.
      ? 'Already have an account? <button type="button" class="text-button" data-action="show-login">Log in</button>' // Registration mode offers login.
      : 'New to KyusiSphere? <button type="button" class="text-button" data-action="show-register">Create account</button>'; // Login mode offers registration.
    document.querySelectorAll(".nav-link").forEach(button => button.classList.remove("active")); // Clear selected app navigation while on auth.
    window.scrollTo({ top: 0, behavior: "smooth" }); // Bring the form into view.
  }

  // Handle navigation actions and controls generated inside dashboards.
  handleAction(action, id) {
    if (action === "show-login") return this.showAuth("login"); // Open the login form.
    if (action === "show-register") return this.showAuth("register"); // Open the registration form.
    if (action === "home") return this.currentUser ? this.showView("discover") : this.showView("landing"); // Brand link returns to the correct home screen.
    if (action === "logout") { // Clear the signed-in session.
      this.currentUser = null; // Remove the active account from memory.
      StorageService.set("session", null); // Remove the saved session from this browser.
      this.updateAccountUI(); // Restore the public login/register controls.
      this.showView("landing"); // Return to the public landing page.
      this.notify("You have logged out."); // Confirm the logout action.
      return; // Stop processing this action.
    }
    if (action === "save-role") { // Save a role selected by an administrator.
      const select = document.querySelector(`.role-select[data-id="${CSS.escape(id)}"]`); // Find the role selector for this account.
      if (!select) return; // Stop if the selector is no longer on the page.
      try { this.auth.updateRole(id, select.value, this.currentUser); this.renderRoles(); this.notify("Account role updated."); } // Save and refresh the role table.
      catch (error) { this.notify(error.message, true); } // Show a readable permission or validation error.
      return; // Finish the role action.
    }
    if (action === "add-place") return this.openPlaceDialog(); // Open an empty listing form.
    if (action === "edit-place") return this.openPlaceDialog(id); // Open the listing form with existing values.
    if (action === "delete-place") return this.confirmDelete(id); // Ask before deleting a listing.
    if (action === "reserve") return this.openReservationDialog(id); // Open a reservation form for a selected place.
    if (action === "close-place") return document.getElementById("place-dialog").close(); // Close the place dialog.
    if (action === "close-reservation") return document.getElementById("reservation-dialog").close(); // Close the reservation dialog.
    if (action === "accept-reservation") { this.reservations.updateStatus(id, "Accepted"); this.renderOwner(); this.notify("Reservation accepted."); return; } // Accept a booking request.
    if (action === "decline-reservation") { this.reservations.updateStatus(id, "Declined"); this.renderOwner(); this.notify("Reservation declined."); return; } // Decline a booking request.
    if (action === "remove-suggestion") { this.suggestions.remove(id); this.renderAdmin(); this.notify("Suggestion removed."); } // Remove a reviewed suggestion.
  }

  // Process either the registration form or the login form.
  handleAuth(event) {
    event.preventDefault(); // Keep the browser from reloading the page after submission.
    const form = event.currentTarget; // Get the form that was submitted.
    try {
      if (this.authMode === "register") { // Registration mode reads only enabled registration fields.
        const data = Object.fromEntries(new FormData(form)); // Convert active form fields into a plain object.
        this.currentUser = this.auth.register(data); // Validate and create the account.
      } else { // Login mode reads the dedicated login controls.
        this.currentUser = this.auth.login(form.elements.loginEmail.value, form.elements.loginPassword.value); // Authenticate the entered credentials.
      }
      StorageService.set("session", { userId: this.currentUser.id }); // Save the account ID so refreshes keep the demo signed in.
      form.reset(); // Clear old form values after successful authentication.
      this.updateAccountUI(); // Display the signed-in account and role-specific tabs.
      this.showView("discover"); // Send the account to Discover Places.
      this.notify(`Welcome, ${this.currentUser.name}!`); // Confirm successful login or registration.
    } catch (error) { this.notify(error.message, true); } // Display validation or login errors without breaking the page.
  }

  // Show only the account controls and navigation links allowed for the current role.
  updateAccountUI() {
    const target = document.getElementById("account-actions"); // Find the header area for account buttons.
    if (!this.currentUser) { // Public visitors can log in or register.
      target.innerHTML = '<button class="btn btn-quiet" data-action="show-login">Log in</button><button class="btn btn-primary" data-action="show-register">Register</button>'; // Render public account actions.
    } else { // Signed-in users see their name and logout action.
      target.innerHTML = `<span class="muted">${this.escape(this.currentUser.name)}</span><button class="btn btn-quiet" data-action="logout">Log out</button>`; // Render signed-in account actions.
    }
    document.querySelector('[data-view="discover"]').classList.remove("hidden"); // Discovery is available to every signed-in account.
    document.querySelector('[data-view="suggest"]').classList.toggle("hidden", !this.currentUser); // Suggestions require an account.
    document.querySelector('[data-view="owner"]').classList.toggle("hidden", this.currentUser?.role !== "owner"); // Only business owners see their dashboard tab.
    document.querySelector('[data-view="admin"]').classList.toggle("hidden", this.currentUser?.role !== "admin"); // Only admins see the admin dashboard tab.
    document.querySelector('[data-view="roles"]').classList.toggle("hidden", this.currentUser?.role !== "admin"); // Only admins see role settings.
  }

  // Apply the search box value and reset the category filter to all places.
  search() {
    this.query = document.getElementById("search-input").value; // Save the current search phrase.
    this.category = "All"; // Search across every category.
    document.querySelectorAll(".filter-chip").forEach(button => button.classList.toggle("active", button.dataset.category === "All")); // Highlight All places.
    this.showView("discover"); // Show the filtered discovery results.
  }

  // Ask the browser for location permission and sort listings by approximate distance.
  findNearest() {
    const status = document.getElementById("location-status"); // Find the message area below the location button.
    if (!navigator.geolocation) { status.textContent = "Geolocation is not supported by this browser."; return; } // Explain when location is unavailable.
    status.textContent = "Getting your location…"; // Tell the user the browser is requesting location.
    navigator.geolocation.getCurrentPosition(position => { // Run after the user grants location permission.
      this.userLocation = { latitude: position.coords.latitude, longitude: position.coords.longitude }; // Keep the user's coordinates in memory only.
      status.textContent = "Sorted by approximate distance from your current location."; // Explain the sorting result.
      this.renderPlaces(); // Re-render listings with distance values.
    }, () => { status.textContent = "Location permission was not granted. You can search by location instead."; }, { enableHighAccuracy: false, timeout: 10000 }); // Explain denial or timeout without blocking manual search.
  }

  // Render discovery cards using the current keyword, category, and optional location.
  renderPlaces() {
    const results = this.places.search(this.query, this.category, this.userLocation); // Ask PlaceService for matching listings.
    document.getElementById("result-count").textContent = `${results.length} place${results.length === 1 ? "" : "s"} found`; // Show the result count.
    const container = document.getElementById("place-list"); // Find the container for listing cards.
    if (!results.length) { container.innerHTML = '<div class="empty-state">No places found. Try another keyword or category.</div>'; return; } // Show an empty state when there are no matches.
    container.innerHTML = results.map(place => `
      <article class="place-card">
        <div class="place-top"><span class="place-icon">${this.categoryIcon(place.category)}</span><span class="category-tag">${this.escape(place.category)}</span></div>
        <h3>${this.escape(place.name)}</h3><p>${this.escape(place.description)}</p>
        <div class="place-meta"><span>⌖ ${this.escape(place.location)}</span><span>${this.escape(place.price || "Ask for rates")}</span>${place.distance != null ? `<span>◎ ${place.distance.toFixed(1)} km away</span>` : ""}<span>${place.walkInAvailable ? "Walk-ins available" : "Walk-ins unavailable"} · ${place.reservationAvailable ? "Reservations available" : "No reservations"}</span></div>
        <div class="place-actions"><span class="muted">${this.escape(place.contact || "Contact not provided")}</span>${place.reservationAvailable ? `<button class="btn btn-primary" data-action="reserve" data-id="${this.escape(place.id)}">Request booking</button>` : "<span class=\"muted\">Visit details</span>"}</div>
      </article>`).join(""); // Create one safe HTML card for every matching listing.
  }

  // Return a small visual symbol for each supported place category.
  categoryIcon(category) {
    return ({ "Computer Shop": "⌘", "Study Area": "✎", "Practice Space": "♫", "Other": "⌖" })[category] || "⌖"; // Use a neutral symbol for unknown categories.
  }

  // Open the listing form and prefill it when an existing listing is being edited.
  openPlaceDialog(id = null) {
    if (!this.currentUser || !["owner", "admin"].includes(this.currentUser.role)) return this.notify("Log in as a business owner or admin to manage a listing.", true); // Check listing permissions.
    const form = document.getElementById("place-form"); // Get the listing form.
    form.reset(); // Clear values left by the previous use of the dialog.
    const place = id ? this.places.all().find(item => item.id === id) : null; // Find the selected listing, if editing.
    document.getElementById("place-form-heading").textContent = place ? "Edit a place" : "Add a place"; // Set the dialog heading.
    form.elements.placeId.value = place?.id || ""; // Store the ID so save knows whether to add or edit.
    ["name", "description", "location", "category", "price", "contact", "latitude", "longitude"].forEach(key => { if (place) form.elements[key].value = place[key] ?? ""; }); // Prefill available text fields.
    form.elements.reservationAvailable.checked = Boolean(place?.reservationAvailable); // Restore reservation preference.
    form.elements.walkInAvailable.checked = place ? Boolean(place.walkInAvailable) : true; // Default new places to walk-in available.
    document.getElementById("place-dialog").showModal(); // Display the listing dialog.
  }

  // Validate and save a new listing or the edited version of an existing listing.
  handlePlaceSave(event) {
    event.preventDefault(); // Keep the dialog from submitting as a native page navigation.
    const form = event.currentTarget; // Get the listing form.
    const data = Object.fromEntries(new FormData(form)); // Convert the text fields into a plain object.
    data.id = data.placeId || ""; // Map the hidden placeId field to the model's id property.
    delete data.placeId; // Remove the temporary form-only property.
    data.reservationAvailable = form.elements.reservationAvailable.checked; // Read the reservation checkbox.
    data.walkInAvailable = form.elements.walkInAvailable.checked; // Read the walk-in checkbox.
    try {
      this.places.save(data, this.currentUser, this.currentUser.role === "admin"); // Save through the service permission checks.
      document.getElementById("place-dialog").close(); // Close the dialog after a successful save.
      this.notify("Place listing saved."); // Confirm the save.
      if (this.currentUser.role === "owner") this.renderOwner(); else this.renderAdmin(); // Refresh the correct dashboard.
      this.renderPlaces(); // Also refresh the discovery results.
    } catch (error) { this.notify(error.message, true); } // Keep the dialog open and explain any save error.
  }

  // Ask for confirmation before deleting a listing.
  confirmDelete(id) {
    if (!confirm("Delete this place listing? Related reservations will also be removed.")) return; // Stop if the user cancels.
    try {
      this.places.delete(id, this.currentUser, this.currentUser.role === "admin"); // Delete through the service permission checks.
      if (this.currentUser.role === "owner") this.renderOwner(); else this.renderAdmin(); // Refresh the dashboard that initiated deletion.
      this.renderPlaces(); // Remove the deleted listing from discovery.
      this.notify("Place deleted."); // Confirm deletion.
    } catch (error) { this.notify(error.message, true); } // Show any permission or missing-listing error.
  }

  // Open a reservation dialog for the selected place.
  openReservationDialog(placeId) {
    if (!this.currentUser) return this.showAuth("login"); // Require an account before booking.
    const place = this.places.all().find(item => item.id === placeId); // Find the selected listing.
    if (!place) return this.notify("Place not found.", true); // Stop if the listing no longer exists.
    const form = document.getElementById("reservation-form"); // Get the reservation form.
    form.reset(); // Clear previous booking details.
    form.elements.placeId.value = placeId; // Store which place is being requested.
    document.getElementById("reservation-place-name").textContent = place.name; // Show the selected place name.
    form.elements.date.min = new Date().toISOString().slice(0, 10); // Prevent choosing a date earlier than today.
    document.getElementById("reservation-dialog").showModal(); // Display the reservation dialog.
  }

  // Save a reservation request submitted by the signed-in user.
  handleReservation(event) {
    event.preventDefault(); // Keep the browser on the current screen.
    if (!this.currentUser) return this.showAuth("login"); // Require a signed-in account.
    const data = Object.fromEntries(new FormData(event.currentTarget)); // Read the booking form values.
    try {
      this.reservations.create({ ...data, userId: this.currentUser.id }); // Create a pending request linked to the current user.
      document.getElementById("reservation-dialog").close(); // Close the dialog after a successful request.
      this.notify("Your reservation request has been sent."); // Confirm submission.
    } catch (error) { this.notify(error.message, true); } // Show validation or availability errors.
  }

  // Save a community suggestion and clear the form when it succeeds.
  handleSuggestion(event) {
    event.preventDefault(); // Keep the page from reloading.
    const form = event.currentTarget; // Get the submitted suggestion form.
    const data = Object.fromEntries(new FormData(form)); // Convert the form fields into a plain object.
    try {
      this.suggestions.add(data, this.currentUser); // Save the suggestion through its service.
      form.reset(); // Clear the fields after successful submission.
      this.notify("Thank you! Your suggestion has been submitted for review."); // Confirm the submission.
    } catch (error) { this.notify(error.message, true); } // Show a helpful validation error.
  }

  // Draw the business owner's listings, reservation requests, and summary counts.
  renderOwner() {
    const mine = this.places.all().filter(place => place.ownerId === this.currentUser.id); // Keep only listings owned by this account.
    const placeIds = mine.map(place => place.id); // Collect owned listing IDs for reservation filtering.
    const reservations = this.reservations.all().filter(reservation => placeIds.includes(reservation.placeId)); // Find requests for owned listings.
    document.getElementById("owner-stats").innerHTML = this.statCards([["Your listings", mine.length], ["Reservation requests", reservations.length], ["Pending requests", reservations.filter(item => item.status === "Pending").length]]); // Show owner summary cards.
    document.getElementById("owner-places").innerHTML = mine.length ? `<table class="data-table"><thead><tr><th>Place</th><th>Category</th><th>Rate</th><th>Actions</th></tr></thead><tbody>${mine.map(place => `<tr><td>${this.escape(place.name)}</td><td>${this.escape(place.category)}</td><td>${this.escape(place.price)}</td><td><button class="small-btn" data-action="edit-place" data-id="${this.escape(place.id)}">Edit</button><button class="small-btn danger" data-action="delete-place" data-id="${this.escape(place.id)}">Delete</button></td></tr>`).join("")}</tbody></table>` : '<p class="empty-inline">You have not added a place yet.</p>'; // Show owned listings or an empty state.
    const users = StorageService.get("users"); // Load account names for the reservation table.
    document.getElementById("owner-reservations").innerHTML = reservations.length ? `<table class="data-table"><thead><tr><th>Place</th><th>Customer</th><th>Date / time</th><th>Status</th><th>Actions</th></tr></thead><tbody>${reservations.map(reservation => `<tr><td>${this.escape(this.places.all().find(place => place.id === reservation.placeId)?.name || "Place")}</td><td>${this.escape(users.find(user => user.id === reservation.userId)?.name || "User")}</td><td>${this.escape(reservation.date)} · ${this.escape(reservation.time)}</td><td>${this.escape(reservation.status)}</td><td>${reservation.status === "Pending" ? `<button class="small-btn" data-action="accept-reservation" data-id="${this.escape(reservation.id)}">Accept</button><button class="small-btn danger" data-action="decline-reservation" data-id="${this.escape(reservation.id)}">Decline</button>` : "—"}</td></tr>`).join("")}</tbody></table>` : '<p class="empty-inline">No reservation requests yet.</p>'; // Show requests or an empty state.
  }

  // Draw the administrator overview, listing table, suggestions, and login counters.
  renderAdmin() {
    const users = StorageService.get("users"); // Load all registered accounts.
    const places = this.places.all(); // Load every place listing.
    const reservations = this.reservations.all(); // Load all reservation requests.
    const suggestions = this.suggestions.all(); // Load community suggestions.
    const stats = StorageService.get("stats"); // Load login counts grouped by role.
    document.getElementById("admin-stats").innerHTML = this.statCards([["Registered accounts", users.length], ["Place listings", places.length], ["Reservations", reservations.length]]); // Show admin summary cards.
    document.getElementById("admin-places").innerHTML = places.length ? `<table class="data-table"><thead><tr><th>Place</th><th>Category</th><th>Owner</th><th>Actions</th></tr></thead><tbody>${places.map(place => `<tr><td>${this.escape(place.name)}</td><td>${this.escape(place.category)}</td><td>${this.escape(users.find(user => user.id === place.ownerId)?.name || "Unassigned")}</td><td><button class="small-btn" data-action="edit-place" data-id="${this.escape(place.id)}">Edit</button><button class="small-btn danger" data-action="delete-place" data-id="${this.escape(place.id)}">Delete</button></td></tr>`).join("")}</tbody></table>` : '<p class="empty-inline">No listings yet.</p>'; // Show all listings and admin actions.
    document.getElementById("admin-suggestions").innerHTML = suggestions.length ? `<table class="data-table"><thead><tr><th>Suggested place</th><th>Location</th><th>Submitted by</th><th>Details</th><th>Action</th></tr></thead><tbody>${suggestions.map(suggestion => `<tr><td>${this.escape(suggestion.placeName)}</td><td>${this.escape(suggestion.location)}</td><td>${this.escape(suggestion.submittedBy)}</td><td>${this.escape(suggestion.message)}</td><td><button class="small-btn danger" data-action="remove-suggestion" data-id="${this.escape(suggestion.id)}">Remove</button></td></tr>`).join("")}</tbody></table>` : '<p class="empty-inline">No suggestions submitted yet.</p>'; // Show suggestions for admin review.
    document.getElementById("login-stats").innerHTML = this.statCards([["Student / user logins", stats.student || 0], ["Owner logins", stats.owner || 0], ["Admin logins", stats.admin || 0]]); // Show login counts by role.
  }

  // Draw the administrator-only role management table.
  renderRoles() {
    if (this.currentUser?.role !== "admin") return; // Do not render role data for non-admin accounts.
    const users = StorageService.get("users"); // Load all registered accounts.
    document.getElementById("role-management").innerHTML = users.length ? `<table class="data-table"><thead><tr><th>Name</th><th>Email</th><th>Current role</th><th>Change role</th><th>Action</th></tr></thead><tbody>${users.map(user => `<tr><td>${this.escape(user.name)}${user.isSuperAdmin ? " · Super Admin" : ""}</td><td>${this.escape(user.email)}</td><td>${this.escape(user.role)}</td><td><select class="role-select" data-id="${this.escape(user.id)}" ${user.isSuperAdmin ? "disabled" : ""}><option value="student" ${user.role === "student" ? "selected" : ""}>Student / User</option><option value="owner" ${user.role === "owner" ? "selected" : ""}>Business owner</option><option value="admin" ${user.role === "admin" ? "selected" : ""}>Admin</option></select></td><td>${user.isSuperAdmin ? '<span class="muted">Protected</span>' : `<button class="small-btn" data-action="save-role" data-id="${this.escape(user.id)}">Save</button>`}</td></tr>`).join("")}</tbody></table>` : '<p class="empty-inline">No accounts registered yet.</p>'; // Show accounts and role controls.
  }

  // Convert a list of label/value pairs into reusable dashboard statistic cards.
  statCards(items) {
    return items.map(([label, value]) => `<div class="stat-card"><span>${this.escape(label)}</span><strong>${this.escape(value)}</strong></div>`).join(""); // Render one card per statistic.
  }

  // Update account controls and open the correct first screen.
  render() {
    this.updateAccountUI(); // Reveal navigation items for the current role.
    this.showView(this.currentUser ? "discover" : "landing"); // Signed-in users go to discovery; guests see the landing page.
  }

  // Display a temporary success or error message near the top of the page.
  notify(message, isError = false) {
    const element = document.getElementById("notice"); // Find the notification area.
    element.textContent = message; // Insert the message as text to avoid interpreting HTML.
    element.classList.toggle("error", isError); // Apply error styling only when needed.
    element.classList.remove("hidden"); // Make the notification visible.
    clearTimeout(this.noticeTimer); // Cancel the previous notification timer, if one exists.
    this.noticeTimer = setTimeout(() => element.classList.add("hidden"), 3500); // Hide the message after a short delay.
  }

  // Escape user-provided text before inserting it into HTML templates.
  escape(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]); // Prevent user text from becoming HTML markup.
  }
}

// Start the app after the browser has loaded this JavaScript module.
try {
  new KyusiSphereApp(); // Create the single app instance that controls the page.
} catch (error) {
  console.error("KyusiSphere could not start:", error); // Log technical details for developers.
  const notice = document.getElementById("notice"); // Find the visible error area if the page structure loaded.
  if (notice) { notice.textContent = "KyusiSphere could not start. Run this project using Live Server or GitHub Pages, then check the browser console for details."; notice.classList.remove("hidden"); notice.classList.add("error"); } // Show clear next steps instead of a blank interface.
}
