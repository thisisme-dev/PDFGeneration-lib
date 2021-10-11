"use strict";

const constants = require("../constants");

module.exports = {
  generatePageOfContentsLine,
};

function generatePageOfContentsLine(doc, x, y, text, value, headerColor) {
  const incrementY = constants.INCREMENT_MAIN_Y;

  const docY = doc.getDocY(constants.PDFDocumentLineType.TABLE_OF_CONTENTS_LINE, y, 1, false);
  doc = docY.doc;
  y = docY.y;
  doc.populateLine(headerColor, text, "", x, 180, y);
  doc.populateLine(headerColor, value, "", 550, 180, y);
  doc.underline(x, y);
  y += incrementY;
  return doc.docYResponse(y);
}
