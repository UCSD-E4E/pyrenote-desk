import { useState } from "react";
import { SingleValue } from "react-select";
import { Species } from "../../../main/schema";
import { dropdownStyles } from "./SpeciesDropdown.styles";

import dynamic from 'next/dynamic';


const Select = dynamic(() => import('react-select'), {
  ssr: false,
});

export type SpeciesOption = {
	speciesId: number;
	label: string;
};

type SpeciesDropdownProps = {
	speciesMap: Record<number, Species>;
	speciesId: number;
    allowNull?: boolean;
    defaultMenuIsOpen?: boolean;
	onChange: (v: SingleValue<SpeciesOption>)  => void;
    onMenuOpen?: () => void;
    onMenuClose?: () => void;
};

export function SpeciesDropdown({
	speciesMap,
	speciesId,
    allowNull = false,
    defaultMenuIsOpen = false,
	onChange,
    onMenuOpen,
    onMenuClose,
}: SpeciesDropdownProps) {
	const speciesOptions: SpeciesOption[] = Object.entries(speciesMap).map(([id, species]) => ({
		speciesId: Number(id),
		label: species.common,
	}));

	const [inputValue, setInputValue] = useState("");

	return (
        <Select
            value={speciesOptions.find(option => option.speciesId === Number(speciesId)) ?? null}
            onChange={onChange}
            styles={dropdownStyles}
            options={speciesOptions}
            isClearable={allowNull}
            placeholder=""
            isSearchable
            inputValue={inputValue}
            onInputChange={(newValue) => setInputValue(newValue)}
            onKeyDown={(e) => e.stopPropagation()} // prevent global keybinds
            onMenuOpen={onMenuOpen}
            onMenuClose={onMenuClose}
            defaultMenuIsOpen={defaultMenuIsOpen}
            filterOption={(option, rawInput) =>
                option.label.toLowerCase().includes(rawInput.toLowerCase())
            }>
        </Select>
	);
}