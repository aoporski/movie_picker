"use client";
import { useAuth } from "../hooks/auth_context";
import LoginForm from "./Login";
import MovieFlow from "./MovieFlow";
import styles from "../styles/Navigation.module.css";
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useRouter } from "next/navigation";
import Image from "next/image";
import savedIcon from "../../public/savedIcon.png";
import editIcon from "../../public/editIcon.png";
import logoutIcon from "../../public/logoutIcon.png";

export const Navigation = () => {
  const { user, loading, logout } = useAuth();
  const [recommendations, setRecommendations] = useState([]);

  const router = useRouter();

  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!user) return;
      try {
        const token = sessionStorage.getItem("token");
        if (!token) throw new Error("No token found");
        const decoded = jwtDecode(token);
        const userId = decoded.id;
        console.log("userId", userId);

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/decision?userId=${userId}`
        );
        if (!response.ok) throw new Error("Error fetching recommendations");

        const data = await response.json();

        setRecommendations(data);
      } catch (error) {
        console.error("Error fetching recommendations:", error);
      }
    };

    fetchRecommendations();
  }, [user]);

  if (loading) {
    return null;
  }

  return (
    <div className={styles.container}>
      {user ? (
        <>
          <div className={styles.main}>
            <div className={styles.top}>
              <div className={styles.left}>
                <button
                  className={styles.savedMoviesButton}
                  onClick={() => router.push("/saved")}
                >
                  <div className={styles.savedIconWrapper}>
                    <Image
                      src={savedIcon}
                      alt="Saved"
                      fill
                      className={styles.savedIcon}
                    />
                  </div>
                </button>
                <button
                  className={styles.editPreferencesButton}
                  onClick={() => router.push("/preferences")}
                >
                  <div className={styles.savedIconWrapper}>
                    <Image
                      src={editIcon}
                      alt="Edit"
                      fill
                      className={styles.savedIcon}
                    />
                  </div>
                </button>
              </div>
              <div className={styles.welcome}>choosethemovie</div>

              <button className={styles.logoutButton} onClick={logout}>
                <div className={styles.savedIconWrapper}>
                  <Image
                    src={logoutIcon}
                    alt="Logout"
                    fill
                    className={styles.savedIcon}
                  />
                </div>
              </button>
            </div>
            <div className={styles.recommendations}>
              {recommendations.length > 0 ? (
                <MovieFlow
                  movies={recommendations}
                  setMovies={setRecommendations}
                />
              ) : (
                <p>Loading recommendations...</p>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className={styles.loggedOut}>
            <LoginForm />
          </div>
        </>
      )}
    </div>
  );
};

export default Navigation;
