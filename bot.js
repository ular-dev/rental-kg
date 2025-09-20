require('dotenv').config()
const TelegramBot = require('node-telegram-bot-api')

const token = process.env.BOT_TOKEN
const webAppUrl = process.env.WEBAPP_URL || 'http://localhost:5173'
const adminId = process.env.ADMIN_ID

if (!token) {
  console.error('Ошибка: BOT_TOKEN не найден в .env файле')
  process.exit(1)
}

const bot = new TelegramBot(token, { polling: true })

console.log('Бот запущен и готов к работе!')
console.log(`Mini App URL: ${webAppUrl}`)

// Команда /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id
  const firstName = msg.from.first_name || 'Пользователь'
  
  const welcomeMessage = `Привет, ${firstName}!

Найдите идеальную квартиру для аренды.

Что вас ждет:
• Удобные фильтры  
• Фотографии квартир  
• Прямая связь с владельцами  

4 бесплатных просмотра номеров телефонов  
Платные подписки для безлимитного доступа  

Нажмите кнопку ниже, чтобы начать поиск!`

  const options = {
    reply_markup: {
      inline_keyboard: [[
        {
          text: 'Найти квартиру',
          web_app: { url: webAppUrl }
        }
      ]]
    }
  }

  bot.sendMessage(chatId, welcomeMessage, options)
})

// Команда /help
bot.onText(/\/help/, (msg) => {
  const chatId = msg.chat.id
  
  const helpMessage = `Помощь по использованию бота:

Поиск квартир:
• Выберите город (Бишкек/Ош)
• Укажите район
• Выберите количество комнат
• Просматривайте результаты

Система просмотров:
• 4 бесплатных просмотра номеров
• После исчерпания - оформите подписку

Тарифы:
• 1 день - 200 сом
• 3 дня - 400 сом  
• 5 дней - 500 сом`

  bot.sendMessage(chatId, helpMessage)
})

// Команда /app для быстрого доступа
bot.onText(/\/app/, (msg) => {
  const chatId = msg.chat.id
  
  const options = {
    reply_markup: {
      inline_keyboard: [[
        {
          text: 'Открыть приложение',
          web_app: { url: webAppUrl }
        }
      ]]
    }
  }

  bot.sendMessage(chatId, 'Откройте приложение для поиска квартир:', options)
})

// Получение ID пользователя
bot.onText(/\/id/, (msg) => {
  const chatId = msg.chat.id
  const userId = msg.from.id
  
  bot.sendMessage(chatId, `Ваш Telegram ID: ${userId}`)
})

// Обработка сообщений с чеками об оплате
bot.on('message', (msg) => {
  // Пропускаем команды
  if (msg.text && msg.text.startsWith('/')) {
    return
  }
  
  // Обрабатываем фото или сообщения с словом "чек"
  if (msg.photo || (msg.text && msg.text.toLowerCase().includes('чек'))) {
    const chatId = msg.chat.id
    const userId = msg.from.id
    const username = msg.from.username || 'Без username'
    
    // Уведомляем пользователя
    const userReply = `Ваш чек получен!

Ваш Telegram ID: ${userId}

Администратор проверит оплату и активирует подписку в течение 5-10 минут.
После активации вы сможете просматривать номера телефонов без ограничений.`

    bot.sendMessage(chatId, userReply)
    
    // Отправляем уведомление админу
    if (adminId) {
      const adminMessage = `Поступил чек об оплате:
      
Пользователь: @${username}
Telegram ID: ${userId}  
Chat ID: ${chatId}

Проверьте оплату и активируйте подписку через админ панель в приложении.`

      bot.sendMessage(adminId, adminMessage)
      
      // Если есть фото, пересылаем админу
      if (msg.photo) {
        bot.forwardMessage(adminId, chatId, msg.message_id)
      }
    }
  }
})

// Команда для админа - статистика
bot.onText(/\/stats/, (msg) => {
  const userId = msg.from.id.toString()
  
  if (adminId && userId === adminId) {
    // Здесь можно добавить статистику из Firebase
    bot.sendMessage(msg.chat.id, 'Статистика бота:\n\nДля получения подробной статистики используйте админ панель в приложении.')
  }
})

// Обработка ошибок
bot.on('error', (error) => {
  console.error('Ошибка бота:', error)
})

bot.on('polling_error', (error) => {
  console.error('Ошибка polling:', error)
})

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Остановка бота...')
  bot.stopPolling()
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('Остановка бота...')
  bot.stopPolling()
  process.exit(0)
})