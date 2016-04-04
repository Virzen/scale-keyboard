(function (teoria, Vue) {
	'use strict';

	// TODO: Documentation
	// TODO: Remove console.logs

	const audioModule = (function () {
		const ctx = new AudioContext();

		// Prevent clipping caused by gain > 1
		// To benefit from this, all nodes must be connected to it
		const compressor = ctx.createDynamicsCompressor();
		compressor.connect(ctx.destination);

		// TODO: add attack and release
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

	const musicModule = (function () {
		const scale = function (tonic, type) {
			try {
				return teoria.note(tonic)
					.scale(type)
					.simple();
			}
			catch (err) {
				console.error(err);
				return null;
			}
		};

		const notesFromScale = function (tonic, type, octave) {
			const genericScale = scale(tonic, type);
			octave = Number.parseInt(octave);

			if (genericScale) {
				const sounds = genericScale.map(s => s + octave);
				sounds.push(sounds[0].replace(octave, octave + 1));

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

	const settingsModule = (function () {
		const oscillators = [ 'sine', 'triangle', 'sawtooth', 'square' ];
		const scales = [ 'major', 'minor', 'mixolydian', 'aeolian', 'ionian', 'dorian', 'lydian' ];
		const tonics = [ 'C' ];

		const settings = {
			volume: 0.5,
			oscillatorType: oscillators[0],
			tonic: tonics[0],
			scaleName: scales[0],
			octave: 4,
			valid: {
				get volumes() {
					return {
						min: 0,
						max: 1,
						step: 0.01
					};
				},
				get oscillators() {
					return [...oscillators];
				},
				get tonics() {
					return [...tonics];
				},
				get scales() {
					return [...scales];
				},
				get octaves() {
					return {
						min: 0,
						max: 9,
						step: 1
					};
				}
			}
		};

		// settingsModule public interface
		return settings;
	}());



	Vue.component('settings-panel', {
		template: '#settings-panel-template',

		props: [ 'settings' ]
	});

	Vue.component('keyboard', {
		ready: function () {
			window.addEventListener('keydown', this.keyDown, false);
			window.addEventListener('keyup', this.keyUp, false);
		},

		destroy: function () {
			window.removeEventListener('keydown', this.keyDown, false);
			window.removeEventListener('keyup', this.keyUp, false);
		},

		props: [ 'settings' ],

		data: function () {
			return {
				keys: [ 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l' ]
			};
		},

		computed: {
			keyCodes: function () {
				return this.keys.map(s => 'Key' + s.toUpperCase());
			},
			sounds: function () {
				const notes = musicModule.notesFromScale(
					this.settings.tonic,
					this.settings.scaleName,
					this.settings.octave
				);
				const sounds = notes.map((note, index) => {
					const frequency = musicModule.frequency(note);
					const voice = audioModule.voice({
						frequency: frequency,
						type: this.settings.oscillatorType,
						volume: this.settings.volume
					});
					const keyCode = this.keyCodes[index];
					const key = this.keys[index];

					return Object.assign({
						note: note,
						keyCode: keyCode,
						key: key
					}, voice);
				});

				return sounds;
			}
		},

		methods: {
			keyDown: function (event) {
				this.$broadcast('keyDown', event);
			},
			keyUp: function (event) {
				this.$broadcast('keyUp', event);
			}
		}
	});

	Vue.component('music-button', {
		template: '#music-button-template',

		props: [ 'sound' ],

		events: {
			keyDown: function (event) {
				if (event.code === this.sound.keyCode) {
					this.sound.start();
				}
			},
			keyUp: function (event) {
				if (event.code === this.sound.keyCode) {
					this.sound.stop();
				}
			}
		}
	});

	const view = new Vue({
		el: '#app',

		data: {
			settings: settingsModule
		}
	});
}(teoria, Vue));
/* global teoria, Vue */
