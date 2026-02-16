import { useMemo } from "react";
import { COLORMAP_OPTIONS, ColormapOption, computeColormap } from "../../utils/colormaps";

interface ColormapPickerProps {
	selected: string,
	onChange: (e) => void,
}

export function ColormapPicker({
	selected,
	onChange,
}: ColormapPickerProps) {
	const gradients = useMemo(() => {
		const result: Record<string, string> = {};
		
		COLORMAP_OPTIONS.forEach((colormapName) => {
			const colormap = computeColormap(colormapName);
			const sampleRate = 8;
			const stops = [];
			
			for (let i = 0; i < colormap.length; i += sampleRate) {
				const color = colormap[i];
				const percent = (i / (colormap.length - 1)) * 100;
				stops.push(`rgb(${Math.floor(color[0] * 255)}, ${Math.floor(color[1] * 255)}, ${Math.floor(color[2] * 255)}) ${percent}%`);
			}
			
			const lastColor = colormap[colormap.length - 1];
			stops.push(`rgb(${Math.floor(lastColor[0] * 255)}, ${Math.floor(lastColor[1] * 255)}, ${Math.floor(lastColor[2] * 255)}) 100%`);
			
			result[colormapName] = `linear-gradient(to right, ${stops.join(', ')})`;
		});
		
		return result;
	}, []);

	return (
		<div className="colormap-picker" style={{ display: 'flex', alignItems: 'center' }}>
			<select
				id="colormap-select"
				value={selected}
				onChange={onChange}>
				{COLORMAP_OPTIONS.map((name) => (
					<option
						key={name}
						value={name}>
						{name}
					</option>
				))}
			</select>
			
			<div 
				className="colormap-preview"
				style={{
					width: '100px',
					height: '20px',
					marginLeft: '8px',
					border: '1px solid #ccc',
					borderRadius: '2px',
					background: gradients[selected]
				}}
			/>
		</div>
	);
}