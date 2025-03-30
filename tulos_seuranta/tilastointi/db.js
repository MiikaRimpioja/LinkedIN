const mysql = require('mysql2');

// Yhteyden ottaminen tietokantaan
const pool = mysql.createPool({
  host: 'nj5rh9gto1v5n05t.cbetxkdyhwsb.us-east-1.rds.amazonaws.com',
  database: 'pj9kd3d54i1num26',
  user: 'yfsw3zi56m3imqnm',
  password: 'o1b8bv5vfvuj0mn9',
  connectionLimit: 10,
});

module.exports = pool;
