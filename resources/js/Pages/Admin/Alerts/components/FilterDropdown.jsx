import CustomSelectField from "../../../../Global/CustomSelectField";

/**
 * Alerts filter select.
 *
 * Wraps the shared CustomSelectField so the Severity and Measurement controls
 * match the ones on Reports and Health Records. Prop signature unchanged, so
 * AlertsFilters did not have to move.
 *
 * `active` is still accepted but no longer tints the trigger — the shared field
 * shows its own selection state, and doing both read as two signals for one
 * thing.
 */
export default function FilterDropdown({ label, value, options, onChange }) {
    return (
        <CustomSelectField
            label={label}
            value={value}
            options={options}
            onChange={onChange}
        />
    );
}
