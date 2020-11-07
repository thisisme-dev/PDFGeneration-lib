const constants = require('./constants');

const sectionTypeLogic = require('./line-types/base-logic');
const headerLine = require('./line-types/header-line');
const emptyLine = require('./line-types/empty-line');
const textLine = require('./line-types/text-line');
const linkLine = require('./line-types/link-line');
const objectLine = require('./line-types/object-line');
const gridLine = require('./line-types/grid-line');
const indicativeLine = require('./line-types/indicative-bar-line');
const imageLine = require('./line-types/image-line');

module.exports = {
  addLine,
};

// addLine : This function builds the line/section to display on the PDF document
async function addLine(lineDocY, text, value, lineType, isFancyHeader, font) {
  function getDocY(doc, currentY, incrementY, sectionRows, isSubHeader) {
    // this function needs the lineType for the object,
    // we have case where we don't just deal with lines,
    // but objects with lines
    const headerLowest = 750; // the lowest y for a header
    const noFooterLimit = 800; // lowest y for a row
    const isHeader = (lineType === constants.PDFDocumentLineType.HEADER_LINE) || isSubHeader;

    const rowsIncrementY = (sectionRows * incrementY);
    if (rowsIncrementY + currentY > constants.TOP_OF_PAGE_Y) {
      // console.log(`${text} currentY: ${currentY} sectionRows: ${sectionRows}`);
      if (isHeader || lineType === constants.PDFDocumentLineType.END_LINE) {
        if (rowsIncrementY + currentY >= headerLowest) {
          return sectionTypeLogic.createNewPage(doc);
        }
      }

      if (rowsIncrementY + currentY > noFooterLimit) {
        return sectionTypeLogic.createNewPage(doc);
      }
    }
    return sectionTypeLogic.docYResponse(doc, currentY);
  }

  let doc = lineDocY.doc;
  let y = lineDocY.y;
  const incrementY = constants.INCREMENT_MAIN_Y;
  const x = constants.X_START;
  const headerColor = constants.PDF_TEXT.REPORT_HEADERS.includes(text) || lineType === constants.PDFDocumentLineType.HEADER_LINE ? constants.PDFColors.INDICATIVE_COLOR : constants.PDFColors.NORMAL_COLOR;

  // A type should ALWAYS start with the getDocY function to ensure you are correctly positioned
  switch (lineType) {
    case constants.PDFDocumentLineType.EMPTY_LINE:
    case constants.PDFDocumentLineType.END_LINE: {
      const sectionResponse = emptyLine.generateLineThatIsEmpty(doc, y, incrementY, getDocY);
      doc = sectionResponse.doc;
      y = sectionResponse.y;
      break;
    }
    case constants.PDFDocumentLineType.HEADER_LINE: {
      // console.log(`Header line: ${text} -- ${headerColor} ${y} ${isFancyHeader}`)
      const sectionResponse = headerLine.generateLineThatIsHeader(doc, x, y, isFancyHeader, text, incrementY, headerColor, getDocY, font);
      doc = sectionResponse.doc;
      y = sectionResponse.y;
      break;
    }
    case constants.PDFDocumentLineType.ADDRESS_LINE: {
      let addressParts = value.split(',');
      addressParts = addressParts.map((s) => s.trim());
      addressParts = addressParts.filter((s) => s.length > 0);

      const docY = getDocY(doc, y, incrementY, addressParts.length, false);
      doc = docY.doc;
      y = docY.y;

      doc = sectionTypeLogic.populateLine(doc, headerColor, text, '', x, 180, y, font);
      for (let i = 0; i < addressParts.length; i++) {
        const addressPart = addressParts[i];
        doc = sectionTypeLogic.populateLine(doc, headerColor, '', addressPart, x, 180, y, font);
        if (i < addressParts.length - 1) {
          doc = sectionTypeLogic.underline(doc, x, y);
          y += incrementY;
        }
        doc = sectionTypeLogic.underline(doc, x, y);
      }
      y += incrementY;
      break;
    }
    case constants.PDFDocumentLineType.COLUMN_INFO:
    case constants.PDFDocumentLineType.META_INFO: {
      const sectionResponse = objectLine.generateLineThatIsObject(doc, x, y, text, value, lineType, incrementY, getDocY, font);
      doc = sectionResponse.doc;
      y = sectionResponse.y;
      break;
    }
    case constants.PDFDocumentLineType.GRID: { // TODO: requires validating new headers for page space
      const sectionResponse = gridLine.generateLineThatIsGrid(doc, x, y, text, value, isFancyHeader, incrementY, headerColor, getDocY, font);
      doc = sectionResponse.doc;
      y = sectionResponse.y;
      break;
    }
    case constants.PDFDocumentLineType.TABLE_OF_CONTENTS_LINE: {
      const docY = getDocY(doc, y, incrementY, 1, false);
      doc = docY.doc;
      y = docY.y;
      doc = sectionTypeLogic.populateLine(doc, headerColor, text, '', x, 180, y);
      doc = sectionTypeLogic.populateLine(doc, headerColor, value, '', 550, 180, y);
      doc = sectionTypeLogic.underline(doc, x, y);
      y += incrementY;
      break;
    }
    case constants.PDFDocumentLineType.KEY_LINK_LINE: {
      const sectionResponse = linkLine.generateLineThatIsLink(doc, x, y, text, value, incrementY, headerColor, getDocY);
      doc = sectionResponse.doc;
      y = sectionResponse.y;
      break;
    }
    case constants.PDFDocumentLineType.INDICATIVE_BAR_LINE: {
      const sectionResponse = indicativeLine.generateLineThatIsIndicativeBar(doc, x, y, text, value, incrementY, getDocY);
      doc = sectionResponse.doc;
      y = sectionResponse.y;
      break;
    }
    case constants.PDFDocumentLineType.IMAGE_LINE: {
      const sectionResponse = await imageLine.generateLineThatIsImage(doc, x, y, value, incrementY, getDocY);
      doc = sectionResponse.doc;
      y = sectionResponse.y;
      break;
    }
    case constants.PDFDocumentLineType.PAGE_BREAK: {
      doc.addPage();
      doc = doc;
      y = 80;
      break;
    }
    default: {
      const sectionResponse = textLine.generateLineThatIsText(doc, x, y, text, value, incrementY, headerColor, getDocY, font);
      doc = sectionResponse.doc;
      y = sectionResponse.y;
      break;
    }
  }
  return sectionTypeLogic.docYResponse(doc, y);
}
