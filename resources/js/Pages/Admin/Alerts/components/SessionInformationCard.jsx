export default function SessionInformationCard({ alert }) {
    return (
        <div className="rounded-[14px] border p-4" style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}>
            <p className="font-black">Session information</p>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <Info label="Session status" value={alert.sessionStatus} />
                <Info label="Triggered" value={alert.triggeredAt} />
                <Info label="Reviewed by" value={alert.reviewedBy} />
                <Info label="School ID" value={alert.schoolId} />
            </div>
        </div>
    );
}

function Info({ label, value }) {
    return <div><p className="text-xs font-black uppercase" style={{ color: "var(--color-muted)" }}>{label}</p><p className="mt-1 font-bold">{value}</p></div>;
}
