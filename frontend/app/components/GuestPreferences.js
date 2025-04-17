"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { popularActors } from "../utils/actors";
import { popularDirectors } from "../utils/directors";
import { genres } from "../utils/genres";
import styles from "../styles/EditPreferences.module.css";
import Image from "next/image";

const GuestPreferencesForm = () => {
  const [selectedActors, setSelectedActors] = useState([]);
  const [selectedDirectors, setSelectedDirectors] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [mode, setMode] = useState("create");
  const [initialized, setInitialized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const guestId = localStorage.getItem("guestId");
    if (!guestId) return;

    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/guest-pref/has?guestId=${guestId}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.hasPreferences) {
          setMode("edit");
        }
      })
      .catch((err) => console.error("Error checking guest preferences:", err))
      .finally(() => setInitialized(true));
  }, []);
  useEffect(() => {
    const guestId = localStorage.getItem("guestId");
    if (!guestId || mode !== "edit") return;

    fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/guest-pref/preferences?guestId=${guestId}`
    )
      .then((res) => res.json())
      .then((data) => {
        setSelectedActors(data.actors || []);
        setSelectedDirectors(data.directors || []);
        setSelectedGenres(data.genres || []);
      })
      .catch((err) => console.error("Error loading guest preferences:", err));
  }, [mode]);

  const toggleSelection = (list, setList, item) => {
    setList(
      list.includes(item) ? list.filter((i) => i !== item) : [...list, item]
    );
  };

  const handleSubmit = async () => {
    const guestId = localStorage.getItem("guestId");
    if (!guestId) {
      setMessage("Brak guestId. Spróbuj ponownie.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/guest-pref`,
        {
          method: mode === "edit" ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            guestId,
            favoriteActors: selectedActors,
            favoriteDirectors: selectedDirectors,
            favoriteGenres: selectedGenres,
          }),
        }
      );

      const data = await res.json();
      setMessage(data.message || "Preferences saved!");
      router.push("/guest");
    } catch (err) {
      console.error("Error saving guest preferences:", err);
      setMessage("Failed to save preferences.");
    } finally {
      setLoading(false);
    }
  };

  if (!initialized) return <div>Ładowanie preferencji...</div>;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>
        {mode === "edit"
          ? "🎬 Edit Your Preferences"
          : "🎬 Choose Your Preferences"}
      </h2>

      <h3 className={styles.sectionTitle}>Favorite Actors</h3>
      <div className={styles.grid}>
        {popularActors.map((actor) => (
          <div
            key={actor.id}
            className={`${styles.card} ${
              selectedActors.includes(actor.name) ? styles.selected : ""
            }`}
            onClick={() =>
              toggleSelection(selectedActors, setSelectedActors, actor.name)
            }
          >
            <Image
              src={actor.image}
              alt={actor.name}
              width={120}
              height={120}
              className={styles.image}
              priority
            />
            <p className={styles.cardText}>{actor.name}</p>
          </div>
        ))}
      </div>

      <h3 className={styles.sectionTitle}>Favorite Directors</h3>
      <div className={styles.grid}>
        {popularDirectors.map((director) => (
          <div
            key={director.id}
            className={`${styles.card} ${
              selectedDirectors.includes(director.name) ? styles.selected : ""
            }`}
            onClick={() =>
              toggleSelection(
                selectedDirectors,
                setSelectedDirectors,
                director.name
              )
            }
          >
            <Image
              src={director.image}
              alt={director.name}
              width={120}
              height={120}
              className={styles.image}
              priority
            />
            <p className={styles.cardText}>{director.name}</p>
          </div>
        ))}
      </div>

      <h3 className={styles.sectionTitle}>Favorite Genres</h3>
      <div className={styles.grid}>
        {genres.map((genre) => (
          <div
            key={genre}
            className={`${styles.card} ${
              selectedGenres.includes(genre) ? styles.selected : ""
            }`}
            onClick={() =>
              toggleSelection(selectedGenres, setSelectedGenres, genre)
            }
          >
            <p className={styles.cardText}>{genre}</p>
          </div>
        ))}
      </div>

      <button
        className={styles.button}
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading
          ? "Loading..."
          : mode === "edit"
          ? "Save Preferences"
          : "Start"}
      </button>

      {message && <p>{message}</p>}
    </div>
  );
};

export default GuestPreferencesForm;
