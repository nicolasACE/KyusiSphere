// Represents a person who can register and use KyusiSphere.
export class UserAccount {
  // Build a new account from validated registration form data.
  constructor({ id, name, email, age, password, role, createdAt = new Date().toISOString() }) {
    this.id = id || crypto.randomUUID(); // Give the account a unique identifier.
    this.name = name.trim(); // Store the person's display name without extra spaces.
    this.email = email.toLowerCase().trim(); // Normalize email so login matching is consistent.
    this.age = Number(age); // Convert the submitted age into a number.
    this.password = password; // Demo only: production systems must hash passwords on a server.
    this.role = role; // Allowed roles are student, owner, and admin.
    this.createdAt = createdAt; // Record when the account was created.
  }
}
