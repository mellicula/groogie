import React from 'react'

export function Stage({ onStageClick }) {
  // plane that reports pointer clicks (world coords)
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      receiveShadow
      onPointerDown={(e) => {
        e.stopPropagation()
        // e.point is a Vector3 in world coords
        if (onStageClick) onStageClick(e.point)
      }}
    >
      <planeGeometry args={[800, 306]} />
      <meshStandardMaterial color="#7c8bd6" />
    </mesh>
  )
}
