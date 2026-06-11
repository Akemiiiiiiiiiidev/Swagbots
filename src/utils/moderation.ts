import {
  ChatInputCommandInteraction,
  Guild,
  GuildMember,
  PermissionFlagsBits,
  User,
} from "discord.js";

const SNOWFLAKE_REGEX = /^\d{17,20}$/;

export function parseUserId(value: string): string | null {
  const cleaned = value.replace(/[<@!>]/g, "").trim();
  return SNOWFLAKE_REGEX.test(cleaned) ? cleaned : null;
}

export async function resolveModerationTarget(
  interaction: ChatInputCommandInteraction,
  requireMember: boolean
): Promise<
  | { userId: string; member: GuildMember | null; tag: string }
  | { error: string }
> {
  const guild = interaction.guild;

  if (!guild) {
    return { error: "Este comando só pode ser usado em um servidor." };
  }

  const userOption = interaction.options.getUser("membro");
  const idOption = interaction.options.getString("id");

  if (!userOption && !idOption) {
    return {
      error: "Informe o usuário pela menção ou pelo ID.",
    };
  }

  const userId = userOption?.id ?? parseUserId(idOption!);

  if (!userId) {
    return { error: "ID de usuário inválido." };
  }

  const member = await guild.members.fetch(userId).catch(() => null);

  if (requireMember && !member) {
    return { error: "Este usuário não está no servidor." };
  }

  const tag =
    userOption?.tag ??
    member?.user.tag ??
    (await interaction.client.users.fetch(userId).catch(() => null))?.tag ??
    userId;

  return { userId, member, tag };
}

export function checkModeratorPermissions(
  interaction: ChatInputCommandInteraction,
  permission: bigint
): string | null {
  const guild = interaction.guild;
  const member = interaction.member;

  if (!guild || !member || typeof member.permissions === "string") {
    return "Não foi possível verificar suas permissões.";
  }

  if (!member.permissions.has(permission)) {
    return "Você não tem permissão para usar este comando.";
  }

  const botMember = guild.members.me;

  if (!botMember?.permissions.has(permission)) {
    return "Eu não tenho permissão para executar esta ação.";
  }

  return null;
}

export function checkModerationHierarchy(
  interaction: ChatInputCommandInteraction,
  target: GuildMember
): string | null {
  const guild = interaction.guild;
  const executor = interaction.member;
  const botMember = guild?.members.me;

  if (!guild || !executor || !botMember || typeof executor.permissions === "string") {
    return "Não foi possível verificar a hierarquia de cargos.";
  }

  const executorId =
    "id" in executor ? executor.id : executor.user.id;

  if (target.id === executorId) {
    return "Você não pode usar este comando em si mesmo.";
  }

  if (target.id === botMember.id) {
    return "Não posso moderar a mim mesmo.";
  }

  if (target.id === guild.ownerId) {
    return "Não posso moderar o dono do servidor.";
  }

  const executorMember = executor as GuildMember;

  if (
    target.roles.highest.position >= executorMember.roles.highest.position &&
    executorId !== guild.ownerId
  ) {
    return "Este membro tem cargo igual ou superior ao seu.";
  }

  if (target.roles.highest.position >= botMember.roles.highest.position) {
    return "Este membro tem cargo igual ou superior ao meu.";
  }

  return null;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} minuto(s)`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} hora(s)`;
  }

  return `${hours} hora(s) e ${remainingMinutes} minuto(s)`;
}

export const ModerationPermissions = {
  ban: PermissionFlagsBits.BanMembers,
  kick: PermissionFlagsBits.KickMembers,
  mute: PermissionFlagsBits.ModerateMembers,
} as const;

export async function fetchGuildMember(
  guild: Guild,
  userId: string
): Promise<GuildMember | null> {
  return guild.members.fetch(userId).catch(() => null);
}

export async function fetchExecutorMember(
  interaction: ChatInputCommandInteraction
): Promise<GuildMember | null> {
  if (!interaction.guild) return null;
  return fetchGuildMember(interaction.guild, interaction.user.id);
}

export function isAdministrator(member: GuildMember): boolean {
  return member.permissions.has(PermissionFlagsBits.Administrator);
}

export async function checkAdministrator(
  interaction: ChatInputCommandInteraction
): Promise<string | null> {
  const member = await fetchExecutorMember(interaction);

  if (!member) {
    return "Não foi possível verificar suas permissões.";
  }

  if (!isAdministrator(member)) {
    return "Apenas administradores podem usar este comando.";
  }

  return null;
}

export function isUserAdministrator(guild: Guild, user: User): boolean {
  const member = guild.members.cache.get(user.id);
  return member?.permissions.has(PermissionFlagsBits.Administrator) ?? false;
}
