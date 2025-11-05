import React, { useMemo } from "react";
import styles from "./verify.module.css"; // adjust path

interface Keybind {
	func: () => void;
	label: string;
}

interface KeybindGuideProps {
	keybinds: Record<string, Keybind>;
}

export function KeybindGuide({ keybinds }: KeybindGuideProps) {
	// Group keybinds by label
	const labelToKeys = useMemo(() => {
		const map = new Map<string, string[]>();
		Object.entries(keybinds).forEach(([key, keybind]) => {
			const label = keybind.label;
			if (!map.has(label)) {
				map.set(label, []);
			}
			map.get(label)!.push(key);
		});
		return map;
	}, [keybinds]);

	// Format key display
	const formatKey = (key: string) => {
		switch (key) {
			case " ":
				return "Space";
			case "ArrowUp":
				return "↑";
			case "ArrowDown":
				return "↓";
			case "ArrowLeft":
				return "←";
			case "ArrowRight":
				return "→";
			case "\\":
				return "\\";
			default:
				return key.toUpperCase();
		}
	};

	return (
		<div className={styles.helpTable}>
			<div className={styles.helpTableHeader}>KEYBOARD SHORTCUTS</div>
			<table>
				<thead>
					<tr>
						<th>Keys</th>
						<th>Function</th>
					</tr>
				</thead>
				<tbody>
					{Array.from(labelToKeys.entries()).map(([label, keys]) => (
						<tr key={label}>
							<td>
								{keys.map((key, index) => (
									<span key={index} className={styles.helpKey}>
										{formatKey(key)}
									</span>
								))}
							</td>
							<td>{label}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
