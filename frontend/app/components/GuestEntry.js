"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import styles from "../styles/GuestEntry.module.css";

const GuestEntry = () => {
  const router = useRouter();
  useEffect(() => {}, []);
  useEffect(() => {
    sessionStorage.removeItem("redirectedToPreferences");
  }, []);

  const handleGuestLogin = () => {
    try {
      if (typeof window === "undefined") {
        console.warn("window is undefined – skipping localStorage access");
        return;
      }

      let guestId = localStorage.getItem("guestId");

      if (!guestId) {
        guestId = "guest_" + Math.random().toString(36).substring(2, 12);
        localStorage.setItem("guestId", guestId);
      }

      router.push("/guest");
    } catch (err) {
      console.error("localStorage access error:", err);
      alert(
        "Local storage is blocked or unavailable. Please check browser settings."
      );
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "2rem" }}>
      <button onClick={handleGuestLogin} className={styles.guestButton}>
        Continue as guest
      </button>
    </div>
  );
};

export default GuestEntry;
