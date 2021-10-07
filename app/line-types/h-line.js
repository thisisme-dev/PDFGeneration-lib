"use strict";

const constants = require("../constants");
const sectionTypeLogic = require("./base-logic");

module.exports = {
  generateLineThatIsH,
};

function generateLineThatIsH(doc, x, y, text, lineType, options = false) {
  const incrementY = constants.INCREMENT_MAIN_Y;

  const docY = doc.getDocY(lineType, y, 1, false);
  doc = docY.doc;
  y = docY.y;

  doc = sectionTypeLogic.populateHLine(doc, text, x, y, lineType, options, "H2");

  if (lineType == constants.PDFDocumentLineType.H1_LINE) {
    y += incrementY * 2;
  } else if (lineType == constants.PDFDocumentLineType.H2_LINE) {
    y += incrementY + incrementY / 2;
  } else if (lineType == constants.PDFDocumentLineType.H3_LINE) {
    y += incrementY;
  }
  return doc.docYResponse(y);
}
