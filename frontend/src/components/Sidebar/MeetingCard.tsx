import { IoCalendarOutline, IoLocationSharp } from 'react-icons/io5';
import type { DecisionWithContext } from '../../App';

interface MeetingCardProps {
  decision: DecisionWithContext;
  onClick: (decision: DecisionWithContext) => void;
}

export default function MeetingCard({ decision, onClick }: MeetingCardProps) {
  const formatDate = (dateString: string) => {
    if (!dateString) return 'No date';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div 
      className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-all cursor-pointer group"
      onClick={() => onClick(decision)}
    >
      <h3 className="font-bold text-gray-900 text-sm mb-2 line-clamp-2">
        {decision.title}
      </h3>
      
      <div className="text-xs text-gray-500 mb-3 flex items-center">
        <IoCalendarOutline className="w-3.5 h-3.5 mr-1" />
        <span className="whitespace-nowrap">{formatDate(decision.meetingDate)}</span>
        <span className="mx-2">•</span>
        <span>{decision.meetingType}</span>
      </div>

      {/* Featured summary in card */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
        <p className="text-sm text-gray-800 line-clamp-3 leading-relaxed">
          {decision.summary}
        </p>
      </div>

      <div className="flex items-center justify-between text-xs">
        {decision.location ? (
          <>
            <span className="inline-flex items-center text-green-600 font-medium">
              <IoLocationSharp className="w-3.5 h-3.5 mr-1" />
              Has location
            </span>
            <span className="text-blue-600 font-medium group-hover:underline">
              Read more →
            </span>
          </>
        ) : (
          <span className="ml-auto text-blue-600 font-medium group-hover:underline">
            Read more →
          </span>
        )}
      </div>
    </div>
  );
}
