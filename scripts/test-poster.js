const apiKey = "158658a0b2f3971a3efebee06bbfaad8";

async function check() {
  const q = "Justice League";
  const res = await fetch(`https://api.tmdb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(q)}`);
  const data = await res.json();
  if (data.results && data.results[0]) {
    console.log("Justice League poster:", data.results[0].poster_path);
  }
}
check();
