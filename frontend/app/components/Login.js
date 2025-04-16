"use client";
import { useState } from "react";
import { useAuth } from "../hooks/auth_context";
import styles from "../styles/Login.module.css";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import info from "../../public/info.png";
import GuestEntry from "./GuestEntry";
const LoginForm = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:3000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Login failed");

      login(data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  const handleResetPassword = async () => {
    setError("");
    if (!email) {
      setError("Please enter your email to reset password.");
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/api/password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Failed to send email.");

      alert("Reset link sent! Check your email.");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.title}>choosethemovie</div>
      <button
        className={styles.infoButton}
        onClick={() => router.push("/about")}
      >
        <Image
          src={info}
          alt="about"
          width={48}
          height={48}
          className={styles.info}
        />
      </button>
      <p className={styles.subtitle}>it has never been easier</p>

      <form onSubmit={handleLogin} className={styles.form}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className={styles.buttons}>
          <button
            type="submit"
            disabled={loading}
            className={styles.loginButton}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
          <div>
            Forgot password?
            <button
              type="button"
              onClick={handleResetPassword}
              className={styles.textLinkButton}
            >
              Change Password
            </button>
          </div>

          <div>
            Don't have an account?{" "}
            <Link href="/register" className={styles.signUpLink}>
              Sign up
            </Link>
          </div>
          <div>
            <GuestEntry />
          </div>
        </div>
      </form>
      {error && <p>{error}</p>}
      <footer className={styles.tmdbattribution}>
        <a
          href="https://www.themoviedb.org/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img src="/tmdb-logo.svg" alt="TMDB Logo" width={200} height={20} />
        </a>
        <p>
          This product uses the TMDB API but is not endorsed or certified by
          TMDB.
        </p>
      </footer>
    </div>
  );
};

export default LoginForm;
