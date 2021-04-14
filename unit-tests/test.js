'use strict';

const fs = require('fs');
const appLogic = require('../app/logic');

test('Test if QRCode generation responds', () => {
  appLogic.generateQRCode('fake_data').then((data) => {
    expect(data).toBeTruthy();
  });
});

test('Test if QRCode generation responds correctly', () => {
  appLogic.generateQRCode('fake_data').then((data) => {
    fs.readFile(`${__dirname}/fake-data/test_qrcode_binary`, {encoding: 'utf8', flag: 'r'}, (err, testBinaryData) => {
      expect(testBinaryData == data).toBeTruthy();
    });
  });
});
