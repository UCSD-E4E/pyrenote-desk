import React, { useState } from "react";
import styles from "./Slider.module.css"

interface SliderProps {
	displayLabel: string;
	value: number;
	setValue: React.Dispatch<React.SetStateAction<number>>;
	min: number;
	max: number;
	displayValueFunc?: ((val: number) => string);
	onChange?: (val: number) => void;
}

export function Slider({ 
	displayLabel, 
	value,
	setValue,
	min,
	max, 
	displayValueFunc = (val: number) => "" + val, 
	onChange = (val: number) => {},
}: SliderProps) {
	return (
		<>
			<p className={styles.label}>
				{displayLabel}: {displayValueFunc(value)}
			</p>
			<input
				type="range"
				id="slider"
				min={min}
				max={max}
				value={value}
				onChange={(e) => {
					setValue(Number(e.target.value));
					onChange(Number(e.target.value));
				}}
				onClick={(e) => {e.stopPropagation()}}
			/>
		</>
	);
}