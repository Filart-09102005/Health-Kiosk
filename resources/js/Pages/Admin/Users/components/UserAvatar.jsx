import { getInitials } from "../../../../Global/userIdentity";

// Deterministic tint per person, so the same account always reads the same
// colour across the table. Hue only — saturation and lightness stay fixed so
// no avatar ever fights the surrounding UI.
function hueFor(seed) {
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) {
        hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % 360;
}

export default function UserAvatar({ firstname = "", lastname = "", size = 34 }) {
    const initials = getInitials({ firstname, lastname });
    const hue = hueFor(`${firstname}${lastname}` || "user");

    return (
        <span
            aria-hidden="true"
            className="inline-flex shrink-0 items-center justify-center rounded-full font-black"
            style={{
                width: size,
                height: size,
                fontSize: size * 0.36,
                backgroundColor: `hsl(${hue} 68% 94%)`,
                color: `hsl(${hue} 55% 34%)`,
                border: `1px solid hsl(${hue} 55% 86%)`,
            }}
        >
            {initials}
        </span>
    );
}
