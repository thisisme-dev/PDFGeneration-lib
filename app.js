
const constants = require('./app/constants');
const logic = require('./app/logic');

module.exports = {
  constants,
  pdfLimiter: logic.pdfLimiter,
  createLimitationsDoc: logic.createLimitationsDoc,
  destroyLimitationsDoc: logic.destroyLimitationsDoc,
  getStringWidth: logic.getStringWidth,

  generateReport: async (reportContent, reportMeta) => {
    const requestID = reportContent.requestId;
    const pageSetup = logic.setupPDFType(reportContent.pdfType);
    const pageOfContents = pageSetup.pageOfContents;
    let docY = logic.createPDFDocument(requestID, reportMeta.reportName, pageOfContents);
    docY = logic.defaultTop(docY, reportContent);
    if (pageOfContents !== null) {
      docY.doc.addPage(); // create blank page for page of contents
    }
    if (pageSetup.addBasicResponseHeader) {
      docY = logic.addDefaultLine(docY, 'Service Response:', null);
    }
    docY = logic.addPageDetail(docY, reportContent['dataFound'], reportContent.newPageHeaders, pageOfContents);
    docY.doc = await logic.addPageFooter(docY, requestID, reportMeta.disclaimer);
    return logic.finalizePDFDocument(docY.doc, requestID, reportMeta, pageOfContents);
  },
  generateNoResultsReport: async (reportContent, reportMeta) => {
    const requestID = reportContent.requestId;
    const pageOfContents = null;
    let docY = logic.createPDFDocument(requestID, reportMeta.reportName, pageOfContents);
    docY = logic.defaultTop(docY, reportContent);
    docY.doc = await logic.addPageFooter(docY, requestID, reportMeta.disclaimer);
    return logic.finalizePDFDocument(docY.doc, requestID, reportMeta, pageOfContents);
  },
};
