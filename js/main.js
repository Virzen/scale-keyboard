(function (teoria) {
	'use strict';

	// TODO: Documentation
	// TODO: Remove console.logs

	const audioModule = (function () {
		const ctx = new AudioContext();

		// Prevent clipping caused by gain > 1
		// To benefit from this, all nodes must be connected to it
		const compressor = ctx.createDynamicsCompressor();
		compressor.connect(ctx.destination);

		const voice = function ({ frequency = 440, type = 'sine', volume = 0.5 }) {
			const osc = ctx.createOscillator();
			const gainNode = ctx.createGain();
			let voice = {};

			osc.frequency.value = frequency;
			osc.type = type;
			gainNode.gain.value = 0;

			osc.connect(gainNode);
			gainNode.connect(compressor);

			osc.start();

			const start = function () {
				gainNode.gain.value = volume;
				return voice;
			};

			const stop = function () {
				gainNode.gain.value = 0;
				return voice;
			};

			voice = {
				frequency: frequency,
				start: start,
				stop: stop
			};

			return voice;
		};

		// audioModule public interface
		return {
			voice: voice
		};
	}());

	const settingsModule = (function () {
		const scales = [ 'major', 'minor' ];
		const oscillators = [ 'sine', 'triangle', 'sawtooth', 'square' ];

		const settings = {
			scaleName: scales[0],
			tonic: 'C',
			level: 4,
			oscillatorType: oscillators[0],
			volume: 0.5
		};

		const setScale = function (scale) {
			if (scales.indexOf(scale) !== -1) {
				settings.scaleName = scale;
				return settings;
			}
		};

		// NOTE: tonic lacks proper validation
		const setTonic = function (tonic) {
			if (typeof tonic === 'string') {
				settings.tonic = tonic;
				return settings;
			}
		};

		const setLevel = function (level) {
			if (typeof level === 'number' && level >= 0 && level <= 10) {
				settings.level = level;
				return settings;
			}
		};

		const setOscillatorType = function (type) {
			if (oscillators.indexOf(type) !== -1) {
				settings.oscillatorType = type;
				return settings;
			}
		};

		const setVolume = function (volume) {
			if (volume >= -1 && volume <= 1) {
				settings.volume = volume;
				return settings;
			}
		};

		// settingsModule public interface
		return {
			get settings() {
				return Object.assign({}, settings);
			},
			setScale: setScale,
			setOscillatorType: setOscillatorType,
			setVolume: setVolume,
			setTonic: setTonic,
			setLevel: setLevel
		};
	}());

	const musicModule = (function () {
		const scale = function (tonic, type) {
			try {
				return teoria.note(tonic)
					.scale(type);
			}
			catch (err) {
				console.error(err);
				return null;
			}
		};

		const notesFromScale = function (tonic, type, level) {
			const genericScale = scale(tonic, type).simple();
			console.log(genericScale);

			if (genericScale) {
				const sounds = genericScale.map(s => s + level);
				sounds.push(sounds[0].replace(level, level + 1));

				return sounds;
			}
			else {
				return null;
			}
		};

		const frequency = function (note) {
			try {
				return teoria.note(note).fq();
			}
			catch (err) {
				console.error(err);
				return null;
			}
		};

		// musicModule public interface
		return {
			scale: scale,
			notesFromScale: notesFromScale,
			frequency: frequency
		};
	}());

	const notes = musicModule.notesFromScale(
		settingsModule.settings.tonic,
		settingsModule.settings.scaleName,
		settingsModule.settings.level
	);
	const freqs = notes.map(note => musicModule.frequency(note));
	const voices = freqs.map(freq => {
		return audioModule.voice({
			frequency: freq,
			type: settingsModule.settings.oscillatorType,
			volume: settingsModule.settings.volume
		});
	});

}(teoria));
/* global teoria */
