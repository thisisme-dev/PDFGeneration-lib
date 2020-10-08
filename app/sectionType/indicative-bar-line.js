// WARNING: this is a WIP, this was created for 6 bar elements, less than that the indicator will not be placed correctly
const constants = require('../constants');
const sectionTypeLogic = require('./base-logic');

module.exports = {
  generateLineThatIsIndicativeBar,
};

// Current element height is 180 (rectangle) + incrementY
function generateLineThatIsIndicativeBar(doc, x, y, text, value, incrementY, getDocY) {
  const docY = getDocY(doc, y, incrementY, 1, false);
  doc = docY.doc;
  y = docY.y;
  // text = "Credit Score";
  // value = examplePayload();
  return populateIndicativeBar(doc, x, y, incrementY, text, value);
}

function populateIndicativeBar(doc, x, y, incrementY, label, barOptions) {
  const maxWidth = 550;
  const piece = maxWidth/getBarLength(barOptions);
  const fixPortion = x + 2.5;
  const maxWidthLabel = doc.page.width;

  let barAdditionalIncrementX = 0;
  if (Object.prototype.hasOwnProperty.call(barOptions, 'additionalIncrementX')) {
    barAdditionalIncrementX = parseInt(barOptions.additionalIncrementX)
  }

  let pointerAdditionalIncrementX = 0;
  if (Object.prototype.hasOwnProperty.call(barOptions, 'pointer')) {
    if (Object.prototype.hasOwnProperty.call(barOptions['pointer'], 'additionalIncrementX')) {
      pointerAdditionalIncrementX = parseInt(barOptions.pointer.additionalIncrementX)
    }
  }

  y += incrementY/2;

  doc = createBackgroundRectangle(doc, maxWidthLabel, y);

  doc.font('OpenSansBold').fillColor(constants.PDFColors.NORMAL_COLOR).fontSize(22).text(label, constants.X_START + 2, y, {
    width: maxWidthLabel,
    lineGap: 10,
    align: 'left',
    ellipsis: true,
  });

  y += 180;
  if (Object.prototype.hasOwnProperty.call(barOptions, 'text')) {
    doc.font('OpenSansBold').fillColor(barOptions.text.color).fontSize(20).text(barOptions.text.description, 0, y - 145, {
      width: maxWidthLabel,
      lineGap: 10,
      align: 'center',
      ellipsis: true,
    });

    doc.font('OpenSansBold').fillColor(constants.PDFColors.NORMAL_COLOR).fontSize(20).text(barOptions.text.value, 0, y - 120, {
      width: maxWidthLabel,
      lineGap: 10,
      align: 'center',
      ellipsis: true,
    });
  }

  if (Object.prototype.hasOwnProperty.call(barOptions, 'bar')) {
    // define all colors in values, and the color, iterate properties and create butt for each key
    const barProps = barOptions.bar
    for (const key in barProps) {
      const color = barProps[key].color;
      if (Object.prototype.hasOwnProperty.call(barProps, key)) {

        const labelX = piece * parseInt(key) + barAdditionalIncrementX + fixPortion

        // this is a description of the section
        doc.font('OpenSansBold').fillColor(constants.PDFColors.NORMAL_COLOR).fontSize(constants.NORMAL_FONT_SIZE).text(barProps[key].text, labelX, y - 70, {
          width: 92.5,
          lineGap: 10,
          align: 'center',
          ellipsis: true,
        });

        // this is another description of the section
        doc.font('OpenSansBold').fillColor(constants.PDFColors.NORMAL_COLOR).fontSize(constants.NORMAL_FONT_SIZE).text(barProps[key].range, labelX, y - 55, {
          width: 92.5,
          lineGap: 10,
          align: 'center',
          ellipsis: true,
        });

        // this is the actual block creation for the bar
        doc.lineWidth(constants.HEADER_FONT_SIZE)
          .lineCap('butt')
          .moveTo((piece * parseInt(key)) + fixPortion, y - 20)
          .lineTo(piece * (parseInt(key) + 1) + fixPortion, y - 20)
          .fillOpacity(1)
          .fillAndStroke(color, color);
      }
    }
  }

  if (Object.prototype.hasOwnProperty.call(barOptions, 'pointer')) {
    const incrementIndicator = piece * parseInt(barOptions.pointer.target) + pointerAdditionalIncrementX;
    doc = createIndicativeTriangle(doc, incrementIndicator, y);
  }
  y += incrementY/2;

  return sectionTypeLogic.docYResponse(doc, y);
}

function createBackgroundRectangle(doc, maxWidthLabel, y){
  doc.rect(
    20,
    y,
    maxWidthLabel - 40,
    180,
  ).fillColor('#F9F9F9').strokeColor(constants.PDFColors.NORMAL_COLOR).fillAndStroke();
  return doc;
}

function getBarLength(barOptions) {
  if (Object.prototype.hasOwnProperty.call(barOptions, 'bar')) {
    return Object.keys(barOptions.bar).length
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

  doc.lineWidth(6).polygon([xTop, yTop], [xLeft, yBottom], [xRight, yBottom]).fillOpacity(1).fillAndStroke('white', 'white');
  return doc;
}

// example valueObject
function examplePayload() {
  return {
    bar: {
      0: {
        color: '#FF0000',
        text: 'VERY HIGH',
        range: '<= 625',        
      },
      1: {
        color: '#FF6666',
        text: 'HIGH',
        range: '626-640',             
      },
      2: {
        color: '#f5bd1f',
        text: 'AVERAGE',
        range: '641-654',    
      },
      3: {
        color: '#98ffa8',
        text: 'LOW',
        range: '655-666',     
      },
      4: {
        color: '#66FF66',
        text: 'MINIMUM',
        range: '> 666',        
      },
      5: {
        color: '#89cff0',
        text: 'INSUFFICIENT',
        range: '?',        
      },
    },
    pointer: {
      target: 5,
      additionalIncrementX: 0,
    },
    text: {
      value: 644,
      description: 'AVERAGE RISK',
      color: '#f5bd1f',
    },
    additionalIncrementX: 0,
  }
}