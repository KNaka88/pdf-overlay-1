/*jshint esversion: 6 */
'use strict';
const aws = require('aws-sdk');
const async= require('async');
const s3 = new aws.S3();
const util = require('util');
const fs = require('fs');
const HummusRecipe = require('hummus-recipe');

exports.handler=(event,context,callback)=>{
  //get s3Files from json object. Index zero of s3Files is reserved for pdf that will be overlayed. If there is more than one s3Files, those are files that will be used as definitions later.
  function getFiles(i) {
    //dealing with async s3.getObject method
    return new Promise((resolve,reject)=>{
      s3.getObject({Bucket: i.bucketName, Key: i.bucketKey}, function(err,data){
        if (err) {
            reject(err);
        }else {
          resolve([data.Body, i.bucketKey]);
        }
      });//close s3.getObject
    });//close return new promise
  }//end function getFiles
  var s3Files= event.s3Files;
  const s3FilesData=[];
  for (var i = 0; i < s3Files.length; i++) {
    s3FilesData.push(getFiles(s3Files[i]));
  }
  Promise.all(s3FilesData).then(values => {
    const writtenFiles=[];
    //write s3filesData on files in the system
    function writeFile(val) {
      var dataBody=val[0];
      var previousFileName= currentFileName;
      var currentFileName= val[1];
      console.log('currentFileName: '+currentFileName);
      //dealing with async fs.writeFile method
      return new Promise((success,reject)=>{
        fs.writeFile(`/tmp/${currentFileName}`, dataBody, (err)=> {
          if(err) reject(err);
          else{
            console.log(`/tmp/${currentFileName}`+' saved!');
            success(dataBody);
          }
        });
      });
    }//end function writeFile
    for (var i = 0; i < values.length; i++) {
      writtenFiles.push(writeFile(values[i]));
    }
    Promise.all(writtenFiles).then(data=>{
      //start overlaying process
      console.log("Start overlaying in file: "+ `/tmp/${event.s3Files[0].bucketKey}`);
      let filename=`${(Date.now()).toString()}.pdf`;
      const newPdf = `/tmp/${filename}`;
      const pdfDoc = new HummusRecipe(`/tmp/${event.s3Files[0].bucketKey}`, newPdf);
      var definitions= event.definitions;
      pdfDoc
          .editPage(1)
      for (var i = 0; i < definitions.length; i++) {
        if (definitions[i].type==='text'|| definitions[i].type==='barcode') {
          pdfDoc
              .text(definitions[i].value,definitions[i].x,definitions[i].y);
        } else if (definitions[i].type==='pdf') {
          console.log(`/tmp/${definitions[i].value}`);
          pdfDoc
              .overlay(`/tmp/${definitions[i].value}`,definitions[i].x,definitions[i].y);
        }else if (definitions[i].type==='image') {
          console.log(`/tmp/${definitions[i].value}`);
          pdfDoc
                .image(`/tmp/${definitions[i].value}`, definitions[i].x, definitions[i].y,{width: 300, keepAspectRatio: true});
        }
      }
      pdfDoc
            .endPage()
            .endPDF()
      //Returns true if newpdf file exists
      console.log(fs.existsSync(newPdf));
      //grab newpdf stream and store to s3
      const fileStream = fs.createReadStream(newPdf);
      fileStream.on('error', callback);
      var params={
        Bucket: event.s3Files[0].bucketName,
        Key: filename,
        Body: fileStream,
        ContentType: 'application/pdf'
      };
      s3.putObject(params, function(err, data){
        if (err) {
          console.log(err);
        }
        else {
          console.log('Saved in same s3 bucket from where it came');
        }
      });
    });//end second then handler
  });//end of then handler
  callback(null, 'the end');
};//end export.handler
