const fs = require('fs');

const PDFDocument = require('pdfkit');
const concat = require('concat-stream');
const bwipjs = require('bwip-js');

const AWS = require('aws-sdk');
const s3 = new AWS.S3();
AWS.config.update({region: process.env.AWS_DEFAULT_REGION});

var packageName = require('./package.json').name;

let PACKAGE_PATH = `node_modules/${packageName}/`;
if (!fs.existsSync(PACKAGE_PATH)) {
  PACKAGE_PATH = '';
}

const TOP_OF_PAGE_Y = 80;
const INCREMENT_MAIN_Y = 22;
const INCREMENT_SUB_Y = 19;

// add list for 

const PDFDocumentLineType = {
  DEFAULT_LINE: 0,
  HEADER_LINE: 1,
  KEY_VALUE_LINE: 2,
  EMPTY_LINE: 3,
  ADDRESS_LINE: 4,
  SUB_INFO: 5,
  SINGLE_COLUMN: 6,
  DOUBLE_COLUMN: 7,
  END_LINE: 8,
};
Object.freeze(PDFDocumentLineType);

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
  getPDFContentTemplate: (requestTimestamp, event, dataSource, errMsg) => {
    return {
      requestTimestamp: requestTimestamp,
      error: errMsg,
      reportGeneratedFor: `${event.requester.client} @ ${event.requester.company}`,
      dataSource: dataSource,
      searchParams: {},
      dataFound: {},
      requestId: event.request_id,
    };
  },
  generateReport: async (reportContent, reportMeta) => {
    let docY = {
      doc: null,
      y: 100,
    };
    const requestID = reportContent.requestId;
    docY.doc = createPDFDocument(requestID);
    docY.doc = addPageHeader(docY.doc, reportMeta.reportName);

    docY = addDefaultLine(docY.doc, docY.y, 'Request Timestamp', reportContent['requestTimestamp'], false);
    docY = addDefaultLine(docY.doc, docY.y, 'Report Generated For', reportContent['reportGeneratedFor'], false);
    docY = addDefaultLine(docY.doc, docY.y, 'Data Source', reportContent['dataSource'], false);
    docY = addDefaultLine(docY.doc, docY.y, 'Request Id', reportContent['requestId'], false);
    docY = addDefaultLine(docY.doc, docY.y, 'Search Parameters:', '', true);
    docY = addPageDetail(docY, reportContent['searchParams'], false);
    docY = addDefaultLine(docY.doc, docY.y, 'Service Response:', '', true);
    docY = addPageDetail(docY, reportContent['dataFound'], false);

    if (docY.y > 608) {
      //create new page so footer can be displayed (otherwise it will be placed on top of data)
      docY.doc.addPage();
      docY.doc.fillColor('#888888');
      docY.y = TOP_OF_PAGE_Y;
    }

    docY.doc = addDisclaimer(docY.doc, reportMeta.disclaimer);
    docY.doc = await addPageFooter(docY.doc, requestID);
    return finalizePDFDocument(docY.doc, requestID, reportMeta);
  },
  generateNoResultsReport: async (reportContent, reportMeta) => {
    let docY = {
      doc: null,
      y: 100,
    };
    const requestID = reportContent.requestId;
    docY.doc = createPDFDocument(requestID);
    docY.doc = addPageHeader(docY.doc, reportMeta.reportName);
    docY = addDefaultLine(docY.doc, docY.y, 'Request Timestamp', reportContent['requestTimestamp'], false);
    docY = addDefaultLine(docY.doc, docY.y, 'Error', reportContent['error'], false);
    docY = addDefaultLine(docY.doc, docY.y, 'Report Generated For', reportContent['reportGeneratedFor'], false);
    docY = addDefaultLine(docY.doc, docY.y, 'Data Source', reportContent['dataSource'], false);
    docY = addDefaultLine(docY.doc, docY.y, 'Search Parameters:', '', true);
    docY = addPageDetail(docY, reportContent['searchParams'], false);
    docY = addDefaultLine(docY.doc, docY.y, 'Request Id', reportContent['requestId'], false);

    docY.doc = addDisclaimer(docY.doc, reportMeta.disclaimer);
    docY.doc = await addPageFooter(docY.doc, requestID);
    return finalizePDFDocument(docY.doc, requestID, reportMeta);
  },
};

