import { redirect } from 'next/navigation'

const InvoiceApp = () => {
  redirect('/apps/payment/list?tab=receipts')
}

export default InvoiceApp
