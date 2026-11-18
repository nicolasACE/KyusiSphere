// Handles reservation requests and owner responses.
import { StorageService } from "./StorageService.js"; // Read and save reservation data.
import { Reservation } from "../models/Reservation.js"; // Create consistent reservation records.

export class ReservationService {
  // Return every reservation request.
  all() {
    return StorageService.get("reservations"); // Read the saved reservation list.
  }

  // Create a pending reservation after checking that the place accepts bookings.
  create(data) {
    const place = StorageService.get("places").find(item => item.id === data.placeId); // Find the requested listing.
    if (!place || !place.reservationAvailable) throw new Error("This place is not accepting reservations."); // Reject unavailable or invalid listings.
    if (!data.date || !data.time) throw new Error("Please select a date and time."); // Require the booking date and time.
    const reservations = this.all(); // Load existing reservation requests.
    reservations.push(new Reservation(data)); // Add the new pending request.
    StorageService.set("reservations", reservations); // Save the updated reservation list.
  }

  // Change a reservation's status after an owner responds.
  updateStatus(id, status) {
    if (!["Accepted", "Declined"].includes(status)) throw new Error("Invalid reservation status."); // Only allow the supported owner responses.
    const reservations = this.all(); // Load all requests before changing one.
    const targetExists = reservations.some(reservation => reservation.id === id); // Check that the request exists.
    if (!targetExists) throw new Error("Reservation not found."); // Stop if the request is missing.
    StorageService.set("reservations", reservations.map(reservation => reservation.id === id ? { ...reservation, status } : reservation)); // Save the changed status.
  }
}
