"use strict";

const coverPDFLogic = require("./pdf-types/cover-logic");

const constants = require("./constants");

class PDFHelpers {
  constructor(event, reportData) {
    const {requestTimestamp, dataSource, requestParams, isCoverPagePDF} = reportData;
    this.event = event;
    this.isCoverPagePDF = isCoverPagePDF;
    this.requestTimestamp = requestTimestamp;
    this.dataSource = dataSource;
    this.serviceSearchParams = requestParams;
  }

  textValueObj(text, value, lineType, font, options = false) {
    if (text == null) {
      text = "";
    }
    return {
      header: text,
      text: text.toUpperCase(),
      value: value,
      lineType: lineType,
      font: font,
      options: options,
    };
  }

  textIconObj(text, value, lineType, options = false, font = false) {
    if (text == null) {
      text = "";
    }
    return {
      header: text,
      text: text.toUpperCase(),
      value: value,
      lineType: lineType,
      options: options,
      font: font,
    };
  }

  chartObj(label, results, incrementX, hasMore, isSameLine) {
    const obj = {
      header: label,
      text: label,
      value: results,
      lineType: constants.PDFDocumentLineType.CHART_LINE,
    };

    obj.value["coords"] = {
      incrementX: incrementX,
      hasMore: hasMore,
      isSameLine: isSameLine,
    };
    return obj;
  }

  headerLine(title) {
    return {
      header: title,
      text: title,
      lineType: constants.PDFDocumentLineType.HEADER_LINE,
    };
  }

  hLine(text, lineType, options) {
    if (text == null) {
      text = "";
    }

    return {
      header: text,
      text: text.toUpperCase(),
      lineType: lineType,
      options: options,
    };
  }

  addImageLineFromPath(imageURL, imageType, imageDescriptions, options = false) {
    const imageObj = {
      imageType: imageType,
      imageRules: {
        width: 200,
        height: 140,
      },
      imageDescriptions: imageDescriptions,
      data: imageURL,
      options: options,
    };
    return this.textValueObj("", imageObj, constants.PDFDocumentLineType.IMAGE_LINE);
  }

  addImageLineFromBase64(base64str, imageType, imageDescriptions, options = false) {
    const buf = Buffer.from(base64str, "base64");
    return this.addImageLineFromPath(buf, imageType, imageDescriptions, options);
  }

  endSection() {
    return {
      lineType: constants.PDFDocumentLineType.END_LINE,
    };
  }

  emptyLine() {
    return {
      lineType: constants.PDFDocumentLineType.EMPTY_LINE,
    };
  }

  moveToNextPage() {
    return {
      lineType: constants.PDFDocumentLineType.PAGE_BREAK,
    };
  }

  getDefaultCoverPageSetup(coverReportName) {
    const searchParams = {
      headers: ["", ""],
      rows: [],
    };

    searchParams.rows.push([
      {text: "Request Timestamp", align: constants.PDFTableColumnTextAlign.LEFT},
      {text: this.requestTimestamp, align: constants.PDFTableColumnTextAlign.RIGHT},
    ]);

    for (const [key] of Object.entries(this.serviceSearchParams)) {
      let value = this.event[key];
      if (value === undefined || value === null || value.trim().length === 0) {
        value = "Not Supplied";
      } else {
        value = this.event[key];
      }
      searchParams.rows.push([
        {text: this.getDisplayableTextValue(key), align: constants.PDFTableColumnTextAlign.LEFT},
        {text: value, align: constants.PDFTableColumnTextAlign.RIGHT},
      ]);
    }
    return coverPDFLogic.getDefaultCoverDesign(coverReportName, searchParams);
  }

  getDisplayableTextValue(value) {
    function startOfWordsToUpperCase(str) {
      return str.replace(/\w\S*/g, (txt) => {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      });
    }
    value = value.replace(/_/g, " ");
    value = value.replace(/([a-z](?=[A-Z]))/g, "$1 ");
    value = startOfWordsToUpperCase(value);
    return value;
  }

  isSearchParameter(key) {
    return key in this.serviceSearchParams;
  }

  populateSearchParams() {
    const data = {};
    for (const key in this.event) {
      if (Object.prototype.hasOwnProperty.call(this.event, key)) {
        const value = this.event[key];
        if (this.isSearchParameter(key) && value) {
          if (value.length > 0 || value === true || value === false) {
            data[key] = this.textValueObj(
                this.getDisplayableTextValue(key),
                value,
                constants.PDFDocumentLineType.DEFAULT_LINE,
            );
          }
        }
      }
    }
    return data;
  }

  generateResultsFoundPDFStartingContent(reportHeaders, pdfType) {
    const content = this.getPDFContentTemplate(null, reportHeaders);
    if (pdfType !== null) {
      content.pdfType = pdfType;
    }
    return content;
  }

  generateNoResultsPDFContent() {
    const content = this.getPDFContentTemplate("No results were found using the below search criteria.", null);
    return content;
  }

  getPDFContentTemplate(errMsg, headers) {
    const newPageHeaders = [];
    if (headers !== null) {
      for (const prop in headers) {
        if (Object.prototype.hasOwnProperty.call(headers, prop)) {
          const header = headers[prop];
          if (Object.prototype.hasOwnProperty.call(header, "new_page")) {
            if (header.new_page) {
              newPageHeaders.push(header.title);
            }
          }
        }
      }
    }
    return {
      requestTimestamp: this.requestTimestamp,
      error: errMsg,
      reportGeneratedFor: `${this.event.requester.client || this.event.requester.user} @ ${this.event.requester.company}`,
      dataSource: this.dataSource,
      searchParams: this.populateSearchParams(),
      dataFound: {},
      requestId: this.event.request_id,
      newPageHeaders: newPageHeaders,
      pdfType: constants.PDFType.DEFAULT,
    };
  }
}

module.exports.PDFHelpers = PDFHelpers;
