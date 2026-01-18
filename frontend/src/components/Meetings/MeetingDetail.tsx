import { IoChevronBack, IoCalendarOutline, IoLocationSharp, IoDocumentTextOutline, IoLinkOutline, IoSparkles } from 'react-icons/io5';
import type { DecisionWithContext } from '../../App';

interface MeetingDetailProps {
  decision: DecisionWithContext;
  onBack: () => void;
}

export default function MeetingDetail({ decision, onBack }: MeetingDetailProps) {
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
    <div className="fixed top-0 right-0 h-full w-[350px] bg-gradient-to-b from-gray-50 to-white shadow-2xl z-[999]">
      <div className="h-full flex flex-col">
        {/* Header with back button */}
        <div className="relative bg-white border-b-2 border-blue-200 p-5">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 hover:text-blue-600 mb-3 transition-colors group"
          >
            <IoChevronBack className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back to list</span>
          </button>
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Georgia, serif' }}>
            What's the decision?
          </h2>
          <p className="text-sm text-gray-600 mt-1">Here's what happened at this meeting</p>
        </div>

        {/* Decision content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <h3 className="font-bold text-gray-900 text-xl leading-tight">
            {decision.title}
          </h3>

          {/* Meeting context */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 pb-2.5 shadow-sm">
            <div className="flex items-center mb-3">
              <IoCalendarOutline className="w-4 h-4 text-gray-500 mr-2" />
              <h4 className="font-semibold text-gray-700 text-xs uppercase tracking-wide">When & Where</h4>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-gray-700 flex items-start">
                <span className="text-gray-500 min-w-[60px]">Type:</span>
                <span className="font-medium">{decision.meetingType}</span>
              </p>
              <p className="text-sm text-gray-700 flex items-start">
                <span className="text-gray-500 min-w-[60px]">Date:</span>
                <span className="font-medium">{formatDate(decision.meetingDate)}</span>
              </p>
            </div>
            {decision.meetingUrl && (
              <a
                href={decision.meetingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm text-sky-500 hover:text-sky-700 font-medium mt-3 hover:underline"
              >
                <IoLinkOutline className="w-4 h-4 mr-1" />
                Read the full document
              </a>
            )}
          </div>

          {/* Summary */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center mb-2">
              <IoSparkles className="w-5 h-5 text-blue-600 mr-2" />
              <h4 className="font-bold text-blue-900 text-base">In a nutshell</h4>
            </div>
            <p className="text-gray-800 text-sm leading-relaxed">
              {decision.summary}
            </p>
          </div>

          {/* Location */}
          {decision.location && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center mb-2">
                <IoLocationSharp className="w-4 h-4 text-gray-500 mr-2" />
                <h4 className="font-semibold text-gray-700 text-xs uppercase tracking-wide">Location</h4>
              </div>
              <p className="text-sm text-gray-700 font-mono">
                {decision.location[0].toFixed(4)}, {decision.location[1].toFixed(4)}
              </p>
            </div>
          )}

          {/* Full content */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center mb-3">
              <IoDocumentTextOutline className="w-4 h-4 text-gray-500 mr-2" />
              <h4 className="font-semibold text-gray-700 text-xs uppercase tracking-wide">The Full Story</h4>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
              {decision.content}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
