"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Menu, X, Wallet, User, LogOut } from "lucide-react"

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isWalletConnected, setIsWalletConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState("")

  const connectXamanWallet = async () => {
    try {
      // Simulation de connexion Xaman
      // Dans un vrai projet, vous utiliseriez la SDK Xaman
      setIsWalletConnected(true)
      setWalletAddress("rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH")
    } catch (error) {
      console.error("Erreur de connexion wallet:", error)
    }
  }

  const disconnectWallet = () => {
    setIsWalletConnected(false)
    setWalletAddress("")
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CT</span>
              </div>
              <span className="text-xl font-bold text-gray-900">CoachTrust</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-700 hover:text-blue-600 font-medium">
              Accueil
            </Link>
            <Link href="/sports" className="text-gray-700 hover:text-blue-600 font-medium">
              Sports
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-blue-600 font-medium">
              À propos
            </Link>
            <Link href="/contact" className="text-gray-700 hover:text-blue-600 font-medium">
              Contact
            </Link>
          </div>

          {/* Wallet Connection */}
          <div className="hidden md:flex items-center space-x-4">
            {!isWalletConnected ? (
              <Button onClick={connectXamanWallet} className="bg-blue-600 hover:bg-blue-700">
                <Wallet className="w-4 h-4 mr-2" />
                Connecter Xaman
              </Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>{formatAddress(walletAddress)}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <User className="w-4 h-4 mr-2" />
                    Mon profil
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={disconnectWallet}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Déconnecter
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-700 hover:text-blue-600">
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-50">
              <Link
                href="/"
                className="block px-3 py-2 text-gray-700 hover:text-blue-600"
                onClick={() => setIsMenuOpen(false)}
              >
                Accueil
              </Link>
              <Link
                href="/sports"
                className="block px-3 py-2 text-gray-700 hover:text-blue-600"
                onClick={() => setIsMenuOpen(false)}
              >
                Sports
              </Link>
              <Link
                href="/about"
                className="block px-3 py-2 text-gray-700 hover:text-blue-600"
                onClick={() => setIsMenuOpen(false)}
              >
                À propos
              </Link>
              <Link
                href="/contact"
                className="block px-3 py-2 text-gray-700 hover:text-blue-600"
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </Link>
              <div className="px-3 py-2">
                {!isWalletConnected ? (
                  <Button onClick={connectXamanWallet} className="w-full bg-blue-600 hover:bg-blue-700">
                    <Wallet className="w-4 h-4 mr-2" />
                    Connecter Xaman
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Badge variant="outline" className="w-full justify-center">
                      {formatAddress(walletAddress)}
                    </Badge>
                    <Button onClick={disconnectWallet} variant="outline" className="w-full">
                      Déconnecter
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
