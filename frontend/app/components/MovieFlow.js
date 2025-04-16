import React, { useState, useEffect } from "react";
import Feedback from "./Feedback";
import styles from "../styles/MovieFlow.module.css";

export default function MovieFlow({ movies, setMovies }) {
  const [currentMovieIndex, setCurrentMovieIndex] = useState(0);
  const [pendingMovies, setPendingMovies] = useState(null);
  const [showGoodTimeMessage, setShowGoodTimeMessage] = useState(false);

  const currentMovie = movies[currentMovieIndex];

  const handleFeedback = (type, newRecs = null) => {
    if (type === "this_one") {
      setShowGoodTimeMessage(true);
    }
    if (newRecs) {
      setPendingMovies(newRecs);
    }
    if (type !== "this_one") {
      setCurrentMovieIndex((prev) => prev + 1);
    }
  };

  const handleContinueBrowsing = () => {
    setShowGoodTimeMessage(false);
    setCurrentMovieIndex((prev) => prev + 1);
  };

  useEffect(() => {
    if (currentMovieIndex >= movies.length && pendingMovies) {
      setMovies(pendingMovies);
      setCurrentMovieIndex(0);
      setPendingMovies(null);
    }
  }, [currentMovieIndex, movies.length, pendingMovies, setMovies]);

  if (!currentMovie) return <div>No movies available.</div>;

  if (showGoodTimeMessage) {
    return (
      <div className={styles.animatedMessage}>
        <h2 className={styles.message}>
          🍿 Have a great time watching your movie!
        </h2>
        <button
          className={styles.continueButton}
          onClick={handleContinueBrowsing}
        >
          Continue browsing
        </button>
      </div>
    );
  }

  return (
    <div>
      <Feedback movie={currentMovie} onFeedback={handleFeedback} />
    </div>
  );
}
