/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    $ai.agents.putTools(app, 'triagem-ia', [
      { collection: 'cuidadores', perms: { read: true, list: true } },
    ])
  },
  (app) => {
    $ai.agents.deleteTools(app, 'triagem-ia', ['cuidadores'])
  },
)
