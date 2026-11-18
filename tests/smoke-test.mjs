// Lightweight smoke tests for the project services; run with `node test-services.mjs`.
import assert from 'node:assert/strict'; // Provides readable pass/fail assertions.
import { StorageService } from '../js/services/StorageService.js'; // Test the storage and demo seeding layer.
import { AuthService } from '../js/services/AuthService.js'; // Test registration, login, and role permissions.
import { PlaceService } from '../js/services/PlaceService.js'; // Test listing creation and search.
import { ReservationService } from '../js/services/ReservationService.js'; // Test reservation creation and status changes.
import { SuggestionService } from '../js/services/SuggestionService.js'; // Test community suggestions.

// Provide a small localStorage substitute so tests run in Node without a browser.
const memory = new Map(); // Hold key/value strings during this test run.
globalThis.localStorage = { // Implement the three localStorage methods used by the app.
  getItem(key) { return memory.has(key) ? memory.get(key) : null; }, // Read a stored value or return null.
  setItem(key, value) { memory.set(key, String(value)); }, // Save values as strings.
  removeItem(key) { memory.delete(key); } // Remove a key when needed.
};

StorageService.seed(); // Create the demo admin, demo owner, and sample place records.
const auth = new AuthService(); // Create the service under test.
const admin = auth.login('superadmin@kyusisphere.demo', 'superadmin123'); // Verify the built-in super admin can log in.
assert.equal(admin.role, 'admin'); // Confirm the built-in account has administrator access.
assert.equal(admin.isSuperAdmin, true); // Confirm the built-in account is marked protected.

const student = auth.register({ name: 'Test Student', email: 'student@example.com', age: '17', password: 'student123', role: 'student' }); // Register a new student account.
assert.equal(auth.login('STUDENT@example.com', 'student123').id, student.id); // Verify case-insensitive email login.
assert.throws(() => auth.register({ name: 'Duplicate', email: 'student@example.com', age: '17', password: 'student123', role: 'student' }), /already exists/); // Reject duplicate emails.
assert.throws(() => auth.updateRole(admin.id, 'student', student), /Administrator access required/); // Reject role changes by non-admin users.
auth.updateRole(student.id, 'owner', admin); // Allow the super admin to promote the test account.
assert.equal(StorageService.get('users').find(user => user.id === student.id).role, 'owner'); // Confirm the role change was saved.
assert.throws(() => auth.updateRole(admin.id, 'student', admin), /super admin role cannot be changed/); // Protect the super admin account.

const placeService = new PlaceService(); // Create the place service.
const createdPlace = { name: 'Test Study Hub', description: 'A quiet place to study.', location: 'Meycauayan', category: 'Study Area', reservationAvailable: true, walkInAvailable: true, price: '₱30 per hour', latitude: 14.7, longitude: 120.9 }; // Define a valid test listing.
placeService.save(createdPlace, { ...student, role: 'owner' }); // Save the listing as the promoted owner.
const foundPlaces = placeService.search('study', 'Study Area'); // Search the new listing by keyword and category.
assert.equal(foundPlaces.some(place => place.name === 'Test Study Hub'), true); // Confirm the listing is discoverable.

const reservationService = new ReservationService(); // Create the reservation service.
reservationService.create({ placeId: placeService.all().find(place => place.name === 'Test Study Hub').id, userId: student.id, date: '2026-12-01', time: '10:00' }); // Submit a booking request.
const reservation = reservationService.all()[0]; // Read the newly created request.
assert.equal(reservation.status, 'Pending'); // New requests must start as pending.
reservationService.updateStatus(reservation.id, 'Accepted'); // Simulate the owner accepting the request.
assert.equal(reservationService.all()[0].status, 'Accepted'); // Confirm the status update was saved.

const suggestionService = new SuggestionService(); // Create the suggestion service.
suggestionService.add({ placeName: 'Community Library', location: 'Meycauayan', message: 'Useful study place.' }, student); // Submit a suggestion.
assert.equal(suggestionService.all().length, 1); // Confirm the suggestion was saved.

console.log('PASS: demo seed, registration, login, duplicate validation, role permissions, place search, reservations, and suggestions.'); // Report successful smoke tests.
