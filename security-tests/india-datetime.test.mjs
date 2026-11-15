import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../admin/js/india-datetime.js',import.meta.url),'utf8');
const window={};
vm.runInNewContext(source,{window,Date,String,Number,Object,globalThis:{}});
const india=window.FourFUIndiaDateTime;
test('converts India-local values to UTC instants across midnight',()=>{
 assert.equal(india.parse('2026-11-15T00:15').toISOString(),'2026-11-14T18:45:00.000Z');
 assert.equal(india.parse('2026-11-15T23:30').toISOString(),'2026-11-15T18:00:00.000Z');
 assert.equal(india.parse('2026-11-16T00:15').toISOString(),'2026-11-15T18:45:00.000Z');
});
test('rejects missing and impossible datetime-local values',()=>{
 for(const value of ['',null,'bad','2026-02-30T10:00','2026-11-15T24:00','2026-11-15T12:60','0999-11-15T12:00'])assert.equal(india.parse(value),null,String(value));
});
test('formats stored UTC instants back to India-local input values',()=>{
 assert.equal(india.format('2026-11-14T18:45:00.000Z'),'2026-11-15T00:15');
 assert.equal(india.format('2026-11-15T00:15'),'2026-11-15T00:15');
 assert.equal(india.format('not-a-date'),'');
});
test('Experience Studio uses the same India-local conversion for schedule fields',()=>{
 const studio=fs.readFileSync(new URL('../admin/js/experience-studio.js',import.meta.url),'utf8');
 assert.match(studio,/indiaDateTime\.parse/);assert.match(studio,/indiaDateTime\.format/);
 assert.doesNotMatch(studio,/new Date\(f\.endAt\)/);
});
