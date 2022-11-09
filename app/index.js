const sharp = require("sharp");
const rembg = require("rembg-node").Rembg;
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const { execSync } = require("child_process");
const AWS = require("aws-sdk");
var fs = require("fs");

exports.handler = async (event, context) => {
  console.log(JSON.stringify(event));

  if (!event.body) {
    return;
  }

  try {
    const S3 = new AWS.S3();
    console.log("Downloading binary");

    // Grab from local S3 bucket
    const lib = await S3.getObject({
      Bucket: process.env.REMBG_BUCKET,
      Key: "u2net.onnx",
    }).promise();

    // Put in U2NET_HOME dir
    fs.mkdirSync(`${U2NET_HOME}`);
    fs.writeFileSync(`${U2NET_HOME}/u2net.onnx`, lib.Body);

    console.log("Removing background");

    const inputImage = sharp(Buffer.from(event.body, "base64"));
    const remover = new rembg();
    const removedBgPath = `/tmp/${uuidv4()}.png`;

    await (await remover.remove(inputImage))
      .resize({ width: 500, height: 500 })
      .toFile(removedBgPath);

    console.log("Getting gif from S3");

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
      "PGFzJs26BscwZybBLI",
      "dtVbhQZHcsYbbCoe1y",
      "kkoRgXbTCPY3K",
      "rXNES6I8A7hEcq2uy1",
      "SKga1r0b9l6ep2khVQ",
      "bXR6c79iS8L4qa8UOx",
      "PbfVmhMI9SvaKcUOsb",
      "oBhERi7jGiCnnYHLGf",
      "NjvLuSaJXKmjz0UDcf",
      "xThuW2fbatiCsyY3zW",
      "3o6Ztb45EYezY9x9gQ",
      "3ohzdZO0nAL1H2LdMA",
      "xUPGcknoZZseQLFvws",
      "SYrMAmJZT4YcU",
      "xULW8GTX7rLWv8iQ4E",
    ];

    const gifId = gifs[Math.floor(Math.random() * gifs.length)];

    const gifRes = await S3.getObject({
      Bucket: process.env.GIF_BUCKET,
      Key: `${gifId}.gif`,
    }).promise();

    // Resize to 500x500 and save file to tmp directory
    const gifPath = `/tmp/${uuidv4()}.gif`;
    await sharp(Buffer.from(gifRes.Body, "base64"), {
      animated: true,
    })
      .resize({ width: 500, height: 500 })
      .toFile(gifPath);

    console.log("Wowifying");

    // Combine gif with result and save file to tmp directory
    const originalSizePath = `/tmp/${uuidv4()}.gif`;
    execSync(
      `/opt/bin/convert ${gifPath} null: ${removedBgPath} -gravity center -layers composite -fuzz 3% -layers optimize ${originalSizePath}`
    );

    const smallSizePath = `/tmp/${uuidv4()}.gif`;
    execSync(
      `/opt/bin/convert ${originalSizePath} -resize 64x64 ${smallSizePath}`
    );

    // Generate original and small size data
    const originalSize = await sharp(originalSizePath, {
      animated: true,
    }).toBuffer();

    const smallSize = await sharp(smallSizePath, { animated: true }).toBuffer();

    console.log("Returning data");

    return {
      cookies: [],
      isBase64Encoded: false,
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        wowifiedOriginal: originalSize.toString("base64"),
        wowifiedSmall: smallSize.toString("base64"),
      }),
    };
  } catch (e) {
    console.log(JSON.stringify(e));

    return {
      cookies: [],
      isBase64Encoded: false,
      statusCode: 400,
      headers: {},
      body: "",
    };
  }
};
