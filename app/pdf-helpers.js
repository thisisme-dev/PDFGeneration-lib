const constants = require('./constants');

class PDFHelpers {
  constructor(event) {
    this.event = event;
  }

  textValueObj(text, value, lineType) {
    return {
      text: text,
      value: value,
      lineType: lineType,
    };
  }

  getDisplayableTextValue(value) {
    function startOfWordsToUpperCase(str) {
      return str.replace(/\w\S*/g, function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
      });
    }
    value = value.replace(/_/g, ' ');
    value = value.replace(/([a-z](?=[A-Z]))/g, '$1 ');
    value = startOfWordsToUpperCase(value);
    return value;
  }

  isSearchParameter(key, searchParams) {
    return key in searchParams;
  }

  populateSearchParams(searchParams) {
    const data = {};
    for (const key in this.event) {
      if (Object.prototype.hasOwnProperty.call(this.event, key)) {
        const value = this.event[key];
        if (this.isSearchParameter(key, searchParams) && value) {
          if (value.length > 0 || value === true || value === false) {
            data[key] = this.textValueObj(this.getDisplayableTextValue(key), value, constants.PDFDocumentLineType.DEFAULT_LINE);
          }
        }
      }
    }
    return data;
  }

  generateNoResultsPDFContent(requestTimestamp, dataSource, serviceSearchParams) {
    const content = this.getPDFContentTemplate(requestTimestamp, dataSource, 'No results were found using the below search criteria.', null, serviceSearchParams);
    return content;
  }

  getPDFContentTemplate(requestTimestamp, dataSource, errMsg, headers, serviceSearchParams) {
    // iterate pageheaders and build array of valid newPageHeaders
    let newPageHeaders = [];
    if (headers !== null) {
      for (const prop in headers) {
        if (Object.prototype.hasOwnProperty.call(headers, prop)) {
          const header = headers[prop]
          if (Object.prototype.hasOwnProperty.call(header, 'new_page')){
            if (header.new_page) {
              newPageHeaders.push(header.title);
            }
          }
        }
      }
    }

    return {
      requestTimestamp: requestTimestamp,
      error: errMsg,
      reportGeneratedFor: `${this.event.requester.client} @ ${this.event.requester.company}`,
      dataSource: dataSource,
      searchParams: this.populateSearchParams(serviceSearchParams, this.event),
      dataFound: {},
      requestId: this.event.request_id,
      newPageHeaders: newPageHeaders,
      pdfType: constants.PDFType.DEFAULT,
    };
  }
}

module.exports.PDFHelpers = PDFHelpers;
