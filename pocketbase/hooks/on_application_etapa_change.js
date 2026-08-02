onRecordAfterUpdateSuccess((e) => {
  var oldEtapa = e.record.original().getString('etapa')
  var newEtapa = e.record.getString('etapa')

  if (oldEtapa === newEtapa) {
    return e.next()
  }

  var candidataId = e.record.getString('candidata')
  if (!candidataId) {
    return e.next()
  }

  var candidata
  try {
    candidata = $app.findRecordById('candidatas', candidataId)
  } catch (err) {
    $app
      .logger()
      .error(
        'candidata not found for application',
        'applicationId',
        e.record.id,
        'candidataId',
        candidataId,
      )
    return e.next()
  }

  var email = candidata.getString('email')
  var nome = candidata.getString('nome')

  if (!email) {
    $app.logger().warn('candidata has no email, skipping notification', 'candidataId', candidataId)
    return e.next()
  }

  var etapaMessages = {
    Triagem: {
      subject: 'CuidarATS - Sua candidatura esta em triagem',
      html:
        '<h2>Ola, ' +
        nome +
        '!</h2><p>Sua candidatura foi atualizada para a etapa de <strong>Triagem</strong>.</p><p>Em breve entraremos em contato com mais informacoes.</p><p>Atenciosamente,<br>Equipe CuidarATS</p>',
    },
    Entrevista: {
      subject: 'CuidarATS - Voce foi convocada para entrevista!',
      html:
        '<h2>Ola, ' +
        nome +
        '!</h2><p>Parabens! Sua candidatura avancou para a etapa de <strong>Entrevista</strong>.</p><p>Entraremos em contato para agendar a sua entrevista.</p><p>Atenciosamente,<br>Equipe CuidarATS</p>',
    },
    Aprovada: {
      subject: 'CuidarATS - Parabens, voce foi aprovada!',
      html:
        '<h2>Ola, ' +
        nome +
        '!</h2><p>Temos o prazer de informar que voce foi <strong>aprovada</strong>!</p><p>Em breve entraremos em contato com os proximos passos do processo de admissao.</p><p>Atenciosamente,<br>Equipe CuidarATS</p>',
    },
    Rejeitada: {
      subject: 'CuidarATS - Atualizacao sobre sua candidatura',
      html:
        '<h2>Ola, ' +
        nome +
        '.</h2><p>Agradecemos o seu interesse em participar do nosso processo seletivo.</p><p>Infelizmente, desta vez nao foi possivel dar continuidade a sua candidatura. Agradecemos o seu tempo e desejamos sucesso em suas futuras oportunidades.</p><p>Atenciosamente,<br>Equipe CuidarATS</p>',
    },
  }

  var template = etapaMessages[newEtapa]
  if (!template) {
    return e.next()
  }

  try {
    var client = $app.newMailClient()
    client.send({
      from: { name: 'CuidarATS', address: 'noreply@cuidarats.com' },
      to: [{ name: nome, address: email }],
      subject: template.subject,
      html: template.html,
    })
    $app
      .logger()
      .info('stage-change email sent', 'to', email, 'etapa', newEtapa, 'applicationId', e.record.id)
  } catch (err) {
    $app.logger().error('failed to send stage-change email', 'error', String(err), 'to', email)
  }

  return e.next()
}, 'applications')
