import { FundingCall } from '@/types';
import CallCard from './CallCard';

interface CallListProps {
  calls: FundingCall[];
}

export default function CallList({ calls }: CallListProps) {
  if (calls.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Ingen calls fundet</p>
        <p className="text-gray-400 text-sm mt-2">
          Prøv at justere dine filtreringsmuligheder
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {calls.map((call) => (
        <CallCard key={call.id} call={call} />
      ))}
    </div>
  );
}
