const { extractPaidRegistrationAccountsFromSheet } = require('../server/utils/registration-eligibility');

describe('paid accounts parser', () => {
  test('returns unique paid Football Language System accounts with order details', () => {
    const values = [
      ['Order Number', 'Email', 'Financial Status', 'Paid at', 'Fulfillment Status', 'Fulfilled at', 'Currency', 'Subtotal', 'Shipping', 'Taxes', 'Amount Refunded', 'Total', 'Discount Code', 'Discount Amount', 'Shipping Method', 'Created at', 'Line Item Quantity', 'Line Item Name', 'Line Item Price', 'Line Item SKU', 'Line Item Variant', 'Line Item Requires Shipping', 'Line Item Taxable', 'Line Item Fulfillment Status', 'Billing Name', 'Billing Address 1'],
      ['2603', 'ruizfootballacademy@gmail.com', 'Paid', '2026-04-07 02:55', 'Pending', '', 'USD', '50.00', '0.00', '0.00', '0.00', '0.00', 'FLSLUIS100', '50.00', '', '2026-04-07 02:55', '1', 'Football Language System', '50.00', 'SQ2685777', '', 'FALSE', 'TRUE', 'Pending', 'Luis Ruiz', '6 orchard st'],
      ['2602', 'ruizfootballacademy@gmail.com', 'Paid', '2026-04-07 02:53', 'Pending', '', 'USD', '99.00', '0.00', '0.00', '0.00', '0.00', 'COACHLUIS100', '99.00', '', '2026-04-07 02:53', '1', 'Coaches Course', '99.00', 'SQ5770505', '', 'FALSE', 'TRUE', 'Pending', 'Luis Ruiz', '6 orchard st coconut grove'],
      ['2601', 'other@example.com', 'Paid', '2026-04-07 02:50', 'Pending', '', 'USD', '50.00', '0.00', '0.00', '0.00', '0.00', 'FLSOTHER100', '50.00', '', '2026-04-07 02:50', '1', 'Football Language System', '50.00', 'SQ2685777', '', 'FALSE', 'TRUE', 'Pending', 'Other Person', 'Other Address'],
    ];

    expect(extractPaidRegistrationAccountsFromSheet(values)).toEqual([
      {
        orderNumber: '2603',
        email: 'ruizfootballacademy@gmail.com',
        customerName: 'Luis Ruiz',
        product: 'Football Language System',
        financialStatus: 'Paid',
        paidAt: '2026-04-07 02:55',
        createdAt: '2026-04-07 02:55',
        currency: 'USD',
        total: 50,
        fulfillmentStatus: 'Pending',
      },
      {
        orderNumber: '2601',
        email: 'other@example.com',
        customerName: 'Other Person',
        product: 'Football Language System',
        financialStatus: 'Paid',
        paidAt: '2026-04-07 02:50',
        createdAt: '2026-04-07 02:50',
        currency: 'USD',
        total: 50,
        fulfillmentStatus: 'Pending',
      },
    ]);
  });
});