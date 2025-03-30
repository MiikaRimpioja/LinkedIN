const express = require('express');
const pool = require('./db.js');
const path = require('path');
const app = express();
const cron = require('node-cron');
const moment = require('moment');
const util = require('util');

const port = process.env.PORT || 3000;

// Middleware JSON-datan käsittelyyn
app.use(express.json());

//Staattisten tiedostojen tarjoaminen
app.use('/static', express.static(path.join(__dirname, 'frontend', 'static')));

app.use(
  '/css',
  express.static(
    path.join(__dirname, 'node_modules', 'bootstrap', 'dist', 'css')
  )
);
app.use(
  '/js',
  express.static(
    path.join(__dirname, 'node_modules', 'bootstrap', 'dist', 'js')
  )
);

// Ottelutietojen haku tietokannasta
app.post('/fetch-ottelu', (req, res) => {
  pool.query(
    `SELECT o.ottelu_ohi, o.Ottelu_ID, o.kotijoukkue_ID, o.vierasjoukkue_ID, o.vierasjoukkue_maalit, o.peliaika, o.kotijoukkue_maalit, j1.nimi AS kotijoukkue_nimi, j2.nimi AS vierasjoukkue_nimi FROM Ottelu o INNER JOIN Joukkue j1 ON o.kotijoukkue_ID = j1.joukkue_ID INNER JOIN Joukkue j2 ON o.vierasjoukkue_ID = j2.joukkue_ID ORDER BY ottelu_ohi DESC, o.ottelu_ohi = 1 DESC, o.peliaika ASC;`,
    (error, results) => {
      if (error) {
        console.error(error);
        res.status(500).json({ error: 'Database query failed' });
        return;
      }
      res.status(200).json(results.length ? results : []);
    }
  );
});

// Joukkueiden tietojen haku tietokannasta
app.post('/fetch-teams', (req, res) => {
  pool.query('SELECT * FROM Joukkue', (error, results) => {
    if (error) {
      console.error(error);
      res.status(500).json({ error: 'Database query failed' });
      return;
    }
    res.status(200).json(results.length ? results : []);
  });
});

// Pelaajan tilastojen päivittäminen
app.post('/update-live', (req, res) => {
  const { maalintekija, syottaja } = req.body;

  const query = `UPDATE Pelaaja SET tehdyt_maalit = CASE WHEN Pelaaja_ID = ? THEN tehdyt_maalit + 1 ELSE tehdyt_maalit END, syottopisteet = CASE WHEN Pelaaja_ID = ? THEN syottopisteet + 1 ELSE syottopisteet END WHERE Pelaaja_ID IN (?, ?);`;

  const values = [maalintekija, syottaja, maalintekija, syottaja];

  pool.query(query, values, (error, results) => {
    if (error) {
      console.error(error);
      res.status(500).json({ error: 'Database query failed' });
      return;
    }
    res.status(200).json(results.length ? results : []);
    console.log('Showing results:', results);
  });
});

// Pelaajan tilastojen peruutus
app.post('/update-scorer-reversal', (req, res) => {
  const { maalintekija, syottaja } = req.body;

  const query = `UPDATE Pelaaja SET tehdyt_maalit = CASE WHEN Pelaaja_ID = ? THEN tehdyt_maalit - 1 ELSE tehdyt_maalit END, syottopisteet = CASE WHEN Pelaaja_ID = ? THEN syottopisteet - 1 ELSE syottopisteet END WHERE Pelaaja_ID IN (?, ?);`;

  const values = [maalintekija, syottaja, maalintekija, syottaja];

  pool.query(query, values, (error, results) => {
    if (error) {
      console.error(error);
      res.status(500).json({ error: 'Database query failed' });
      return;
    }
    res.status(200).json(results.length ? results : []);
    console.log('Showing results:', results);
  });
});

// Ottelun tilastojen peruutus
app.post('/update-live-ottelu-reversal', (req, res) => {
  const { maalintekija_joukkue, ottelu_ID } = req.body;
  console.log('Showing:', req.body);

  const query = `UPDATE Ottelu SET kotijoukkue_maalit = CASE WHEN Kotijoukkue_ID = ? THEN IFNULL(kotijoukkue_maalit, 0) - 1 ELSE kotijoukkue_maalit END, vierasjoukkue_maalit = CASE WHEN vierasjoukkue_ID = ? THEN IFNULL(vierasjoukkue_maalit, 0) - 1 ELSE vierasjoukkue_maalit END WHERE ottelu_ID = ?;`;

  const values = [maalintekija_joukkue, maalintekija_joukkue, ottelu_ID];

  pool.query(query, values, (error, results) => {
    if (error) {
      console.error(error);
      res.status(500).json({ error: 'Database query failed' });
      return;
    }
    res.status(200).json(results.length ? results : []);
    console.log('Showing results:', results);
  });
});

