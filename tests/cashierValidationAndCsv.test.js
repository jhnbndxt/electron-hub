import assert from 'node:assert/strict';
import test from 'node:test';
import { validatePaymentAmount } from '../src/utils/paymentAmountValidation.js';
import { escapeCSVCell, formatCurrencyForCSV } from '../src/utils/csvExportCore.js';

test('validates tuition amounts strictly', () => {
  for (const value of ['12', '12.5', '12.50', '0.99']) {
    assert.equal(validatePaymentAmount(value), '', value);
  }

  for (const value of ['12.', '.5', '1.2.3', 'abc', '-5', '', '12.345']) {
    assert.notEqual(validatePaymentAmount(value), '', value);
  }
});

test('escapes UTF-8 CSV values and protects formula-like text', () => {
  const csv = [
    '\uFEFF' + escapeCSVCell('₱ ñ é –'),
    escapeCSVCell('Name, "quoted"\nline'),
    escapeCSVCell('=SUM(A1:A2)'),
    formatCurrencyForCSV(1250.5),
  ].join(',');

  assert.equal(csv.charCodeAt(0), 0xfeff);
  assert.match(csv, /₱ ñ é –/);
  assert.match(csv, /"Name, ""quoted""\nline"/);
  assert.match(csv, /"'=SUM\(A1:A2\)"/);
  assert.match(csv, /1250\.50/);
});