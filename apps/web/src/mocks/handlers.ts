import { http, HttpResponse } from 'msw';

import { fixtureRelease } from './release';
import { spriteResponse } from './sprites';

const DATA_ORIGIN = 'https://d0.mapletip.com';

function spriteHttpResponse(contentId: string) {
  const response = spriteResponse(contentId);
  return new HttpResponse(response.body, {
    status: response.status,
    headers: { 'content-type': response.contentType },
  });
}

export const handlers = [
  http.get(`${DATA_ORIGIN}/media/images/:prefix/:contentId.png`, ({ params }) =>
    spriteHttpResponse(String(params['contentId'])),
  ),
  http.get(`${DATA_ORIGIN}/*`, ({ request }) => {
    const path = new URL(request.url).pathname.slice(1);
    const bytes = fixtureRelease.files.get(path);
    if (bytes === undefined) {
      return new HttpResponse(null, { status: 404 });
    }
    return new HttpResponse(bytes, {
      headers: {
        'cache-control': 'no-store',
        'content-type': 'application/json',
      },
    });
  }),
];

const cwCatalogPath = fixtureRelease.builds.get('cw-launch')?.catalog.path;
const gmsProductPath =
  fixtureRelease.builds.get('gms-v83')?.productManifest.path;

export const failingOriginHandlers = [
  ...(cwCatalogPath === undefined
    ? []
    : [
        http.get(`${DATA_ORIGIN}/${cwCatalogPath}`, () => {
          const original = fixtureRelease.files.get(cwCatalogPath);
          if (original === undefined) {
            return new HttpResponse(null, { status: 404 });
          }
          const altered = new Uint8Array(original);
          altered[0] = (altered[0] ?? 0) ^ 1;
          return new HttpResponse(altered, {
            headers: { 'content-type': 'application/json' },
          });
        }),
      ]),
  ...(gmsProductPath === undefined
    ? []
    : [
        http.get(
          `${DATA_ORIGIN}/${gmsProductPath}`,
          () =>
            new HttpResponse('HTTP 503 Service Unavailable', {
              status: 503,
              headers: { 'content-type': 'text/plain' },
            }),
        ),
      ]),
];
