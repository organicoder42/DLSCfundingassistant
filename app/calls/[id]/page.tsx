import { notFound } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/db';
import CallDetails from '@/components/calls/CallDetails';

export default async function CallDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Fetch call from database
  const call = await db.fundingCall.findUnique({
    where: { id },
  });

  if (!call) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Navigation */}
        <Link
          href="/calls"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Tilbage til calls
        </Link>

        {/* Call Details */}
        <CallDetails call={call} />
      </div>
    </div>
  );
}
