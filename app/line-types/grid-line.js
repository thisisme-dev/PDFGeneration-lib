"use strict";

const constants = require("../constants");
const sectionTypeLogic = require("./base-logic");

module.exports = {
  generateLineThatIsGrid,
};

function generateLineThatIsGrid(doc, x, y, text, value, isNewPageHeader, incrementY, headerColor, getDocY, font) {
  const itemCountToFormRow = (Object.keys(value[0]).length + 1); // keys + END_LINE to go to next row
  const gridRowsWithoutHeader = ((value.length - 1) / itemCountToFormRow);
  const headerRow = isNewPageHeader ? 0 : 1;
  const docY = getDocY(doc, y, incrementY, gridRowsWithoutHeader + headerRow, true);

  doc = docY.doc;
  y = docY.y;

  if (isNewPageHeader) {
    doc = sectionTypeLogic.populateHeaderLine(doc, text, x, y, isNewPageHeader, font);
  } else {
    if (text !== null && text !== undefined) {
      if (text.length > 0) {
        doc = sectionTypeLogic.populateHLine(doc, text, x, y, constants.PDFDocumentLineType.H3_LINE);
        y += incrementY;
      }
    }
  }

  const gridHeaders = value[0];
  const columnWidth = {};
  const columnXStart = {};

  const {fontSize, boldFont, lightFont} = sectionTypeLogic.setComponentFont("OpenSansSemiBold", "OpenSansLight", constants.NORMAL_FONT_SIZE, font);

  let index = 0;
  for (const gridHeader in gridHeaders) {
    if (Object.prototype.hasOwnProperty.call(gridHeaders, gridHeader)) {
      const header = gridHeaders[gridHeader];
      const width = (header.size + 100);
      x = index === 0 ? x : x + width; // TODO: the + 100 can differ for size ranges perhaps
      columnXStart[gridHeader] = x;
      columnWidth[gridHeader] = width;
      doc
          .font(lightFont)
          .fontSize(fontSize)
          .fillColor(headerColor)
          .text(header.name, columnXStart[gridHeader], y, {
            width: width,
            align: "left",
          });
      index++;
    }
  }
  y += incrementY;

  for (let i = 1; value.length > i; i++) {
    const gridObject = value[i];
    if (gridObject.lineType === constants.PDFDocumentLineType.END_LINE) {
      y += constants.INCREMENT_SUB_Y;
    }
    doc.font(boldFont).fontSize(fontSize).fillColor(headerColor)
        .text(gridObject.value, columnXStart[gridObject["column"]], y, {
          width: columnWidth[gridObject["column"]],
          align: "left",
        });
  }
  y += incrementY;
  return sectionTypeLogic.docYResponse(doc, y);
}
