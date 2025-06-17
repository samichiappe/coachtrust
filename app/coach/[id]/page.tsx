"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { MapPin, Star, Clock, Phone, Mail, Award, Wallet, CheckCircle, XCircle, Loader2 } from "lucide-react"
import Image from "next/image"
import { Coach, BookingRequest } from "@/lib/types"
import { useXamanWallet } from "@/lib/hooks/useXamanWallet"
import { useBookingPayment } from "@/lib/hooks/useBookingPayment"
import XamanConnectButton from "@/components/XamanConnectButton"
import TransactionStatusExplainer from "@/components/TransactionStatusExplainer"

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
    ],    availability: {
      "2025-06-17": ["09:00", "10:30", "14:00", "16:30", "18:00"],
      "2025-06-18": ["08:00", "11:00", "15:00", "17:30", "19:00"],
      "2025-06-19": ["09:30", "13:00", "17:00", "18:30"],
      "2025-06-20": ["08:30", "10:00", "14:30", "16:00", "19:30"],
      "2025-06-21": ["09:00", "11:30", "15:30", "17:00"],
      "2025-06-22": ["10:00", "13:30", "16:30", "18:00"],
      "2025-06-23": ["08:00", "09:30", "14:00", "17:30", "19:00"],
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
    ],    availability: {
      "2025-06-17": ["10:00", "14:30", "16:00", "18:30"],
      "2025-06-18": ["09:00", "11:30", "15:30", "17:00", "19:30"],
      "2025-06-19": ["08:30", "13:30", "16:30", "18:00"],
      "2025-06-20": ["09:30", "12:00", "15:00", "17:30"],
      "2025-06-21": ["08:00", "10:30", "14:00", "16:30", "19:00"],
      "2025-06-22": ["11:00", "13:00", "16:00", "18:30"],
      "2025-06-23": ["09:00", "14:30", "17:00", "19:30"],
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
    ],    availability: {
      "2025-06-17": ["08:00", "12:00", "18:00", "19:30"],
      "2025-06-18": ["07:30", "10:00", "17:00", "20:00"],
      "2025-06-19": ["09:00", "14:00", "18:30", "19:45"],
      "2025-06-20": ["08:30", "11:30", "16:30", "18:15"],
      "2025-06-21": ["07:00", "09:30", "15:00", "19:00"],
      "2025-06-22": ["10:30", "13:45", "17:30", "20:15"],
      "2025-06-23": ["08:00", "12:30", "16:00", "18:45"],
    },
  },
}

