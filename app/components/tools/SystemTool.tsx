import React from 'react';
export function SystemToolLeft({ systemTree, renderFileTree }: any) {
  return (
    <>
      {renderFileTree(systemTree, true)}
    </>
  );
}
