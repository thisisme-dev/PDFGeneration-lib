const constants = require("../constants");

module.exports = {
  populateLine,
  setComponentFont,
  populateHLine,
  underline,
  constants,
};

function setComponentFont(boldFont, lightFont, fontSize, font) {
  if (font !== undefined) {
    if (font.size !== undefined) {
      fontSize = font.size;
    }

    if (font.bold_font !== undefined) {
      boldFont = font.bold_font;
    }
    if (font.light_font !== undefined) {
      lightFont = font.light_font;
    }
  }

  return {
    fontSize: fontSize,
    boldFont: boldFont,
    lightFont: lightFont,
  };
}

// populateLine : populates a line with the stipulated text and settings
function populateLine(doc, headerColor, text, value, x, xAdditionalWidth, y, font) {
  const {fontSize, boldFont, lightFont} = setComponentFont("OpenSansSemiBold", "OpenSansLight", constants.NORMAL_FONT_SIZE, font);
  doc.font(lightFont).fontSize(fontSize).fillColor(headerColor).text(text, x, y);
  doc.font(boldFont).fontSize(fontSize).text(value, x + xAdditionalWidth, y, {
    width: 370,
    lineGap: 10,
    ellipsis: true,
  });

  return doc;
}

function populateHLine(doc, text, x, y, hType, options = false) {
  if (hType == constants.PDFDocumentLineType.H1_LINE) {
    doc
        .roundedRect(constants.PD.MARGIN, y, (constants.PD.WIDTH - (constants.PD.MARGIN) * 2), 26, 2)
        .fill(constants.PDColors.BG_LIGHT, "#000");

    doc.image(`${constants.PACKAGE_PATH}images/icon-clock.png`, (constants.PD.MARGIN + constants.PD.PADDING ), (y + 7), {height: 12});

    doc
        .fillColor(constants.PDColors.TEXT_DARK)
        .fontSize(10)
        .text(text, (constants.PD.MARGIN + constants.PD.PAD_FOR_IMAGE_TEXT), (y + 6));
  } else if (hType == constants.PDFDocumentLineType.H2_LINE) {
    doc
        .fillColor(constants.PDColors.TEXT_DARK)
        .fontSize(10)
        .text(text, x, y);

    doc = underline(doc, x, y + 5, 3);
  } else if (hType == constants.PDFDocumentLineType.H3_LINE) {
    doc
        .fillColor(constants.PDColors.TEXT_DARK)
        .fontSize(9)
        .text(text, x, y);
  }

  return doc;
}

// underline: underlines a line on the PDF doc
function underline(doc, x, y, thickness = 0.5) {
  return doc.moveTo(x, y + constants.INCREMENT_UNDERLINE)
      .lineTo(doc.page.width - constants.PD.MARGIN, y + constants.INCREMENT_UNDERLINE)
      .strokeColor("#EEEEEE")
      .lineWidth(thickness)
      .stroke();
}
