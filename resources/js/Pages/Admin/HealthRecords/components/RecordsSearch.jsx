import SearchInput from "./SearchInput";

export default function RecordsSearch({ value, onChange, isSearching }) {
    return (
        <SearchInput
            value={value}
            onChange={onChange}
            isSearching={isSearching}
            placeholder="Search by name, school ID, or session..."
        />
    );
}
