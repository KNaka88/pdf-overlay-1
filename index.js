/*jshint esversion: 6 */

'use strict';
const aws = require('aws-sdk');
const async= require('async');
const s3 = new aws.S3();
const util = require('util');
const fs = require('fs');
const HummusRecipe = require('hummus-recipe');

exports.handler = (event, context, callback) => {
    //check if s3Files property in json object contains more than input pdf. If so, let's save those files in the system because they'll be used as definitions later
    if (event.s3Files.definitions) {
      //get s3 objects in parallel
      async.each(event.s3Files.definitions, function(i, cb) {
        var previousFile= currentFile;
        var currentFile= i.bucketKey;
        // console.log("hey eachloop: "+ `/tmp/${currentFile}`);
        s3.getObject( {Bucket:i.bucketName, Key:i.bucketKey},function(err, data){
          console.log(currentFile);
          if (err) {
              alert("Failed to retrieve an object: " + error);
              callback();
          }else {
            console.log('currentFile is: '+`/tmp/${currentFile}`);
            fs.writeFile(`/tmp/${currentFile}`, data.Body, (err)=> {
              if (err) throw err;
              console.log(`/tmp/${currentFile}`+' saved!');
            });
            callback(null, data.ContentType);
          }
        });//close s3.getObject
      });//close each iterator
    }//close if statement

     // Let's grab our pdf input and start overlaying.
     const pdf= event.s3Files.pdf;
     const bucket = pdf.bucketName;
     // Object key may have spaces or unicode non-ASCII characters.
     const key = decodeURIComponent(pdf.bucketKey.replace(/\+/g, ' '));
     const params = {
         Bucket: bucket,
         Key: key,
     };
    s3.getObject(params, (err, data) => {
        if (err) {
            console.log(err);
            const message = "Error getting object ${key} from bucket ${bucket}. Make sure they are in same region";
            console.log(message);
            callback(message);
        } else {
            let filename = `${(Date.now()).toString()}.pdf`;
            const tempPdf = `/tmp/temp.pdf`;
            //write s3objectdata to tempPdf file.
            fs.writeFile(tempPdf, data.Body, (err) => {
                if (err) throw err;
                console.log("pdf data.Body now in tempPdf file");
                const newpdf = `/tmp/${filename}`;
                const pdfDoc = new HummusRecipe(tempPdf, newpdf);
                var definitions= event.definitions;
                pdfDoc
                    .editPage(1)
                for (var i = 0; i < definitions.length; i++) {
                  if (definitions[i].type==='text'|| definitions[i].type==='barcode') {
                    pdfDoc
                        .text(definitions[i].value,definitions[i].x,definitions[i].y);
                  } else if (definitions[i].type==='pdf') {
                    // console.log(`/tmp/${definitions[i].value}`);
                    pdfDoc
                        .overlay(`/tmp/${definitions[i].value}`);
                  }else if (definitions[i].type==='image') {
                    // console.log(`/tmp/${definitions[i].value}`);
                    pdfDoc
                          .image(`/tmp/${definitions[i].value}`, definitions[i].x, definitions[i].y,{width: 300, keepAspectRatio: true});
                  }
                }
                pdfDoc
                    .endPage()
                    .endPDF(() => {
                      //Returns true if newpdf file exists
                        console.log(fs.existsSync(newpdf));
                        if (!bucket) {
                            callback(null, { newpdf });
                        } else {
                            //grab newpdf stream and store to s3
                            const fileStream = fs.createReadStream(newpdf);
                            fileStream.on('error', callback);
                            return s3.putObject({
                                    Bucket: bucket,
                                    Key: filename,
                                    Body: fileStream,
                                    ContentType: 'application/pdf'
                                }).promise()
                                .then(() => {
                                    callback(null, { bucket, newpdf });
                                })
                                .catch(callback);
                        }
                    });

            }); //closing fs.writeFile
            callback(null, data.ContentType);
        }//closing else success statement
  });//closing getObject fat arrow
};//ends export handler
