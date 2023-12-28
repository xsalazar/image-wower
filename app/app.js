const fs = require("fs");
const { execSync } = require("child_process");
const { v4: uuidv4 } = require("uuid");
const sharp = require("sharp");
const AWS = require("aws-sdk");

exports.handler = async (event, context) => {
  console.log(JSON.stringify(event));

  // Check S3 for result, return it, if found
  if (
    event.queryStringParameters &&
    event.queryStringParameters.wowToken &&
    event.requestContext.http.method === "GET"
  ) {
    const token = event.queryStringParameters.wowToken;
    const s3 = new AWS.S3();

    try {
      // Check if data has finished processing
      await s3.headObject({ Bucket: "image-wower-data", Key: token }).promise();

      // If call above doesn't fail, get data
      const data = await s3
        .getObject({ Bucket: "image-wower-data", Key: token })
        .promise();

      // Delete object after retrieval
      await s3
        .deleteObject({ Bucket: "image-wower-data", Key: token })
        .promise();

      await s3
        .deleteObject({
          Bucket: "image-wower-data",
          Key: `${token}-input`,
        })
        .promise();

      return {
        cookies: [],
        isBase64Encoded: false,
        statusCode: 200,
        headers: { "content-type": "application/json" },
        body: data.Body.toString(),
      };
    } catch (e) {
      console.log(JSON.stringify(e));

      return {
        cookies: [],
        isBase64Encoded: false,
        statusCode: 404, // Processing
        headers: {},
        body: "",
      };
    }
  }

  // Check if this was triggered by SQS
  else if (event.Records && event.Records.length > 0) {
    const s3 = new AWS.S3();

    // Process each record, and save data to S3
    for (let i = 0; i < event.Records.length; i++) {
      const record = event.Records[i];

      const { body, receiptHandle } = record;

      var parsedBody = JSON.parse(body);
      console.log(`Processing message: ${parsedBody.token}`);

      // Load data from S3
      const data = await s3
        .getObject({ Bucket: "image-wower-data", Key: `${token}-input` })
        .promise();

      // Load model if it doesn't exist on this instance
      if (!fs.existsSync(`/tmp/libs/u2net`)) {
        console.log("Copying rembg library to /tmp directory");
        execSync(
          `mkdir -p /tmp/libs/u2net && cp ./libs/u2net/u2net_human_seg.onnx /tmp/libs/u2net/u2net_human_seg.onnx`
        );
      }

      console.log("Removing background");
      const inputPath = `/tmp/${uuidv4()}.png`;
      const removedBgImagePath = `/tmp/${uuidv4()}.png`;

      // Load file, normalize size, and save
      await sharp(data.Body)
        .rotate()
        .resize({
          width: 500,
          height: 500,
        })
        .png()
        .toFile(inputPath);

      // Remove background
      execSync(
        `rembg i --model u2net_human_seg ${inputPath} ${removedBgImagePath}`
      );

      console.log("Getting random gif");

      var gifId;
      if (parsedBody.requestedBackground !== "") {
        console.log(`Requested background: ${parsedBody.requestedBackground}`);
        gifId = parsedBody.requestedBackground;
      } else {
        // Get random GIF ID
        const gifs = fs
          .readdirSync(`./libs/gifs/`) // Load gifs
          .filter((path) => path.includes("-500.webp")) // Grab one of the copies
          .map((path) => path.split("-")[0]) // Get keys from file path
          .sort(); // Sort them

        gifId = gifs[Math.floor(Math.random() * gifs.length)];
      }

      const largeGifPath = `./libs/gifs/${gifId}-500.webp`;

      console.log("Wowifying");

      // Overlay 500-px image on top of gif
      const wowifiedOriginalSizePath = `/tmp/${uuidv4()}.webp`;
      await sharp(largeGifPath, {
        animated: true,
      })
        .composite([
          {
            input: removedBgImagePath,
            tile: true,
            top: 0,
            left: 0,
          },
        ])
        .webp()
        .toFile(wowifiedOriginalSizePath);

      // Resize 500-px to 64-px version
      const wowifiedSmallSizePath = `/tmp/${uuidv4()}.webp`;
      await sharp(wowifiedOriginalSizePath, { animated: true })
        .resize({ width: 64, height: 64 })
        .webp({ effort: 6 })
        .toFile(wowifiedSmallSizePath);

      // Generate original and small size data
      const originalSize = (
        await sharp(wowifiedOriginalSizePath, {
          animated: true,
        }).toBuffer()
      ).toString("base64");

      const smallSize = (
        await sharp(wowifiedSmallSizePath, {
          animated: true,
        }).toBuffer()
      ).toString("base64");

      console.log("Cleaning up");
      fs.unlinkSync(inputPath);
      fs.unlinkSync(removedBgImagePath);
      fs.unlinkSync(wowifiedOriginalSizePath);
      fs.unlinkSync(wowifiedSmallSizePath);

      console.log("Saving data to S3");

      await s3
        .putObject({
          Bucket: "image-wower-data",
          Key: token,
          ContentType: "application/json",
          Body: JSON.stringify({
            wowifiedOriginal: originalSize,
            wowifiedSmall: smallSize,
          }),
        })
        .promise();

      console.log(`Deleting message: ${token}`);
      const sqs = new AWS.SQS();
      await sqs
        .deleteMessage({
          QueueUrl:
            "https://sqs.us-west-2.amazonaws.com/368081326042/wow-emoji-queue",
          ReceiptHandle: receiptHandle,
        })
        .promise();
    }
  }

  // Otherwise, check for image data to submit to SQS and return token to poll with
  else if (event.body && event.requestContext.http.method === "PUT") {
    const sqs = new AWS.SQS();
    const s3 = new AWS.S3();
    const token = uuidv4();
    var requestedBackground = "";

    if (
      event.queryStringParameters &&
      event.queryStringParameters.backgroundId
    ) {
      requestedBackground = event.queryStringParameters.backgroundId;
    }

    try {
      // Send message to SQS with content to be processed and token
      console.log(`Adding message to queue: ${token}`);

      // Add original data to S3
      await s3
        .putObject({
          Bucket: "image-wower-data",
          Key: `${token}-input`,
          Body: Buffer.from(event.body, "base64"),
          ContentType: event.headers["content-type"],
        })
        .promise();

      // Put message on queue for processing
      await sqs
        .sendMessage({
          MessageBody: JSON.stringify({
            token: token,
            requestedBackground: requestedBackground,
          }),
          QueueUrl:
            "https://sqs.us-west-2.amazonaws.com/368081326042/wow-emoji-queue",
        })
        .promise();

      return {
        cookies: [],
        isBase64Encoded: false,
        statusCode: 202,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: token }),
      };
    } catch (e) {
      console.log(JSON.stringify(e));

      return {
        cookies: [],
        isBase64Encoded: false,
        statusCode: 500,
        headers: {},
        body: "",
      };
    }
  }

  // Check if we're requesting thumbnails
  else if (
    event.queryStringParameters &&
    event.queryStringParameters.thumbnails &&
    event.requestContext.http.method === "GET"
  ) {
    try {
      const ret = { thumbnails: {} };

      // Grab all the large, 500-px gif paths
      const gifs = fs
        .readdirSync(`./libs/gifs/`)
        .filter((path) => path.includes("-500.webp"))
        .sort();

      // Iterate over each item, fetch the gif, and save thumbnail to output
      for (var i = 0; i < gifs.length; i++) {
        const gifPath = `./libs/gifs/${gifs[i]}`;
        const gifName = gifs[i].split("-")[0];
        const frame = (
          await sharp(gifPath, { pages: 1 })
            .resize({ width: 64, height: 64 })
            .png()
            .toBuffer()
        ).toString("base64");
        ret.thumbnails[gifName] = frame;
      }

      return {
        cookies: [],
        isBase64Encoded: false,
        statusCode: 200,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(ret),
      };
    } catch (e) {
      console.log(JSON.stringify(e));

      return {
        cookies: [],
        isBase64Encoded: false,
        statusCode: 500,
        headers: {},
        body: "",
      };
    }
  }
};