export default function CoachDetailPage() {
  const params = useParams()
  const coachId = Number.parseInt(params.id as string)
  const coach = coachesData[coachId as keyof typeof coachesData]

  // Hook Xaman pour vérifier la connexion
  const { isConnected, address } = useXamanWallet()

  // Hook de booking-payment intégré
  const { state: bookingState, actions: bookingActions } = useBookingPayment()

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [selectedCourt, setSelectedCourt] = useState<string>("")
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

  const createBookingRequest = (): BookingRequest => {
    const sessionDateTime = createSessionDateTime()
    
    return {
      coachId: coach.id.toString(),
      sessionDateTime,
      duration: sessionDuration,
      court: selectedCourt,
      amount: calculateSessionAmount(),
      paymentType: 'escrow', // Utilisation d'escrow pour la sécurité
      memo: `Cours de ${coach.sport} avec ${coach.name} - ${formatDate(selectedDate!)} ${selectedTime}`
    }
  }

  const handleBooking = async () => {
    if (!selectedDate || !selectedTime || !selectedCourt) {
      alert("Veuillez sélectionner une date, un horaire et un terrain")
      return
    }

    if (!isConnected || !address) {
      alert("Veuillez vous connecter avec Xaman d'abord")
      return
    }

    try {
      const bookingRequest = createBookingRequest()
      console.log("🚀 Démarrage de la réservation:", bookingRequest)
      
      const result = await bookingActions.startBooking(bookingRequest, coach.xrplAddress)
      
      if (result.success) {
        console.log("✅ Réservation créée avec succès!")
        // La confirmation sera affichée via l'état du hook
      } else {
        console.error("❌ Échec de la réservation:", result.error)
      }
    } catch (error) {
      console.error("❌ Erreur lors de la réservation:", error)
    }
  }

  const handleCancelBooking = async () => {
    if (bookingState.currentWorkflow) {
      try {
        const result = await bookingActions.cancelBooking(
          bookingState.currentWorkflow.bookingId,
          "Annulation par l'utilisateur"
        )
        
        if (result.success) {
          console.log("✅ Réservation annulée avec succès")
          // Reset du formulaire
          resetForm()
        }
      } catch (error) {
        console.error("❌ Erreur lors de l'annulation:", error)
      }
    }
  }

  const resetForm = () => {
    setSelectedDate(undefined)
    setSelectedTime("")
    setSelectedCourt("")
    setSessionDuration(60)
    bookingActions.clearState()
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
                )}                {/* Interface de réservation intégrée avec booking-payment */}
                {selectedDate && selectedTime && selectedCourt && (
                  <div className="border-t pt-4">
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <h5 className="font-medium mb-2">Récapitulatif de réservation</h5>
                      <div className="text-sm space-y-1">
                        <div>Coach: {coach.name}</div>
                        <div>Date: {selectedDate.toLocaleDateString()}</div>
                        <div>Heure: {selectedTime}</div>
                        <div>Durée: {sessionDuration}min</div>
                        <div>Terrain: {selectedCourt}</div>
                        <div className="font-semibold text-blue-600">Total: {calculateSessionAmount()} XRP</div>
                      </div>
                    </div>

                    {/* États du workflow de réservation */}
                    {bookingState.isLoading && (
                      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4">
                        <div className="flex items-center gap-2 text-blue-800">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span className="font-medium">Traitement en cours...</span>
                        </div>
                        <p className="text-blue-700 text-sm mt-1">
                          Création de l'escrow et signature via Xaman
                        </p>
                      </div>
                    )}

                    {bookingState.error && (
                      <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-4">
                        <div className="flex items-center gap-2 text-red-800 mb-2">
                          <XCircle className="w-5 h-5" />
                          <span className="font-medium">Erreur de réservation</span>
                        </div>
                        <p className="text-red-700 text-sm">{bookingState.error}</p>
                        <Button 
                          onClick={() => bookingActions.clearState()} 
                          variant="outline" 
                          size="sm" 
                          className="mt-2"
                        >
                          Réessayer
                        </Button>
                      </div>
                    )}

                    {bookingState.success && bookingState.currentWorkflow && (
                      <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-4">
                        <div className="flex items-center gap-2 text-green-800 mb-2">
                          <CheckCircle className="w-5 h-5" />
                          <span className="font-medium">Réservation confirmée !</span>
                        </div>
                        <div className="text-green-700 text-sm space-y-1">
                          <p>ID de réservation: {bookingState.currentWorkflow.bookingId}</p>
                          <p>Statut: {bookingState.currentWorkflow.currentStep}</p>
                          {bookingState.currentWorkflow.escrow && (
                            <p>Escrow créé (sécurisé jusqu'à la fin du cours)</p>
                          )}
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button 
                            onClick={resetForm} 
                            variant="outline" 
                            size="sm"
                          >
                            Nouvelle réservation
                          </Button>
                          {bookingState.currentWorkflow.escrow && (
                            <Button 
                              onClick={handleCancelBooking} 
                              variant="destructive" 
                              size="sm"
                            >
                              Annuler réservation
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Boutons d'action selon l'état de connexion */}
                    {!bookingState.success && !bookingState.isLoading && (
                      <>
                        {!isConnected ? (
                          <div className="space-y-4">
                            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                              <div className="flex items-center gap-2 text-yellow-800 mb-2">
                                <Wallet className="w-5 h-5" />
                                <span className="font-medium">Connexion Xaman requise</span>
                              </div>
                              <p className="text-yellow-700 text-sm">
                                Connectez votre wallet Xaman pour procéder au paiement sécurisé via escrow XRPL.
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
                              <p className="text-green-600 text-xs mt-1">
                                Paiement sécurisé via escrow XRPL - fonds libérés après validation du cours
                              </p>
                            </div>
                            <Button 
                              onClick={handleBooking} 
                              className="w-full bg-blue-600 hover:bg-blue-700"
                              disabled={bookingState.isLoading}
                            >
                              {bookingState.isLoading ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Création escrow...
                                </>
                              ) : (
                                'Réserver et payer via Escrow XRPL'
                              )}
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>            </CardContent>
          </Card>

          {/* Status Explainer */}
          <TransactionStatusExplainer />

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
