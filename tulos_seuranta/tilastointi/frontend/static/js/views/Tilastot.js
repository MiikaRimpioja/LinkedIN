import AbstractView from './AbstractView.js';

// Tilastot-näkymän luokka, joka perii AbstractView-luokan
export default class extends AbstractView {
  constructor(params) {
    super(params);
    this.setTitle('Tilastot');
  }

  // Palauttaa HTML-sisällön näkymälle
  async getHtml() {
    return `
    <h1 class="mb-4" id="sivun_otsikko">Pistepörssi</h1>
    
      <div class="container mt-6">
        <!-- Pelaajien tilastotaulukko -->
        <h3>Pelaajat</h3>
        <div class="tbodyDiv">
        <table class="table table-striped mb-5" id="table">
          <thead>
            <tr>
              <th scope="col">Pelaaja</th>
              <th scope="col">Maalit</th>
              <th scope="col">Syötöt</th>
              <th scope="col">Pisteet</th>
            </tr>
          </thead>
          <tbody id="player-stats">
            <!-- Pelaajarivit generoidaan dynaamisesti -->
          </tbody>
        </table>
        </div>
      </div>
        <div class="container mt-6">
        <!-- Joukkueiden tilastotaulukko -->
        <h3>Joukkueet</h3>
        <div class="tbodyDiv">
        <table class="table table-striped">
          <thead>
            <tr>
              <th scope="col">Joukkue</th>
              <th scope="col">Voitot</th>
              <th scope="col">Tasapelit</th>
              <th scope="col">Häviöt</th>
              <th scope="col">Pisteet</th>
            </tr>
          </thead>
          <tbody id="team-stats">
            <!-- Joukkueiden rivit generoidaan dynaamisesti -->
          </tbody>
        </table>
        </div>
      </div>
    `;
  }

  // Haetaan pelaajien ja joukkueiden tilastot palvelimelta
  async fetchData() {
    try {
      const playerResponse = await fetch('/player-stats');
      if (!playerResponse.ok) {
        throw new Error('Network response was not ok for player stats');
      }
      const playerData = await playerResponse.json();
      this.displayPlayerData(playerData);

      const teamResponse = await fetch('/team-stats');
      if (!teamResponse.ok) {
        throw new Error('Network response was not ok for team stats');
      }
      const teamData = await teamResponse.json();
      this.displayTeamData(teamData);
    } catch (error) {
      console.error('Error:', error);
      const container = document.querySelector('.container');
      container.innerHTML = `<div class="alert alert-danger" role="alert">Failed to fetch data: ${error.message}</div>`;
    }
  }

  // Näytetään pelaajien tilastot näkymässä
  displayPlayerData(players) {
    const playerStatsTable = document.getElementById('player-stats');
    playerStatsTable.innerHTML = ''; // Tyhjennetään olemassa olevat rivit
    players.forEach((player) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${player.etunimi} ${player.pelinumero}</td>
        <td>${player.tehdyt_maalit}</td>
        <td>${player.syottopisteet}</td>
        <td>${player.kokonaispisteet}</td>
      `;
      playerStatsTable.appendChild(row);
    });
  }

  // Näytetään joukkueiden tilastot näkymässä
  displayTeamData(teams) {
    const teamStatsTable = document.getElementById('team-stats');
    teamStatsTable.innerHTML = ''; // Tyhjennetään olemassa olevat rivit
    teams.forEach((team) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${team.nimi}</td>
        <td>${team.voitot}</td>
        <td>${team.tasapelit}</td>
        <td>${team.haviot}</td>
        <td>${team.pisteet}</td>
      `;
      teamStatsTable.appendChild(row);
    });
  }

  // Haetaan data kun näkymä avataan (Tässä näkymässä ei ole tapahtumakuuntelijoita)
  addEventListeners() {
    this.fetchData();
  }
}
