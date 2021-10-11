"use strict";

const PDFDocument = require("pdfkit");

const utils = require("../utils");
const constants = require("../constants");

class PDFDocumentCustomized extends PDFDocument {
  constructor(options) {
    super(options);
  }

  // populateLine : populates a line with the stipulated text and settings
  populateLine(headerColor, text, value, x, xAdditionalWidth, y, font) {
    const {fontSize, boldFont, lightFont} = utils.setComponentFont("OpenSansSemiBold", "OpenSansLight", constants.NORMAL_FONT_SIZE, font);
    this.font(lightFont).fontSize(fontSize).fillColor(headerColor).text(text, x, y);
    this.font(boldFont).fontSize(fontSize).text(value, x + xAdditionalWidth, y, {
      width: 370,
      lineGap: 10,
      ellipsis: true,
    });

    return this;
  }

  populateHeaderLine(text, x, y, hType) {
    if (hType == constants.PDFHeaderType.H1_LINE) {
      this
          .roundedRect(constants.PD.MARGIN, y, (constants.PD.WIDTH - (constants.PD.MARGIN) * 2), 26, 2)
          .fill(constants.PDColors.BG_LIGHT, "#000");

      this.image(`${constants.PACKAGE_PATH}images/icon-clock.png`, (constants.PD.MARGIN + constants.PD.PADDING ), (y + 7), {height: 12});

      this
          .fillColor(constants.PDColors.TEXT_DARK)
          .font("OpenSansSemiBold")
          .fontSize(10)
          .text(text, (constants.PD.MARGIN + constants.PD.PAD_FOR_IMAGE_TEXT), (y + 6));
    } else if (hType == constants.PDFHeaderType.H2_LINE) {
      this
          .fillColor(constants.PDColors.TEXT_DARK)
          .font("OpenSansSemiBold")
          .fontSize(10)
          .text(text, x, y);

      this.underline(x, y + 5, 3);
    } else if (hType == constants.PDFHeaderType.H3_LINE) {
      this
          .fillColor(constants.PDColors.TEXT_DARK)
          .font("OpenSansSemiBold")
          .fontSize(9)
          .text(text, x, y);
    }

    return this;
  }

  // underline: underlines a line on the PDF doc
  underline(x, y, thickness = 0.5) {
    return this.moveTo(x, y + constants.INCREMENT_UNDERLINE)
        .lineTo(this.page.width - constants.PD.MARGIN, y + constants.INCREMENT_UNDERLINE)
        .strokeColor("#EEEEEE")
        .lineWidth(thickness)
        .stroke();
  }

