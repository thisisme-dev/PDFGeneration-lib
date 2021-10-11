"use strict";

const constants = require("../constants");

module.exports = {
  generateLineThatIsText,
};

function generateLineThatIsText(doc, x, y, text, value, headerColor) {
  const incrementY = constants.INCREMENT_MAIN_Y;

  const docY = doc.getDocY(constants.PDFDocumentLineType.KEY_VALUE_LINE, y, 1, false);
  doc = docY.doc;
  y = docY.y;
  doc.populateLine(headerColor, text, value, x, 180, y);
  doc.underline(x, y);
  y += incrementY;
  return doc.docYResponse(y);
}
