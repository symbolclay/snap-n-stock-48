-- Atualizar slugs das campanhas para usar formato: cliente-slug + campanha-slug
UPDATE campaigns 
SET slug = CONCAT(
  (SELECT slug FROM clients WHERE clients.id = campaigns.client_id),
  '-',
  LOWER(
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(
            REPLACE(
              REPLACE(
                REPLACE(
                  REPLACE(
                    REPLACE(
                      REPLACE(campaigns.name, 'ã', 'a'),
                      'á', 'a'
                    ),
                    'à', 'a'
                  ),
                  'â', 'a'
                ),
                'é', 'e'
              ),
              'ê', 'e'
            ),
            'í', 'i'
          ),
          'ó', 'o'
        ),
        'ô', 'o'
      ),
      'ú', 'u'
    )
  )
)
WHERE slug = 'principal';