  /**
   * Creates a table component, specifically aimed at the cover page at the moment
   * @param {*} table
   * @param {*} arg0
   * @param {*} arg1
   * @param {*} arg2
   * @param {*} type
   * @returns
   */
  table(table, arg0, arg1, arg2, type) {
    // if (type === constants.PDFTableType.COVER) {
    //   console.log("Cover Table being created");
    // }
    let startX = this.page.margins.left;
    let startY = this.y;
    let options = {};

    if ((typeof arg0 === "number") && (typeof arg1 === "number")) {
      startX = arg0;
      startY = arg1;

      if (typeof arg2 === "object") {
        options = arg2;
      }
    } else if (typeof arg0 === "object") {
      options = arg0;
    }

    const columnCount = table.headers.length;
    const columnSpacing = options.columnSpacing || 15;
    const rowSpacing = options.rowSpacing || 5;
    const usableWidth = options.width || (this.page.width - this.page.margins.left - this.page.margins.right);

    const prepareHeader = options.prepareHeader || (() => {});
    const prepareRow = options.prepareRow || (() => {});
    const computeRowHeight = (row) => {
      let result = 0;

      row.forEach((cell) => {
        const cellHeight = this.heightOfString(cell, {
          width: columnWidth,
          align: "left",
        });
        result = Math.max(result, cellHeight);
      });

      return result + rowSpacing;
    };

    const columnContainerWidth = usableWidth / columnCount;
    const columnWidth = columnContainerWidth - columnSpacing;
    const maxY = this.page.height - this.page.margins.bottom;

    let rowBottomY = 0;

    this.on("pageAdded", () => {
      startY = this.page.margins.top;
      rowBottomY = 0;
    });

    // Allow the user to override style for headers
    prepareHeader();

    // Check to have enough room for header and first rows
    if (startY + 3 * computeRowHeight(table.headers) > maxY) {
      this.createNewPage();
    }

    // Print all headers
    table.headers.forEach((headerValue, i) => {
      const TextStartX = startX + i * columnContainerWidth + 5;
      this.text(headerValue, TextStartX, startY, {
        width: columnWidth,
        align: "left",
      });
    });

    // Refresh the y coordinate of the bottom of the headers row
    rowBottomY = Math.max(startY + computeRowHeight(table.headers), rowBottomY);

    // Separation line between headers and rows
    this.moveTo(startX, rowBottomY - rowSpacing * 0.5)
        .lineTo(startX + usableWidth, rowBottomY - rowSpacing * 0.5)
        .lineWidth(1)
        .stroke();

    table.rows.forEach((row, i) => {
      const rowHeight = computeRowHeight(row);

      // Switch to next page if we cannot go any further because the space is over.
      // For safety, consider 3 rows margin instead of just one
      if (startY + 3 * rowHeight < maxY) {
        startY = rowBottomY + rowSpacing;
      } else {
        this.createNewPage();
      }

      // Allow the user to override style for rows
      prepareRow(row, i);

      // Refresh the y coordinate of the bottom of this row
      rowBottomY = Math.max(startY + rowHeight, rowBottomY);

      // Print all cells of the current row
      row.forEach((cellValue, i) => {
        const ColumnLineStartX = startX + i * columnContainerWidth;
        const ColumnLineEndX = startX + (i + 1) * columnContainerWidth;
        if (type === constants.PDFTableType.COVER) {
          const TextStartX = ColumnLineStartX + (cellValue.align === constants.PDFTableColumnTextAlign.RIGHT ? 10 : 5);
          this.text(cellValue.text, TextStartX, startY, {
            width: columnWidth,
            align: (cellValue.align === constants.PDFTableColumnTextAlign.LEFT ? "left" : "right"),
          });
        } else {
          const TextStartX = ColumnLineStartX + 5;
          this.text(cellValue, TextStartX, startY, {
            width: columnWidth,
            align: "left",
          });
        }

        this.moveTo(ColumnLineStartX, startY - rowSpacing - 3)
            .lineTo(ColumnLineStartX, rowBottomY - rowSpacing + 3)
            .lineWidth(1)
            .stroke();

        this.moveTo(ColumnLineEndX, startY - rowSpacing - 3)
            .lineTo(ColumnLineEndX, rowBottomY - rowSpacing + 3)
            .lineWidth(1)
            .stroke();
      });

      // Separation line between rows
      this.moveTo(startX, rowBottomY - rowSpacing * 0.5)
          .lineTo(startX + usableWidth, rowBottomY - rowSpacing * 0.5)
          .lineWidth(1)
          .stroke();
    });

    this.x = startX;
    this.moveDown();

    return this;
  }

