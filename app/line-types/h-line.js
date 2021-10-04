"use strict";

const constants = require("../constants");
const sectionTypeLogic = require("./base-logic");

module.exports = {
  generateLineThatIsH,
};

function generateLineThatIsH(doc, x, y, text, value, lineType, getDocY, options = false) {
  const incrementY = constants.INCREMENT_MAIN_Y;

  const docY = getDocY(doc, y, incrementY, 1, false);
  doc = docY.doc;
  y = docY.y;

  doc = sectionTypeLogic.populateHLine(doc, text, value, x, y, lineType, options);

  if (lineType == constants.PDFDocumentLineType.H1_LINE) {
    y += incrementY + incrementY / 2;
  } else if (lineType == constants.PDFDocumentLineType.H2_LINE) {
    y += incrementY + incrementY / 2;
  } else if (lineType == constants.PDFDocumentLineType.H3_LINE) {
    y += incrementY;
  }
  return sectionTypeLogic.docYResponse(doc, y);
}
