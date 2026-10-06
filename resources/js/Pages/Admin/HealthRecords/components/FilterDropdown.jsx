import CustomSelectField from "../../../../Global/CustomSelectField";

/**
 * Health Records filter select.
 *
 * Now a thin wrapper over the shared CustomSelectField so this screen's
 * dropdowns match the ones on Reports rather than carrying a second, slightly
 * different implementation. The prop signature is unchanged, so the four call
 * sites in RecordsFilters did not have to move.
 *
 * `active` is accepted for compatibility but no longer styles the trigger —
 * the shared field already shows its selection, and tinting the control on top
 * of that read as two competing signals for the same thing.
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
