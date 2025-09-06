import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useState, useRef } from 'react'
import * as THREE from 'three'
import './App.css'
import './index.css'
import logoImg from './assets/wave.png'
import { Dancer } from './components/Dancer'
import { Stage } from './components/Stage'
import { EditorPanel } from './components/EditorPanel'
import { useLoader } from '@react-three/fiber'

function FloatingLogos() {
  const texture = useLoader(THREE.TextureLoader, logoImg);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(180, 120); // adjust tiling

  return (
    <mesh scale={[2000, 2000, 1]} position={[0, 0, -100]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={texture} />
    </mesh>
  );

}


export default function App() {
  // dancer ids and initial spawn positions
  const dancerIds = ['dancer1', 'dancer2', 'dancer3', 'dancer4', 'dancer5']
  const spawnPositions = {
    dancer1: [-25, 0, -2],  // Back left
    dancer2: [-5, 0, -2],    // Back center
    dancer3: [15, 0, -2],    // Back right
    dancer4: [-15, 0, 5],    // Front left
    dancer5: [5, 0, 5]      // Front right
  }

  const [selectedDancer, setSelectedDancer] = useState('dancer1')
  const [dancerChoreographies, setDancerChoreographies] = useState({
    dancer1: [],
    dancer2: [],
    dancer3: [],
    dancer4: [],
    dancer5: []
  })
  const [isPlaying, setIsPlaying] = useState(false)
  const [globalPlaying, setGlobalPlaying] = useState(false)
  const [awaitingStageClick, setAwaitingStageClick] = useState(false)

  // Called by Stage when user clicks plane (for moveTo)
  const handleStageClick = (point) => {
    if (!awaitingStageClick) return
    // add a moveTo block for currently selected dancer
    const newBlock = {
      type: 'moveTo',
      position: [parseFloat(point.x.toFixed(2)), 0, parseFloat(point.z.toFixed(2))],
      duration: moveDuration
    }
    setDancerChoreographies(prev => ({
      ...prev,
      [selectedDancer]: [...(prev[selectedDancer] || []), newBlock]
    }))
    setAwaitingStageClick(false)
  }

  const handleAddDanceStep = (stepName) => {
    const newBlock = {
      type: 'danceStep',
      step: stepName,
      duration: 3
    }
    setDancerChoreographies(prev => ({
      ...prev,
      [selectedDancer]: [...(prev[selectedDancer] || []), newBlock]
    }))
  }

  const handleAddMoveTo = (duration = 2) => {
    // set flag - the next click on stage will add the move
    setAwaitingStageClick(true)
    setMoveDuration(duration)
  }

  const [moveDuration, setMoveDuration] = useState(2)

  const handleUpdateChoreography = (newChoreo) => {
    setDancerChoreographies(prev => ({
      ...prev,
      [selectedDancer]: newChoreo
    }))
  }

  const handleDeleteBlock = (index) => {
    const curr = dancerChoreographies[selectedDancer] || []
    const updated = curr.filter((_, i) => i !== index)
    handleUpdateChoreography(updated)
  }

  const handleSave = () => {
    // for MVP local save only
    localStorage.setItem('groogie_choreos', JSON.stringify(dancerChoreographies))
    alert('Choreography saved (localStorage)')
  }

  const handlePlay = () => {
    setIsPlaying(true)
    // we only want the selected dancer to play in this MVP
  }
  const handleStop = () => {
    setIsPlaying(false)
  }

  const handleGlobalPlay = () => {
    setGlobalPlaying(true)
  }

  const handleGlobalStop = () => {
    setGlobalPlaying(false)
    setIsPlaying(false) // Also stop individual dancer playback
  }

  return (
    <div className="app-shell">
      <div className="canvas-wrap">
        <Canvas camera={{ position: [0, 5, 10], fov: 50 }} shadows>
          {/* Lavender gradient background */}
          <color attach="background" args={['#c8bcff']} />
          
          {/* Gradient skybox for more depth */}
          <mesh position={[0, 0, -50]} scale={[100, 100, 1]}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial>
              <primitive 
                object={new THREE.ShaderMaterial({
                  uniforms: {
                    color1: { value: new THREE.Color('#c8bcff') },
                    color2: { value: new THREE.Color('#e8d5ff') },
                    color3: { value: new THREE.Color('#f0e6ff') }
                  },
                  vertexShader: `
                    varying vec2 vUv;
                    void main() {
                      vUv = uv;
                      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                    }
                  `,
                  fragmentShader: `
                    uniform vec3 color1;
                    uniform vec3 color2;
                    uniform vec3 color3;
                    varying vec2 vUv;
                    void main() {
                      vec2 center = vec2(0.5, 0.5);
                      float dist = distance(vUv, center);
                      vec3 color = mix(color1, color2, vUv.y);
                      color = mix(color, color3, dist * 0.5);
                      gl_FragColor = vec4(color, 1.0);
                    }
                  `
                })}
              />
            </meshBasicMaterial>
          </mesh>
          
          {/* Ambient light for general visibility */}
          <ambientLight intensity={0.6} />
          
          {/* Main directional light */}
          <directionalLight 
            position={[0, 10, 0]} 
            intensity={1.5}
            castShadow
            shadow-mapSize={1024}
            shadow-camera-far={50}
            shadow-camera-left={-15}
            shadow-camera-right={15}
            shadow-camera-top={10}
            shadow-camera-bottom={-10}
          />
          
          {/* Additional fill light */}
          <directionalLight 
            position={[3, 5, 3]} 
            intensity={0.8}
            color="#ffffff"
          />
          
          <Stage onStageClick={handleStageClick} />
          <FloatingLogos />

          {/* render multiple dancers from same model file */}
          {dancerIds.map((id) => (
            <Dancer
              key={id}
              id={id}
              position={spawnPositions[id]}
              choreography={dancerChoreographies[id] || []}
              isSelected={selectedDancer === id}
              onSelect={() => setSelectedDancer(id)}
              isPlaying={globalPlaying || (isPlaying && selectedDancer === id)}
            />
          ))}

          <OrbitControls makeDefault />
        </Canvas>

        {/* Global controls */}
        <div className="global-controls" style={{ 
          position: 'absolute', 
          top: '20px', 
          left: '20px', 
          zIndex: 100,
          display: 'flex',
          gap: '10px',
          alignItems: 'center'
        }}>
          <button 
            className="btn btn-success" 
            onClick={handleGlobalPlay} 
            disabled={globalPlaying}
            style={{
              padding: '12px 20px',
              fontSize: '16px',
              fontWeight: 'bold',
              background: globalPlaying ? '#666' : '#cf5cdb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: globalPlaying ? 'not-allowed' : 'pointer'
            }}
          >
            Run Choreography
          </button>
          <button 
            className="btn" 
            onClick={handleGlobalStop} 
            disabled={!globalPlaying}
            style={{
              padding: '12px 20px',
              fontSize: '16px',
              fontWeight: 'bold',
              background: !globalPlaying ? '#666' : '#847de8',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: !globalPlaying ? 'not-allowed' : 'pointer'
            }}
          >
            Stop All
          </button>
          <div style={{ 
            color: '#ffffff', 
            fontSize: '14px',
            marginLeft: '10px'
          }}>
            {globalPlaying ? 'All dancers playing' : 'Individual control mode'}
          </div>
        </div>

      </div>

      <EditorPanel
        selectedDancer={selectedDancer}
        onDancerSelect={(id) => setSelectedDancer(id)}
        choreography={dancerChoreographies[selectedDancer] || []}
        onUpdateChoreography={handleUpdateChoreography}
        onAddDanceStep={handleAddDanceStep}
        onAddMoveTo={handleAddMoveTo}
        onSave={handleSave}
        onPlay={handlePlay}
        onStop={handleStop}
        isPlaying={isPlaying && selectedDancer}
        awaitingStageClick={awaitingStageClick}
        cancelAwaiting={() => setAwaitingStageClick(false)}
      />
    </div>
  )
}
