const constants = require('./constants');

module.exports = {
  addLine: (lineDocY, text, value, lineType, isDefinedHeader) => {
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
            return createNewPage(doc);
          }
        }

        if (rowsIncrementY + currentY > noFooterLimit) {
          return createNewPage(doc);
        }
      }
      return docYResponse(doc, currentY);
    }

    let doc = lineDocY.doc;
    let y = lineDocY.y;
    let incrementY = constants.INCREMENT_MAIN_Y;
    let x = constants.X_START;
    const headerColor = constants.PDF_TEXT.REPORT_HEADERS.includes(text) || lineType === constants.PDFDocumentLineType.HEADER_LINE ? constants.PDFColors.INDICATIVE_COLOR : constants.PDFColors.NORMAL_COLOR;

    // A type should ALWAYS start with the getDocY function to ensure you are correctly positioned
    switch (lineType) {
      case constants.PDFDocumentLineType.EMPTY_LINE: { // TODO: NEW
        const docY = getDocY(doc, y, incrementY, 1, false);
        doc = docY.doc;
        y = docY.y;
        if (y > constants.TOP_OF_PAGE_Y) {
          y += incrementY;
        }
        break;
      }
      case constants.PDFDocumentLineType.END_LINE: {
        const docY = getDocY(doc, y, incrementY, 1, false);
        doc = docY.doc;
        y = docY.y;
        if (y > constants.TOP_OF_PAGE_Y) {
          y += incrementY;
        }
        break;
      }
      case constants.PDFDocumentLineType.HEADER_LINE: {
        const docY = getDocY(doc, y, incrementY, 1, false);
        doc = docY.doc;
        y = docY.y;
        doc = populateLine(doc, headerColor, text, value, x, 180, y, true);
        // y += incrementY;
        break;
      }
      case constants.PDFDocumentLineType.ADDRESS_LINE: {
        let addressParts = value.split(',');
        addressParts = addressParts.map((s) => s.trim());
        addressParts = addressParts.filter((s) => s.length > 0);

        const docY = getDocY(doc, y, incrementY, addressParts.length, false);
        doc = docY.doc;
        y = docY.y;

        doc = populateLine(doc, headerColor, text, '', x, 180, y, false);
        for (let i = 0; i < addressParts.length; i++) {
          const addressPart = addressParts[i];
          doc = populateLine(doc, headerColor, '', addressPart, x, 180, y, false);
          if (i < addressParts.length - 1) {
            doc = underline(doc, x, y);
            y += incrementY;
          }
          doc = underline(doc, x, y);
        }
        y += incrementY;
        break;
      }
      case constants.PDFDocumentLineType.COLUMN_INFO:
      case constants.PDFDocumentLineType.META_INFO: {
        if (value.length > 0) {
          const sections = generateSections(value);
          let sectionHeaderPrinted = false;
          for (const key in sections) {
            if (Object.prototype.hasOwnProperty.call(sections, key)) {
              const value = sections[key];
              const customRows = getSectionRows(value) + (sectionHeaderPrinted ? 0 : 1);
              incrementY = constants.INCREMENT_SUB_Y;
              const docY = getDocY(doc, y, incrementY, customRows, true);
              doc = docY.doc;
              y = docY.y;
              if (y > constants.TOP_OF_PAGE_Y) {
                y += incrementY;
              }
              if (!sectionHeaderPrinted) {
                const isFancyHeader = (lineType === constants.PDFDocumentLineType.COLUMN_INFO);
                doc = populateLine(doc, constants.PDFColors.INDICATIVE_COLOR, text, null, x, 180, y, isFancyHeader);
                sectionHeaderPrinted = true;
                if (!isFancyHeader) {
                  y += (lineType === constants.PDFDocumentLineType.COLUMN_INFO) ? constants.INCREMENT_MAIN_Y : constants.INCREMENT_SUB_Y;
                }
              }

              // TODO: (Warning) Monitor this with the rows when singles and doubles start mixing positions
              const linesEnded = []; // lines ended
              const onlyFirsts = []; // only first columns, try remember what this does?
              const singleColumns = [];
              let finalIncrementYRequired = false;
              for (let i = 0; i < value.length; i++) {
                const column = (i - linesEnded.length - onlyFirsts.length - singleColumns.length) % 2;
                const subLine = value[i];
                if (subLine.lineType === constants.PDFDocumentLineType.SINGLE_COLUMN) {
                  // console.log(`SINGLE COLUMN - ${column}`);
                  if (column !== 0) { // I HATE THIS, might have had dual column before this, that only had one column in, so increment never took place
                    y += incrementY;
                  }
                  doc = populateLine(doc, constants.PDFColors.NORMAL_COLOR, subLine.text, subLine.value, 20, 140, y, false);
                  // doc = underline(doc, x, y); this was for testing
                  y += incrementY;
                  singleColumns.push(true);
                } else {
                  if (column === 0) {
                    // console.log(`DUAL - 1st COLUMN - ${column}`);
                    x = 20;
                    finalIncrementYRequired = true;
                  } else {
                    // console.log(`DUAL - 2nd COLUMN - ${column}`);
                    x = 300;
                    finalIncrementYRequired = false;
                  }
                  // const headerColor = lineType === constants.PDFDocumentLineType.HEADER_LINE ? constants.PDFColors.INDICATIVE_COLOR : constants.PDFColors.NORMAL_COLOR;
                  doc = populateLine(doc, constants.PDFColors.NORMAL_COLOR, subLine.text, subLine.value, x, 140, y, false);
                  // doc = underline(doc, x, y); this was for testing
                  if (column !== 0) {
                    y += incrementY;
                  }
                }
              }
              if (finalIncrementYRequired) {
                // console.log("finished 1st column only increment fix");
                y += incrementY;
              }
            }
          }
        }
        break;
      }
      case constants.PDFDocumentLineType.GRID: { // TODO: requires validating new headers for page space
        const itemCountToFormRow = (Object.keys(value[0]).length + 1); // keys + END_LINE to go to next row
        const gridRowsWithoutHeader = ((value.length - 1)/itemCountToFormRow);
        const headerRow = isDefinedHeader ? 0 : 1;
        const docY = getDocY(doc, y, incrementY, gridRowsWithoutHeader + headerRow, true);
        doc = docY.doc;
        y = docY.y;

        doc = populateLine(doc, constants.PDFColors.INDICATIVE_COLOR, text, null, x, 180, y, isDefinedHeader);
        if (!isDefinedHeader) {
          y += incrementY;
        }
        const gridHeaders = value[0];
        const columnWidth = {};
        const columnXStart = {};
        let index = 0;
        for (const gridHeader in gridHeaders) {
          if (Object.prototype.hasOwnProperty.call(gridHeaders, gridHeader)) {
            const header = gridHeaders[gridHeader];
            x = index === 0 ? x : x + (header.size + 100); // TODO: the + 100 can differ for size ranges perhaps
            columnXStart[gridHeader] = x;
            columnWidth[gridHeader] = (header.size + 100);
            doc.font('OpenSansSemiBold').fontSize(constants.NORMAL_FONT_SIZE).fillColor(headerColor)
                .text(header.name, columnXStart[gridHeader], y, {
                  width: (header.size + 100),
                  align: 'right',
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
          doc.font('OpenSansLight').fontSize(constants.NORMAL_FONT_SIZE).fillColor(headerColor)
              .text(gridObject.value, columnXStart[gridObject['column']], y, {
                width: columnWidth[gridObject['column']],
                align: 'right',
              });
        }
        y += incrementY;
        break;
      }
      case constants.PDFDocumentLineType.TABLE_OF_CONTENTS_LINE: {
        const docY = getDocY(doc, y, incrementY, 1, false);
        doc = docY.doc;
        y = docY.y;
        doc = populateLine(doc, headerColor, text, '', x, 180, y, false);
        doc = populateLine(doc, headerColor, value, '', 550, 180, y, false);
        doc = underline(doc, x, y);
        y += incrementY;
        break;
      }
      case constants.PDFDocumentLineType.KEY_LINK_LINE: {
        const docY = getDocY(doc, y, incrementY, 1, false);
        doc = docY.doc;
        y = docY.y;
        doc = populateLineLink(doc, headerColor, text, value, x, 180, y);
        doc = underline(doc, x, y);
        y += incrementY;
        break;
      }
      default: {
        const docY = getDocY(doc, y, incrementY, 1, false);
        doc = docY.doc;
        y = docY.y;
        doc = populateLine(doc, headerColor, text, value, x, 180, y, false);
        doc = underline(doc, x, y);
        y += incrementY;
      }
    }
    return docYResponse(doc, y);
  },
};

// TODO: (warning) https://eslint.org/docs/rules/no-prototype-builtins
function generateSections(value) {
  function pushToSection(sections, index, rowData) {
    if (Object.prototype.hasOwnProperty.call(sections, index)) {
      sections[index].push(rowData);
    } else {
      sections[index] = [];
      sections[index].push(rowData);
    }
  }
  const sections = {};
  let sectionIndex = 0;
  for (let row = 0; row < value.length; row++) {
    const rowData = value[row];
    if (rowData.lineType === constants.PDFDocumentLineType.END_LINE) {
      sectionIndex++;
      continue;
    }
    pushToSection(sections, sectionIndex, rowData);
  }
  return sections;
}

function getSectionRows(value) {
  let customRows = 0;
  if (Array.isArray(value)) {
    for (let row = 0; row < value.length; row++) {
      const rowData = value[row];
      if (rowData.lineType === constants.PDFDocumentLineType.SINGLE_COLUMN) {
        if (customRows % 1 !== 0) { // caters for when colums end unequal
          customRows += 0.5;
        }
        customRows++;
      } else {
        customRows += 0.5;
      }
    }
    if (customRows % 1 !== 0) { // caters for when colums end unequal
      customRows += 0.5;
    }
    // console.log(`Value's length ${value.length} customRow's value ${customRows}`);
  } else {
    // console.log("Value is not an Array as expected")
  }
  return customRows;
}

function populateLine(doc, headerColor, text, value, x, xAdditionalWidth, y, isHeaderType /* isDefinedHeader or HEADER_LINE*/) {
  let size = constants.NORMAL_FONT_SIZE;
  if (isHeaderType) {
    size = constants.HEADER_FONT_SIZE;
    const page = doc.page;
    // TODO: CHOOSE HEADER
    // full block
    // doc.rect(0, 0, page.width, constants.INCREMENT_MAIN_Y + 15).fillColor(constants.PDFColors.NORMAL_COLOR).strokeColor(constants.PDFColors.NORMAL_COLOR).fillAndStroke();
    // thin block
    doc.rect(0, 25, page.width, 50).fillColor(constants.PDFColors.NORMAL_COLOR).strokeColor(constants.PDFColors.NORMAL_COLOR).fillAndStroke();
    doc.font('OpenSansSemiBold').fontSize(size).fillColor(constants.PDFColors.TEXT_IN_NORMAL_COLOR).text(text, x, y - 40);
  } else {
    doc.font('OpenSansSemiBold').fontSize(size).fillColor(headerColor).text(text, x, y);
    doc.font('OpenSansLight').fontSize(size).text(value, x + xAdditionalWidth, y, {
      width: 370,
      lineGap: 10,
      ellipsis: true,
    });
  }

  return doc;
}


function populateLineLink(doc, headerColor, text, value, x, xAdditionalWidth, y) {
  const size = constants.NORMAL_FONT_SIZE;
  doc.font('OpenSansSemiBold').fontSize(size).fillColor(headerColor).text(text, x, y);
  // DejaVuSans russian chinese etc
  // console.log(value)
  doc.font('OpenSansLight').fontSize(size).text(value.piece, x + xAdditionalWidth, y, {
    width: 370,
    lineGap: 10,
    ellipsis: true,
    link: value.link,
  });

  return doc;
}

function underline(doc, x, y) {
  return doc.moveTo(x, y + constants.INCREMENT_UNDERLINE)
      .lineTo(doc.page.width - 20, y + constants.INCREMENT_UNDERLINE)
      .strokeColor('#CCCCCC')
      .lineWidth(.025)
      .stroke();
}

function createNewPage(doc) {
  // console.log('space ran out, moving to new page');
  // console.log('===================================');

  doc.addPage();
  // doc.fillColor(constants.PDFColors.NORMAL_COLOR); // whut TODO:
  return docYResponse(doc, constants.TOP_OF_PAGE_Y);
}

function docYResponse(doc, y) {
  return {
    doc: doc,
    y: y,
  };
}
