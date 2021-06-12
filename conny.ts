/**
 * Show status for a mysql/mariadb database
 * deno compile --allow-net status.ts
 */
import { Client } from 'https://deno.land/x/mysql@v2.9.0/mod.ts'
import { parse } from "https://deno.land/std@0.98.0/flags/mod.ts"

/**
 * Sleep a number of milliseconds
 * @param ms 
 * @returns 
 */
function sleep(ms : number) : Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Prints usage
 */
function usage() {
  console.log(`Usage: conny [flags]
  -c, --clear         Clear screen before each showing
  -h, --host=name     Connect to host (default 127.0.0.1)
  -p, --password=name Password to use (default empty)
  -P, --port=#        Port number to use (default 3306)
  -e=name             Pattern to match status variables (default %conn%)
`)
}

const args = parse(Deno.args)
if (args.help) {
  usage()
  Deno.exit(2)
}

const client = await new Client().connect({
  hostname: args.host ?? args.h ?? '127.0.0.1',
  port: parseInt(args.port ?? args.P ?? '3306'),
  username: args.user ?? args.u ?? 'root',
  password: args.password ?? args.p ?? '',
})

const clear = args.clear ?? args.c
const padding = 40
const formatter = Intl.DateTimeFormat('sv-SE', {dateStyle: 'short', timeStyle: 'medium'})
const ruler = '-'.repeat(padding + 5)
while(true) {
  
  let result
  try {
    result = await client.execute(`SHOW STATUS LIKE ?`, [args.e ?? '%conn%'])
  } catch (err) {
    console.error(err.message)
    Deno.exit(0)
  }
  if (clear) {
    console.clear()
  }
  console.log(ruler)
  console.log(formatter.format(new Date()))
  console.log(ruler)
  for (const { Variable_name, Value } of result.rows ?? []) {
    console.log(Variable_name.padEnd(40, '.'), '=', Value)
  }
  await sleep(1000)
}
