// 引入第三方套件
const request = require('request')
const cheerio = require('cheerio')

const groupID = process.env.Group_ID

let newsWebList = [
    {title: "東大新聞",url: "https://www.thu.edu.tw/web/news/news.php?cid=8"},
    { title: "榮譽榜", url: "https://www.thu.edu.tw/web/news/news.php?cid=9" },
    { title: "新聞影片", url: "https://www.thu.edu.tw/web/news/news.php?cid=18" },
        // {title:"東海人季刊",url:"http://cdc.thu.edu.tw/quarterly/web//news.php",
    ]    

module.exports = {
    routineSendNews(bot) {
        var hours = new Date().getHours();
        var minute = new Date().getMinutes();
        var seconds = new Date().getSeconds();
        if (hours == 2 && minute == 0 && seconds == 0) {
            // 每天早上十點(存在heroku上，會有8小時的時差。)會去抓學校的新聞
            this.getThuNews(bot)
        }
    },
    getThuNews(bot) {
        let isSendTodayNewsTitle = false
        let haveNews = false
        bot.sendMessage(groupID,"爬取東海新聞中…")
        newsWebList.forEach((value, index) => {
            request({
                url: value.url,
                method: "GET"
            }, (error, response, body) => {
                if (error || !body) {
                    return
                }

                const $ = cheerio.load(body); // 載入 body
                const newTitle = $(".row .clients-page .col-md-7 span")
                const newsDate = $(".row .clients-page .col-md-7 ul li .fa-calendar")
                const newsUnit = $(".row .clients-page .col-md-7 ul li .fa-briefcase")
                const newsMainPoint = $(".row .clients-page .col-md-7 ul")
                const newsUrl = $(".row .clients-page")

                for (let i = 0; i < 2; i++) {
                    let aNew = {
                        title: "",
                        date: "",
                        unit: "",
                        main_point: "",
                        url: ""
                    }

                    if (this.isTodayNews(newsDate[i].next.data)) {
                        let date = newsDate[i].next.data.split("\t")
                        aNew.date = date[6]

                        let main_point = newsMainPoint[i].next.data.split(" ")
                        let main_point2 = newsMainPoint[i].next.data.split("\n")
                        if (value.title == "新聞影片") aNew.main_point = main_point2[1]
                        else aNew.main_point = main_point[3]

                        aNew.unit = newsUnit[i].next.data
                        aNew.title = newTitle[i].children[0].data
                        aNew.url = newsUrl[i].parent.attribs.href

                        haveNews = true
                        if (!isSendTodayNewsTitle) {
                            bot.sendMessage(groupID, "《今日東海新聞》")
                            isSendTodayNewsTitle = true
                        }
                        var options = {
                            reply_markup: {
                                inline_keyboard: [
                                    [{ text: "點選查閱更多", url: aNew.url }],
                                ]
                            }
                        };
                        let newsStr = `📰${aNew.title}\n📆${aNew.date}\n💼${aNew.unit}✏️${aNew.main_point}`
                        bot.sendMessage(groupID, newsStr, options)
                    }
                }
            })
        })
        if (!haveNews) {bot.sendMessage(groupID, "今日沒有東海新聞")}
    },
    isTodayNews(newDate) {
        // 確認爬到的是今天的新聞，就不再爬了
        let date = newDate.split(" ")
        let today = new Date()
        let today_year = today.getFullYear(), today_month = today.getMonth() + 1, today_date = today.getDate()
        if (today_month < 10) today_month = `0${today_month}`
        return date[3] == `${today_year}-${today_month}-${today_date}`
    }
}
