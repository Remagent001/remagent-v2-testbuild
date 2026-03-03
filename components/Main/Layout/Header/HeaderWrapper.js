"use client";
import style from "@/components/Main/Layout/Header/Header.module.css";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function HeaderWrapper({ children }) {
  const [isSticky, setIsSticky] = useState(false);
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsSticky(scrollPosition > 230);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const headerClasses = [
    style["edu-header"],
    style["header-default"],
    style["header-style-2"],
    // isHomePage ?
    style["header-transparent"],
    style["disable-transparent"],
    style["header-sticky"],
    isSticky ? style["sticky"] : "",
  ].join(" ");

  return <header className={headerClasses}>{children}</header>;
}
