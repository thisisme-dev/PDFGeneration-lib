const constants = require('./constants');

module.exports = {
  setupPDFType: (type) => {
    switch (type) {
      case constants.PDFType.CONTENTS_OF_PAGE: {
        return pdfSetupResponse(new PageOfContents(), false);
      }
      case constants.PDFType.NO_SERVICE_RESPONSE_HEADER: {
        return pdfSetupResponse(null, false);
      }
      default: {
        return pdfSetupResponse(null, true);
      }
    }
  },
};

function pdfSetupResponse(pageOfContents, addBasicResponseHeader) {
  return {
    pageOfContents: pageOfContents,
    addBasicResponseHeader: addBasicResponseHeader,
  };
}
class PageOfContents {
  constructor() {
    this.details = [];
    this.pagePosition = 1;
  }
  incrementPage() {
    this.pagePosition++;
  }
  addPageDetails(section) {
    const details = {
      'section': section,
      'page': this.pagePosition,
    };

    this.details.push(details);
  }
  getPageOfContents() {
    return this.details;
  }
}
