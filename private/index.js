// 引入自定義套件
// const verifyAdmin = require('../verify_admin')

// 引入第三方套件
const request = require('request')
const cheerio = require('cheerio')

const thu_bus_base_url = "http://bus.service.thu.edu.tw"
module.exports = {
    runPrivate(bot, msg, received_data) {

    },
    queryThuBus(bot, msg) {
        request({
            url: thu_bus_base_url,
            method: "GET"
        }, (error, response, body) => {
            if (error || !body) {
                return
            }

            const $ = cheerio.load(body); // 載入 body
            const panelHeading = $(".panel-heading").children();
            const panelBody = $(".panel-body").children()

            let up_route = {
                title: "",
                sopts: [],
                url: "https://busservice.cc.paas.ithu.tw/timetable/2/zh_TW"
            }, down_route = {
                title: "",
                sopts: [],
                url: "https://busservice.cc.paas.ithu.tw/timetable/1/zh_TW"
            }
            // 上行
            up_route.title = panelHeading[0].prev.data + panelHeading[0].next.data

            for (var i = 1; i < panelBody[0].children.length - 1; i++) {
                up_route.sopts.push(panelBody[0].children[i].children[0].data);
            }

            //下行
            down_route.title = panelHeading[1].prev.data + panelHeading[1].next.data
            for (var i = 1; i < panelBody[2].children.length - 1; i++) {
                down_route.sopts.push(panelBody[2].children[i].children[0].data);
            }

            // 文字加點標情符號
            up_route.title = up_route.title.replace("往", "👉")
            down_route.title = down_route.title.replace("往", "👉")

            // 製作button
            var options = {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "上行時刻表🕒", callback_data: up_route.url }],
                        [{ text: "下行時刻表🕘", callback_data: down_route.url }],
                        [{ text: "關閉❌", callback_data: "close" }]
                    ]
                }
            };


            let no = ["0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"]

            let bus_send_text = `《東海大學校內公車路線》\n\n${up_route.title}\n\n上行路線🚌\n`
            up_route.sopts.forEach((element, index) => {
                bus_send_text += `${no[index + 1]} ${element}\n`
            });
            bus_send_text += `\n🔸🔸🔸🔸🔸🔸🔸🔸\n\n${down_route.title}\n\n下行路線🚌\n`
            down_route.sopts.forEach((element, index) => {
                bus_send_text += `${no[index + 1]} ${element}\n`
            });

            // 發送公車路線及Button
            bot.sendMessage(msg.chat.id, bus_send_text, options);
        })
    },
    getBusSchedule(bot, msg, time_table_url, up_or_down) {

        request({
            url: thu_bus_base_url + time_table_url,
            method: "GET"
        }, (error, response, body) => {
            if (error || !body) {
                return
            }

            const $ = cheerio.load(body); // 載入 body
            const panelTitle = $(".table-striped tr");
            let bus_schedule = [`${up_or_down}\n#編號\t發車時間\t\t\t#編號\t發車時間`]
            for (let i = 1; i < panelTitle.length; i++) { // 走訪 tr
                const table_td = panelTitle.eq(i).find('td'); // 擷取每個欄位(td)
                let no1 = table_td.eq(0).text();
                let time1 = table_td.eq(1).text();
                let no2 = table_td.eq(2).text();
                let time2 = table_td.eq(3).text();

                if (parseInt(no1) < 10) { no1 = "0" + no1 }
                bus_schedule.push(`(${no1})\t\t\t\t\t${time1}\t\t\t\t\t\t\t\t\t(${no2})\t\t\t\t\t${time2}`)
            }

            let send_text = ""
            bus_schedule.forEach(value => {
                send_text += `${value}\n`
            })

            var options = {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "關閉❌", callback_data: "close" }]
                    ]
                }
            };
            bot.sendMessage(msg.from.id, send_text, options);
        })
    },
    NowEventsShow(bot, msg,sub_url,mode) {
        let baseurl = "https://tevent.thu.edu.tw/tEvent_front/"
        request({
            url: baseurl+sub_url,
            method: "GET"
        }, (error, response, body) => {
            if (error || !body) {
                return
            }
            const $ = cheerio.load(body); // 載入 body
            const breadcrumb = $(".breadcrumb li");

            // 現在進行的活動
            let going_event = {
                title: "",
                href: ""
            }
            going_event.href = breadcrumb[1].children[0].attribs.href
            going_event.title = breadcrumb[1].children[0].children[0].data

            this.showEventListComponents(bot, msg, baseurl, going_event.href, going_event.title,mode)

        })
    },
    showCategoryComponents(url) {
        request({
            url: url,
            method: "GET"
        }, (error, response, body) => {
            if (error || !body) {
                return
            }
            const $ = cheerio.load(body); // 載入 body
            categoryComponents = $(".nav--filter li a");
            let event_categories = []
            for (let index = 2; index < 7; index++) {
                event_categories.push({
                    title: categoryComponents[index].children[0].data,
                    url: categoryComponents[index].attribs.href
                })
            }
            // console.log(event_categories)
        })
    },
    showEventListComponents(bot, msg, baseurl, suburl, listTitle,mode) {
        request({
            url: baseurl + suburl,
            method: "GET"
        }, (error, response, body) => {
            if (error || !body) {
                return
            }
            const $ = cheerio.load(body); // 載入 body
            const eventListComponents = $(".event-list .row .col-sm-12")
            const eventListComponentsTitle = $(".event-list .row .col-sm-12 h3 a")
            const eventListComponentsDate = $(".event-list .row .col-sm-12 h5")
            const eventListComponentsContent = $(".event-list .row .col-sm-12 p abbr")

            let eventsList = []
            let event = {
                title: "",
                date: "",
                url: "",
                main_point: "",
                content: ""
            }

            for (let index = 0; index < eventListComponents.length; index++) {

                event.url = baseurl + eventListComponentsTitle[index].attribs.href

                event.title = eventListComponentsTitle[index].children[0].data

                event.date = eventListComponentsDate[index].children[0].data

                event.content = eventListComponentsContent[index].attribs.title

                event.main_point = event.content.substr(0, 49) + '......'

                eventsList.push(event)
                event = {}
            }

            let goingEventListStr = `《${listTitle}》 此頁共${eventsList.length}筆\n\n`
            eventsList.forEach((value, index) => {
                goingEventListStr += `🔹${value.title}\n📅${value.date}\n✏️${value.main_point}\n🔗 查閱詳細內容：${value.url}\n\n`
            })

            let pagesComponents = $(".pagination li a")
            let pagesList = []
            this.showPagesComponents(pagesComponents).forEach(value => {
                pagesList.push({
                    text:`第${value.index}頁`, callback_data: value.url
                })
            })

            var options = {
                reply_markup: {
                    inline_keyboard: [pagesList]
                }
            };

            if(mode == "new"){
                bot.sendMessage(msg.chat.id, goingEventListStr, options);
            }else if(mode == "update"){
                // bot.editMessageText(msg.message.chat.id,)
            }
        })
    },
    showPagesComponents(data) {
        let pages = []
        for (let index = 0; index < data.length - 1; index++) {
            pages.push({
                url: data[index].attribs.href,
                index: data[index].children[0].data
            })
        }
        return pages
    }
}