
import Script from "next/script";
import Bootstrap from "@/components/Bootstrap";
import { GlobalContextProvider } from "@/context/NavProvider";
import { poppins } from "@/utilities/fonts";
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
export const metadata = {
  title: {
    template: "%s | " + process.env.SITE_TITLE,
    default: process.env.SITE_TITLE,
  },
  description: process.env.SITE_DESCRIPTION,
  keywords: process.env.SITE_KEYWORDS,
  openGraph: {
    title: process.env.SITE_TITLE,
    description: process.env.SITE_DESCRIPTION,
    url: process.env.SITE_URL,
    siteName: process.env.SITE_TITLE,
    images: [
      {
        url: process.env.SITE_LOGO,
        alt: process.env.SITE_TITLE,
      },
    ],
  },
  metadataBase: process.env.SITE_URL,
  alternates: {
    canonical: process.env.SITE_URL,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${poppins}`}>
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_PLACES_KEY}&libraries=places`}
          strategy="beforeInteractive"
        />
        <GlobalContextProvider>
          {children}
          <Bootstrap />
        </GlobalContextProvider>
      </body>
    </html>
  );
}
