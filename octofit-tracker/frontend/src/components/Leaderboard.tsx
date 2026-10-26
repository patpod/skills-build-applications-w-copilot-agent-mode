import { CapabilityCard, displayField } from './CapabilityCard.js';
export default function Leaderboard() {
  return <CapabilityCard
    title="Leaderboard"
    description="Compare team point totals."
    endpoint="/api/leaderboard"
    collection="leaderboard"
    emptyText="No leaderboard scores yet."
    renderItem={(item) => `#${displayField(item, 'rank')} ${displayField(item, 'teamName')} — ${displayField(item, 'totalPoints')} points`}
  />;
}
