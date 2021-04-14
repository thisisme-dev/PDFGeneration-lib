'use strict';

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

// Notes:
// imageDescriptions are currently only available for single images
async function populateImage(doc, x, y, incrementY, imageOptions) {
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
    const isCentered = imageOptions['imageType'] && imageOptions['imageType'] === constants.PDFImageType.CENTER;
    const pdfImage = await generatePDFImage(imageOptions.data);
    const imageWidth = imageOptions.imageRules.width;
    const imageHeight = imageOptions.imageRules.height;
    if (isCentered) {
      x = x + (doc.page.width - imageWidth)/2 -20;
    }
    doc.image(pdfImage, x, y, {
      fit: [imageWidth, imageHeight],
    });
    const docIncrementY = populateImageDescriptions(doc, imageOptions, doc.y, x);
    doc = docIncrementY.doc;
    y = doc.y;
    if (docIncrementY.incrementY) {
      y = y + incrementY;
    }
    return sectionTypeLogic.docYResponse(doc, y);
  }
}

function addDescriptionLine(doc, description, maxLabelWidth, y, x) {
  const fontSize = constants.NORMAL_FONT_SIZE - 3;
  const boldFont = 'OpenSansSemiBold';
  const lightFont = 'OpenSansLight';

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
