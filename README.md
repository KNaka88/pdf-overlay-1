# PDF-Overlay

## Description
The program takes a pdf input file (from S3) and overlays it with contents (and its coordinates) like "image" and "text". The new pdf output is saved in the same s3 bucket from where the original pdf came from.

## Lambda Settings

### Function Code

- Clone repository
- zip file repository from terminal: zip -r ../index.zip *
- Create Function in Lambda console, using the following settings:
- Upload .Zip file in Lambda console: Code entry type
- Runtime: `Node.js 6.10`
- Handler: `index.handler`
- Timeout: 10 sec
- Configure test event: with event structure given bellow

### Basic Settings

Set the memory to `1536 MB`(XD) AND increase the timeout to `10 sec`.

### Execution Role

To use S3, you will need to create a execution role with the correct permission.

### Triggers and Data
The trigger event will be a JSON object. Is important to notice that the first index of s3Files key should only be for the original pdf that will used for overlaying. The other s3Files, in this case, are files that will be used as "image" type definitions later.

Event structure:
{
  "s3Files": [
    {
      "bucketName": "democracy-live",
      "bucketKey": "test.pdf"
    },
    {
      "bucketName": "democracy-live",
      "bucketKey": "mark.jpg"
    },
    {
      "bucketName": "democracy-live",
      "bucketKey": "image.png"
    }
  ],
  "definitions": [
    {
      "value": "1230 NW 12th ave",
      "type": "text",
      "x": 10,
      "y": 20
    },
    {
      "value": "Portland,OR 97209",
      "type": "text",
      "x": 10,
      "y": 35
    },
    {
      "value": "001",
      "type": "barcode",
      "x": 550,
      "y": 20
    },
    {
      "value": "mark.jpg",
      "type": "image",
      "x": 200,
      "y": 50
    },
    {
      "value": "image.png",
      "type": "image",
      "x": 200,
      "y": 300
    }
  ]
}
