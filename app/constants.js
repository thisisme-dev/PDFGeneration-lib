const fs = require('fs');

const packageName = require('../package.json').name;

function getPackagePath() {
  console.log(packageName);
  let PACKAGE_PATH = `node_modules/${packageName}/`;
  if (!fs.existsSync(PACKAGE_PATH)) {
    PACKAGE_PATH = '';
  }
  return PACKAGE_PATH;
}

const PDFType = {
  DEFAULT: 0, // old style search/response
  CONTENTS_OF_PAGE: 1,
  NO_SERVICE_RESPONSE_HEADER: 2,
  // COVER_CONTENTS_OF_HEADER: 3, NEAR FUTURE
};

const PDFDocumentLineType = {
  DEFAULT_LINE: 0,
  HEADER_LINE: 1,
  KEY_VALUE_LINE: 2,
  EMPTY_LINE: 3,
  ADDRESS_LINE: 4,
  COLUMN_INFO: 5,
  META_INFO: 6,
  SINGLE_COLUMN: 7,
  DOUBLE_COLUMN: 8,
  END_LINE: 9,
  GRID: 10,
  TABLE_OF_CONTENTS_LINE: 11,
  KEY_LINK_LINE: 12,
};

module.exports = Object.freeze({
  PACKAGE_PATH: getPackagePath(),
  // Where the page starts
  TOP_OF_PAGE_Y: 80,
  X_START: 20,

  // Normal Information
  INCREMENT_MAIN_Y: 18,

  // Usually meta data of sections
  INCREMENT_SUB_Y: 14,

  // Spacing between text and the line below it
  INCREMENT_UNDERLINE: 15,

  HEADER_FONT_SIZE: 16,
  NORMAL_FONT_SIZE: 10,

  PDFType,
  PDFDocumentLineType,

  // Colors used in Footer and Disclaimer are not currently covered here
  PDFColors: {
    NORMAL_COLOR: '#888888',
    INDICATIVE_COLOR: 'black',
    TEXT_IN_NORMAL_COLOR: 'white',
  },

  PDFDocumentLineRules: { // Future Idea
    ALWAYS_NEW_PAGE: 0,
  },

  PDF_TEXT: {
    REPORT_AUTHOR: 'ThisIsMe (Pty) Ltd',
    REPORT_HEADERS: ['Search Parameters:', 'Service Response:'],
  },
});
