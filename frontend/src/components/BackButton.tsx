import { useNavigate } from 'react-router-dom'

export default function BackButton({ fallback = '/dashboard' }: { fallback?: string }) {
  const navigate = useNavigate()

  function handleBack() {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }

    navigate(fallback)
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      className="mb-4 text-sm text-[#586760] hover:text-[#143a34] font-medium transition-colors"
    >
      &larr; Back
    </button>
  )
}
