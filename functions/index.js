// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');

const gcs = require('@google-cloud/storage');
const os = require('os');
const path = require('path');

admin.initializeApp();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
exports.fileChange = functions.storage.object().onFinalize(event => {
  console.log(event);
  console.log("File uploaded");
  const object = event.data;
  const bucket = object.bucket;
  const contentType = object.contentType;
  const filePath = object.name;

  if (path.basename(filePath).startWith('renamed-')){
    return;
  }

  const destBucket = gcs.bucket(bucket);
  const tempFilePath = path.join(os.tempdir, filename); // Generate full path of uploaded file
  const metadata = {contentType: contentType};

  return destBucket.file(filePath).download({
    destination: tempFilePath // Download the file to destFilePath
  }).then(()=>{
    return deskBucket.upload(tempFilePath, {
      destination: 'remamed-' + path.basename(filePath),
      metadata: metadata
    })
  });
});
