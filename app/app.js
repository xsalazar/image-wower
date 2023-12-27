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

      const { body: token, receiptHandle } = record;

      console.log(`Processing message: ${token}`);

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

      // Get random GIF ID
      const gifs = [
        "Ck80ojSw2VQWfwFfnY",
        "cS8Dk5NywlGLvaIV0r",
        "iGkCVENBbn6230aiPp",
        "sBRGYMFHTdGqorjlyO",
        "tLVuQirOR5NB4qix5P",
        "T8QbiYtxoglu6BpA3s",
        "aaupIDpb0zN3ME96ll",
        "YvwleWJv6NRLDC52K6",
        "3rDiaWkdR76tdKXIDd",
        "CokjjWNnFJ3fZ0YN02",
        "dBMW2ykthSv7ix64Ou",
        "26vUyWzmjBIlNJvRC",
        "h7dhRBp5YXZqQ0mr3f",
        "koyjGfQHIZQKk",
        "kkoRgXbTCPY3K",
        "rXNES6I8A7hEcq2uy1",
        "SKga1r0b9l6ep2khVQ",
        "bXR6c79iS8L4qa8UOx",
        "PbfVmhMI9SvaKcUOsb",
        "NjvLuSaJXKmjz0UDcf",
        "xThuW2fbatiCsyY3zW",
        "3o6Ztb45EYezY9x9gQ",
        "3ohzdZO0nAL1H2LdMA",
        "xUPGcknoZZseQLFvws",
        "SYrMAmJZT4YcU",
        "3ohzdOFQWcCZA8dRT2",
        "l0MYMranKNhMUFveE",
        "l378oRMuApI3a35Cg",
        "3o7TKVA3gcjiKcFuV2",
        "3oEduJXGwLsIe1RRPG",
        "3og0IGjLXRttYbbtcc",
        "n8k3O3KWXbPrPfsm7s",
        "evlvEhB86RQidkiVBO",
        "3oFzmiu86mdcjOsjOU",
        "2bXyklhc7qQv0dTVXr",
        "26xBs1E58r3ZHYvgQ",
        "isqxY03RuhGxNbCPzY",
        "3o7aD56B2QS5MyTGfe",
        "MasbBp1KusW3JkdSXP",
        "uBaCEhYJ1nW3mehKKr",
        "NsQWLvDrT6LYd1jBGK",
        "l378wcSfS7eXWQgla",
        "l0CLUrZiblFUBMMrC",
        "3otO6NFBIAFg2vPZuM",
        "2uI6DhDIWY9iBT2sB8",
        "3og0IQ29pE7zRwbh60",
        "dJPYnoer6wo4HQw1jI",
        "9V1F9JA4O8cCl1m42m",
        "1AjFHhwg84p8IHF179",
        "xUOxf8yMjHNCkojUE8",
        "3oxHQGVPrFKfHJjdde",
        "xT9IgKNauJJOCbT07m",
        "xT9Igg1Kq1xmy7123m",
        "3oKIP7rZqEbTWA2n60",
      ];

      const gifId = gifs[Math.floor(Math.random() * gifs.length)];
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
          MessageBody: token,
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
