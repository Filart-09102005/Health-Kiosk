import { cardClassName, cardStyle } from "../utils/surface";
import QuickActionButton from "./QuickActionButton";
import SectionHeader from "./SectionHeader";

const quickActions = [
    { id: "report", label: "Generate Report", description: "Export clinic summary", icon: "report" },
    { id: "student", label: "Add Student", description: "Register new learner", icon: "student" },
    { id: "teacher", label: "Add Teacher", description: "Register faculty user", icon: "teacher" },
    { id: "export", label: "Export Records", description: "Download health data", icon: "export" },
    { id: "alerts", label: "View Alerts", description: "Open alert center", icon: "alerts" },
];

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
