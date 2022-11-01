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
    formData.append("image_file", event.body);

    // Request for background removal
    const res = await axios({
      method: "post",
      url: "https://api.remove.bg/v1.0/removebg",
      data: formData,
      responseType: "arraybuffer",
      headers: {
        ...formData.getHeaders(),
        "X-Api-Key": `${process.env.REMOVE_BG_API_KEY}`,
      },
      encoding: null,
    });

    // Save image locally
    const fileLocation = `/tmp/${uuidv4()}.png`;
    fs.writeFileSync(fileLocation, res.data);

    // Download background gif
    const background = await axios.get(
      "https://media4.giphy.com/media/Ck80ojSw2VQWfwFfnY/giphy.gif"
    );

    // Combine gif with result
    const output = await sharp(background.data, { animated: true })
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
  } catch {
    return {
      cookies: [],
      isBase64Encoded: false,
      statusCode: 400,
      headers: {},
      body: "",
    };
  }
};
