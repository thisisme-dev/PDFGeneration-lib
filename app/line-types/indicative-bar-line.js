"use strict";

// WARNING: this is a WIP, this was created for 6 bar elements, less than that the indicator will not be placed correctly
const constants = require("../constants");

const sectionTypeLogic = require("./base-logic");

module.exports = {
  generateLineThatIsIndicativeBar,
};

function generateLineThatIsIndicativeBar(doc, x, y, text, value) {
  const docY = doc.getDocY(constants.PDFDocumentLineType.INDICATIVE_BAR_LINE, y, 1, false);
  doc = docY.doc;
  y = docY.y;
  return populateIndicativeBar(doc, x, y, text, value);
}

function populateIndicativeBar(doc, x, y, label, barOptions) {
  const incrementY = constants.INCREMENT_MAIN_Y;
  const {fontSize, boldFont} = sectionTypeLogic.setComponentFont("OpenSansBold", null, constants.NORMAL_FONT_SIZE);

  const maxWidth = 550;
  const piece = maxWidth / getBarLength(barOptions);
  const fixPortion = x + 2.5;
  const maxWidthLabel = doc.page.width;

  let barAdditionalIncrementX = 0;
  if (Object.prototype.hasOwnProperty.call(barOptions, "additionalIncrementX")) {
    barAdditionalIncrementX = parseInt(barOptions.additionalIncrementX);
  }

  let pointerAdditionalIncrementX = 0;
  if (Object.prototype.hasOwnProperty.call(barOptions, "pointer")) {
    if (Object.prototype.hasOwnProperty.call(barOptions["pointer"], "additionalIncrementX")) {
      pointerAdditionalIncrementX = parseInt(barOptions.pointer.additionalIncrementX);
    }
  }

  y += incrementY / 2;

  doc = createBackgroundRectangle(doc, maxWidthLabel, y);

  y += 80;
  if (Object.prototype.hasOwnProperty.call(barOptions, "text")) {
    doc.font(boldFont).fillColor(barOptions.text.color).fontSize(14).text(`CREDIT SCORE: ${barOptions.text.value} ( ${barOptions.text.description} )`, 0, y - 75, {
      width: maxWidthLabel,
      lineGap: 10,
      align: "center",
      ellipsis: true,
    });
  }

  if (Object.prototype.hasOwnProperty.call(barOptions, "bar")) {
    // define all colors in values, and the color, iterate properties and create butt for each key
    const barProps = barOptions.bar;
    for (const key in barProps) {
      if (Object.prototype.hasOwnProperty.call(barProps, key)) {
        const color = barProps[key].color;
        const labelX = piece * parseInt(key) + barAdditionalIncrementX + fixPortion;

        // this is a description of the section
        doc.font(boldFont).fillColor(constants.PDFColors.NORMAL_COLOR).fontSize(fontSize).text(barProps[key].text, labelX, y - 50, {
          width: 92.5,
          lineGap: 10,
          align: "center",
          ellipsis: true,
        });

        // this is another description of the section
        doc.font(boldFont).fillColor(constants.PDFColors.NORMAL_COLOR).fontSize(fontSize).text(barProps[key].range, labelX, y - 40, {
          width: 92.5,
          lineGap: 10,
          align: "center",
          ellipsis: true,
        });

        // this is the actual block creation for the bar
        doc.lineWidth(constants.HEADER_FONT_SIZE)
            .lineCap("butt")
            .moveTo((piece * parseInt(key)) + fixPortion, y - 20)
            .lineTo(piece * (parseInt(key) + 1) + fixPortion, y - 20)
            .fillOpacity(1)
            .fillAndStroke(color, color);
      }
    }
  }

  if (Object.prototype.hasOwnProperty.call(barOptions, "pointer")) {
    const incrementIndicator = piece * parseInt(barOptions.pointer.target) + pointerAdditionalIncrementX;
    doc = createIndicativeTriangle(doc, incrementIndicator, y);
  }
  y += incrementY / 2;

  return sectionTypeLogic.docYResponse(doc, y);
}

function createBackgroundRectangle(doc, maxWidthLabel, y) {
  doc.roundedRect(20, y, maxWidthLabel - 40, 80, 2)
      .fillColor(constants.PDColors.BG_LIGHT)
      .fill();

  return doc;
}

function getBarLength(barOptions) {
  if (Object.prototype.hasOwnProperty.call(barOptions, "bar")) {
    return Object.keys(barOptions.bar).length;
  }
  return 1;
}

// Creates an indicative triangle on the bar to show the position of the value
function createIndicativeTriangle(doc, incrementIndicator, y) {
  const xLeft = 66.5 + incrementIndicator;
  const xTop = 68.5 + incrementIndicator;
  const xRight = 70.5 + incrementIndicator;

  const yTop = y - 17;
  const yBottom = y - 14;

  doc.lineWidth(6).polygon([xTop, yTop], [xLeft, yBottom], [xRight, yBottom]).fillOpacity(1).fillAndStroke("white", "white");
  return doc;
}
