import { bot } from '../src/lib/telegram/bot-service'
import { TOPIC_RULES } from '../src/lib/telegram/topics-config'

async function main() {
  console.log('----------------------------------------------------')
  console.log('🤖 GREEN PROCESSING TELEGRAM BOT ISHGA TUSHMOQDA...')
  console.log('----------------------------------------------------')

  const botInfo = await bot.telegram.getMe()
  console.log(`✅ Bot topildi: @${botInfo.username} (${botInfo.first_name})`)
  console.log(`🆔 Bot ID: ${botInfo.id}`)
  console.log('\n📋 SOZLANGAN TOPIKLAR VA XAVFSIZLIK QOIDALARI:')

  Object.values(TOPIC_RULES).forEach((topic) => {
    const lockStatus = topic.requireLogin
      ? `🔒 Himoyalangan (Rollar: ${topic.allowedRoles.join(', ')})`
      : '🔓 Ochiq (Login shart emas)'
    console.log(`  • [${topic.key.toUpperCase()}] ${topic.name}: threadId=${topic.threadId} | ${lockStatus}`)
  })

  console.log('\n🚀 Bot faol rejimda ishlayapti... (To\'xtatish uchun: Ctrl+C)')
  await bot.launch()
}

main().catch((err) => {
  console.error('❌ Botni ishga tushirishda xatolik:', err)
  process.exit(1)
})

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
