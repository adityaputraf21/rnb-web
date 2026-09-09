import { prisma } from "@/lib/prisma";
import { sendDiscordWebhook } from "@/lib/discord";

/**
 * Catat aksi moderasi ke AuditLog + kirim ke channel mod-log Discord
 * (kalau DISCORD_WEBHOOK_MODLOG diset).
 */
export async function modLog(input: {
  moderatorId: string;
  moderatorName: string;
  action: string;
  targetType: string;
  targetId: string;
  summary: string;
  meta?: Record<string, unknown>;
}) {
  await prisma.auditLog.create({
    data: {
      moderatorId: input.moderatorId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      meta: (input.meta ?? {}) as object,
    },
  });

  await sendDiscordWebhook({
    category: "modlog",
    embed: {
      author: { name: `🛡️ ${input.action}` },
      description: input.summary,
      fields: [
        { name: "Moderator", value: input.moderatorName, inline: true },
        { name: "Target", value: `${input.targetType} \`${input.targetId}\``, inline: true },
      ],
    },
  });
}
