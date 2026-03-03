"use client";
import { createContext, useContext, useEffect, useState } from "react";
import Cookies from "universal-cookie";

const ThemeContext = createContext();

export function ThemeProvider({ children, current }) {
  const cookies = new Cookies();
  const [theme, setTheme] = useState(current);

  useEffect(() => {
    if (theme) {
      document.body.classList.remove(`theme-dark`);
      document.body.classList.remove(`theme-light`);
      document.body.classList.add(`${theme}`);
      cookies.set("theme", theme);
    } else {
      setTheme(cookies.get("theme"));
      document.body.classList.add(`${theme}`);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) =>
      prevTheme === "theme-light" ? "theme-dark" : "theme-light"
    );
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}