import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

async function fetchPoster(tmdbId, mediaType) {
  try {
    const res = await fetch(`https://api.themoviedb.org/3/${mediaType}/${tmdbId}?api_key=${API_KEY}`);
    const data = await res.json();
    if (data.poster_path) {
      return `https://image.tmdb.org/t/p/w500${data.poster_path}`;
    }
  } catch (e) {
    console.error(e);
  }
  return null;
}

async function run() {
  const file = path.join(__dirname, 'src/data/universes.ts');
  let content = fs.readFileSync(file, 'utf8');
  
  // Extract all tmdbIds and mediaTypes
  const regex = /tmdbId:\s*"(\d+)",\s*mediaType:\s*"(movie|tv)",\s*title:\s*"([^"]+)",\s*poster:\s*"([^"]+)"/g;
  let match;
  
  const replacements = [];
  
  while ((match = regex.exec(content)) !== null) {
    const id = match[1];
    const type = match[2];
    const title = match[3];
    const oldPoster = match[4];
    
    console.log(`Fetching ${title} (${id})...`);
    const newPoster = await fetchPoster(id, type);
    if (newPoster && newPoster !== oldPoster) {
      console.log(`Updated ${title}: ${oldPoster} -> ${newPoster}`);
      replacements.push({ oldPoster, newPoster });
    }
  }
  
  for (const rep of replacements) {
    content = content.replace(rep.oldPoster, rep.newPoster);
  }
  
  fs.writeFileSync(file, content, 'utf8');
  console.log("Done updating posters.");
}

run();
