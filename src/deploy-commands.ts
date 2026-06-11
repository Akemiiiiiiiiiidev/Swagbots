import "dotenv/config";
import { REST, Routes } from "discord.js";
import { commands } from "./commands";

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID?.trim();

if (!token || !clientId) {
  console.error("Defina DISCORD_TOKEN e CLIENT_ID no arquivo .env");
  process.exit(1);
}

const botToken = token as string;
const appId = clientId as string;
const rest = new REST().setToken(botToken);
const commandData = commands.map((command) => command.data.toJSON());

const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${appId}&permissions=8&integration_type=0&scope=bot%20applications.commands`;

async function deploy() {
  try {
    const app = (await rest.get(Routes.oauth2CurrentApplication())) as {
      id: string;
      name: string;
    };

    if (app.id !== appId) {
      console.error(
        `CLIENT_ID incorreto. O token pertence a "${app.name}" (${app.id}).`
      );
      process.exit(1);
    }

    console.log(`Aplicacao: ${app.name} (${app.id})`);
    console.log(`Registrando ${commandData.length} comando(s)...`);

    if (guildId) {
      const guild = (await rest.get(Routes.guild(guildId))) as { name: string };

      const registered = (await rest.put(
        Routes.applicationGuildCommands(appId, guildId),
        { body: commandData }
      )) as { name: string }[];

      console.log(`Servidor: ${guild.name} (${guildId})`);
      console.log(`Comandos no servidor: ${registered.map((c) => c.name).join(", ")}`);
    }

    const globalCommands = (await rest.put(Routes.applicationCommands(appId), {
      body: commandData,
    })) as { name: string }[];

    console.log(`Comandos globais: ${globalCommands.map((c) => c.name).join(", ")}`);

    if (guildId) {
      console.log("\nOs comandos no servidor aparecem na hora.");
    }

    console.log("Os comandos globais podem levar ate 1 hora em outros servidores.");
    console.log("\nSe os comandos nao aparecerem:");
    console.log("1. Reconvide o bot com o escopo applications.commands:");
    console.log(inviteUrl);
    console.log("2. Confirme que esta no servidor correto do GUILD_ID.");
    console.log("3. Va em Configuracoes do servidor > Integracoes > Bot e habilite comandos.");
    console.log("4. Feche e abra o Discord (Ctrl+R).");
  } catch (error) {
    console.error("Erro ao registrar comandos:", error);

    if (
      error &&
      typeof error === "object" &&
      "status" in error &&
      error.status === 403
    ) {
      console.error("\nO bot nao tem acesso ao servidor do GUILD_ID.");
      console.error("Reconvide o bot com este link:");
      console.error(inviteUrl);
    }

    process.exit(1);
  }
}

deploy();
