'use strict';

const constants = require('../constants');

// cover disclaimer label
const COVER_DISCLAIMER_LABEL = 'STRICTLY PRIVATE AND CONFIDENTIAL';
// cover disclaimer
let COVER_DISCLAIMER = 'This document contains proprietary and strictly confidential information, including personal information (as defined by the Protection of Personal Information Act). It is for the intended recipient only. If you are not the intended recipient you must not use, disclose, distribute, copy, print or otherwise share this document or its information.';
COVER_DISCLAIMER += '\n\nThis report may only be used for the prescribed purpose it was requested for.';
COVER_DISCLAIMER += '\n\nOwing to the sensitive nature of the information contained in this report, it must be treated with care and diligently deleted after use.';

async function addCoverPage(docY, reportContent) {
  function addCoverReportName(doc, reportName) {
    const page = doc.page;
    doc.font('OpenSansBold').fontSize(20).fillColor('#333333').text(
        reportName.trim(),
        page.width / 2 - doc.widthOfString(reportName) / 2,
        page.height - 550,
        {width: page.width},
    );
    return doc;
  }
  function addCoverRequestDetails(doc, searchParams) {
    const page = doc.page;
    doc.font('OpenSansLight').fontSize(12).fillColor('#333333');
    doc.moveDown().table(
        searchParams.data,
        page.width / 2 - searchParams.width / 2,
        page.height - searchParams.subtractFromMaxHeight,
        {width: searchParams.width},
        constants.PDFTableType.COVER,
    );
    return doc;
  }
  function addCoverDisclaimerLabel(doc, disclaimerLabel) {
    const page = doc.page;
    doc.font('OpenSansBold').fontSize(14).fillColor('#333333').text(
        disclaimerLabel.trim(),
        page.width / 2 - doc.widthOfString(disclaimerLabel) / 2,
        page.height - 300,
        {width: page.width},
    );
    return doc;
  }
  function addCoverDisclaimer(doc, disclaimer) {
    const page = doc.page;

    doc.rect(
        50,
        page.height - 230,
        page.width - 100,
        155,
    ).fillColor('#F9F9F9').strokeColor(constants.PDFColors.NORMAL_COLOR).fillAndStroke();
    doc.font('OpenSansLight').fontSize(12).fillColor('#333333').text(
        disclaimer.trim(),
        60,
        page.height - 225,
        {width: page.width - 110},
    );
    return doc;
  }

  // reportContent = examplePayload()

  let doc;
  doc = addCoverReportName(docY.doc, reportContent.coverReportName);
  doc = addCoverRequestDetails(doc, reportContent.searchParams);
  doc = addCoverDisclaimerLabel(doc, reportContent.coverDisclaimerLabel);
  doc = addCoverDisclaimer(doc, reportContent.coverDisclaimer);
  doc.addPage();

  return {
    doc: doc,
    y: constants.TOP_OF_PAGE_Y,
  };
}

function getDefaultCoverDesign(coverReportName, searchParams) {
  return {
    coverReportName: coverReportName,
    coverDisclaimerLabel: COVER_DISCLAIMER_LABEL,
    coverDisclaimer: COVER_DISCLAIMER,
    searchParams: {
      data: searchParams,
      subtractFromMaxHeight: 450,
      width: 300,
    },
  };
}

module.exports = {
  addCoverPage,
  getDefaultCoverDesign,
};
