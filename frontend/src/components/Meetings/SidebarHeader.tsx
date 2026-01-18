import { IoClose } from 'react-icons/io5';

interface SidebarHeaderProps {
  decisionsCount: number;
  loading: boolean;
  showCancel: boolean;
  onCancel?: () => void;
}

export default function SidebarHeader({ decisionsCount, loading, showCancel, onCancel }: SidebarHeaderProps) {
  return (
    <div className="relative bg-white border-b-2 border-blue-200 p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900">
            What's Happening
          </h2>
          <div className="flex items-center gap-2 mt-1">
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            )}
            <p className="text-sm text-gray-600">
              {loading 
                ? decisionsCount > 0 
                  ? `Still looking... ${decisionsCount} so far`
                  : `Looking around...`
                : decisionsCount === 0
                  ? `Ready when you are`
                  : `We found ${decisionsCount} thing${decisionsCount !== 1 ? 's' : ''} nearby`}
            </p>
          </div>
        </div>
        {showCancel && onCancel && (
          <button
            onClick={onCancel}
            className="ml-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Clear results"
          >
            <IoClose className="w-6 h-6 text-gray-500 hover:text-gray-700" />
          </button>
        )}
      </div>
    </div>
  );
}
