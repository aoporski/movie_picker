"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import styles from "../styles/ResetPassword.module.css";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setMessage("Invalid or expired token");
    }
  }, [token]);

  const handleReset = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(
        "http://localhost:3000/api/password-reset/reset",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, password }),
        }
      );

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Password reset failed");

      setMessage("Password reset successful! Redirecting...");
      setTimeout(() => router.push("/"), 3000);
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Reset Your Password</h2>
      {message && <p className={styles.message}>{message}</p>}
      <form onSubmit={handleReset} className={styles.form}>
        <input
          type="password"
          placeholder="Enter new password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={styles.input}
        />
        <button type="submit" className={styles.button}>
          Reset Password
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;