  image(src, x, y, options = {}) {
    let bh; let bp; let bw; let image; let ip; let left; let left1;

    if (typeof x === "object") {
      options = x;
      x = null;
    }

    x = (left = x != null ? x : options.x) != null ? left : this.x;
    y = (left1 = y != null ? y : options.y) != null ? left1 : this.y;

    if (typeof src === "string") {
      image = this._imageRegistry[src];
    }

    if (!image) {
      if (src.width && src.height) {
        image = src;
      } else {
        image = this.openImage(src);
      }
    }

    if (!image.obj) {
      image.embed(this);
    }

    if (this.page.xobjects[image.label] == null) {
      this.page.xobjects[image.label] = image.obj;
    }

    let w = options.width || image.width;
    let h = options.height || image.height;

    if (options.width && !options.height) {
      const wp = w / image.width;
      w = image.width * wp;
      h = image.height * wp;
    } else if (options.height && !options.width) {
      const hp = h / image.height;
      w = image.width * hp;
      h = image.height * hp;
    } else if (options.scale) {
      w = image.width * options.scale;
      h = image.height * options.scale;
    } else if (options.fit) {
      [bw, bh] = options.fit;
      bp = bw / bh;
      ip = image.width / image.height;

      if (ip > bp) {
        w = bw;
        h = bw / ip;
      } else {
        h = bh;
        w = bh * ip;
      }
    } else if (options.cover) {
      [bw, bh] = options.cover;
      bp = bw / bh;
      ip = image.width / image.height;

      if (ip > bp) {
        h = bh;
        w = bh * ip;
      } else {
        w = bw;
        h = bw / ip;
      }
    }

    if (options.fit || options.cover) {
      if (options.align === "center") {
        x = x + bw / 2 - w / 2;
      } else if (options.align === "right") {
        x = x + bw - w;
      }

      if (options.valign === "center") {
        y = y + bh / 2 - h / 2;
      } else if (options.valign === "bottom") {
        y = y + bh - h;
      }
    } // create link annotations if the link option is given


    if (options.link != null) {
      this.link(x, y, w, h, options.link);
    }

    if (options.goTo != null) {
      this.goTo(x, y, w, h, options.goTo);
    }

    if (options.destination != null) {
      this.addNamedDestination(options.destination, "XYZ", x, y, null);
    } // Set the current y position to below the image if it is in the document flow


    if (this.y === y) {
      this.y += h;
    }

    this.save();
    this.transform(w, 0, 0, -h, x, y + h);
    this.addContent(`/${image.label} Do`);
    this.restore();
    this.y = y + h;
    return this.annotate(x, y, w, h, options);
  }

  /**
   * Creates a new PDF Document page and returns the coordinates for continuation
   * @returns
   */
  createNewPage() {
    // console.log("CREATED NEW PAGE");
    this.addPage();
    return this.docYResponse(constants.TOP_OF_PAGE_Y);
  }

  /**
   * Creates an easy to refer to docY object, containing the the PDF Document and the current Y coord
   * @param {*} y
   * @returns
   */
  docYResponse(y) {
    return {
      doc: this,
      y: y,
    };
  }

  /**
   * Use this to obtain the doc and newest Y coordinate before you start creating new lines
   * @param {*} lineType
   * @param {*} currentY
   * @param {*} sectionRows
   * @param {*} isSubHeader
   * @param {*} text
   * @returns
   */
  getDocY(lineType, currentY, sectionRows, isSubHeader, text) {
    // this function needs the lineType for the object,
    // we have case where we don't just deal with lines,
    // but objects with lines
    const headerLowest = 770; // the lowest y for a header
    const noFooterLimit = 806; // lowest y for a row

    const isHeader = (lineType === constants.PDFDocumentLineType.HEADER_LINE) || isSubHeader;

    if (lineType === constants.PDFDocumentLineType.END_LINE) {
      // TODO: should add empty_line as well
      if (currentY > constants.TOP_OF_PAGE_Y) {
        if (currentY >= headerLowest) {
          return this.docYResponse(currentY);
        }
      }
    } else {
      let incrementY = constants.INCREMENT_MAIN_Y;
      let rowsIncrementY = (sectionRows * incrementY);
      let endY = rowsIncrementY + currentY;

      if (lineType === constants.PDFDocumentLineType.META_INFO || lineType === constants.PDFDocumentLineType.COLUMN_INFO) {
        incrementY = constants.INCREMENT_SUB_Y;
        if (isHeader) {
          const sectionsToMutiplyWith = sectionRows > 1 ? sectionRows - 1 : sectionRows;
          rowsIncrementY = constants.INCREMENT_MAIN_Y + (sectionsToMutiplyWith * incrementY);
        } else {
          rowsIncrementY = (sectionRows * incrementY);
        }
        endY = rowsIncrementY + currentY;
      }

      if (endY > constants.TOP_OF_PAGE_Y) {
        // if (text) {
        //   this is where the next line will most likely start
        //   console.log(`${currentY + incrementY} ${endY} ${text}`)
        //   this is where we are at currently
        //   console.log(`${currentY} ${endY} ${text}`)
        // }
        if ((isHeader && (endY >= headerLowest)) || (endY >= noFooterLimit)) {
          return this.createNewPage();
        }
      }
    }
    return this.docYResponse(currentY);
  }
}

module.exports = PDFDocumentCustomized;
