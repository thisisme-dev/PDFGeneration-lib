"use strict";

const constants = require("../constants");

module.exports = {
  generateAddressLine,
};

function generateAddressLine(doc, text, value, x, y, headerColor, font) {
  const incrementY = constants.INCREMENT_MAIN_Y;

  let addressParts = value.split(",");
  addressParts = addressParts.map((s) => s.trim());
  addressParts = addressParts.filter((s) => s.length > 0);

  const docY = doc.getDocY(constants.PDFDocumentLineType.ADDRESS_LINE, y, addressParts.length, false);
  doc = docY.doc;
  y = docY.y;

  doc.populateLine(headerColor, text, "", x, 180, y, font);
  for (let i = 0; i < addressParts.length; i++) {
    const addressPart = addressParts[i];
    doc.populateLine(headerColor, "", addressPart, x, 180, y, font);
    if (i < addressParts.length - 1) {
      doc.underline(x, y);
      y += incrementY;
    }
    doc.underline(x, y);
  }
  y += incrementY;
  return doc.docYResponse(y);
}
