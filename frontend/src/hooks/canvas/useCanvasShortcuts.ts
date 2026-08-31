import { useEffect, useState } from 'react';
import { Node } from 'reactflow';
import { addCanvasItem } from '../../api/client';

interface UseCanvasShortcutsProps {
  activeCanvasId: string;
  getNodes: () => Node<any>[];
  setNodes: React.Dispatch<React.SetStateAction<Node<any>[]>>;
}

export function useCanvasShortcuts({
  activeCanvasId,
  getNodes,
  setNodes,
}: UseCanvasShortcutsProps) {
  const [copiedNodes, setCopiedNodes] = useState<Node<any>[]>([]);

  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // Don't intercept when user is typing in input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isCopy = (isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === 'c';
      const isPaste = (isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === 'v';

      if (isCopy) {
        const selected = getNodes().filter((n) => n.selected);
        if (selected.length > 0) {
          setCopiedNodes(selected);
        }
      }

      if (isPaste && copiedNodes.length > 0) {
        e.preventDefault();
        const createdNodes: Node<any>[] = [];

        for (const nodeToCopy of copiedNodes) {
          const newPosX = nodeToCopy.position.x + 30;
          const newPosY = nodeToCopy.position.y + 30;

          try {
            const newItem = await addCanvasItem(
              activeCanvasId,
              nodeToCopy.type || 'note',
              newPosX,
              newPosY,
              nodeToCopy.data?.documentId || nodeToCopy.data?.section_id || null,
              nodeToCopy.data
            );

            createdNodes.push({
              ...nodeToCopy,
              id: newItem.id,
              position: { x: newPosX, y: newPosY },
              selected: true,
            });
          } catch {
            // silent continue
          }
        }

        if (createdNodes.length > 0) {
          setNodes((nds) => [...nds.map((n) => ({ ...n, selected: false })), ...createdNodes]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [copiedNodes, activeCanvasId, getNodes, setNodes]);

  return {
    copiedNodes,
    setCopiedNodes,
  };
}
