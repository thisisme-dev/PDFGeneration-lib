const fs = require('fs');

const PDFDocument = require('pdfkit');
const concat = require('concat-stream');
const bwipjs = require('bwip-js');

const AWS = require('aws-sdk');
const s3 = new AWS.S3();
AWS.config.update({region: process.env.AWS_DEFAULT_REGION});
const AWS_S3_REPORTS_BUCKET = process.env.AWS_S3_REPORTS_BUCKET;

const constants = require('./constants');
const setupPDFType = require('./logic-pdf-type').setupPDFType;
const addLine = require('./logic-line-core').addLine;

module.exports = {
  setupPDFType,
  createPDFDocument,
  defaultTop,
  addDefaultLine,
  addPageDetail,
  addPageFooter,
  finalizePDFDocument,
};

function createPDFDocument(requestID, reportName, pageOfContents) {
  const doc = new PDFDocument({
    bufferPages: true,
    size: 'A4',
    info: {
      Title: requestID,
      Author: constants.PDF_TEXT.REPORT_AUTHOR,
    },
    margin: 0,
  });

  if (pageOfContents !== null) {
    doc.on('pageAdded', () => {
      pageOfContents.incrementPage();
    });
  }

  doc.registerFont('OpenSans', `${constants.PACKAGE_PATH}fonts/OpenSans-Regular.ttf`);
  doc.registerFont('OpenSansLight', `${constants.PACKAGE_PATH}fonts/OpenSans-Light.ttf`);
  doc.registerFont('OpenSansBold', `${constants.PACKAGE_PATH}fonts/OpenSans-Bold.ttf`);
  doc.registerFont('OpenSansSemiBold', `${constants.PACKAGE_PATH}fonts/OpenSans-SemiBold.ttf`);
  doc.registerFont('OpenSansXBold', `${constants.PACKAGE_PATH}fonts/OpenSans-ExtraBold.ttf`);
  doc.registerFont('OpenSansLitalic', `${constants.PACKAGE_PATH}fonts/OpenSans-LightItalic.ttf`);
  doc.registerFont('DejaVuSans', `${constants.PACKAGE_PATH}fonts/DejaVuSans.ttf`);

  // PAGE HEADER
  doc.fillColor(constants.PDFColors.NORMAL_COLOR);
  doc.image(`${constants.PACKAGE_PATH}images/tim_logo_large.png`, 20, 20, {width: 170});
  doc.font('OpenSansSemiBold').fontSize(20).text(reportName, 150, 26, {width: 430, align: 'right'});

  return {
    doc: doc,
    y: constants.TOP_OF_PAGE_Y,
  };
}

async function defaultTop(docY, reportContent) {
  docY = await addDefaultLine(docY, 'Request Timestamp', reportContent['requestTimestamp']);
  docY = await addDefaultLine(docY, 'Report Generated For', reportContent['reportGeneratedFor']);
  docY = await addDefaultLine(docY, 'Data Source', reportContent['dataSource']);
  docY = await addDefaultLine(docY, 'Request Id', reportContent['requestId']);
  if (reportContent['error'] !== undefined && reportContent['error'] !== null) {
    docY = await addDefaultLine(docY, 'Error', reportContent['error']);
  }
  docY = await addLine(docY, null, null, constants.PDFDocumentLineType.EMPTY_LINE, false);
  docY = await addDefaultLine(docY, 'Search Parameters:', null);
  docY = await addPageDetail(docY, reportContent['searchParams'], null);
  docY = await addLine(docY, null, null, constants.PDFDocumentLineType.EMPTY_LINE, false);
  return docY;
}

async function addDefaultLine(docY, text, value) {
  return await addLine(docY, text, value, constants.PDFDocumentLineType.KEY_VALUE_LINE, false);
}

async function addPageDetail(docY, data, newPageHeaders, pageOfContents) {
  for (const prop in data) {
    if (Object.prototype.hasOwnProperty.call(data, prop)) {
      let isDefinedHeader = false;
      const row = data[prop];
      if (newPageHeaders !== null) {
        // console.log(`Searching ${row.text}`);
        if (newPageHeaders.includes(row.text)) {
          if (docY.y > constants.TOP_OF_PAGE_Y) {
            // console.log(`${row.text} is a header`);
            // console.log('HEADER PAGE FOR HEADER');
            // console.log('-------------------------------');
            docY.doc.addPage();
            // docY.doc.fillColor(constants.PDFColors.NORMAL_COLOR);
            docY.y = constants.TOP_OF_PAGE_Y;
            isDefinedHeader = true;
          }
          if (pageOfContents !== null) {
            pageOfContents.addPageDetails(row.text);
          }
        }
      }
      docY = await addLine(docY, row.text, row.value, row.lineType, isDefinedHeader);
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
    // docY.doc.fillColor(constants.PDFColors.NORMAL_COLOR);
    docY.y = constants.TOP_OF_PAGE_Y;
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

  const val = `${process.env.THISISME_HOST}verify_reqid/${base64data}`;
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
  ).fillColor('#F9F9F9').strokeColor(constants.PDFColors.NORMAL_COLOR).fillAndStroke();
  doc.font('OpenSansLight').fontSize(8).fillColor('#333333').text(
      disclaimer.trim(),
      25,
      page.height - 205,
      {width: page.width - 55},
  );
  return doc;
}

async function populatePageOfContents(doc, pageOfContents) {
  if (pageOfContents !== null) {
  // TODO: what if sections push this to add new page?? figure out how to create new page then
    doc.switchToPage(1); // there will be cases where this is not 1
    // console.log(pageOfContents.getPageOfContents());
    let size = constants.NORMAL_FONT_SIZE;

    size = constants.HEADER_FONT_SIZE;
    const page = doc.page;
    doc.rect(0, 25, page.width, 50).fillColor(constants.PDFColors.NORMAL_COLOR).strokeColor(constants.PDFColors.NORMAL_COLOR).fillAndStroke();
    doc.font('OpenSansSemiBold').fontSize(size).fillColor(constants.PDFColors.TEXT_IN_NORMAL_COLOR).text('Table of Contents', constants.X_START, constants.TOP_OF_PAGE_Y - 40);

    const content = pageOfContents.getPageOfContents();
    let docY = {
      doc: doc,
      y: constants.TOP_OF_PAGE_Y,
    };
    for (let i = 0; i < content.length; i++) {
      docY = await addLine(docY, content[i].section, content[i].page, constants.PDFDocumentLineType.TABLE_OF_CONTENTS_LINE, false);
    }
    return docY.doc;
  }
  return doc;
}

async function finalizePDFDocument(doc, requestID, reportMeta, pageOfContents) {
  const pages = doc.bufferedPageRange();

  doc = await populatePageOfContents(doc, pageOfContents);
  // old code for page numbering
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

  if (reportMeta.LOCAL_DEBUG) {
    console.log('LOCAL_DEBUG enabled, service saving file to /tmp directory');
    const stream = doc.pipe(fs.createWriteStream(`/tmp/${requestID}.pdf`));

    stream.on('error', function(error) {
      console.log(`stream error ${error.toString()}`);
    });

    stream.on('finish', function() {
      console.log(`Saved to: /tmp/${requestID}.pdf`);
    });
  } else {
    doc.pipe(concat(function(data) {
      const params = {
        Bucket: AWS_S3_REPORTS_BUCKET,
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
