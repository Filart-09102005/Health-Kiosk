/**
 * Departments, in one place.
 *
 * A department belongs to exactly one kind of account, and the two lists must
 * never mix: a teacher form that offers "College Students" can create a member
 * of staff filed under a student cohort, which then shows up in student
 * analytics. The Add form, the Edit form and the analytics filter all read
 * these lists so they cannot drift apart.
 *
 * Values are the codes stored on `users.department`. Only the labels are
 * presentational.
 */

export const STUDENT_ROLE = "student";
export const STAFF_ROLE = "personnel";

export const STUDENT_DEPARTMENTS = ["COLLEGE", "BED"];
export const STAFF_DEPARTMENTS = ["COLLEGE INSTRUCTOR", "BED INSTRUCTOR", "NTP"];

const LABELS = {
    COLLEGE: "College Students",
    BED: "Basic Education (BED) Students",
    "COLLEGE INSTRUCTOR": "College Instructors",
    "BED INSTRUCTOR": "Basic Education (BED) Instructors",
    NTP: "Non-Teaching Personnel (NTP)",
};

/** True for every non-student account, whatever the exact role string is. */
export function isStaffRole(role) {
    return String(role || "").toLowerCase() !== STUDENT_ROLE;
}

export function departmentLabel(value) {
    const code = String(value || "").trim().toUpperCase();

    if (!code) return "";

    return LABELS[code] || code.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/** The department codes an account of this role may hold. */
export function departmentsFor(role) {
    return isStaffRole(role) ? STAFF_DEPARTMENTS : STUDENT_DEPARTMENTS;
}

/** Ready for a select, with the "choose" placeholder in front. */
export function departmentOptionsFor(role, placeholder = "Choose department") {
    return [
        { value: "", label: placeholder },
        ...departmentsFor(role).map((code) => ({ value: code, label: departmentLabel(code) })),
    ];
}

/** Whether a department may be held by an account of this role. */
export function departmentAllowedFor(role, department) {
    return departmentsFor(role).includes(String(department || "").trim().toUpperCase());
}
