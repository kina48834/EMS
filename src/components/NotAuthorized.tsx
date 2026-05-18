import { useNavigate } from 'react-router-dom'
import Button from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export default function NotAuthorized() {
  const navigate = useNavigate()
  return (
    <Card className="py-12 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-2xl text-rose-600">!</div>
      <h1 className="mt-4 text-lg font-bold text-slate-900">Not authorized</h1>
      <p className="mt-2 text-sm text-slate-600">Your account does not have permission to view this page.</p>
      <Button className="mt-6" variant="primary" onClick={() => navigate('/')}>
        Return home
      </Button>
    </Card>
  )
}
