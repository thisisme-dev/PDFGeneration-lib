const sectionTypeLogic = require('./base-logic');

module.exports = {
  generateLineThatIsHeader,
};

function generateLineThatIsHeader(doc, x, y, text, value, incrementY, headerColor, getDocY) {
  const docY = getDocY(doc, y, incrementY, 1, false);
  doc = docY.doc;
  y = docY.y;
  doc = sectionTypeLogic.populateLine(doc, headerColor, text, value, x, 180, y, true);
  // y += incrementY;
  return sectionTypeLogic.docYResponse(doc, y);
}
