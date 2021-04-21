'use strict';

describe('configs', () => {
  beforeEach(() => {
    process.env.TIM_AWS_DEFAULT_REGION = 'test1';
    process.env.AWS_S3_REPORTS_BUCKET = 'test2';
    process.env.THISISME_HOST = 'test3';
  });
  test('configs values populated', () => {
    const configs = require('../../app/configs');

    expect(configs.AWS_DEFAULT_REGION).toBe('test1');
    expect(configs.AWS_S3_REPORTS_BUCKET).toBe('test2');
    expect(configs.THISISME_HOST).toBe('test3');
  });
});
