"use strict";

const constants = require("../constants");

const sectionTypeLogic = require("./base-logic");

module.exports = {
  generateLineThatIsEmpty,
};

function generateLineThatIsEmpty(doc, lineType, y) {
  const incrementY = constants.INCREMENT_MAIN_Y;
  const docY = doc.getDocY(lineType, y, 1, false);
  doc = docY.doc;
  y = docY.y;
  if (y > constants.TOP_OF_PAGE_Y) {
    y += incrementY;
  }
  return sectionTypeLogic.docYResponse(doc, y);
}
