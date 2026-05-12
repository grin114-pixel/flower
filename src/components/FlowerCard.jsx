import { Pencil, Trash2, Images } from 'lucide-react'

export default function FlowerCard({ flower, onEdit, onRequestDelete, onViewImages, readOnly = false }) {
  const urls = Array.isArray(flower.image_urls) ? flower.image_urls : []
  const cover = urls[0] || ''

  return (
    <div className="food-card" role="group" aria-label={flower.name}>
      <div className="card-image-wrap">
        {cover ? (
          <button
            type="button"
            className="card-image-btn"
            onClick={() => onViewImages(urls, 0)}
            title="사진 보기"
            aria-label="사진 보기"
          >
            <img src={cover} alt={flower.name} className="card-image" />
          </button>
        ) : (
          <div className="card-image-empty">
            <span>🌸</span>
          </div>
        )}

        {!readOnly && (
          <div className="card-top-actions">
            <button
              type="button"
              className="icon-btn edit card-top-btn"
              onClick={() => onEdit(flower)}
              title="수정"
              aria-label="수정"
            >
              <Pencil size={14} />
            </button>
            <button
              type="button"
              className="icon-btn delete card-top-btn"
              onClick={() => onRequestDelete(flower)}
              title="삭제"
              aria-label="삭제"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}

        {urls.length > 1 ? (
          <div className="card-multi-badge" title="사진 여러 장" aria-label="사진 여러 장">
            <Images size={14} aria-hidden />
            <span>{urls.length}</span>
          </div>
        ) : null}
      </div>

      <div className="card-body">
        <div className="card-title-row">
          <h3 className="card-title" title={flower.name}>
            {flower.name}
          </h3>
        </div>
      </div>
    </div>
  )
}

