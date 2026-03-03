"use client";
import { useNavControl } from "@/context/NavProvider";
import styyle from "./Mobile.module.css"
import { FaBars } from "react-icons/fa6";
export default function NavButton() {
  const { toggleNav } = useNavControl();
  return (
    <div
      className={"btn border-0 "+styyle['hamburger-bg']}
      onClick={() => {
        toggleNav();
      }}
    >
      <FaBars className={styyle.hamburger}/>
    </div>
  );
}
