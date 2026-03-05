import Tesseract from "tesseract.js";

Tesseract.recognize(
  'https://tesseract.projectnaptha.com/img/eng_bw.png',
  'eng',
  { logger: m => console.log(m) }
).then(({ data: { text } }) => {
  console.log("OCR Result:", text);
}).catch(console.error);
