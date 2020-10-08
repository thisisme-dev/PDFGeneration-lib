
const constants = require('./app/constants');
const logic = require('./app/logic');

const helpers = require('./app/pdf-helpers');

const dateTime = require('node-datetime');
const PDFLimiter = require('./app/pdf-limitations').PDFLimiter;

const pdfLimiter = new PDFLimiter();

module.exports = {
  constants,
  pdfLimiter: pdfLimiter,
  textValueObj: logic.textValueObj,
  PDFHelpers: helpers.PDFHelpers,
  getPDFContentTemplate: logic.getPDFContentTemplate,
  generateReportData: (disclaimer, s3BucketName, reportName, localDebug, debug) => {
    const dt = dateTime.create();
    const data = {
      metaData: {
        formatted: dt.format('Y-m-d'),
        disclaimer: disclaimer,
        s3BucketName: s3BucketName,
        reportName: reportName,
        LOCAL_DEBUG: localDebug,
        DEBUG: debug,
      },
      requestTimestamp: dt.format('Y-m-d H:M:S'),
    };
    dt.offsetInDays(3);
    data.expiryDate = `${dt.format('w, d n Y H:M:S')} UTC`;
    console.log(data);
    return data;
  },
  generateNoResultsPDFContent: logic.generateNoResultsPDFContent,
  generateReport: async (reportContent, reportMeta) => {
    const requestID = reportContent.requestId;
    const pageSetup = logic.setupPDFType(reportContent.pdfType);
    const pageOfContents = pageSetup.pageOfContents;
    let docY = logic.createPDFDocument(requestID, reportMeta.reportName, pageOfContents);
    docY = await logic.defaultTop(docY, reportContent);
    if (pageOfContents !== null) {
      docY.doc.addPage(); // create blank page for page of contents
    }
    if (pageSetup.addBasicResponseHeader) {
      docY = logic.addDefaultLine(docY, 'Service Response:', null);
    }
    docY = await logic.addPageDetail(docY, reportContent['dataFound'], reportContent.newPageHeaders, pageOfContents);
    docY.doc = await logic.addPageFooter(docY, requestID, reportMeta.disclaimer);
    return await logic.finalizePDFDocument(docY.doc, requestID, reportMeta, pageOfContents);
  },
  generateNoResultsReport: async (reportContent, reportMeta) => {
    const requestID = reportContent.requestId;
    const pageOfContents = null;
    let docY = logic.createPDFDocument(requestID, reportMeta.reportName, pageOfContents);
    docY = await logic.defaultTop(docY, reportContent);
    docY.doc = await logic.addPageFooter(docY, requestID, reportMeta.disclaimer);
    return await logic.finalizePDFDocument(docY.doc, requestID, reportMeta, pageOfContents);
  },
};