function createPDFDocument(requestID) {
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

  return doc;
}

/**
 * Generate the Page Header.
 **/
function addPageHeader(doc, reportName) {
  doc.fillColor('#888888');
  doc.image(`${PACKAGE_PATH}images/tim_logo_large.png`, 20, 20, {width: 170});
  doc.font('OpenSansSemiBold').fontSize(20).text(reportName, 150, 26, {width: 430, align: 'right'});
  return doc;
}

function addLine(doc, y, text, lineType, value, leaveEmpty) {
  function newPageCheck(doc, y, incrementY, rows, isSubHeader) {
    const normalLimit = 670;
    const headerLowest = 750;
    const noFooterLimit = 800;
    const isHeader = lineType === PDFDocumentLineType.HEADER_LINE || isSubHeader;
    const limit = /* (rows === 1) || */ isHeader ? normalLimit : noFooterLimit;
    if (isHeader) {
      if (lineType === PDFDocumentLineType.HEADER_LINE) {
        if ((rows * incrementY) + y > headerLowest) {
          doc.addPage();
          doc.fillColor('#888888');
          y = TOP_OF_PAGE_Y;
        } else {
          y += incrementY;
        }
      } else {
        if ((rows * incrementY) + y > noFooterLimit) {
          doc.addPage();
          doc.fillColor('#888888');
          y = TOP_OF_PAGE_Y;
        } else {
          y += incrementY;
        }
      }
    } else {
      if (y + incrementY > limit) {
          doc.addPage();
        doc.fillColor('#888888');
        y = TOP_OF_PAGE_Y;
      } else {
        y += incrementY;
      }
    }
    return docY(doc, y);
  }
  function populateLine(doc, headerColor, text, value, x, xAdditionalWidth, y) {
    doc.font('OpenSansSemiBold').fontSize(10).fillColor(headerColor).text(text, x, y);
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
  function docY(doc, y) {
    return {
      doc: doc,
      y: y,
    };
  }
  let incrementY = INCREMENT_MAIN_Y;
  let x = 20;
  const headerColor = PDF_TEXT.REPORT_HEADERS.includes(text) || lineType === PDFDocumentLineType.HEADER_LINE ? 'black' : '#888888';

  switch (lineType) {
    case PDFDocumentLineType.END_LINE: {
      const docY = newPageCheck(doc, y, incrementY, 1, false);
      doc = docY.doc;
      y = docY.y;
      break;
    }
    case PDFDocumentLineType.HEADER_LINE: {
      const docY = newPageCheck(doc, y, incrementY, 1, false);
      doc = docY.doc;
      y = docY.y;
      doc = populateLine(doc, headerColor, text, value, x, 180, y);
      doc = underline(doc, x, y);
      break;
    }
    case PDFDocumentLineType.ADDRESS_LINE: {
      let addressParts = value.split(',');
      addressParts = addressParts.map((s) => s.trim());

      const docY = newPageCheck(doc, y, incrementY, addressParts.length, false);
      doc = docY.doc;
      y = docY.y;

      doc = populateLine(doc, headerColor, text, '', x, 180, y);
      for (let i = 0; i < addressParts.length; i++) {
        const addressPart = addressParts[i];
        doc = populateLine(doc, headerColor, '', addressPart, x, 180, y);
        if (i < addressParts.length - 1) {
          doc = underline(doc, x, y);
          y += incrementY;
        }
        doc = underline(doc, x, y);
      }
      break;
    }
    case PDFDocumentLineType.SUB_INFO: {
      if (value.length > 0) {
        // SUB HEADER
        const headerColor = PDF_TEXT.REPORT_HEADERS.includes(text) || lineType === PDFDocumentLineType.SUB_INFO ? 'black' : '#888888';
        // WARNING: This is currently written with value being an Array
        // const rows = (value.length/2);
        let customRows = 1; // starts with one because of the Sub Header itself
        if (Array.isArray(value)) {
          for(let row = 0; row < value.length; row++) {
            const rowData = value[row];
            if ((rowData.lineType === PDFDocumentLineType.SINGLE_COLUMN) || (rowData.lineType === PDFDocumentLineType.END_LINE)) {
              customRows++;
              if (customRows % 1 !== 0) { // caters for when colums end unequal
                customRows += 0.5;
              }
            } else {
              customRows += 0.5;
            }
          }
          // console.log(`Value's length ${value.length} customRow's value ${customRows}`);
        } else {
          console.log("Value is not an Array as expected")
        }

        const docY = newPageCheck(doc, y, incrementY, customRows, true); // remember spacing change from below.... maybe revert that
        doc = docY.doc;
        y = docY.y;
        doc.font('OpenSansSemiBold').fontSize(10).fillColor(headerColor).text(text, x, y);
        incrementY = INCREMENT_SUB_Y; // TODO: figure the effect of this out
        // SUB ITERATE INFO
        let linesEnded = [];
        let onlyFirsts = [];
        let singleColumns = [];
        for (let i = 0; i < value.length; i++) {
          let column = (i - linesEnded.length - onlyFirsts.length - singleColumns.length) % 2;
          const subLine = value[i];
          if (subLine.lineType === PDFDocumentLineType.END_LINE) {
            if (column === 1) {
              onlyFirsts.push(true);
            }
            linesEnded.push(true);
            y += incrementY;
          } else {
            if (subLine.lineType === PDFDocumentLineType.SINGLE_COLUMN) {
              y += incrementY;
              const headerColor = PDF_TEXT.REPORT_HEADERS.includes(subLine.text) || lineType === PDFDocumentLineType.HEADER_LINE ? 'black' : '#888888';
              doc = populateLine(doc, headerColor, subLine.text, subLine.value, 20, 140, y);
              singleColumns.push(true);
            } else {
              if (column === 0) {
                const docY = newPageCheck(doc, y, incrementY, 1, false);
                doc = docY.doc;
                y = docY.y;
                x = 20;
              } else {
                x = 300;
              }
              const headerColor = PDF_TEXT.REPORT_HEADERS.includes(subLine.text) || lineType === PDFDocumentLineType.HEADER_LINE ? 'black' : '#888888';
              doc = populateLine(doc, headerColor, subLine.text, subLine.value, x, 140, y);
            }
          }
        }
      }
      break;
    }
    default: {
      const docY = newPageCheck(doc, y, incrementY, 1, false);
      doc = docY.doc;
      y = docY.y;
      doc = populateLine(doc, headerColor, text, value, x, 180, y);
      doc = underline(doc, x, y);
    }
  }
  return docY(doc, y);
}

function addDefaultLine(doc, y, text, value, leaveEmpty) {
  return addLine(doc, y, text, PDFDocumentLineType.KEY_VALUE_LINE, value, leaveEmpty);
}

function addPageDetail(docY, data, createNextPage) {
  if (createNextPage) {
    docY.doc.addPage();
    docY.doc.fillColor('#888888');
    docY.y = TOP_OF_PAGE_Y;
  }
  for (const prop in data) {
    if (Object.prototype.hasOwnProperty.call(data, prop)) {
      const row = data[prop];
      docY = addLine(docY.doc, docY.y, row.text, row.lineType, row.value, false);
    }
  }
  return docY;
}

/**
 * Adds the page footer.
 *
**/
async function addPageFooter(doc, requestID) {
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
          // console.log(err);
          reject(err);
        } else {
          resolve(png);
        }
      });
    } catch (err) {
      // console.log(err);
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
      console.log('stream error');
      console.log(error);
    });

    stream.on('finish', function() {
      console.log('Saved to: /tmp/' + requestID + '.pdf');
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
