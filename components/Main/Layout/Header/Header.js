"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import MobileNav from "../MobileNav/MobileNav";
import NavButton from "../MobileNav/NavButton";
import style from "./Header.module.css";
import MenuList, { Menu } from "./HeaderMenu";
import HeaderWrapper from "./HeaderWrapper";

export default function Header() {
  const pathname = usePathname();
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

  const isProfessionalOrBusinessPage =
    pathname.startsWith("/professional") || pathname.startsWith("/business");

  const whyRemagentLink = pathname.startsWith("/business")
    ? "/business/why-remagent-business"
    : "/professional/why-remagent-professional";

  const howItWorksLink = pathname.startsWith("/business")
    ? "/business/how-it-works-business"
    : "/professional/how-it-works-professional";

  return (
    <>
      <HeaderWrapper>
        <div className="container-fluid">
          <div className="row align-items-center justify-content-between">
            {/* Logo Section */}
            <div className="col-lg-2 col-md-3 col-6">
              <div className={style.logo}>
                <Link href={process.env.SITE_URL}>
                  <Image
                    className={"logo-light " + style["logo-light"]}
                    src={process.env.SITE_LOGO1}
                    alt="Site Logo"
                    width={160}
                    height={75}
                    priority
                    quality={100}
                  />
                </Link>
              </div>
            </div>

            {/* Only show the Sign in button for simple pages */}
            {isSimplePage ? (
              <div className="col-lg-4 col-md-7 col-6">
                <div
                  className={
                    "d-flex justify-content-end " + style["header-right"]
                  }
                >
                  <Link href={process.env.REMAGENT_URL + "/login"}>
                    <button className={style.signInBtn}>Sign in</button>
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {/* Menu Section */}
                <div className="col-lg-7 d-none d-xl-block">
                  <nav className={"d-none d-lg-block text-center " + style["mainmenu-nav"]}>
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
                              <Menu
                                href={`${process.env.SITE_URL}/business`}
                                active={pathname === "/business"}
                              >
                                Business
                              </Menu>
                              <Menu
                                href={`${process.env.SITE_URL}/business/why-remagent-business`}
                                active={whyRemagentLink === pathname}
                              >
                                Why Remagent
                              </Menu>
                              <Menu
                                href={`${process.env.SITE_URL}/business/how-it-works-business`}
                                active={howItWorksLink === pathname}
                              >
                                How It Works
                              </Menu>
                            </>
                          )}
                          {pathname.startsWith("/professional") && (
                            <>
                              <Menu
                                href={`${process.env.SITE_URL}/professional`}
                                active={pathname === "/professional"}
                              >
                                Professional
                              </Menu>
                              <Menu
                                href={`${process.env.SITE_URL}/professional/why-remagent-professional`}
                                active={whyRemagentLink === pathname}
                              >
                                Why Remagent
                              </Menu>
                              <Menu
                                href={`${process.env.SITE_URL}/professional/how-it-works-professional`}
                                active={howItWorksLink === pathname}
                              >
                                How It Works
                              </Menu>
                            </>
                          )}
                        </>
                      )}
                    </MenuList>
                  </nav>
                </div>

                {/* Button Section for non-simple pages */}
                <div className="col-lg-3 col-md-2 col-6">
                  <div
                    className={
                      "d-flex justify-content-end " + style["header-right"]
                    }
                  >
                    <div
                      className={
                        "d-none d-xl-block " + style["header-menu-bar"]
                      }
                    >
                      <div className="d-flex align-items-center gap-4">
                        {isProfessionalOrBusinessPage && (
                          <>
                            <div className="option-item">
                              <Link
                                href={process.env.REMAGENT_URL + "/login"}
                                className={
                                  "btn btn-outline-light fs-5 px-3 py-2 rounded-4"
                                }
                              >
                                Sign in
                              </Link>
                            </div>
                            <div className="option-item ml-2">
                              <Link
                                href={process.env.REMAGENT_URL + "/signup"}
                                className={
                                  "btn btn btn-light px-3 py-2 rounded-4 fs-5"
                                }
                              >
                                Sign up
                              </Link>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="mobile-menu-bar ml--15 ml_sm--5 d-block d-xl-none">
                      <div className="hamberger">
                        <button
                          className={
                            "hamberger-button header-menu " +
                            style["white-box-icon"]
                          }
                        >
                          <NavButton />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </HeaderWrapper>
      <MobileNav />
    </>
  );
}
