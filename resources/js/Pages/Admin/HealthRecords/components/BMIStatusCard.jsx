import { Scale } from "lucide-react";
import { cardClassName, cardStyle } from "../utils/surface";
import HealthStatusBadge from "./HealthStatusBadge";

export default function BMIStatusCard({ record }) {
    const category = record.bmi < 18.5 ? "Underweight" : record.bmi < 25 ? "Normal" : record.bmi < 30 ? "Overweight" : "Obese";

    return (
        <article className={`${cardClassName} p-4`} style={cardStyle}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: "var(--color-surface)", color: "var(--color-primary)" }}>
                        <Scale size={18} />
                    </span>
                    <div>
                        <p className="text-sm font-black">BMI details</p>
                        <p className="text-xs font-semibold" style={{ color: "var(--color-muted)" }}>{category} range</p>
                    </div>
                </div>
                <HealthStatusBadge status={record.healthStatus} />
            </div>
            <p className="mt-5 text-4xl font-black">{record.bmi}</p>
            <p className="mt-2 text-sm leading-6" style={{ color: "var(--color-muted)" }}>
                {record.advice}
            </p>
        </article>
    );
}
