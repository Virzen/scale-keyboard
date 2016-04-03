(function () {
	'use strict';

	const audioModule = (function () {
		const ctx = new AudioContext();

		const oscillator = function ({ frequency = 440, type = 'sine' }) {
			const osc = ctx.createOscillator();
			const gainNode = ctx.createGain();

			osc.frequency.value = frequency;
			osc.type = type;
			osc.start();
			gainNode.gain.value = 0;

			osc.connect(gainNode);
			gainNode.connect(ctx.destination);

			const start = function () {
				gainNode.gain.value = 1;
			};

			const stop = function () {
				gainNode.gain.value = 0;
			};

			return {
				start: start,
				stop: stop
			};
		};

		return {
			oscillator: oscillator
		};
	}());

}());
