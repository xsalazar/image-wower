const sharp = require("sharp");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const { execSync } = require("child_process");

exports.handler = async (event, context) => {
  console.log(JSON.stringify(event));

  if (!event.body) {
    return;
  }

  try {
    console.log("Sending request to remove.bg");

    // Send request for background removal
    const removebgRes = await axios.post(
      "https://api.remove.bg/v1.0/removebg",
      {
        image_file_b64: event.body,
        size: "preview",
        type: "person",
      },
      {
        responseType: "arraybuffer",
        headers: {
          "X-Api-Key": `${process.env.REMOVE_BG_API_KEY}`,
        },
      }
    );

    // Resize result to 500x500 and save to tmp directory
    const removedBgPath = `/tmp/${uuidv4()}.png`;
    await sharp(removebgRes.data)
      .resize({ width: 500, height: 500 })
      .toFile(removedBgPath);

    console.log("Sending request to Giphy");

    // Get random GIF by ID from Giphy API
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
      "lYgsRPkt16EL5U2fvR",
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
      "1zTDdo3kyGatcQOwdp",
      "xThuW2fbatiCsyY3zW",
      "3o72EX4oivTC08qOHu",
      "3o6Ztb45EYezY9x9gQ",
      "3ohzdZO0nAL1H2LdMA",
      "xUPGcknoZZseQLFvws",
      "SYrMAmJZT4YcU",
      "xULW8GTX7rLWv8iQ4E",
    ];

    const gifId = gifs[Math.floor(Math.random() * gifs.length)];
    const giphyRes = await axios.get(
      `https://api.giphy.com/v1/gifs/${gifId}?api_key=${process.env.GIPHY_API_KEY}`
    );

    console.log("Downloading gif");

    // Download GIF
    const rawGif = await axios.get(giphyRes.data.data.images.original.url, {
      responseType: "arraybuffer",
    });

    // Resize to 500x500 and save file to tmp directory
    const gifPath = `/tmp/${uuidv4()}.gif`;
    await sharp(rawGif.data, {
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
