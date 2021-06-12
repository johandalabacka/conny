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
  -c, --cls           Clear screen before each showing
  -h, --host=name     Connect to host (default 127.0.0.1)
  -u, --user=name     User to connect as (default root)
  -p, --password=name Password to use (default empty)
  -P, --port=#        Port number to use (default 3306)
  -e, --pattern       Pattern to match status variables (default %conn%)
`)
}

const args = parse(Deno.args, {
  alias: {
    cls: 'c',
    host: 'h',
    user: 'u',
    password: 'p',
    port: 'P',
    pattern: 'e'
  },
  boolean: ['cls', 'help'],
  string: ['host', 'user', 'password', 'port', 'pattern'],
  default: {
    host: '127.0.0.1',
    user: 'root',
    password: '',
    port: '3306',
    pattern: '%conn%'
  },
  unknown: (option) => {
    console.error('Unknown option', option)
    usage()
    Deno.exit(1)
  }
})

if (args.help) {
  usage()
  Deno.exit(2)
}

const client = await new Client().connect({
  hostname: args.host,
  port: parseInt(args.port),
  username: args.user,
  password: args.password,
})

const padding = 40
const formatter = Intl.DateTimeFormat('sv-SE', {dateStyle: 'short', timeStyle: 'medium'})
const ruler = '-'.repeat(padding + 5)

while(true) {
  let result
  try {
    result = await client.execute(`SHOW STATUS LIKE ?`, [args.pattern])
  } catch (err) {
    console.error(err.message)
    Deno.exit(0)
  }
  if (args.cls) {
    console.clear()
  }
  console.log(ruler)
  console.log(`${formatter.format(new Date())} - matching "${args.pattern}"`)
  console.log(ruler)
  for (const { Variable_name, Value } of result.rows ?? []) {
    console.log(Variable_name.padEnd(40, '.'), Value ?? '<empty>')
  }
  await sleep(1000)
}
