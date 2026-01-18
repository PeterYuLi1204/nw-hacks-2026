interface MeetingRecord {
  id: number;
  meetingType: string;
  eventDate: string;
  meetingUrl: string;
  pdfText?: string;
}

interface MeetingsSidebarProps {
  meetings: MeetingRecord[];
  loading?: boolean;
}

export default function MeetingsSidebar({ meetings, loading = false }: MeetingsSidebarProps) {
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
    <div className="fixed top-0 right-0 h-full w-[400px] bg-white shadow-2xl z-[999]">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="bg-gray-800 text-white p-4">
            <h2 className="text-lg font-bold">Council Meetings</h2>
            <p className="text-sm text-gray-300 mt-1">
              {loading ? 'Loading...' : `${meetings.length} meeting${meetings.length !== 1 ? 's' : ''} found`}
            </p>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading meetings...</p>
                </div>
              </div>
            ) : meetings.length === 0 ? (
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
                  <p className="font-medium">No meetings found</p>
                  <p className="text-sm mt-2">Try adjusting your date range filter</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {meetings.map((meeting) => (
                  <div key={meeting.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">
                      {meeting.meetingType || 'Untitled Meeting'}
                    </h3>
                    
                    <p className="text-xs text-gray-600 mb-2">
                      {formatDate(meeting.eventDate)}
                    </p>

                    {meeting.meetingUrl && (
                      <a
                        href={meeting.meetingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 font-medium"
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
                        View PDF
                      </a>
                    )}

                    {meeting.pdfText && (
                      <div className="mt-2 text-xs text-gray-500">
                        <span className="inline-flex items-center">
                          <svg
                            className="w-3 h-3 mr-1 text-green-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Text extracted ({meeting.pdfText.length.toLocaleString()} chars)
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
  );
}
