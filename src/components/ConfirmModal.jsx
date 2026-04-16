export default function ConfirmModal({
  title,
  message = '진행할까요?',
  confirmText = '확인',
  cancelText = '취소',
  danger = false,
  confirmVariant = 'auto', // 'auto' | 'pink' | 'danger'
  onConfirm,
  onClose,
}) {
  const confirmClass =
    confirmVariant === 'pink'
      ? 'btn-primary confirm-pink'
      : confirmVariant === 'danger'
        ? 'btn-primary danger'
        : `btn-primary ${danger ? 'danger' : ''}`

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box confirm-modal-box">
        {title ? (
          <div className="confirm-modal-header">
            <h2 className="confirm-modal-title">{title}</h2>
          </div>
        ) : null}

        <p className="confirm-modal-message">{message}</p>

        <div className="confirm-modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            {cancelText}
          </button>
          <button
            type="button"
            className={confirmClass}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

