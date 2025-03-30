import AbstractView from './AbstractView.js';

// Ottelut -näkymän luokka joka perii AbstractView -luokan
export default class extends AbstractView {
  constructor(params) {
    super(params);
    this.setTitle('Ottelut');
  }
  // näkymän HTML-sisältö
  async getHtml() {
    return `
    <h1 class="mb-4" id="sivun_otsikko"> Mighty-Mice Cup</h1>
    <h2 id="header">Käynnissä oleva peli:</h2>
      <div id="results"></div>
    <h2 id="header">Tulevat pelit:</h2>
      <div id="results_upcoming"></div>

        <h2> Format </h2>
        <h4> Alkusarja </h4>
        <p> 3 peliä per joukkue </p>
        <h4> Välierät </h4>
        <p> <b>1. peli:</b> 16.00 </p>
        <p> <b>2. peli:</b> 16.45 </p>
        <p> Alkusarjan 4. sija <b>VS</b> alkusarjan 1. sija </p>
        <p> Alkusarjan 3. sija <b>VS</b> alkusarjan 2. sija </p>
        <h4> Pronssiottelu </h4>
        <p> <b>Alkaa:</b> 17.30 </p>
        <p>Välierän 1 häviäjä <b>VS</b> välierän 2 häviäjä</p>
        <h4> Finaali </h4>
        <p> <b>Alkaa:</b> 18.15 </p>
        <p>Välierän 1 voittaja <b>VS</b> välierän 2 voittaja</p>
        <h4> Peliaika </h4>
        <p> Peliaika 2 x 15 min juoksevalla peliajalla </p>
        <h4> Pisteytys </h4>
        <h5> Alkusarja </h5>
        <p> <b>Voitto:</b> 2 pistettä </p>
        <p> <b>Tasapeli:</b> 1 piste </p>
        <p> <b>Tiebreaker:</b> Keskinäinen ottelu / Maaliero </p>
        <h5> Välierät + finaalit </h5>
        <p><b>Tiebreaker:</b> 5min jatkoaika / rangaistuslaukaukset</p>

 
    `;
  }

  // Haetaan ottelu-data heti näkymän käynnistyttyä (metodi addEventListeners
  // ajetaan aina näkymän vaihduttua reitittimen toimesta)
  // Tässä tiedostossa ei ole tapahtumankuuntelijoita
  addEventListeners() {
    this.fetchData();
  }

  //Hakee ottelutiedot palvelimelta
  async fetchData() {
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
      const data = await response.json();
      this.displayData(data);
    } catch (error) {
      console.error('Error:', error);
    }
  }

  //Näyttää haetut ottelutiedot näkymässä
  displayData(data) {
    const resultsDiv = document.getElementById('results');
    const results_upcomingDiv = document.getElementById('results_upcoming');
    resultsDiv.innerHTML = '';
    results_upcomingDiv.innerHTML = '';
    console.log(data);

    data.forEach((item) => {
      if (item.ottelu_ohi === 3) {
        let ottelu_paattynyt = '';
        let borderStyle = 'basic_ottelu_kortti';
        if (item.ottelu_ohi === 1) {
          ottelu_paattynyt = 'Päättynyt';
        } else if (item.ottelu_ohi === 2) {
          ottelu_paattynyt = 'Alkaa:';
        } else if (item.ottelu_ohi === 3) {
          ottelu_paattynyt = 'Käynnissä';
          borderStyle = 'ottelu_kortti';
        } else {
          ottelu_paattynyt = '';
        }
        const matchInfo = `
   <div class="container mt-5">
    <div class="${borderStyle}">
      <div id="background_div">
        <div class="text-center mb-4" id="ottelun_otsikko">
          <h1 class="display-4">${item.kotijoukkue_nimi} VS ${
          item.vierasjoukkue_nimi
        }</h1>
        </div>
        <div class="row align-items-center">
          <div class="col-md-5">
            <div class="card mb-3">
              <div class="card-body" id="joukkuekortti">
                <h4 class="card-title">Kotijoukkue</h4>
                <p class="card-text">${item.kotijoukkue_nimi}</p>
                <p class="card-text"><strong>Goals:</strong> ${
                  item.kotijoukkue_maalit
                }</p>
              </div>
            </div>
          </div>
          <div class="col-md-2 text-center">
          <h6>${ottelu_paattynyt}</h6>
            <p>${new Date(item.peliaika).toLocaleTimeString('en-GB', {
              timeZone: 'UTC',
              hour: '2-digit',
              minute: '2-digit',
            })}</p>
          </div>
          <div class="col-md-5">
            <div class="card mb-3">
              <div class="card-body" id="joukkuekortti">
                <h4 class="card-title">Vierasjoukkue</h4>
                <p class="card-text">${item.vierasjoukkue_nimi}</p>
                <p class="card-text"><strong>Goals:</strong> ${
                  item.vierasjoukkue_maalit
                }</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
      `;
        resultsDiv.innerHTML += matchInfo;
      }
      if (item.ottelu_ohi === 2) {
        const matchInfo = `
        <div class="container mt-5">
    <div class="basic_ottelu_kortti">
      <div id="background_div">
        <div class="row align-items-center">
          <div class="col-md-5">
            <div class="card mb-3">
              <div class="card-body" id="joukkuekortti">
                <h4 class="card-title">${item.kotijoukkue_nimi}</h4>
              </div>
            </div>
          </div>
          <div class="col-md-2 text-center">
          <h6>Alkaa:</h6>
            <p>${new Date(item.peliaika).toLocaleTimeString('en-GB', {
              timeZone: 'UTC',
              hour: '2-digit',
              minute: '2-digit',
            })}</p>
          </div>
          <div class="col-md-5">
            <div class="card mb-3">
              <div class="card-body" id="joukkuekortti">
                <h4 class="card-title">${item.vierasjoukkue_nimi}</h4>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>`;
        results_upcomingDiv.innerHTML += matchInfo;
      }
    });
  }

  // Näyttää joukkueet näkymässä
  displayTeams(data) {
    const teams = data.map((item) => ({
      homeTeam: item.kotijoukkue_ID,
      awayTeam: item.vierasjoukkue_ID,
    }));

    const teamsDiv = document.getElementById('teams');
    teamsDiv.innerHTML = '';
  }
}
