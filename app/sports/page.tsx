"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MapPin, Star, Search, Filter } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

const allCoaches = [
  {
    id: 1,
    name: "Marc Dubois",
    sport: "Padel",
    rating: 4.9,
    reviews: 127,
    price: "45€/h",
    location: "Paris 16ème",
    image: "/marc_dubois.jpg",
    description: "Coach professionnel de padel avec 8 ans d'expérience",
  },
  {
    id: 2,
    name: "Sophie Martin",
    sport: "Tennis",
    rating: 4.8,
    reviews: 89,
    price: "55€/h",
    location: "Neuilly-sur-Seine",
    image: "/sophie_martin.jpg",
    description: "Ex-joueuse professionnelle, spécialisée dans le perfectionnement",
  },
  {
    id: 3,
    name: "Thomas Leroy",
    sport: "Squash",
    rating: 4.7,
    reviews: 156,
    price: "40€/h",
    location: "Paris 8ème",
    image: "/thomas_leroy.jpg",
    description: "Champion régional de squash, coach depuis 10 ans",
  },
]

const sports = ["Tous", "Padel", "Tennis", "Squash"]

export default function SportsPage() {
  const [selectedSport, setSelectedSport] = useState("Tous")
  const [searchTerm, setSearchTerm] = useState("")

  const filteredCoaches = allCoaches.filter((coach) => {
    const matchesSport = selectedSport === "Tous" || coach.sport === selectedSport
    const matchesSearch =
      coach.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coach.sport.toLowerCase().includes(searchTerm.toLowerCase()) ||
      coach.location.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSport && matchesSearch
  })

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Tous nos coaches sportifs</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Découvrez notre sélection de coaches professionnels dans différents sports
          </p>
        </div>

        {/* Filtres et recherche */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Recherche */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Rechercher un coach, sport ou ville..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtres par sport */}
            <div className="flex gap-2">
              <Filter className="w-5 h-5 text-gray-500 mt-2" />
              {sports.map((sport) => (
                <Button
                  key={sport}
                  variant={selectedSport === sport ? "default" : "outline"}
                  onClick={() => setSelectedSport(sport)}
                  className="whitespace-nowrap"
                >
                  {sport}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Résultats */}
        <div className="mb-4">
          <p className="text-gray-600">
            {filteredCoaches.length} coach{filteredCoaches.length > 1 ? "s" : ""} trouvé
            {filteredCoaches.length > 1 ? "s" : ""}
            {selectedSport !== "Tous" && ` en ${selectedSport}`}
          </p>
        </div>

        {/* Grille des coaches */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCoaches.map((coach) => (
            <Card key={coach.id} className="overflow-hidden hover:shadow-xl transition-shadow duration-300 bg-white">
              <div className="relative">
                <Image
                  src={coach.image || "/placeholder.svg"}
                  alt={coach.name}
                  width={400}
                  height={200}
                  className="w-full h-48 object-cover"
                />
                <Badge className="absolute top-4 left-4 bg-blue-600">{coach.sport}</Badge>
              </div>

              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{coach.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <MapPin className="w-4 h-4" />
                      {coach.location}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">{coach.price}</div>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <p className="text-gray-600 mb-4">{coach.description}</p>

                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{coach.rating}</span>
                  <span className="text-gray-500">({coach.reviews} avis)</span>
                </div>

                <Link href={`/coach/${coach.id}`}>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">Voir le profil</Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Message si aucun résultat */}
        {filteredCoaches.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun coach trouvé</h3>
            <p className="text-gray-600">Essayez de modifier vos critères de recherche</p>
          </div>
        )}
      </div>
    </div>
  )
}
