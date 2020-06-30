const config = require('./config.js');
const fs = require('fs');
const H = require('./helper.js');

function copyGoogleServiceJSON(){
  var source = config.app_dir +"/google-services.json";
  var destination = config.android.app_dir +"/app/google-services.json";
  if(fs.existsSync(destination)){
    H.log("Android: google-services.json file already exists.");
  }else{
    if(fs.existsSync(source)){
      fs.copyFileSync(source, destination);
      H.log("Android: google-services.json file copied.");
    }else{
      H.log("Android: google-services.json file doesn't exists.");
    }
  }
}

function addFirebaseDependencies(){
  var source = config.android.app_dir +"/app/build.gradle";
  if(fs.existsSync(source)){
    var lineNumber = H.getLineNumber(source, "dependencies {");
    if(lineNumber != -1){
      if(H.getLineNumber(source, "com.google.firebase:firebase-messaging:20.1.7") == -1){
        H.setLine(source, lineNumber + 1, "    implementation 'com.google.firebase:firebase-messaging:20.1.7'");
        H.log("Android: Firebase dependency added.");
      }else{
        H.log("Android: Firebase dependency exists.");
      }
    }else{
      H.log("Android: dependencies { not found in build.gradle file.");
    }

    if(H.getLineNumber(source, "com.google.gms.google-services") == -1){
      let lines = H.getLines(source);
      H.setLine(source, lines.length, "apply plugin: 'com.google.gms.google-services'");
      H.log("Android: com.google.gms.google-services applied.");
    }else{
      H.log("Android: com.google.gms.google-services already applied.");
    }
  }else{
    H.log("Android: build.gradle file not found.");
  }
}

function addClassPath(){
  var source = config.android.app_dir +"/build.gradle";
  if(fs.existsSync(source)){
    if(H.getLineNumber(source, "com.google.gms:google-services") == -1){
      let lineNumber = H.getLineNumber(source, "dependencies {");
      if(lineNumber != -1){
        H.setLine(source, lineNumber + 1, "        classpath 'com.google.gms:google-services:3.2.0'");
        H.log("Android: com.google.gms:google-services classpath added.");
      }else{
        H.log("Android: dependencies { not found in build.gradle file.");
      }
    }else{
      H.log("Android: com.google.gms:google-services classpath already exists.");
    }
  }else{
    H.log("Android: build.gradle file not found.");
  }
}

// Run all the files here.
copyGoogleServiceJSON();
addFirebaseDependencies();
addClassPath();