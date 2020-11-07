const constants = require('../constants');
const sectionTypeLogic = require('./base-logic');

module.exports = {
  generateLineThatIsObject,
};

function generateLineThatIsObject(doc, x, y, text, value, lineType, incrementY, getDocY) {
  if (value.length > 0) {
    const sections = generateSections(value);
    let sectionHeaderPrinted = false;
    for (const key in sections) {
      if (Object.prototype.hasOwnProperty.call(sections, key)) {
        const value = sections[key];
        const sectionRowCount = getSectionRowCount(value) + (sectionHeaderPrinted ? 0 : 1);
        incrementY = constants.INCREMENT_SUB_Y;
        const docY = getDocY(doc, y, incrementY, sectionRowCount, true);
        doc = docY.doc;
        y = docY.y;
        if (y > constants.TOP_OF_PAGE_Y) {
          y += incrementY;
        }
        if (!sectionHeaderPrinted) {
          const isFancyHeader = (lineType === constants.PDFDocumentLineType.COLUMN_INFO);
          doc = sectionTypeLogic.populateLine(doc, constants.PDFColors.INDICATIVE_COLOR, text, null, x, 180, y, isFancyHeader);
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
            doc = sectionTypeLogic.populateLine(doc, constants.PDFColors.NORMAL_COLOR, subLine.text, subLine.value, 20, 140, y, subLine.font);
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
            doc = sectionTypeLogic.populateLine(doc, constants.PDFColors.NORMAL_COLOR, subLine.text, subLine.value, x, 140, y, subLine.font);
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

  return sectionTypeLogic.docYResponse(doc, y);
}

// TODO: (warning) https://eslint.org/docs/rules/no-prototype-builtins
// generateSections : Generates sections to ease handling of cases in COLUMN_INFO and META_INFO
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

// getSectionRowCount : Counts the unique rows for sections to ease handling of cases in COLUMN_INFO and META_INFO
function getSectionRowCount(value) {
  let sectionRowCount = 0;
  if (Array.isArray(value)) {
    for (let row = 0; row < value.length; row++) {
      const rowData = value[row];
      if (rowData.lineType === constants.PDFDocumentLineType.SINGLE_COLUMN) {
        if (sectionRowCount % 1 !== 0) { // caters for when colums end unequal
          sectionRowCount += 0.5;
        }
        sectionRowCount++;
      } else {
        sectionRowCount += 0.5;
      }
    }
    if (sectionRowCount % 1 !== 0) { // caters for when colums end unequal
      sectionRowCount += 0.5;
    }
    // console.log(`Value's length ${value.length} customRow's value ${customRows}`);
  } else {
    // console.log("Value is not an Array as expected")
  }
  return sectionRowCount;
}
