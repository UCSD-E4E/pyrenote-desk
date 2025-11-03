export async function decodeAudio(audioData: ArrayBuffer): Promise<AudioBuffer> {
	try {
		const audioContext = new AudioContext();
		const audioBuffer = await audioContext.decodeAudioData(audioData);
		
		return audioBuffer;
	} catch (error) {
		throw new Error(`Failed to decode audio from URL: ${error}`);
	}
}

export function cropAudio(
	audioBuffer: AudioBuffer,
	beginOffset: number,
	endOffset: number,
	filePath
): AudioBuffer {
	try {
		// Validate offsets
		if (beginOffset < 0 || endOffset > audioBuffer.duration) {
			console.error('Offsets out of bounds, clamping to valid range');
			beginOffset = Math.max(0, beginOffset);
			endOffset = Math.min(audioBuffer.duration, endOffset);
		}
		
		if (beginOffset >= endOffset) {
			console.error('Begin offset must be less than end offset');
			endOffset = beginOffset + 0.1; // Ensure at least 0.1s duration
		}
		
		// Calculate sample positions
		const sampleRate = audioBuffer.sampleRate;
		const startSample = Math.floor(beginOffset * sampleRate);
		const endSample = Math.floor(endOffset * sampleRate);
		const newLength = endSample - startSample;
		
		// Create new audio buffer with cropped duration
		const audioContext = new AudioContext();
		const croppedBuffer = audioContext.createBuffer(
			audioBuffer.numberOfChannels,
			newLength,
			sampleRate
		);
		
		// Copy the cropped data for each channel
		for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
			const sourceData = audioBuffer.getChannelData(channel);
			const targetData = croppedBuffer.getChannelData(channel);
			
			for (let i = 0; i < newLength; i++) {
				targetData[i] = sourceData[startSample + i];
			}
		}
		return croppedBuffer;
	} catch (error) {
		console.error(filePath, audioBuffer.length, beginOffset, endOffset, error);
	}

}

export function audioBufferToWavBlob(audioBuffer: AudioBuffer): Blob {
	const numberOfChannels = audioBuffer.numberOfChannels;
	const sampleRate = audioBuffer.sampleRate;
	const format = 1; // PCM
	const bitDepth = 16;
	
	const bytesPerSample = bitDepth / 8;
	const blockAlign = numberOfChannels * bytesPerSample;
	
	const data = new Float32Array(audioBuffer.length * numberOfChannels);
	for (let channel = 0; channel < numberOfChannels; channel++) {
		const channelData = audioBuffer.getChannelData(channel);
		for (let i = 0; i < audioBuffer.length; i++) {
			data[i * numberOfChannels + channel] = channelData[i];
		}
	}
	
	const dataLength = data.length * bytesPerSample;
	const buffer = new ArrayBuffer(44 + dataLength);
	const view = new DataView(buffer);
	
	// Write WAV header
	writeString(view, 0, 'RIFF');
	view.setUint32(4, 36 + dataLength, true);
	writeString(view, 8, 'WAVE');
	writeString(view, 12, 'fmt ');
	view.setUint32(16, 16, true); // fmt chunk size
	view.setUint16(20, format, true);
	view.setUint16(22, numberOfChannels, true);
	view.setUint32(24, sampleRate, true);
	view.setUint32(28, sampleRate * blockAlign, true);
	view.setUint16(32, blockAlign, true);
	view.setUint16(34, bitDepth, true);
	writeString(view, 36, 'data');
	view.setUint32(40, dataLength, true);
	
	// Write audio data
	const offset = 44;
	for (let i = 0; i < data.length; i++) {
		const sample = Math.max(-1, Math.min(1, data[i]));
		view.setInt16(offset + i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
	}
	
	return new Blob([buffer], { type: 'audio/wav' });
}


function writeString(view: DataView, offset: number, string: string): void {
	for (let i = 0; i < string.length; i++) {
		view.setUint8(offset + i, string.charCodeAt(i));
	}
}
