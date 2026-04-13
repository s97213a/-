/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Registrant {
  id: string;
  name: string;
  birthday: string;
}

export const registrants: Registrant[] = [
  { id: 'D123456789', name: '王小明', birthday: '1990/01/01' },
  { id: 'D220879632', name: '張三', birthday: '1985/12/31' },
  { id: 'R124578933', name: '李四', birthday: '1992/05/15' },
  { id: 'R253729105', name: '八七', birthday: '1988/08/08' },
  { id: 'S100472918', name: '陳李冰', birthday: '1995/10/20' },
  { id: 'D117492047', name: '李金木', birthday: '1970/03/12' },
];
