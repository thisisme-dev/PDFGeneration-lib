# PDFGeneration Lib

## Rules

- Add your version/tag release information on the [change log](CHANGELOG.MD)
- If you require the Charts Type install `"vega": "5.17.0"`

## Getting started

- Add the library in your package.json under dependencies `"@thisisme/pdfgeneration-lib": "https://github.com/ThisIsMe-dev/PDFGeneration-lib#5.3.0"`
- npm install to install all your dependencies for your project

### Examples

- Create a pdf_req.js file in your service that exports the following:

#### Generates a PDF Report with Content

```JavaScript
generatePDFContent: (response, event, requestTimestamp, requestParams, dataSource) => {
console.log('Generating PDF Object');
const pdfLimiter = pdf.pdfLimiter;
const pdfHelpers = new pdf.PDFHelpers(event, requestTimestamp, dataSource, requestParams);
const reportHeaders = {
    businessInformation: {title: 'Business Information', new_page: true},
    linkedAddress: {title: 'Linked Addresses', new_page: true},
    aliases: {title: 'Known Aliases', new_page: false},
    notes: {title: 'Notes', new_page: true},
    linkedBusinesses: {title: 'Linked Businesses', new_page: false},
    linkedPersons: {title: 'Known Associates', new_page: true},
}; // These are custom headers for you service that the PDF needs to know are headers so it can adjust the look accordingly
const content = pdfHelpers.generateResultsFoundPDFStartingContent(reportHeaders, constants.PDFType.CONTENTS_OF_PAGE);
return populateRestOfReport(pdfLimiter, reportHeaders, pdfHelpers, response, content); // this is your custom function that handles the rest of your custom service's pdf
}
```

#### Generates a PDF Report without Content

```JavaScript
generateNoResultsPDFContent: (event, requestTimestamp, requestParams, dataSource) => {
const pdfHelpers = new pdf.PDFHelpers(event, requestTimestamp, dataSource, requestParams);
return pdfHelpers.generateNoResultsPDFContent();
}
```

#### Remember to include your modules

```JavaScript
const pdf = require('@thisisme/pdfgeneration-lib');
const constants = require('@thisisme/pdfgeneration-lib/app/constants');
```

## Current Types

### Document Types

```JavaScript
const PDFType = {
  DEFAULT: 0, // old style search/response
  CONTENTS_OF_PAGE: 1,
  NO_SERVICE_RESPONSE_HEADER: 2,
  COVER_AND_CONTENTS_OF_PAGE: 3,
};
```

### Document Line Types

```JavaScript
const PDFDocumentLineType = {
  DEFAULT_LINE: 0, // Just a placeholder, this currently does the same as a KEY_VALUE_LINE
  HEADER_LINE: 1, // A headerline (just a bit bolder than the normal lines)
  KEY_VALUE_LINE: 2, // The basic line we use for just a label and text line
  EMPTY_LINE: 3, // Functionally the same as END_LINE at the moment, this is just a more visible label for the user to understand what they are trying to accomplish
  ADDRESS_LINE: 4, // This splits a string on its commas into multiple lines
  COLUMN_INFO: 5, // This requires a value of object with rows defined in (SINGLE_COLUMN, DOUBLE_COLUMN, END_LINE) - this has a different type of header than META_INFO
  META_INFO: 6, // This requires a value of object with rows defined in (SINGLE_COLUMN, DOUBLE_COLUMN, END_LINE)
  SINGLE_COLUMN: 7, // This specifies that a row can only have 1 column
  DOUBLE_COLUMN: 8, // This specifies that you can have 2 columns
  END_LINE: 9, // Normally used to signal that your section ended
  GRID: 10, // Helps to create a list/table like display with columns, taking an array of objects
  TABLE_OF_CONTENTS_LINE: 11, // Line used to define table of contents page lines
  KEY_LINK_LINE: 12, // A line that allows the user to click to go to the provided URL
  INDICATIVE_BAR_LINE: 13, // Indicative bars designed with Credit Scores in mind
  IMAGE_LINE: 14, // A line that represents an image
  PAGE_BREAK: 15, // Skips to the top of a new page
}
```

### PDF Image Types

```JavaScript
const PDFImageType = {
  DEFAULT: 0, // Image(s) placed next to each other
  CENTER: 1, // Image positioned in the center of the line
}
```