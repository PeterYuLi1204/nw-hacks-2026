import { IoSearchOutline } from 'react-icons/io5';
import type { DecisionWithContext } from '../../App';
import MeetingCard from './MeetingCard';

interface MeetingsListProps {
  decisions: DecisionWithContext[];
  loading: boolean;
  onDecisionClick: (decision: DecisionWithContext) => void;
}

export default function MeetingsList({ decisions, loading, onDecisionClick }: MeetingsListProps) {
  if (loading && decisions.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Looking through the records...</p>
          <p className="text-gray-500 text-sm mt-1">Give us a sec</p>
        </div>
      </div>
    );
  }

  if (decisions.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-500 px-4">
          <IoSearchOutline className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="font-semibold text-gray-700 text-lg">Nothing to show yet</p>
          <p className="text-sm mt-2">Try picking different dates or moving the map around</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {decisions.map((decision) => (
        <MeetingCard 
          key={decision.decisionId} 
          decision={decision}
          onClick={onDecisionClick}
        />
      ))}
    </div>
  );
}
