import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Zap, Users, Globe, Award, Heart } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">À propos de CoachTrust</h1>
          <p className="text-xl text-gray-600 mb-8">
            La première marketplace décentralisée qui révolutionne la mise en relation entre coaches sportifs et clients
            grâce à la blockchain XRP Ledger.
          </p>
          <Badge className="px-6 py-2 text-lg bg-blue-600">Propulsé par XRP Ledger</Badge>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Notre Mission</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Démocratiser l'accès au coaching sportif en créant un écosystème transparent, sécurisé et équitable pour
              tous.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle>Accessibilité</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Rendre le coaching sportif accessible à tous, partout et à tout moment.</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle>Sécurité</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Garantir des transactions 100% sécurisées grâce à la blockchain XRP Ledger.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-purple-600" />
                </div>
                <CardTitle>Qualité</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Sélectionner uniquement les meilleurs coaches certifiés et expérimentés.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pourquoi XRP Ledger */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Pourquoi XRP Ledger ?</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Nous avons choisi XRP Ledger pour ses avantages uniques dans le domaine des paiements et des contrats
              intelligents.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <Zap className="w-8 h-8 text-yellow-500 mb-2" />
                <CardTitle>Transactions Ultra-Rapides</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Les paiements sont traités en 3-5 secondes, permettant une expérience utilisateur fluide et
                  instantanée.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="w-8 h-8 text-green-500 mb-2" />
                <CardTitle>Système d'Escrow Intégré</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Protection automatique des fonds jusqu'à la réalisation du service, garantissant la sécurité pour
                  tous.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Globe className="w-8 h-8 text-blue-500 mb-2" />
                <CardTitle>Frais Minimaux</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Coûts de transaction extrêmement bas (moins de 0.01€), maximisant les revenus des coaches.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Award className="w-8 h-8 text-purple-500 mb-2" />
                <CardTitle>Écologique</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Blockchain éco-responsable avec une consommation énergétique minimale comparée aux autres solutions.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Équipe */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Notre Équipe</h2>
            <p className="text-lg text-gray-600">Une équipe passionnée de sport et de technologie blockchain</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4"></div>
                <h3 className="text-xl font-semibold mb-2">Alex Founder</h3>
                <p className="text-gray-600 mb-2">CEO & Co-fondateur</p>
                <p className="text-sm text-gray-500">Expert en blockchain et ancien coach sportif</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4"></div>
                <h3 className="text-xl font-semibold mb-2">Marie Tech</h3>
                <p className="text-gray-600 mb-2">CTO & Co-fondatrice</p>
                <p className="text-sm text-gray-500">Développeuse blockchain spécialisée XRP Ledger</p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4"></div>
                <h3 className="text-xl font-semibold mb-2">Tom Sport</h3>
                <p className="text-gray-600 mb-2">Head of Sports</p>
                <p className="text-sm text-gray-500">Ex-athlète professionnel et expert en coaching</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Vision */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Notre Vision</h2>
          <p className="text-lg text-gray-600 mb-8">
            Créer un écosystème mondial où chaque personne peut facilement accéder à un coaching sportif de qualité,
            tout en offrant aux coaches une plateforme équitable et transparente pour développer leur activité.
          </p>
          <div className="bg-blue-50 rounded-lg p-8">
            <h3 className="text-xl font-semibold text-blue-900 mb-4">
              "Le sport pour tous, partout, en toute confiance"
            </h3>
            <p className="text-blue-700">
              Notre devise résume notre engagement à démocratiser l'accès au sport grâce à la technologie blockchain.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
