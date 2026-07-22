import { useEffect, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { useAcceptInvitation } from '../hooks/useProjectMutations'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import { toast } from '@/components/ui/toast/toastStore'
import { getApiErrorMessage } from '@/lib/http'

const InvitationPage = () => {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const acceptMutation = useAcceptInvitation()
  const hasTriggered = useRef(false)

  useEffect(() => {
    if (!token || !projectId) {
      toast.error('Đường dẫn lời mời không hợp lệ hoặc thiếu mã xác thực.')
      navigate('/projects')
      return
    }

    if (hasTriggered.current) return
    hasTriggered.current = true

    acceptMutation.mutate(
      { projectId, token },
      {
        onSuccess: () => {
          toast.success('Chấp nhận lời mời tham gia dự án thành công!')
          navigate(`/projects/${projectId}`, { replace: true })
        },
      }
    )
  }, [token, projectId, navigate])

  if (!projectId || !token) {
    return null
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-line/15 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-20 bg-brand/10 rounded-full blur-3xl pointer-events-none" />

        {acceptMutation.isPending || acceptMutation.isIdle ? (
          <div className="py-12 flex flex-col items-center justify-center gap-4 text-center">
            <Spinner />
            <div className="space-y-1">
              <p className="text-sm font-bold text-ink">Đang tải và chấp nhận lời mời...</p>
              <p className="text-xs text-muted">Vui lòng chờ trong giây lát để hệ thống tự động xác nhận.</p>
            </div>
          </div>
        ) : acceptMutation.isError ? (
          <div className="py-6 flex flex-col items-center justify-center gap-4 text-center relative z-10">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-500">
              <ShieldAlert size={24} />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-ink">Không thể chấp nhận lời mời</p>
              <p className="text-xs text-red-500 max-w-xs mx-auto">
                {getApiErrorMessage(acceptMutation.error, 'Lời mời đã hết hạn hoặc không hợp lệ.')}
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => navigate('/projects')}
              className="mt-2"
            >
              Quay lại danh sách dự án
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default InvitationPage
