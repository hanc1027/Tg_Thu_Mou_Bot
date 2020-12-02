// 引入自定義套件
const groupManager = require('./group/index')
const privateManager = require('./private/index')

// 引入外部套件
const TelegramBot = require('node-telegram-bot-api');
const other = require('./other_functions/other');

const token = process.env.THU_MOU_TGBOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

const Deploy_Group_ID = process.env.THU_MOU_TGBOT_Group_ID 

//使用Long Polling的方式與Telegram伺服器建立連線

console.log('bot server started...');

const current_function = "1) /ping - 針測機器人是否活著\n2) /thu_bus - 校內公車查詢\n3) /report - 問題回報\n4) /major_query - 學系必修科目表查詢\n5) /course_query - 開課明細查詢\n6) /course_remain - 課程選修人數查詢\n7) /phonebook - 東海聯絡簿\n8) 每日早上自動爬東海大學網站相關新聞"
// /event_query - 東海大學活動資訊查閱

function notGroupCmd_NeedToDelete(bot, msg) {
    bot.sendMessage(msg.chat.id, "此為私訊指令，請單獨對機器人使用。")
    autoDeleteCmdMsg(bot, msg)
}

function autoDeleteCmdMsg(bot, msg) {
    setTimeout(() => { bot.deleteMessage(msg.chat.id, msg.message_id) }, 3000)
    setTimeout(() => {
        bot.deleteMessage(msg.chat.id, msg.message_id + 1)
    }, 5000)
}

// Commands

//收到Start`訊息時會觸發這段程式
bot.onText(/\/start/, (msg) => {
    if (msg.chat.type == "private") {
        let welcome_str = `哈囉! ${msg.from.first_name}，我是東海大學哞機器人😈\n非官方的機器人，但也會提供很多功能給大家哦~\n功能如下：\n${current_function}`;
        bot.sendMessage(msg.chat.id, welcome_str)

        if (!msg.from.username) {
            bot.sendMessage(msg.chat.id, "你還沒設定【使用者名稱】，就是ID啦~趕快去設定一下吧!")
        }
    } else if (msg.chat.type == "supergroup" || msg.chat.type == "group") {
        notGroupCmd_NeedToDelete(bot, msg)
    }
});


bot.onText(/\/ping/, (msg) => {
    bot.sendMessage(msg.chat.id, "我還醒著~😗\n有好吃的要記得給偶吃噢🤩");
    autoDeleteCmdMsg(bot, msg)
});

bot.onText(/\/help/, (msg) => {
    bot.sendMessage(msg.chat.id, `你好~~\n我目前提供的功能如下：\n\n${current_function}`)
});

bot.onText(/\/thu_bus/, (msg) => {
    if (msg.chat.type == "private") {
        bot.sendMessage(msg.chat.id, "校內公車查詢，請稍等...")
        privateManager.queryThuBus(bot, msg)
    } else if (msg.chat.type == "supergroup" || msg.chat.type == "group") {
        notGroupCmd_NeedToDelete(bot, msg)
    }
})

bot.onText(/\/event_query/, (msg) => {
    bot.sendMessage(msg.chat.id, "開發中…")
    // bot.sendMessage(msg.chat.id, "查詢活動中…")
    // privateManager.NowEventsShow(bot, msg, "index.php?&page=1","new")
})

bot.onText(/\/report/, (msg) => {
    if (msg.chat.type == "private") {
        bot.sendMessage(msg.chat.id, "您好!對於此機器人有任何問題，皆可填表回報哦~\n請點選網址：https://forms.gle/pcEKbgsw5Rzb82Yz8")
        bot.sendMessage("495732162", "有人點選問題回報囉!趕快查看一下：https://docs.google.com/spreadsheets/d/1LDfrglYXx9IfFKmvhlUq5m3id8bWF7yAGyTDW91bu-Y/edit")
    } else if (msg.chat.type == "supergroup" || msg.chat.type == "group") {
        notGroupCmd_NeedToDelete(bot, msg)
    }
});


