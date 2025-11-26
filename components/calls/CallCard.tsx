import Link from 'next/link';
import { FundingCall } from '@/types';
import { formatDate, formatAmount, daysUntilDeadline, isDeadlineUrgent, isDeadlineExpired, translateSource } from '@/lib/utils';

interface CallCardProps {
  call: FundingCall;
}

export default function CallCard({ call }: CallCardProps) {
  const daysLeft = daysUntilDeadline(call.deadline);
  const urgent = isDeadlineUrgent(call.deadline);
  const expired = isDeadlineExpired(call.deadline);

  return (
    <Link href={`/calls/${call.id}`} className="block">
      <div className="border rounded-lg p-5 hover:shadow-lg transition-shadow bg-white h-full">
        <div className="flex justify-between items-start mb-3">
          <span className="text-xs font-medium px-2 py-1 rounded bg-blue-100 text-blue-800">
            {translateSource(call.source)}
          </span>

          {expired ? (
            <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
              Udløbet
            </span>
          ) : urgent ? (
            <span className="text-xs font-medium px-2 py-1 rounded bg-red-100 text-red-800">
              {daysLeft} dage tilbage
            </span>
          ) : (
            <span className="text-xs text-gray-500">
              Deadline: {formatDate(call.deadline)}
            </span>
          )}
        </div>

        <h3 className="font-semibold text-lg mb-2 line-clamp-2 text-gray-900">
          {call.title}
        </h3>

        <p className="text-gray-600 text-sm mb-3 line-clamp-3">
          {call.description}
        </p>

        <div className="flex flex-wrap gap-2 mb-3">
          {call.sectors.slice(0, 3).map(sector => (
            <span
              key={sector}
              className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600"
            >
              {sector}
            </span>
          ))}
          {call.sectors.length > 3 && (
            <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
              +{call.sectors.length - 3} flere
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between text-gray-700">
            <span className="font-medium">Beløb:</span>
            <span>
              {call.minAmount && call.maxAmount
                ? `${formatAmount(call.minAmount)} - ${formatAmount(call.maxAmount)}`
                : call.maxAmount
                  ? `Op til ${formatAmount(call.maxAmount)}`
                  : 'Ikke angivet'
              }
            </span>
          </div>

          {call.coFinancing && (
            <div className="flex justify-between text-gray-700">
              <span className="font-medium">Medfinansiering:</span>
              <span>{call.coFinancing}%</span>
            </div>
          )}
        </div>

        {call.deMinimis && (
          <div className="mt-3 flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded">
            <span>⚠️</span>
            <span>De minimis støtte</span>
          </div>
        )}
      </div>
    </Link>
  );
}
