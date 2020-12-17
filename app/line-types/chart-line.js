const constants = require('../constants');
const sectionTypeLogic = require('./base-logic');

const vega = require('vega');
vega.scheme('myscheme', ['#708090', '#fff', '#00f', '#ff0', '#f0f', '#0ff']);

async function generateChart(doc, y, chartLabel, results, incrementY, getDocY) {
  if (!results.coords['isSameLine']) {
    const docY = getDocY(doc, y, incrementY, 1, false);
    doc = docY.doc;
    y = docY.y;
  }
  return await addChart(doc, chartLabel, results, y);
}

async function addChart(doc, chartLabel, results, y) {
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

  view.toCanvas().then(function(canvas) {
    doc.image(canvas.toBuffer(), canvasX, canvasY, {width: 150});
  }).catch(function(err) {
    console.log('Error encountered when adding chart to pdf');
    console.log(err);
  });
  doc.font('OpenSansSemiBitalic').fontSize(20).text(results.score, x + 120, y + 98);
  let t = y + 220;
  doc.font('OpenSansSemiBitalic').fontSize(8).text('Notes: ', x + 33, t + 10);
  const reasons = results.reasons;
  reasons.forEach((element) => {
    t += 10;
    doc.font('OpenSansLight').fontSize(8).text(element['reasonDescription'], x + 65, t);
  });
  // increase next line y coord with valid reasons length
  const nextLineYCoord = (coords.hasMore ? y : y + t);
  return sectionTypeLogic.docYResponse(doc, nextLineYCoord);
}

module.exports = {
  generateChart,
};
