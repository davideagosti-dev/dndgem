process.env.HOST ??= '127.0.0.1';
process.env.PORT ??= '5182';
process.env.NITRO_HOST ??= process.env.HOST;
process.env.NITRO_PORT ??= process.env.PORT;

await import('./.output/server/index.mjs');
