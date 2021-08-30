"use strict";

const PDFDocument = require("./library-override/pdfkit-customized");

const constants = require("./constants");

class PDFLimiter {
  constructor() {
    // move function to break into array here, add vars with a constructor?
    const doc = new PDFDocument({
      bufferPages: true,
      size: "A4",
      margin: 0,
    });
    doc.fontSize(constants.NORMAL_FONT_SIZE);

    this.doc = doc;
    this.max = 375 /* max width */ - constants.X_START;
  }

  // destroyLimitationsDoc(doc) {
  //   doc.end();
  // }

  fullyDecodeURI(uri) {
    function checkEncodeURI(str) {
      return /%/i.test(str);
    }
    if (checkEncodeURI(uri)) {
      return "URL has undisplayable characters, click on this text to open link";
    }
    return uri;
  }

  getStringWidth(text) {
    // check guide page 34
    const width = this.doc.widthOfString(text);
    return width;
  }

  splitLongWord(text) {
    // Specifically created for URLs in mind, use with caution
    return this.splitString(text, "");
  }

  splitLongText(text) {
    return this.splitString(text, " ");
  }

  splitString(text, splitter) {
    // TODO: incorporate splitLongWord into this function.
    text = text.toString().trim().replace(/(\r\n|\n|\r)/gm, "").replace(/\s\s+/g, " ").replace(/\s/g, " ");
    const firstLine = "1";
    const lines = {};
    if (this.getStringWidth(text) <= this.max) {
      lines[firstLine] = text;
    } else {
      lines[firstLine] = "";
      const textPieces = text.split(splitter);
      let line = 1;
      for (let i = 0; i < textPieces.length; i++) {
        const piece = textPieces[i];
        if (piece.trim().length === 0) {
          continue;
        }
        const possibleNewLine = (lines[line] === undefined) ? `${splitter}${piece}` : `${lines[line]}${splitter}${piece}`;
        if (this.getStringWidth(possibleNewLine) <= this.max) {
          lines[`${line}`] = possibleNewLine;
        } else {
          if (this.getStringWidth(piece) >= this.max) {
            const wordPieces = this.splitLongWord(piece);
            line++;
            for (let j = 0; j < wordPieces.length; j++) {
              lines[`${line - 1}.${j + 1}`] = wordPieces[j];
            }
          } else {
            line++;
            lines[`${line}`] = `${piece}`;
          }
        }
      }
    }
    const keysSorted = Object.keys(lines).sort(function(a, b) {
      return parseFloat(a) - parseFloat(b);
    });
    const array = [];
    for (let j = 0; j < keysSorted.length; j++) {
      array.push(lines[keysSorted[j]].trim());
    }
    return array;
  }
}

module.exports.PDFLimiter = PDFLimiter;
