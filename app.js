const fs = require('fs');

const PDFDocument = require('pdfkit');
const concat = require('concat-stream');
const bwipjs = require('bwip-js');

const AWS = require('aws-sdk');
const s3 = new AWS.S3();
AWS.config.update({region: process.env.AWS_DEFAULT_REGION});

const packageName = require('./package.json').name;

let PACKAGE_PATH = `node_modules/${packageName}/`;
if (!fs.existsSync(PACKAGE_PATH)) {
  PACKAGE_PATH = '';
}

const TOP_OF_PAGE_Y = 80;
const INCREMENT_MAIN_Y = 22;
const INCREMENT_SUB_Y = 18;

const PDFDocumentLineType = {
  DEFAULT_LINE: 0,
  HEADER_LINE: 1,
  KEY_VALUE_LINE: 2,
  EMPTY_LINE: 3,
  ADDRESS_LINE: 4,
  COLUMN_INFO: 5,
  SUB_INFO: 6,
  SINGLE_COLUMN: 7,
  DOUBLE_COLUMN: 8,
  END_LINE: 9,
};
Object.freeze(PDFDocumentLineType);

const PDFDocumentLineRules = { // Future Idea
  ALWAYS_NEW_PAGE: 0,
};
Object.freeze(PDFDocumentLineRules);

function textValueObj(text, value, lineType) {
  return {
    text: text,
    value: value,
    lineType: lineType,
  };
}

const PDF_TEXT = {
  REPORT_AUTHOR: 'ThisIsMe (Pty) Ltd',
  REPORT_HEADERS: ['Search Parameters:', 'Service Response:'],
};

module.exports = {
  PDFDocumentLineType,
  textValueObj,
  getPDFContentTemplate: (requestTimestamp, event, dataSource, errMsg, newPageHeaders) => {
    return {
      requestTimestamp: requestTimestamp,
      error: errMsg,
      reportGeneratedFor: `${event.requester.client} @ ${event.requester.company}`,
      dataSource: dataSource,
      searchParams: {},
      dataFound: {},
      requestId: event.request_id,
      newPageHeaders: newPageHeaders,
    };
  },
  generateReport: async (reportContent, reportMeta) => {
    const requestID = reportContent.requestId;
    let docY = createPDFDocument(requestID, reportMeta.reportName);
    docY = defaultTop(docY, reportContent);
    docY = addDefaultLine(docY, 'Service Response:', null);
    docY = addPageDetail(docY, reportContent['dataFound'], reportContent.newPageHeaders);
    docY.doc = await addPageFooter(docY, requestID, reportMeta.disclaimer);
    return finalizePDFDocument(docY.doc, requestID, reportMeta);
  },
  generateNoResultsReport: async (reportContent, reportMeta) => {
    const requestID = reportContent.requestId;
    let docY = createPDFDocument(requestID, reportMeta.reportName);
    docY = defaultTop(docY, reportContent);
    docY.doc = await addPageFooter(docY, requestID, reportMeta.disclaimer);
    return finalizePDFDocument(docY.doc, requestID, reportMeta);
  },
};

function createPDFDocument(requestID, reportName) {
  const doc = new PDFDocument({
    bufferPages: true,
    size: 'A4',
    info: {
      Title: requestID,
      Author: PDF_TEXT.REPORT_AUTHOR,
    },
    margin: 0,
  });

  doc.registerFont('OpenSans', `${PACKAGE_PATH}fonts/OpenSans-Regular.ttf`);
  doc.registerFont('OpenSansLight', `${PACKAGE_PATH}fonts/OpenSans-Light.ttf`);
  doc.registerFont('OpenSansBold', `${PACKAGE_PATH}fonts/OpenSans-Bold.ttf`);
  doc.registerFont('OpenSansSemiBold', `${PACKAGE_PATH}fonts/OpenSans-SemiBold.ttf`);
  doc.registerFont('OpenSansXBold', `${PACKAGE_PATH}fonts/OpenSans-ExtraBold.ttf`);
  doc.registerFont('OpenSansLitalic', `${PACKAGE_PATH}fonts/OpenSans-LightItalic.ttf`);

  // PAGE HEADER
  doc.fillColor('#888888');
  doc.image(`${PACKAGE_PATH}images/tim_logo_large.png`, 20, 20, {width: 170});
  doc.font('OpenSansSemiBold').fontSize(20).text(reportName, 150, 26, {width: 430, align: 'right'});

  return {
    doc: doc,
    y: TOP_OF_PAGE_Y,
  };
}

