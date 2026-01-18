import { IoChatbubbleEllipses } from 'react-icons/io5';

interface AIChatButtonProps {
  onClick: () => void;
}

export default function AIChatButton({ onClick }: AIChatButtonProps) {
  return (
    <button
      onClick={onClick}
      className="absolute bottom-6 right-6 z-[1000] w-14 h-14 rounded-full bg-slate-600 text-white shadow-md hover:bg-slate-700 hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center justify-center group"
      aria-label="Open AI Chat"
    >
      <IoChatbubbleEllipses className="w-6 h-6 group-hover:scale-110 transition-transform" />
    </button>
  );
}
