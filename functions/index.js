// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');
admin.initializeApp();

const storage = require('@google-cloud/storage');
const os = require('os');
const path = require('path');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegInstaller);
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
    return;
  }
  else if (!contentType.startsWith('video/')) {
    console.log('Not a video, will not process');
    return;
  }
  else if (path.basename(filePath).startsWith('compressed-')){
    console.log("File had been compressed before");
    return;
  }
  else{
    console.log("File exists and not yet compressed");
    console.log(storage);
    console.log("gcs.bucket: " + storage.bucket);
    const destBucket = admin.storage().bucket(object.bucket);
    console.log(destBucket);
    console.log(os.tmpdir());
    console.log(filePath);
    const tempFilePath = path.join(os.tmpdir(), filePath); // Generate full path of uploaded file
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
      var compressedVideoFilePath = path.join(path.dirname(tempFilePath),"compressed-" + path.basename(tempFilePath));
      ffmpeg(tempFilePath).videoBitrate('1000k', true)
                          .on('error', function(err) {
                            console.log('An error occurred: ' + err.message);
                          })
                          .on('end', function() {
                            console.log('Processing finished !');
                          })
                          .save(compressedVideoFilePath);
      console.log("File compressed");
      return destBucket.upload(compressedVideoFilePath, {
        destination: 'compressed-' + path.basename(filePath),
        metadata: metadata
      })
    });
  }
});
