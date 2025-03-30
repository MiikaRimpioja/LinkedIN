<script>
  import { asiakkaat } from '../stores/asiakkaatStore'
  import { merkinnat } from '../stores/merkinnatStore'
  import { onMount } from 'svelte'

  let nimi = ''
  let asiakkaanNimi = ''
  let naytapoisto = false
  let naytalisays = false
  let naytavirhe = false
  let naytavirhe2 = false
  let poistonvarmistus = false

  // lisätään asiakkaan tiedot asiakasStoreen, kun "Tallenna tiedot"
  // painiketta painetaan, käyttämällä storen update metodia.
  const lisaaAsiakas = () => {
    asiakkaat.update((asiakkaat) => {
      if (!asiakkaat.some((asiakas) => asiakas.nimi === nimi) && nimi !== '') {
        naytavirhe = false
        naytavirhe2 = false
        return [...asiakkaat, { nimi }]
      } else {
        if (nimi !== '') {
          naytavirhe = true
          return asiakkaat
        } else {
          naytavirhe2 = true
          return asiakkaat
        }
      }
    })
    nimi = ''
  }

  const avaaModal = (asiakas) => {
    console.log('Modal avattu')
    asiakkaanNimi = asiakas
    poistonvarmistus = true
  }
  const suljeModal = () => {
    poistonvarmistus = false
  }

  // Funktio asiakkaan poistamiseksi käyttämällä updatea ja filteriä
  const poistaAsiakas = (nimi) => {
    asiakkaat.update((asiakkaat) => {
      return asiakkaat.filter((asiakas) => asiakas.nimi !== nimi)
    })
    // Poistetaan myös merkinnatStoresta kaikki merkinnät
    // poistettavalta henkilöltä. StartsWith()-funktioon katottu
    // mallia mdn web docs -verkkosivulta.
    merkinnat.update((vanhat) => {
      const uudet = Object.assign({}, vanhat)
      for (const avain in uudet) {
        if (avain.startsWith(`${nimi}-`)) {
          delete uudet[avain]
        }
      }
      return uudet
    })
    poistonvarmistus = false
  }

  const poisto = () => {
    naytapoisto = true
  }

  const piilota = () => {
    naytapoisto = false
  }

  const lisays = () => {
    naytalisays = true
  }

  const piilota2 = () => {
    naytalisays = false
  }

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      const lisaaButton = document.getElementById('lisaaAsiakasButton')
      if (lisaaButton) {
        lisaaButton.click()
      }
    }
  }

  onMount(() => {
    document.addEventListener('keydown', handleKeyPress)
    return () => {
      document.removeEventListener('keydown', handleKeyPress)
    }
  })
</script>

<ul>
  <div>
    <!-- Näytetään "Lisää asiakas" -painike, jos lisäysnäkymä ei ole näkyvissä -->
    {#if !naytalisays}
      <button class="lisaa" on:click={lisays}>Lisää asiakas</button>
    {/if}
    <!-- Näytetään lisäyslomake, kun "lisää asiakas" -painiketta painetaan -->
    {#if naytalisays}
      <button on:click={piilota2}>Piilota</button>
      <div class="form">
        <div>
          <label for="name">Asiakkaan nimi *</label>
          <input type="text" id="name" bind:value={nimi} placeholder="Syötä asiakkaan nimi" />
        </div>
        {#if naytavirhe}
          <h2>Nimi on jo käytössä!</h2>
          <h4>Nimen tulee olla uniikki.</h4>
        {/if}
        {#if naytavirhe2}
          <h2>Syötä nimi!</h2>
        {/if}
        <!-- kutsutaan lisaaAsiakas-funktiota, kun painiketta painetaan -->
        <button id="lisaaAsiakasButton" on:click={lisaaAsiakas}>Tallenna tiedot</button>
      </div>
    {/if}
  </div>

  <!-- Näytetään "Poista asiakas" -painike, jos poistonäkymä ei ole näkyvissä -->
  {#if !naytapoisto}
    <button class="poista" on:click={poisto}>Poista asiakas</button>
  {/if}
  <!-- Näytetään poistonäkymä, jos "Poista asiakas" -painiketta painetaan -->
  {#if naytapoisto}
    <button on:click={piilota}>Piilota</button>
    <div class="poistolista">
      <ul>
        <!-- Listataan olemassaolevat asiakkaat ja laitetaan niiden viereen "poista" -painike, asiakkaan poistamiseksi storesta -->
        {#each $asiakkaat as asiakas}
          <div id="nimilista">
            <ul>
              {asiakas.nimi}
              <button class="poista" on:click={() => avaaModal(asiakas.nimi)}>Poista</button>
            </ul>
          </div>
        {/each}
      </ul>
    </div>
  {/if}
</ul>

{#if poistonvarmistus}
  <div class="modal-backdrop">
    <div class="modal">
      <h3 class="modal-header">Poistetaanko asiakkaan {asiakkaanNimi} tiedot pysyvästi?</h3>
      <button class="kyllä" on:click={() => poistaAsiakas(asiakkaanNimi)}> Kyllä </button>
      <button class="ei" on:click={() => suljeModal()}> Ei </button>
    </div>
  </div>
{/if}

<style>
  label {
    display: block;
    margin-bottom: 0.5em;
    margin-left: 30px;
  }
  input {
    width: 500px;
    padding: 10px;
    margin-bottom: 10px;
    margin-left: 30px;
  }
  button {
    padding: 10px 30px;
    border: none;
    background-color: #4d0fb7;
    color: white;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.3s;
    margin-bottom: 10px;
    width: 130px;
  }
  h4,
  h2 {
    color: darkorange;
  }
  .kyllä,
  .poista {
    background-color: darkred;
  }

  .lisaa {
    background-color: green;
  }
  .ei {
    background-color: green;
    margin-left: 42.5%;
  }

  /* vaihdetaan väriä hieman hiiren ollessa painikkeen päällä. */
  button:hover {
    background-color: #3a0b8a;
  }
  .form {
    padding-top: 15px;
    margin-bottom: 40px;
  }
  .poistolista {
    min-width: 33%;
    max-width: fit-content;
    padding-right: 30px;
  }
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 1040;
  }
  .modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 80%;
    max-width: 500px;
    background-color: darkslategrey;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    z-index: 1050;
    padding: 20px;
  }
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 10px;
    padding-left: 40px;
  }
  #nimilista {
    background-color: darkslategray;
    margin-top: 10px;
    padding-top: 11px;
    border-radius: 10px;
  }
  #lisaaAsiakasButton {
    background-color: green;
  }
</style>
