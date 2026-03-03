"use client";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";

const defaultCtx = {
  isNavOpen: false,
  setisNavOpen: () => {},
  toggleNav: () => {},
};

const GlobalContext = createContext(defaultCtx);

export const GlobalContextProvider = ({ children }) => {
  const pathname = usePathname();
  const [isNavOpen, setisNavOpen] = useState(false);

  function toggleNav() {
    setisNavOpen(!isNavOpen);
  }
  useEffect(() => {
    if (isNavOpen) {
      toggleNav();
    }
  }, [pathname]);

  return (
    <GlobalContext.Provider
      value={{
        isNavOpen,
        setisNavOpen,
        toggleNav,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export function useNavControl() {
  const { isNavOpen, setisNavOpen, toggleNav } = useContext(GlobalContext);
  return { isNavOpen, setisNavOpen, toggleNav };
}

export const useGlobalContext = () => useContext(GlobalContext);
