export type ColormapOption = "viridis" | "magma" | "gray";

const colormapOptions: Record<ColormapOption, number[][]> = {
	"viridis": VIRIDIS_COLORMAP(), 
	"magma": MAGMA_COLORMAP(),
	"gray": GRAYSCALE_COLORMAP(),
}
export const COLORMAP_OPTIONS = Object.keys(colormapOptions) as ColormapOption[];
export const computeColormap = (option: ColormapOption): number[][] => {return colormapOptions[option];}


function VIRIDIS_COLORMAP() {
	const viridisColors = [
		[68, 1, 84], [72, 35, 116], [64, 67, 135], [52, 94, 141],
		[41, 120, 142], [32, 144, 140], [34, 167, 132], [58, 190, 117],
		[96, 208, 93], [140, 219, 69], [186, 226, 54], [233, 229, 42], [253, 231, 37]
	];
	const colorMap = [];
	for (let i = 0; i < 256; i++) {
		const t = i / 255;
		const idx = Math.floor(t * (viridisColors.length - 1));
		const nextIdx = Math.min(idx + 1, viridisColors.length - 1);
		const mix = (t * (viridisColors.length - 1)) % 1;
		const r = Math.floor((1 - mix) * viridisColors[idx][0] + mix * viridisColors[nextIdx][0]);
		const g = Math.floor((1 - mix) * viridisColors[idx][1] + mix * viridisColors[nextIdx][1]);
		const b = Math.floor((1 - mix) * viridisColors[idx][2] + mix * viridisColors[nextIdx][2]);
		colorMap.push([r/256, g/256, b/256, 1]);
	}
	return colorMap as number[][];
}

function MAGMA_COLORMAP() {
	const magmaColors = [
		[0, 0, 4], [28, 16, 68], [79, 18, 123], [129, 37, 129],
		[181, 54, 122], [229, 80, 100], [251, 135, 97], [254, 194, 135],
		[252, 253, 191]
	];
	const colorMap = [];
	for (let i = 0; i < 256; i++) {
		const t = i / 255;
		const idx = Math.floor(t * (magmaColors.length - 1));
		const nextIdx = Math.min(idx + 1, magmaColors.length - 1);
		const mix = (t * (magmaColors.length - 1)) % 1;
		const r = Math.floor((1 - mix) * magmaColors[idx][0] + mix * magmaColors[nextIdx][0]);
		const g = Math.floor((1 - mix) * magmaColors[idx][1] + mix * magmaColors[nextIdx][1]);
		const b = Math.floor((1 - mix) * magmaColors[idx][2] + mix * magmaColors[nextIdx][2]);
		colorMap.push([r/256, g/256, b/256, 1]);
	}
	return colorMap as number[][];
}

function GRAYSCALE_COLORMAP() {
	const gamma = 0.6;

	const colorMap = [];
	for (let i = 0; i < 256; i++) {
		const t = i / 255;
		const v = Math.pow(t, gamma);
		colorMap.push([v, v, v, 1]);
	}
	return colorMap as number[][];
}