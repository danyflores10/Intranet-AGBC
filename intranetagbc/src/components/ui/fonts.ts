import { Roboto } from "next/font/google"

export const roboto = Roboto({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-roboto',
  adjustFontFallback: true,
  style: ['normal', 'italic'],
})