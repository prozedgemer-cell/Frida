import {
  describeCalendarInfluence,
  type CalendarSummary,
} from '../engines/calendarEngine';

type Props = {
  calendar: CalendarSummary | null | undefined;
  compact?: boolean;
};

export function CalendarInfluenceNote({ calendar, compact }: Props) {
  const inf = describeCalendarInfluence(calendar ?? null);
  const has = !!calendar?.entries.length;
  return (
    <div className={`influence-note influence-note--cal ${has ? 'is-hot' : ''}`}>
      <strong>Kalender → output</strong>
      <p>{inf.summaryDa}</p>
      {!compact && (
        <ul className="home-next-list">
          <li>{inf.outfitDa}</li>
          <li>{inf.challengeDa}</li>
          <li>{inf.strafDa}</li>
        </ul>
      )}
    </div>
  );
}
