const sharp = require("sharp");
const axios = require("axios");

exports.handler = async (event, context) => {
  console.log(JSON.stringify(event));

  if (!event.body) {
    return;
  }

  try {
    // Request for background removal
    const removebgRes = await axios.post(
      "https://api.remove.bg/v1.0/removebg",
      {
        image_file_b64: event.body,
      },
      {
        responseType: "arraybuffer",
        headers: {
          "X-Api-Key": `${process.env.REMOVE_BG_API_KEY}`,
        },
      }
    );

    // Get GIF by ID from Giphy API
    const gifId = "Ck80ojSw2VQWfwFfnY";
    const giphyRes = await axios.get(
      `https://api.giphy.com/v1/gifs/${gifId}?api_key=${process.env.GIPHY_API_KEY}`
    );

    // Download GIF
    console.log(`Sending request to: ${giphyRes.data.images["original"].url}`);
    const rawGif = await axios.get(giphyRes.data.images["original"].url);

    // Combine gif with result
    const output = await sharp(Buffer.from(rawGif.data, "base64"), {
      animated: true,
    })
      .composite([
        {
          input: Buffer.from(removebgRes.data, "base64"),
          tile: false,
          blend: "source",
        },
      ])
      .toBuffer();

    return {
      cookies: [],
      isBase64Encoded: false,
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        imageData: output,
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
