const {
  Client,
  Interaction,
  ApplicationCommandOptionType,
} = require("discord.js");
const User = require("../../models/User");

module.exports = {
  /**
   *
   * @param {Client} client
   * @param {Interaction} interaction
   */
  callback: async (client, interaction) => {
    if (!interaction.inGuild()) {
      interaction.reply({
        content: "You can only run this command in a server.",
        ephemeral: true,
      });
      return;
    }

    const targetUserId = interaction.options.get("user")?.value;
    const amount = interaction.options.get("amount")?.value;

    if (!amount || isNaN(amount) || amount <= 0) {
      interaction.reply({
        content: "Please provide a valid amount to transfer.",
        ephemeral: true,
      });
      return;
    }

    const senderUser = await User.findOne({
      userId: interaction.member.id,
      guildId: interaction.guild.id,
    });

    if (!senderUser) {
      interaction.reply({
        content: "You don't have a profile yet.",
        ephemeral: true,
      });
      return;
    }

    if (senderUser.balance < amount) {
      interaction.reply({
        content: "You don't have enough balance to make this transfer.",
        ephemeral: true,
      });
      return;
    }

    const recipientUser = await User.findOne({
      userId: targetUserId,
      guildId: interaction.guild.id,
    });

    if (!recipientUser) {
      interaction.reply({
        content: `<@${targetUserId}> doesn't have a profile yet.`,
        ephemeral: true,
      });
      return;
    }

    senderUser.balance -= amount;
    recipientUser.balance += amount;

    await senderUser.save();
    await recipientUser.save();

    interaction.reply({
      content: `Successfully transferred **${amount}** to <@${targetUserId}>!`,
    });
  },
  name: "transfer",
  description: "Transfer money to another user",
  options: [
    {
      name: "user",
      description: "The user to whom you want to transfer money.",
      type: ApplicationCommandOptionType.User,
      required: true,
    },
    {
      name: "amount",
      description: "The amount of money to transfer.",
      type: ApplicationCommandOptionType.Integer,
      required: true,
    },
  ],
};
