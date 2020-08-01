import { delay } from "https://deno.land/std/async/delay.ts";
import { config } from "https://deno.land/x/dotenv/mod.ts";

console.log("Starting Temperature Submitter");

const MSEC_PER_HOUR = 24 * 60 * 60 * 1000;
const GMT8_OFFSET_MSEC = 8 * 60 * 60 * 1000;

const cfg = config({ safe: true });

const date = new Date(Date.now());
const initialAmTimeout = countHourDiff(date.getUTCHours(), 0) * 60 * 60 * 1000;
const initialPmTimeout = countHourDiff(date.getUTCHours(), 8) * 60 * 60 * 1000;
startService(
  initialAmTimeout,
  new Date(date.getTime() + initialAmTimeout + GMT8_OFFSET_MSEC),
  true
);
startService(
  initialPmTimeout,
  new Date(date.getTime() + initialPmTimeout + GMT8_OFFSET_MSEC),
  false
);

function countHourDiff(from: number, to: number): number {
  const diff = to - from;
  return diff + (diff <= 0 ? 24 : 0);
}

async function startService(ms: number, date: Date, isAm: boolean) {
  await submitTempDelayed(ms, date, isAm);
  startService(MSEC_PER_HOUR, new Date(date.getTime() + MSEC_PER_HOUR), isAm);
}

async function submitTempDelayed(ms: number, date: Date, isAm: boolean) {
  await delay(ms);

  const params: any = {
    meridies: isAm ? "AM" : "PM",
    memberId: cfg.MEMBERID,
    pin: cfg.PIN,
    groupCode: cfg.GROUPCODE,
    temperature: (Math.trunc(360 + Math.random() * 12) / 10).toString(),
    date: `${date.getUTCDate().toString().padStart(2, "0")}/${(
      date.getUTCMonth() + 1
    )
      .toString()
      .padStart(2, "0")}/${date.getUTCFullYear()}`,
  };
  const searchParams = new URLSearchParams();
  for (const key of Object.keys(params)) {
    searchParams.set(key, params[key]);
  }

  console.log(`Submitting for ${isAm ? "AM" : "PM"}: ${searchParams}`);
  fetch("https://temptaking.ado.sg/group/MemberSubmitTemperature", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
    body: searchParams,
  })
    .then((res) => res.text())
    .then((data) => console.log(`Submitted successfully: ${data}`))
    .catch((err) => console.error(`Error while submitting: ${err}`));
}
