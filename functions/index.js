// The Cloud Functions for Firebase SDK to create Cloud Functions and setup triggers.
const functions = require('firebase-functions');

// The Firebase Admin SDK to access the Firebase Realtime Database.
const admin = require('firebase-admin');

const storage = require('@google-cloud/storage');
const os = require('os');
const path = require('path');

admin.initializeApp();

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

  if (object.resourceState === "not_exists"){
    console.log("Resource does not exists");
    return;
  }
  else if (path.basename(filePath).startsWith('renamed-')){
    return;
  }
  else{
    console.log("File exists and not yet renamed");
    console.log(storage);
    console.log("gcs.bucket: " + storage.bucket);
    console.log("Test");
    const destBucket = admin.storage().bucket(object.bucket);
    console.log("Destbucket: " + destBucket);
    const tempFilePath = path.join(os.tempdir.toISOString(), filePath.toISOString()); // Generate full path of uploaded file
    console.log("TempFilePath" + tempFilePath);
    const metadata = {contentType: contentType};

    return destBucket.file(filePath).download({
      destination: tempFilePath // Download the file to destFilePath
    }).then(()=>{
      return deskBucket.upload(tempFilePath, {
        destination: 'remamed-' + path.basename(filePath),
        metadata: metadata
      })
    });
  }
});
