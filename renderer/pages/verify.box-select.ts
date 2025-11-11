import { useState, useCallback } from "react";

// custom hook to be used in verify page

interface Rect {
	x: number;
	y: number;
	width: number;
	height: number;
}

interface SpectrogramItem {
	id: number;
	containerRef: React.RefObject<HTMLElement>;
}

interface UseBoxSelectionProps {
	containerRef: React.RefObject<HTMLElement>;
	spectrograms: React.MutableRefObject<SpectrogramItem[]>;
	updateSelected: (selectedIds: number[]) => void;
}

export function useBoxSelection({
	containerRef,
	spectrograms,
	updateSelected,
}: UseBoxSelectionProps) {
	const [isSelecting, setIsSelecting] = useState(false);
	const [rectStart, setRectStart] = useState<{ x: number; y: number } | null>(null);
	const [rect, setRect] = useState<Rect | null>(null);

	const containerLeft = containerRef.current?.getBoundingClientRect().left ?? 0;

	const handleMouseDown = useCallback((e: React.MouseEvent, canSelect = true) => {
		const x = e.clientX - containerLeft;
		const y = e.clientY;
		setRectStart({ x, y });
		setRect({ x, y, width: 0, height: 0 });
		setIsSelecting(canSelect);
	}, [containerLeft]);

	const handleMouseMove = useCallback((e: React.MouseEvent) => {
		if (!isSelecting || !rectStart) return;

		console.log("moving mouse")
		const x = e.clientX - containerLeft;
		const y = e.clientY;

		setRect({
			x: Math.min(rectStart.x, x),
			y: Math.min(rectStart.y, y),
			width: Math.abs(x - rectStart.x),
			height: Math.abs(y - rectStart.y),
		});
	}, [isSelecting, rectStart, containerLeft]);

	const handleMouseUp = useCallback(() => {
		if (!rect) return;

		const selection: number[] = [];

		spectrograms.current.forEach((spectrogram) => {
			const el = spectrogram.containerRef.current;
			if (!el) return;

			const box = el.getBoundingClientRect();
			const relative = {
				left: box.left - containerLeft,
				top: box.top,
				right: box.right - containerLeft,
				bottom: box.bottom,
			};

			const overlap =
				rect.x < relative.right &&
				rect.x + rect.width > relative.left &&
				rect.y < relative.bottom &&
				rect.y + rect.height > relative.top;

			if (overlap) selection.push(spectrogram.id);
		});

		updateSelected(selection);
		setIsSelecting(false);
		setRect(null);
		setRectStart(null);
	}, [rect, containerLeft, spectrograms, updateSelected]);

	return {
		isSelecting,
		rect,
		handleMouseDown,
		handleMouseMove,
		handleMouseUp,
	};
}