const sharp = require("sharp");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

exports.handler = async (event, context) => {
  console.log(JSON.stringify(event));

  if (!event.body) {
    return;
  }

  try {
    // Generate request form to remove.bg
    const formData = new FormData();
    formData.append("image_file_b64", event.body);

    // Request for background removal
    let res = await axios.post(
      "https://api.remove.bg/v1.0/removebg",
      formData,
      {
        responseType: "arraybuffer",
        headers: {
          ...formData.getHeaders(),
          "X-Api-Key": `${process.env.REMOVE_BG_API_KEY}`,
        },
      }
    );

    console.log(`remove.bg response: ${JSON.stringify(res)}`);

    // Save image locally
    const fileLocation = `/tmp/${uuidv4()}.png`;
    fs.writeFileSync(fileLocation, res.data);

    // Get GIF by ID from Giphy API
    const gifId = "Ck80ojSw2VQWfwFfnY";
    res = await axios.get(
      `https://api.giphy.com/v1/gifs/${gifId}?api_key=${process.env.GIPHY_API_KEY}`
    );

    // Download GIF
    console.log(`Sending request to: ${res.data.images["original"].url}`);
    res = await axios.get(res.data.images["original"].url);

    // Combine gif with result
    const output = await sharp(res.data, { animated: true })
      .composite([{ input: fileLocation, tile: false, blend: "source" }])
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
