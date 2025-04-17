"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MovieFlow from "../components/MovieFlow";
import styles from "../styles/GuestPage.module.css";
import Image from "next/image";

import editIcon from "../../public/editIcon.png";
import logoutIcon from "../../public/logoutIcon.png";

const GuestPage = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const guestId = localStorage.getItem("guestId");
    if (!guestId) {
      router.push("/guest/preferences");
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/decision`, {
      headers: { "x-guest-id": guestId },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setMovies(data);
        } else {
          sessionStorage.setItem("redirectedToPreferences", "true");
          router.replace("/guest/preferences");
        }
      })
      .catch((err) => {
        console.error("Error fetching guest recommendations:", err);
        sessionStorage.setItem("redirectedToPreferences", "true");
        router.replace("/guest/preferences");
      })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) return <div style={{ padding: "2rem" }}>Ładowanie...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.top}>
        <button
          className={styles.editPreferencesButton}
          onClick={() => router.push("/guest/preferences")}
        >
          <Image
            src={editIcon}
            alt="Edit"
            width={48}
            height={48}
            className={styles.savedIcon}
          />
        </button>
        <div className={styles.welcome}>choosethemovie</div>
        <button
          className={styles.logoutButton}
          onClick={() => router.push("/")}
        >
          <Image
            src={logoutIcon}
            alt="Logout"
            width={48}
            height={48}
            className={styles.savedIcon}
          />
        </button>
      </div>
      <MovieFlow movies={movies} setMovies={setMovies} />
    </div>
  );
};

export default GuestPage;
