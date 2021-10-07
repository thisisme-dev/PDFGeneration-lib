"use strict";

const constants = require("./constants");

const pageOfContentsLine = require("./line-types/page-of-contents-line");
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
  const {doc, y} = lineDocY;
  const x = constants.X_START;
  const headerColor = lineType === constants.PDFDocumentLineType.HEADER_LINE ? constants.PDFColors.INDICATIVE_COLOR : constants.PDFColors.NORMAL_COLOR;

  // A type should ALWAYS start with the getDocY function to ensure you are correctly positioned
  let docY;
  switch (lineType) {
    case constants.PDFDocumentLineType.EMPTY_LINE:
    case constants.PDFDocumentLineType.END_LINE: {
      docY = emptyLine.generateLineThatIsEmpty(doc, lineType, y);
      break;
    }
    // case constants.PDFDocumentLineType.HEADER_LINE: {
    //   console.log(`Header line: ${text} -- ${headerColor} ${y} ${isFancyHeader}`);
    //   docY = headerLine.generateLineThatIsHeader(doc, x, y, isFancyHeader, text, headerColor, font);
    //   break;
    // }
    case constants.PDFDocumentLineType.HEADER_LINE:
    case constants.PDFDocumentLineType.H1_LINE: {
      docY = hLine.generateLineThatIsH(doc, x, y, text, constants.PDFDocumentLineType.H1_LINE, options);
      break;
    }
    case constants.PDFDocumentLineType.H2_LINE: {
      docY = hLine.generateLineThatIsH(doc, x, y, text, constants.PDFDocumentLineType.H2_LINE, options);
      break;
    }
    case constants.PDFDocumentLineType.H3_LINE: {
      docY = hLine.generateLineThatIsH(doc, x, y, text, constants.PDFDocumentLineType.H3_LINE, options);
      break;
    }
    case constants.PDFDocumentLineType.KEY_ICON_LINE: {
      docY = iconLine.populateIconLine(doc, x, y, text, value, headerColor, 180);
      break;
    }
    case constants.PDFDocumentLineType.ADDRESS_LINE: {
      docY = addressLine.generateAddressLine(doc, text, value, x, y, headerColor, font);
      break;
    }
    case constants.PDFDocumentLineType.COLUMN_INFO:
    case constants.PDFDocumentLineType.META_INFO: {
      docY = objectLine.generateLineThatIsObject(doc, x, y, text, value, lineType);
      break;
    }
    case constants.PDFDocumentLineType.GRID: { // TODO: requires validating new headers for page space
      docY = gridLine.generateLineThatIsGrid(doc, x, y, text, value, isFancyHeader, headerColor, font);
      break;
    }
    case constants.PDFDocumentLineType.TABLE_OF_CONTENTS_LINE: {
      docY = pageOfContentsLine.generatePageOfContentsLine(doc, x, y, text, value, headerColor, options);
      break;
    }
    case constants.PDFDocumentLineType.KEY_LINK_LINE: {
      docY = linkLine.generateLineThatIsLink(doc, x, y, text, value, headerColor);
      break;
    }
    case constants.PDFDocumentLineType.INDICATIVE_BAR_LINE: {
      docY = indicativeLine.generateLineThatIsIndicativeBar(doc, x, y, text, value);
      break;
    }
    case constants.PDFDocumentLineType.IMAGE_LINE: {
      docY = await imageLine.generateLineThatIsImage(doc, x, y, value, options);
      break;
    }
    case constants.PDFDocumentLineType.PAGE_BREAK: {
      docY = doc.createNewPage();
      break;
    }
    case constants.PDFDocumentLineType.CHART_LINE: {
      docY = await chartLine.generateChart(doc, y, text, value);
      break;
    }
    default: {
      docY = textLine.generateLineThatIsText(doc, x, y, text, value, headerColor, options);
      break;
    }
  }
  return docY;
}
