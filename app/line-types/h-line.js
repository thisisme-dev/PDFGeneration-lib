'use strict';

const sectionTypeLogic = require('./base-logic');


module.exports = {
  generateLineThatIsH,
};

function generateLineThatIsH(doc, x, y, text, value, lineType, options=false) {
    doc = sectionTypeLogic.populateHLine(doc, text, value, x, doc.y, lineType, options);

    return sectionTypeLogic.docYResponse(doc, doc.y);
}