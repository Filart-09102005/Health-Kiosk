import { measurementCompletion } from "../data/demoData";
import MiniAnalyticsCard from "./MiniAnalyticsCard";

export default function CompletionRateCard() {
    return <MiniAnalyticsCard label="Completion rate" value={`${measurementCompletion.completed}%`} hint={`${measurementCompletion.incomplete}% incomplete`} />;
}
