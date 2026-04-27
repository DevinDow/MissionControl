import React from 'react';
export function SpecsToolLeft({ specsTree, renderFileTree }: any) {
  return (
    <>
      {renderFileTree(specsTree)}
    </>
  );
}
