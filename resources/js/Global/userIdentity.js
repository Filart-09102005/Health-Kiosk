// Shared name/initials logic for the logged-in account's own profile display
// (avatar circles, header greeting, profile page). Every call site used to
// compute this itself, and two of them papered over a missing firstname by
// splicing the literal word "User" into what reads as a real name (e.g. a
// lastname-only account showed "User Doe") - this is the single place that
// decides what to show instead, so every display agrees and none of them
// invent part of a person's name.

function clean(value) {
    return typeof value === "string" ? value.trim() : "";
}

/**
 * @param fallback  Shown only when there is no name and no email at all.
 *                  Callers pick wording that fits where it renders
 *                  ("Administrator", "Your Account", etc).
 */
export function getDisplayName(user, fallback = "Account") {
    const firstname = clean(user?.firstname);
    const lastname = clean(user?.lastname);
    const fullName = clean(user?.full_name) || `${firstname} ${lastname}`.trim();

    return fullName || clean(user?.email) || fallback;
}

/**
 * "John Doe" -> JD, "John" -> J, "Doe" (lastname only) -> D, nothing -> "U".
 * charAt(0) on an empty string is itself an empty string, so the two-letter
 * template below already degrades to one letter or the fallback without any
 * extra branching.
 */
export function getInitials(user, fallback = "U") {
    const firstname = clean(user?.firstname);
    const lastname = clean(user?.lastname);
    const initials = `${firstname.charAt(0)}${lastname.charAt(0)}`.toUpperCase();

    return initials || fallback;
}
