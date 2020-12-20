const constants = require('../constants');
const sectionTypeLogic = require('./base-logic');

async function generateChart(doc, y, chartLabel, results, incrementY, getDocY) {
  if (!results.coords['isSameLine']) {
    const docY = getDocY(doc, y, incrementY, 1, false);
    doc = docY.doc;
    y = docY.y;
  }
  return await addChart(doc, chartLabel, results, y, incrementY);
}

async function addChart(doc, chartLabel, results, y, incrementY) {
  const vega = require('vega');
  vega.scheme('myscheme', ['#708090', '#fff', '#00f', '#ff0', '#f0f', '#0ff']);

  doc.fillColor(constants.PDFColors.NORMAL_COLOR);
  const coords = results.coords;
  delete results.coords;
  const x = coords.incrementX;
  doc.rect(x, y, 275, 20).stroke();
  doc.font('OpenSansLight').fontSize(9).text(chartLabel, x, y + 4, {align: 'center', width: 275});
  const stackedBarChartSpec = require('../../configs/stacked-bar-chart.spec.json');
  stackedBarChartSpec.data[0].values = [
    {id: 1, field: parseInt(results.score)},
    {id: 2, field: 800 - parseInt(results.score)},
  ];
  const chartData = vega.parse(stackedBarChartSpec);
  const view = new vega.View(chartData).renderer('svg').initialize();
  const canvasX = x + 60;
  const canvasY = y + 40;

  const pdfImage = await generatePDFImage(view);
  doc.image(pdfImage, canvasX, canvasY, {width: 150})

  doc.font('OpenSansSemiBitalic').fontSize(20).text(results.score, x + 120, y + 98);
  let t = y + 220;
  doc.font('OpenSansSemiBitalic').fontSize(8).text('Notes: ', x + 33, t + 10);
  const reasons = results.reasons;
  reasons.forEach((element) => {
    t += 10;
    doc.font('OpenSansLight').fontSize(8).text(element['reasonDescription'], x + 65, t);
  });
  // increase next line y coord with valid reasons length
  const nextLineYCoord = (coords.hasMore ? y : t + incrementY);
  return sectionTypeLogic.docYResponse(doc, nextLineYCoord);
}

function generatePDFImage(view) {
  const sharp = require('sharp');
  return new Promise((resolve, reject) => {
    try {
      view.toSVG().then((svg) => {
        sharp(Buffer.from(svg)).png().toBuffer().then((buffer) => {
          console.log(buffer)
          resolve(buffer);
        }).catch(function(err) {
          console.log('Error encountered creating buffer from svg');
          console.log(err);
        });
      }).catch(function(err) {
        console.log('Error encountered when adjusting view to SVG');
        console.log(err);
      });
    } catch (err) {
      console.log('Error encountered when trying to create SVG/PNG image with Vega');
      reject(err);
    }
  });
}

module.exports = {
  generateChart,
};
