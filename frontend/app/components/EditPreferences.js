"use client";
import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";
import { popularActors } from "../utils/actors";
import { popularDirectors } from "../utils/directors";
import { genres } from "../utils/genres";
import styles from "../styles/EditPreferences.module.css";
import Image from "next/image";
const EditPreferences = () => {
  const [selectedActors, setSelectedActors] = useState([]);
  const [selectedDirectors, setSelectedDirectors] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const token =
    typeof window !== "undefined" ? sessionStorage.getItem("token") : null;
  const userId = token ? jwtDecode(token).id : null;

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const res = await fetch(
          `http://localhost:3000/api/register-pref/preferences?userId=${userId}`
        );
        const data = await res.json();
        setSelectedActors(data.actors || []);
        setSelectedDirectors(data.directors || []);
        setSelectedGenres(data.genres || []);
        setHasLoaded(true);
      } catch (err) {
        console.error("Error fetching preferences:", err);
      }
    };
    if (userId) fetchPreferences();
  }, [userId]);

  const toggleSelection = (list, setList, item) => {
    setList(
      list.includes(item) ? list.filter((i) => i !== item) : [...list, item]
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        "http://localhost:3000/api/register-pref/preferences",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            favoriteActors: selectedActors,
            favoriteDirectors: selectedDirectors,
            favoriteGenres: selectedGenres,
          }),
        }
      );
      const data = await res.json();
      setMessage(data.message || "Updated!");
      router.push("/");
    } catch (err) {
      setMessage("Failed to update preferences");
    } finally {
      setLoading(false);
    }
  };

  if (!hasLoaded) return <div>Loading preferences...</div>;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>🎬 Edit Your Preferences</h2>
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
              width={330}
              height={300}
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
              width={330}
              height={300}
              sizes="(max-width: 600px) 100vw, 330px"
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
        {loading ? "Saving..." : "Save Preferences"}
      </button>
      {message && <p>{message}</p>}
    </div>
  );
};

export default EditPreferences;
