import type { Command } from "../types";
import { antiban } from "./antiban";
import { autorole } from "./autorole";
import { ban } from "./ban";
import { blacklist } from "./blacklist";
import { cargo } from "./cargo";
import { cl } from "./cl";
import { coleira } from "./coleira";
import { deletartudo } from "./deletartudo";
import { instagram } from "./instagram";
import { kick } from "./kick";
import { lock } from "./lock";
import { logs } from "./logs";
import { mensagens } from "./mensagens";
import { mute } from "./mute";
import { ping } from "./ping";
import { server } from "./server";
import { tempcall } from "./tempcall";
import { setarcargo } from "./setarcargo";
import { ticket } from "./ticket";
import { unban } from "./unban";
import { unlock } from "./unlock";
import { user } from "./user";
import { welcome } from "./welcome";

export const commands: Command[] = [
  ping,
  user,
  server,
  antiban,
  autorole,
  welcome,
  ban,
  unban,
  kick,
  mute,
  lock,
  unlock,
  cl,
  deletartudo,
  tempcall,
  mensagens,
  blacklist,
  ticket,
  logs,
  cargo,
  coleira,
  setarcargo,
  instagram,
];
