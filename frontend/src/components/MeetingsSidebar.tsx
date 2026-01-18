import type { DecisionWithContext } from '../App';

interface MeetingsSidebarProps {
  decisions: DecisionWithContext[];
  loading?: boolean;
  selectedDecision: DecisionWithContext | null;
  onDecisionClick: (decision: DecisionWithContext) => void;
  onBack: () => void;
  onCancel?: () => void;
}

export default function MeetingsSidebar({ 
  decisions, 
  loading = false,
  selectedDecision,
  onDecisionClick,
  onBack,
  onCancel
}: MeetingsSidebarProps) {
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

  // Detail view for a single decision
  if (selectedDecision) {
    return (
      <div className="fixed top-0 right-0 h-full w-[400px] bg-white shadow-2xl z-[999]">
        <div className="h-full flex flex-col">
          {/* Header with back button */}
          <div className="bg-gray-800 text-white p-4">
            <button
              onClick={onBack}
              className="flex items-center text-gray-300 hover:text-white mb-2 transition-colors"
            >
              <svg
                className="w-5 h-5 mr-1"
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
              Back to list
            </button>
            <h2 className="text-lg font-bold">Decision Details</h2>
          </div>

          {/* Decision content */}
          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="font-bold text-gray-900 text-lg mb-3">
              {selectedDecision.title}
            </h3>

            {/* Meeting context */}
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-600 mb-1">
                <span className="font-medium">Meeting:</span> {selectedDecision.meetingType}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-medium">Date:</span> {formatDate(selectedDecision.meetingDate)}
              </p>
              {selectedDecision.meetingUrl && (
                <a
                  href={selectedDecision.meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                  View Meeting PDF
                </a>
              )}
            </div>

            {/* Summary */}
            <div className="mb-4">
              <h4 className="font-semibold text-gray-800 mb-2">Summary</h4>
              <p className="text-gray-700 text-sm leading-relaxed">
                {selectedDecision.summary}
              </p>
            </div>

            {/* Location */}
            {selectedDecision.location && (
              <div className="mb-4">
                <h4 className="font-semibold text-gray-800 mb-2">Location</h4>
                <p className="text-sm text-gray-600">
                  <span className="inline-flex items-center">
                    <svg
                      className="w-4 h-4 mr-1 text-red-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {selectedDecision.location[0].toFixed(4)}, {selectedDecision.location[1].toFixed(4)}
                  </span>
                </p>
              </div>
            )}

            {/* Full content */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Full Decision Text</h4>
              <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                {selectedDecision.content}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="fixed top-0 right-0 h-full w-[400px] bg-white shadow-2xl z-[999]">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="bg-gray-800 text-white p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-lg font-bold">Council Decisions</h2>
              <p className="text-sm text-gray-300 mt-1">
                {loading 
                  ? `Loading... (${decisions.length} decisions found)` 
                  : `${decisions.length} decision${decisions.length !== 1 ? 's' : ''} found`}
              </p>
            </div>
            {(loading || decisions.length > 0) && onCancel && (
              <button
                onClick={onCancel}
                className="ml-2 p-1.5 hover:bg-gray-700 rounded transition-colors"
                title="Cancel and clear"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading && decisions.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Processing meetings with AI...</p>
              </div>
            </div>
          ) : decisions.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500 px-4">
                <svg
                  className="w-16 h-16 mx-auto mb-4 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <p className="font-medium">No decisions found</p>
                <p className="text-sm mt-2">Try adjusting your date range filter</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {decisions.map((decision) => (
                <div 
                  key={decision.decisionId} 
                  className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => onDecisionClick(decision)}
                >
                  <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
                    {decision.title}
                  </h3>
                  
                  <p className="text-xs text-gray-500 mb-2">
                    {decision.meetingType} • {formatDate(decision.meetingDate)}
                  </p>

                  <p className="text-sm text-gray-600 line-clamp-3 mb-2">
                    {decision.summary}
                  </p>

                  <div className="flex items-center justify-between">
                    {decision.location ? (
                      <>
                        <span className="inline-flex items-center text-xs text-green-600">
                          <svg
                            className="w-3 h-3 mr-1"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Has location
                        </span>
                        <span className="text-xs text-blue-600 font-medium">
                          View details →
                        </span>
                      </>
                    ) : (
                      <span className="ml-auto text-xs text-blue-600 font-medium">
                        View details →
                      </span>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Loading indicator at bottom when streaming */}
              {loading && (
                <div className="p-4 text-center">
                  <div className="inline-flex items-center text-sm text-gray-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Processing more meetings...
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
