import { useState, useCallback, useRef } from "react";

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
	selectionRectRef: React.RefObject<HTMLDivElement>;
}

export function useBoxSelection({
	containerRef,
	spectrograms,
	updateSelected,
	selectionRectRef,
}: UseBoxSelectionProps) {
	const isSelectingRef = useRef(false);
	const rectStartRef = useRef<{ x: number; y: number } | null>(null);
	const currentRectRef = useRef<Rect | null>(null);

	const handleMouseDown = useCallback((e: React.MouseEvent, canSelect = true) => {
		const containerBox = containerRef.current?.getBoundingClientRect();
		if (!containerBox) return;
		const x = e.clientX - containerBox.left;
		const y = e.clientY - containerBox.top;
		rectStartRef.current = { x, y };
		currentRectRef.current = { x, y, width: 0, height: 0 };
		isSelectingRef.current = canSelect;

		if (selectionRectRef.current) {
			const el = selectionRectRef.current;
			el.style.display = canSelect ? "block" : "none";
			el.style.left = `${x}px`;
			el.style.top = `${y}px`;
			el.style.width = `0px`;
			el.style.height = `0px`;
		}
	}, [containerRef, selectionRectRef]);

	const handleMouseMove = useCallback((e: React.MouseEvent) => {
		if (!isSelectingRef.current || !rectStartRef.current) return;

		const containerBox = containerRef.current?.getBoundingClientRect();
		if (!containerBox) return;
		const x = e.clientX - containerBox.left;
		const y = e.clientY - containerBox.top;

		const x0 = rectStartRef.current.x;
		const y0 = rectStartRef.current.y;
		const rect: Rect = {
			x: Math.min(x0, x),
			y: Math.min(y0, y),
			width: Math.abs(x - x0),
			height: Math.abs(y - y0),
		};
		currentRectRef.current = rect;

		if (selectionRectRef.current) {
			const el = selectionRectRef.current;
			el.style.left = `${rect.x}px`;
			el.style.top = `${rect.y}px`;
			el.style.width = `${rect.width}px`;
			el.style.height = `${rect.height}px`;
		}
	}, [containerRef, selectionRectRef]);

	const handleMouseUp = useCallback(() => {
		const rect = currentRectRef.current;
		const containerBox = containerRef.current?.getBoundingClientRect();
		if (!rect || !containerBox) {
			// cleanup only
			if (selectionRectRef.current) selectionRectRef.current.style.display = "none";
			isSelectingRef.current = false;
			rectStartRef.current = null;
			currentRectRef.current = null;
			return;
		}

		const selection: number[] = [];

		spectrograms.current.forEach((spectrogram) => {
			const el = spectrogram.containerRef.current;
			if (!el) return;

			const box = el.getBoundingClientRect();
			const relative = {
				left: box.left - containerBox.left,
				top: box.top - containerBox.top,
				right: box.right - containerBox.left,
				bottom: box.bottom - containerBox.top,
			};

			const overlap =
				rect.x < relative.right &&
				rect.x + rect.width > relative.left &&
				rect.y < relative.bottom &&
				rect.y + rect.height > relative.top;

			if (overlap) selection.push(spectrogram.id);
		});

		updateSelected(selection);
		isSelectingRef.current = false;
		rectStartRef.current = null;
		currentRectRef.current = null;
		if (selectionRectRef.current) selectionRectRef.current.style.display = "none";
	}, [containerRef, spectrograms, updateSelected, selectionRectRef]);

	return {
		handleMouseDown,
		handleMouseMove,
		handleMouseUp,
	};
}