// 接到訊息
bot.on('message', (msg) => {
    // bot.sendMessage('495732162', JSON.stringify(msg))
    var received_data = {
        id: msg.from.id,
        username: msg.from.username ? "@" + msg.from.username : "未設定",
        name: msg.from.first_name ? msg.from.first_name : "" + " " + msg.from.last_name ? msg.from.last_name : "",
        type: msg.chat.type,
        messageid: msg.message_id,
        message: msg.text ? msg.text : "",
        sticker: msg.sticker ? msg.sticker : "",
        photo: msg.photo ? msg.photo : "",
        gif: msg.animation ? msg.animation : ""
    }

    // bot.sendMessage(msg.chat.id, `您剛剛說了:${msg.text}`)

    //群組對話
    if (msg.chat.type == "supergroup" || msg.chat.type == "group") {
        //自定義函式
        if (msg.chat.id.toString() == Deploy_Group_ID) {
            groupManager.runGroup(bot, msg, received_data)
        } else {
            bot.sendMessage(msg.chat.id, "群組方面，目前只接收《東海大學哞🐮》(https://t.me/THU_mou)的訊息，歡迎加入哦!")
        }
    } // 私人對話
    else if (msg.chat.type == "private") {

        //自定義函式
        // privateManager.runPrivate(bot, msg, received_data)
    }
})

// 檢查bug
bot.on("polling_error", (err) => console.log(err));


// 判斷公車時刻表查詢
bot.on("callback_query", (msg) => {
    switch (msg.data) {
        case ("/timetable/3/zh_TW"):
            privateManager.getBusSchedule(bot, msg, msg.data, "《上行時刻表》")
            break;
        case ("/timetable/4/zh_TW"):
            privateManager.getBusSchedule(bot, msg, msg.data, "《下行時刻表》")
            break;
        case "close":
            bot.deleteMessage(msg.message.chat.id, msg.message.message_id)
            break;
        case ("index.php?&page=1" || "index.php?&page=2" || "index.php?&page=3" || "index.php?&page=4" || "index.php?&page=5"):
            // 目前這個還沒發佈，但好像不能使用||這個方式
            bot.sendMessage(msg.message.chat.id, JSON.stringify(msg))
            privateManager.NowEventsShow(bot, msg, msg.data, "update")
            break;

    }
});

// 定時爬學校新聞
// setInterval(() => { other.routineSendNews(bot) }, 1000);

// HanC手動爬新聞
bot.onText(/\/get_news/, (msg) => {
    if (msg.from.id == "495732162") {
        other.getThuNews(bot)
    }
})

bot.onText(/\/major_query/, (msg) => {
    var options = {
        reply_markup: {
            inline_keyboard: [
                [{ text: "請點我~~", url: "http://fsis.thu.edu.tw/wwwstud/info/MustList.php" }],
            ]
        }
    };
    if (msg.chat.type == "private") {
        bot.sendMessage(msg.chat.id, "📘學系必修科目表查詢", options)
    } else if (msg.chat.type == "supergroup" || msg.chat.type == "group") {
        notGroupCmd_NeedToDelete(bot, msg)
    }
});

bot.onText(/\/course_query/, (msg) => {
    var options = {
        reply_markup: {
            inline_keyboard: [
                [{ text: "請點我~~", url: "http://fsis.thu.edu.tw/wwwstud/frontend/CourseList.php" }],
            ]
        }
    };
    if (msg.chat.type == "private") {
        bot.sendMessage(msg.chat.id, "📚開課明細查詢", options)
    } else if (msg.chat.type == "supergroup" || msg.chat.type == "group") {
        notGroupCmd_NeedToDelete(bot, msg)
    }
});

bot.onText(/\/course_remain/, (msg) => {
    var options = {
        reply_markup: {
            inline_keyboard: [
                [{ text: "請點我~~", url: "http://fsis.thu.edu.tw/wwwstud/frontend/MyRemain.php" }],
            ]
        }
    };
    if (msg.chat.type == "private") {
        bot.sendMessage(msg.chat.id, "🙋‍♂️課程選修人數查詢", options)
    } else if (msg.chat.type == "supergroup" || msg.chat.type == "group") {
        notGroupCmd_NeedToDelete(bot, msg)
    }
});

bot.onText(/\/phonebook/, (msg) => {
    var options = {
        reply_markup: {
            inline_keyboard: [
                [{ text: "請點我~~", url: "https://phonebook.thu.edu.tw" }],
            ]
        }
    };
    if (msg.chat.type == "private") {
        bot.sendMessage(msg.chat.id, "📒phonebook", options)
    } else if (msg.chat.type == "supergroup" || msg.chat.type == "group") {
        notGroupCmd_NeedToDelete(bot, msg)
    }
});
