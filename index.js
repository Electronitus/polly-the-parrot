const Discord = require("discord.js");
require("dotenv").config();
const fs = require('fs');

const bot = new Discord.Client();

const token = process.env.TOKEN;

// Bot ID.
const botID = "762723591556038676";

// Bot prefix.
const prefix = "~";

// Server ID.
const serverID = process.env.SERVER_ID;

// Voting channel ID.
const channelID = process.env.CHANNEL_ID;

// Embed colour.
const embedColour = "F1C40F";

// Embed thumbnail.
const embedThumbnail = "https://i.imgur.com/09aA3ig.jpg";

// Voting duration.
const voteDuration = 86400000;

// Ranks.
const ranks = [];
ranks[0] = "🥇 ";
ranks[1] = "🥈 ";
ranks[2] = "🥉 ";
for(i = 3; i < 10; i++){
    ranks[i] = (i + 1) + ". ";
};

// A function that counts the number of properties in an object.
Object.size = function(obj){
    var size = 0, key;
    for(key in obj){
        if(obj.hasOwnProperty(key)) size++;
    };
    return size;
};

// A function that finds the position of a value in an array.
function findWithAttr(array, attr, value){
    for(var i = 0; i < array.length; i += 1){
        if(array[i][attr] === value){
            return i;
        }
    };
    return -1;
}

// A function that converts a cardinal number into an ordinal number.
function cardinalToOrdinal(number){
    switch(number){
        case 11:
            number = number.toString() + "th";
            return number;
        case 12:
            number = number.toString() + "th";
            return number;
    };
    switch(number % 10){
        case 1:
            number = number.toString() + "st";
            break;      
        case 2:
            number = number.toString() + "nd";
            break;
        case 3:
            number = number.toString() + "rd";
            break;
        default:
            number = number.toString() + "th";
    };
    return number;
}

bot.on("ready", () => {
    
    // Tells the console that the bot is online.
    console.log("This bot is online.");

    // Sets the activity of the bot.
    bot.user.setActivity("with a pretty bird.", {type: "PLAYING"});

    // Fetchs all the messages in the voting channel.
    bot.channels.cache.get(channelID).messages.fetch()
        .then(messages => {messages => console.log("Number of messages fetched: ", messages.array().length)});
})

