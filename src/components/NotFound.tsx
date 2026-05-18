import { useNavigate } from 'react-router-dom'
import Button from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <Card className="py-12 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">?</div>
      <h1 className="mt-4 text-lg font-bold text-slate-900">Page not found</h1>
      <p className="mt-2 text-sm text-slate-600">The page you requested does not exist or was moved.</p>
      <div className="mt-6 flex justify-center gap-2">
        <Button variant="primary" onClick={() => navigate('/')}>
          Go home
        </Button>
        <Button variant="secondary" onClick={() => navigate(-1)}>
          Go back
        </Button>
      </div>
    </Card>
  )
}
