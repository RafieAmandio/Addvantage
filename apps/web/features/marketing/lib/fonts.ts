import { IBM_Plex_Mono, Instrument_Sans } from "next/font/google";

const sans = Instrument_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-tv-sans", display: "swap" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-tv-mono", display: "swap" });

/** The brand fonts as CSS variables, for every marketing page's <main>. */
export const tvFonts = `${sans.variable} ${mono.variable}`;
