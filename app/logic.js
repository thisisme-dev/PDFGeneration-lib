"use strict";

const fs = require("fs");
const concat = require("concat-stream");
const bwipjs = require("bwip-js");
const AWS = require("aws-sdk");
const s3 = new AWS.S3();

const PDFDocument = require("./library-override/pdfkit-customized");
const coverPDFLogic = require("./pdf-types/cover-logic");

const configs = require("./configs");
const constants = require("./constants");
const setupPDFType = require("./logic-pdf-type").setupPDFType;
const addLine = require("./logic-line-core").addLine;
const {PDF_TEXT} = require("./constants");

AWS.config.update({region: configs.AWS_DEFAULT_REGION});
const AWS_S3_REPORTS_BUCKET = configs.AWS_S3_REPORTS_BUCKET;

function createPDFDocument(requestID, reportName, pageOfContents, coverPage) {
  const doc = new PDFDocument({
    bufferPages: true,
    size: "A4",
    info: {
      Title: requestID,
      Author: constants.PDF_TEXT.REPORT_AUTHOR,
    },
    margin: 0,
  });

  if (pageOfContents !== null) {
    doc.on("pageAdded", () => {
      pageOfContents.incrementPage();
    });
  }

  doc.registerFont("OpenSans", `${constants.PACKAGE_PATH}fonts/OpenSans-Regular.ttf`);
  doc.registerFont("OpenSansLight", `${constants.PACKAGE_PATH}fonts/OpenSans-Light.ttf`);
  doc.registerFont("OpenSansBold", `${constants.PACKAGE_PATH}fonts/OpenSans-Bold.ttf`);
  doc.registerFont("OpenSansSemiBold", `${constants.PACKAGE_PATH}fonts/OpenSans-SemiBold.ttf`);
  doc.registerFont("OpenSansXBold", `${constants.PACKAGE_PATH}fonts/OpenSans-ExtraBold.ttf`);
  doc.registerFont("OpenSansLitalic", `${constants.PACKAGE_PATH}fonts/OpenSans-LightItalic.ttf`);
  doc.registerFont("DejaVuSans", `${constants.PACKAGE_PATH}fonts/DejaVuSans.ttf`);
  doc.registerFont("OpenSansSemiBitalic", `${constants.PACKAGE_PATH}fonts/OpenSans-SemiBoldItalic.ttf`);

  // PAGE HEADER
  doc.fillColor(constants.PDFColors.NORMAL_COLOR);

  if (coverPage) {
    doc.image(`${constants.PACKAGE_PATH}images/tim_logo_large.png`, 100, 80, {width: 400});
    // doc.font('OpenSansSemiBold').fontSize(20).text(reportName, 150, 26, {width: 430, align: 'right'}); incorporate this
    return {
      doc: doc,
      y: constants.TOP_OF_PAGE_Y,
    };
  } else {
    doc.image(`${constants.PACKAGE_PATH}images/tim_logo_large.png`, 20, 20, {width: 170});
    doc.font("OpenSans").fontSize(16).text(reportName, 150, 26, {width: 430, align: "right"});
    doc
        .strokeColor("#cccccc")
        .lineWidth(1)
        .moveTo(0, 95)
        .lineTo(595.26, 95)
        .dash(2, {space: 2})
        .stroke()
        .undash();
    return {
      doc: doc,
      y: constants.TOP_OF_FIRST_PAGE_Y,
    };
  }
}

