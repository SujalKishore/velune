const fs = require('fs');

async function check() {
  const apiKey = "158658a0b2f3971a3efebee06bbfaad8";
  
  const mcuRes = await fetch(`https://api.tmdb.org/3/discover/movie?api_key=${apiKey}&with_keywords=180547`);
  const mcuData = await mcuRes.json();
  console.log("MCU:", mcuData.total_results);

  const dceuRes = await fetch(`https://api.tmdb.org/3/discover/movie?api_key=${apiKey}&with_keywords=193430`);
  const dceuData = await dceuRes.json();
  console.log("DCEU:", dceuData.total_results);
}
check();
