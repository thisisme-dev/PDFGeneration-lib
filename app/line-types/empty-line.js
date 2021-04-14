'use strict';

const constants = require('../constants');
const sectionTypeLogic = require('./base-logic');

module.exports = {
  generateLineThatIsEmpty,
};

function generateLineThatIsEmpty(doc, y, incrementY, getDocY) {
  const docY = getDocY(doc, y, incrementY, 1, false);
  doc = docY.doc;
  y = docY.y;
  if (y > constants.TOP_OF_PAGE_Y) {
    y += incrementY;
  }
  return sectionTypeLogic.docYResponse(doc, y);
}
