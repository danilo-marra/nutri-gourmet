import "@/styles/globals.css";
import {
  Poppins,
  Figtree,
  Plus_Jakarta_Sans,
  Fredoka,
  Dancing_Script,
  Inter,
} from "next/font/google";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-primary",
  display: "swap",
});

const figtree = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-button",
  display: "swap",
});

const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-brand",
  display: "swap",
});

const dancingScript = Dancing_Script({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-tagline",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-data",
  display: "swap",
});

export default function App({ Component, pageProps }) {
  return (
    <main
      className={`${poppins.variable} ${figtree.variable} ${plusJakartaSans.variable} ${fredoka.variable} ${dancingScript.variable} ${inter.variable}`}
    >
      <Component {...pageProps} />
    </main>
  );
}
