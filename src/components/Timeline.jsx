import React from 'react'

export function Timeline({ choreography = [], onUpdateBlock = () => {}, onDeleteBlock = () => {} }) {
  const handleDurationChange = (idx, val) => {
    const updated = choreography.map((b, i) => i === idx ? { ...b, duration: parseFloat(val) || 0 } : b)
    onUpdateBlock(updated)
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'row', 
      gap: 8, 
      overflowX: 'auto',
      padding: '8px 0',
      alignItems: 'center'
    }}>
      {choreography.length === 0 && (
        <div className="small-muted" style={{ padding: '20px', textAlign: 'center' }}>
          No timeline blocks - add dance steps or moves above
        </div>
      )}
      {choreography.map((block, i) => (
        <div 
          key={i} 
          style={{ 
            minWidth: '120px',
            height: '60px',
            background: block.type === 'danceStep' ? '#4aa3ff' : '#ff7a7a',
            borderRadius: '8px',
            padding: '8px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            flexShrink: 0
          }}
        >
          {/* Delete button */}
          <button
            onClick={() => onDeleteBlock(i)}
            style={{
              position: 'absolute',
              top: '-6px',
              right: '-6px',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: '#ff4444',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
          
          {/* Block info */}
          <div>
            <div style={{ fontSize: '12px', color: '#fff', fontWeight: 'bold' }}>
              {block.type === 'danceStep' ? (block.step || 'dance') : 'moveTo'}
            </div>
            {block.type === 'moveTo' && (
              <div style={{ fontSize: '10px', color: '#fff', opacity: 0.8 }}>
                [{block.position ? block.position.map(n => n.toFixed(1)).join(', ') : '—'}]
              </div>
            )}
          </div>

          {/* Duration input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <input 
              type="number" 
              step="0.1" 
              min="0.1" 
              value={block.duration || 0} 
              onChange={(e) => handleDurationChange(i, e.target.value)}
              style={{
                width: '50px',
                height: '20px',
                background: 'rgba(255,255,255,0.2)',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '4px',
                fontSize: '11px',
                textAlign: 'center'
              }}
            />
            <span style={{ fontSize: '10px', color: '#fff', opacity: 0.8 }}>s</span>
          </div>
        </div>
      ))}
    </div>
  )
}
