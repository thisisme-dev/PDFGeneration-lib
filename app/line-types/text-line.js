"use strict";

const constants = require("../constants");
const sectionTypeLogic = require("./base-logic");

module.exports = {
  generateLineThatIsText,
};

function generateLineThatIsText(doc, x, y, text, value, headerColor) {
  const incrementY = constants.INCREMENT_MAIN_Y;

  const docY = doc.getDocY(constants.PDFDocumentLineType.KEY_VALUE_LINE, y, 1, false);
  doc = docY.doc;
  y = docY.y;
  doc = sectionTypeLogic.populateLine(doc, headerColor, text, value, x, 180, y);
  doc = sectionTypeLogic.underline(doc, x, y);
  y += incrementY;
  return sectionTypeLogic.docYResponse(doc, y);
}
