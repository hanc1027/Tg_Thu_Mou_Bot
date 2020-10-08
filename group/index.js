const Deploy_Group_ID = process.env.Group_ID 

module.exports = {
    runGroup(bot, msg, received_data) {
        // 迎歡訊息
        if (msg.new_chat_member) {
            msg.new_chat_member.first_name ? msg.new_chat_member.first_name : ""
            msg.new_chat_member.last_name ? msg.new_chat_member.last_name : ""

            bot.sendMessage(Deploy_Group_ID, `哈囉~${msg.new_chat_member.first_name} ${msg.new_chat_member.last_name}\n歡迎來到《東海大學哞🐮》~\n\n這是一個容納東海大學學生及周邊地區朋友、自由聊天的群組😉\n\n⚠️ 禁止事項: 洗版 / 廣告 / 色情 / 辱罵 / 轉發他人電話及住址 / 發報賣淫資訊 / 性藥。犯規者即踢走。\n\n請勿隨意調戲群內裡🤖 BOT 指令! 誤觸請自行刪除\n\n🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸🔸\n\n進群可以先自我介紹，讓大家認識你~\n可參考格式» » »\n綽號：\n(現讀/畢)\n科系：\n興趣：\n最喜歡TG哪一點：\n從哪得知此群：\n.....(可自行添加)`)

            setTimeout(() => {
                // 5分鐘後，自動刪除歡迎訊息
                bot.deleteMessage(msg.chat.id, msg.message_id + 1)
            }, 300000)
        }
    }
}