// Ottelun tilastojen päivittäminen
app.post('/update-live-ottelu', (req, res) => {
  const { maalintekija_joukkue, ottelu_ID } = req.body;
  console.log('Showing:', req.body);

  const query = `UPDATE Ottelu SET kotijoukkue_maalit = CASE WHEN Kotijoukkue_ID = ? THEN IFNULL(kotijoukkue_maalit, 0) + 1 ELSE kotijoukkue_maalit END, vierasjoukkue_maalit = CASE WHEN vierasjoukkue_ID = ? THEN IFNULL(vierasjoukkue_maalit, 0) + 1 ELSE vierasjoukkue_maalit END WHERE ottelu_ID = ?;`;

  const values = [maalintekija_joukkue, maalintekija_joukkue, ottelu_ID];

  pool.query(query, values, (error, results) => {
    if (error) {
      console.error(error);
      res.status(500).json({ error: 'Database query failed' });
      return;
    }
    res.status(200).json(results.length ? results : []);
    console.log('Showing results:', results);
  });
});

// Joukkueen tilastojen päivittäminen
app.post('/update-live-joukkue', (req, res) => {
  const { maalintekija_joukkue, maalin_paastanyt_joukkue } = req.body;
  console.log('Showing:', req.body);

  const query = `UPDATE Joukkue SET tehdyt_maalit = CASE WHEN  joukkue_ID = ? THEN tehdyt_maalit + 1 ELSE tehdyt_maalit END, paastetyt_maalit = CASE WHEN joukkue_ID = ? THEN paastetyt_maalit + 1 ELSE paastetyt_maalit END WHERE joukkue_ID IN (?, ?);`;

  const values = [
    maalintekija_joukkue,
    maalin_paastanyt_joukkue,
    maalintekija_joukkue,
    maalin_paastanyt_joukkue,
  ];

  pool.query(query, values, (error, results) => {
    if (error) {
      console.error(error);
      res.status(500).json({ error: 'Database query failed' });
      return;
    }
    res.status(200).json(results.length ? results : []);
    console.log('Showing results:', results);
  });
});

// Voittajan päivittäminen (ja häviäjän)
app.post('/update-winner', (req, res) => {
  const { joukkue1_id, joukkue2_id, isTie, matchId } = req.body;

  const updateJoukkueQuery = `
    UPDATE Joukkue
    SET
      tasapelit = CASE WHEN ? = true AND joukkue_ID IN (?, ?) THEN tasapelit + 1 ELSE tasapelit END,
      voitot = CASE WHEN ? = false AND joukkue_ID = ? THEN voitot + 1 ELSE voitot END,
      haviot = CASE WHEN ? = false AND joukkue_ID = ? THEN haviot + 1 ELSE haviot END
    WHERE joukkue_ID IN (?, ?);
  `;

  const updateOtteluQuery = `
    UPDATE Ottelu
    SET ottelu_ohi = 1
    WHERE Ottelu_ID = ?;
  `;

  const valuesJoukkue = [
    isTie,
    joukkue1_id,
    joukkue2_id,
    isTie,
    joukkue1_id,
    isTie,
    joukkue2_id,
    joukkue1_id,
    joukkue2_id,
  ];

  const valuesOttelu = [matchId];

  // Tehdään useampi kysely transaktiolla
  pool.getConnection((err, connection) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Database connection failed' });
      return;
    }

    connection.beginTransaction((err) => {
      if (err) {
        connection.release();
        console.error(err);
        res.status(500).json({ error: 'Transaction initiation failed' });
        return;
      }

      connection.query(updateJoukkueQuery, valuesJoukkue, (error, results) => {
        if (error) {
          return connection.rollback(() => {
            connection.release();
            console.error(error);
            res.status(500).json({ error: 'Update Joukkue query failed' });
          });
        }

        connection.query(updateOtteluQuery, valuesOttelu, (error, results) => {
          if (error) {
            return connection.rollback(() => {
              connection.release();
              console.error(error);
              res.status(500).json({ error: 'Update Ottelu query failed' });
            });
          }

          connection.commit((err) => {
            if (err) {
              return connection.rollback(() => {
                connection.release();
                console.error(err);
                res.status(500).json({ error: 'Transaction commit failed' });
              });
            }

            connection.release();
            res.status(200).json(results);
          });
        });
      });
    });
  });
});

// Haetaan käynnissä olevan pelin pelaajatiedot
app.post('/live-players', (req, res) => {
  const { kotijoukkue_ID, vierasjoukkue_ID } = req.body;

  const query = `SELECT pelinumero, etunimi, Pelaaja_ID, joukkue_ID FROM Pelaaja WHERE joukkue_id = ? OR joukkue_id = ?`;

  const values = [kotijoukkue_ID, vierasjoukkue_ID];

  pool.query(query, values, (error, results) => {
    if (error) {
      console.error(error);
      res.status(500).json({ error: 'Database query failed' });
      return;
    }
    res.status(200).json(results.length ? results : []);
  });
});

