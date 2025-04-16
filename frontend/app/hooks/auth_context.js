"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (token) {
      try {
        const decodedUser = jwtDecode(token);
        setUser(decodedUser);
      } catch (error) {
        console.error("Invalid token:", error);
        sessionStorage.removeItem("token");
      }
    }
    setLoading(false);
  }, []);

  const login = (token) => {
    try {
      const decodedUser = jwtDecode(token);
      setUser(decodedUser);
      sessionStorage.setItem("token", token);
    } catch (error) {
      console.error("Error decoding token:", error);
    }
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
