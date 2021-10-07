"use strict";

const constants = require("../constants");

const sectionTypeLogic = require("./base-logic");

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

  doc = sectionTypeLogic.populateLine(doc, headerColor, text, "", x, 180, y, font);
  for (let i = 0; i < addressParts.length; i++) {
    const addressPart = addressParts[i];
    doc = sectionTypeLogic.populateLine(doc, headerColor, "", addressPart, x, 180, y, font);
    if (i < addressParts.length - 1) {
      doc = sectionTypeLogic.underline(doc, x, y);
      y += incrementY;
    }
    doc = sectionTypeLogic.underline(doc, x, y);
  }
  y += incrementY;
  return doc.docYResponse(y);
}
