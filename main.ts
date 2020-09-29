import { config, DotenvConfig, delay } from "./deps.ts";

interface Config {
  pin: string;
  memberId: string;
  groupCode: string;
}

console.log("Starting Temperature Submitter");

const MSEC_PER_HOUR = 24 * 60 * 60 * 1000;
const GMT8_OFFSET_MSEC = 8 * 60 * 60 * 1000;

const cfgs: Config[] = parseConfig(config({ safe: true }));

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

function parseConfig(cfg: DotenvConfig): Config[] {
  const memberIds = cfg.MEMBERIDS.split(",");
  const pins = cfg.PINS.split(",");
  const groupCodes = cfg.GROUPCODES.split(",");

  const parsed: Config[] = [];
  for (
    let i = 0;
    i < Math.min(memberIds.length, pins.length, groupCodes.length);
    ++i
  ) {
    parsed.push({
      memberId: memberIds[i],
      pin: pins[i],
      groupCode: groupCodes[i],
    });
  }
  return parsed;
}

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

  for (let cfg of cfgs) {
    const params: { [key: string]: string } = {
      meridies: isAm ? "AM" : "PM",
      memberId: cfg.memberId,
      pin: cfg.pin,
      groupCode: cfg.groupCode,
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

    console.log(
      `Submitting ${isAm ? "AM" : "PM"} for ${cfg.pin}: ${searchParams}`
    );
    fetch("https://temptaking.ado.sg/group/MemberSubmitTemperature", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: searchParams,
    })
      .then((res) => res.text())
      .then((data) =>
        console.log(`Submitted successfully for ${cfg.pin}: ${data}`)
      )
      .catch((err) =>
        console.error(`Error while submitting for ${cfg.pin}: ${err}`)
      );
  }
}
