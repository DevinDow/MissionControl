import React from 'react';
export function OldToolLeft({ oldTree, renderFileTree }: any) {
  return (
    <>
      {renderFileTree(oldTree)}
    </>
  );
}
