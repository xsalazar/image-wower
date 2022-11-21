const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const { execSync } = require("child_process");
const { v4: uuidv4 } = require("uuid");
const sharp = require("sharp");

const port = 8400;
const server = express();

const formDataParser = multer();

// Health Check
server.get("/", (req, res) => {
  res.sendStatus(200);
});

// Wowify Endpoint
server.options("/", cors({ origin: "https://wowemoji.dev" }));
server.put(
  "/",
  formDataParser.single("image"),
  cors({ origin: "https://wowemoji.dev" }),
  async (req, res) => {
    if (!req.file) {
      return;
    }

    try {
      console.log("Removing background");

      const inputPath = `/tmp/${uuidv4()}.png`;
      const removedBgImagePath = `/tmp/${uuidv4()}.png`;
      await sharp(req.file.buffer)
        .resize({
          width: 500,
          height: 500,
        })
        .toFile(inputPath);

      execSync(`rembg i ${inputPath} ${removedBgImagePath}`);

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
      const gifPath = `./gifs/${gifId}.gif`;

      console.log("Wowifying");

      // Combine gif with result and save file to tmp directory
      const wowifiedOriginalSizePath = `/tmp/${uuidv4()}.gif`;
      execSync(
        `convert ${gifPath} null: ${removedBgImagePath} -gravity center -layers composite -fuzz 5% -layers optimize ${wowifiedOriginalSizePath}`
      );

      const wowifiedCompressedOriginalSizePath = `/tmp/${uuidv4()}.gif`;
      execSync(
        `gifsicle -O3 --lossy=80 ${wowifiedOriginalSizePath} -o ${wowifiedCompressedOriginalSizePath}`
      );

      const wowifiedSmallSizePath = `/tmp/${uuidv4()}.gif`;
      execSync(
        `convert ${wowifiedCompressedOriginalSizePath} -resize 64x64 -layers optimize ${wowifiedSmallSizePath}`
      );

      const wowifiedCompressedSmallSizePath = `/tmp/${uuidv4()}`;
      execSync(
        `gifsicle -O3 --lossy=80 ${wowifiedSmallSizePath} -o ${wowifiedCompressedSmallSizePath}`
      );

      // Generate original and small size data
      const originalSize = (
        await sharp(wowifiedOriginalSizePath, {
          animated: true,
        }).toBuffer()
      ).toString("base64");

      const smallSize = (
        await sharp(wowifiedCompressedSmallSizePath, {
          animated: true,
        }).toBuffer()
      ).toString("base64");

      console.log("Cleaning up");
      fs.unlinkSync(inputPath);
      fs.unlinkSync(removedBgImagePath);
      fs.unlinkSync(wowifiedOriginalSizePath);
      fs.unlinkSync(wowifiedCompressedOriginalSizePath);
      fs.unlinkSync(wowifiedSmallSizePath);
      fs.unlinkSync(wowifiedCompressedSmallSizePath);

      console.log("Returning data");

      res.setHeader("content-type", "application/json");
      res.end(
        JSON.stringify({
          wowifiedOriginal: originalSize,
          wowifiedSmall: smallSize,
        })
      );
    } catch (e) {
      console.log(e);
      res.sendStatus(500);
    }
  }
);

server.listen(port, () => {
  console.log(`Server is running`);
});
