// Represents one computer shop, study area, practice space, or other listing.
export class Place {
  // Build a place from data submitted by an owner or administrator.
  constructor(data) {
    this.id = data.id || crypto.randomUUID(); // Give the listing a unique identifier.
    this.name = data.name.trim(); // Store the public name of the place.
    this.description = data.description.trim(); // Store the place description.
    this.location = data.location.trim(); // Store the written address or location.
    this.ownerId = data.ownerId || null; // Link the listing to its owner when available.
    this.category = data.category || "Other"; // Categorize the listing for filtering.
    this.reservationAvailable = Boolean(data.reservationAvailable); // Record whether booking requests are accepted.
    this.walkInAvailable = Boolean(data.walkInAvailable); // Record whether walk-in visits are accepted.
    this.contact = data.contact || ""; // Store optional contact information.
    this.price = data.price || "Ask for rates"; // Show a helpful default when no rate is provided.
    this.latitude = data.latitude === "" || data.latitude == null ? null : Number(data.latitude); // Convert optional latitude to a number.
    this.longitude = data.longitude === "" || data.longitude == null ? null : Number(data.longitude); // Convert optional longitude to a number.
    this.createdAt = data.createdAt || new Date().toISOString(); // Record when the listing was created.
  }
}
