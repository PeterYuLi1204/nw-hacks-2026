interface DifficultyToggleProps {
  difficultyLevel: 'simple' | 'detailed';
  onDifficultyChange: (level: 'simple' | 'detailed') => void;
}

export default function DifficultyToggle({ difficultyLevel, onDifficultyChange }: DifficultyToggleProps) {
  return (
    <div className="flex items-center gap-2 text-xs text-gray-700">
      <span className="italic">I want explanations in</span>
      <div className="inline-flex items-center border border-gray-300 rounded-lg overflow-hidden">
        <button
          onClick={() => onDifficultyChange('simple')}
          className={`px-3 py-1 font-medium transition-colors ${
            difficultyLevel === 'simple'
              ? 'bg-blue-100 text-gray-800'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          simple
        </button>
        <div className="w-px h-full bg-gray-300" />
        <button
          onClick={() => onDifficultyChange('detailed')}
          className={`px-3 py-1 font-medium transition-colors ${
            difficultyLevel === 'detailed'
              ? 'bg-blue-100 text-gray-800'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          detailed
        </button>
      </div>
      <span className="italic">tone</span>
    </div>
  );
}
