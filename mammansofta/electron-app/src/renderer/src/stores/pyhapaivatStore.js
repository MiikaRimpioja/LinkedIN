import { readable } from 'svelte/store';

export const pyhapaivat = readable([
  { date: '2024-12-31', name: 'Uudenvuodenaatto', day: 'ti' },
  { date: '2025-01-01', name: 'Uudenvuodenpäivä', day: 'ke' },
  { date: '2025-01-06', name: 'Loppiainen', day: 'ma' },
  { date: '2025-04-18', name: 'Pitkäperjantai', day: 'pe' },
  { date: '2025-04-20', name: 'Pääsiäispäivä', day: 'su' },
  { date: '2025-04-21', name: 'Toinen pääsiäispäivä', day: 'ma' },
  { date: '2025-04-30', name: 'Vappuaatto', day: 'ke' },
  { date: '2025-05-01', name: 'Vappupäivä', day: 'to' },
  { date: '2025-05-29', name: 'Helatorstai', day: 'to' },
  { date: '2025-06-08', name: 'Helluntai', day: 'su' },
  { date: '2025-06-20', name: 'Juhannusaatto', day: 'pe' },
  { date: '2025-06-21', name: 'Juhannuspäivä', day: 'la' },
  { date: '2025-11-01', name: 'Pyhäinpäivä', day: 'la' },
  { date: '2025-12-06', name: 'Suomen Itsenäisyyspäivä', day: 'la' },
  { date: '2025-12-24', name: 'Jouluaatto', day: 'ke' },
  { date: '2025-12-25', name: 'Joulupäivä', day: 'to' },
  { date: '2025-12-26', name: 'Tapaninpäivä', day: 'pe' },
  { date: '2025-12-31', name: 'Uudenvuodenaatto', day: 'ke' },
  { date: '2026-01-01', name: 'Uudenvuodenpäivä', day: 'to' },
  { date: '2026-01-06', name: 'Loppiainen', day: 'ti' },
  { date: '2026-04-03', name: 'Pitkäperjantai', day: 'pe' },
  { date: '2026-04-05', name: 'Pääsiäispäivä', day: 'su' },
  { date: '2026-04-06', name: 'Toinen pääsiäispäivä', day: 'ma' },
  { date: '2026-05-01', name: 'Vappu', day: 'pe' },
  { date: '2026-05-10', name: 'Äitienpäivä', day: 'su', type: 'Ei virallinen pyhäpäivä' },
  { date: '2026-05-14', name: 'Helatorstai', day: 'to' },
  { date: '2026-05-24', name: 'Helluntai', day: 'su' },
  { date: '2026-06-19', name: 'Juhannusaatto', day: 'pe', type: 'Ei virallinen pyhäpäivä' },
  { date: '2026-06-20', name: 'Juhannuspäivä', day: 'la' },
  { date: '2026-10-31', name: 'Pyhäinpäivä', day: 'la' },
  { date: '2026-11-08', name: 'Isänpäivä', day: 'su', type: 'Ei virallinen pyhäpäivä' },
  { date: '2026-12-06', name: 'Itsenäisyyspäivä', day: 'su' },
  { date: '2026-12-24', name: 'Jouluaatto', day: 'to', type: 'Ei virallinen pyhäpäivä' },
  { date: '2026-12-25', name: 'Joulupäivä', day: 'pe' },
  { date: '2026-12-26', name: 'Tapaninpäivä', day: 'la' }
]);