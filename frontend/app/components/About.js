"use client";
import styles from "../styles/About.module.css";
import "../styles/globals.css";

const About = () => {
  return (
    <div className={styles.container}>
      <section className={styles.section}>
        <h2 className={styles.heading}>About choosethemovie</h2>
        <p className={styles.text}>
          Ever spent more time choosing a movie than actually watching one? We
          get it. That’s why <strong>choosethemovie</strong> helps you decide
          faster and better. Let's stop endless scrolling and settling for
          mediocrity out of despair.
        </p>
        <p className={styles.text}>
          The system learns what you like and recommends titles tailored just
          for you. Just click, watch, and enjoy.
        </p>
        <p className={styles.text}>
          No registration is required — but signing up is the best way to sync
          your experience across devices and save your favorite movies for
          later.
        </p>
        <p className={styles.text_github}>
          <a
            href="https://github.com/aoporski/movie_picker"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
        </p>
        <p className={styles.highlight}>
          🍿 The goal? Conflict-free movie nights. Every time.
        </p>
      </section>
    </div>
  );
};

export default About;
