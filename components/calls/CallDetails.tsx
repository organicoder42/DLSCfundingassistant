import { FundingCall } from '@/types';
import {
  formatDate,
  formatDateLong,
  formatAmount,
  daysUntilDeadline,
  isDeadlineUrgent,
  isDeadlineExpired,
  translateSource,
  translateCallType,
} from '@/lib/utils';

interface CallDetailsProps {
  call: FundingCall;
}

export default function CallDetails({ call }: CallDetailsProps) {
  const daysLeft = daysUntilDeadline(call.deadline);
  const urgent = isDeadlineUrgent(call.deadline);
  const expired = isDeadlineExpired(call.deadline);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-8 py-6 text-white">
        <div className="flex items-start justify-between mb-4">
          <span className="px-3 py-1 rounded bg-white/20 text-sm font-medium">
            {translateSource(call.source)}
          </span>
          {expired ? (
            <span className="px-3 py-1 rounded bg-red-500 text-sm font-medium">
              Udløbet
            </span>
          ) : urgent ? (
            <span className="px-3 py-1 rounded bg-red-500 text-sm font-medium">
              {daysLeft} dage tilbage
            </span>
          ) : null}
        </div>
        <h1 className="text-3xl font-bold mb-2">{call.title}</h1>
        {call.titleEn && (
          <p className="text-blue-100 italic">{call.titleEn}</p>
        )}
      </div>

      {/* Content */}
      <div className="px-8 py-6">
        {/* Key Information Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
              Deadline
            </h3>
            <p className="text-lg text-gray-900">
              {formatDateLong(call.deadline)}
              {!expired && (
                <span className="text-sm text-gray-500 ml-2">
                  ({daysLeft} dage)
                </span>
              )}
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
              Type
            </h3>
            <p className="text-lg text-gray-900">{translateCallType(call.type)}</p>
          </div>

          {(call.minAmount || call.maxAmount) && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                Beløb
              </h3>
              <p className="text-lg text-gray-900">
                {call.minAmount && call.maxAmount
                  ? `${formatAmount(call.minAmount)} - ${formatAmount(call.maxAmount)}`
                  : call.maxAmount
                    ? `Op til ${formatAmount(call.maxAmount)}`
                    : formatAmount(call.minAmount!)}
              </p>
            </div>
          )}

          {call.coFinancing && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                Medfinansiering
              </h3>
              <p className="text-lg text-gray-900">{call.coFinancing}%</p>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-3">
            Beskrivelse
          </h3>
          <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
            {call.description}
          </div>
          {call.descriptionEn && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-700">
                English description
              </summary>
              <div className="mt-2 prose max-w-none text-gray-700 whitespace-pre-wrap">
                {call.descriptionEn}
              </div>
            </details>
          )}
        </div>

        {/* Sectors & Target Audience */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {call.sectors.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                Sektorer
              </h3>
              <div className="flex flex-wrap gap-2">
                {call.sectors.map(sector => (
                  <span
                    key={sector}
                    className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm"
                  >
                    {sector.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {call.targetAudience.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase mb-2">
                Målgruppe
              </h3>
              <div className="flex flex-wrap gap-2">
                {call.targetAudience.map(audience => (
                  <span
                    key={audience}
                    className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm"
                  >
                    {audience.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* De Minimis Warning */}
        {call.deMinimis && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
            <div className="flex items-start">
              <span className="text-2xl mr-3">⚠️</span>
              <div>
                <h4 className="font-semibold text-amber-900 mb-1">
                  De minimis støtte
                </h4>
                <p className="text-sm text-amber-800">
                  Dette program er underlagt EU's de minimis regler. Maksimalt
                  300.000 EUR over 3 år på tværs af alle støtteordninger.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Contact Information */}
        {(call.contactEmail || call.contactPhone) && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Kontakt</h3>
            <div className="space-y-2">
              {call.contactEmail && (
                <p className="text-gray-700">
                  <span className="font-medium">Email:</span>{' '}
                  <a
                    href={`mailto:${call.contactEmail}`}
                    className="text-blue-600 hover:underline"
                  >
                    {call.contactEmail}
                  </a>
                </p>
              )}
              {call.contactPhone && (
                <p className="text-gray-700">
                  <span className="font-medium">Telefon:</span>{' '}
                  <a
                    href={`tel:${call.contactPhone}`}
                    className="text-blue-600 hover:underline"
                  >
                    {call.contactPhone}
                  </a>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <a
            href={call.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
          >
            Se mere information
          </a>
          {call.applicationUrl && (
            <a
              href={call.applicationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
            >
              Ansøg her
            </a>
          )}
        </div>

        {/* Metadata */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-sm text-gray-500">
          <p>Opdateret: {formatDate(call.updatedAt)}</p>
          {call.scrapedAt && (
            <p>Sidst scrapet: {formatDate(call.scrapedAt)}</p>
          )}
        </div>
      </div>
    </div>
  );
}
