"use client";
import { useFormik } from "formik";
import * as Yup from "yup";
import { popularActors } from "../utils/actors.js";
import { popularDirectors } from "../utils/directors.js";
import { genres } from "../utils/genres.js";
import styles from "../styles/RegisterForm.module.css";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const RegisterForm = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedActors, setSelectedActors] = useState([]);
  const [selectedDirectors, setSelectedDirectors] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [registeredEmail, setRegisteredEmail] = useState(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationError, setVerificationError] = useState(null);

  const toggleSelection = (list, setList, item) => {
    setList(
      list.includes(item) ? list.filter((i) => i !== item) : [...list, item]
    );
  };

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: Yup.object({
      email: Yup.string().email("Invalid email").required("Required"),
      password: Yup.string()
        .min(6, "Password must be at least 6 characters")
        .required("Required"),
    }),
    onSubmit: async (values) => {
      setLoading(true);
      try {
        const response = await fetch("http://localhost:3000/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...values,
            favoriteActors: selectedActors,
            favoriteDirectors: selectedDirectors,
            favoriteGenres: selectedGenres,
          }),
        });

        const data = await response.json();
        if (!response.ok)
          throw new Error(data.message || "Registration failed!");
        setRegisteredEmail(values.email);
      } catch (error) {
        alert(error.message);
      }
    },
  });

  const handleVerify = async () => {
    try {
      const response = await fetch(
        "http://localhost:3000/api/register/verify",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: registeredEmail,
            verificationCode,
          }),
        }
      );

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Verification failed!");

      router.push("/");
      setRegisteredEmail(null);
    } catch (error) {
      setVerificationError(error.message);
    }
  };

  const handleResendCode = async () => {
    try {
      const response = await fetch(
        "http://localhost:3000/api/register/resend-code",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: registeredEmail }),
        }
      );

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Failed to resend code!");

      alert("Verification code resent!");
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className={styles.container}>
      {!registeredEmail ? (
        <>
          <h2 className={styles.title}>Register</h2>
          <div className={styles.formWrapper}>
            <form onSubmit={formik.handleSubmit}>
              <div className={styles.inputRow}>
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  className={styles.input}
                  {...formik.getFieldProps("email")}
                />
                {formik.touched.email && formik.errors.email && (
                  <span className={styles.error}>{formik.errors.email}</span>
                )}
              </div>

              <div className={styles.inputRow}>
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  className={styles.input}
                  {...formik.getFieldProps("password")}
                />
                {formik.touched.password && formik.errors.password && (
                  <span className={styles.error}>{formik.errors.password}</span>
                )}
              </div>

              <h3>Choose Your Favorite Actors</h3>
              <div className={styles.grid}>
                {popularActors.map((actor) => (
                  <div
                    key={actor.id}
                    className={`${styles.card} ${
                      selectedActors.includes(actor.name) ? styles.selected : ""
                    }`}
                    onClick={() =>
                      toggleSelection(
                        selectedActors,
                        setSelectedActors,
                        actor.name
                      )
                    }
                  >
                    <img
                      src={actor.image}
                      alt={actor.name}
                      className={styles.image}
                    />
                    <p>{actor.name}</p>
                  </div>
                ))}
              </div>

              <h3>Choose Your Favorite Directors</h3>
              <div className={styles.grid}>
                {popularDirectors.map((director) => (
                  <div
                    key={director.id}
                    className={`${styles.card} ${
                      selectedDirectors.includes(director.name)
                        ? styles.selected
                        : ""
                    }`}
                    onClick={() =>
                      toggleSelection(
                        selectedDirectors,
                        setSelectedDirectors,
                        director.name
                      )
                    }
                  >
                    <img
                      src={director.image}
                      alt={director.name}
                      className={styles.image}
                    />
                    <p>{director.name}</p>
                  </div>
                ))}
              </div>

              <h3>Choose Your Favorite Genres</h3>
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
                    <p>{genre}</p>
                  </div>
                ))}
              </div>

              <button
                type="submit"
                className={styles.button}
                disabled={loading}
              >
                {loading ? "Registering..." : "Register"}
              </button>
            </form>
          </div>
        </>
      ) : (
        <>
          <div className={styles.verifyContaienr}>
            <h2 className={styles.title}>Verify Your Email</h2>
            <p>
              We've sent a verification code to {registeredEmail}. Please enter
              it below.
            </p>
            <input
              type="text"
              placeholder="Enter verification code"
              className={styles.input}
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
            />

            <button onClick={handleVerify} className={styles.button}>
              Verify{" "}
            </button>
            <button onClick={handleResendCode} className={styles.resendButton}>
              Resend code
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default RegisterForm;
