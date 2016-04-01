(function () {
	'use strict';

	//var context = new AudioContext();

	//var osc = context.createOscillator();
	//osc.frequency.value = 220;
	//osc.connect(context.destination);

	const audioModule = (function () {
		const ctx = new AudioContext();

		const getOscillator = function (frequency) {
			const osc = ctx.createOscillator();

			osc.frequency.value = frequency;

			osc.connect(ctx.destination);

			return osc;
		};

		return {
			getOscillator: getOscillator
		};
	}());


	const button = function (spec) {
		const freq = spec.frequency || 440;
		let osc = {};

		const play = function (time) {
			osc = audioModule.getOscillator(freq);
			osc.start(time || 0);
		}

		const stop = function (time) {
			if (osc) {
				osc.stop(time || 0);
			}
		}

		return {
			play: play,
			stop: stop
		};
	};
	
}());