bot.on("message", message => {

    // Ignores its own messages.
    if(message.author.bot) return;

    // Imitates the message occasionally.
    let randomNumber = Math.floor(Math.random() * 1001); 
    if(message.channel.id != channelID && randomNumber == 0){
        message.channel.send(message.content + "... *squaaawwwk!!!*");
    };

    // If the channel is the voting channel, allows certain file types to be sent.
    if(message.channel.id == channelID){

        // If the message does not contain an attachment, deletes the message.
        if (message.attachments.size > 0){

            // If the attachment does have an appropriate file extension, deletes the message.
            if(message.attachments.array()[0].url.toLowerCase().endsWith(".png") ||
            message.attachments.array()[0].url.toLowerCase().endsWith(".jpg") ||
            message.attachments.array()[0].url.toLowerCase().endsWith(".gif"))
            {
                // Adds reactions.
                message.react("😍")
                    .then(() => message.react("🙂"))
                    .then(() => message.react("😦"))
                    .then(() => message.react("🤮"))
                    .then(() => message.react("🕒"));

                setTimeout(function(){

                    if(message.deleted) return;

                    // Removes the clock reaction after the voting time has ended.
                    message.reactions.cache.get("🕒").remove();
                    let reactionInfo = message.reactions.cache.array();
                    let reactionCount = [];
                    reactionCount = {
                        id: message.id,
                        author: message.author.id,
                        time: message.createdTimestamp,
                        A: reactionInfo[0].users.cache.map(a => a.id),
                        B: reactionInfo[1].users.cache.map(a => a.id),
                        C: reactionInfo[2].users.cache.map(a => a.id),
                        D: reactionInfo[3].users.cache.map(a => a.id)
                    };

                    // Adds the reaction data to the JSON file.
                    let reactionRawData = fs.readFileSync("reactionData.json");
                    let reactionData = JSON.parse(reactionRawData);
                    reactionData.push(reactionCount);
                    reactionDataNew = JSON.stringify(reactionData);
                    fs.writeFileSync("reactionData.json", reactionDataNew);
                }, voteDuration);
            }
            else{
                message.delete();
            };
        }
        else{
            message.delete();
        };
    }
    else{
        // Stores command arguments as an array.
        let args = message.content.substring(prefix.length).split(" ");

        // Only reads commands that start with the correct prefix.
        if(message.content.startsWith(prefix)){

            // Reads the command.
            switch(args[0]){

                case "help":
                    const helpEmbed = new Discord.MessageEmbed()
                        .setColor(embedColour)
                        .setTitle("Help")
                        .setDescription("I'm Polly, a bot made by Electronite#1424! I can provide a voting system for your memes.")
                        .setThumbnail(embedThumbnail)
                        .addField("Commands", "Type " + "`" + prefix + "commands` for a list of commands.")
                    message.channel.send(helpEmbed);
                    break;

                case "commands":
                    const commandsEmbed = new Discord.MessageEmbed()
                        .setColor(embedColour)
                        .setTitle("Commands")
                        .setThumbnail(embedThumbnail)
                        .addField("`" + prefix + "help`", "Displays information about Polly the Parrot.")
                        .addField("`" + prefix + "commands`", "Displays a list of commands.")
                        .addField("`" + prefix + "rank @user`", "Displays the rank, score and number of submissions of the specified user. If no user is specified, displays yours.")
                        .addField("`" + prefix + "lb`", "Displays the leaderboard.")
                    message.channel.send(commandsEmbed);
                    break;

                case "rank":

                    var server = bot.guilds.cache.get(serverID);
                    server.members.fetch();
                    var score = [];

                    // Creates a score array for each user in the server.
                    for(i = 0; i < server.members.cache.array().length; i++){
                        score[(server.members.cache.array()[i].id)] = {
                            authorID: server.members.cache.array()[i].id,
                            authorName: server.member(server.members.cache.array()[i]) ? server.member(server.members.cache.array()[i]).displayName: null,
                            value: 0,
                            number: 0,
                            votes: [0,0,0,0]                            
                        };
                    }
                    
                    // Reads the JSON file.
                    var reactionRawData = fs.readFileSync("reactionData.json");
                    var reactionData = JSON.parse(reactionRawData);

                    // For each message in the JSON file:
                    for(i = 0; i < reactionData.length; i++){
                        score[(reactionData[i].author)].value += reactionData[i].A.length*2 + reactionData[i].B.length - reactionData[i].C.length - reactionData[i].D.length*2,
                        score[(reactionData[i].author)].number++;
                        for(j = 0; j < reactionData[i].A.length; j++){
                            score[(reactionData[i].A[j])].votes[0]++;
                        }
                        for(j = 0; j < reactionData[i].B.length; j++){
                            score[(reactionData[i].B[j])].votes[1]++;
                        }
                        for(j = 0; j < reactionData[i].C.length; j++){
                            score[(reactionData[i].C[j])].votes[2]++;
                        }
                        for(j = 0; j < reactionData[i].D.length; j++){
                            score[(reactionData[i].D[j])].votes[3]++;
                        }
                    };

                    // Orders the score array.
                    scoreOrdered = Object.values(score).sort((a, b) => (a.value < b.value) ? 1 : -1);

                    // If a user is specified, returns the rank of that user.
                    if(message.mentions.members.first()){
                        let mentionedID = message.mentions.members.array()[0].user.id;
                        var rank = findWithAttr(scoreOrdered, "authorID", mentionedID) + 1;

                        // Creates and sends an embed.
                        let voteAvg = (scoreOrdered[rank - 1].votes[0]*2 + scoreOrdered[rank - 1].votes[1] - scoreOrdered[rank - 1].votes[2] - scoreOrdered[rank - 1].votes[3]*2) / ((scoreOrdered[rank - 1].votes[0] + scoreOrdered[rank - 1].votes[1] + scoreOrdered[rank - 1].votes[2] + scoreOrdered[rank - 1].votes[3]));
                        if(Number.isNaN(voteAvg)){voteAvg = 0;};
                        const rankEmbed = new Discord.MessageEmbed()
                            .setColor(embedColour)
                            .setThumbnail(message.mentions.members.array()[0].user.avatarURL({dynamic: true}))
                            .setTitle(scoreOrdered[rank - 1].authorName)
                        if(scoreOrdered[rank - 1].submissions > 0){
                            rankEmbed.setDescription("• Rank: `" + rank + "`\n• Score: `" + scoreOrdered[rank - 1].value + "`\n• Submissions: `" + scoreOrdered[rank - 1].number + "`");
                        }
                        else{
                            rankEmbed.setDescription("• Rank: `TBD`\n• Score: `" + scoreOrdered[rank - 1].value + "`\n• Submissions: `" + scoreOrdered[rank - 1].number + "`");
                        };
                        message.channel.send(rankEmbed);
                    }

                    // If no user is specified, returns the rank of the message author.
                    else{
                        var rank = findWithAttr(scoreOrdered, "authorID", message.author.id) + 1;

                        // Creates and sends an embed.
                        let voteAvg = (scoreOrdered[rank - 1].votes[0]*2 + scoreOrdered[rank - 1].votes[1] - scoreOrdered[rank - 1].votes[2] - scoreOrdered[rank - 1].votes[3]*2) / ((scoreOrdered[rank - 1].votes[0] + scoreOrdered[rank - 1].votes[1] + scoreOrdered[rank - 1].votes[2] + scoreOrdered[rank - 1].votes[3]));
                        if(Number.isNaN(voteAvg)){voteAvg = 0;};
                        const rankEmbed = new Discord.MessageEmbed()
                            .setColor(embedColour)
                            .setThumbnail(message.author.avatarURL({dynamic: true}))
                            .setTitle(scoreOrdered[rank - 1].authorName);
                        if(scoreOrdered[rank - 1].submissions > 0){
                            rankEmbed.setDescription("• Rank: `" + rank + "`\n• Score: `" + scoreOrdered[rank - 1].value + "`\n• Submissions: `" + scoreOrdered[rank - 1].number + "`");
                        }
                        else{
                            rankEmbed.setDescription("• Rank: `TBD`\n• Score: `" + scoreOrdered[rank - 1].value + "`\n• Submissions: `" + scoreOrdered[rank - 1].number + "`");
                        };
                        message.channel.send(rankEmbed);
                    };
                    break;

                case "lb":
                    var server = bot.guilds.cache.get(serverID);
                    server.members.fetch();
                    var score = [];
                    for(i = 0; i < server.members.cache.array().length; i++){
                        score[(server.members.cache.array()[i].id)] = {
                            authorID: server.members.cache.array()[i].id,
                            authorName: server.member(server.members.cache.array()[i]) ? server.member(server.members.cache.array()[i]).displayName: null,
                            value: 0,
                            number: 0,
                            votes: [0,0,0,0]                            
                        };
                    }
                    
                    // Reads the JSON file.
                    var reactionRawData = fs.readFileSync("reactionData.json");
                    var reactionData = JSON.parse(reactionRawData);

                    // For each message in the JSON file:
                    for(i = 0; i < reactionData.length; i++){
                        score[(reactionData[i].author)].value += reactionData[i].A.length*2 + reactionData[i].B.length - reactionData[i].C.length - reactionData[i].D.length*2,
                        score[(reactionData[i].author)].number++;
                        for(j = 0; j < reactionData[i].A.length; j++){
                            score[(reactionData[i].A[j])].votes[0]++;
                        }
                        for(j = 0; j < reactionData[i].B.length; j++){
                            score[(reactionData[i].B[j])].votes[1]++;
                        }
                        for(j = 0; j < reactionData[i].C.length; j++){
                            score[(reactionData[i].C[j])].votes[2]++;
                        }
                        for(j = 0; j < reactionData[i].D.length; j++){
                            score[(reactionData[i].D[j])].votes[3]++;
                        }
                    };

                    // Orders the score array.
                    scoreOrdered = Object.values(score).sort((a, b) => (a.value < b.value) ? 1 : -1);

                    // Creates and sends an embed.
                    const lbEmbed = new Discord.MessageEmbed()
                        .setColor(embedColour)
                        .setThumbnail("https://i.imgur.com/EiHNAWj.png")
                        .setTitle("Leaderboard");
                    let submitted = -1;
                    for(i = 0; i < 10; i++){
                        submitted++;
                        if(!scoreOrdered[submitted]){
                            break;
                        }
                        else if(scoreOrdered[submitted].number > 0){
                            lbEmbed.addField(ranks[i] + scoreOrdered[submitted].authorName, "Score: `" + scoreOrdered[submitted].value + "` • Submissions: `" + scoreOrdered[submitted].number + "`");
                        }
                        else{
                            i--;
                        };
                    };
                    message.channel.send(lbEmbed);
                    break;
            };
        };
    };
});

