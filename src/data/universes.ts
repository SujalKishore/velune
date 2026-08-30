export type TimelineItem = {
  tmdbId: string;
  mediaType: "movie" | "tv";
  title: string;
  poster: string;
  releaseDate: string; // YYYY-MM-DD
  chronologicalOrder: number;
  runtime?: number; // in minutes
  vote_average?: number;
  overview?: string;
};

export type Phase = {
  name: string;
  items: TimelineItem[];
};

export type Saga = {
  name: string;
  phases: Phase[];
};

export type Universe = {
  id: string;
  name: string;
  description: string;
  backdrop: string;
  poster: string;
  logo: string;
  started: string;
  releaseYears: string;
  movieCount: number;
  showCount: number;
  totalRuntimeHours: number; // precalculated
  sagas: Saga[];
  recommendedEntry?: string; // tmdbId
  connections?: { name: string; id: string; poster: string }[];
};

export const UNIVERSES: Universe[] = [
  {
    id: "mcu",
    name: "Marvel Cinematic Universe",
    description: "An American media franchise and shared universe centered on a series of superhero films produced by Marvel Studios.",
    backdrop: "https://image.tmdb.org/t/p/original/7RyHsO4yDXtBv1zUU3mTpHeQ0d5.jpg",
    poster: "https://image.tmdb.org/t/p/w500/RYMX2wcKCBAr24UyPD7xwaek8E.jpg",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Marvel_Cinematic_Universe_logo.png/800px-Marvel_Cinematic_Universe_logo.png",
    started: "2008",
    releaseYears: "2008–Present",
    movieCount: 34,
    showCount: 12,
    totalRuntimeHours: 412,
    recommendedEntry: "1726", // Iron Man
    connections: [
      { name: "Sony Spider-Verse", id: "sony-spiderverse", poster: "https://image.tmdb.org/t/p/w500/872439.jpg" },
      { name: "X-Men", id: "x-men", poster: "https://image.tmdb.org/t/p/w500/228326.jpg" }
    ],
    sagas: [
      {
        name: "The Infinity Saga",
        phases: [
          {
            name: "Phase 1",
            items: [
              {
                tmdbId: "1726",
                mediaType: "movie",
                title: "Iron Man",
                poster: "https://image.tmdb.org/t/p/w500/78lPtwv72eTNqFW9COBYI0dWDJa.jpg",
                releaseDate: "2008-05-02",
                chronologicalOrder: 2,
                runtime: 126,
                vote_average: 7.6,
                overview: "After being held captive in an Afghan cave, billionaire engineer Tony Stark creates a unique weaponized suit of armor to fight evil."
              },
              {
                tmdbId: "1724",
                mediaType: "movie",
                title: "The Incredible Hulk",
                poster: "https://image.tmdb.org/t/p/w500/gKzYx79y0AQTL4UAk1cSQNd362p.jpg",
                releaseDate: "2008-06-13",
                chronologicalOrder: 3,
                runtime: 114,
                vote_average: 6.2,
                overview: "Scientist Bruce Banner scours the planet for an antidote to the unbridled force of rage within him: the Hulk."
              },
              {
                tmdbId: "10138",
                mediaType: "movie",
                title: "Iron Man 2",
                poster: "https://image.tmdb.org/t/p/w500/6WBeq4Pq0KFeaF5R8aE9146L24R.jpg",
                releaseDate: "2010-05-07",
                chronologicalOrder: 4,
                runtime: 124,
                vote_average: 6.8,
                overview: "With the world now aware of his dual life as the armored superhero Iron Man, billionaire inventor Tony Stark faces pressure from the government, the press, and the public to share his technology with the military."
              },
              {
                tmdbId: "10195",
                mediaType: "movie",
                title: "Thor",
                poster: "https://image.tmdb.org/t/p/w500/prSdXk2XzZ0mJtCUKH2q2Q9bNMB.jpg",
                releaseDate: "2011-05-06",
                chronologicalOrder: 5,
                runtime: 115,
                vote_average: 6.8,
                overview: "Against his father Odin's will, The Mighty Thor - a powerful but arrogant warrior god - recklessly reignites an ancient war."
              },
              {
                tmdbId: "1771",
                mediaType: "movie",
                title: "Captain America: The First Avenger",
                poster: "https://image.tmdb.org/t/p/w500/vSNxAJTlD0r02V9sPYpOjqDZXUK.jpg",
                releaseDate: "2011-07-22",
                chronologicalOrder: 1, // First chronologically in Phase 1
                runtime: 124,
                vote_average: 7.0,
                overview: "During World War II, Steve Rogers is a sickly man from Brooklyn who's transformed into super-soldier Captain America to aid in the war effort."
              },
              {
                tmdbId: "24428",
                mediaType: "movie",
                title: "The Avengers",
                poster: "https://image.tmdb.org/t/p/w500/RYMX2wcKCBAr24UyPD7xwaek8E.jpg",
                releaseDate: "2012-05-04",
                chronologicalOrder: 6,
                runtime: 143,
                vote_average: 7.7,
                overview: "When an unexpected enemy emerges and threatens global safety and security, Nick Fury, director of the international peacekeeping agency known as S.H.I.E.L.D., finds himself in need of a team to pull the world back from the brink of disaster."
              }
            ]
          },
          {
            name: "Phase 2",
            items: [
              {
                tmdbId: "68721",
                mediaType: "movie",
                title: "Iron Man 3",
                poster: "https://image.tmdb.org/t/p/w500/mG4n45i6KkL9u0v7xNmsT864iHn.jpg",
                releaseDate: "2013-05-03",
                chronologicalOrder: 7,
                runtime: 130,
                vote_average: 6.9,
                overview: "When Tony Stark's world is torn apart by a formidable terrorist called the Mandarin, he starts an odyssey of rebuilding and retribution."
              },
              {
                tmdbId: "76338",
                mediaType: "movie",
                title: "Thor: The Dark World",
                poster: "https://image.tmdb.org/t/p/w500/wp6OxE4poJ4G7c0U2ZIXas5AWgK.jpg",
                releaseDate: "2013-11-08",
                chronologicalOrder: 8,
                runtime: 112,
                vote_average: 6.5,
                overview: "Thor fights to restore order across the cosmos... but an ancient race led by the vengeful Malekith returns to plunge the universe back into darkness."
              },
              {
                tmdbId: "100402",
                mediaType: "movie",
                title: "Captain America: The Winter Soldier",
                poster: "https://image.tmdb.org/t/p/w500/tVFRpFw3xTedgPGqxW0AOI8Qhh0.jpg",
                releaseDate: "2014-04-04",
                chronologicalOrder: 9,
                runtime: 136,
                vote_average: 7.7,
                overview: "After the cataclysmic events in New York with The Avengers, Steve Rogers, aka Captain America is living quietly in Washington, D.C. and trying to adjust to the modern world."
              },
              {
                tmdbId: "118340",
                mediaType: "movie",
                title: "Guardians of the Galaxy",
                poster: "https://image.tmdb.org/t/p/w500/r7vmZjiyZw9rpJMQJdXpjgiCOl9.jpg",
                releaseDate: "2014-08-01",
                chronologicalOrder: 10,
                runtime: 121,
                vote_average: 7.9,
                overview: "Light years from Earth, 26 years after being abducted, Peter Quill finds himself the prime target of a manhunt after discovering an orb wanted by Ronan the Accuser."
              },
              {
                tmdbId: "99861",
                mediaType: "movie",
                title: "Avengers: Age of Ultron",
                poster: "https://image.tmdb.org/t/p/w500/4ssDuvEDkSArWEdyBl2X5EHvYKU.jpg",
                releaseDate: "2015-05-01",
                chronologicalOrder: 11,
                runtime: 141,
                vote_average: 7.3,
                overview: "When Tony Stark tries to jumpstart a dormant peacekeeping program, things go awry and Earth’s Mightiest Heroes are put to the ultimate test as the fate of the planet hangs in the balance."
              },
              {
                tmdbId: "102899",
                mediaType: "movie",
                title: "Ant-Man",
                poster: "https://image.tmdb.org/t/p/w500/8YxQzB2aYJIf4nWeL8v3B5N5U51.jpg",
                releaseDate: "2015-07-17",
                chronologicalOrder: 12,
                runtime: 117,
                vote_average: 7.1,
                overview: "Armed with the astonishing ability to shrink in scale but increase in strength, master thief Scott Lang must embrace his inner-hero and help his mentor, Doctor Hank Pym, protect the secret behind his spectacular Ant-Man suit."
              }
            ]
          }
        ]
      },
      {
        name: "The Multiverse Saga",
        phases: [
          {
            name: "Phase 4",
            items: [
              {
                tmdbId: "85271",
                mediaType: "tv",
                title: "WandaVision",
                poster: "https://image.tmdb.org/t/p/w500/glKDfE6btIRcVB5zrjspRIs4r52.jpg",
                releaseDate: "2021-01-15",
                chronologicalOrder: 25,
                runtime: 350,
                vote_average: 8.3,
                overview: "Wanda Maximoff and Vision—two super-powered beings living idealized suburban lives—begin to suspect that everything is not as it seems."
              },
              {
                tmdbId: "84958",
                mediaType: "tv",
                title: "Loki",
                poster: "https://image.tmdb.org/t/p/w500/voHUmluYmKyleFkTu3lOXQG702u.jpg",
                releaseDate: "2021-06-09",
                chronologicalOrder: 26,
                runtime: 300,
                vote_average: 8.2,
                overview: "After stealing the Tesseract during the events of “Avengers: Endgame,” an alternate version of Loki is brought to the mysterious Time Variance Authority."
              },
              {
                tmdbId: "634649",
                mediaType: "movie",
                title: "Spider-Man: No Way Home",
                poster: "https://image.tmdb.org/t/p/w500/1g0dhYtq4irTY1R70qIgG8ZglNp.jpg",
                releaseDate: "2021-12-15",
                chronologicalOrder: 27,
                runtime: 148,
                vote_average: 7.9,
                overview: "Peter Parker is unmasked and no longer able to separate his normal life from the high-stakes of being a super-hero. When he asks for help from Doctor Strange the stakes become even more dangerous."
              }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "starwars",
    name: "Star Wars",
    description: "An epic space opera multimedia franchise created by George Lucas.",
    backdrop: "https://image.tmdb.org/t/p/original/9rZg1J6vMQoDVSgRyWcpFa8GpO9.jpg",
    poster: "https://image.tmdb.org/t/p/w500/6FfCtAuVAW8XJjZ7eWeLibRLWTw.jpg",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Star_Wars_Logo.svg/500px-Star_Wars_Logo.svg.png",
    started: "1977",
    releaseYears: "1977–Present",
    movieCount: 12,
    showCount: 10,
    totalRuntimeHours: 200,
    sagas: [
      {
        name: "The Skywalker Saga",
        phases: [
          {
            name: "Original Trilogy",
            items: [
              {
                tmdbId: "11",
                mediaType: "movie",
                title: "Star Wars",
                poster: "https://image.tmdb.org/t/p/w500/6FfCtAuVAW8XJjZ7eWeLibRLWTw.jpg",
                releaseDate: "1977-05-25",
                chronologicalOrder: 4,
                runtime: 121,
                vote_average: 8.2,
                overview: "Princess Leia is captured and held hostage by the evil Imperial forces in their effort to take over the galactic Empire."
              }
            ]
          }
        ]
      }
    ]
  }
];

export function getUniverseById(id: string): Universe | undefined {
  return UNIVERSES.find((u) => u.id === id);
}
