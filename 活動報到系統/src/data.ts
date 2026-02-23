/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Registrant {
  id: string;
  name: string;
  phone: string;
}

export const registrants: Registrant[] = [
  { id: 'D123456789', name: '王小明', phone: '0912345678' },
  { id: 'D220879632', name: '張三', phone: '0956347249' },
  { id: 'R124578933', name: '李四', phone: '0934756436' },
  { id: 'R253729105', name: '八七', phone: '0953245758' },
  { id: 'S100472918', name: '陳李冰', phone: '0963462713' },
  { id: 'D117492047', name: '李金木', phone: '0962421745' },
];
