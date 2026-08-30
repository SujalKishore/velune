const apiKey = "158658a0b2f3971a3efebee06bbfaad8";
async function getPoster(query) {
  const res = await fetch(`https://api.tmdb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}`);
  const data = await res.json();
  if (data.results && data.results[0]) return data.results[0].poster_path;
  return null;
}
getPoster("Mad Max Fury Road").then(p => console.log("Post-apocalyptic:", p));
fetch(`https://api.tmdb.org/3/discover/movie?api_key=${apiKey}&with_keywords=10051`).then(r=>r.json()).then(d=>console.log("Post-apoc results:", d.total_results));
