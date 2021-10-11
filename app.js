"use strict";

const dateTime = require("node-datetime");

const constants = require("./app/constants");
const logic = require("./app/logic");
const helpers = require("./app/pdf-helpers");
const PDFLimiter = require("./app/pdf-limitations").PDFLimiter;

const pdfLimiter = new PDFLimiter();

module.exports = {
  constants,
  pdfLimiter: pdfLimiter,
  textValueObj: logic.textValueObj,
  PDFHelpers: helpers.PDFHelpers,
  getPDFContentTemplate: logic.getPDFContentTemplate,
  generateReportData: (serviceConfigs, providerConfigs, localDebug, requestInDebugMode) => {
    const dt = dateTime.create();
    const data = {
      metaData: {
        formatted: dt.format("Y-m-d"),
        s3BucketName: serviceConfigs.S3_REPORT_FOLDER,
        reportName: serviceConfigs.REPORT_NAME,
        LOCAL_DEBUG: localDebug,
        DEBUG: requestInDebugMode,
      },
      requestTimestamp: dt.format("Y-m-d H:M:S"),
      requestParams: providerConfigs.SEARCH_PARAMS,
      dataSource: providerConfigs.DATASOURCE,
      reportHeaders: serviceConfigs.REPORT_HEADERS,
      reportDescription: serviceConfigs.REPORT_DESCRIPTION,
      serviceName: serviceConfigs.SERVICE_NAME,
      reportEnabledSettings: serviceConfigs.REPORT_ENABLED_BY_DEFAULT,
    };
    dt.offsetInDays(3);
    data.expiryDate = `${dt.format("w, d n Y H:M:S")} UTC`;
    if (requestInDebugMode) {
      console.log(data);
    }
    return data;
  },
  generateNoResultsPDFContent: logic.generateNoResultsPDFContent,
  generateReport: async (reportContent, reportMeta) => {
    try {
      const requestID = reportContent.requestId;
      const pageSetup = logic.setupPDFType(reportContent.pdfType);
      const pageOfContents = pageSetup.pageOfContents;
      let docY = logic.createPDFDocument(requestID, reportMeta.reportName, pageOfContents, pageSetup.hasCover);
      if (pageSetup.hasCover) {
        docY = await logic.addCoverPage(docY, reportContent["coverDetails"]);
        if (pageOfContents !== null && pageOfContents !== undefined) {
          docY.doc.createNewPage();
        }
      } else {
        docY = await logic.defaultTop(docY, reportContent);
        if (pageOfContents !== null && pageOfContents !== undefined) {
          docY.doc.createNewPage();
        }
        if (pageSetup.addBasicResponseHeader && !pageSetup.hasCover) {
          docY = await logic.addHeadline(docY, "RESULTS", "list");
        }
      }
      docY = await logic.addPageDetail(docY, reportContent["dataFound"], reportContent.newPageHeaders, pageOfContents, pageSetup.hasCover);
      docY.doc = await logic.addPageFooter(docY, requestID);
      return await logic.finalizePDFDocument(docY.doc, requestID, reportMeta, pageOfContents, pageSetup.hasCover);
    } catch (error) {
      console.log(constants.ERRORS.GENERATE_ERROR);
      console.error(error.stack);
    }
  },
  generateNoResultsReport: async (reportContent, reportMeta) => {
    try {
      const requestID = reportContent.requestId;
      const pageSetup = logic.setupPDFType(reportContent.pdfType);
      const pageOfContents = null;
      let docY = logic.createPDFDocument(requestID, reportMeta.reportName, pageOfContents, pageSetup.hasCover);
      docY = await logic.defaultTop(docY, reportContent);
      docY.doc = await logic.addPageFooter(docY, requestID);
      return await logic.finalizePDFDocument(docY.doc, requestID, reportMeta, pageOfContents, pageSetup.hasCover);
    } catch (error) {
      console.log(constants.ERRORS.GENERATE_ERROR);
    }
  },
};
