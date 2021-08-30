"use strict";

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
      "section": section,
      "page": this.pagePosition,
    };

    this.details.push(details);
  }
  getPageOfContents() {
    return this.details;
  }
}

module.exports.PageOfContents = PageOfContents;
