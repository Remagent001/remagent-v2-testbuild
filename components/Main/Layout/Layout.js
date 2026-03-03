import { Suspense, lazy } from "react";
import Header from "./Header/Header";

const Footer = lazy(() => import("./Footer/Footer/Footer"));

export default function Layout({ children }) {
  return (
    <>
      <Header />
      {children}
      <Suspense fallback={<div>Loading...</div>}>
        <Footer />
      </Suspense>
    </>
  );
}
