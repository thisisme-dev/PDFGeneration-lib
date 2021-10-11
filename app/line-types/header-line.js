"use strict";

const constants = require("../constants");

module.exports = {
  generateHeaderLine,
};

function generateHeaderLine(doc, x, y, text, font = false) {
  const incrementY = constants.INCREMENT_MAIN_Y;
  const docY = doc.getDocY(constants.PDFDocumentLineType.HEADER_LINE, y, 1, false);
  doc = docY.doc;
  y = docY.y;

  const headerLevel = font.headerLevel;
  doc.populateHeaderLine(text, x, y, headerLevel);

  if (headerLevel == constants.PDFHeaderType.H1_LINE) {
    y += incrementY * 2;
  } else if (headerLevel == constants.PDFHeaderType.H2_LINE) {
    y += incrementY + incrementY / 2;
  } else if (headerLevel == constants.PDFHeaderType.H3_LINE) {
    y += incrementY;
  }
  return doc.docYResponse(y);
}
