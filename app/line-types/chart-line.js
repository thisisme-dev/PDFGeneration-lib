"use strict";

const constants = require("../constants");
const utils = require("../utils");

async function generateChart(doc, y, chartLabel, results) {
  if (!results.coords["isSameLine"]) {
    const docY = doc.getDocY(constants.PDFDocumentLineType.CHART_LINE, y, 1, false);
    doc = docY.doc;
    y = docY.y;
  }
  return await addChart(doc, chartLabel, results, y);
}

async function addChart(doc, chartLabel, results, y) {
  const incrementY = constants.INCREMENT_MAIN_Y;

  const vega = require("vega");
  vega.scheme("myscheme", ["#708090", "#fff", "#00f", "#ff0", "#f0f", "#0ff"]);

  doc.fillColor(constants.PDFColors.NORMAL_COLOR);
  const coords = results.coords;
  delete results.coords;
  const x = coords.incrementX;
  doc.rect(x, y, 275, 20).stroke();

  const {fontSize, boldFont, lightFont} = utils.setComponentFont("OpenSansSemiBitalic", "OpenSansLight", constants.NORMAL_FONT_SIZE);

  doc.font(lightFont).fontSize(fontSize + 1).text(chartLabel, x, y + 4, {align: "center", width: 275});
  const stackedBarChartSpec = require("../../configs/stacked-bar-chart.spec.json");
  stackedBarChartSpec.data[0].values = [
    {id: 1, field: parseInt(results.score)},
    {id: 2, field: 800 - parseInt(results.score)},
  ];
  const chartData = vega.parse(stackedBarChartSpec);
  const view = new vega.View(chartData).renderer("svg").initialize();
  const canvasX = x + 60;
  const canvasY = y + 40;

  const pdfImage = await generatePDFImage(view);
  doc.image(pdfImage, canvasX, canvasY, {width: 150});

  doc.font(boldFont).fontSize(fontSize + 12).text(results.score, x + 120, y + 98);
  let t = y + 220;
  doc.font(boldFont).fontSize(fontSize).text("Notes: ", x + 33, t + 10);
  const reasons = results.reasons;
  reasons.forEach((element) => {
    t += 10;
    doc.font(lightFont).fontSize(fontSize).text(element["reasonDescription"], x + 65, t);
  });
  // increase next line y coord with valid reasons length
  const nextLineYCoord = (coords.hasMore ? y : t + incrementY);
  return doc.docYResponse(nextLineYCoord);
}

function generatePDFImage(view) {
  const sharp = require("sharp");
  return new Promise((resolve, reject) => {
    try {
      view.toSVG().then((svg) => {
        sharp(Buffer.from(svg)).png().toBuffer().then((buffer) => {
          resolve(buffer);
        }).catch((err) => {
          console.log("Error encountered creating buffer from svg");
          console.log(err);
        });
      }).catch((err) => {
        console.log("Error encountered when adjusting view to SVG");
        console.log(err);
      });
    } catch (err) {
      console.log("Error encountered when trying to create SVG/PNG image with Vega");
      reject(err);
    }
  });
}

module.exports = {
  generateChart,
};
