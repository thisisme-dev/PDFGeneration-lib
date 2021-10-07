"use strict";

const constants = require("../constants");
const sectionTypeLogic = require("./base-logic");

module.exports = {
  generateLineThatIsGrid,
};

function generateLineThatIsGrid(doc, x, y, text, value, isNewPageHeader, headerColor, font) {
  const itemCountToFormRow = (Object.keys(value[0]).length + 1); // keys + END_LINE to go to next row
  const gridRowsWithoutHeader = ((value.length - 1) / itemCountToFormRow);
  const headerRow = isNewPageHeader ? 0 : 1;

  const incrementY = constants.INCREMENT_MAIN_Y;
  const docY = doc.getDocY(constants.PDFDocumentLineType.GRID, y, gridRowsWithoutHeader + headerRow, true);

  doc = docY.doc;
  y = docY.y;

  if (text !== null && text !== undefined) {
    if (text.length > 0) {
      if (isNewPageHeader) {
        doc = sectionTypeLogic.populateHLine(doc, text, x, y, constants.PDFDocumentLineType.H1_LINE);
        y += 40;
      } else {
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
  return doc.docYResponse(y);
}
