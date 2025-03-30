import AbstractView from './AbstractView.js';

// Hallinto -näkymän luokka joka perii AbstractView -luokan
export default class extends AbstractView {
  constructor(params) {
    super(params);
    this.setTitle('Hallitus');
  }

  //Näkymän HTML-koodi
  async getHtml() {
    return `
      <div id="loginContainer" class="container mt-6"  style="display: block;">
        <div class="row justify-content-center">
          <div class="col-md-4">
            <form id="loginForm">
            <h2>Sisäänkirjautuminen</h2>
              <div class="mb-3">
                <label for="username" class="form-label">Käyttäjätunnus</label>
                <input type="text" class="form-control" id="username" placeholder="Kirjoita käyttäjätunnus" autocomplete="username" required>
                <div class="invalid-feedback">Please enter your username.</div>
              </div>
              <div class="mb-3">
                <label for="password" class="form-label">Salasana</label>
                <input type="password" class="form-control" id="password" placeholder="Kirjoita salasana" autocomplete="current-password" required>
                <div class="invalid-feedback">Please enter your password.</div>
              </div>
              <button type="submit" class="btn btn-primary w-100">Kirjaudu sisään</button>
            </form>
          </div>
        </div>
      </div>
      <div id="mainContent" class="container mt-6" style="display: none;">
        <h2>Tervetuloa Hallitukseen</h2>
        <a class="live_hallitus_link" href="/hallinto:live" data-link>Live-pelin tilastointiin --></a>
        <div id="results" class="results"></div>
        <div class="container mt-6">
          <h2>Lisää joukkue</h2>
          <form id="addTeamForm">
            <div class="mb-3">
              <label for="teamName" class="form-label">Joukkueen nimi</label>
              <input type="text" class="form-control" id="teamName" placeholder="Anna joukkueen nimi" required>
            </div>
            <button type="submit" class="btn btn-primary">Lisää joukkue</button>
          </form>
        </div>
        <div class="container mt-6">
          <h2>Lisää pelaaja joukkueeseen</h2>
          <form id="addPlayerForm">
            <div class="mb-3">
              <label for="playerName" class="form-label">Pelaajan nimi</label>
              <input type="text" class="form-control" id="playerName" placeholder="Anna pelaajan nimi">
            </div>
            <div class="mb-3">
              <label for="jerseyNumber" class="form-label">Pelinumero</label>
              <input type="number" class="form-control" id="jerseyNumber" placeholder="Anna pelaajan pelinumero">
            </div>
            <div class="mb-3">
              <label for="team_ID" class="form-label">Joukkue</label>
              <select class="form-select" id="team_id" name="team1"></select>
            </div>
            <button type="submit" class="btn btn-primary">Lisää pelaaja</button>
          </form>
        </div>
        <div class="container mt-6">
          <h2>Lisää ottelu</h2>
          <form id="addMatchForm">
            <div class="mb-3">
              <label for="homeTeam" class="form-label">Kotijoukkue</label>
              <select class="form-select" id="homeTeam" name="homeTeam"></select>
            </div>
            <div class="mb-3">
              <label for="awayTeam" class="form-label">Vierasjoukkue</label>
              <select class="form-select" id="awayTeam" name="awayTeam"></select>
            </div>
            <div class="mb-3">
              <label for="matchDate" class="form-label">Ottelupäivä</label>
              <input type="datetime-local" class="form-control" id="matchDate">
            </div>
            <button type="submit" class="btn btn-primary">Lisää ottelu</button>
          </form>
        </div>
      </div>
    `;
  }

