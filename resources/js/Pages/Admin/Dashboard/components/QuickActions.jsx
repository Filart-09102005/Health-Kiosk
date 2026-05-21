import { quickActions } from "../data/demoData";
import { cardClassName, cardStyle } from "../utils/surface";
import QuickActionButton from "./QuickActionButton";
import SectionHeader from "./SectionHeader";

export default function QuickActions() {
    return (
        <article className={`${cardClassName} p-5`} style={cardStyle}>
            <SectionHeader title="Quick actions" description="Common clinic workflows for administrators." />
            <div className="grid gap-3">
                {quickActions.map((action, index) => (
                    <QuickActionButton key={action.id} action={action} index={index} />
                ))}
            </div>
        </article>
    );
}
