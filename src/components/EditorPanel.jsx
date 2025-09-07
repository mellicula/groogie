import React, { useState, useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

// Small preview component for dance steps
function DancePreview({ stepName }) {
  const { scene } = useGLTF('/models/combined.glb')
  const { animations } = useGLTF('/models/dances.glb')
  const mixerRef = useRef()
  const actionRef = useRef()
  const clockRef = useRef(new THREE.Clock())

  useEffect(() => {
    if (!scene || !animations || !stepName) return

    // Create mixer
    if (!mixerRef.current) {
      mixerRef.current = new THREE.AnimationMixer(scene)
    }

    // Find and play animation
    const clip = animations.find(c => c.name === stepName)
    if (clip) {
      if (actionRef.current) actionRef.current.stop()
      actionRef.current = mixerRef.current.clipAction(clip)
      actionRef.current.reset()
      actionRef.current.setLoop(THREE.LoopRepeat, Infinity)
      actionRef.current.play()
    }

    return () => {
      if (actionRef.current) actionRef.current.stop()
    }
  }, [scene, animations, stepName])

  // Animation loop
  useEffect(() => {
    if (!mixerRef.current) return

    const clock = clockRef.current
    const animate = () => {
      mixerRef.current.update(clock.getDelta())
      requestAnimationFrame(animate)
    }
    animate()
  }, [])

  if (!scene) return null

  return (
    <primitive 
      object={scene} 
      scale={0.01} 
      position={[0, 0, 1.5]}
    />
  )
}

export function EditorPanel({
  selectedDancer,
  onDancerSelect,
  choreography,
  onUpdateChoreography,
  onAddDanceStep,
  onAddMoveTo,
  onSave,
  onPlay,
  onStop,
  isPlaying,
  awaitingStageClick,
  cancelAwaiting,
  dancerModel,
  onModelChange
}) {
  const danceStepsCatalog = [
    'salsa1', 'salsa2', 'salsa3', 'salsa4', 'hiphop1', 'hiphop2', 'hiphop3', 'hiphop4', 'breakdance1', 'breakdance2', 'breakdance3', 'mystery'
  ]

  const [selectedStep, setSelectedStep] = useState(danceStepsCatalog[0])
  const [moveDuration, setMoveDuration] = useState(2)

  const handleAddStepClick = () => {
    onAddDanceStep(selectedStep)
  }

  const handleAddMoveClick = () => {
    onAddMoveTo(moveDuration)
  }

  return (
    <div className="editor-panel">
      <h2>groogie</h2>

      <div className="section">
        <label className="small-muted">Selected Dancer</label>
        <select
          value={selectedDancer}
          onChange={(e) => onDancerSelect(e.target.value)}
          style={{ width: '100%', padding: 8, marginTop: 8, background: '#0b0f18', color: '#fff', borderRadius: 6, border: '1px solid #222' }}
        >
          <option value="dancer1">Dancer 1 (Back Left)</option>
          <option value="dancer2">Dancer 2 (Back Center)</option>
          <option value="dancer3">Dancer 3 (Back Right)</option>
          <option value="dancer4">Dancer 4 (Front Left)</option>
          <option value="dancer5">Dancer 5 (Front Right)</option>
        </select>
      </div>

      <div className="section">
        <label className="small-muted">Model</label>
        <select
          value={dancerModel || 'combined.glb'}
          onChange={(e) => onModelChange(e.target.value)}
          style={{ width: '100%', padding: 8, marginTop: 8, background: '#0b0f18', color: '#fff', borderRadius: 6, border: '1px solid #222' }}
        >
          <option value="combined.glb">Combined Model</option>
          <option value="char3.glb">Character 3</option>
          <option value="boss.glb">Boss Model</option>
        </select>
        <div className="small-muted" style={{ marginTop: 6 }}>
          Choose the 3D model for this dancer
        </div>
      </div>

      <div className="section">
        <label className="small-muted">Add Dance Step</label>
        
        {/* Dance Preview */}
        <div style={{ 
          height: '260px', 
          background: '#b8b7c4', 
          borderRadius: '8px', 
          marginTop: '8px',
          border: '1px solid #333',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <Canvas camera={{ position: [0, 2, 4], fov: 50 }}>
            <ambientLight intensity={0.6} />
            <directionalLight position={[0, 2, 1]} intensity={0.8} />
            <DancePreview stepName={selectedStep} />
          </Canvas>
          <div style={{
            position: 'absolute',
            bottom: '8px',
            left: '8px',
            background: 'rgba(0,0,0,0.7)',
            color: '#fff',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px'
          }}>
            Preview: {selectedStep}
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <select value={selectedStep} onChange={(e) => setSelectedStep(e.target.value)} style={{ flex: 1, padding: 8, background: '#0b0f18', color: '#fff', borderRadius: 6, border: '1px solid #222' }}>
            {danceStepsCatalog.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button className="btn" onClick={handleAddStepClick}>Add</button>
        </div>
        <div className="small-muted" style={{ marginTop: 6 }}>Adds a dance step block to the end of the timeline.</div>
      </div>

        <div className="section">
          <label className="small-muted">Add Move To</label>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
            <input
              type="number"
              value={moveDuration}
              onChange={(e) => setMoveDuration(parseFloat(e.target.value) || 1)}
              min="0.1"
              step="0.1"
              style={{
                width: '60px',
                padding: '8px',
                background: '#0b0f18',
                color: '#fff',
                borderRadius: '6px',
                border: '1px solid #222',
                textAlign: 'center'
              }}
              placeholder="2.0"
            />
            <span className="small-muted" style={{ fontSize: '12px' }}>sec</span>
            <button className="btn" onClick={handleAddMoveClick} disabled={awaitingStageClick}>
              {awaitingStageClick ? 'Click stage...' : 'Start Move' }
            </button>
            {awaitingStageClick && <button className="btn btn-danger" onClick={cancelAwaiting}>Cancel</button>}
          </div>
          <div className="small-muted" style={{ marginTop: 6 }}>Click the stage to pick a location for the dancer.</div>
        </div>

      <div className="section">
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn btn-success" onClick={onPlay} disabled={isPlaying}>▶ Play</button>
          <button className="btn" onClick={onStop} disabled={!isPlaying}>⏹ Stop</button>
          <button className="btn" onClick={onSave}>💾 Save</button>
        </div>
      </div>

      {/* Choreography List */}
      <div className="section">
        <h3 style={{ marginTop: 0, marginBottom: '12px' }}>Choreography</h3>
        <div style={{ 
          maxHeight: '200px', 
          overflowY: 'auto', 
          background: '#1a1a1a', 
          borderRadius: '8px', 
          padding: '8px',
          border: '1px solid #333'
        }}>
          {choreography.length === 0 ? (
            <div className="small-muted" style={{ textAlign: 'center', padding: '20px' }}>
              No choreography blocks yet
            </div>
          ) : (
            choreography.map((block, i) => (
              <div 
                key={i} 
                style={{ 
                  background: block.type === 'danceStep' ? '#5974e3' : '#d072d4',
                  borderRadius: '6px',
                  padding: '10px',
                  marginBottom: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  position: 'relative'
                }}
              >
                {/* Block info */}
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontSize: '15px', 
                    fontWeight: 'bold', 
                    color: '#fff',
                    marginBottom: '4px'
                  }}>
                    {block.type === 'danceStep' ? 'Dance Step' : 'Move To'}
                  </div>
                  <div style={{ fontSize: '15px', color: '#ccc' }}>
                    {block.type === 'danceStep' ? (block.step || '—') : `Position: [${block.position ? block.position.map(n => n.toFixed(1)).join(', ') : '—'}]`}
                  </div>
                </div>

                {/* Duration and controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="number"
                      value={block.duration || 0}
                      onChange={(e) => {
                        const updated = choreography.map((b, idx) => 
                          idx === i ? { ...b, duration: parseFloat(e.target.value) || 0 } : b
                        )
                        onUpdateChoreography(updated)
                      }}
                      min="0.1"
                      step="0.1"
                      style={{
                        width: '50px',
                        height: '24px',
                        background: 'rgba(255,255,255,0.1)',
                        color: '#fff',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '4px',
                        fontSize: '15px',
                        textAlign: 'center'
                      }}
                    />
                    <span style={{ fontSize: '15px', color: '#ccc' }}>secs</span>
                  </div>
                  
                  <button
                    onClick={() => {
                      const updated = choreography.filter((_, idx) => idx !== i)
                      onUpdateChoreography(updated)
                    }}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: '#a81808',
                      color: 'white',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '15px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  )
}
