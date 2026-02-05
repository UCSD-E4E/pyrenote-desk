import { useState } from "react";
import { Slider } from "./Slider";

interface LogSliderProps {
	displayLabel: string;
	value: number;
	setValue: React.Dispatch<React.SetStateAction<number>>;
	min: number;
	max: number;
	logBase?: number;
	onChange?: (val: number) => void;
}

export function LogSlider({
	displayLabel,
	value,
	setValue,
	min,
	max,
	logBase = 2,
	onChange = (val: number) => {},
}: LogSliderProps) {
	const logValue = Math.round(Math.log(value) / Math.log(logBase));
	const logMin = Math.round(Math.log(min) / Math.log(logBase));
	const logMax = Math.round(Math.log(max) / Math.log(logBase));
	return (
		<Slider
			displayLabel={displayLabel}
			value={logValue}
			setValue={
				(val) => {
					const num = Number(val);
					setValue(Math.pow(logBase, num))
				}
			}
			min={logMin}
			max={logMax}
			displayValueFunc={
				(val) => {
					const num = Number(val);
					return (
						num >= 0 ? 
						"" + Math.pow(logBase, num) : 
						"1/" + Math.pow(logBase, -num)
					);
				}
			}
			onChange={(val) => onChange(Math.pow(logBase, val))}
		/>
	);
}