
const constants = require('./app/constants');
const logic = require('./app/logic');

module.exports = {
  constants,
  generateReport: async (reportContent, reportMeta) => {
    const requestID = reportContent.requestId;
    let docY = logic.createPDFDocument(requestID, reportMeta.reportName);
    docY = logic.defaultTop(docY, reportContent);
    docY = logic.addDefaultLine(docY, 'Service Response:', null);
    docY = logic.addPageDetail(docY, reportContent['dataFound'], reportContent.newPageHeaders);
    docY.doc = await logic.addPageFooter(docY, requestID, reportMeta.disclaimer);
    return logic.finalizePDFDocument(docY.doc, requestID, reportMeta);
  },
  generateNoResultsReport: async (reportContent, reportMeta) => {
    const requestID = reportContent.requestId;
    let docY = logic.createPDFDocument(requestID, reportMeta.reportName);
    docY = logic.defaultTop(docY, reportContent);
    docY.doc = await logic.addPageFooter(docY, requestID, reportMeta.disclaimer);
    return logic.finalizePDFDocument(docY.doc, requestID, reportMeta);
  },
};