async function defaultTop(docY, reportContent) {
  docY = await addDefaultLine(docY, "DATE", reportContent["requestTimestamp"]);
  docY = await addDefaultLine(docY, "REQUESTED BY", reportContent["reportGeneratedFor"]);
  docY = await addDefaultLine(docY, "DATA SOURCE", reportContent["dataSource"]);
  docY = await addDefaultLine(docY, "REQUEST ID", reportContent["requestId"]);
  if (reportContent["error"] !== undefined && reportContent["error"] !== null) {
    docY = await addDefaultLine(docY, "Error", reportContent["error"]);
  }
  docY = await addLine(docY, null, null, constants.PDFDocumentLineType.EMPTY_LINE, false);

  const searchParams = reportContent["searchParams"];
  if (Object.keys(searchParams).length) {
  // if (searchParams !== null) {

    docY = await addHeadline(docY, "DATA SUBMITTED", false, "clock");
    docY = await addPageDetail(docY, searchParams, null);
    docY = await addLine(docY, null, null, constants.PDFDocumentLineType.EMPTY_LINE, false);
  }
  return docY;
}

async function addDefaultLine(docY, text, value) {
  return await addLine(docY, text, value, constants.PDFDocumentLineType.KEY_VALUE_LINE, false);
}

async function addPageDetail(docY, data, newPageHeaders, pageOfContents) {
  for (const prop in data) {
    if (Object.prototype.hasOwnProperty.call(data, prop)) {
      let isFancyHeader = false;
      const row = data[prop];

      if (newPageHeaders !== null) {
        if (newPageHeaders.includes(row.text)) {
          if (docY.y > constants.TOP_OF_PAGE_Y) {
            docY.doc.addPage();
            // docY.doc.fillColor(constants.PDFColors.NORMAL_COLOR);
            docY.y = constants.TOP_OF_PAGE_Y;
          }
          isFancyHeader = true;
          if (pageOfContents !== null) {
            pageOfContents.addPageDetails(row.text);
          }
        }
      }

      docY = await addLine(docY, row.text, row.value, row.lineType, isFancyHeader);
    }
  }
  return docY;
}

/**
   * Adds a headline.
   *
  **/
async function addHeadline(docY, text, type = "H2", icon = false) {
  docY.doc.x = constants.PD.MARGIN;

  docY.doc.roundedRect(constants.PD.MARGIN, docY.y, (constants.PD.WIDTH - (constants.PD.MARGIN) * 2), 26, 2)
      .fill(constants.PDColors.BG_LIGHT, "#000");

  if (icon) {
    docY.doc.image(`${constants.PACKAGE_PATH}images/icon-${icon}.png`, (constants.PD.MARGIN + constants.PD.PADDING ), (docY.y + 7), {height: 12});
    docY.doc.x += constants.PD.PADDING + 10;
  }

  docY.doc.fillColor(constants.PDColors.TEXT_DARK)
      .fontSize(10)
      .text(text, (docY.doc.x + constants.PD.PADDING), (docY.y + 6) );

  docY.y += 40;
  docY.doc.y += constants.PD.MARGIN;

  return docY;
}

/**
   * Adds the page footer.
   *
  **/
async function addPageFooter(docY, requestID, disclaimer) {
  const footerClearance = (docY.doc.page.height - 110);

  if (docY.y > footerClearance) {
    // create new page so footer can be displayed (otherwise it will be placed on top of data)
    docY.doc.addPage();
    docY.y = constants.TOP_OF_PAGE_Y;
  }
  const doc = addDisclaimer(docY.doc, disclaimer);
  const page = doc.page;

  doc
      .strokeColor("#cccccc")
      .lineWidth(1)
      .moveTo(0, page.height - 60)
      .lineTo(page.width, (page.height - 60))
      .dash(2, {space: 2})
      .stroke()
      .undash();

  doc.font("OpenSansSemiBold")
      .fontSize(12)
      .fillOpacity(1)
      .fillColor(constants.PDColors.TEXT_DARK)
      .strokeColor(constants.PDColors.TEXT_DARK)
      .fontSize(8)
      .text(PDF_TEXT.REPORT_AUTHOR, constants.PD.MARGIN, page.height - 45, {width: page.width - 80});

  doc.font("OpenSansLight")
      .fontSize(8)
      .fillOpacity(1)
      .fillColor(constants.PDColors.TEXT_DARK)
      .strokeColor(constants.PDColors.TEXT_DARK)
      .fontSize(7)
      .text(PDF_TEXT.REGISTRATION, constants.PD.MARGIN, page.height - 35, {width: page.width - 80});


  // /**
  //      * Here we specifically override the generation to include a
  //      * QR Code barcode in the PDF to verify the authenticity of
  //      * the request with ThisIsMe
  //     */

  // const base64data = Buffer.from(requestID).toString('base64');

  // const val = `${configs.THISISME_HOST}verify_reqid/${base64data}`;
  // const barcode = await generateQRCode(val);
  // doc.font('OpenSansLitalic').fontSize(8).text(
  //     'Scan this code to verify this request authenticity on ThisIsMe.com',
  //     370,
  //     page.height - 90,
  //     {width: 180},
  // );
  // doc.image(barcode, page.width - 50, page.height - 90, {width: 30, link: val});

  return doc;
}


