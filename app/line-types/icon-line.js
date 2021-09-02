'use strict';

const sectionTypeLogic = require('./base-logic');
// const constants = require('../constants');

module.exports = {
    populateIconLine,
};

// populateLine : populates a line with the stipulated text and settings
    function populateIconLine(doc, x, y, text, value, incrementY, headerColor, getDocY, font) {

        let boldFont = 'OpenSansSemiBold';
        let lightFont = 'OpenSansLight';
    
        // doc.y += 7;
        doc.font(lightFont).fontSize(8).fillColor(headerColor).text(text, x, y, {
            width: 370,
            lineGap: 10,
            ellipsis: true,
          });

        doc.x += 180;
        y += 2;

        // switch(value.toLowerCase()) {
        //     case 'y': 
        //     case true:
        //     case 'true': {
        //     doc.image(`${sectionTypeLogic.constants.PACKAGE_PATH}images/icon-y.png`, doc.x, doc.y, {width: 8});
        //     break;
        //     }
        //     case 'n': 
        //     case false:
        //     case 'false': {
        //     doc.image(`${sectionTypeLogic.constants.PACKAGE_PATH}images/icon-n.png`, doc.x, doc.y, {width: 8});
        //     break;
        //     }
        //     case 'u': {
        //     doc.image(`${sectionTypeLogic.constants.PACKAGE_PATH}images/icon-u.png`, doc.x, doc.y, {width: 8});
        //     break;
        //     }
        //     default: {
        //         doc.font(boldFont).fontSize(8).text(value, x + xAdditionalWidth, y, {
        //             width: 370,
        //             lineGap: 10,
        //             ellipsis: true,
        //         });
        //     break;
        //     }
        // }

            value = value.toLowerCase();
            if (value == 'y' || value == true || value == 'true') {
                doc.image(`${sectionTypeLogic.constants.PACKAGE_PATH}images/icon-y.png`, doc.x, y, {width: 8});

            } else if (value == 'n' || value == 'false' || value == false) {
                doc.image(`${sectionTypeLogic.constants.PACKAGE_PATH}images/icon-n.png`, doc.x, y, {width: 8});

            } else if (value == 'u' || value == 'unknown') {
                doc.image(`${sectionTypeLogic.constants.PACKAGE_PATH}images/icon-u.png`, doc.x, y, {width: 8});

            } else {
                doc.font(boldFont).fontSize(8).text(value, x + xAdditionalWidth, y, {
                    width: 370,
                    lineGap: 10,
                    ellipsis: true,
                });
            }

            doc = sectionTypeLogic.underline(doc, x, y);
            y += incrementY;

        
    return sectionTypeLogic.docYResponse(doc, y);
  }