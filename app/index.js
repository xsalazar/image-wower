const sharp = require("sharp");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");

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

    // Get GIF by ID from Giphy API
    const gifs = [
      "Ck80ojSw2VQWfwFfnY",
      "cS8Dk5NywlGLvaIV0r",
      "iGkCVENBbn6230aiPp",
      "sBRGYMFHTdGqorjlyO",
      "tLVuQirOR5NB4qix5P",
      "T8QbiYtxoglu6BpA3s",
      "aaupIDpb0zN3ME96ll",
      "g9ScOoUhWABOOu2pZ3",
      "YvwleWJv6NRLDC52K6",
      "3rDiaWkdR76tdKXIDd",
      "zw9QEsVqdCgHehelNO",
      "CokjjWNnFJ3fZ0YN02",
      "PGFzJs26BscwZybBLI",
      "dtVbhQZHcsYbbCoe1y",
      "F7010euR3WZBhwYsbM",
      "kfs62t4onP5xx8hPYi",
      "P3Eq0szC9nBXdFPsmq",
      "dBMW2ykthSv7ix64Ou",
      "26vUyWzmjBIlNJvRC",
      "h7dhRBp5YXZqQ0mr3f",
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
    const compositePath = `/tmp/${uuidv4()}.gif`;
    await sharp(gifPath, {
      animated: true,
    })
      .composite([
        {
          input: removedBgPath,
          tile: true,
          top: 0,
          left: 0,
        },
      ])
      .toFile(compositePath);

    // Generate original and small size data
    const originalSize = await sharp(compositePath, {
      animated: true,
    }).toBuffer();
    const smallSize = await sharp(compositePath, { animated: true })
      .resize({ width: 64, height: 64 })
      .toBuffer();

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
