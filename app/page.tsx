"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Star, Clock, Users } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

const coaches = [
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
    availability: "Disponible aujourd'hui",
    courts: ["Padel Club Paris", "Tennis Club Boulogne"],
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
    availability: "Disponible demain",
    courts: ["Tennis Club Neuilly", "Stade Roland Garros"],
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
    availability: "Disponible ce soir",
    courts: ["Squash Club Opéra", "Fitness First Champs-Élysées"],
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">Trouvez votre coach sportif idéal</h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Réservez des cours avec les meilleurs coaches de votre région. Paiements sécurisés via XRP Ledger avec
            système d'escrow intégré.
          </p>
          <div className="flex justify-center gap-4 mb-12">
            <Badge variant="secondary" className="px-4 py-2 text-sm">
              🏓 Padel
            </Badge>
            <Badge variant="secondary" className="px-4 py-2 text-sm">
              🎾 Tennis
            </Badge>
            <Badge variant="secondary" className="px-4 py-2 text-sm">
              🏸 Squash
            </Badge>
          </div>
        </div>
      </section>

      {/* Coaches Marketplace */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Nos coaches disponibles</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {coaches.map((coach) => (
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
                  <Badge variant="secondary" className="absolute top-4 right-4">
                    {coach.availability}
                  </Badge>
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

                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-semibold">{coach.rating}</span>
                      <span className="text-gray-500">({coach.reviews})</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-500">
                      <Users className="w-4 h-4" />
                      <span>{coach.courts.length} terrains</span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <p className="text-sm font-medium text-gray-700">Terrains disponibles :</p>
                    {coach.courts.map((court, index) => (
                      <Badge key={index} variant="outline" className="mr-2">
                        {court}
                      </Badge>
                    ))}
                  </div>

                  <Link href={`/coach/${coach.id}`}>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      <Clock className="w-4 h-4 mr-2" />
                      Voir les disponibilités
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Pourquoi choisir CoachTrust ?</h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Coaches vérifiés</h3>
              <p className="text-gray-600">Tous nos coaches sont certifiés et ont été vérifiés par notre équipe</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Paiement sécurisé</h3>
              <p className="text-gray-600">Système d'escrow sur XRP Ledger pour des transactions 100% sécurisées</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Réservation instantanée</h3>
              <p className="text-gray-600">Réservez vos cours en quelques clics, 24h/24 et 7j/7</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
