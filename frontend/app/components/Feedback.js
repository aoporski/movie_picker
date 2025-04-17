"use client";

import Image from "next/image";
import { jwtDecode } from "jwt-decode";
import styles from "../styles/Feedback.module.css";
import { useAuth } from "../hooks/auth_context";
import { useEffect, useState } from "react";

export default function Feedback({ movie, onFeedback }) {
  const { loading } = useAuth();
  const token = sessionStorage.getItem("token");
  const guestId = localStorage.getItem("guestId");

  const [runtime, setRuntime] = useState(null);

  useEffect(() => {
    const fetchRuntime = async () => {
      const res = await fetch(
        `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`
      );
      const data = await res.json();
      setRuntime(data.runtime);
    };

    fetchRuntime();
  }, [movie.id]);

  let userId = null;
  if (token) {
    const decoded = jwtDecode(token);
    userId = decoded.id;
  }

  const mapUnseenFeedback = {
    this_one: "this_one",
    save_for_later: "save_for_later",
    not_this_one: "not_this_one",
  };

  const mapSeenFeedback = {
    liked: "liked",
    ok: "ok",
    disliked: "disliked",
  };

  const getPosterUrl = (posterPath) => {
    return posterPath
      ? `https://image.tmdb.org/t/p/w500${posterPath}`
      : "/placeholder.jpg";
  };

  const handleFeedback = async (type, seen) => {
    try {
      const feedbackType = seen
        ? mapSeenFeedback[type]
        : mapUnseenFeedback[type];

      const creditsRes = await fetch(
        `https://api.themoviedb.org/3/movie/${movie.id}/credits?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`
      );
      const credits = await creditsRes.json();
      const actors = credits.cast.slice(0, 30).map((actor) => actor.name);
      const directors = credits.crew
        .filter((member) => member.job === "Director")
        .map((dir) => dir.name);

      const genresRes = await fetch(
        `https://api.themoviedb.org/3/genre/movie/list?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`
      );
      const genresData = await genresRes.json();
      const genres = movie.genre_ids
        .map((id) => genresData.genres.find((g) => g.id === id)?.name)
        .filter(Boolean);

      const res = await fetch(
        userId
          ? `${process.env.NEXT_PUBLIC_API_URL}/api/feedback"`
          : `${process.env.NEXT_PUBLIC_API_URL}/api/guest-feedback`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(guestId && !userId ? { "x-guest-id": guestId } : {}),
          },
          body: JSON.stringify({
            ...(userId ? { userId } : {}),
            movieId: movie.id,
            feedback: feedbackType,
            movieDetails: {
              actors: actors || [],
              genres: genres || [],
              directors: directors || [],
              runtime: runtime || null,
            },
          }),
        }
      );

      const data = await res.json();

      if (data.recommendations) {
        onFeedback(type, data.recommendations);
      } else {
        onFeedback(type);
      }
    } catch (error) {
      console.error("Error sending feedback:", error);
    }
  };

  if (loading) {
    return null;
  }

  return (
    <div className={styles.feedbackContainer}>
      <div className={styles.feedbackContainer_2}>
        <div className={styles.buttonGroup}>
          <button
            onClick={() => handleFeedback("this_one", false)}
            className={`${styles.button} ${styles.thisOne}`}
          >
            Choose!
          </button>
          {userId ? (
            <button
              onClick={() => handleFeedback("save_for_later")}
              className={`${styles.button} ${styles.ok}`}
            >
              Save
            </button>
          ) : (
            <button
              onClick={() => handleFeedback("ok")}
              className={`${styles.button} ${styles.ok}`}
            >
              Neutral
            </button>
          )}
          <button
            onClick={() => handleFeedback("not_this_one", false)}
            className={`${styles.button} ${styles.disliked}`}
          >
            Skip
          </button>
        </div>
        <div className={styles.movieDetails}>
          {movie.poster_path ? (
            <Image
              src={getPosterUrl(movie.poster_path)}
              alt={movie.title}
              width={330}
              height={480}
              className={styles.poster}
              priority
            />
          ) : (
            <div
              style={{
                width: "330px",
                height: "480px",
                backgroundColor: "#222",
              }}
            />
          )}
        </div>

        <div className={styles.buttonGroup}>
          <button
            onClick={() => handleFeedback("liked", true)}
            className={`${styles.button} ${styles.liked}`}
          >
            Liked
          </button>
          <button
            onClick={() => handleFeedback("ok", true)}
            className={`${styles.button} ${styles.ok}`}
          >
            Neutral
          </button>
          <button
            onClick={() => handleFeedback("disliked", true)}
            className={`${styles.button} ${styles.disliked}`}
          >
            Disliked
          </button>
        </div>
      </div>
      <div className={styles.description}>
        <h2 className={styles.title}>{movie.title}</h2>
        <p className={styles.subtitle}>
          {movie.release_date} • {runtime ? `${runtime} min` : "Loading..."}
        </p>
        <p className={styles.description}>{movie.overview}</p>
      </div>
    </div>
  );
}
