const { extractEligibleIdentifiersFromSheet } = require('../server/utils/registration-eligibility');

describe('registration eligibility parser', () => {
  test('extracts paid Football Language System accounts from a header-based sheet', () => {
    const values = [
      ['Order ID', 'Product', 'Status', 'Email'],
      ['1001', 'Football Language System', 'Paid', 'alice@example.com'],
      ['1002', 'Football Language System', 'Pending', 'bob@example.com'],
      ['1003', 'Other Course', 'Paid', 'carol@example.com'],
    ];

    expect(extractEligibleIdentifiersFromSheet(values)).toEqual(['alice@example.com']);
  });

  test('falls back to row scanning when headers do not match', () => {
    const values = [
      ['1001', 'alice@example.com', 'Football Language System', 'Pagado'],
      ['1002', 'bob@example.com', 'Football Language System', 'Pendiente'],
    ];

    expect(extractEligibleIdentifiersFromSheet(values)).toEqual(['alice@example.com']);
  });
});