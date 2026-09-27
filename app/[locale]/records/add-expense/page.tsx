import { redirect } from 'next/navigation'

export default function AddExpenseRedirect() {
  redirect('/records/transaction?direction=OUT')
}
