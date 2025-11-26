import Link from 'next/link';

export default function Home() {
  return (
    <div className="bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Velkommen til DLSC Funding Assistant
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Find de rigtige funding muligheder til din life science virksomhed
            med hjælp fra vores AI-drevne assistent
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Link
            href="/calls"
            className="bg-white p-8 rounded-lg shadow-md hover:shadow-xl transition-shadow border border-gray-200"
          >
            <div className="text-blue-600 text-4xl mb-4">🔍</div>
            <h2 className="text-2xl font-semibold mb-3 text-gray-900">
              Browse Funding Calls
            </h2>
            <p className="text-gray-600 mb-4">
              Søg og filtrer i aktuelle funding muligheder fra danske og EU
              kilder. Find calls der passer til din virksomheds behov.
            </p>
            <span className="text-blue-600 font-medium">
              Browse calls →
            </span>
          </Link>

          <Link
            href="/chat"
            className="bg-white p-8 rounded-lg shadow-md hover:shadow-xl transition-shadow border border-gray-200"
          >
            <div className="text-blue-600 text-4xl mb-4">💬</div>
            <h2 className="text-2xl font-semibold mb-3 text-gray-900">
              Chat med AI Assistant
            </h2>
            <p className="text-gray-600 mb-4">
              Stil spørgsmål om funding, de minimis regler, medfinansiering og
              få personlig vejledning fra vores AI assistent.
            </p>
            <span className="text-blue-600 font-medium">
              Start chat →
            </span>
          </Link>
        </div>

        {/* Info Sections */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h3 className="text-xl font-semibold mb-4 text-gray-900">
            Hvad kan vi hjælpe med?
          </h3>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <span>Find relevante funding calls baseret på din sektor og fase</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <span>Forklar komplekse begreber som de minimis og TRL-niveauer</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <span>Vejlede om medfinansiering og budgetlægning</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">✓</span>
              <span>Holde dig opdateret på deadlines</span>
            </li>
          </ul>
        </div>

        {/* Sources */}
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">
            Vi samler funding muligheder fra:
          </h3>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
            <span className="px-4 py-2 bg-gray-100 rounded-full">DLSC</span>
            <span className="px-4 py-2 bg-gray-100 rounded-full">Innovationsfonden</span>
            <span className="px-4 py-2 bg-gray-100 rounded-full">EU Horizon</span>
            <span className="px-4 py-2 bg-gray-100 rounded-full">EIC</span>
            <span className="px-4 py-2 bg-gray-100 rounded-full">Erhvervsstyrelsen</span>
          </div>
        </div>
      </div>
    </div>
  );
}
