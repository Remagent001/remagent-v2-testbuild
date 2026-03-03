"use client";
import { useTheme } from "@/context/ThemeContext";
import { FaMoon } from "react-icons/fa";
import { IoSunny } from "react-icons/io5";
import style from "./ThemeToggle.module.css";

export default function ThemeToggle({ className }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className={`${style["theme-toggle"]} ${className}`}>
      <label className={style.switch} onClick={toggleTheme}>
        <span className={style.slider + " " + style.round}>
          {theme === "theme-dark" ? (
            <FaMoon className={`${style.icon} ${style.active}`} />
          ) : (
            <IoSunny className={`${style.icon} ${style.active}`} />
          )}
        </span>
      </label>
    </div>
  );
}
