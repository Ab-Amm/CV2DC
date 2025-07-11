"use client";

import PdfViewer from "./EditFile/PdfViewer";

function SimplePdfViewer({ file }) {
  return (
    <PdfViewer
      file={file}
      showZoomControls={false}
      showAdvancedNav={false}
      width={450}
      initialScale={1.2}
    />
  );
}

export default SimplePdfViewer;
