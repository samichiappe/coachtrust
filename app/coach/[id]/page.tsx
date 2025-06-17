"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { MapPin, Star, Clock, Phone, Mail, Award, Wallet } from "lucide-react"
import Image from "next/image"
import PaymentComponent from "@/components/PaymentComponent"
import { PaymentResult } from "@/lib/xrpl/payment"
import { Coach } from "@/lib/types"
import { useXamanWallet } from "@/lib/hooks/useXamanWallet"
import XamanConnectButton from "@/components/XamanConnectButton"

const coachesData: { [key: number]: Coach } = {
  1: {
    id: 1,
    name: "Marc Dubois",
    sport: "Padel",
    rating: 4.9,
    reviews: 127,
    price: 45,
    hourlyRate: 25, // XRP hourly rate
    location: "Paris 16ème",
    image: "/marc_dubois.jpg",
    description:
      "Coach professionnel de padel avec 8 ans d'expérience. Ancien joueur de tennis reconverti dans le padel, je vous accompagne dans votre progression quel que soit votre niveau.",
    phone: "+33 6 12 34 56 78",
    email: "marc.dubois@coachtrust.com",
    xrplAddress: "rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH", // Mock XRPL address
    certifications: ["Diplôme d'État", "Formation FFT", "Certification Padel Pro"],
    courts: [
      { name: "Padel Club Paris", address: "123 Avenue Foch, 75016 Paris" },
      { name: "Tennis Club Boulogne", address: "45 Rue de la Paix, 92100 Boulogne" },
    ],
    availability: {
      "2024-01-15": ["09:00", "10:30", "14:00", "16:30"],
      "2024-01-16": ["08:00", "11:00", "15:00"],
      "2024-01-17": ["09:30", "13:00", "17:00"],
    },
  },  2: {
    id: 2,
    name: "Sophie Martin",
    sport: "Tennis",
    rating: 4.8,
    reviews: 89,
    price: 55,
    hourlyRate: 30, // XRP hourly rate
    location: "Neuilly-sur-Seine",
    image: "/sophie_martin.jpg",
    description:
      "Ex-joueuse professionnelle, spécialisée dans le perfectionnement technique et mental. J'ai participé à plusieurs tournois internationaux avant de me consacrer à l'enseignement.",
    phone: "+33 6 98 76 54 32",
    email: "sophie.martin@coachtrust.com",
    xrplAddress: "rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe", // Mock XRPL address
    certifications: ["Ex-Pro WTA", "Diplôme d'État", "Formation mentale"],
    courts: [
      { name: "Tennis Club Neuilly", address: "78 Boulevard Bineau, 92200 Neuilly" },
      { name: "Stade Roland Garros", address: "2 Avenue Gordon Bennett, 75016 Paris" },
    ],
    availability: {
      "2024-01-15": ["10:00", "14:30", "16:00"],
      "2024-01-16": ["09:00", "11:30", "15:30", "17:00"],
      "2024-01-17": ["08:30", "13:30", "16:30"],
    },
  },  3: {
    id: 3,
    name: "Thomas Leroy",
    sport: "Squash",
    rating: 4.7,
    reviews: 156,
    price: 40,
    hourlyRate: 22, // XRP hourly rate
    location: "Paris 8ème",
    image: "/thomas_leroy.jpg",
    description:
      "Champion régional de squash, coach depuis 10 ans. Spécialisé dans l'amélioration de la condition physique et de la technique de jeu pour tous niveaux.",
    phone: "+33 6 45 67 89 12",
    email: "thomas.leroy@coachtrust.com",
    xrplAddress: "rLNaPoKeeBjZe2qs6x52yVPZpZ8td4dc6w", // Mock XRPL address
    certifications: ["Champion Régional", "Diplôme d'État", "Formation Fitness"],
    courts: [
      { name: "Squash Club Opéra", address: "12 Rue Scribe, 75009 Paris" },
      { name: "Fitness First Champs-Élysées", address: "88 Avenue des Champs-Élysées, 75008 Paris" },
    ],
    availability: {
      "2024-01-15": ["08:00", "12:00", "18:00", "19:30"],
      "2024-01-16": ["07:30", "10:00", "17:00", "20:00"],
      "2024-01-17": ["09:00", "14:00", "18:30"],
    },
  },
}

