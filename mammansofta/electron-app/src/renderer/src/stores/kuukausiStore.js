import { writable } from 'svelte/store';

export const valittuKuukausi = writable({ vuosi: 2025, kuukausi: 'Tammikuu', numero: 0, paivat: 31, viikot: [1, 2, 3, 4, 5], viimeinenViikkoPaivat: 3, ekanViikonPaivat: 5 });