import jsPDF from 'jspdf'
import { Payment, RentInvoice } from '../types'
import { formatCurrency, formatDate } from '../components/ui'

export function generateRentReceiptPDF(payment: {
  receipt_number: string
  tenant_name?: string
  property_name?: string
  unit_number?: string
  billing_month: string
  amount: number
  payment_method: string
  transaction_reference?: string
  payment_date: string
  notes?: string
}) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5', // A5 is standard for receipts
  })

  // Colors
  const primaryColor = [37, 99, 235] // #2563eb
  const darkColor = [15, 23, 42] // #0f172a
  const grayColor = [100, 116, 139] // #64748b

  // Header banner
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.rect(0, 0, 148, 26, 'F')

  // Header Title
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('RENT PAYMENT RECEIPT', 74, 13, { align: 'center' })

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('PROPERTYHUB RENTAL MANAGEMENT', 74, 19, { align: 'center' })

  // Receipt meta
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2])
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text(`Receipt #: ${payment.receipt_number}`, 14, 36)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])
  doc.text(`Date: ${formatDate(payment.payment_date)}`, 134, 36, { align: 'right' })

  // Divider
  doc.setDrawColor(226, 232, 240)
  doc.line(14, 40, 134, 40)

  // Details box
  doc.setFillColor(248, 250, 252)
  doc.roundedRect(14, 44, 120, 48, 3, 3, 'F')

  let y = 52
  const addRow = (label: string, value: string) => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])
    doc.text(label, 20, y)

    doc.setFont('helvetica', 'bold')
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2])
    doc.text(value, 128, y, { align: 'right' })
    y += 8
  }

  addRow('Received From:', payment.tenant_name || 'Tenant')
  addRow('Property / Building:', payment.property_name || 'Property')
  addRow('Unit / Flat:', `Flat ${payment.unit_number || 'N/A'}`)
  addRow('Rent Month:', payment.billing_month)
  addRow('Payment Mode:', payment.payment_method.toUpperCase())
  if (payment.transaction_reference) {
    addRow('Txn Ref:', payment.transaction_reference)
  }

  // Amount Highlight Box
  doc.setFillColor(220, 252, 231) // success light
  doc.roundedRect(14, 100, 120, 22, 3, 3, 'F')
  doc.setDrawColor(34, 197, 94)
  doc.roundedRect(14, 100, 120, 22, 3, 3, 'D')

  doc.setTextColor(21, 128, 61)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text('TOTAL AMOUNT PAID', 74, 107, { align: 'center' })

  doc.setFontSize(14)
  doc.text(formatCurrency(payment.amount), 74, 116, { align: 'center' })

  // Footer / Verification note
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2])
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.text('This is a computer-generated receipt issued through PropertyHub.', 74, 134, { align: 'center' })
  doc.text('Thank you for your prompt payment!', 74, 138, { align: 'center' })

  // Save the PDF
  doc.save(`Receipt_${payment.receipt_number}.pdf`)
}
