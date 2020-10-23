const constants = require('../constants');

module.exports = {
  docYResponse,
  populateLine,
  populateHeaderLine,
  underline,
  createNewPage,
};

// docYResponse : Creates an easy to refer to docY object, contains the the PDF Document and the current Y positioning
function docYResponse(doc, y) {
  return {
    doc: doc,
    y: y,
  };
}

// populateLine : populates a line with the stipulated text and settings
function populateLine(doc, headerColor, text, value, x, xAdditionalWidth, y) {
  const size = constants.NORMAL_FONT_SIZE;

  doc.font('OpenSansSemiBold').fontSize(size).fillColor(headerColor).text(text, x, y);
  doc.font('OpenSansLight').fontSize(size).text(value, x + xAdditionalWidth, y, {
    width: 370,
    lineGap: 10,
    ellipsis: true,
  });

  return doc;
}

// populateHeaderLine : populates a line with the stipulated text and settings
function populateHeaderLine(doc, headerColor, text, value, x, xAdditionalWidth, y, isFancyHeader) {
  let size = constants.NORMAL_FONT_SIZE;
  // console.log(isHeaderType)
  size = constants.HEADER_FONT_SIZE;
  const page = doc.page;
  // TODO: CHOOSE HEADER
  // full block
  // doc.rect(0, 0, page.width, constants.INCREMENT_MAIN_Y + 15).fillColor(constants.PDFColors.NORMAL_COLOR).strokeColor(constants.PDFColors.NORMAL_COLOR).fillAndStroke();
  // thin block
  if (isFancyHeader) {
    doc.rect(0, 25, page.width, 50).fillColor(constants.PDFColors.NORMAL_COLOR).strokeColor(constants.PDFColors.NORMAL_COLOR).fillAndStroke();
    doc.font('OpenSansSemiBold').fontSize(size).fillColor(constants.PDFColors.TEXT_IN_NORMAL_COLOR).text(text, x, y - 40);
  } else {
    doc.font('OpenSansSemiBold').fontSize(size).fillColor(constants.PDFColors.NORMAL_COLOR).text(text, x, y);
  }

  return doc;
}

// underline: underlines a line on the PDF doc
function underline(doc, x, y) {
  return doc.moveTo(x, y + constants.INCREMENT_UNDERLINE)
      .lineTo(doc.page.width - 20, y + constants.INCREMENT_UNDERLINE)
      .strokeColor('#CCCCCC')
      .lineWidth(.025)
      .stroke();
}

// createNewPage : Creates a new PDF Document page and returns the coordinates for continuation
function createNewPage(doc) {
  doc.addPage();
  return docYResponse(doc, constants.TOP_OF_PAGE_Y);
}