  //tapahtumankuuntelijat
  addEventListeners() {
    // Haetaan pääsisältö ja kirjautumiskontaineri
    const mainContent = document.getElementById('mainContent');
    const loginContainer = document.getElementById('loginContainer');

    //Tarkistetaan, onko kirjautumislomake olemassa
    if (loginForm) {
      //tapahtumakuuntelija kirjautumislomakkeen lähettämiselle
      loginForm.addEventListener('submit', (event) => {
        //Estetään sivun päivittyminen lomaketta lähetettäessä
        event.preventDefault();

        const username = document.getElementById('username');
        const password = document.getElementById('password');

        //poistetaan virheluokat
        username.classList.remove('is-invalid');
        password.classList.remove('is-invalid');

        let isValid = true;

        // Tarkistetaan, onko käyttäjänimi ja salasana tyhjä
        if (username.value.trim() === '') {
          username.classList.add('is-invalid');
          isValid = false;
        }

        if (password.value.trim() === '') {
          password.classList.add('is-invalid');
          isValid = false;
        }
        // Tarkistetaan tunnukset ja poistetaan lomake näkyvistä, mikäli
        // tunnukset ovat oikein
        if (isValid) {
          if (this.validateCredentials(username.value, password.value)) {
            mainContent.style.display = 'block';
            loginContainer.style.display = 'none';

            this.fetchData();
          } else {
            alert('Invalid username or password');
          }
        }
      });
    }

    // Tarkistetaan, onko joukkueen lisäyslomake olemassa
    const addTeamForm = document.getElementById('addTeamForm');
    if (addTeamForm) {
      // Lisätään tapahtumankuuntelija joukkueen lisäyslomakkeen lähettämiselle
      addTeamForm.addEventListener('submit', (event) => {
        //Estetään sivun päivittäminen lomaketta lähetettäessä
        event.preventDefault();
        const data = { nimi: document.getElementById('teamName').value };
        // Lähetetään joukkueen tiedot palvelimelle
        fetch('/add-team', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        })
          .then((response) => response.json())
          .then((data) => {
            // Päivitetään joukkueet
            this.updateTeams({
              nimi: document.getElementById('teamName').value,
            });
          })
          .catch((error) => {
            console.error('Error:', error);
          });
      });
    }
  }

  // Käyttäjänimen ja salasanan oikeellisuuden tarkistusfunktio
  validateCredentials(username, password) {
    const correctUsername = 'Admin';
    const correctPassword = 'Diskuhha25';
    return username === correctUsername && password === correctPassword;
  }

  // Hakee joukkueiden tiedot palvelimelta
  async fetchData() {
    try {
      const response = await fetch('/fetch-teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      this.displayData(data);
    } catch (error) {
      console.error('Error:', error);
    }
  }

  // Näyttää haetut joukkueiden tiedot näkymässä
  displayData(teams) {
    if (!Array.isArray(teams)) {
      console.error('Invalid data structure:', teams);
      return;
    }

    const teamSelect = document.getElementById('team_id');
    const homeTeamSelect = document.getElementById('homeTeam');
    const awayTeamSelect = document.getElementById('awayTeam');

    if (!teamSelect || !homeTeamSelect || !awayTeamSelect) {
      console.error('Team select elements not found');
      return;
    }

    // Luodaan valintaelementtien sisällöt
    const optionsHtml = teams
      .map((team) => `<option value="${team.joukkue_ID}">${team.nimi}</option>`)
      .join('');
    teamSelect.innerHTML = optionsHtml;
    homeTeamSelect.innerHTML = optionsHtml;
    awayTeamSelect.innerHTML = optionsHtml;

    const addPlayerForm = document.getElementById('addPlayerForm');
    if (addPlayerForm) {
      // Lisätään tapahtumankuuntelija pelaajan lisäyslomakkeelle
      addPlayerForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const data = {
          etunimi: document.getElementById('playerName').value,
          joukkue_ID: document.getElementById('team_id').value,
          pelinumero: document.getElementById('jerseyNumber').value,
        };
        console.log(document.getElementById('team_id'));
        console.log('Submitting player:', data);

        fetch('/add-player', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        })
          .then((response) => response.json())
          .then((data) => {
            console.log('Success:', data);
          })
          .catch((error) => {
            console.error('Error:', error);
          });

        return false;
      });
    }

    const addMatchForm = document.getElementById('addMatchForm');
    if (addMatchForm) {
      // Lisätään tapahtumakuuntelija ottelun lisäyslomakkeelle
      addMatchForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const data = {
          kotijoukkue: document.getElementById('homeTeam').value,
          vierasjoukkue: document.getElementById('awayTeam').value,
          peliaika: document.getElementById('matchDate').value,
        };
        console.log('Submitting match:', data);
        // Lisätään ottelun tiedot palvelimelle
        fetch('/add-match', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        })
          .then((response) => response.json())
          .then((data) => {
            console.log('Success:', data);
          })
          .catch((error) => {
            console.error('Error:', error);
          });

        return false;
      });
    }
  }

  // Päivitetään joukkueiden valintaelementit
  updateTeams(data) {
    const teamSelect = document.getElementById('team_id');
    const homeTeamSelect = document.getElementById('homeTeam');
    const awayTeamSelect = document.getElementById('awayTeam');
    // Luodaan uusi valintaoptio joukkueelle
    const optionHtml = `<option value="${data.joukkue_ID}">${data.nimi}</option>`;

    if (teamSelect) {
      teamSelect.innerHTML += optionHtml;
    } else {
      console.error('teamSelect element not found');
    }

    if (homeTeamSelect) {
      homeTeamSelect.innerHTML += optionHtml;
    } else {
      console.error('homeTeamSelect element not found');
    }

    if (awayTeamSelect) {
      awayTeamSelect.innerHTML += optionHtml;
    } else {
      console.error('awayTeamSelect element not found');
    }
  }
}
