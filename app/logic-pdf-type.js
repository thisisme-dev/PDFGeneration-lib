'use strict';

const contentsPDFLogic = require('./pdf-types/page-of-contents-logic');

const constants = require('./constants');

function setupPDFType(type) {
  function pdfSetupResponse(pageOfContents, addBasicResponseHeader) {
    return {
      pageOfContents: pageOfContents,
      addBasicResponseHeader: addBasicResponseHeader,
      hasCover: false,
    };
  }

  switch (type) {
    case constants.PDFType.CONTENTS_OF_PAGE: {
      return pdfSetupResponse(new contentsPDFLogic.PageOfContents(), false);
    }
    case constants.PDFType.COVER_AND_CONTENTS_OF_PAGE: {
      const pageSetup = pdfSetupResponse(new contentsPDFLogic.PageOfContents(), false);
      pageSetup.hasCover = true;
      return pageSetup;
    }
    case constants.PDFType.NO_SERVICE_RESPONSE_HEADER: {
      return pdfSetupResponse(null, false);
    }
    default: {
      return pdfSetupResponse(null, true);
    }
  }
}

module.exports = {
  setupPDFType,
};
