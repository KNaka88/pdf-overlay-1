# PDF-Overlay

## Lambda Settings

### Function Code

- Code entry type: `Upload a .ZIP file`
- Runtime: `Node.js 6.10`
- Handler: `index.handler`

### Basic Settings

Set the memory to `1536 MB`(XD). Also remember to increase the timeout to `5 min`.

### Execution Role

To use S3, you will need to create a execution role with the correct permission.

### Triggers and Data

Test event sample:
{
  "s3Files": {
    "pdf": {
      "bucketName": "democracy-live",
      "bucketKey": "test.pdf",
      "bucketArn": "arn:aws:s3:::democracy-live"
    },
    "definitions": [
      {
        "bucketName": "democracy-live",
        "bucketKey": "mark.jpg"
      },
      {
        "bucketName": "democracy-live",
        "bucketKey": "test2.pdf"
      }
    ]
  },
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
      "y": 400
    },
    {
      "value": "test2.pdf",
      "type": "pdf",
      "x": 200,
      "y": 300
    }
  ]
}
