"use strict";

const sectionTypeLogic = require("./base-logic");

module.exports = {
  generateLineThatIsHeader,
};

function generateLineThatIsHeader(doc, x, y, isFancyHeader, text, incrementY, headerColor, getDocY, font) {
  const docY = getDocY(doc, y, incrementY, 1, false);
  doc = docY.doc;
  y = docY.y;
  doc = sectionTypeLogic.populateHeaderLine(doc, text, x, y, isFancyHeader, font);
  if (!isFancyHeader) {
    y += incrementY + incrementY / 2;
  }
  return sectionTypeLogic.docYResponse(doc, y);
}
