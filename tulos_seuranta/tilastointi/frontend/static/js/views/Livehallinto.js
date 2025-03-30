import AbstractView from './AbstractView.js';

export default class extends AbstractView {
  constructor(params) {
    super(params);
    this.setTitle('Update Match Stats');
  }
  // Palauttaa HTML-sisällön näkymälle
  async getHtml() {
    return `
      <div class="container mt-6">
        <h2 id="ala_otsikko">Päivitä ottelun tilasto</h2>
        
        <!-- Update Stats Form -->
        <form id="update-stats-form" class="center-align">
        <h2>Päivitä maalintekijä & syöttäjä</h2>
          <div class="form-group">
          
            <label for="match">Ottelu</label>
            <select class="form-select" id="match" name="matchId">
              <!-- Match options will be dynamically generated here -->
            </select>
          </div>
          <div class="form-group">
            <label for="goal-scorer">Maalintekijä</label>
            <select class="form-select" id="goal_scorer" name="goalScorer">
              <!-- Player options will be dynamically generated here -->
            </select>
          </div>
          <div class="form-group">
            <label for="assist_1">Syöttäjä</label>
            <select class="form-select" id="assist_1" name="assists[0]">
              <!-- Player options will be dynamically generated here -->
            </select>
          </div>
          <button type="submit" class="btn btn-primary">Päivitä tilasto</button>
        </form>

        <!-- Update Winner Form -->
        <form id="update-winner-form" class="center-align mt-4">
        <h2>Päivitä ottelun voittaja </h2>
          <div class="form-group">
            <label for="select-match">Ottelu</label>
            <select class="form-select" id="select-match" name="matchId">
              <!-- Match options will be dynamically generated here -->
            </select>
          </div>
          <div class="form-group">
            <label for="winner">Voittaja</label>
            <select class="form-select" id="winner" name="winner">
              <option value="">Valitse voittaja</option>
              <!-- Team options will be dynamically generated here -->
            </select>
          </div>
          <button type="submit" class="btn btn-primary">Päivitä voittaja</button>
        </form>

        <h2 id="ala_otsikko">Virheiden korjaaminen</h2>

        <!-- Update Reversal Form -->
        <form id="update-reversal-form" class="center-align mt-4">
        <h2>Peruuta maalintekijä & syöttäjä</h2>
          <div class="form-group">
            <label for="reversal-match">Ottelu</label>
            <select class="form-select" id="reversal-match" name="matchId">
              <!-- Match options will be dynamically generated here -->
            </select>
          </div>
          <div class="form-group">
            <label for="reversal-goal-scorer">Maalintekijä</label>
            <select class="form-select" id="reversal-goal-scorer" name="maalintekija">
              <!-- Player options will be dynamically generated here -->
            </select>
          </div>
          <div class="form-group">
            <label for="reversal-assist">Syöttäjä</label>
            <select class="form-select" id="reversal-assist" name="syottaja">
              <!-- Player options will be dynamically generated here -->
            </select>
          </div>
          <button type="submit" class="btn btn-primary">Päivitä käänteinen</button>
        </form>
        
      </div>
    `;
  }

