"use strict";

const constants = require("./constants");

const sectionTypeLogic = require("./line-types/base-logic");
const headerLine = require("./line-types/header-line");
const hLine = require("./line-types/h-line");
const iconLine = require("./line-types/icon-line");
const emptyLine = require("./line-types/empty-line");
const chartLine = require("./line-types/chart-line");
const textLine = require("./line-types/text-line");
const addressLine = require("./line-types/address-line");
const linkLine = require("./line-types/link-line");
const objectLine = require("./line-types/object-line");
const gridLine = require("./line-types/grid-line");
const indicativeLine = require("./line-types/indicative-bar-line");
const imageLine = require("./line-types/image-line");

module.exports = {
  addLine,
};

// addLine : This function builds the line/section to display on the PDF document
async function addLine(lineDocY, text, value, lineType, isFancyHeader, font, options = false) {
  let doc = lineDocY.doc;
  let y = lineDocY.y;
  const incrementY = constants.INCREMENT_MAIN_Y;
  const x = constants.X_START;
  const headerColor = lineType === constants.PDFDocumentLineType.HEADER_LINE ? constants.PDFColors.INDICATIVE_COLOR : constants.PDFColors.NORMAL_COLOR;

  // A type should ALWAYS start with the getDocY function to ensure you are correctly positioned
  switch (lineType) {
    case constants.PDFDocumentLineType.EMPTY_LINE:
    case constants.PDFDocumentLineType.END_LINE: {
      const sectionResponse = emptyLine.generateLineThatIsEmpty(doc, lineType, y);
      doc = sectionResponse.doc;
      y = sectionResponse.y;
      break;
    }
    case constants.PDFDocumentLineType.HEADER_LINE: {
      // console.log(`Header line: ${text} -- ${headerColor} ${y} ${isFancyHeader}`)
      const sectionResponse = headerLine.generateLineThatIsHeader(doc, x, y, isFancyHeader, text, headerColor, font);
      doc = sectionResponse.doc;
      y = sectionResponse.y;
      break;
    }
    case constants.PDFDocumentLineType.H1_LINE: {
      const sectionResponse = hLine.generateLineThatIsH(doc, x, y, text, value, constants.PDFDocumentLineType.H1_LINE, options);
      doc = sectionResponse.doc;
      y = sectionResponse.y;
      break;
    }
    case constants.PDFDocumentLineType.H2_LINE: {
      const sectionResponse = hLine.generateLineThatIsH(doc, x, y, text, value, constants.PDFDocumentLineType.H2_LINE, options);
      doc = sectionResponse.doc;
      y = sectionResponse.y;
      break;
    }
    case constants.PDFDocumentLineType.H3_LINE: {
      const sectionResponse = hLine.generateLineThatIsH(doc, x, y, text, value, constants.PDFDocumentLineType.H3_LINE, options);
      doc = sectionResponse.doc;
      y = sectionResponse.y;
      break;
    }
    case constants.PDFDocumentLineType.KEY_ICON_LINE: {
      const sectionResponse = iconLine.populateIconLine(doc, x, y, text, value, headerColor, 180);
      doc = sectionResponse.doc;
      y = sectionResponse.y;
      break;
    }
    case constants.PDFDocumentLineType.ADDRESS_LINE: {
      const sectionResponse = addressLine.generateAddressLine(doc, text, value, x, y, headerColor, font);
      doc = sectionResponse.doc;
      y = sectionResponse.y;
      break;
    }
    case constants.PDFDocumentLineType.COLUMN_INFO:
    case constants.PDFDocumentLineType.META_INFO: {
      const sectionResponse = objectLine.generateLineThatIsObject(doc, x, y, text, value, lineType);
      doc = sectionResponse.doc;
      y = sectionResponse.y;
      break;
    }
    case constants.PDFDocumentLineType.GRID: { // TODO: requires validating new headers for page space
      const sectionResponse = gridLine.generateLineThatIsGrid(doc, x, y, text, value, isFancyHeader, headerColor, font);
      doc = sectionResponse.doc;
      y = sectionResponse.y;
      break;
    }
    case constants.PDFDocumentLineType.TABLE_OF_CONTENTS_LINE: {
      const docY = doc.getDocY(lineType, doc, y, 1, false);
      doc = docY.doc;
      y = docY.y;
      doc = sectionTypeLogic.populateLine(doc, headerColor, text, "", x, 180, y);
      doc = sectionTypeLogic.populateLine(doc, headerColor, value, "", 550, 180, y);
      doc = sectionTypeLogic.underline(doc, x, y);
      y += incrementY;
      break;
    }
    case constants.PDFDocumentLineType.KEY_LINK_LINE: {
      const sectionResponse = linkLine.generateLineThatIsLink(doc, x, y, text, value, headerColor);
      doc = sectionResponse.doc;
      y = sectionResponse.y;
      break;
    }
    case constants.PDFDocumentLineType.INDICATIVE_BAR_LINE: {
      const sectionResponse = indicativeLine.generateLineThatIsIndicativeBar(doc, x, y, text, value);
      doc = sectionResponse.doc;
      y = sectionResponse.y;
      break;
    }
    case constants.PDFDocumentLineType.IMAGE_LINE: {
      const sectionResponse = await imageLine.generateLineThatIsImage(doc, x, y, value, options);
      doc = sectionResponse.doc;
      y = sectionResponse.y;
      break;
    }
    case constants.PDFDocumentLineType.PAGE_BREAK: {
      doc.addPage();
      y = constants.TOP_OF_PAGE_Y;
      break;
    }
    case constants.PDFDocumentLineType.CHART_LINE: {
      const sectionResponse = await chartLine.generateChart(doc, y, text, value);
      doc = sectionResponse.doc;
      y = sectionResponse.y;
      break;
    }
    default: {
      const sectionResponse = textLine.generateLineThatIsText(doc, x, y, text, value, headerColor, options);
      doc = sectionResponse.doc;
      y = sectionResponse.y;
      break;
    }
  }
  return sectionTypeLogic.docYResponse(doc, y);
}
