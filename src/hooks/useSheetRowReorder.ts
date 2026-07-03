import { useCallback, useState, type DragEvent } from 'react'
import { reorderIds } from '../utils/sortOrder'

function isInteractiveDragTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  return Boolean(
    target.closest('input, textarea, select, button, a, label, [contenteditable="true"]'),
  )
}

export function useSheetRowReorder(rowIds: string[], onReorder: (orderedIds: string[]) => void) {
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const finishDrag = useCallback(() => {
    setDraggingId(null)
    setDragOverIndex(null)
  }, [])

  const beginDrag = useCallback((rowId: string, event: DragEvent) => {
    if (isInteractiveDragTarget(event.target)) return
    event.stopPropagation()
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', rowId)
    setDraggingId(rowId)
  }, [])

  const getHandleProps = useCallback(
    (rowId: string) => ({
      draggable: true,
      onDragStart: (event: DragEvent) => beginDrag(rowId, event),
      onDragEnd: finishDrag,
    }),
    [beginDrag, finishDrag],
  )

  const getRowProps = useCallback(
    (rowId: string, index: number) => ({
      className: [
        draggingId === rowId ? 'sheet-row--dragging' : '',
        dragOverIndex === index && draggingId !== rowId ? 'sheet-row--drag-over' : '',
      ]
        .filter(Boolean)
        .join(' '),
      onDragEnter: (event: DragEvent) => {
        event.preventDefault()
        event.stopPropagation()
        setDragOverIndex(index)
      },
      onDragOver: (event: DragEvent) => event.preventDefault(),
      onDrop: (event: DragEvent) => {
        event.preventDefault()
        event.stopPropagation()
        if (!draggingId) return
        onReorder(reorderIds(rowIds, draggingId, index))
        finishDrag()
      },
    }),
    [dragOverIndex, draggingId, rowIds, onReorder, finishDrag],
  )

  return { getHandleProps, getRowProps }
}
