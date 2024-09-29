const { Client, GatewayIntentBits, Partials, EmbedBuilder } = require('discord.js');
const afkUsers = new Map();
const afkTags = new Map();  // Lưu trữ các thông tin về ai đã tag người dùng AFK

// Tạo bot với các quyền intents và partials cần thiết
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ],
    partials: [Partials.Channel],
    presence: {
        status: 'online',
        activities: [{ name: '.gg/DStore', type: 'WATCHING' }] // Tên hoạt động hiển thị
    }
});

// Khi bot sẵn sàng
client.once('ready', () => {
    console.log(`${client.user.tag} đã sẵn sàng và đang hoạt động trên mobile!`);
    // Thiết lập trạng thái hiển thị "mobile"
    client.user.setPresence({
        activities: [{ name: '.gg/DStore' }],
        status: 'online',
    });
});

// Lệnh AFK
client.on('messageCreate', message => {
    if (message.author.bot) return;

    // Lệnh đặt AFK
    if (message.content.startsWith('!afk')) {
        const reason = message.content.split(' ').slice(1).join(' ') || 'Không có lý do cụ thể';
        afkUsers.set(message.author.id, reason);
        message.reply(`${message.author} hiện đang AFK: ${reason}`);
        afkTags.set(message.author.id, []); // Tạo một mảng để lưu thông tin ai đã tag họ
        return;  // Ngăn chặn việc xóa AFK sau khi vừa đặt
    }

    // Kiểm tra nếu ai đó tag người dùng AFK
    afkUsers.forEach((reason, userId) => {
        if (message.mentions.has(userId)) {
            const afkUser = message.guild.members.cache.get(userId);
            message.reply(`${afkUser.user.username} hiện đang AFK: ${reason}`);

            // Lưu thông tin ai đã tag người dùng AFK và kênh nào
            const tagInfo = afkTags.get(userId) || [];
            tagInfo.push({
                tagger: message.author.username,
                channel: message.channel.id, // Lưu ID của kênh để tag
                content: message.content
            });
            afkTags.set(userId, tagInfo);
        }
    });

    // Xóa trạng thái AFK khi người dùng gửi tin nhắn khác ngoài lệnh `!afk`
    if (afkUsers.has(message.author.id)) {
        afkUsers.delete(message.author.id);
        
        const tagInfo = afkTags.get(message.author.id);
        
        if (tagInfo && tagInfo.length > 0) {
            const embed = new EmbedBuilder()
                .setTitle(`Thông báo từ khi bạn AFK`)
                .setDescription(`Dưới đây là danh sách những người đã tag bạn trong lúc bạn AFK:`)
                .setColor(0x00AE86);

            tagInfo.forEach(info => {
                embed.addFields(
                    { name: 'Người tag', value: info.tagger, inline: true },
                    { name: 'Kênh', value: `<#${info.channel}>`, inline: true }, // Tag kênh bằng ID
                    { name: 'Nội dung', value: info.content || 'Không có nội dung', inline: false }
                );
            });

            message.reply({ content: `${message.author} đã quay trở lại từ trạng thái AFK!`, embeds: [embed] });
        } else {
            message.reply(`${message.author} đã quay trở lại từ trạng thái AFK!`);
        }

        afkTags.delete(message.author.id); // Xóa thông tin tag sau khi đã gửi thông báo
    }
});

// Bot chạy với token của bạn
client.login(process.env.DISCORD_TOKEN);
