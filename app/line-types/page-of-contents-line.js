"use strict";

const constants = require("../constants");
const sectionTypeLogic = require("./base-logic");

module.exports = {
  generatePageOfContentsLine,
};

function generatePageOfContentsLine(doc, x, y, text, value, headerColor) {
  const incrementY = constants.INCREMENT_MAIN_Y;

  const docY = doc.getDocY(constants.PDFDocumentLineType.TABLE_OF_CONTENTS_LINE, y, 1, false);
  doc = docY.doc;
  y = docY.y;
  doc = sectionTypeLogic.populateLine(doc, headerColor, text, "", x, 180, y);
  doc = sectionTypeLogic.populateLine(doc, headerColor, value, "", 550, 180, y);
  doc = sectionTypeLogic.underline(doc, x, y);
  y += incrementY;
  return doc.docYResponse(y);
}
