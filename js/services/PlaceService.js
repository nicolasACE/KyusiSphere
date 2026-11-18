// Handles place listings, keyword search, distance sorting, and owner permissions.
import { StorageService } from "./StorageService.js"; // Load and save place records.
import { Place } from "../models/Place.js"; // Build consistent place objects.

export class PlaceService {
  // Return every saved place listing.
  all() {
    return StorageService.get("places"); // Read the place collection from localStorage.
  }

  // Filter listings by keyword and category, then optionally sort by distance.
  search(query = "", category = "All", userLocation = null) {
    const keyword = query.trim().toLowerCase(); // Normalize the search phrase once.
    let results = this.all().filter(place => { // Keep only listings matching both filters.
      const searchableValues = [place.name, place.description, place.location, place.category]; // Fields that users can search.
      const matchesText = !keyword || searchableValues.some(value => String(value || "").toLowerCase().includes(keyword)); // Check the keyword against each field.
      const matchesCategory = category === "All" || place.category === category; // Check the selected category.
      return matchesText && matchesCategory; // Include the listing only when both checks pass.
    });

    if (userLocation) { // Sort by approximate distance only after the user shares their location.
      results = results.map(place => ({ ...place, distance: this.distance(userLocation.latitude, userLocation.longitude, place.latitude, place.longitude) })); // Add a distance value to each result.
      results.sort((first, second) => (first.distance ?? Infinity) - (second.distance ?? Infinity)); // Put listings with known distances first.
    }
    return results; // Return the filtered and optionally sorted listings.
  }

  // Calculate straight-line distance between two latitude/longitude coordinates.
  distance(latitudeOne, longitudeOne, latitudeTwo, longitudeTwo) {
    if (latitudeTwo == null || longitudeTwo == null) return null; // A listing without coordinates cannot be measured.
    const radians = degrees => degrees * Math.PI / 180; // Convert degrees to radians for trigonometry.
    const latitudeDifference = radians(latitudeTwo - latitudeOne); // Calculate the latitude difference.
    const longitudeDifference = radians(longitudeTwo - longitudeOne); // Calculate the longitude difference.
    const haversine = Math.sin(latitudeDifference / 2) ** 2 + Math.cos(radians(latitudeOne)) * Math.cos(radians(latitudeTwo)) * Math.sin(longitudeDifference / 2) ** 2; // Apply the Haversine formula.
    return 6371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine)); // Return distance in kilometers.
  }

  // Add a new listing or update an existing listing after checking permissions.
  save(data, currentUser, isAdmin = false) {
    if (!currentUser || !["owner", "admin"].includes(currentUser.role)) throw new Error("Only business owners and admins can manage listings."); // Require a permitted account.
    const places = this.all(); // Load current listings before editing.

    if (data.id) { // An ID means this is an edit operation.
      const index = places.findIndex(place => place.id === data.id); // Find the listing being edited.
      if (index < 0) throw new Error("Place not found."); // Stop if the listing no longer exists.
      if (!isAdmin && places[index].ownerId !== currentUser.id) throw new Error("You can only edit your own listings."); // Owners may edit only their own listings.
      places[index] = { ...places[index], ...data }; // Merge submitted fields into the saved listing.
    } else { // No ID means this is a new listing.
      places.push(new Place({ ...data, ownerId: isAdmin ? (data.ownerId || null) : currentUser.id })); // Assign the owner or leave admin-created listing unassigned.
    }

    StorageService.set("places", places); // Save the updated listing collection.
  }

  // Delete a listing and remove reservations that refer to it.
  delete(id, currentUser, isAdmin = false) {
    if (!currentUser || !["owner", "admin"].includes(currentUser.role)) throw new Error("Only business owners and admins can manage listings."); // Require a permitted account.
    const places = this.all(); // Load listings before deleting.
    const target = places.find(place => place.id === id); // Find the listing selected for deletion.
    if (!target || (!isAdmin && target.ownerId !== currentUser.id)) throw new Error("You cannot delete this listing."); // Enforce ownership for non-admin users.
    StorageService.set("places", places.filter(place => place.id !== id)); // Save the list without the deleted place.
    StorageService.set("reservations", StorageService.get("reservations").filter(reservation => reservation.placeId !== id)); // Remove bookings tied to the deleted place.
  }
}
