import AbstractView from './AbstractView.js';

export default class extends AbstractView {
  constructor(params) {
    super(params);
    this.setTitle('Ottelut');
  }

  async getHtml() {
    return `
    <h1 class="mb-4" id="sivun_otsikko">Ottelut</h1>
      <div id="results"></div>
    `;
  }

  // Ottelut-näkymän tapahtumakuuntelijat (+ ottelutietojen haku
  // palvelimelta näkymän avautuessa)
  addEventListeners() {
    this.fetchData();
  }
  // Haetaan otteluiden tiedot
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

  // Näytetään ottelut näkymässä
  displayData(data) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';
    console.log(data);

    data.forEach((item) => {
      let ottelu_paattynyt = '';
      let borderStyle = 'basic_ottelu_kortti';
      if (item.ottelu_ohi === 1) {
        ottelu_paattynyt = 'Päättynyt';
        borderStyle = 'paattynyt_style';
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
                <h5 class="card-title">Kotijoukkue</h5>
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
                <h5 class="card-title">Vierasjoukkue</h5>
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
    });
  }

  // Näytetään joukkueet näkymässä
  displayTeams(data) {
    const teams = data.map((item) => ({
      homeTeam: item.kotijoukkue_ID,
      awayTeam: item.vierasjoukkue_ID,
    }));

    const teamsDiv = document.getElementById('teams');
    teamsDiv.innerHTML = '';
  }
}
