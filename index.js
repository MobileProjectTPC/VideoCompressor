// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
admin.initializeApp();

// Require FFmpeg module
var FfmpegCommand = require('fluent-ffmpeg');

var command = FfmpegCommand();
