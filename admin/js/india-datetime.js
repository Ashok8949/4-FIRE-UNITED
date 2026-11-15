(function (root) {
  "use strict";
  const INDIA_OFFSET_MINUTES = 330;
  const LOCAL_DATETIME_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/;
  function parse(value) {
    if (typeof value !== "string") return null;
    const match = LOCAL_DATETIME_PATTERN.exec(value);
    if (!match) return null;
    const year=Number(match[1]),month=Number(match[2]),day=Number(match[3]);
    const hour=Number(match[4]),minute=Number(match[5]),second=Number(match[6]||0);
    const millisecond=match[7]?Number(match[7].padEnd(3,"0")):0;
    if(year<1000||month<1||month>12||hour>23||minute>59||second>59||millisecond>999)return null;
    const calendar=new Date(Date.UTC(year,month-1,day));
    if(calendar.getUTCFullYear()!==year||calendar.getUTCMonth()!==month-1||calendar.getUTCDate()!==day)return null;
    const instant=Date.UTC(year,month-1,day,hour,minute,second,millisecond)-INDIA_OFFSET_MINUTES*60000;
    return Number.isFinite(instant)?new Date(instant):null;
  }
  function parseInstant(value) {
    if(typeof value!=="string"||!value.trim())return null;
    const normalized=value.trim();
    if(LOCAL_DATETIME_PATTERN.test(normalized))return parse(normalized);
    if(!/(?:Z|[+-]\\d{2}:?\\d{2})$/i.test(normalized))return null;
    const timestamp=Date.parse(normalized);
    return Number.isFinite(timestamp)?new Date(timestamp):null;
  }
  function validateRange(startValue,endValue) {
    const start=parseInstant(startValue),end=parseInstant(endValue);
    if(!start||!end)return {valid:false,reason:"missing-or-invalid",start,end};
    if(end.getTime()<=start.getTime())return {valid:false,reason:"end-not-after-start",start,end};
    return {valid:true,reason:"",start,end};
  }
  function format(value) {
    const instant=parseInstant(value);
    if(!instant||!Number.isFinite(instant.getTime()))return "";
    const local=new Date(instant.getTime()+INDIA_OFFSET_MINUTES*60000);
    const pad=n=>String(n).padStart(2,"0");
    return local.getUTCFullYear()+"-"+pad(local.getUTCMonth()+1)+"-"+pad(local.getUTCDate())+"T"+pad(local.getUTCHours())+":"+pad(local.getUTCMinutes());
  }
  root.FourFUIndiaDateTime=Object.freeze({parse,parseInstant,validateRange,format,offsetMinutes:INDIA_OFFSET_MINUTES});
})(typeof window!=="undefined"?window:globalThis);
