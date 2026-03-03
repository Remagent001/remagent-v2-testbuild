"use client";
import { useNavControl } from "@/context/NavProvider";
import React, { useState } from "react";
import CloseButton from "./CloseButton";
import { AnimatePresence, motion } from "framer-motion";
import MenuList, { Menu } from "./MobileNavMenu";
import Link from "next/link";
import style from "./Mobile.module.css";
import Image from "next/image";
import { FaMinus, FaPlus } from "react-icons/fa6";
import { usePathname } from "next/navigation"; // Import usePathname to get current route

export default function MobileNav() {
  const { isNavOpen, toggleNav } = useNavControl();
  const [isSubMenuOpen, setIsSubMenuOpen] = useState(false);
  const pathname = usePathname(); // Get the current route

  const toggleSubMenu = () => {
    setIsSubMenuOpen(!isSubMenuOpen);
  };

  const framerSidebar = {
    initial: { x: "-100%" },
    animate: { x: 0 },
    exit: { x: "-100%" },
    transition: { duration: 0.3 },
  };
  const framerSidebarBackground = {
    initial: { opacity: 0 },
    animate: { opacity: 0.5 },
    exit: { opacity: 0 },
    transition: { duration: 0.3 },
  };

  // Check for specific simple pages
  const isSimplePage =
    pathname === "/" ||
    pathname === "/about-us" ||
    pathname === "/contact-us" ||
    pathname === "/investor" ||
    pathname === "/copyright-policy" ||
    pathname === "/how-it-works" ||
    pathname === "/privacy-policy" ||
    pathname === "/security" ||
    pathname === "/terms-and-conditions";

  // Check for professional or business page
  const isProfessionalOrBusinessPage =
    pathname.startsWith("/professional") || pathname.startsWith("/business");

  // Conditional links based on pathname
  const whyRemagentLink = pathname.startsWith("/business")
    ? `${process.env.SITE_URL}/business/why-remagent-business`
    : `${process.env.SITE_URL}/professional/why-remagent-professional`;

  const howItWorksLink = pathname.startsWith("/business")
    ? `${process.env.SITE_URL}/business/how-it-works-business`
    : `${process.env.SITE_URL}/professional/how-it-works-professional`;

  return (
    <>
      <AnimatePresence mode="wait" initial={false}>
        {isNavOpen && (
          <>
            <motion.div
              {...framerSidebar}
              className={[style["active"], style["popup-mobile-menu"]].join(
                " "
              )}
            >
              <div className={style.inner}>
                <div className={style["header-top"]}>
                  <div className={style.logo}>
                    <Link href={process.env.SITE_URL}>
                      <Image
                        width={65}
                        height={65}
                        priority
                        src={process.env.SITE_LOGO}
                        alt="Site Logo"
                        className={style.logo}
                      />
                    </Link>
                  </div>
                  <CloseButton />
                </div>

                {/* Conditional rendering: Only show navigation links if not a simple page */}
                {!isSimplePage && (
                  <>
                    <MenuList>
                      {isProfessionalOrBusinessPage && (
                        <>
                          {/* Home link for both Professional and Business pages */}
                          <Menu
                            href={process.env.SITE_URL}
                            active={pathname === "/"}
                          >
                            Home
                          </Menu>

                          {pathname.startsWith("/business") && (
                            <>
                              <Menu href={`${process.env.SITE_URL}/business`}>
                                Business
                              </Menu>
                              <Menu href={whyRemagentLink}>Why Remagent</Menu>
                              <Menu href={howItWorksLink}>How It Works</Menu>
                            </>
                          )}
                          {pathname.startsWith("/professional") && (
                            <>
                              <Menu
                                href={`${process.env.SITE_URL}/professional`}
                              >
                                Professional
                              </Menu>
                              <Menu href={whyRemagentLink}>Why Remagent</Menu>
                              <Menu href={howItWorksLink}>How It Works</Menu>
                            </>
                          )}
                        </>
                      )}
                    </MenuList>
                  </>
                )}

                <div className={style["mobile-nav-buttons"]}>
                  {isSimplePage && (
                    <Link
                      href={process.env.REMAGENT_URL + "/login"}
                      className="option-item mb-2"
                    >
                      <button className={style.signInBtn}>Sign in</button>
                    </Link>
                  )}
                  {!isSimplePage && isProfessionalOrBusinessPage && (
                    <>
                      <div className="d-flex gap-3">
                        <div className="option-item mb-2">
                          <Link
                            href={process.env.REMAGENT_URL + "/login"}
                            className={
                              "btn btn-outline-info fs-5 px-3 py-2 rounded-4"
                            }
                          >
                            Sign in
                          </Link>
                        </div>
                        <div className="option-item">
                          <Link
                            href={process.env.REMAGENT_URL + "/signup"}
                            className={
                              "btn btn-primary px-3 py-2 rounded-4 fs-5"
                            }
                          >
                            Sign up
                          </Link>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </motion.div>

            <motion.div
              {...framerSidebarBackground}
              className="position-fixed z-1 vh-100 vw-100 bg-black top-0"
              onClick={() => toggleNav()}
            />
          </>
        )}
      </AnimatePresence>
    </>
  );
}
