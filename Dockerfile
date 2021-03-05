FROM hayd/alpine-deno:1.8.0
WORKDIR /usr/src/app
USER deno
COPY deps.ts ./
RUN deno cache deps.ts
COPY . ./
RUN deno cache main.ts
CMD ["run", "--allow-net", "--allow-env", "--allow-read", "--unstable", "main.ts"]
