(function () {
	'use strict';

	const audioModule = (function () {
		const ctx = new AudioContext();

		// Prevent clipping caused by gain > 1
		// To benefit from this, all nodes must be connected to it
		const compressor = ctx.createDynamicsCompressor();
		compressor.connect(ctx.destination);

		const voice = function ({ frequency = 440, type = 'sine', volume = 0.5 }) {
			const osc = ctx.createOscillator();
			const gainNode = ctx.createGain();

			osc.frequency.value = frequency;
			osc.type = type;
			gainNode.gain.value = 0;

			osc.connect(gainNode);
			gainNode.connect(compressor);

			osc.start();

			const start = function () {
				gainNode.gain.value = volume;
			};

			const stop = function () {
				gainNode.gain.value = 0;
			};

			return {
				frequency: frequency,
				start: start,
				stop: stop
			};
		};

		return {
			voice: voice
		};
	}());

}());
