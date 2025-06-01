require("dotenv").config();
const express = require("express");
const multer = require("multer");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const imgbbUploader = require("imgbb-uploader");

const app = express();
const upload = multer({ dest: "uploads/" });

const GFPGAN_MODEL_VERSION = "928199c5b5d60e7cfcf84b0e0f8e203d6d75b47040d80f6df5c63111c43d1d83";

app.post("/enhance", upload.single("image"), async (req, res) => {
  try {
    const imagePath = req.file.path;

    // Upload image to imgbb first
    const imgbbResponse = await imgbbUploader({
      apiKey: process.env.IMGBB_API_KEY,
      imagePath
    });

    const imageUrl = imgbbResponse.url;

    // Call Replicate GFPGAN API
    const replicateResponse = await axios.post("https://api.replicate.com/v1/predictions", {
      version: GFPGAN_MODEL_VERSION,
      input: { img: imageUrl }
    }, {
      headers: {
        Authorization: `Token ${process.env.REPLICATE_API_KEY}`,
        "Content-Type": "application/json"
      }
    });

    fs.unlinkSync(imagePath); // delete local image

    const predictionUrl = replicateResponse.data.urls.get;

    // Wait for the final output (simplified: return prediction URL)
    res.json({ status_url: predictionUrl });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: "Enhancement failed." });
  }
});

app.get("/", (req, res) => {
  res.send("✅ Remini-style enhancer API (GFPGAN via Replicate) is running.");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT
                                                               