/**
   * Generate the QR Code Barcode
  */
async function generateQRCode(data) {
  return new Promise((resolve, reject) => {
    try {
      bwipjs.toBuffer({
        bcid: "qrcode", // Barcode type
        text: data, // Text to encode
      }, (err, png) => {
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
}

/**
   * Generate the Disclaimer text included on the PDF Report.
  */
function addDisclaimer(doc, disclaimer) {
  const page = doc.page;

  const PDF_REPORT_DISCLAIMER = PDF_TEXT.DISCLAIMER;

  doc.roundedRect(20, page.height - 100, page.width - 40, 30, 2)
      .fillColor(constants.PDColors.BG_LIGHT)
      .fill();

  doc.font("OpenSansLight").fontSize(8).fillColor("#333333")
      .text(PDF_REPORT_DISCLAIMER.trim(), 30, page.height - 90, {width: page.width - 60});
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
    doc.font("OpenSansSemiBold").fontSize(size).fillColor(constants.PDFColors.TEXT_IN_NORMAL_COLOR).text("Table of Contents", constants.X_START, constants.TOP_OF_PAGE_Y - 40);

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

async function finalizePDFDocument(doc, requestID, reportMeta, pageOfContents, coverPage) {
  const pages = doc.bufferedPageRange();

  doc = await populatePageOfContents(doc, pageOfContents);
  // old code for page numbering
  for (let i = 0; i < pages.count; i++) {
    if (coverPage) {
      continue;
    }
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

  return new Promise((resolve, reject) => {
    if (reportMeta.LOCAL_DEBUG) {
      console.log("LOCAL_DEBUG enabled, service saving file to /tmp directory");
      const stream = doc.pipe(fs.createWriteStream(`/tmp/${requestID}.pdf`));

      stream.on("error", (error) => {
        console.log(`stream error ${error.toString()}`);
        return reject(error);
      });

      stream.on("finish", () => {
        console.log(`Saved to: /tmp/${requestID}.pdf`);
        return resolve({
          "filename": requestID,
          "formatted": reportMeta.formatted,
        });
      });
    } else {
      doc.pipe(concat((data) => {
        const params = {
          Bucket: AWS_S3_REPORTS_BUCKET,
          Key: key,
          Body: data,
        };
        s3.putObject(params, (err, data) => {
          if (err) {
            console.log(err, err.stack); // an error occurred
            return reject(err);
          } else {
            console.log(data); // successful response
            return resolve({
              "filename": requestID,
              "formatted": reportMeta.formatted,
            });
          }
        });
      }));
    }
    doc.end();
  });
}

module.exports = {
  setupPDFType,
  createPDFDocument,
  addCoverPage: coverPDFLogic.addCoverPage,
  defaultTop,
  addDefaultLine,
  addPageDetail,
  addPageFooter,
  addHeadline,
  addLine,
  finalizePDFDocument,
  generateQRCode,
};
