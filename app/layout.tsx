import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { XamanWalletProvider } from "@/contexts/XamanWalletProvider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "CoachTrust - Marketplace de Coaches Sportifs",
  description: "Trouvez et réservez des cours avec les meilleurs coaches sportifs. Paiements sécurisés via XRP Ledger.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <XamanWalletProvider>
          <Navbar />
          <main>{children}</main>
          <Footer />
        </XamanWalletProvider>
      </body>
    </html>
  )
}
