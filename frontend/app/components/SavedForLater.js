"use client";

import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import styles from "../styles/SavedMovies.module.css";
import { useRouter } from "next/navigation";
import Image from "next/image";
export default function SavedMovies() {
  const [savedMovies, setSavedMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  const [token, setToken] = useState(null);
  const [userId, setUserId] = useState(null);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const tok = sessionStorage.getItem("token");
      setToken(tok);
      if (tok) {
        const decoded = jwtDecode(tok);
        setUserId(decoded.id);
      }
    }
  }, []);

  useEffect(() => {
    const fetchSavedMovies = async () => {
      try {
        const res = await fetch(
          `http://localhost:3000/api/saved?userId=${userId}`
        );
        const saved = await res.json();

        const genreRes = await fetch(
          `https://api.themoviedb.org/3/genre/movie/list?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&language=en-US`
        );
        const genreData = await genreRes.json();
        const genreMap = {};
        genreData.genres.forEach((g) => {
          genreMap[g.id] = g.name;
        });

        const movieDetails = await Promise.all(
          saved.map(async (entry) => {
            const movieId = entry.movieId;

            const movieRes = await fetch(
              `https://api.themoviedb.org/3/movie/${movieId}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&language=en-US`
            );
            const movieData = await movieRes.json();

            const creditsRes = await fetch(
              `https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`
            );
            const credits = await creditsRes.json();

            const directors = credits.crew
              .filter((person) => person.job === "Director")
              .map((d) => d.name);
            const genres =
              movieData.genres?.map((g) => g.name).filter(Boolean) || [];

            return {
              ...movieData,
              savedAt: entry.createdAt,
              directors: directors,
              genres: genres,
            };
          })
        );

        setSavedMovies(movieDetails);
      } catch (err) {
        console.error("Error fetching movie details:", err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchSavedMovies();
  }, [userId]);

  if (!token || !userId)
    return (
      <p className={styles.message}>
        You must be logged in to view saved movies.
      </p>
    );
  if (loading) return <p className={styles.message}>Loading saved movies...</p>;
  if (savedMovies.length === 0)
    return <p className={styles.message}>No movies saved for later yet.</p>;

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>🎬 Saved for Later</h2>
      <div className={styles.moviesContainer}>
        {savedMovies.map((movie) => (
          <div key={movie.id} className={styles.card}>
            <Image
              src={`https://image.tmdb.org/t/p/w300${movie.poster_path}`}
              alt={movie.title}
              width={330}
              height={300}
              className={styles.poster}
              priority
            />
            <div className={styles.info}>
              <h3 className={styles.title}>{movie.title}</h3>
              <p className={styles.director}>{movie.directors}</p>
              <p className={styles.genre}>{movie.genres.join(", ")}</p>
              <p className={styles.date}>{movie.release_date}</p>
            </div>

            <button
              className={styles.deleteButton}
              onClick={async () => {
                try {
                  await fetch("http://localhost:3000/api/saved", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ userId, movieId: String(movie.id) }),
                  });

                  setSavedMovies((prev) =>
                    prev.filter((m) => m.id !== movie.id)
                  );
                } catch (err) {
                  console.error("Error deleting movie:", err);
                }
              }}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