export default function CoachDetailPage() {
  const params = useParams()
  const coachId = Number.parseInt(params.id as string)
  const coach = coachesData[coachId as keyof typeof coachesData]

  // Hook Xaman pour vérifier la connexion
  const { isConnected, address } = useXamanWallet()

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [selectedCourt, setSelectedCourt] = useState<string>("")
  const [showPayment, setShowPayment] = useState(false)
  const [sessionDuration, setSessionDuration] = useState(60) // Default 1 hour

  if (!coach) {
    return <div>Coach non trouvé</div>
  }
  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0]
  }

  const getAvailableSlots = () => {
    if (!selectedDate) return []
    const dateStr = formatDate(selectedDate)
    return coach.availability[dateStr] || []
  }

  const calculateSessionAmount = () => {
    return ((coach.hourlyRate * sessionDuration) / 60).toFixed(2)
  }

  const createSessionDateTime = () => {
    if (!selectedDate || !selectedTime) return new Date()
    
    const [hours, minutes] = selectedTime.split(':').map(Number)
    const sessionDate = new Date(selectedDate)
    sessionDate.setHours(hours, minutes, 0, 0)
    return sessionDate
  }

  const handleBooking = () => {
    if (!selectedDate || !selectedTime || !selectedCourt) {
      alert("Veuillez sélectionner une date, un horaire et un terrain")
      return
    }
    setShowPayment(true)
  }

  const handlePaymentSuccess = (result: PaymentResult) => {
    alert(`✅ Paiement réussi!\n\nTransaction: ${result.txHash}\nType: ${result.paymentType}\nMontant: ${result.amount} XRP`)
    // Reset form
    setShowPayment(false)
    setSelectedDate(undefined)
    setSelectedTime("")
    setSelectedCourt("")
  }

  const handlePaymentError = (error: string) => {
    alert(`❌ Erreur de paiement: ${error}`)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header du coach */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-1">
                <Image
                  src={coach.image || "/placeholder.svg"}
                  alt={coach.name}
                  width={300}
                  height={300}
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>

              <div className="md:col-span-2">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{coach.name}</h1>
                    <Badge className="mb-2 bg-blue-600">Coach {coach.sport}</Badge>
                    <div className="flex items-center gap-4 text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {coach.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{coach.rating}</span>
                        <span>({coach.reviews} avis)</span>
                      </div>
                    </div>
                  </div>                  <div className="text-right">
                    <div className="text-3xl font-bold text-blue-600">{coach.hourlyRate} XRP/h</div>
                    <div className="text-sm text-gray-500">({coach.price}€/h)</div>
                  </div>
                </div>

                <p className="text-gray-700 mb-6">{coach.description}</p>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-2">Contact</h3>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        {coach.phone}
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {coach.email}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Certifications</h3>
                    <div className="space-y-1">
                      {coach.certifications.map((cert, index) => (
                        <Badge key={index} variant="outline" className="mr-2 mb-1">
                          <Award className="w-3 h-3 mr-1" />
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Calendrier et réservation */}
          <Card>
            <CardHeader>
              <CardTitle>Réserver un cours</CardTitle>
              <CardDescription>Sélectionnez une date et un horaire disponible</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Calendrier */}
                <div>
                  <h4 className="font-medium mb-2">Choisir une date</h4>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    className="rounded-md border"
                    disabled={(date) => date < new Date()}
                  />
                </div>

                {/* Créneaux horaires */}
                {selectedDate && (
                  <div>
                    <h4 className="font-medium mb-2">Créneaux disponibles</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {getAvailableSlots().map((time) => (
                        <Button
                          key={time}
                          variant={selectedTime === time ? "default" : "outline"}
                          onClick={() => setSelectedTime(time)}
                          className="text-sm"
                        >
                          <Clock className="w-4 h-4 mr-1" />
                          {time}
                        </Button>
                      ))}
                    </div>
                    {getAvailableSlots().length === 0 && (
                      <p className="text-gray-500 text-sm">Aucun créneau disponible pour cette date</p>
                    )}
                  </div>
                )}                {/* Sélection de la durée */}
                {selectedTime && (
                  <div>
                    <h4 className="font-medium mb-2">Durée de la session</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {[30, 60, 90].map((duration) => (
                        <Button
                          key={duration}
                          variant={sessionDuration === duration ? "default" : "outline"}
                          onClick={() => setSessionDuration(duration)}
                          className="text-sm"
                        >
                          {duration}min
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sélection du terrain */}
                {selectedTime && (
                  <div>
                    <h4 className="font-medium mb-2">Choisir un terrain</h4>
                    <div className="space-y-2">
                      {coach.courts.map((court, index) => (
                        <Button
                          key={index}
                          variant={selectedCourt === court.name ? "default" : "outline"}
                          onClick={() => setSelectedCourt(court.name)}
                          className="w-full justify-start text-left"
                        >
                          <div>
                            <div className="font-medium">{court.name}</div>
                            <div className="text-xs text-gray-500">{court.address}</div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}                {/* Bouton de réservation */}
                {selectedDate && selectedTime && selectedCourt && !showPayment && (
                  <div className="border-t pt-4">
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <h5 className="font-medium mb-2">Récapitulatif</h5>
                      <div className="text-sm space-y-1">
                        <div>Coach: {coach.name}</div>
                        <div>Date: {selectedDate.toLocaleDateString()}</div>
                        <div>Heure: {selectedTime}</div>
                        <div>Durée: {sessionDuration}min</div>
                        <div>Terrain: {selectedCourt}</div>
                        <div className="font-semibold text-blue-600">Total: {calculateSessionAmount()} XRP</div>
                      </div>
                    </div>
                    
                    {/* Affichage conditionnel selon l'état de connexion Xaman */}
                    {!isConnected ? (
                      <div className="space-y-4">
                        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                          <div className="flex items-center gap-2 text-yellow-800 mb-2">
                            <Wallet className="w-5 h-5" />
                            <span className="font-medium">Connexion Xaman requise</span>
                          </div>
                          <p className="text-yellow-700 text-sm">
                            Connectez votre wallet Xaman pour procéder au paiement sécurisé sur XRPL.
                          </p>
                        </div>
                        <XamanConnectButton 
                          className="w-full"
                          onConnect={(address) => {
                            console.log('Xaman connecté:', address)
                          }}
                        />
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                          <div className="flex items-center gap-2 text-green-800 mb-2">
                            <Wallet className="w-5 h-5" />
                            <span className="font-medium">Wallet connecté</span>
                          </div>
                          <p className="text-green-700 text-sm">
                            Adresse: {address}
                          </p>
                        </div>
                        <Button onClick={handleBooking} className="w-full bg-blue-600 hover:bg-blue-700">
                          Procéder au paiement XRPL
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Composant de paiement */}
                {showPayment && selectedDate && selectedTime && selectedCourt && (                  <div className="border-t pt-4">
                    <PaymentComponent
                      coach={{
                        id: coach.id.toString(),
                        name: coach.name,
                        hourlyRate: coach.hourlyRate,
                        walletAddress: coach.xrplAddress
                      }}
                      sessionDateTime={createSessionDateTime()}
                      duration={sessionDuration}
                      amount={parseFloat(calculateSessionAmount())}
                      onPaymentComplete={handlePaymentSuccess}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Terrains disponibles */}
          <Card>
            <CardHeader>
              <CardTitle>Terrains disponibles</CardTitle>
              <CardDescription>Lieux où {coach.name} donne ses cours</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {coach.courts.map((court, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">{court.name}</h4>
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <MapPin className="w-4 h-4" />
                      {court.address}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
