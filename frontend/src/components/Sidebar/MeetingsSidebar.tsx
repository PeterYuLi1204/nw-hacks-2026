import type { DecisionWithContext } from '../../App';
import MeetingDetail from './MeetingDetail';
import MeetingsList from './MeetingsList';
import SidebarHeader from './SidebarHeader';
import { SIDEBAR_WIDTH } from '../../constants/layout';
import FunFacts from './FunFacts';

interface MeetingsSidebarProps {
  decisions: DecisionWithContext[];
  loading?: boolean;
  selectedDecision: DecisionWithContext | null;
  onDecisionClick: (decision: DecisionWithContext) => void;
  onBack: () => void;
  onCancel?: () => void;
  maxDistance: number | null;
  onMaxDistanceChange: (distance: number | null) => void;
}

export default function MeetingsSidebar({
  decisions,
  loading = false,
  selectedDecision,
  onDecisionClick,
  onBack,
  onCancel,
  maxDistance,
  onMaxDistanceChange
}: MeetingsSidebarProps) {
  // Detail view for a single decision
  if (selectedDecision) {
    return <MeetingDetail decision={selectedDecision} onBack={onBack} />;
  }

  // List view
  return (
    <div
      className="fixed top-0 right-0 h-full bg-gradient-to-b from-gray-50 to-white shadow-2xl z-[999]"
      style={{ width: `${SIDEBAR_WIDTH}px` }}
    >
      <div className="h-full flex flex-col">
        <SidebarHeader
          decisionsCount={decisions.length}
          loading={loading}
          showCancel={loading || decisions.length > 0}
          onCancel={onCancel}
          maxDistance={maxDistance}
          onMaxDistanceChange={onMaxDistanceChange}
        />

        <div className="flex-1 overflow-y-auto p-3">
          {loading && decisions.length === 0 ? (
            <FunFacts />
          ) : (
            <MeetingsList
              decisions={decisions}
              loading={loading}
              onDecisionClick={onDecisionClick}
            />
          )}
        </div>
      </div>
    </div>
  );
}
