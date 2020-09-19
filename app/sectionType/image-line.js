// WARNING: this is a WIP, need to break this so we can handle errors correctly
const sectionTypeLogic = require('./base-logic');
const Jimp = require('jimp');

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
    const pdfImage = await generatePDFImage(imageOptions);
    const imageWidth = imageOptions.imageRules.width;
    const imageHeight = imageOptions.imageRules.height;
    doc.image(pdfImage, x, y, {fit: [imageWidth, imageHeight]});
    return sectionTypeLogic.docYResponse(doc, y + imageHeight + incrementY);
}

function generatePDFImage(imageOptions) {
  return new Promise((resolve, reject) => {
    try {
      Jimp.read(imageOptions.data).then((image) => {
        image.getBuffer(Jimp.MIME_JPEG, (err, result) => {
          if (err !== null) {
            // return a cant be displayed image
            reject(err);
          } else {
            resolve(result)
          }     
        });
      });
    } catch (err) {
      // return a cant be displayed image
      reject(err);
    }
  });
};

function examplePayload() {
  const base64str = "R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="//base64 of a 1x1 black pixel
  const buf = Buffer.from(base64str, 'base64');
  return {
    imageRules: {
      width: 200,
      height: 140,
    }, 
    // data: buf,
    // data: "path.jpg", 
    data: "https://www.sciencemag.org/sites/default/files/styles/article_main_image_-_1280w__no_aspect_/public/dogs_1280p_0.jpg", 
  }
}
