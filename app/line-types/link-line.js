'use strict';

const constants = require('../constants');

const sectionTypeLogic = require('./base-logic');

module.exports = {
  generateLineThatIsLink,
};

function generateLineThatIsLink(doc, x, y, text, value, incrementY, headerColor, getDocY) {
  const docY = getDocY(doc, y, incrementY, 1, false);
  doc = docY.doc;
  y = docY.y;
  doc = populateLineLink(doc, headerColor, text, value, x, 180, y);
  doc = sectionTypeLogic.underline(doc, x, y);
  y += incrementY;
  return sectionTypeLogic.docYResponse(doc, y);
}

function populateLineLink(doc, headerColor, text, value, x, xAdditionalWidth, y) {
  const size = constants.NORMAL_FONT_SIZE;
  doc.font('OpenSansSemiBold').fontSize(size).fillColor(headerColor).text(text, x, y);
  // TODO: (Future) we might be required to add case handling and cater for DejaVuSans font (russian, chinese etc characters causng problems)
  doc.font('OpenSansLight').fontSize(size).text(value.piece, x + xAdditionalWidth, y, {
    width: 370,
    lineGap: 10,
    ellipsis: true,
    link: value.link,
  });

  return doc;
}
