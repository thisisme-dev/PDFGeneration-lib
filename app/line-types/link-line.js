"use strict";

const constants = require("../constants");
const utils = require("../utils");

module.exports = {
  generateLineThatIsLink,
};

function generateLineThatIsLink(doc, x, y, text, value, headerColor) {
  const incrementY = constants.INCREMENT_MAIN_Y;
  const docY = doc.getDocY(constants.PDFDocumentLineType.KEY_LINK_LINE, y, 1, false);
  doc = docY.doc;
  y = docY.y;
  doc = populateLineLink(doc, headerColor, text, value, x, 180, y);
  doc.underline(x, y);
  y += incrementY;
  return doc.docYResponse(y);
}

function populateLineLink(doc, headerColor, text, value, x, xAdditionalWidth, y) {
  const {fontSize, boldFont, lightFont} = utils.setComponentFont("OpenSansSemiBold", "OpenSansLight", constants.NORMAL_FONT_SIZE);
  doc.font(lightFont).fontSize(fontSize).fillColor(headerColor).text(text, x, y);
  // TODO: (Future) we might be required to add case handling and cater for DejaVuSans font (russian, chinese etc characters causng problems)
  doc.font(boldFont).fontSize(fontSize).text(value.piece, x + xAdditionalWidth, y, {
    width: 370,
    lineGap: 10,
    ellipsis: true,
    link: value.link,
  });

  return doc;
}
