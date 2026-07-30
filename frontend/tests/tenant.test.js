import test from 'node:test';
import assert from 'node:assert/strict';
import { getTenantHeader, tenantHeaders } from '../src/utils/tenant.js';

test('uses explicit school slug for localhost preview routes', () => {
  global.window = { location: { hostname: 'localhost' } };
  assert.equal(getTenantHeader('school-a'), 'school-a');
  assert.deepEqual(tenantHeaders('school-a'), { 'X-School-ID': 'school-a' });
});

test('derives tenant from subdomain without hard-coded IDs', () => {
  global.window = { location: { hostname: 'school-a.koola.id' } };
  assert.equal(getTenantHeader(), 'school-a');
});

test('does not invent a tenant on main hosts', () => {
  global.window = { location: { hostname: 'koola.id' } };
  assert.equal(getTenantHeader(), null);
  assert.deepEqual(tenantHeaders(), {});
});
