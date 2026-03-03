"use client";
import { useNavControl } from "@/context/NavProvider";
import { IoCloseCircle } from "react-icons/io5";
import style from "./Mobile.module.css"
export default function CloseButton() {
  const { isNavOpen, toggleNav } = useNavControl();
  return (
    <div
      className={"btn border-0 "+style['close-button']}
      onClick={() => {
        toggleNav();
      }}
    >
      <IoCloseCircle  size={25} />
    </div>
  );
}
