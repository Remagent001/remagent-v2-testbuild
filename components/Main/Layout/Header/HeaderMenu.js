import Link from "next/link";
import React from "react";
import style from "./Header.module.css";
export default function MenuList({ children }) {
  return (
    <>
      <ul
        className={
          "align-items-center justify-content-between " + style.mainmenu
        }
        style={{ listStyle: "none" }}
      >
        {children}
      </ul>
    </>
  );
}

export function Menu({ children, href, hasDropdown, active }) {
  return (
    <>
      <li className={hasDropdown ? style["has-droupdown"] : ""}>
        <Link
          href={href ?? "#"}
          className={`test text-nowrap ${active ? style.activeLink : ""}`}
        >
          {children}
        </Link>
      </li>
    </>
  );
}

export function SubMenuList({ children }) {
  return (
    <>
      <ul className={style.submenu} style={{ listStyle: "none" }}>
        {children}
      </ul>
    </>
  );
}
export function SubMenu({ children }) {
  return (
    <>
      <li>
        <Link href="#">{children}</Link>
      </li>
    </>
  );
}
