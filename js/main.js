(function (teoria) {
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
			oscillatorType: oscillators[0],
			volume: 0.5
		};

		const setScale = function (scale) {
			if (scales.indexOf(scale) !== -1) {
				settings.scaleName = scale;
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

		return {
			get settings() {
				return Object.create(settings);
			},
			setScale: setScale,
			setOscillatorType: setOscillatorType,
			setVolume: setVolume
		};
	}());

	const musicNotationModule = (function () {
		const scale = function (tonic, type) {
			try {
				return teoria.note(tonic)
					.scale(type);
			}
			catch (err) {
				return null;
			}
		};

		const notesFromScale = function (tonic, type, level) {
			const genericScale = scale(tonic, type);

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
				return null;
			}
		};

		return {
			scale: scale,
			notesFromScale: notesFromScale,
			frequency: frequency
		};
	}());

	const notes = teoria.note('c')
		.scale('major')
		.simple()
		.map(s => s + '3');
	notes.push(notes[0].replace('3', '4'));
	const freqs = notes.map(note => teoria.note(note).fq());
	const voices = freqs.map(freq => audioModule.voice({ frequency: freq }));

	voices.forEach(voice => {
		const button = document.createElement('button');
		button.textContent = Math.round(voice.frequency * 100, 2) / 100;

		button.addEventListener('mousedown', voice.start, false);
		button.addEventListener('mouseup', voice.stop, false);

		document.body.appendChild(button);
	});

}(teoria));
/* global teoria */