function defaultTop(docY, reportContent) {
  docY = addDefaultLine(docY, 'Request Timestamp', reportContent['requestTimestamp']);
  docY = addDefaultLine(docY, 'Report Generated For', reportContent['reportGeneratedFor']);
  docY = addDefaultLine(docY, 'Data Source', reportContent['dataSource']);
  docY = addDefaultLine(docY, 'Request Id', reportContent['requestId']);
  if (reportContent['error'] !== undefined && reportContent['error'] !== null) {
    docY = addDefaultLine(docY, 'Error', reportContent['error']);
  }
  docY = addDefaultLine(docY, 'Search Parameters:', null);
  docY = addPageDetail(docY, reportContent['searchParams'], null);
  docY = addLine(docY, null, null, PDFDocumentLineType.EMPTY_LINE);
  return docY;
}

// TODO: (warning) https://eslint.org/docs/rules/no-prototype-builtins
function generateSections(value) {
  function pushToSection(sections, index, rowData) {
    if (sections.hasOwnProperty(index)) {
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
    if (rowData.lineType === PDFDocumentLineType.END_LINE) {
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
      if (rowData.lineType === PDFDocumentLineType.SINGLE_COLUMN) {
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


function addLine(lineDocY, text, value, lineType) {
  function getDocY(doc, currentY, incrementY, sectionRows, isSubHeader) {
    function createNewPage(doc) {
      doc.addPage();
      doc.fillColor('#888888');
      return docYResponse(doc, TOP_OF_PAGE_Y);
    }
    const headerLowest = 750; // the lowest y for a header
    const noFooterLimit = 800; // lowest y for a row
    const isHeader = (lineType === PDFDocumentLineType.HEADER_LINE) || isSubHeader;

    const rowsIncrementY = (sectionRows * incrementY);
    if (rowsIncrementY + currentY > TOP_OF_PAGE_Y) {
      if (isHeader || lineType === PDFDocumentLineType.END_LINE) {
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
  function populateLine(doc, headerColor, text, value, x, xAdditionalWidth, y, isHeaderType) {
    let size = 10;
    if (isHeaderType) {
      size = 16;
    }
    doc.font('OpenSansSemiBold').fontSize(size).fillColor(headerColor).text(text, x, y);
    doc.font('OpenSansLight').fontSize(10).text(value, x + xAdditionalWidth, y, {
      width: 370,
      lineGap: 10,
      ellipsis: true,
    });
    return doc;
  }
  function underline(doc, x, y) {
    return doc.moveTo(x, y + 18)
        .lineTo(doc.page.width - 20, y + 18)
        .strokeColor('#CCCCCC')
        .lineWidth(.025)
        .stroke();
  }
  function docYResponse(doc, y) {
    return {
      doc: doc,
      y: y,
    };
  }
  let doc = lineDocY.doc;
  let y = lineDocY.y;
  let incrementY = INCREMENT_MAIN_Y;
  let x = 20;
  const headerColor = PDF_TEXT.REPORT_HEADERS.includes(text) || lineType === PDFDocumentLineType.HEADER_LINE ? 'black' : '#888888';

  switch (lineType) {
    case PDFDocumentLineType.EMPTY_LINE: { // TODO: NEW
      const docY = getDocY(doc, y, incrementY, 1, false);
      doc = docY.doc;
      y = docY.y;
      if (y > TOP_OF_PAGE_Y) {
        y += incrementY;
      }
      break;
    }
    case PDFDocumentLineType.END_LINE: {
      const docY = getDocY(doc, y, incrementY, 1, false);
      doc = docY.doc;
      y = docY.y;
      if (y > TOP_OF_PAGE_Y) {
        y += incrementY;
      }
      break;
    }
    case PDFDocumentLineType.HEADER_LINE: {
      const docY = getDocY(doc, y, incrementY, 1, false);
      doc = docY.doc;
      y = docY.y;
      doc = populateLine(doc, headerColor, text, value, x, 180, y, true);
      y += incrementY;
      break;
    }
    case PDFDocumentLineType.ADDRESS_LINE: {
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
    case PDFDocumentLineType.COLUMN_INFO:
    case PDFDocumentLineType.SUB_INFO: {
      if (value.length > 0) {
        const sections = generateSections(value);
        let sectionHeaderPrinted = false;
        for (const key in sections) {
          if (Object.prototype.hasOwnProperty.call(sections, key)) {
            const value = sections[key];
            const customRows = getSectionRows(value) + (sectionHeaderPrinted ? 0 : 1);
            incrementY = INCREMENT_SUB_Y;
            const docY = getDocY(doc, y, incrementY, customRows, true);
            doc = docY.doc;
            y = docY.y;
            if (y > TOP_OF_PAGE_Y) {
              y += incrementY;
            }
            if (!sectionHeaderPrinted) {
              doc = populateLine(doc, 'black', text, null, x, 180, y, (lineType === PDFDocumentLineType.COLUMN_INFO));
              sectionHeaderPrinted = true;
              y += (lineType === PDFDocumentLineType.COLUMN_INFO) ? INCREMENT_MAIN_Y : INCREMENT_SUB_Y;
            }

            // TODO: (Warning) Monitor this with the rows when singles and doubles start mixing positions
            const linesEnded = []; // lines ended
            const onlyFirsts = []; // only first columns, try remember what this does?
            const singleColumns = [];
            let finalIncrementYRequired = false;
            for (let i = 0; i < value.length; i++) {
              const column = (i - linesEnded.length - onlyFirsts.length - singleColumns.length) % 2;
              const subLine = value[i];
              if (subLine.lineType === PDFDocumentLineType.SINGLE_COLUMN) {
                // console.log(`SINGLE COLUMN - ${column}`);
                if (column !== 0) { // I HATE THIS, might have had dual column before this, that only had one column in, so increment never took place
                  y += incrementY;
                }
                doc = populateLine(doc, '#888888', subLine.text, subLine.value, 20, 140, y, false);
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
                // const headerColor = lineType === PDFDocumentLineType.HEADER_LINE ? 'black' : '#888888';
                doc = populateLine(doc, '#888888', subLine.text, subLine.value, x, 140, y, false);
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
}

function addDefaultLine(docY, text, value) {
  return addLine(docY, text, value, PDFDocumentLineType.KEY_VALUE_LINE);
}

function addPageDetail(docY, data, newPageHeaders) {
  for (const prop in data) {
    if (Object.prototype.hasOwnProperty.call(data, prop)) {
      const row = data[prop];
      if (newPageHeaders !== null) {
        // console.log(`Searching ${row.text}`);
        if (newPageHeaders.includes(row.text)) {
          if (docY.y > TOP_OF_PAGE_Y) {
            // console.log(`${row.text} is a header`);
            docY.doc.addPage();
            docY.doc.fillColor('#888888');
            docY.y = TOP_OF_PAGE_Y;
          }
        }
      }
      docY = addLine(docY, row.text, row.value, row.lineType);
    }
  }
  return docY;
}

/**
 * Adds the page footer.
 *
**/
async function addPageFooter(docY, requestID, disclaimer) {
  if (docY.y > 608) {
    // create new page so footer can be displayed (otherwise it will be placed on top of data)
    docY.doc.addPage();
    docY.doc.fillColor('#888888');
    docY.y = TOP_OF_PAGE_Y;
  }
  const doc = addDisclaimer(docY.doc, disclaimer);
  const page = doc.page;
  doc.rect(0, page.height - 100, page.width, page.height)
      .lineWidth(0.2)
      .fillOpacity(0.1)
      .fill('#CCCCCC');

  doc.font('OpenSansSemiBold')
      .fontSize(12)
      .fillOpacity(1)
      .fillColor('#000')
      .strokeColor('#000')
      .fontSize(8)
      .text('ThisIsMe (Pty) Ltd', 30, page.height - 90, {width: page.width - 80});

  doc.font('OpenSansLight')
      .fontSize(8)
      .fillOpacity(1)
      .fillColor('#000')
      .strokeColor('#000')
      .fontSize(7)
      .text('Registration Number: 2014/136237/07', 30, page.height - 78, {width: page.width - 80})
      .text('Vat Registration: 4170271870', 30, page.height - 67, {width: page.width - 80})
      .text('Tel: +27 21 422 3995', 30, page.height - 56, {width: page.width - 80})
      .text('Email: info@thisisme.com', 30, page.height - 45, {width: page.width - 80});

  doc.font('OpenSansLight')
      .fontSize(7)
      .fillOpacity(1)
      .fillColor('#000')
      .strokeColor('#000')
      .fontSize(6.5)
      .text(
          'Copyright © ThisIsMe (Pty) Ltd. All rights reserved',
          30,
          page.height - 20,
          {width: page.width - 80},
      );

  /**
     * Here we specifically override the generation to include a
     * QR Code barcode in the PDF to verify the authenticity of
     * the request with ThisIsMe
    */

  const base64data = Buffer.from(requestID).toString('base64');

  const val = process.env.THISISME_HOST + 'verify_reqid/' + base64data;
  const barcode = await generateQRCode(val);
  doc.font('OpenSansLitalic').fontSize(8).text(
      'Scan this code to verify this request authenticity on ThisIsMe.com',
      370,
      page.height - 90,
      {width: 180},
  );
  doc.image(barcode, page.width - 50, page.height - 90, {width: 30, link: val});

  return doc;
}

/**
 * Generate the QR Code Barcode
*/
const generateQRCode = (data) => {
  return new Promise((resolve, reject) => {
    try {
      bwipjs.toBuffer({
        bcid: 'qrcode', // Barcode type
        text: data, // Text to encode
        format: 'any',
      }, function(err, png) {
        if (err) {
          reject(err);
        } else {
          resolve(png);
        }
      });
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Generate the Disclaimer text included on the PDF Report.
*/
function addDisclaimer(doc, disclaimer) {
  const page = doc.page;
  doc.rect(
      20,
      page.height - 210,
      page.width - 40,
      100,
  ).fillColor('#F9F9F9').strokeColor('#888888').fillAndStroke();
  doc.font('OpenSansLight').fontSize(8).fillColor('#333333').text(
      disclaimer.trim(),
      25,
      page.height - 205,
      {width: page.width - 55},
  );
  return doc;
}

function finalizePDFDocument(doc, requestID, reportMeta) {
  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);
    // Footer: Add page number
    const oldBottomMargin = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    doc.text(
        `Page: ${i + 1} of ${pages.count}`,
        270,
        doc.page.height - 20,
        {width: doc.page.width - 80},
    );
    doc.page.margins.bottom = oldBottomMargin;
  }
  const key = `${reportMeta.s3BucketName}/${reportMeta.formatted}/${requestID}.pdf`;

  if (reportMeta.DEBUG) {
    const stream = doc.pipe(fs.createWriteStream('/tmp/' + requestID + '.pdf'));

    stream.on('error', function(error) {
      console.log(`stream error ${error.toString()}`);
    });

    stream.on('finish', function() {
      console.log(`Saved to: /tmp/${requestID}.pdf`);
    });
  } else {
    doc.pipe(concat(function(data) {
      const params = {
        Bucket: 'thisisme-reports',
        Key: key,
        Body: data,
      };
      s3.putObject(params, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else console.log(data); // successful response
      });
    }));
  }
  doc.end();

  return {
    'filename': requestID,
    'formatted': reportMeta.formatted,
  };
}
