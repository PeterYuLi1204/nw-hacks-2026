import type { DecisionWithContext } from '../App';
import MeetingDetail from './MeetingDetail';
import MeetingsList from './MeetingsList';
import SidebarHeader from './SidebarHeader';

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
  // Detail view for a single decision
  if (selectedDecision) {
    return <MeetingDetail decision={selectedDecision} onBack={onBack} />;
  }

  // List view
  return (
    <div className="fixed top-0 right-0 h-full w-[400px] bg-gradient-to-b from-gray-50 to-white shadow-2xl z-[999]">
      <div className="h-full flex flex-col">
        <SidebarHeader 
          decisionsCount={decisions.length}
          loading={loading}
          showCancel={loading || decisions.length > 0}
          onCancel={onCancel}
        />

        <div className="flex-1 overflow-y-auto p-3">
          <MeetingsList 
            decisions={decisions}
            loading={loading}
            onDecisionClick={onDecisionClick}
          />
        </div>
      </div>
    </div>
  );
}
