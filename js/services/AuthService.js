// Handles account registration, login, and administrator role changes.
import { StorageService } from "./StorageService.js"; // Read and save account data in the browser.
import { UserAccount } from "../models/UserAccount.js"; // Use the account model for new registrations.

export class AuthService {
  // Validate registration data, reject duplicate emails, and save the new account.
  register(data) {
    const users = StorageService.get("users"); // Load every account currently registered.
    const name = String(data.name || "").trim(); // Normalize the submitted name.
    const email = String(data.email || "").toLowerCase().trim(); // Normalize the submitted email.
    const password = String(data.password || ""); // Read the submitted password.
    const age = Number(data.age); // Convert age to a number before validating it.

    if (!name || !email || !password) throw new Error("Please complete all required fields."); // Reject missing details.
    if (!Number.isInteger(age) || age < 13 || age > 120) throw new Error("Please enter a valid age of 13 or above."); // Check age range.
    if (password.length < 6) throw new Error("Your password must contain at least 6 characters."); // Enforce the form's password minimum.
    if (users.some(user => user.email.toLowerCase() === email)) throw new Error("An account with this email already exists."); // Prevent duplicate accounts.
    if (!["student", "owner"].includes(data.role)) throw new Error("Please choose a valid account type."); // Only allow public registration roles.

    const user = new UserAccount({ ...data, name, email, age }); // Create a normalized account object.
    users.push(user); // Add the new account to the account list.
    StorageService.set("users", users); // Persist the updated account list.
    return user; // Return the new account so the app can sign it in.
  }

  // Allow an administrator to change another account's role.
  updateRole(userId, role, actingAdmin) {
    if (actingAdmin?.role !== "admin") throw new Error("Administrator access required."); // Verify the current account is an admin.
    if (!["student", "owner", "admin"].includes(role)) throw new Error("Invalid role selected."); // Reject unsupported roles.

    const users = StorageService.get("users"); // Load all accounts before updating one.
    const target = users.find(user => user.id === userId); // Find the account selected in the role table.
    if (!target) throw new Error("Account not found."); // Stop if the selected account no longer exists.
    if (target.isSuperAdmin) throw new Error("The super admin role cannot be changed."); // Protect the built-in super admin.
    if (target.id === actingAdmin.id && role !== "admin") throw new Error("You cannot remove your own administrator access."); // Prevent self-lockout.

    target.role = role; // Apply the selected role to the target account.
    StorageService.set("users", users); // Save the updated account list.
    return target; // Return the changed account for confirmation or UI updates.
  }

  // Match a login email and password against the accounts saved in this browser.
  login(email, password) {
    const normalizedEmail = String(email || "").toLowerCase().trim(); // Normalize email the same way registration does.
    const normalizedPassword = String(password || ""); // Ensure password comparison uses a string.
    const user = StorageService.get("users").find(account => account.email.toLowerCase() === normalizedEmail && account.password === normalizedPassword); // Find the matching account.
    if (!user) throw new Error("Email or password is incorrect."); // Show a general error without revealing which field failed.

    const stats = StorageService.get("stats"); // Read login counters for the dashboard.
    stats[user.role] = (stats[user.role] || 0) + 1; // Increment the counter for this account's role.
    StorageService.set("stats", stats); // Save the updated counters.
    return user; // Return the authenticated demo account.
  }
}
