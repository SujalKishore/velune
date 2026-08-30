const fs = require('fs');
const https = require('https');

const agent = new https.Agent({ family: 4 });
const envContent = fs.readFileSync('.env', 'utf8');
const API_KEY = envContent.match(/NEXT_PUBLIC_TMDB_API_KEY=(.*)/)[1].trim();

function fetchPoster(mediaType, id) {
  return new Promise((resolve) => {
    https.get('https://api.themoviedb.org/3/' + mediaType + '/' + id + '?api_key=' + API_KEY, { agent }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.poster_path ? 'https://image.tmdb.org/t/p/w500' + json.poster_path : null);
        } catch(e) { resolve(null); }
      });
    }).on('error', () => resolve(null));
  });
}

async function run() {
  let content = fs.readFileSync('src/data/universes.ts', 'utf8');
  const regex = /tmdbId:\s*"(\d+)",\s*mediaType:\s*"(movie|tv)",\s*title:\s*"([^"]+)",\s*poster:\s*"([^"]+)"/g;
  let match;
  const replacements = [];
  
  while ((match = regex.exec(content)) !== null) {
    const id = match[1], type = match[2], oldPoster = match[4];
    const newPoster = await fetchPoster(type, id);
    if (newPoster && newPoster !== oldPoster) {
      replacements.push({ oldPoster, newPoster });
    }
  }
  
  for (const rep of replacements) {
    content = content.replace(rep.oldPoster, rep.newPoster);
  }
  fs.writeFileSync('src/data/universes.ts', content);
  console.log('Fixed posters in universes.ts');
}
run();
