export interface ReceiptData {
  receiptId: string
  transactionSignature: string
  payerWallet: string
  merchantWallet: string
  planName: string
  billingPeriod: "monthly" | "yearly"
  amountEur: number
  amountSol: number
  date: string
  status: string
  dailyRequests: number
}

export function generateReceiptPdfOrHtml(data: ReceiptData) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Receipt - findxo Intelligence (${data.receiptId})</title>
  <style>
    @page { size: A4; margin: 20mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "JetBrains Mono", monospace;
      background: #ffffff;
      color: #0f172a;
      padding: 30px;
      margin: 0;
      line-height: 1.5;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 20px;
      margin-bottom: 25px;
    }
    .logo {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #0f172a;
    }
    .badge {
      display: inline-block;
      padding: 3px 8px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      background: #ecfdf5;
      color: #059669;
      border: 1px solid #10b981;
      border-radius: 4px;
      margin-top: 5px;
    }
    .meta-block {
      text-align: right;
      font-size: 12px;
      color: #64748b;
    }
    .meta-block strong {
      color: #0f172a;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 25px;
      font-size: 13px;
    }
    .card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 14px;
    }
    .card h4 {
      margin: 0 0 8px 0;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
    }
    .hash {
      font-family: monospace;
      font-size: 11px;
      word-break: break-all;
      color: #334155;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 25px 0;
      font-size: 13px;
    }
    th {
      text-align: left;
      padding: 10px;
      background: #0f172a;
      color: #ffffff;
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
    }
    td {
      padding: 12px 10px;
      border-bottom: 1px solid #e2e8f0;
    }
    .total-row {
      font-weight: 700;
      font-size: 15px;
      border-top: 2px solid #0f172a;
    }
    .footer {
      margin-top: 40px;
      padding-top: 15px;
      border-top: 1px solid #e2e8f0;
      font-size: 11px;
      color: #94a3b8;
      text-align: center;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">findxo INTEL</div>
      <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Decentralized Threat Intelligence & OSINT Recon</div>
      <span class="badge">Settlement Confirmed</span>
    </div>
    <div class="meta-block">
      <div>RECEIPT ID: <strong>${data.receiptId}</strong></div>
      <div>DATE (UTC): <strong>${data.date}</strong></div>
      <div>STATUS: <strong style="color: #059669;">${data.status.toUpperCase()}</strong></div>
    </div>
  </div>

  <div class="grid">
    <div class="card">
      <h4>Payer Information</h4>
      <div style="font-weight: 600; margin-bottom: 4px;">Solana Wallet Address:</div>
      <div class="hash">${data.payerWallet}</div>
    </div>
    <div class="card">
      <h4>Settlement Enclave</h4>
      <div style="font-weight: 600; margin-bottom: 4px;">Merchant Protocol Wallet:</div>
      <div class="hash">${data.merchantWallet}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Clearance Level</th>
        <th>Cycle</th>
        <th>Daily Quota</th>
        <th>Amount (EUR)</th>
        <th style="text-align: right;">Amount (SOL)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>${data.planName.toUpperCase()} CLEARANCE</strong></td>
        <td>${data.billingPeriod.toUpperCase()}</td>
        <td>${data.dailyRequests.toLocaleString()} reqs / 24h</td>
        <td>€${data.amountEur.toFixed(2)}</td>
        <td style="text-align: right; font-family: monospace; font-weight: 600;">${data.amountSol.toFixed(4)} SOL</td>
      </tr>
      <tr class="total-row">
        <td colspan="3" style="text-align: right;">TOTAL SETTLED:</td>
        <td>€${data.amountEur.toFixed(2)}</td>
        <td style="text-align: right; font-family: monospace; color: #059669;">${data.amountSol.toFixed(4)} SOL</td>
      </tr>
    </tbody>
  </table>

  <div class="card" style="margin-top: 20px;">
    <h4>Cryptographic Proof of Payment</h4>
    <div style="font-size: 11px; margin-bottom: 4px; color: #475569;">Solana On-Chain Signature:</div>
    <div class="hash" style="color: #0f172a; font-weight: 600;">${data.transactionSignature}</div>
    <div style="font-size: 11px; color: #64748b; margin-top: 6px;">
      Verifiable on Solana Explorer: https://explorer.solana.com/tx/${data.transactionSignature}
    </div>
  </div>

  <div class="footer">
    findxo Autonomous Threat Intelligence • Ed25519 Cryptographic Billing Verification • This document serves as an immutable tax invoice & proof of settlement.
  </div>
</body>
</html>`

  return html
}

export function downloadReceipt(data: ReceiptData) {
  const html = generateReceiptPdfOrHtml(data)
  const blob = new Blob([html], { type: "text/html" })
  const url = URL.createObjectURL(blob)

  // Open print dialogue or download file
  const win = window.open(url, "_blank")
  if (win) {
    win.onload = () => {
      win.focus()
      win.print()
    }
  } else {
    // Fallback direct download link
    const a = document.createElement("a")
    a.href = url
    a.download = `findxo_receipt_${data.receiptId}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }
}
