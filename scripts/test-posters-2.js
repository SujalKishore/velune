const apiKey = "158658a0b2f3971a3efebee06bbfaad8";

async function getPoster(query) {
  const res = await fetch(`https://api.tmdb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}`);
  const data = await res.json();
  if (data.results && data.results[0]) return data.results[0].poster_path;
  return null;
}

async function checkKeyword(keyword, name) {
  const res = await fetch(`https://api.tmdb.org/3/discover/movie?api_key=${apiKey}&with_keywords=${keyword}`);
  const data = await res.json();
  console.log(`${name} (kw:${keyword}): ${data.total_results} results`);
}

async function main() {
  console.log("Anime:", await getPoster("Spirited Away"));
  console.log("Star Wars:", await getPoster("Star Wars A New Hope"));
  console.log("Horror:", await getPoster("The Shining"));
  console.log("Cyberpunk:", await getPoster("Blade Runner 2049"));
  console.log("SciFi:", await getPoster("Inception"));
  console.log("Crime:", await getPoster("Se7en"));
  console.log("LOTR:", await getPoster("The Fellowship of the Ring"));
  
  await checkKeyword(4270, "Star Wars");
  await checkKeyword(12190, "Cyberpunk");
  await checkKeyword(6091, "Middle-earth");
  await checkKeyword(210024, "Anime (maybe)"); // check anime keyword
  await checkKeyword(9715, "Superhero"); // superhero
  await checkKeyword(14544, "Mind bending (maybe)");
}
main();
