import React, { useRef, useEffect, useState } from 'react'
import { useGLTF, useAnimations } from '@react-three/drei'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js'

/*
 Dancer props:
 - id
 - position: [x,y,z]
 - choreography: array of blocks
 - isSelected: bool
 - onSelect: function
 - isPlaying: bool (this dancer should play)
*/
export function Dancer({
  id,
  position = [0, 0, 0],
  choreography = [],
  isSelected = false,
  onSelect = () => {},
  isPlaying = false
}) {
  // load a shared skeleton model and separate animation file
  const modelGltf = useGLTF('/models/combined.glb')
  const animGltf = useGLTF('/models/dances.glb')
  const localRef = useRef()
  const mixerRef = useRef(null)
  const actionRef = useRef(null)
  const clockRef = useRef(new THREE.Clock())
  const [root, setRoot] = useState(null)

  // playback state
  const [blockIndex, setBlockIndex] = useState(0)
  const timeoutRef = useRef(null)
  const [targetPos, setTargetPos] = useState(new THREE.Vector3(...position))
  const [startPos, setStartPos] = useState(new THREE.Vector3(...position))
  const [moveStartTime, setMoveStartTime] = useState(0)
  const [moveDuration, setMoveDuration] = useState(0)

  // clone model on mount to ensure independent instances
  useEffect(() => {
    if (modelGltf?.scene) {
      const scene = modelGltf.scene
      const cloned = SkeletonUtils.clone(scene)

      cloned.traverse((c) => {
        if (c.isMesh) {
          c.castShadow = true
          c.receiveShadow = true
        }
      })
      cloned.position.set(...position)
      cloned.scale.setScalar(0.05)
      setRoot(cloned)
    }
  }, [modelGltf, position])

  // attach mixer when root + animations exist
  useEffect(() => {
    if (!root || !animGltf?.animations) return
    mixerRef.current = new THREE.AnimationMixer(root)
    return () => {
      mixerRef.current?.stopAllAction()
      mixerRef.current = null
    }
  }, [root, animGltf])

  // react to isPlaying changes - start playing choreography
  useEffect(() => {
    // Clear any existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    
    // Reset state
    setBlockIndex(0)
    
    // Reset position
    if (root) {
      root.position.set(...position)
      setStartPos(new THREE.Vector3(...position))
      setTargetPos(new THREE.Vector3(...position))
    }
    
    if (!isPlaying) {
      // stop any running action
      if (actionRef.current) {
        actionRef.current.stop()
        actionRef.current = null
      }
      return
    }
    
    // if isPlaying true, start executing blocks
    if (choreography.length > 0) {
      // small delay to allow frame setup
      timeoutRef.current = setTimeout(() => {
        setBlockIndex(0)
      }, 100)
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [isPlaying, choreography, root, position])

  // effect for when the current block changes (execute it)
  useEffect(() => {
    if (!isPlaying) return
    if (!choreography || choreography.length === 0) return

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }

    if (blockIndex >= choreography.length) {
      // end playback
      if (actionRef.current) {
        actionRef.current.stop()
        actionRef.current = null
      }
      return
    }

    const block = choreography[blockIndex]
    if (!block) return

    if (block.type === 'danceStep') {
      // stop previous action
      if (actionRef.current) {
        actionRef.current.stop()
        actionRef.current = null
      }
      
      // find clip by name in animGltf
      const clip = animGltf?.animations?.find(c => c.name === block.step)
      if (clip && mixerRef.current) {
        try {
          const action = mixerRef.current.clipAction(clip)
          action.reset()
          action.setLoop(THREE.LoopRepeat, Infinity) // Changed from LoopOnce to LoopRepeat
          action.clampWhenFinished = false
          action.play()
          actionRef.current = action
        } catch (error) {
          console.warn('Animation error:', error)
        }
      }
      
      // schedule next block
      timeoutRef.current = setTimeout(() => {
        setBlockIndex(prev => prev + 1)
      }, (block.duration || 1) * 1000)
      
    } else if (block.type === 'moveTo') {
      // smoothly interpolate root.position from current to target
      if (root) {
        const from = new THREE.Vector3().copy(root.position)
        const to = new THREE.Vector3(...(block.position || position))
        setStartPos(from)
        setTargetPos(to)
        setMoveStartTime(performance.now() / 1000)
        setMoveDuration(block.duration || 1)
      }
      
      // schedule next block
      timeoutRef.current = setTimeout(() => {
        setBlockIndex(prev => prev + 1)
      }, (block.duration || 1) * 1000)
      
    } else {
      // unsupported block - skip
      timeoutRef.current = setTimeout(() => {
        setBlockIndex(prev => prev + 1)
      }, 300)
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [blockIndex, isPlaying, choreography, animGltf, root, position])

  // frame loop: update mixer + handle move interpolation
  useFrame(() => {
    // Only update mixer when playing
    if (mixerRef.current && isPlaying) {
      try {
        const dt = clockRef.current.getDelta()
        mixerRef.current.update(dt)
      } catch (error) {
        console.warn('Mixer update error:', error)
      }
    }
    
    // Handle movement interpolation
    if (root && isPlaying) {
      const tNow = performance.now() / 1000
      if (moveDuration > 0) {
        const elapsed = tNow - moveStartTime
        const t = Math.min(1, Math.max(0, moveDuration === 0 ? 1 : (elapsed / moveDuration)))
        // ease in-out simple
        const e = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
        root.position.lerpVectors(startPos, targetPos, e)
      }
    }
  })

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      if (actionRef.current) {
        actionRef.current.stop()
        actionRef.current = null
      }
      if (mixerRef.current) {
        mixerRef.current.stopAllAction()
        mixerRef.current = null
      }
    }
  }, [])

  // render primitive when root exists
  return root ? (
    <primitive
      object={root}
      ref={localRef}
      onPointerDown={(e) => {
        e.stopPropagation()
        onSelect?.()
      }}
      // highlight a bit if selected
      material={undefined}
    />
  ) : null
}
