"use strict";

const fs = require("fs");

const packageName = require("../package.json").name;

function getPackagePath() {
  let PACKAGE_PATH = `node_modules/${packageName}/`;
  if (!fs.existsSync(PACKAGE_PATH)) {
    PACKAGE_PATH = "";
  }
  return PACKAGE_PATH;
}

const PDFType = {
  DEFAULT: 0,
  CONTENTS_OF_PAGE: 1,
  NO_SERVICE_RESPONSE_HEADER: 2,
  COVER_PAGE: 3,
  COVER_AND_CONTENTS_OF_PAGE: 4,
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
  INDICATIVE_BAR_LINE: 13,
  IMAGE_LINE: 14,
  PAGE_BREAK: 15,
  CHART_LINE: 16,
  H0_LINE: 17,
  H1_LINE: 18,
  H2_LINE: 19,
  H3_LINE: 20,
  KEY_ICON_LINE: 21,
};

const PDFTableType = {
  DEFAULT: 0,
  COVER: 1,
};

const PDFTableColumnTextAlign = {
  LEFT: 0,
  RIGHT: 1,
};

const PDFImageType = {
  DEFAULT: 0,
  CENTER: 1,
};

const PD = {
  WIDTH: 595.28, // old style search/response
  HEIGHT: 841.89,
  MARGIN: 20,
  PADDING: 10,
};

const PDColors = {
  TEXT_DEF: "#666666", // old style search/response
  TEXT_LIGHT: "#EEEEEE",
  TEXT_DARK: "#666666",
  BG_LIGHT: "#EEEEEE",
  BG_DARK: "#666666",
};

module.exports = Object.freeze({
  PACKAGE_PATH: getPackagePath(),
  // Where the page starts
  TOP_OF_PAGE_Y: 80,
  TOP_OF_FIRST_PAGE_Y: 120,
  X_START: 20,

  // Normal Information
  INCREMENT_MAIN_Y: 16,

  // Usually meta data of sections
  INCREMENT_SUB_Y: 12,

  // Spacing between text and the line below it
  INCREMENT_UNDERLINE: 13,

  HEADER_FONT_SIZE: 12,
  NORMAL_FONT_SIZE: 8,

  // INCREMENT_MAIN_Y: 18,
  // INCREMENT_SUB_Y: 14,
  // INCREMENT_UNDERLINE: 15,

  // HEADER_FONT_SIZE: 16,
  // NORMAL_FONT_SIZE: 10,

  PDFType,
  PDFDocumentLineType,
  PDFTableType,
  PDFTableColumnTextAlign,
  PDFImageType,
  PD,
  PDColors,

  // Colors used in Footer and Disclaimer are not currently covered here
  PDFColors: {
    NORMAL_COLOR: "#888888",
    INDICATIVE_COLOR: "black",
    TEXT_IN_NORMAL_COLOR: "white",
  },

  PDFDocumentLineRules: { // Future Idea
    ALWAYS_NEW_PAGE: 0,
  },

  PDF_TEXT: {
    REPORT_AUTHOR: "ThisIsMe (Pty) Ltd",
    // REPORT_HEADERS: ["Search Parameters:", "Service Response:"],
    REGISTRATION: "Registration Number: 2014/136237/07, Vat Registration: 4170271870, Tel: +27 21 422 3995, Email: info@thisisme.com",
    DISCLAIMER: "Please review ThisIsMe's Privacy Policy as well as Terms & Conditions https://thisisme.com/legal/. All Rights Reserved.",
  },
});