bot.on("messageReactionAdd", (reaction, user) => {

    // Ignores reactions not in the voting channel.
    if(reaction.message.channel != channelID) return;

    // Ignores its own reactions.
    if(user.id == botID) return;

    let reactionInfo = reaction.message.reactions.cache.array();

    // If the attachment does not have a clock reaction, removes the reaction.
    if(reactionInfo.length < 5){
        reaction.users.remove(user.id);
    }

    // If the user has reacted to their own message, removes the reaction.
    if(user.id == reaction.message.author.id){
        reaction.users.remove(user.id);
    }

    // If the user has reacted with a clock, removes the reaction.
    if(reaction.emoji.name == "🕒"){
        reaction.users.remove(user.id);
    };

    // If the user has reacted more than once, removes the reaction.
    var counter = 0;
    loop:
        for(i = 0; i < reactionInfo.length; i++){

            // Loops through each user.
            for(j = 0; j < reactionInfo[i].users.cache.array().length; j++){

                // If the user has reacted, adds 1 to the counter.
                if(reactionInfo[i].users.cache.array()[j].id == user.id){
                    counter++;

                    // If the user has reacted twice, removes the most recent reaction.
                    if(counter == 2){
                        reaction.users.remove(user.id);
                        break loop;
                    };
                };
            };
        };
});

bot.login(process.env.TOKEN);