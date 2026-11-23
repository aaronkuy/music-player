#!/usr/bin/env node
// Generates the three audio loops of the playlist from nothing but math.
//
//   node tools/make-loops.mjs            writes WAV files to tools/out/
//   node tools/make-loops.mjs --encode   also encodes them to assets/audio/*.m4a
//
// No samples and no recordings are used: every sound is a sum of sine waves or
// seeded noise, so the output is the same on every run. Encoding needs ffmpeg
// on the PATH (or its location in the FFMPEG environment variable).
//
// The generated audio is released under CC0 1.0.

import { mkdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SAMPLE_RATE = 44100;
const TAU = Math.PI * 2;

const midiToHz = (note) => 440 * 2 ** ((note - 69) / 12);
const samples = (seconds) => Math.round(seconds * SAMPLE_RATE);

// Small seeded random generator (mulberry32) so noise is reproducible.
function createRandom(seed) {
    let state = seed >>> 0;
    return () => {
        state = (state + 0x6d2b79f5) >>> 0;
        let t = state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// ---------------------------------------------------------------- voices
// Every voice returns one mono Float32Array.

// Linear attack and release around a flat sustain.
function envelope(length, attack, release) {
    const env = new Float32Array(length).fill(1);
    const a = Math.min(samples(attack), length);
    const r = Math.min(samples(release), length);
    for (let i = 0; i < a; i++) env[i] = i / a;
    for (let i = 0; i < r; i++) env[length - 1 - i] *= i / r;
    return env;
}

function lowpass(buffer, cutoffHz) {
    const k = 1 - Math.exp((-TAU * cutoffHz) / SAMPLE_RATE);
    let y = 0;
    for (let i = 0; i < buffer.length; i++) {
        y += k * (buffer[i] - y);
        buffer[i] = y;
    }
    return buffer;
}

function highpass(buffer, cutoffHz) {
    const low = lowpass(Float32Array.from(buffer), cutoffHz);
    for (let i = 0; i < buffer.length; i++) buffer[i] -= low[i];
    return buffer;
}

// Soft pad: a few harmonics, played twice slightly out of tune.
function pad(note, seconds, { attack = 1.2, release = 1.8, cutoff = 1400 } = {}) {
    const length = samples(seconds);
    const out = new Float32Array(length);
    const partials = [1, 0.5, 0.28, 0.16, 0.08];
    for (const cents of [-5, 5]) {
        const hz = midiToHz(note) * 2 ** (cents / 1200);
        partials.forEach((amp, index) => {
            const step = (TAU * hz * (index + 1)) / SAMPLE_RATE;
            for (let i = 0; i < length; i++) out[i] += amp * Math.sin(step * i);
        });
    }
    lowpass(out, cutoff);
    const env = envelope(length, attack, release);
    for (let i = 0; i < length; i++) out[i] *= env[i] * 0.25;
    return out;
}

// Plucked string: higher harmonics die away faster than the fundamental.
function pluck(note, seconds = 1.6) {
    const length = samples(seconds);
    const out = new Float32Array(length);
    const hz = midiToHz(note);
    for (let k = 1; k <= 6; k++) {
        const step = (TAU * hz * k) / SAMPLE_RATE;
        const decay = 2.2 + 1.6 * k;
        for (let i = 0; i < length; i++) {
            out[i] += (Math.sin(step * i) / k) * Math.exp((-decay * i) / SAMPLE_RATE);
        }
    }
    const env = envelope(length, 0.004, 0.05);
    for (let i = 0; i < length; i++) out[i] *= env[i] * 0.5;
    return out;
}

// Two-operator FM. A non-integer ratio gives a bell, ratio 1 an electric piano.
function fm(note, seconds, { ratio, depth, depthDecay, decay }) {
    const length = samples(seconds);
    const out = new Float32Array(length);
    const carrier = (TAU * midiToHz(note)) / SAMPLE_RATE;
    const modulator = carrier * ratio;
    for (let i = 0; i < length; i++) {
        const t = i / SAMPLE_RATE;
        const index = depth * Math.exp(-depthDecay * t);
        out[i] = Math.sin(carrier * i + index * Math.sin(modulator * i)) * Math.exp(-decay * t);
    }
    const env = envelope(length, 0.005, 0.08);
    for (let i = 0; i < length; i++) out[i] *= env[i] * 0.5;
    return out;
}

const bell = (note, seconds = 3.5) => fm(note, seconds, { ratio: 3.5, depth: 2.2, depthDecay: 3.5, decay: 1.6 });
const electricPiano = (note, seconds = 1.8) => fm(note, seconds, { ratio: 1, depth: 1.3, depthDecay: 7, decay: 2.4 });

function bass(note, seconds) {
    const length = samples(seconds);
    const out = new Float32Array(length);
    const step = (TAU * midiToHz(note)) / SAMPLE_RATE;
    const env = envelope(length, 0.012, 0.09);
    for (let i = 0; i < length; i++) {
        const body = Math.sin(step * i) + 0.35 * Math.sin(2 * step * i) + 0.12 * Math.sin(3 * step * i);
        out[i] = body * env[i] * Math.exp((-1.2 * i) / SAMPLE_RATE) * 0.6;
    }
    return out;
}

// Kick drum: a sine that drops from about 135 Hz to 45 Hz.
function kick() {
    const length = samples(0.38);
    const out = new Float32Array(length);
    let phase = 0;
    for (let i = 0; i < length; i++) {
        const t = i / SAMPLE_RATE;
        phase += (TAU * (45 + 90 * Math.exp(-28 * t))) / SAMPLE_RATE;
        out[i] = Math.sin(phase) * Math.exp(-7.5 * t);
    }
    const env = envelope(length, 0.002, 0.04);
    for (let i = 0; i < length; i++) out[i] *= env[i];
    return out;
}

function noiseBurst(random, seconds, decay, highpassHz, lowpassHz) {
    const length = samples(seconds);
    const out = new Float32Array(length);
    for (let i = 0; i < length; i++) out[i] = (random() * 2 - 1) * Math.exp((-decay * i) / SAMPLE_RATE);
    highpass(out, highpassHz);
    if (lowpassHz) lowpass(out, lowpassHz);
    return out;
}

const hat = (random) => noiseBurst(random, 0.09, 70, 6000);

// Soft snare: filtered noise with a short tone underneath.
function snare(random) {
    const out = noiseBurst(random, 0.22, 24, 900, 5000);
    const step = (TAU * 185) / SAMPLE_RATE;
    for (let i = 0; i < out.length; i++) out[i] += 0.5 * Math.sin(step * i) * Math.exp((-32 * i) / SAMPLE_RATE);
    return out;
}

// ------------------------------------------------------------------- mix

class Mix {
    constructor(seconds) {
        this.length = samples(seconds);
        this.left = new Float32Array(this.length);
        this.right = new Float32Array(this.length);
    }

    // pan: -1 is left, 0 is the middle, 1 is right (equal power).
    add(startSeconds, voice, gain = 1, pan = 0) {
        const start = samples(startSeconds);
        const angle = ((pan + 1) * Math.PI) / 4;
        const gainLeft = gain * Math.cos(angle);
        const gainRight = gain * Math.sin(angle);
        const end = Math.min(voice.length, this.length - start);
        for (let i = 0; i < end; i++) {
            this.left[start + i] += voice[i] * gainLeft;
            this.right[start + i] += voice[i] * gainRight;
        }
    }

    mixIn(other, gain = 1) {
        for (let i = 0; i < this.length; i++) {
            this.left[i] += other.left[i] * gain;
            this.right[i] += other.right[i] * gain;
        }
    }
}

// Schroeder reverb: six damped comb filters and two all-pass filters per side.
function reverbChannel(input, offset, feedback, damping) {
    const out = new Float32Array(input.length);
    for (const delay of [1557, 1617, 1491, 1422, 1277, 1356]) {
        const line = new Float32Array(delay + offset);
        let position = 0;
        let filtered = 0;
        for (let i = 0; i < input.length; i++) {
            const delayed = line[position];
            filtered = delayed * (1 - damping) + filtered * damping;
            line[position] = input[i] + filtered * feedback;
            position = (position + 1) % line.length;
            out[i] += delayed;
        }
    }
    for (const delay of [225, 556]) {
        const line = new Float32Array(delay + offset);
        let position = 0;
        for (let i = 0; i < out.length; i++) {
            const delayed = line[position];
            const value = out[i];
            line[position] = value + delayed * 0.5;
            position = (position + 1) % line.length;
            out[i] = delayed - value * 0.5;
        }
    }
    return out;
}

function addReverb(mix, { wet = 0.2, feedback = 0.84, damping = 0.3 } = {}) {
    const left = reverbChannel(mix.left, 0, feedback, damping);
    const right = reverbChannel(mix.right, 23, feedback, damping);
    for (let i = 0; i < mix.length; i++) {
        mix.left[i] += left[i] * wet * 0.15;
        mix.right[i] += right[i] * wet * 0.15;
    }
}

// Short fade in, longer fade out, then the same loudness for every track.
function master(mix, { fadeOut = 2.5, warmth = 0 } = {}) {
    if (warmth) {
        lowpass(mix.left, warmth);
        lowpass(mix.right, warmth);
    }
    const fadeInLength = samples(0.03);
    const fadeOutLength = samples(fadeOut);
    let sum = 0;
    for (let i = 0; i < mix.length; i++) {
        let gain = 1;
        if (i < fadeInLength) gain = i / fadeInLength;
        const fromEnd = mix.length - 1 - i;
        if (fromEnd < fadeOutLength) gain *= (fromEnd / fadeOutLength) ** 2;
        mix.left[i] *= gain;
        mix.right[i] *= gain;
        sum += mix.left[i] ** 2 + mix.right[i] ** 2;
    }
    // Aim for -19 dBFS RMS. Peaks above the knee are bent towards the ceiling
    // (about -1.5 dBFS) instead of being cut off.
    const gain = 0.112 / Math.sqrt(sum / (2 * mix.length));
    const knee = 0.5;
    const ceiling = 0.84;
    const limit = (value) => {
        const size = Math.abs(value);
        if (size <= knee) return value;
        return Math.sign(value) * (knee + (ceiling - knee) * Math.tanh((size - knee) / (ceiling - knee)));
    };
    for (let i = 0; i < mix.length; i++) {
        mix.left[i] = limit(mix.left[i] * gain);
        mix.right[i] = limit(mix.right[i] * gain);
    }
    return mix;
}

// ---------------------------------------------------------------- tracks

// 80 BPM, C major. A pad, a plucked arpeggio and a bell melody.
function paperLanterns() {
    const beat = 60 / 80;
    const bar = 4 * beat;
    const eighth = beat / 2;
    const mix = new Mix(8 * bar + 5.5);
    const chords = [
        [48, 55, 64, 71], // Cmaj7
        [45, 52, 60, 67], // Am7
        [41, 53, 57, 64], // Fmaj7
        [43, 55, 59, 62], // G
    ];
    const arpeggio = [0, 2, 1, 3, 2, 3, 1, 2];
    const melody = [
        [[0, 76, 3], [3, 79, 1], [4, 81, 4], [10, 79, 2], [12, 76, 4]],
        [[0, 72, 3], [3, 74, 1], [4, 76, 4], [10, 74, 2], [12, 69, 4]],
        [[0, 72, 3], [3, 76, 1], [4, 81, 4], [10, 79, 2], [12, 76, 4]],
        [[0, 74, 3], [3, 79, 1], [4, 83, 3], [8, 81, 2], [10, 79, 2], [12, 74, 4]],
    ];
    chords.forEach((chord, index) => {
        const start = index * 2 * bar;
        chord.forEach((note, voice) => mix.add(start, pad(note, 2 * bar + 1.2), 0.5, (voice - 1.5) * 0.3));
        for (let step = 0; step < 16; step++) {
            const note = chord[arpeggio[step % 8]] + 12;
            const accent = step % 4 === 0 ? 0.42 : 0.3;
            mix.add(start + step * eighth, pluck(note), accent, step % 2 ? 0.35 : -0.35);
        }
        for (const [step, note, length] of melody[index]) {
            mix.add(start + step * eighth, bell(note, length * eighth + 2), 0.28, 0.1);
        }
    });
    const end = 8 * bar;
    chords[0].forEach((note, voice) => mix.add(end, pad(note, 5, { attack: 0.3, release: 3.5 }), 0.5, (voice - 1.5) * 0.3));
    mix.add(end, pluck(60, 3), 0.42, -0.2);
    mix.add(end + eighth, pluck(67, 3), 0.34, 0.2);
    mix.add(end + 2 * eighth, bell(84, 4.5), 0.2, 0);
    addReverb(mix, { wet: 0.28 });
    return master(mix, { fadeOut: 3 });
}

// 86 BPM, a two-five-one in C with swung drums, bass and electric piano.
function nightTram() {
    const beat = 60 / 86;
    const bar = 4 * beat;
    const swing = 0.6; // position of the off-beat eighth inside a beat
    const bars = 10;
    const random = createRandom(86);
    const drums = new Mix(bars * bar + 3.5);
    const keys = new Mix(bars * bar + 3.5);
    const chords = [
        { root: 38, notes: [53, 57, 60, 64] }, // Dm9
        { root: 43, notes: [53, 59, 64, 69] }, // G13
        { root: 36, notes: [52, 55, 59, 62] }, // Cmaj9
        { root: 33, notes: [55, 60, 64, 67] }, // Am7
    ];
    // [bar in the four-bar phrase, beat, note, length in beats]
    const melody = [
        [0, 0, 76, 0.6], [0, swing, 74, 1], [0, 1 + swing, 72, 2],
        [1, 1, 71, 0.6], [1, 1 + swing, 74, 0.6], [1, 2, 76, 2],
        [2, 0, 79, 1], [2, 1 + swing, 76, 0.6], [2, 2, 74, 0.6], [2, 2 + swing, 71, 1.5],
        [3, 1, 72, 0.6], [3, 1 + swing, 69, 0.6], [3, 2 + swing, 67, 1.5],
    ];
    for (let b = 0; b < bars; b++) {
        const start = b * bar;
        const chord = chords[b % 4];
        const at = (beats) => start + beats * beat;

        if (b >= 1) {
            drums.add(at(0), kick(), 0.55);
            drums.add(at(1 + swing), kick(), 0.3);
            drums.add(at(2), kick(), 0.48);
            if (b % 2) drums.add(at(3 + swing), kick(), 0.32);
            drums.add(at(1), snare(random), 0.34, 0.05);
            drums.add(at(3), snare(random), 0.38, 0.05);
        }
        for (let n = 0; n < 4; n++) {
            drums.add(at(n), hat(random), b >= 1 ? 0.3 : 0.18, 0.3);
            drums.add(at(n + swing), hat(random), b >= 1 ? 0.17 : 0.1, 0.3);
        }

        keys.add(at(0), bass(chord.root, 1.4 * beat), 0.4);
        keys.add(at(1 + swing), bass(chord.root, 0.5 * beat), 0.3);
        keys.add(at(2 + swing), bass(chord.root + 12, 0.4 * beat), 0.3);
        keys.add(at(3), bass(chord.root + 7, 0.8 * beat), 0.32);

        chord.notes.forEach((note, voice) => {
            const pan = (voice - 1.5) * 0.25;
            keys.add(at(0), electricPiano(note, 1.7 * beat), 0.4, pan);
            keys.add(at(1 + swing), electricPiano(note, 0.7 * beat), 0.28, pan);
            keys.add(at(3 + swing), electricPiano(note, 0.9 * beat), 0.24, pan);
        });

        if (b >= 2) {
            for (const [phraseBar, beats, note, length] of melody) {
                if (phraseBar === b % 4) keys.add(at(beats), electricPiano(note + 12, length * beat + 0.6), 0.4, -0.15);
            }
        }
    }
    const end = bars * bar;
    keys.add(end, bass(38, 2.5), 0.4);
    chords[0].notes.forEach((note, voice) => keys.add(end, electricPiano(note, 3.2), 0.42, (voice - 1.5) * 0.25));
    keys.add(end, electricPiano(88, 3.2), 0.26, -0.15);
    drums.add(end, kick(), 0.45);

    addReverb(keys, { wet: 0.22, feedback: 0.8 });
    addReverb(drums, { wet: 0.06, feedback: 0.7 });
    keys.mixIn(drums);
    return master(keys, { fadeOut: 2.5, warmth: 7500 });
}

// No beat: slow pads in D major, bells, and filtered noise that swells like surf.
function lowTide() {
    const chordLength = 7.5;
    const mix = new Mix(4 * chordLength + 4.5);
    const random = createRandom(2026);
    const chords = [
        [38, 45, 54, 57, 64], // Dadd9
        [35, 47, 54, 57, 62], // Bm7
        [43, 50, 54, 59, 62], // Gmaj7
        [45, 52, 57, 62, 64], // Asus4
    ];
    const voiceGain = [0.25, 0.35, 0.55, 0.6, 0.6]; // keep the low notes quiet
    chords.forEach((chord, index) => {
        chord.forEach((note, voice) => {
            const voiceStart = index * chordLength + voice * 0.12;
            mix.add(voiceStart, pad(note, chordLength + 2.5, { attack: 2.2, release: 3, cutoff: 1800 }), voiceGain[voice], (voice - 2) * 0.28);
        });
    });
    chords[0].forEach((note, voice) => {
        mix.add(4 * chordLength, pad(note, 4.5, { attack: 1.5, release: 2.8, cutoff: 1800 }), voiceGain[voice], (voice - 2) * 0.28);
    });

    const scale = [74, 76, 78, 81, 83, 86, 88, 90]; // D major pentatonic
    let time = 1.5;
    let last = 3;
    while (time < 4 * chordLength) {
        // Move at most two scale steps so the bells form a line instead of jumping.
        last = Math.max(0, Math.min(scale.length - 1, last + Math.floor(random() * 5) - 2));
        mix.add(time, bell(scale[last], 4), 0.24 + random() * 0.12, random() * 1.2 - 0.6);
        time += 1.1 + random() * 1.5;
    }

    const surf = new Float32Array(mix.length);
    for (let i = 0; i < surf.length; i++) surf[i] = random() * 2 - 1;
    lowpass(surf, 1600);
    highpass(surf, 400);
    for (let i = 0; i < surf.length; i++) {
        const swell = 0.5 - 0.5 * Math.cos((TAU * i) / SAMPLE_RATE / chordLength);
        surf[i] *= swell ** 2;
    }
    mix.add(0, surf, 0.2, -0.2);
    mix.add(0.9, surf, 0.15, 0.3);

    addReverb(mix, { wet: 0.4, feedback: 0.88, damping: 0.4 });
    return master(mix, { fadeOut: 4 });
}

// ---------------------------------------------------------------- output

function writeWav(path, mix) {
    const dataBytes = mix.length * 4;
    const buffer = Buffer.alloc(44 + dataBytes);
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + dataBytes, 4);
    buffer.write('WAVEfmt ', 8);
    buffer.writeUInt32LE(16, 16); // size of the format chunk
    buffer.writeUInt16LE(1, 20); // PCM
    buffer.writeUInt16LE(2, 22); // channels
    buffer.writeUInt32LE(SAMPLE_RATE, 24);
    buffer.writeUInt32LE(SAMPLE_RATE * 4, 28); // bytes per second
    buffer.writeUInt16LE(4, 32); // bytes per frame
    buffer.writeUInt16LE(16, 34); // bits per sample
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataBytes, 40);
    const toInt16 = (value) => Math.round(Math.max(-1, Math.min(1, value)) * 32767);
    for (let i = 0; i < mix.length; i++) {
        buffer.writeInt16LE(toInt16(mix.left[i]), 44 + i * 4);
        buffer.writeInt16LE(toInt16(mix.right[i]), 46 + i * 4);
    }
    writeFileSync(path, buffer);
}

const loops = [
    { file: 'paper-lanterns', title: 'Paper Lanterns', render: paperLanterns },
    { file: 'night-tram', title: 'Night Tram', render: nightTram },
    { file: 'low-tide', title: 'Low Tide', render: lowTide },
];

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const wavDirectory = join(root, 'tools', 'out');
const audioDirectory = join(root, 'assets', 'audio');
const encode = process.argv.includes('--encode');
const ffmpeg = process.env.FFMPEG || 'ffmpeg';

mkdirSync(wavDirectory, { recursive: true });
for (const loop of loops) {
    const mix = loop.render();
    const wavPath = join(wavDirectory, `${loop.file}.wav`);
    writeWav(wavPath, mix);
    console.log(`${loop.file}.wav  ${(mix.length / SAMPLE_RATE).toFixed(1)} s`);
    if (!encode) continue;

    mkdirSync(audioDirectory, { recursive: true });
    const result = spawnSync(ffmpeg, [
        '-y', '-loglevel', 'error', '-i', wavPath,
        '-map_metadata', '-1', '-bitexact',
        '-metadata', `title=${loop.title}`,
        '-metadata', 'comment=Generated by tools/make-loops.mjs. CC0 1.0.',
        '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart',
        join(audioDirectory, `${loop.file}.m4a`),
    ], { stdio: 'inherit' });
    if (result.error || result.status !== 0) {
        console.error(`Encoding failed. Is ffmpeg installed? (${result.error?.message ?? `exit code ${result.status}`})`);
        process.exit(1);
    }
    console.log(`${loop.file}.m4a`);
}
