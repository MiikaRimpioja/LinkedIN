import { writable } from 'svelte/store';

// Load initial data from localStorage
const loadInitialData = () => {
  const storedData = localStorage.getItem('asiakkaat');
  return storedData ? JSON.parse(storedData) : [
    { nimi: 'Asiakas 1' },
    { nimi: 'Asiakas 2' }
  ];
};

// Create a writable store with the initial data
export const asiakkaat = writable(loadInitialData());

// Subscribe to the store and save data to localStorage whenever it changes
asiakkaat.subscribe((value) => {
  localStorage.setItem('asiakkaat', JSON.stringify(value));
});