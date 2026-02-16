export type ColormapOption = "viridis" | "magma" | "plasma" | "inferno" | "cividis" | "gray";

const colormapOptions: Record<ColormapOption, number[][]> = {
	"viridis": VIRIDIS_COLORMAP(), 
	"magma": MAGMA_COLORMAP(),
	"plasma": PLASMA_COLORMAP(),
	"inferno": INFERNO_COLORMAP(),
	"cividis": CIVIDIS_COLORMAP(),
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

function PLASMA_COLORMAP() {
	const plasmaColors = [
		[13, 8, 135], [75, 3, 161], [125, 3, 168], [168, 34, 150],
		[203, 70, 121], [229, 107, 93], [248, 148, 65], [253, 195, 40],
		[240, 249, 33]
	];
	const colorMap = [];
	for (let i = 0; i < 256; i++) {
		const t = i / 255;
		const idx = Math.floor(t * (plasmaColors.length - 1));
		const nextIdx = Math.min(idx + 1, plasmaColors.length - 1);
		const mix = (t * (plasmaColors.length - 1)) % 1;
		const r = Math.floor((1 - mix) * plasmaColors[idx][0] + mix * plasmaColors[nextIdx][0]);
		const g = Math.floor((1 - mix) * plasmaColors[idx][1] + mix * plasmaColors[nextIdx][1]);
		const b = Math.floor((1 - mix) * plasmaColors[idx][2] + mix * plasmaColors[nextIdx][2]);
		colorMap.push([r/256, g/256, b/256, 1]);
	}
	return colorMap as number[][];
}

function INFERNO_COLORMAP() {
	const infernoColors = [
		[0, 0, 4], [31, 12, 72], [85, 15, 109], [136, 34, 106],
		[186, 54, 85], [227, 89, 51], [249, 140, 10], [249, 201, 50],
		[252, 255, 164]
	];
	const colorMap = [];
	for (let i = 0; i < 256; i++) {
		const t = i / 255;
		const idx = Math.floor(t * (infernoColors.length - 1));
		const nextIdx = Math.min(idx + 1, infernoColors.length - 1);
		const mix = (t * (infernoColors.length - 1)) % 1;
		const r = Math.floor((1 - mix) * infernoColors[idx][0] + mix * infernoColors[nextIdx][0]);
		const g = Math.floor((1 - mix) * infernoColors[idx][1] + mix * infernoColors[nextIdx][1]);
		const b = Math.floor((1 - mix) * infernoColors[idx][2] + mix * infernoColors[nextIdx][2]);
		colorMap.push([r/256, g/256, b/256, 1]);
	}
	return colorMap as number[][];
}

function CIVIDIS_COLORMAP() {
	const cividisColors = [
		[0, 32, 76], [0, 42, 102], [0, 55, 122], [32, 67, 133],
		[54, 79, 139], [76, 91, 142], [98, 103, 143], [122, 116, 142],
		[145, 129, 138], [167, 142, 131], [189, 156, 121], [210, 171, 109],
		[229, 188, 94], [245, 206, 77], [253, 227, 56]
	];
	const colorMap = [];
	for (let i = 0; i < 256; i++) {
		const t = i / 255;
		const idx = Math.floor(t * (cividisColors.length - 1));
		const nextIdx = Math.min(idx + 1, cividisColors.length - 1);
		const mix = (t * (cividisColors.length - 1)) % 1;
		const r = Math.floor((1 - mix) * cividisColors[idx][0] + mix * cividisColors[nextIdx][0]);
		const g = Math.floor((1 - mix) * cividisColors[idx][1] + mix * cividisColors[nextIdx][1]);
		const b = Math.floor((1 - mix) * cividisColors[idx][2] + mix * cividisColors[nextIdx][2]);
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