import { useEffect, useRef, type RefObject } from 'react'

export interface InputState {
  move: { x: number; z: number }
  jumping: boolean
  shooting: boolean
}

/**
 * Tracks WASD + Space + left-click via keydown/keyup/mousedown listeners.
 * Returns a ref containing the current input state (updated imperatively for
 * zero re-render overhead in the game loop).
 */
export function useInput(): RefObject<InputState> {
  const inputRef = useRef<InputState>({
    move: { x: 0, z: 0 },
    jumping: false,
    shooting: false,
  })

  useEffect(() => {
    const keys = new Set<string>()

    function updateMove(): void {
      const x =
        (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) -
        (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0)
      const z =
        (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0) -
        (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0)
      inputRef.current.move = { x, z }
    }

    function onKeyDown(e: KeyboardEvent): void {
      if (e.repeat) return
      keys.add(e.code)
      if (e.code === 'Space') {
        inputRef.current.jumping = true
      }
      updateMove()
    }

    function onKeyUp(e: KeyboardEvent): void {
      keys.delete(e.code)
      if (e.code === 'Space') {
        inputRef.current.jumping = false
      }
      updateMove()
    }

    function onMouseDown(e: MouseEvent): void {
      if (e.button === 0) {
        inputRef.current.shooting = true
      }
    }

    function onMouseUp(e: MouseEvent): void {
      if (e.button === 0) {
        inputRef.current.shooting = false
      }
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUp)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  return inputRef
}
