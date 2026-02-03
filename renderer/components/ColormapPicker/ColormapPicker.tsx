import { useState } from "react";
import { COLORMAP_OPTIONS, ColormapOption } from "../../utils/colormaps";

interface ColormapPickerProps {
	selected: string,
	setSelected: React.Dispatch<React.SetStateAction<string>>,
}
export function ColormapPicker({
	selected,
	setSelected,
}: ColormapPickerProps) {
	return (
		<div className="colormap-picker">
			<label htmlFor="colormap-select">Colormap:</label>
			<select
				id="colormap-select"
				value={selected}
				onChange={(e) => {
					setSelected((e.target as HTMLSelectElement).value as ColormapOption);
				}}>
				{COLORMAP_OPTIONS.map((name) => (
					<option
						key={name}
						value={name}>
						{name}
					</option>
				))}
			</select>
		</div>
	);
}