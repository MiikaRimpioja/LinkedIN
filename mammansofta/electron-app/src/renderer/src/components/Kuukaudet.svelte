<script>
  import { valittuKuukausi } from '../stores/kuukausiStore'

  //Hardcodataan pyhäpäivät vuosille 2025 ja 2026
  const vuosi2025 = [
    {
      vuosi: 2025,
      kuukausi: 'Tammikuu',
      numero: 0,
      paivat: 31,
      viikot: [1, 2, 3, 4, 5],
      ekanViikonPaivat: 5
    },
    {
      vuosi: 2025,
      kuukausi: 'Helmikuu',
      numero: 1,
      paivat: 28,
      viikot: [5, 6, 7, 8, 9],
      ekanViikonPaivat: 2
    },
    {
      vuosi: 2025,
      kuukausi: 'Maaliskuu',
      numero: 2,
      paivat: 31,
      viikot: [9, 10, 11, 12, 13, 14],
      ekanViikonPaivat: 2
    },
    {
      vuosi: 2025,
      kuukausi: 'Huhtikuu',
      numero: 3,
      paivat: 30,
      viikot: [14, 15, 16, 17, 18],
      ekanViikonPaivat: 6
    },
    {
      vuosi: 2025,
      kuukausi: 'Toukokuu',
      numero: 4,
      paivat: 31,
      viikot: [18, 19, 20, 21, 22],
      ekanViikonPaivat: 4
    },
    {
      vuosi: 2025,
      kuukausi: 'Kesäkuu',
      numero: 5,
      paivat: 30,
      viikot: [22, 23, 24, 25, 26, 27],
      ekanViikonPaivat: 1
    },
    {
      vuosi: 2025,
      kuukausi: 'Heinäkuu',
      numero: 6,
      paivat: 31,
      viikot: [27, 28, 29, 30, 31],
      ekanViikonPaivat: 6
    },
    {
      vuosi: 2025,
      kuukausi: 'Elokuu',
      numero: 7,
      paivat: 31,
      viikot: [31, 32, 33, 34, 35],
      ekanViikonPaivat: 3
    },
    {
      vuosi: 2025,
      kuukausi: 'Syyskuu',
      numero: 8,
      paivat: 30,
      viikot: [36, 37, 38, 39, 40],
      ekanViikonPaivat: 7
    },
    {
      vuosi: 2025,
      kuukausi: 'Lokakuu',
      numero: 9,
      paivat: 31,
      viikot: [40, 41, 42, 43, 44],
      ekanViikonPaivat: 5
    },
    {
      vuosi: 2025,
      kuukausi: 'Marraskuu',
      numero: 10,
      paivat: 30,
      viikot: [44, 45, 46, 47, 48],
      ekanViikonPaivat: 2
    },
    {
      vuosi: 2025,
      kuukausi: 'Joulukuu',
      numero: 11,
      paivat: 31,
      viikot: [49, 50, 51, 52, 1],
      ekanViikonPaivat: 7
    }
  ]

  const vuosi2026 = [
    {
      vuosi: 2026,
      kuukausi: 'Tammikuu',
      numero: 0,
      paivat: 31,
      viikot: [1, 2, 3, 4, 5],
      ekanViikonPaivat: 4
    },
    {
      vuosi: 2026,
      kuukausi: 'Helmikuu',
      numero: 1,
      paivat: 28,
      viikot: [5, 6, 7, 8, 9],
      ekanViikonPaivat: 1
    },
    {
      vuosi: 2026,
      kuukausi: 'Maaliskuu',
      numero: 2,
      paivat: 31,
      viikot: [9, 10, 11, 12, 13, 14],
      ekanViikonPaivat: 1
    },
    {
      vuosi: 2026,
      kuukausi: 'Huhtikuu',
      numero: 3,
      paivat: 30,
      viikot: [14, 15, 16, 17, 18],
      ekanViikonPaivat: 5
    },
    {
      vuosi: 2026,
      kuukausi: 'Toukokuu',
      numero: 4,
      paivat: 31,
      viikot: [18, 19, 20, 21, 22],
      ekanViikonPaivat: 3
    },
    {
      vuosi: 2026,
      kuukausi: 'Kesäkuu',
      numero: 5,
      paivat: 30,
      viikot: [23, 24, 25, 26, 27],
      ekanViikonPaivat: 7
    },
    {
      vuosi: 2026,
      kuukausi: 'Heinäkuu',
      numero: 6,
      paivat: 31,
      viikot: [27, 28, 29, 30, 31],
      ekanViikonPaivat: 5
    },
    {
      vuosi: 2026,
      kuukausi: 'Elokuu',
      numero: 7,
      paivat: 31,
      viikot: [31, 32, 33, 34, 35, 36],
      ekanViikonPaivat: 2
    },
    {
      vuosi: 2026,
      kuukausi: 'Syyskuu',
      numero: 8,
      paivat: 30,
      viikot: [36, 37, 38, 39, 40],
      ekanViikonPaivat: 6
    },
    {
      vuosi: 2026,
      kuukausi: 'Lokakuu',
      numero: 9,
      paivat: 31,
      viikot: [40, 41, 42, 43, 44],
      ekanViikonPaivat: 4
    },
    {
      vuosi: 2026,
      kuukausi: 'Marraskuu',
      numero: 10,
      paivat: 30,
      viikot: [44, 45, 46, 47, 48, 49],
      ekanViikonPaivat: 1
    },
    {
      vuosi: 2026,
      kuukausi: 'Joulukuu',
      numero: 11,
      paivat: 31,
      viikot: [49, 50, 51, 52, 53],
      ekanViikonPaivat: 6
    }
  ]

  //Alustetaan vuodeksi 2025
  let vuosi = vuosi2025

  const handleButtonClick = () => {
    const selectedYear = document.getElementById('vuosi').value
    if (selectedYear === 'vuosi2025') {
      vuosi = vuosi2025
    } else {
      vuosi = vuosi2026
    }
    valittuKuukausi.set(vuosi[0])
  }
</script>

<main>
  <!-- Vuoden valitseminen -->
  <select id="vuosi" name="vuosiDrop" on:change={handleButtonClick}>
    <option value="vuosi2025" selected>2025</option>
    <option value="vuosi2026">2026</option>
  </select>
  <div id="buttons">
    {#each vuosi as month}
      <button on:click={() => valittuKuukausi.set(month)}>
        {month.kuukausi}
      </button>
    {/each}
  </div>
</main>

<style>
  #buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  button {
    margin-top: 30px;
    padding: 8px 18px;
    border: none;
    background-color: #4d0fb7;
    color: white;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.3s;
  }

  button:hover {
    background-color: #3a0b8a;
  }
  #vuosi {
    margin-top: 30px;
    padding: 10px 20px;
    border: none;
    background-color: #4d0fb7;
    color: white;
    border-radius: 5px;
  }
</style>
