"use client";
import { useAuth } from "../hooks/auth_context";
import LoginForm from "./Login";
import styles from "../styles/Navigation.module.css";
import Link from "next/link";

const MainComponent = () => {
  return <div className={styles.main}>Welcome to ChooseTheMovie!</div>;
};

export const Navigation = () => {
  const { user, logout } = useAuth();

  return (
    <div className={styles.container}>
      {user ? (
        <>
          <MainComponent />
          <button className={styles.logoutButton} onClick={logout}>
            Logout
          </button>
        </>
      ) : (
        <>
          <LoginForm />
          <Link href="/register">Register</Link>
        </>
      )}
    </div>
  );
};

export default Navigation;