// Haetaan pelaajien tilastot
app.get('/player-stats', (req, res) => {
  const query = `
    SELECT 
      p.etunimi,
      p.pelinumero, 
      p.tehdyt_maalit, 
      p.syottopisteet, 
      (p.tehdyt_maalit + p.syottopisteet) AS kokonaispisteet, 
      j.nimi AS team_name
    FROM 
      Pelaaja p
    INNER JOIN 
      Joukkue j 
    ON 
      j.joukkue_ID = p.joukkue_ID 
      ORDER BY kokonaispisteet DESC;
  `;
  pool.query(query, (error, results) => {
    if (error) {
      console.error('Database query error:', error);
      res.status(500).json({ error: 'Database query failed' });
      return;
    }
    res.status(200).json(results.length ? results : []);
  });
});

// Haetaan joukkueiden tilastot
app.get('/team-stats', (req, res) => {
  const query = `
    SELECT 
      j.nimi, 
      j.tehdyt_maalit, 
      j.paastetyt_maalit,
      j.voitot, 
      j.haviot, 
      j.tasapelit, 
      (j.voitot * 2 + j.tasapelit) AS pisteet
    FROM 
      Joukkue j
      ORDER BY pisteet DESC;
  `;
  pool.query(query, (error, results) => {
    if (error) {
      console.error('Database query error:', error);
      res.status(500).json({ error: 'Database query failed' });
      return;
    }
    res.status(200).json(results.length ? results : []);
  });
});

// Joukkueen lisääminen tietokantaan
app.post('/add-team', (req, res) => {
  console.log('Adding team: ', req.body);
  const { nimi } = req.body;
  console.log('Extracted team name:', nimi, 'Type:', typeof nimi);

  const query =
    'INSERT INTO Joukkue (nimi, tehdyt_maalit, paastetyt_maalit, tasapelit, voitot, haviot) VALUES (?, 0, 0, 0, 0, 0)';
  const values = [nimi];

  pool.query(query, values, (error, results) => {
    if (error) {
      console.error('Database query error:', error);
      res.status(500).json({ error: 'Database query failed' });
      return;
    }
    console.log('Query successful:', results);
    res.status(200).json({ message: 'Team added successfully', results });
  });
});

// Pelaajan lisääminen tietokantaan
app.post('/add-player', (req, res) => {
  console.log('Adding a player: ', req.body);

  const { etunimi, joukkue_ID, pelinumero } = req.body;

  const query =
    'INSERT INTO Pelaaja (etunimi, tehdyt_maalit, syottopisteet, pelinumero, joukkue_ID) VALUES (?, 0, 0, ?, ?)';
  const values = [etunimi, pelinumero, joukkue_ID];
  console.log('Extracted values:', values);
  pool.query(query, values, (error, results) => {
    if (error) {
      console.error('Database query error:', error);
      res.status(500).json({ error: 'Database query failed' });
      return;
    }
    console.log('Query successful:', results);
    res.status(200).json({ message: 'Player added successfully', results });
  });
});

// Ottelun lisääminen tietokantaan
app.post('/add-match', (req, res) => {
  const { kotijoukkue, vierasjoukkue, peliaika } = req.body;
  const query =
    'INSERT INTO Ottelu (kotijoukkue_ID, vierasjoukkue_ID, peliaika, kotijoukkue_maalit, vierasjoukkue_maalit, ottelu_ohi) VALUES (?, ?, ?, 0, 0, 2)';
  const values = [kotijoukkue, vierasjoukkue, peliaika];

  pool.query(query, values, (error, results) => {
    if (error) {
      console.error(error);
      res.status(500).json({ error: 'Database query failed' });
      return;
    }
    res.status(200).json({ message: 'Match added successfully', results });
  });
});

// Promisify pool.query
const query = util.promisify(pool.query).bind(pool);

// Cron-tehtävä otteluiden tilan päivittämiseksi
cron.schedule('* * * * *', async () => {
  console.log('Cron job started at', new Date());
  try {
    const now = moment().utc(); // Current time in UTC
    const matches = await query('SELECT Ottelu_ID, peliaika FROM Ottelu');
    console.log('Matches fetched:', matches);

    const updatePromises = matches.map(async (match) => {
      const startTime = moment.utc(match.peliaika).subtract(120, 'minutes');
      const endTime = startTime.clone().add(32, 'minutes');

      let status;
      if (now.isBefore(startTime)) {
        status = 2; // Upcoming
      } else if (now.isBetween(startTime, endTime)) {
        status = 3; // Ongoing
      } else {
        status = 1; // Ended
      }

      try {
        await query('UPDATE Ottelu SET ottelu_ohi = ? WHERE Ottelu_ID = ?', [
          status,
          match.Ottelu_ID,
        ]);
        console.log(`Match ${match.Ottelu_ID} status updated to ${status}`);
      } catch (updateError) {
        console.error(`Error updating match ${match.Ottelu_ID}:`, updateError);
      }
    });

    await Promise.all(updatePromises);
  } catch (error) {
    console.error('Error updating match statuses:', error);
  }
});

// Palvelimen juuripolku
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Palvelimen polut
app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Palvelimen käynnistäminen
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
