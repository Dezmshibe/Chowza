import React from 'react';
import { renderToString } from 'react-dom/server';
import PublicBusinessSSR from './components/PublicBusinessSSR';
import { ChowzaHome } from './components/ChowzaHome';

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

export function renderHomePage(
  businesses: any[],
  foods: any[],
) {
  return renderToString(
    React.createElement(ChowzaHome, {
      initialBusinesses: businesses,
      initialFoods: foods,
    }),
  );
}