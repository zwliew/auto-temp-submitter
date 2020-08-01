# Miscellaneous scripts

A collections of miscellaneous scripts to improve my lifestyle.

## Available scripts

1. [Temperature submitter](#temperature-submitter)

## Temperature submitter

A Deno script that automatically submits temperatures.
Requires the following environment variables:

- PIN
- MEMBERID
- GROUPCODE

Command to run the script:

```bash
deno run --unstable --allow-read --allow-env --allow-net submit-temps.ts
```
