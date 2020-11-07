const sectionTypeLogic = require('./base-logic');

module.exports = {
  generateLineThatIsText,
};

function generateLineThatIsText(doc, x, y, text, value, incrementY, headerColor, getDocY, font) {
  const docY = getDocY(doc, y, incrementY, 1, false);
  doc = docY.doc;
  y = docY.y;
  doc = sectionTypeLogic.populateLine(doc, headerColor, text, value, x, 180, y, font);
  doc = sectionTypeLogic.underline(doc, x, y);
  y += incrementY;
  return sectionTypeLogic.docYResponse(doc, y);
}
