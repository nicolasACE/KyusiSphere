// Represents a user's request to reserve a listed place.
export class Reservation {
  // Build a reservation from the booking form and the signed-in user's ID.
  constructor(data) {
    this.id = data.id || crypto.randomUUID(); // Give the reservation a unique identifier.
    this.placeId = data.placeId; // Identify which listing the user wants to visit.
    this.userId = data.userId; // Identify who submitted the request.
    this.date = data.date; // Store the requested visit date.
    this.time = data.time; // Store the requested visit time.
    this.note = data.note || ""; // Keep any optional note from the user.
    this.status = data.status || "Pending"; // New requests wait for the owner to respond.
    this.createdAt = data.createdAt || new Date().toISOString(); // Record when the request was submitted.
  }
}
