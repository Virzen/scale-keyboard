(function (teoria, Vue) {
	'use strict';

	// TODO: Documentation
	// TODO: Remove console.logs

	// TODO: add attack and release
	const audioModule = (function () {
		const ctx = new AudioContext();

		// Prevent clipping caused by gain > 1
		// To benefit from this, all nodes must be connected to it
		const compressor = ctx.createDynamicsCompressor();
		compressor.connect(ctx.destination);

		const voice = function ({ frequency = 440, type = 'sine', volume = 0.5 }) {
			const gainNode = ctx.createGain();
			let isOn = false;
			let oscillator = {};
			let voice = {};

			gainNode.gain.value = 0;
			gainNode.connect(compressor);

			const start = function (time = 0) {
				if (!isOn) {
					oscillator = ctx.createOscillator();

					oscillator.frequency.value = frequency;
					oscillator.type = type;

					oscillator.connect(gainNode);

					oscillator.start(typeof time === 'number' ? time : 0);
					gainNode.gain.value = volume;

					isOn = true;
				}

				return voice;
			};

			const stop = function (time = 0) {
				if (isOn) {
					oscillator.stop(typeof time === 'number' ? time : 0);
					isOn = false;
				}

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
			voice: voice,
			get ctxTime() {
				return ctx.currentTime;
			}
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

	const sequenceModule = (function () {
		const randomSequence = function (values, steps = 1, base = []) {
			if (typeof steps != 'number' || steps < 0) {
				throw new Error('generateSequence: incorrect number of steps. Was: ' + steps);
			}

			const arr = new Array(steps - base.length).fill('');
			const valsLen = values.length;

			return base.concat(arr.map(() => values[Math.floor(Math.random() * valsLen)]));
		};

		const incrementSequence = function (sequence) {

		};

		// sequenceModule public interface
		return {
			randomSequence: randomSequence
		};
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

				// Combine note name, key code, key and voice object
				// into single object
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

				this.$dispatch('soundsGenerated', sounds);

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
			keyDown: function (event, time = 0) {
				if (event.code === this.sound.keyCode) {
					this.sound.start(time);
				}
			},
			keyUp: function (event, time = 0) {
				if (event.code === this.sound.keyCode) {
					this.sound.stop(time);
				}
			},
			playNote: function (note, duration = 0.5, startTime = 0, interval = 0) {
				console.log('receive playNote');
				if (typeof note !== 'string' || typeof duration !== 'number' || typeof startTime !== 'number') {
					throw new Error(`music-button:playNote: incorrect args given. Were: ${note}, ${duration}, ${startTime}`);
				}

				if (this.sound.note[0].toLowerCase() === note.toLowerCase()) {
					console.log('playNote', this.sound.note);
					const ctxTime = audioModule.ctxTime;
					const ctxStartTime = ctxTime + startTime;
					this.sound.start(ctxStartTime);
					this.sound.stop(ctxStartTime + duration);
				}
			}
		}
	});

	const view = new Vue({
		el: '#app',

		data: {
			settings: settingsModule,
			settingsOn: false,
			sounds: [],
			sequence: []
		},

		computed: {
			currentSteps: function () {
				return this.sequence.length;
			}
		},

		methods: {
			toggleSettings: function () {
				this.settingsOn = !this.settingsOn;
				return this;
			},
			startGame: function () {
				const notes = this.sounds.map(x => x.note[0].toUpperCase());

				this.sequence = sequenceModule.randomSequence(notes, 1, [ 'C' ]);

				this.playSequence(this.sequence);
			},
			restartGame: function () {

			},
			playSequence: function (sequence, duration = 0.65, interval = 0.25) {
				console.log('playSequence');
				sequence.forEach((note, index) => {
					this.$broadcast('playNote', note, duration, (duration + interval) * index, interval);
				});
			}
		},

		events: {
			soundsGenerated: function (sounds) {
				this.sounds = sounds;
			}
		}
	});
}(teoria, Vue));
/* global teoria, Vue */
