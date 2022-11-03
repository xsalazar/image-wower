const sharp = require("sharp");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");

exports.handler = async (event, context) => {
  console.log(JSON.stringify(event));

  if (!event.body) {
    return;
  }

  try {
    // console.log("Sending request to remove.bg");

    // Send request for background removal
    // const removebgRes = await axios.post(
    //   "https://api.remove.bg/v1.0/removebg",
    //   {
    //     image_file_b64: event.body,
    //     size: "preview",
    //     type: "person",
    //   },
    //   {
    //     responseType: "arraybuffer",
    //     headers: {
    //       "X-Api-Key": `${process.env.REMOVE_BG_API_KEY}`,
    //     },
    //   }
    // );

    // Resize to 500x500 and save to tmp
    const removedBgPath = `/tmp/${uuidv4()}.png`;
    await sharp(Buffer.from(event.body, "base64"))
      .resize({ width: 500, height: 500 })
      .toFile(removedBgPath);

    console.log("Sending request to Giphy");

    // Get GIF by ID from Giphy API
    const gifId = "Ck80ojSw2VQWfwFfnY";
    const giphyRes = await axios.get(
      `https://api.giphy.com/v1/gifs/${gifId}?api_key=${process.env.GIPHY_API_KEY}`
    );

    console.log("Downloading raw gif");

    // Download GIF
    const rawGif = await axios.get(giphyRes.data.data.images.original.url, {
      responseType: "arraybuffer",
    });

    // Resize to 500x500 and save file
    const gifPath = `/tmp/${uuidv4()}.gif`;
    await sharp(rawGif.data, {
      animated: true,
    })
      .resize({ width: 500, height: 500 })
      .toFile(gifPath);

    console.log("Combining");

    // Combine gif with result
    const compositePath = `/tmp/${uuidv4()}.gif`;
    await sharp(gifPath, {
      animated: true,
    })
      .composite([
        {
          input: removedBgPath,
          tile: false,
          top: 0,
          left: 0,
        },
      ])
      .toFile(compositePath);

    const fullSize = await sharp(compositePath, { animated: true }).toBuffer();
    const smallSize = await sharp(compositePath, { animated: true })
      .resize({ width: 64, height: 64 })
      .toBuffer();

    console.log("Returning data");

    return {
      cookies: [],
      isBase64Encoded: true,
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        wowifiedFull: fullSize.toString("base64"),
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
