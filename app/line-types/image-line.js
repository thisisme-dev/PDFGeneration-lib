"use strict";

const Jimp = require("jimp");

const constants = require("../constants");

// WARNING: this is a WIP, need to break this so we can handle errors correctly
const utils = require("../utils");

module.exports = {
  generateLineThatIsImage,
};

async function generateLineThatIsImage(doc, x, y, value) {
  const docY = doc.getDocY(constants.PDFDocumentLineType.IMAGE_LINE, y, 1, false);
  doc = docY.doc;
  y = docY.y;
  return await populateImage(doc, x, y, value);
}

// Notes:
// imageDescriptions are currently only available for single images
async function populateImage(doc, x, y, imageOptions) {
  const incrementY = constants.INCREMENT_MAIN_Y;

  if (Array.isArray(imageOptions.data)) {
    /* Images in the array will be placed side by side -- MONTY */
    let runningWidth = x;
    let heighestImage = 0;
    for (let imgNumber = 0; imgNumber < imageOptions.data.length; imgNumber++) {
      const pdfImage = await generatePDFImage(imageOptions.data[imgNumber]);
      const imageWidth = imageOptions.imageRules[imgNumber].width;
      const imageHeight = imageOptions.imageRules[imgNumber].height;
      doc.image(pdfImage, runningWidth, y, {fit: [imageWidth, imageHeight]});
      runningWidth += imageWidth;
      if (heighestImage < imageHeight) {
        heighestImage = imageHeight;
      }
    }
    return doc.docYResponse(y + heighestImage + incrementY);
  } else {
    const isCentered = imageOptions["imageType"] && imageOptions["imageType"] === constants.PDFImageType.CENTER;
    const pdfImage = await generatePDFImage(imageOptions.data);
    const imageWidth = imageOptions.imageRules.width;
    const imageHeight = imageOptions.imageRules.height;
    if (isCentered) {
      x = x + (doc.page.width - imageWidth) / 2 - 20;
    }
    doc.image(pdfImage, x, y, {
      fit: [imageWidth, imageHeight],
    });
    const docIncrementY = populateImageDescriptions(doc, imageOptions, doc.y, x);
    doc = docIncrementY.doc;
    y = doc.y;
    if (docIncrementY.incrementY) {
      y += incrementY;
    }
    return doc.docYResponse(y);
  }
}

function addDescriptionLine(doc, description, maxLabelWidth, y, x) {
  const {fontSize, boldFont, lightFont} = utils.setComponentFont("OpenSansSemiBold", "OpenSansLight", constants.NORMAL_FONT_SIZE - 1);

  doc.font(boldFont).fontSize(fontSize).fillColor(constants.PDFColors.NORMAL_COLOR).text(`${description.label}:`, x, y);
  doc.font(lightFont).fontSize(fontSize).text(`${description.value}`, x + maxLabelWidth + 12, y, {
    width: 370,
    lineGap: 10,
    ellipsis: true,
  });
  return doc;
}

function populateImageDescriptions(doc, imageOptions, y, x) {
  let incrementY = true;
  if (imageOptions && imageOptions.imageDescriptions) {
    incrementY = false;
    const imageDescriptions = imageOptions.imageDescriptions;
    let maxWidth = 0;
    if (Array.isArray(imageDescriptions)) {
      for (let index = 0; index < imageDescriptions.length; index++) {
        const stringWidth = doc.widthOfString(imageDescriptions[index].label);
        if (stringWidth > maxWidth) {
          maxWidth = stringWidth;
        }
      }

      for (let index = 0; index < imageDescriptions.length; index++) {
        const element = imageDescriptions[index];
        doc = addDescriptionLine(doc, element, maxWidth, y, x);
        y = doc.y - 10;
      }
    } else {
      maxWidth = doc.widthOfString(imageDescriptions.label);
      doc = addDescriptionLine(doc, imageDescriptions, maxWidth, y, x);
    }
  }
  return {
    doc: doc,
    incrementY: incrementY,
  };
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
