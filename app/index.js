const sharp = require("sharp");
const axios = require("axios");

exports.handler = async (event, context) => {
  console.log(JSON.stringify(event));

  if (!event.body) {
    return;
  }

  try {
    console.log("Sending request to remove.bg");

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

    console.log("Sending request to Giphy");

    // Get GIF by ID from Giphy API
    const gifId = "Ck80ojSw2VQWfwFfnY";
    const giphyRes = await axios.get(
      `https://api.giphy.com/v1/gifs/${gifId}?api_key=${process.env.GIPHY_API_KEY}`
    );

    console.log("Downloading raw gif");

    // Download GIF
    const rawGif = await axios.get(giphyRes.data.data.images.original.url);

    console.log("Combining");

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

    console.log("Returning");

    return {
      cookies: [],
      isBase64Encoded: true,
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        imageData: output.toString("base64"),
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
