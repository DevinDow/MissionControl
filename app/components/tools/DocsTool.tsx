import React from 'react';
export function DocsToolLeft({ docsTree, renderFileTree }: any) {
  return (
    <>
      {renderFileTree(docsTree, false, true)}
    </>
  );
}
