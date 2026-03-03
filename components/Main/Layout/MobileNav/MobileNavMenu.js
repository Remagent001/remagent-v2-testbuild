import React from "react";
import style from "./Mobile.module.css"
import Link from "next/link";
export default function MenuList({ children }) {
  return (
    <>
     <ul className={style.mainmenu}>{children}</ul>
    </>
  );
}

export function Menu({ children, href, hasDropdown }) {
  return (
    <>
      <li className={hasDropdown ? style['has-droupdown'] : ""}>
        <Link href={href ?? "#"}>{children}</Link>
      </li>
    </>
  );
}

export function SubMenuList({children}) {
  return (
    <>
      <ul className={style['submenu']}>{children}</ul>
    </>
  );
}
export function SubMenu({children}) {
  return (
    <>
      <li>
        <Link href="#">{children}</Link>
      </li>
    </>
  );
}
