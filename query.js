const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('prisma/dev.db');

db.serialize(() => {
  db.all("SELECT * FROM Watched WHERE review IS NOT NULL AND review != ''", (err, rows) => {
    if (err) {
      console.error(err.message);
    }
    console.log(rows);
  });
});