  // Hakee ottelutiedot palvelimelta
  async fetchMatchData() {
    try {
      const response = await fetch('/fetch-ottelu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const matchData = await response.json();
      this.populateMatchOptions(matchData);
    } catch (error) {
      console.error('Error:', error);
      const container = document.querySelector('.container');
      container.innerHTML = `<div class="alert alert-danger" role="alert">Failed to fetch data: ${error.message}</div>`;
    }
  }

  // Hakee pelaajatiedot palvelimelta
  async fetchPlayerData(kotijoukkue_ID, vierasjoukkue_ID, form) {
    try {
      const playersResponse = await fetch('/live-players', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ kotijoukkue_ID, vierasjoukkue_ID }),
      });
      if (!playersResponse.ok) {
        throw new Error('Network response was not ok for players');
      }
      const playersData = await playersResponse.json();
      console.log('Players data:', playersData);
      if (form === 1) {
        this.populateReversalPlayerOptions(playersData);
      } else {
        this.populatePlayerOptions(playersData);
      }
    } catch (error) {
      console.error('Error:', error);
      const container = document.querySelector('.container');
      container.innerHTML = `<div class="alert alert-danger" role="alert">Failed to fetch data: ${error.message}</div>`;
    }
  }

  //täytetään otteluvalikko
  populateMatchOptions(matches) {
    const matchSelect = document.getElementById('match');
    const selectMatch = document.getElementById('select-match');
    const reversalMatchSelect = document.getElementById('reversal-match');
    matchSelect.innerHTML = '';
    selectMatch.innerHTML = '';
    reversalMatchSelect.innerHTML = '';

    // Luodaan ja lisätään paikkamerkkioptiot (placeholder)
    const placeholderOptionMatch = document.createElement('option');
    placeholderOptionMatch.textContent = 'Valitse ottelu';
    placeholderOptionMatch.disabled = true;
    placeholderOptionMatch.selected = true;

    const placeholderOptionSelectMatch = document.createElement('option');
    placeholderOptionSelectMatch.textContent = 'Valitse ottelu';
    placeholderOptionSelectMatch.disabled = true;
    placeholderOptionSelectMatch.selected = true;

    const placeholderOptionReversalMatch = document.createElement('option');
    placeholderOptionReversalMatch.textContent = 'Valitse ottelu';
    placeholderOptionReversalMatch.disabled = true;
    placeholderOptionReversalMatch.selected = true;

    matchSelect.appendChild(placeholderOptionMatch);
    selectMatch.appendChild(placeholderOptionSelectMatch);
    reversalMatchSelect.appendChild(placeholderOptionReversalMatch);

    // Tallennetaan ottelutiedot data-attribuutteihin
    matchSelect.setAttribute('data-match-data', JSON.stringify(matches));
    selectMatch.setAttribute('data-match-data', JSON.stringify(matches));
    reversalMatchSelect.setAttribute(
      'data-match-data',
      JSON.stringify(matches)
    );
    // Lisätään otteluoptiot valintaelementteihin
    matches.forEach((match) => {
      const option = document.createElement('option');
      option.value = match.Ottelu_ID;
      option.textContent = `${match.kotijoukkue_nimi} vs ${match.vierasjoukkue_nimi}`;
      matchSelect.appendChild(option);
      selectMatch.appendChild(option.cloneNode(true));
      reversalMatchSelect.appendChild(option.cloneNode(true));
    });
  }

  // Täytetään pelaajavalikko (maalintekijä ja syöttäjä)
  populatePlayerOptions(players) {
    if (!players) {
      console.error('Invalid players data:', players);
      return;
    }
    const goalScorerSelect = document.getElementById('goal_scorer');
    const assist1Select = document.getElementById('assist_1');

    goalScorerSelect.innerHTML = '';
    assist1Select.innerHTML = '';

    // Lisätään "Ei syöttäjää" vaihtoehto pelaajavalikkoihin
    // (mahdollistaa virheellisen tilaston korjaamisen myöhemmin)
    const noAssistOption = document.createElement('option');
    const noScorerOption = document.createElement('option');
    noScorerOption.value = '';
    noScorerOption.textContent = 'Ei maalintekijää';
    noAssistOption.value = '';
    noAssistOption.textContent = 'Ei syöttäjää';
    assist1Select.appendChild(noAssistOption);
    goalScorerSelect.appendChild(noScorerOption);

    //Täytetään pelaajaoptiot
    players.forEach((player) => {
      const option = document.createElement('option');
      option.value = player.pelinumero; // Use pelinumero as the value
      option.textContent = `${player.pelinumero} - ${player.etunimi}`; // Display pelinumero and etunimi
      option.setAttribute('data-pelaaja-id', player.Pelaaja_ID); // Store Pelaaja_ID in a data attribute
      option.setAttribute('data-joukkue-id', player.joukkue_ID); // Store joukkue_ID in a data attribute
      goalScorerSelect.appendChild(option);
      assist1Select.appendChild(option.cloneNode(true));
    });
  }

  /*Täytetään pelaajaoptiot (olisi voinut tehdä toistamatta koodia esim. lisäämällä aiempaan metodiin vaihtoehdoksi lisätä tai vähentää pisteitä)*/
  populateReversalPlayerOptions(players) {
    if (!players) {
      console.error('Invalid players data:', players);
      return;
    }
    console.log('Showing players:', players);
    const reversalGoalScorerSelect = document.getElementById(
      'reversal-goal-scorer'
    );
    const reversalAssistSelect = document.getElementById('reversal-assist');

    reversalGoalScorerSelect.innerHTML = '';
    reversalAssistSelect.innerHTML = '';

    // Lisätään "Ei syöttäjää" vaihtoehto pelaajavalikkoihin
    const noAssistOption = document.createElement('option');
    const noScorerOption = document.createElement('option');
    noScorerOption.value = '';
    noScorerOption.textContent = 'Ei maalintekijää';
    noAssistOption.value = '';
    noAssistOption.textContent = 'Ei syöttäjää';
    reversalAssistSelect.appendChild(noAssistOption);
    reversalGoalScorerSelect.appendChild(noScorerOption);

    //Täytetään pelaajaoptiot
    players.forEach((player) => {
      const option = document.createElement('option');
      option.value = player.pelinumero; // Use pelinumero as the value
      option.textContent = `${player.pelinumero} - ${player.etunimi}`; // Display pelinumero and etunimi
      option.setAttribute('data-pelaaja-id', player.Pelaaja_ID); // Store Pelaaja_ID in a data attribute
      option.setAttribute('data-joukkue-id', player.joukkue_ID); // Store joukkue_ID in a data attribute
      reversalGoalScorerSelect.appendChild(option);
      reversalAssistSelect.appendChild(option.cloneNode(true));
    });
  }

  //Lisätään tapahtumakuuntelijat ja noudetaan näkymän avautuessa ottelutiedot
  addEventListeners() {
    this.fetchMatchData();

    const form = document.getElementById('update-stats-form');
    //Lisätään tapahtumakuuntelija tilastojen päivityslomakkeelle
    form.addEventListener('submit', async (e) => {
      //Estetään sivun päivittyminen lomaketta lähetettäessä
      e.preventDefault();
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());
      data.assists = [formData.get('assists[0]')];

      const goalScorerSelect = document.getElementById('goal_scorer');
      const assist1Select = document.getElementById('assist_1');
      const maalintekija =
        goalScorerSelect.options[goalScorerSelect.selectedIndex].getAttribute(
          'data-pelaaja-id'
        );
      let maalintekija_joukkue = null;
      let maalintekija_joukkue_exists = false;
      if (
        goalScorerSelect.options[goalScorerSelect.selectedIndex].getAttribute(
          'data-joukkue-id'
        )
      ) {
        maalintekija_joukkue_exists = true;
      }

      if (maalintekija_joukkue_exists)
        maalintekija_joukkue =
          goalScorerSelect.options[goalScorerSelect.selectedIndex].getAttribute(
            'data-joukkue-id'
          );

      const syottaja =
        assist1Select.options[assist1Select.selectedIndex].getAttribute(
          'data-pelaaja-id'
        );

      // Tarkistetaan, että maalintekijän joukkue on määritelty
      if (!maalintekija_joukkue && maalintekija_joukkue !== null) {
        console.error('Error: maalintekija_joukkue is undefined');
        alert('Failed to update stats: maalintekija_joukkue is undefined');
        return;
      }

      try {
        // Päivitetään tilastot palvelimelle
        const updateLiveResponse = await fetch('/update-live', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ maalintekija, syottaja }),
        });
        if (!updateLiveResponse.ok) {
          throw new Error('Network response was not ok for update-live');
        }

        // Päivitetään ottelun tilastot, jos maali on tehty
        if (maalintekija_joukkue_exists) {
          const matchId = formData.get('matchId');
          const updateLiveOtteluResponse = await fetch('/update-live-ottelu', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ maalintekija_joukkue, ottelu_ID: matchId }),
          });
          if (!updateLiveOtteluResponse.ok) {
            throw new Error(
              'Network response was not ok for update-live-ottelu'
            );
          }
        }

        alert('Stats updated successfully');
      } catch (error) {
        console.error('Error updating stats:', error);
        alert('Failed to update stats');
      }
    });

    const matchSelect = document.getElementById('match');
    // Lisätään tapahtumankuuntelija ottelun valintaelementille
    matchSelect.addEventListener('change', () => {
      const selectedMatch =
        matchSelect.options[matchSelect.selectedIndex].value;
      const matchData = JSON.parse(matchSelect.getAttribute('data-match-data'));
      const match = matchData.find((m) => m.Ottelu_ID == selectedMatch);
      // Haetaan pelaajatiedot, kun otteluvalinta muuttuu
      if (match) {
        const { kotijoukkue_ID, vierasjoukkue_ID } = match;
        this.fetchPlayerData(kotijoukkue_ID, vierasjoukkue_ID, 0);
      }
    });

    const reversalMatchSelect = document.getElementById('reversal-match');
    // Lisätään tapahtumankuuntelija peruutuksen ottelun valintaelementille
    reversalMatchSelect.addEventListener('change', () => {
      const selectedMatch =
        reversalMatchSelect.options[reversalMatchSelect.selectedIndex].value;
      const matchData = JSON.parse(
        reversalMatchSelect.getAttribute('data-match-data')
      );
      const match = matchData.find((m) => m.Ottelu_ID == selectedMatch);
      // Haetaan pelaajatiedot, kun peruutuksen otteluvalinta muuttuu
      if (match) {
        const { kotijoukkue_ID, vierasjoukkue_ID } = match;
        this.fetchPlayerData(kotijoukkue_ID, vierasjoukkue_ID, 1);
      }
    });

    const selectMatch = document.getElementById('select-match');
    // Lisätään tapahtumankuuntelija voittajan valintaelementille
    selectMatch.addEventListener('change', () => {
      const selectedMatch =
        selectMatch.options[selectMatch.selectedIndex].value;
      const matchData = JSON.parse(selectMatch.getAttribute('data-match-data'));
      const match = matchData.find((m) => m.Ottelu_ID == selectedMatch);
      if (match) {
        const {
          kotijoukkue_ID,
          vierasjoukkue_ID,
          kotijoukkue_nimi,
          vierasjoukkue_nimi,
        } = match;
        const winnerSelect = document.getElementById('winner');
        winnerSelect.innerHTML = `
          <option value="">Valitse voittaja</option>
          <option value="1">${kotijoukkue_nimi}</option>
          <option value="2">${vierasjoukkue_nimi}</option>
          <option value="tie">Tasapeli</option>
        `;
        // Päivitetään piilotetut kentät tai tila joukkueiden ID:illä
        winnerSelect.setAttribute('data-kotijoukkue-id', kotijoukkue_ID);
        winnerSelect.setAttribute('data-vierasjoukkue-id', vierasjoukkue_ID);
      }
    });

    const winnerForm = document.getElementById('update-winner-form');
    // Lisätään tapahtumankuuntelija voittajan päivityslomakkeelle
    winnerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(winnerForm);
      const winner = formData.get('winner');
      const matchId = document.getElementById('select-match').value;

      const matchData = JSON.parse(
        document.getElementById('select-match').getAttribute('data-match-data')
      );
      const match = matchData.find((m) => m.Ottelu_ID == matchId);
      if (!match) {
        console.error('Error: Match not found');
        alert('Failed to update winner: Match not found');
        return;
      }

      const { kotijoukkue_ID, vierasjoukkue_ID } = match;
      const isTie = winner === 'tie';
      const joukkue1_id = winner === '1' ? kotijoukkue_ID : vierasjoukkue_ID;
      const joukkue2_id = winner === '2' ? vierasjoukkue_ID : kotijoukkue_ID;
      // Lähetetään voittajan päivitystiedot palvelimelle
      try {
        const updateWinnerResponse = await fetch('/update-winner', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ joukkue1_id, joukkue2_id, matchId, isTie }),
        });
        if (!updateWinnerResponse.ok) {
          throw new Error('Network response was not ok for update-winner');
        }

        alert('Winner updated successfully');
      } catch (error) {
        console.error('Error updating winner:', error);
        alert('Failed to update winner');
      }
    });

    const reversalForm = document.getElementById('update-reversal-form');
    // Lisätään tapahtumankuuntelija peruutuksen päivityslomakkeelle
    reversalForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(reversalForm);

      const maalintekijaSelect = document.getElementById(
        'reversal-goal-scorer'
      );

      const maalintekija =
        maalintekijaSelect.options[
          maalintekijaSelect.selectedIndex
        ].getAttribute('data-pelaaja-id');

      const syottajaSelect = document.getElementById('reversal-assist');

      const syottaja =
        syottajaSelect.options[syottajaSelect.selectedIndex].getAttribute(
          'data-pelaaja-id'
        );

      const ottelu_ID = formData.get('matchId');

      console.log('Form Data:', { maalintekija, syottaja, ottelu_ID });

      let maalintekija_joukkue = null;
      let maalintekija_joukkue_exists = false;
      // Tarkistetaan, onko maalintekijän joukkue määritelty
      if (
        maalintekijaSelect.options[
          maalintekijaSelect.selectedIndex
        ].getAttribute('data-joukkue-id')
      ) {
        maalintekija_joukkue_exists = true;
      }

      if (maalintekija_joukkue_exists) {
        maalintekija_joukkue =
          maalintekijaSelect?.options[
            maalintekijaSelect.selectedIndex
          ]?.getAttribute('data-joukkue-id');
      }

      if (!maalintekija_joukkue && maalintekija_joukkue !== null) {
        console.error('Error: maalintekija_joukkue is undefined');
        alert('Failed to update reversal: maalintekija_joukkue is undefined');
        return;
      }

      // Pelaaja-tilaston päivittäminen
      try {
        const updateReversalResponse = await fetch('/update-scorer-reversal', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ maalintekija, syottaja }),
        });
        if (!updateReversalResponse.ok) {
          throw new Error('Network response was not ok for update-reversal');
        }

        alert('Reversal updated successfully');
      } catch (error) {
        console.error('Error updating reversal:', error);
        alert('Failed to update reversal');
      }

      // Ottelun tilaston päivittäminen
      if (maalintekija_joukkue_exists) {
        try {
          const updateReversalResponse = await fetch(
            '/update-live-ottelu-reversal',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ maalintekija_joukkue, ottelu_ID }),
            }
          );
          if (!updateReversalResponse.ok) {
            throw new Error('Network response was not ok for update-reversal');
          }

          alert('Reversal updated successfully');
        } catch (error) {
          console.error('Error updating reversal:', error);
          alert('Failed to update reversal');
        }
      }
    });
  }
}
