routerAdd(
  'POST',
  '/backend/v1/comunicacao/enviar-email',
  (e) => {
    const body = e.requestInfo().body || {}
    const to = body.to
    const toName = body.toName || ''
    const subject = body.subject
    const html = body.html
    if (!to || !subject || !html) return e.badRequestError('to, subject e html sao obrigatorios')

    try {
      var client = $app.newMailClient()
      client.send({
        from: { name: 'Lazuli ATS', address: 'noreply@lazuliats.com' },
        to: [{ name: toName, address: to }],
        subject: subject,
        html: html,
      })
      $app.logger().info('manual email sent', 'to', to, 'subject', subject)
      return e.json(200, { success: true })
    } catch (err) {
      $app.logger().error('manual email failed', 'error', String(err), 'to', to)
      return e.json(500, { error: 'Falha ao enviar e-mail' })
    }
  },
  $apis.requireAuth(),
)
