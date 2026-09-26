import { getCrops } from '@/app/actions/records'
import TransactionForm from '@/components/records/TransactionForm'

interface PageProps {
  searchParams: Promise<{ mode?: string; direction?: string }>
}

export default async function RecordTransactionPage({ searchParams }: PageProps) {
  const [crops, resolvedParams] = await Promise.all([
    getCrops(),
    searchParams
  ])

  const defaultMode = resolvedParams.mode === 'scan' ? 'scan' : 'manual'
  const defaultDirection = resolvedParams.direction === 'IN' ? 'IN' : 'OUT'

  return (
    <TransactionForm
      crops={crops}
      defaultMode={defaultMode}
      defaultDirection={defaultDirection}
    />
  )
}
