import { writable } from 'svelte/store';

// Load initial data from localStorage
const loadInitialData = () => {
  const storedData = localStorage.getItem('merkinnat');
  return storedData ? JSON.parse(storedData) : {};
};

// Create a writable store with the initial data
export const merkinnat = writable(loadInitialData());

// Subscribe to the store and save data to localStorage whenever it changes
merkinnat.subscribe((value) => {
  localStorage.setItem('merkinnat', JSON.stringify(value));
});