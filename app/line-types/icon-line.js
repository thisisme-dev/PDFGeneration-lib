"use strict";

const sectionTypeLogic = require("./base-logic");
const constants = require("../constants");

module.exports = {
  populateIconLine,
};

function populateIconLine(doc, x, y, text, value, headerColor, xAdditionalWidth) {
  const incrementY = constants.INCREMENT_MAIN_Y;

  const {fontSize, boldFont, lightFont} = sectionTypeLogic.setComponentFont("OpenSansSemiBold", "OpenSansLight", constants.NORMAL_FONT_SIZE);

  doc.font(lightFont).fontSize(fontSize).fillColor(headerColor).text(text, x, y, {
    width: 370,
    lineGap: 10,
    ellipsis: true,
  });

  y += 2;

  value = value.toLowerCase();
  if (value == "y" || value == true || value == "true") {
    doc.image(`${sectionTypeLogic.constants.PACKAGE_PATH}images/icon-y.png`, x + xAdditionalWidth, y, {width: 8});
  } else if (value == "n" || value == "false" || value == false) {
    doc.image(`${sectionTypeLogic.constants.PACKAGE_PATH}images/icon-n.png`, x + xAdditionalWidth, y, {width: 8});
  } else if (value == "u" || value == "unknown") {
    doc.image(`${sectionTypeLogic.constants.PACKAGE_PATH}images/icon-u.png`, x + xAdditionalWidth, y, {width: 8});
  } else {
    doc.font(boldFont).fontSize(fontSize).text(value, x + xAdditionalWidth, y, {
      width: 370,
      lineGap: 10,
      ellipsis: true,
    });
  }

  doc = sectionTypeLogic.underline(doc, x, y);
  y += incrementY;

  return sectionTypeLogic.docYResponse(doc, y);
}
