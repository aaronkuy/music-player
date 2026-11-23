'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { tracks, wrapIndex, formatTime, previousTarget, seekTarget } = require('../playlist.js');

const root = path.join(__dirname, '..');

test('wrapIndex stays inside the playlist in both directions', () => {
    assert.equal(wrapIndex(0, 3), 0);
    assert.equal(wrapIndex(2, 3), 2);
    assert.equal(wrapIndex(3, 3), 0);
    assert.equal(wrapIndex(-1, 3), 2);
    assert.equal(wrapIndex(-4, 3), 2);
});

test('formatTime prints minutes and two-digit seconds', () => {
    assert.equal(formatTime(0), '0:00');
    assert.equal(formatTime(9.9), '0:09');
    assert.equal(formatTime(75.4), '1:15');
    assert.equal(formatTime(600), '10:00');
});

test('formatTime shows 0:00 while the duration is unknown', () => {
    assert.equal(formatTime(NaN), '0:00');
    assert.equal(formatTime(Infinity), '0:00');
    assert.equal(formatTime(-1), '0:00');
});

test('previous goes to the track before within the first seconds', () => {
    assert.deepEqual(previousTarget(1, 0, 3), { index: 0, restart: false });
    assert.deepEqual(previousTarget(0, 2.9, 3), { index: 2, restart: false });
});

test('previous restarts the track once it has played for a moment', () => {
    assert.deepEqual(previousTarget(1, 3.1, 3), { index: 1, restart: true });
});

test('seekTarget stays between the start and the end of the track', () => {
    assert.equal(seekTarget(10, 5, 30), 15);
    assert.equal(seekTarget(2, -5, 30), 0);
    assert.equal(seekTarget(28, 5, 30), 30);
    assert.equal(seekTarget(4, 5, NaN), 4);
});

test('every track has a title and files that exist in the repository', () => {
    assert.ok(tracks.length > 0);
    for (const track of tracks) {
        assert.ok(track.title.length > 0);
        assert.ok(track.detail.length > 0);
        assert.ok(fs.existsSync(path.join(root, track.src)), `${track.src} is missing`);
        assert.ok(fs.existsSync(path.join(root, track.cover)), `${track.cover} is missing`);
    }
});
