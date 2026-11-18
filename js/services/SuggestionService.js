// Handles community suggestions for places that should be added to KyusiSphere.
import { StorageService } from "./StorageService.js"; // Read and save suggestion records.

export class SuggestionService {
  // Return all submitted suggestions.
  all() {
    return StorageService.get("suggestions"); // Read the saved suggestions list.
  }

  // Add a suggestion and record who submitted it.
  add(data, user) {
    if (!data.placeName?.trim() || !data.location?.trim() || !data.message?.trim()) throw new Error("Please complete all suggestion fields."); // Validate required suggestion details.
    const items = this.all(); // Load existing suggestions.
    items.push({ id: crypto.randomUUID(), ...data, submittedBy: user?.name || "Guest", createdAt: new Date().toISOString(), status: "For review" }); // Add the new suggestion with basic metadata.
    StorageService.set("suggestions", items); // Save the updated suggestion list.
  }

  // Remove one suggestion after an administrator reviews it.
  remove(id) {
    StorageService.set("suggestions", this.all().filter(suggestion => suggestion.id !== id)); // Save every suggestion except the selected one.
  }
}
