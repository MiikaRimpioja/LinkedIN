<script>
  import { asiakkaat } from '../stores/asiakkaatStore'
  import { onMount } from 'svelte'
  import { pyhapaivat } from '../stores/pyhapaivatStore'
  import { merkinnat } from '../stores/merkinnatStore'
  import { valittuKuukausi } from '../stores/kuukausiStore'

  // Luodaan päivät valitun kuukauden päivien määrän perusteella
  $: days = Array.from({ length: $valittuKuukausi.paivat }, (_, i) => i + 1)
  let asiakaslista = []
  let pyhapaivalista = []

  // Pyhäpäivän tarkastusfunktio
  const onPyhapaiva = (day) => {
    const date = new Date($valittuKuukausi.vuosi, $valittuKuukausi.numero, day + 1)
    return pyhapaivalista.some((holiday) => holiday.date === date.toISOString().split('T')[0])
  }

  // Viikonlopun tarkistusfunktio
  const onViikonloppu = (day) => {
    const date = new Date($valittuKuukausi.vuosi, $valittuKuukausi.numero, day)
    return date.getDay() === 0 || date.getDay() == 6
  }

  //Unsubataan storeista kun komponentti poistetaan DOMista
  onMount(() => {
    const unsubscribeAsiakkaat = asiakkaat.subscribe((value) => {
      asiakaslista = value
    })

    const unsubscribePyhapaivat = pyhapaivat.subscribe((value) => {
      pyhapaivalista = value
    })

    return () => {
      unsubscribeAsiakkaat()
      unsubscribePyhapaivat()
    }
  })

  //Taulukon rastitusfunktio
  const rastita = (asiakas, day, month) => {
    const avain = `${asiakas.nimi}-${day}-${month.numero}-${month.vuosi}`
    merkinnat.update((vanhat) => {
      const uudet = Object.assign({}, vanhat)
      if (!vanhat[avain]) {
        uudet[avain] = true
      } else {
        delete uudet[avain]
      }
      return uudet
    })
  }

  //Tulostetaan elementti 'printable' (taulukko)
  const printContent = () => {
    const content = document.getElementById('printable').innerHTML
    window.api.print(content)
  }
</script>

<main>
  <div class="table" id="printable">
    <style>
      @media print {
        th,
        td {
          border-collapse: collapse;
          border: 1px solid black;
          text-align: center;
          color: black;
          min-width: 20px;
        }
        .on-viikonloppu {
          background-color: bisque;
          -webkit-print-color-adjust: exact;
        }
        .on-pyhapaiva {
          background-color: red;
          color: black;
          -webkit-print-color-adjust: exact;
        }
        .otsikko {
          text-align: center;
          border: 1px solid black;
        }
      }
    </style>
    <h1 class="otsikko">{$valittuKuukausi.kuukausi} {$valittuKuukausi.vuosi}</h1>
    <table>
      <thead>
        <tr>
          <th>ASIAKAS</th>
          {#each $valittuKuukausi.viikot as week, index}
            <th colspan={index === 0 ? $valittuKuukausi.ekanViikonPaivat : 7}>Week {week}</th>
          {/each}
          <th>YHT</th>
        </tr>
        <tr>
          <th></th>
          {#each days as day}
            <th class:on-viikonloppu={onViikonloppu(day)} class:on-pyhapaiva={onPyhapaiva(day)}
              >{day}
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each asiakaslista as asiakas}
          <tr>
            <td>{asiakas.nimi}</td>
            {#each days as day}
              <td
                class:on-viikonloppu={onViikonloppu(day)}
                class:on-pyhapaiva={onPyhapaiva(day)}
                on:click={() => {
                  rastita(asiakas, day, $valittuKuukausi)
                }}
              >
                {#if $merkinnat[`${asiakas.nimi}-${day}-${$valittuKuukausi.numero}-${$valittuKuukausi.vuosi}`]}
                  &#10007;
                {/if}
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  <button id="printButton" on:click={printContent}>Tulosta</button>
</main>

<style>
  .table {
    padding: 20px;
    margin-bottom: 20px;
    width: 100%;
    max-width: 100%;
    height: fit-content;
    max-height: 100%;
    align-items: flex-start;
  }
  table {
    border-collapse: collapse;
    width: 100%;
  }
  th {
    border: 1px solid black;
    padding: 8px;
    text-align: center;
    color: black;
    background-color: white;
    min-width: 25px;
  }
  td {
    border: 1px solid black;
    padding: 8px;
    text-align: center;
    color: black;
    background-color: white;
    cursor: pointer;
    min-width: 30px;
  }
  .on-viikonloppu {
    background-color: bisque;
  }
  .on-pyhapaiva {
    background-color: red;
  }
  .otsikko {
    text-align: center;
  }
  button {
    padding: 10px 20px;
    border: none;
    background-color: #007bff;
    color: white;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.3s;
  }
  button:hover {
    background-color: #0056b3;
  }
</style>
