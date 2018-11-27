// The fist part is the code done by me to compress video
// but still have a lot of bugs
/*
// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
admin.initializeApp();

const storage = require('@google-cloud/storage');
const os = require('os');
const path = require('path');
const fs = require('fs');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
//ffmpeg.setFfmpegPath(ffmpegInstaller);
//module.exports = ffmpeg;


// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//

exports.fileChange = functions.storage.object().onFinalize(object => {
  console.log("File uploading");
  console.log(object);
  const bucket = object.bucket;
  console.log("Bucket: " + bucket);
  const contentType = object.contentType;
  console.log("ContentType: " + contentType);
  const filePath = object.name;
  console.log("FilePath: " + filePath);
  console.log("File informaiton recorded");

  console.log(path);
  console.log(path.basename(filePath));
  console.log(path.basename(filePath).startsWith('remaned-'));
  console.log(path.basename(filePath).startsWith("remaned-"));


  if (object.resourceState === "not_exists"){
    console.log("Resource does not exists");
    return null;
  }
  else if (!contentType.startsWith('audio/')) {
    console.log('Not a video, will not process');
    return null;
  }
  else if (path.basename(filePath).startsWith('compressed-')){
    console.log("File had been compressed before");
    return null;
  }
  else{
    console.log("File exists and not yet compressed");
    console.log(storage);
    console.log("gcs.bucket: " + storage.bucket);
    const destBucket = admin.storage().bucket(object.bucket);
    console.log(destBucket);
    console.log(os.tmpdir());
    console.log(filePath);
    const tempFilePath = path.join(os.tmpdir(), path.basename(filePath)); // Generate full path of uploaded file
    console.log("TempFilePath: " + tempFilePath);
    const metadata = {contentType: contentType};

    return destBucket.file(filePath).download({
      destination: tempFilePath // Download the file to tempFilePath
    }).then(()=>{
      console.log("Generating temp compressed file path");
      console.log(path.dirname(tempFilePath));
      console.log(path.basename(tempFilePath));
      console.log(path.join(path.dirname(tempFilePath),"compressed-" + path.basename(tempFilePath)));
      console.log("Compressing File");
      //var compressedVideoFilePath = path.join(path.dirname(tempFilePath), "compressed-" + path.basename(tempFilePath));
      var compressedVideoFilePath = path.join("compressed-" + path.basename(tempFilePath));
      console.log("Compressed File Path: " + compressedVideoFilePath);
      const command = ffmpeg(tempFilePath).setFfmpegPath(ffmpegStatic.path)
                                                  .audioChannels(1)
                                                  .audioFrequency(16000)
                                                  .format('flac')
                                                  .on('error', function(err) {
                                                    console.log('An error occurred: ' + err.message);
                                                  })
                                                  .on('end', function() {
                                                    console.log('Processing finished!');
                                                    console.log("File compressed");
                                                    return destBucket.upload(compressedVideoFilePath, {
                                                      destination: 'compressed-' + path.basename(filePath),
                                                      metadata: metadata
                                                    }).then(() => {
                                                      console.log('Output audio uploaded to', targetStorageFilePath);

                                                      // Once the audio has been uploaded delete the local file to free up disk space.
                                                      fs.unlinkSync(tempFilePath);
                                                      fs.unlinkSync(targetTempFilePath);

                                                      console.log('Temporary files removed.', targetTempFilePath);
                                                    });
                                                  })
                                                  .save(compressedVideoFilePath);
    console.log("Function Finnished");
    });
  }
});
*/


/**
 * Copyright 2017 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for t`he specific language governing permissions and
 * limitations under the License.
 */

// Below are the codes from the internet to convert audio file
// But also have some bugs
const functions = require('firebase-functions');
const gcs = require('@google-cloud/storage');
const path = require('path');
const os = require('os');
const fs = require('fs');
const ffmpeg = require('fluent-ffmpeg');
const ffmpeg_static = require('ffmpeg-static');
const admin = require('firebase-admin');
admin.initializeApp();

/**
 * When an audio is uploaded in the Storage bucket We generate a mono channel audio automatically using
 * node-fluent-ffmpeg.
 */


exports.generateMonoAudio = functions.storage.object().onFinalize(object => {
  const fileBucket = object.bucket; // The Storage bucket that contains the file.
  const filePath = object.name; // File path in the bucket.
  const contentType = object.contentType; // File content type.
  const resourceState = object.resourceState; // The resourceState is 'exists' or 'not_exists' (for file/folder deletions).
  const metageneration = object.metageneration; // Number of times metadata has been generated. New objects have a value of 1.

  // Exit if this is triggered on a file that is not an audio.
  if (!contentType.startsWith('video/')) {
    console.log('This is not an audio.');
    return;
  }

  // Get the file name.
  const fileName = path.basename(filePath);
  // Exit if the audio is already converted.
  if (fileName.endsWith('_output.flac')) {
    console.log('Already a converted audio.');
    return;
  }

  // Exit if this is a move or deletion event.
  if (resourceState === 'not_exists') {
    console.log('This is a deletion event.');
    return;
  }

  // Exit if file exists but is not new and is only being triggered
  // because of a metadata change.
  if (resourceState === 'exists' && metageneration > 1) {
    console.log('This is a metadata change event.');
    return;
  }

  // Download file from bucket.
  const bucket = admin.storage().bucket(object.bucket);
  const tempFilePath = path.join(os.tmpdir(), fileName);
  // We add a '_output.flac' suffix to target audio file name. That's where we'll upload the converted audio.
  const targetTempFileName = fileName.replace(/\.[^/.]+$/, "") + '_output.flac';
  const targetTempFilePath = path.join(os.tmpdir(), targetTempFileName);
  const targetStorageFilePath = path.join(path.dirname(filePath), targetTempFileName);

  return bucket.file(filePath).download({
    destination: tempFilePath
  }).then(() => {
    console.log('Audio downloaded locally to', tempFilePath);
    // Convert the audio to mono channel using FFMPEG.
    const command = ffmpeg(tempFilePath)
      .setFfmpegPath(ffmpeg_static.path)
      .videoBitrate(1000)
      //.audioChannels(1)
      //.audioFrequency(16000)
      //.format('flac')
      .on('error', (err) => {
        console.log('An error occurred: ' + err.message);
      })
      .on('end', () => {
        console.log('Output audio created at', targetTempFilePath);

        // Uploading the audio.
        return bucket.upload(targetTempFilePath, {destination: targetStorageFilePath}).then(() => {
          console.log('Output audio uploaded to', targetStorageFilePath);

          // Once the audio has been uploaded delete the local file to free up disk space.
          fs.unlinkSync(tempFilePath);
          fs.unlinkSync(targetTempFilePath);

          console.log('Temporary files removed.', targetTempFilePath);
        });
      })
      .save(targetTempFilePath);
  });
});
