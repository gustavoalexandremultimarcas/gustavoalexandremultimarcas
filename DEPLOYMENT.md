# Guia de Implantação

Este documento contém todos os passos necessários para implantar a aplicação do zero em um ambiente de produção e a lista de valores que devem ser atualizados.

---

## 1. Variáveis de Ambiente (.env.local)

A aplicação utiliza variáveis de ambiente para todas as configurações de contato, links e integrações. Configure as seguintes chaves:

### Infraestrutura (Supabase & Auth)
| Variável | Descrição | Exemplo |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase | `https://SUA_ID.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave Anon do Supabase | `CHAVE_ANON` |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave Service Role (Privada) | `CHAVE_SERVICE_ROLE` |
| `SUPABASE_HOSTNAME` | Hostname para o Next Images | `SUA_ID.supabase.co` |
| `NEXTAUTH_URL` | URL base da aplicação | `https://seu-dominio.com` |
| `NEXTAUTH_SECRET` | Segredo para JWT | `CHAVE_ALEATORIA` |

### Dados da Loja (Aparecem em todo o site)
| Variável | Descrição |
| :--- | :--- |
| `NEXT_PUBLIC_STORE_NAME` | Nome oficial da loja |
| `NEXT_PUBLIC_STORE_PHONE` | Telefone de contato formatado |
| `NEXT_PUBLIC_STORE_EMAIL` | Email de contato |
| `NEXT_PUBLIC_STORE_ADDRESS` | Logradouro e número |
| `NEXT_PUBLIC_STORE_CITY_STATE`| Bairro, Cidade e UF |

### Links e Redes Sociais
| Variável | Descrição | Exemplo |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_WHATSAPP_LINK` | Link direto para WhatsApp | `wa.me/NUMERO` |
| `NEXT_PUBLIC_INSTAGRAM_LINK` | Link do Instagram | `instagram.com/PERFIL` |
| `NEXT_PUBLIC_FACEBOOK_LINK` | Link do Facebook | `facebook.com/PERFIL` |
| `NEXT_PUBLIC_MAPS_LINK` | Link do Google Maps (Botão) | `URL_GOOGLE_MAPS` |
| `NEXT_PUBLIC_MAPS_EMBED` | URL de Embed do Maps (Iframe) | `URL_EMBED_MAPS` |

### Integrações e Webhooks
| Variável | Descrição |
| :--- | :--- |
| `NEXT_PUBLIC_WEBHOOK_URL` | URL de destino dos formulários (Webhook) |
| `WEBHOOK_AUTH` | Token de autorização para o Webhook |

---

## 2. Automação e Envio de Formulários

> [!IMPORTANT]
> **Atenção**: Esta aplicação foi desenvolvida para enviar dados de formulários (Interesse, Simulação, Consignação e Contato) para um endpoint externo (Webhook).

Originalmente, o projeto utilizava o **n8n** para processar esses dados e realizar disparos via APIs de terceiros (como WhatsApp). **Essas automações, fluxos e conexões com APIs externas NÃO fazem parte deste repositório de frontend.**

**O que você precisa fazer:**
1. **Definir um Endpoint**: Você deve configurar seu próprio serviço de automação (n8n, Make, Zapier ou servidor próprio) para receber os dados.
2. **Configuração**: Informe a URL do seu webhook na variável `NEXT_PUBLIC_WEBHOOK_URL`.
3. **Carga Útil (Payload)**: A aplicação envia um objeto JSON via método `POST`. Certifique-se de que seu destino está pronto para receber e processar esses campos.
4. **Segurança**: Utilize a variável `WEBHOOK_AUTH` para validar as requisições no seu servidor de destino.

---

## 3. Banco de Dados (Supabase)

### Estrutura de Dados
Toda a estrutura de tabelas, índices e triggers deve ser criada executando o SQL localizado em `sqls/schema.sql`.

### Segurança obrigatória
- O schema versionado agora habilita `RLS` nas tabelas `vehicles`, `vehicle_images`, `vehicle_features` e `admin_users`.
- O acesso público deve acontecer pelo catálogo público versionado em `public.public_vehicle_catalog` ou pela API Next em `app/api/public/vehicles/route.ts`.
- A tabela `admin_users` não deve receber grants para `anon` nem `authenticated`.
- Não utilize `NEXT_PUBLIC_SUPABASE_ANON_KEY` no frontend enquanto o consumo não estiver restrito a views/policies explicitamente públicas. O app atual usa apenas rotas servidoras com `SUPABASE_SERVICE_ROLE_KEY`.

### Storage e imagens
- O bucket `vehicles-media` foi padronizado para URLs públicas imutáveis com nomes aleatórios e `cacheControl` longo (`31536000`).
- Cada imagem enviada passa a receber metadados com variantes (`card`, `tile`, `detail`, `gallery`). O frontend público deve sempre preferir essas variantes em vez da URL original.
- Recomendação operacional: manter uploads entre `WEBP/JPG/PNG` com alvo de até `1600px` no maior lado e, sempre que possível, abaixo de `500 KB` por arquivo para reduzir egress.
- Se houver abuso de hotlink, a próxima etapa recomendada é migrar o bucket para privado e servir imagens com URL assinada via backend.

### Cache e consumo de banda
- A rota pública `GET /api/public/vehicles` envia `Cache-Control: public, s-maxage=300, stale-while-revalidate=86400`.
- Evite adicionar `cache: "no-store"` nos consumidores públicos sem necessidade. O padrão deve ser reaproveitar o cache da rota.
- Consultas de apoio global, como a checagem de veículos elétricos no header, devem usar cache curto no servidor para não bater no banco a cada montagem da UI.

### Criação de Administrador
Para criar o primeiro usuário administrativo, você deve inserir manualmente na tabela `admin_users` ou utilizar uma ferramenta de sua preferência para gerar o hash da senha (bcrypt) e inserir o registro.

---
