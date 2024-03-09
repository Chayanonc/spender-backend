const express = require("express");
const { spawn } = require("child_process");
const multer = require("multer");
const cors = require("cors");

const app = express();
const port = 8000;
app.use(cors());
app.use(express.json());

const getImgInfo = async (imagePath) => {
  return new Promise((resolve, reject) => {
    const python = spawn("python3", ["ocrusingtesseract.py", imagePath]);
    python.stdout.on("data", function (data) {
      console.log("Pipe data from python script ...");
      resolve(data.toString());
    });
    python.on("close", (code) => {
      console.log(`child process close all stdio with code ${code}`);
    });
  });
};

const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, "./images");
  },
  filename: function (req, file, callback) {
    callback(null, file.originalname);
  },
});

const upload = multer({ storage });

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.post("/upload", upload.single("photo"), (req, res) => {
  res.send(req.file);
});

app.post("/images", upload.array("images"), async (req, res) => {
  console.log(req.files);
  const dateInfo = {};

  for (let i = 0; i < req.files.length; i++) {
    const result = await getImgInfo("./images/" + req.files[i].originalname);
    const [date, time, amount] = result.split("++++++");
    if (!dateInfo[date]) dateInfo[date] = [];
    dateInfo[date].push({ time: time, amount: amount.replace("\n", "") });
  }
  res.send(dateInfo);
});

app.listen(port, () => {
  console.log(`app is listening on port ${port}!`);
});
