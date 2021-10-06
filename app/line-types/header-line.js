"use strict";

const constants = require("../constants");

const sectionTypeLogic = require("./base-logic");

module.exports = {
  generateLineThatIsHeader,
};

function generateLineThatIsHeader(doc, x, y, isFancyHeader, text, headerColor, font) {
  const incrementY = constants.INCREMENT_MAIN_Y;
  const docY = doc.getDocY(constants.PDFDocumentLineType.HEADER_LINE, y, 1, false);
  doc = docY.doc;
  y = docY.y;
  doc = sectionTypeLogic.populateHeaderLine(doc, text, x, y, isFancyHeader, font);
  if (!isFancyHeader) {
    y += incrementY + incrementY / 2;
  }
  return sectionTypeLogic.docYResponse(doc, y);
}
