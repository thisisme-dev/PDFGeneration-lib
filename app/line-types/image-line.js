// WARNING: this is a WIP, need to break this so we can handle errors correctly
const sectionTypeLogic = require('./base-logic');
const Jimp = require('jimp');
const constants = require('../constants');

module.exports = {
  generateLineThatIsImage,
};

async function generateLineThatIsImage(doc, x, y, value, incrementY, getDocY) {
  const docY = getDocY(doc, y, incrementY, 1, false);
  doc = docY.doc;
  y = docY.y;
  // value = examplePayload();
  // console.log(value);
  return await populateImage(doc, x, y, incrementY, value);
}

async function populateImage(doc, x, y, incrementY, imageOptions) {
  if (imageOptions['imageType'] && imageOptions['imageType'] === constants.PDFImageType.CENTER) {
    const pdfImage = await generatePDFImage(imageOptions.data);
    const imageWidth = imageOptions.imageRules.width;
    const imageHeight = imageOptions.imageRules.height;
    doc.image(pdfImage, x + (doc.page.width - imageWidth) /2, y, {
      fit: [imageWidth, imageHeight],
    });
    return sectionTypeLogic.docYResponse(doc, y + imageHeight + incrementY);
  } else {
    if (Array.isArray(imageOptions.data)) {
      /* Images in the array will be placed side by side -- MONTY */
      let runningWidth = x;
      let heighestImage = 0;
      for (let imgNumber = 0; imgNumber < imageOptions.data.length; imgNumber++) {
        const pdfImage = await generatePDFImage(imageOptions.data[imgNumber]);
        const imageWidth = imageOptions.imageRules[imgNumber].width;
        const imageHeight = imageOptions.imageRules[imgNumber].height;
        doc.image(pdfImage, runningWidth, y, {fit: [imageWidth, imageHeight]});
        runningWidth = runningWidth + imageWidth;
        if (heighestImage < imageHeight) {
          heighestImage = imageHeight;
        }
      }
      return sectionTypeLogic.docYResponse(doc, y + heighestImage + incrementY);
    } else {
      const pdfImage = await generatePDFImage(imageOptions.data);
      const imageWidth = imageOptions.imageRules.width;
      const imageHeight = imageOptions.imageRules.height;
      doc.image(pdfImage, x, y, {fit: [imageWidth, imageHeight]});
      return sectionTypeLogic.docYResponse(doc, y + imageHeight + incrementY);
    }
  }
}

function generatePDFImage(data) {
  return new Promise((resolve, reject) => {
    try {
      Jimp.read(data).then((image) => {
        image.getBuffer(Jimp.MIME_JPEG, (err, result) => {
          if (err !== null) {
            // return a cant be displayed image
            reject(err);
          } else {
            resolve(result);
          }
        });
      });
    } catch (err) {
      // return a cant be displayed image
      reject(err);
    }
  });
}
