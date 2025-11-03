function VIRIDIS_COLORMAP() { // colormap option to be used in Wavesurfer spectrograms
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
	return colorMap;
}

//  currently unused stuff, but may be useful when we implement customizable wavesurfer color scheme for verify page