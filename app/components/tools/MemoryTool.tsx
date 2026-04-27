import React from 'react';
export function MemoryToolLeft({ memoryTree, renderFileTree }: any) {
  return (
    <>
      {renderFileTree(memoryTree)}
    </>
  );
}
