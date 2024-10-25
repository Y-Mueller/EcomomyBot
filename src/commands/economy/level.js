const {
  Client,
  Interaction,
  ApplicationCommandOptionType,
  EmbedBuilder,
} = require("discord.js");
const calculateLevelXp = require("../../utils/calculateLevelXp");
const Level = require("../../models/Level");

module.exports = {
  /**
   *
   * @param {Client} client
   * @param {Interaction} interaction
   */
  callback: async (client, interaction) => {
    if (!interaction.inGuild()) {
      await interaction.reply("You can only use this command in a server.");
      return;
    }

    await interaction.deferReply();

    const mentionedUserId = interaction.options.get("target-user")?.value;
    const targetUserId = mentionedUserId || interaction.member.id;
    const targetUserObj = await interaction.guild.members.fetch(targetUserId);

    const fetchedLevel = await Level.findOne({
      userId: targetUserId,
      guildId: interaction.guild.id,
    });

    if (!fetchedLevel) {
      await interaction.editReply(
        mentionedUserId
          ? `${targetUserObj.user.tag} doesn't have any levels yet.`
          : "You don't have any levels yet."
      );
      return;
    }

    let allLevels = await Level.find({ guildId: interaction.guild.id }).select(
      "-_id userId level xp"
    );

    allLevels.sort((a, b) => {
      if (a.level === b.level) {
        return b.xp - a.xp;
      } else {
        return b.level - a.level;
      }
    });

    let currentRank =
      allLevels.findIndex((lvl) => lvl.userId === targetUserId) + 1;

    // Create an embed for the rank card
    const embed = new EmbedBuilder()
      .setColor("#0099ff") // Set the embed color
      .setTitle(`${targetUserObj.user.username}'s Rank`)
      .setThumbnail(targetUserObj.user.displayAvatarURL({ dynamic: true })) // Set user avatar as thumbnail
      .addFields(
        { name: "Rank", value: `#${currentRank}`, inline: true },
        { name: "Level", value: `${fetchedLevel.level}`, inline: true },
        {
          name: "Experience",
          value: `${fetchedLevel.xp}/${calculateLevelXp(fetchedLevel.level)}`,
          inline: true,
        },
        {
          name: "Status",
          value: `${targetUserObj.presence?.status || "offline"}`,
          inline: true,
        }
      )
      .setFooter({
        text: `Requested by ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
      });

    await interaction.editReply({ embeds: [embed] });
  },
  name: "level",
  description: "Shows your/someone's level.",
  options: [
    {
      name: "target-user",
      description: "Whose level do you want to see?",
      type: ApplicationCommandOptionType.Mentionable,
    },
  ],
};
