import { Poppins } from "next/font/google";

export const poppins_init = Poppins({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-poppins",
  weight: "500",
});

export const poppins = poppins_init.variable;