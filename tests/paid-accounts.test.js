const { extractPaidRegistrationAccountsFromSheet } = require('../server/utils/registration-eligibility');

describe('paid accounts parser', () => {
  test('returns unique paid Football Language System accounts with order details', () => {
    const values = [
      ['Order Number', 'Email', 'Financial Status', 'Paid at', 'Line Item Name', 'Billing Name', 'Total', 'Currency'],
      ['2603', 'ruizfootballacademy@gmail.com', 'Paid', '2026-04-07 02:55', 'Football Language System', 'Luis Ruiz', '50.00', 'USD'],
      ['2602', 'ruizfootballacademy@gmail.com', 'Paid', '2026-04-07 02:53', 'Coaches Course', 'Luis Ruiz', '99.00', 'USD'],
      ['2601', 'other@example.com', 'Paid', '2026-04-07 02:50', 'Football Language System', 'Other Person', '50.00', 'USD'],
    ];

    expect(extractPaidRegistrationAccountsFromSheet(values)).toEqual([
      {
        orderNumber: '2603',
        email: 'ruizfootballacademy@gmail.com',
        customerName: 'Luis Ruiz',
        product: 'Football Language System',
        financialStatus: 'Paid',
        paidAt: '2026-04-07 02:55',
        createdAt: '',
        currency: 'USD',
        total: 50,
        fulfillmentStatus: '',
      },
      {
        orderNumber: '2601',
        email: 'other@example.com',
        customerName: 'Other Person',
        product: 'Football Language System',
        financialStatus: 'Paid',
        paidAt: '2026-04-07 02:50',
        createdAt: '',
        currency: 'USD',
        total: 50,
        fulfillmentStatus: '',
      },
    ]);
  });
});