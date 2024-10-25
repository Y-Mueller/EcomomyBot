const {
  Client,
  Interaction,
  ApplicationCommandOptionType,
} = require("discord.js");
const User = require("../../models/User");
const { roleCost } = require("../../../shopPrices.json");

module.exports = {
  /**
   *
   * @param {Client} client
   * @param {Interaction} interaction
   */
  callback: async (client, interaction) => {
    if (!interaction.inGuild()) {
      await interaction.reply({
        content: "You can only run this command in a server.",
        ephemeral: true,
      });
      return;
    }

    const shopCommand = interaction.options.getSubcommand();

    if (shopCommand === "role") {
      const name = interaction.options.getString("name");
      const userId = interaction.member.id;

      const user = await User.findOne({
        userId: userId,
        guildId: interaction.guild.id,
      });

      if (!user) {
        await interaction.reply({
          content: `<@${userId}> doesn't have a profile yet.`,
          ephemeral: true,
        });
        return;
      }

      const balance = user.balance;

      if (balance < roleCost) {
        await interaction.deferReply({ ephemeral: true });
        return await interaction.editReply(
          `You need ${roleCost} coins to buy this role.`
        );
      }

      await interaction.deferReply();

      const role = await interaction.guild.roles.create({
        name: name,
        permissions: [],
      });

      await interaction.member.roles.add(role);

      await User.findOneAndUpdate(
        {
          userId: userId,
          guildId: interaction.guild.id,
        },
        {
          $inc: {
            balance: -roleCost,
          },
        }
      );

      await interaction.editReply("Successfully purchased the role.");
    }
  },
  name: "shop",
  description: "Just a shop",
  options: [
    {
      name: "role",
      description: `Buy a role for ${roleCost} coins`,
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: "name",
          description: "Choose the name for your role",
          type: ApplicationCommandOptionType.String,
          minLength: 1,
          maxLength: 20,
          required: true,
        },
      ],
    },
  ],
};
