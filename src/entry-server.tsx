import React from 'react';
import { renderToString } from 'react-dom/server';
import PublicBusinessSSR from './components/PublicBusinessSSR';

export function renderBusinessPage(
  business: any,
  items: any[],
) {
  return renderToString(
    React.createElement(PublicBusinessSSR, {
      business,
      items,
    }),
  );
}
