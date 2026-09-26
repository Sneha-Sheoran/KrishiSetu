import { getTransactions } from '@/app/actions/records'
import TransactionsList from '@/components/records/TransactionsList'

export const dynamic = 'force-dynamic'

export default async function TransactionsPage() {
  const transactions = await getTransactions()

  return <TransactionsList transactions={transactions} />
}
