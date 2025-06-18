// cancel-xaman-payloads.js
// Script pour annuler plusieurs payloads Xaman/XUMM par UUID
require('dotenv').config();
const path = require('path');
const backend = require(path.join(__dirname, 'lib', 'services', 'xaman-backend'));
const cancelPayload = backend.cancelPayload;
const getPayloadStatus = backend.getPayloadStatus;

const uuids = [
  '5d5cda82-b7bd-4636-9295-57ca96ed8252',
  '2f81fbb5-81f0-4d43-875b-5a6f33e15ef5',
  '7275d741-559c-4542-b7f5-4cad7db81142',
  '2b6a21e6-cbb3-4309-b831-f27c010919b5',
  'c97cade7-dd2e-4f0b-8c59-33151acf9900'
];

(async () => {
  for (const id of uuids) {
    try {
      const status = await getPayloadStatus(id);
      if (status && status.meta && status.meta.opened) {
        console.log(`⚠️  Payload ${id} already opened in Xaman app, cannot be cancelled by API.`);
        continue;
      }
      const res = await cancelPayload(id);
      if (res && res.result && res.result.cancelled) {
        console.log(`✅ Cancelled: ${id}`, res.result.reason);
      } else {
        console.log(`❌ Not cancelled: ${id}`, res);
      }
    } catch (e) {
      console.error(`❌ Error cancelling ${id}:`, e.message || e);
    }
  }
  process.exit(0);
})();
