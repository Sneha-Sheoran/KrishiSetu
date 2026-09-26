import { redirect } from 'next/navigation'

export default function ReceiptUploadRedirect() {
  redirect('/records/transaction?mode=scan')
}
